import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions';

const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().nullable(),
  canvas_course_id: z.string().trim().max(100).optional().nullable(),
});

/**
 * GET /api/faculty/courses/[id]/groups
 * List all groups for a course, with member counts.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const hasAccess = await canEditCourseWithRetry(session.user.id, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view this course' },
        { status: 403 }
      );
    }

    const groups = await withDatabaseRetry(async () => {
      return prisma.course_groups.findMany({
        where: { course_id: courseId },
        orderBy: { created_at: 'asc' },
        include: {
          _count: { select: { memberships: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json({
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        canvasCourseId: g.canvas_course_id,
        memberCount: g._count.memberships,
        createdAt: g.created_at.toISOString(),
        updatedAt: g.updated_at.toISOString(),
        creator: g.creator,
      })),
    });
  } catch (error) {
    console.error('Error listing course groups:', error);
    return NextResponse.json(
      { error: 'Failed to list course groups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/faculty/courses/[id]/groups
 * Create a new group in a course.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const hasAccess = await canEditCourseWithRetry(session.user.id, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this course' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, canvas_course_id } = createGroupSchema.parse(body);

    // Check for duplicate name within this course (matches the unique constraint)
    const existing = await withDatabaseRetry(async () => {
      return prisma.course_groups.findFirst({
        where: { course_id: courseId, name },
        select: { id: true },
      });
    });
    if (existing) {
      return NextResponse.json(
        { error: `A group named "${name}" already exists in this course` },
        { status: 409 }
      );
    }

    const group = await withDatabaseRetry(async () => {
      return prisma.course_groups.create({
        data: {
          course_id: courseId,
          name,
          description: description || null,
          canvas_course_id: canvas_course_id || null,
          created_by: session.user.id,
        },
        include: {
          _count: { select: { memberships: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        canvasCourseId: group.canvas_course_id,
        memberCount: group._count.memberships,
        createdAt: group.created_at.toISOString(),
        updatedAt: group.updated_at.toISOString(),
        creator: group.creator,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating course group:', error);
    return NextResponse.json(
      { error: 'Failed to create course group' },
      { status: 500 }
    );
  }
}
