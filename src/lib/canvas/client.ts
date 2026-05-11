/**
 * Canvas LMS REST API client for grade sync.
 *
 * Each faculty member stores their own encrypted Canvas API token.
 * All methods are server-side only (used in API routes).
 */

import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { decrypt } from './encryption';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface CanvasConfig {
  baseUrl: string; // e.g. "https://canvas.illinois.edu"
  token: string;
}

/**
 * Get Canvas config for a specific faculty member.
 * Reads their encrypted token from the database and decrypts it.
 * Returns null if CANVAS_BASE_URL is not set or the user has no token.
 */
export async function getCanvasConfigForUser(userId: string): Promise<CanvasConfig | null> {
  const baseUrl = process.env.CANVAS_BASE_URL;
  if (!baseUrl) return null;

  const user = await withDatabaseRetry(() =>
    prisma.users.findUnique({
      where: { id: userId },
      select: { canvas_api_token_encrypted: true },
    })
  );

  if (!user?.canvas_api_token_encrypted) return null;

  const token = decrypt(user.canvas_api_token_encrypted);
  if (!token) {
    console.warn(`Failed to decrypt Canvas token for user ${userId} — token may need to be re-entered.`);
    return null;
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ''), token };
}

/**
 * Validate a Canvas API token by calling GET /api/v1/users/self.
 * Used to verify a token before saving it.
 */
export async function validateCanvasToken(
  config: CanvasConfig
): Promise<CanvasResult<{ id: number; name: string }>> {
  const res = await canvasFetch(config, '/api/v1/users/self');
  return handleResponse<{ id: number; name: string }>(res);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanvasUser {
  id: number;
  name: string;
  email: string | null;
  login_id: string | null;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  points_possible: number;
  published: boolean;
}

export interface CanvasApiError {
  status: number;
  message: string;
}

export interface CanvasSuccess<T> {
  ok: true;
  data: T;
  error?: undefined;
}

export interface CanvasFailure {
  ok: false;
  data?: undefined;
  error: CanvasApiError;
}

export type CanvasResult<T> = CanvasSuccess<T> | CanvasFailure;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function canvasFetch(
  config: CanvasConfig,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${config.baseUrl}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

async function handleResponse<T>(res: Response): Promise<CanvasResult<T>> {
  if (!res.ok) {
    let message = `Canvas API ${res.status}`;
    try {
      const body = await res.json();
      message = body.errors?.[0]?.message || body.message || message;
    } catch {
      // non-JSON error body
    }
    return { ok: false, error: { status: res.status, message } };
  }
  const data = (await res.json()) as T;
  return { ok: true, data };
}

/**
 * Parse the Link header to find the "next" page URL.
 * Canvas returns: `<https://...?page=2&per_page=10>; rel="next", ...`
 */
function getNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const parts = linkHeader.split(',');
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/**
 * Fetch basic info about a Canvas course (name, code).
 * Used to verify a Canvas Course ID before linking or syncing.
 */
export async function getCanvasCourse(
  config: CanvasConfig,
  canvasCourseId: string
): Promise<CanvasResult<{ id: number; name: string; course_code: string }>> {
  const res = await canvasFetch(config, `/api/v1/courses/${canvasCourseId}`);
  return handleResponse<{ id: number; name: string; course_code: string }>(res);
}

/**
 * List all students enrolled in a Canvas course.
 * Handles pagination automatically via Link headers.
 */
export async function getCourseStudents(
  config: CanvasConfig,
  canvasCourseId: string
): Promise<CanvasResult<CanvasUser[]>> {
  const students: CanvasUser[] = [];
  let url: string | null =
    `/api/v1/courses/${canvasCourseId}/users?enrollment_type[]=student&per_page=100`;

  while (url) {
    // url may be absolute (from Link header) or relative (first call)
    const res = url.startsWith('http')
      ? await fetch(url, {
          headers: { Authorization: `Bearer ${config.token}` },
        })
      : await canvasFetch(config, url);

    if (!res.ok) {
      return handleResponse<CanvasUser[]>(res);
    }

    const page = (await res.json()) as CanvasUser[];
    students.push(...page);

    url = getNextPageUrl(res.headers.get('Link'));
  }

  return { ok: true, data: students };
}

/**
 * Create an assignment in a Canvas course.
 */
export async function createAssignment(
  config: CanvasConfig,
  canvasCourseId: string,
  opts: { name: string; pointsPossible: number }
): Promise<CanvasResult<CanvasAssignment>> {
  const res = await canvasFetch(
    config,
    `/api/v1/courses/${canvasCourseId}/assignments`,
    {
      method: 'POST',
      body: JSON.stringify({
        assignment: {
          name: opts.name,
          points_possible: opts.pointsPossible,
          submission_types: ['none'],
          published: true,
        },
      }),
    }
  );
  return handleResponse<CanvasAssignment>(res);
}

/**
 * Push a grade for a single student on a single assignment.
 * `grade` is raw points earned (e.g. 8 out of 10).
 */
export async function updateSubmissionGrade(
  config: CanvasConfig,
  canvasCourseId: string,
  assignmentId: number,
  canvasUserId: number,
  grade: number
): Promise<CanvasResult<{ grade: string }>> {
  const res = await canvasFetch(
    config,
    `/api/v1/courses/${canvasCourseId}/assignments/${assignmentId}/submissions/${canvasUserId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        submission: {
          posted_grade: grade.toString(),
        },
      }),
    }
  );
  return handleResponse<{ grade: string }>(res);
}
