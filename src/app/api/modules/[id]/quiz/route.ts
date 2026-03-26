import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { createQuizSchema } from '@/lib/quiz/schemas';

/**
 * POST /api/modules/[id]/quiz
 * Create a quiz for a module with quiz_type (mastery_check or module_assessment).
 * Enforces @@unique([module_id, quiz_type]) constraint.
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

    const { id: moduleId } = await params;

    const canEdit = await canEditModuleWithRetry(session.user.id, moduleId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Enforce unique constraint: one quiz per (module_id, quiz_type)
    const existing = await withDatabaseRetry(async () => {
      return await prisma.quizzes.findUnique({
        where: {
          module_id_quiz_type: {
            module_id: moduleId,
            quiz_type: data.quiz_type,
          },
        },
      });
    });

    if (existing) {
      return NextResponse.json(
        { error: `Module already has a ${data.quiz_type} quiz` },
        { status: 409 }
      );
    }

    // For mastery_check: force specific settings
    const isMastery = data.quiz_type === 'mastery_check';

    const quiz = await withDatabaseRetry(async () => {
      return await prisma.quizzes.create({
        data: {
          module_id: moduleId,
          title: data.title,
          description: data.description ?? null,
          quiz_type: data.quiz_type,
          status: data.status,
          xp_reward: data.xp_reward,
          randomize_blocks: data.randomize_blocks,
          // Assessment-only settings
          time_limit_minutes: isMastery ? null : (data.time_limit_minutes ?? null),
          max_attempts: isMastery ? 0 : data.max_attempts,
          pass_threshold: isMastery ? data.mastery_threshold : data.pass_threshold,
          scoring_procedure: isMastery ? 'best' : data.scoring_procedure,
          scoring_drop_count: isMastery ? 0 : data.scoring_drop_count,
          feedback_timing: isMastery ? 'per_question' : data.feedback_timing,
          feedback_depth: isMastery ? 'full' : data.feedback_depth,
          // Mastery-only settings
          mastery_threshold: data.mastery_threshold,
        },
        include: {
          blocks: {
            orderBy: { sort_order: 'asc' },
            include: {
              set: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/modules/[id]/quiz
 * Get quizzes for a module. Supports ?type= filter (mastery_check or module_assessment).
 * Faculty: full data with blocks + sets.
 * Students: basic quiz info, no correct answers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: moduleId } = await params;
    const isFaculty = hasFacultyAccess(session);

    const url = new URL(request.url);
    const typeFilter = url.searchParams.get('type');

    const quizzes = await withDatabaseRetry(async () => {
      const where: Record<string, unknown> = { module_id: moduleId };
      if (typeFilter && ['mastery_check', 'module_assessment'].includes(typeFilter)) {
        where.quiz_type = typeFilter;
      }
      // Students can only see published quizzes
      if (!isFaculty) {
        where.status = 'published';
      }

      return await prisma.quizzes.findMany({
        where,
        include: {
          blocks: {
            orderBy: { sort_order: 'asc' },
            include: {
              set: {
                include: isFaculty
                  ? {
                      memberships: {
                        orderBy: { sort_order: 'asc' },
                        include: {
                          question: {
                            include: {
                              options: { orderBy: { sort_order: 'asc' } },
                            },
                          },
                        },
                      },
                    }
                  : undefined,
              },
            },
          },
        },
        orderBy: { created_at: 'asc' },
      });
    });

    // For students, strip sensitive data
    if (!isFaculty) {
      const sanitized = quizzes.map(quiz => ({
        id: quiz.id,
        module_id: quiz.module_id,
        title: quiz.title,
        description: quiz.description,
        quiz_type: quiz.quiz_type,
        status: quiz.status,
        xp_reward: quiz.xp_reward,
        time_limit_minutes: quiz.time_limit_minutes,
        max_attempts: quiz.max_attempts,
        pass_threshold: quiz.pass_threshold,
        mastery_threshold: quiz.mastery_threshold,
        feedback_timing: quiz.feedback_timing,
        feedback_depth: quiz.feedback_depth,
        randomize_blocks: quiz.randomize_blocks,
        created_at: quiz.created_at,
        updated_at: quiz.updated_at,
        blocks: quiz.blocks.map(b => ({
          id: b.id,
          title: b.title,
          show_title: b.show_title,
          questions_to_pull: b.questions_to_pull,
          sort_order: b.sort_order,
          set: {
            id: b.set.id,
            title: b.set.title,
          },
        })),
      }));
      return NextResponse.json({ quizzes: sanitized });
    }

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}
