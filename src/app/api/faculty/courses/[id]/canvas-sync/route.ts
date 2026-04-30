import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions';
import {
  getCanvasConfig,
  getCourseStudents,
  createAssignment,
  updateSubmissionGrade,
} from '@/lib/canvas/client';

/**
 * POST /api/faculty/courses/[id]/canvas-sync
 *
 * Syncs quiz grades to Canvas LMS for a specific group.
 * Creates Canvas assignments (one per quiz) and pushes best scores.
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
    const userId = session.user.id;

    // Verify edit permissions
    const canEdit = await canEditCourseWithRetry(userId, courseId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate Canvas config
    const canvasConfig = getCanvasConfig();
    if (!canvasConfig) {
      return NextResponse.json(
        { error: 'Canvas API is not configured. Set CANVAS_BASE_URL and CANVAS_API_TOKEN environment variables.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const groupId = body.groupId as string | undefined;
    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId is required' },
        { status: 400 }
      );
    }

    // Load group and verify it has a canvas_course_id
    const group = await withDatabaseRetry(() =>
      prisma.course_groups.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          name: true,
          course_id: true,
          canvas_course_id: true,
          memberships: { select: { user_id: true } },
        },
      })
    );

    if (!group || group.course_id !== courseId) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (!group.canvas_course_id) {
      return NextResponse.json(
        { error: 'This group has no Canvas Course ID configured. Edit the group to set one.' },
        { status: 400 }
      );
    }

    const canvasCourseId = group.canvas_course_id;
    const groupMemberIds = group.memberships.map((m) => m.user_id);

    // -----------------------------------------------------------------------
    // 1. Load quizzes + best scores for group members
    // -----------------------------------------------------------------------
    const data = await withDatabaseRetry(async () => {
      const courseModules = await prisma.course_modules.findMany({
        where: { course_id: courseId },
        include: {
          modules: {
            select: {
              id: true,
              title: true,
              quizzes: {
                select: {
                  id: true,
                  title: true,
                  attempts: {
                    where: {
                      status: 'submitted',
                      user_id: { in: groupMemberIds },
                    },
                    include: {
                      user: {
                        select: { id: true, name: true, email: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { sort_order: 'asc' },
      });

      return courseModules;
    });

    // Build per-quiz best scores: quiz → { pointsPossible, bestByUser }
    type QuizSync = {
      quizId: string;
      quizTitle: string;
      moduleTitle: string;
      pointsPossible: number;
      bestByUser: Map<string, { points: number; email: string; name: string }>;
    };

    const quizzesToSync: QuizSync[] = [];
    for (const cm of data) {
      for (const quiz of cm.modules.quizzes) {
        if (quiz.attempts.length === 0) continue;

        let pointsPossible = 0;
        const bestByUser = new Map<
          string,
          { points: number; email: string; name: string }
        >();

        for (const a of quiz.attempts) {
          if (a.points_possible > pointsPossible) {
            pointsPossible = a.points_possible;
          }
          const prev = bestByUser.get(a.user_id);
          if (!prev || a.points_earned > prev.points) {
            bestByUser.set(a.user_id, {
              points: a.points_earned,
              email: a.user.email,
              name: a.user.name,
            });
          }
        }

        if (pointsPossible > 0) {
          quizzesToSync.push({
            quizId: quiz.id,
            quizTitle: quiz.title,
            moduleTitle: cm.modules.title,
            pointsPossible,
            bestByUser,
          });
        }
      }
    }

    if (quizzesToSync.length === 0) {
      return NextResponse.json({
        status: 'success',
        message: 'No quizzes with submitted attempts to sync.',
        quizzesSynced: 0,
        studentsSynced: 0,
        studentsSkipped: 0,
        unmatchedStudents: [],
        errors: [],
      });
    }

    // -----------------------------------------------------------------------
    // 2. Fetch Canvas students and build email → Canvas user ID map
    // -----------------------------------------------------------------------
    const canvasStudentsResult = await getCourseStudents(
      canvasConfig,
      canvasCourseId
    );

    if (!canvasStudentsResult.ok) {
      const canvasErr = canvasStudentsResult.error;
      return NextResponse.json(
        { error: `Failed to fetch Canvas students: ${canvasErr.message}` },
        { status: 502 }
      );
    }

    const canvasStudents = canvasStudentsResult.data;
    const emailToCanvasId = new Map<string, number>();
    for (const student of canvasStudents) {
      // Match by email or login_id (case-insensitive)
      const email = (student.email || student.login_id || '').toLowerCase();
      if (email) {
        emailToCanvasId.set(email, student.id);
      }
    }

    // -----------------------------------------------------------------------
    // 3. Load existing assignment mappings
    // -----------------------------------------------------------------------
    const existingMappings = await withDatabaseRetry(() =>
      prisma.canvas_assignment_mappings.findMany({
        where: {
          course_id: courseId,
          canvas_course_id: canvasCourseId,
          quiz_id: { in: quizzesToSync.map((q) => q.quizId) },
        },
      })
    );
    const mappingByQuizId = new Map(
      existingMappings.map((m) => [m.quiz_id, m])
    );

    // -----------------------------------------------------------------------
    // 4. Sync each quiz
    // -----------------------------------------------------------------------
    let quizzesSynced = 0;
    const syncedStudentEmails = new Set<string>();
    const unmatchedStudents = new Set<string>();
    const errors: string[] = [];

    for (const quiz of quizzesToSync) {
      // 4a. Get or create Canvas assignment
      let canvasAssignmentId: number;
      const existing = mappingByQuizId.get(quiz.quizId);

      if (existing) {
        canvasAssignmentId = existing.canvas_assignment_id;
      } else {
        const assignmentName = `${quiz.moduleTitle} — ${quiz.quizTitle}`;
        const createResult = await createAssignment(
          canvasConfig,
          canvasCourseId,
          { name: assignmentName, pointsPossible: quiz.pointsPossible }
        );

        if (!createResult.ok) {
          errors.push(
            `Failed to create assignment for "${quiz.quizTitle}": ${createResult.error.message}`
          );
          continue;
        }

        canvasAssignmentId = createResult.data.id;

        // Store the mapping
        await withDatabaseRetry(() =>
          prisma.canvas_assignment_mappings.create({
            data: {
              course_id: courseId,
              quiz_id: quiz.quizId,
              canvas_course_id: canvasCourseId,
              canvas_assignment_id: canvasAssignmentId,
              canvas_assignment_name: assignmentName,
            },
          })
        );
      }

      // 4b. Push grades for each student
      for (const [, best] of quiz.bestByUser) {
        const canvasUserId = emailToCanvasId.get(best.email.toLowerCase());
        if (!canvasUserId) {
          unmatchedStudents.add(best.email);
          continue;
        }

        const gradeResult = await updateSubmissionGrade(
          canvasConfig,
          canvasCourseId,
          canvasAssignmentId,
          canvasUserId,
          best.points
        );

        if (!gradeResult.ok) {
          errors.push(
            `Failed to push grade for ${best.email} on "${quiz.quizTitle}": ${gradeResult.error.message}`
          );
        } else {
          syncedStudentEmails.add(best.email);
        }
      }

      quizzesSynced++;
    }

    // -----------------------------------------------------------------------
    // 5. Log the sync
    // -----------------------------------------------------------------------
    const status =
      errors.length === 0
        ? 'success'
        : quizzesSynced > 0
          ? 'partial'
          : 'failed';

    await withDatabaseRetry(() =>
      prisma.canvas_sync_logs.create({
        data: {
          course_id: courseId,
          group_id: groupId,
          canvas_course_id: canvasCourseId,
          synced_by: userId,
          status,
          quizzes_synced: quizzesSynced,
          students_synced: syncedStudentEmails.size,
          students_skipped: unmatchedStudents.size,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          completed_at: new Date(),
        },
      })
    );

    return NextResponse.json({
      status,
      quizzesSynced,
      studentsSynced: syncedStudentEmails.size,
      studentsSkipped: unmatchedStudents.size,
      unmatchedStudents: Array.from(unmatchedStudents),
      errors,
    });
  } catch (error) {
    console.error('Canvas sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync grades to Canvas' },
      { status: 500 }
    );
  }
}
