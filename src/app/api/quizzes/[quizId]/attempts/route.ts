import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { startAttemptSchema } from '@/lib/quiz/schemas';

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sanitize question instances for student view (strip is_correct from options snapshot)
 */
function sanitizeInstances(
  instances: Array<{
    id: string;
    block_id: string;
    question_id: string;
    question_version: number;
    weight: number;
    sort_order: number;
    question_text_snapshot: string;
    options_snapshot: any;
  }>
) {
  return instances.map(inst => ({
    ...inst,
    options_snapshot: Array.isArray(inst.options_snapshot)
      ? (inst.options_snapshot as Array<Record<string, unknown>>).map(
          ({ is_correct: _removed, ...opt }) => opt
        )
      : inst.options_snapshot,
  }));
}

/**
 * POST /api/quizzes/[quizId]/attempts
 * Start a new quiz attempt with block-based question resolution.
 * 1. Check max_attempts (mastery always unlimited, assessment checks max_attempts)
 * 2. Resume existing in_progress attempt if one exists
 * 3. Resolve blocks: for each quiz_block, pull N random questions from the linked set
 * 4. Create quiz_question_instances with snapshots
 * 5. Handle randomize_blocks and randomize_within settings
 * 6. Return attempt with question instances (sanitized)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params;
    const body = await request.json();
    const parsed = startAttemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const result = await withDatabaseRetry(async () => {
      // Load quiz with blocks
      const quiz = await prisma.quizzes.findUnique({
        where: { id: quizId },
        include: {
          blocks: {
            orderBy: { sort_order: 'asc' },
            include: {
              set: {
                include: {
                  memberships: {
                    include: {
                      question: {
                        include: {
                          options: { orderBy: { sort_order: 'asc' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!quiz || quiz.status !== 'published') {
        return { error: 'Quiz not found or not published', status: 404 };
      }

      if (quiz.blocks.length === 0) {
        return { error: 'Quiz has no blocks configured', status: 400 };
      }

      // Check for existing in-progress attempt (resume)
      const inProgress = await prisma.quiz_attempts.findFirst({
        where: {
          quiz_id: quizId,
          user_id: userId,
          status: 'in_progress',
        },
        include: {
          question_instances: {
            orderBy: { sort_order: 'asc' },
          },
          answers: true,
        },
      });

      if (inProgress) {
        return {
          attempt: {
            ...inProgress,
            question_instances: sanitizeInstances(inProgress.question_instances),
          },
          resumed: true,
        };
      }

      // Count completed attempts
      const attemptCount = await prisma.quiz_attempts.count({
        where: { quiz_id: quizId, user_id: userId },
      });

      // Check max attempts (mastery unlimited: max_attempts=0 means unlimited)
      const isMastery = quiz.quiz_type === 'mastery_check';
      if (!isMastery && quiz.max_attempts > 0 && attemptCount >= quiz.max_attempts) {
        return { error: 'Maximum attempts reached', status: 403 };
      }

      // Resolve blocks into question instances
      let blocks = [...quiz.blocks];
      if (quiz.randomize_blocks) {
        blocks = shuffleArray(blocks);
      }

      interface InstanceCreate {
        block_id: string;
        question_id: string;
        question_version: number;
        question_type: string;
        weight: number;
        sort_order: number;
        question_text_snapshot: string;
        options_snapshot: any;
      }

      const instances: InstanceCreate[] = [];
      let globalSortOrder = 0;

      for (const block of blocks) {
        const memberships = block.set.memberships;
        if (memberships.length === 0) continue;

        // Pick N random questions from this set
        const pullCount = Math.min(block.questions_to_pull, memberships.length);
        let selected = shuffleArray(memberships).slice(0, pullCount);

        // If NOT randomize_within, sort by membership sort_order
        if (!block.randomize_within) {
          selected = selected.sort((a, b) => a.sort_order - b.sort_order);
        }

        for (const membership of selected) {
          const q = membership.question;
          const optionsSnapshot = q.options.map(o => ({
            id: o.id,
            text: o.option_text,
            is_correct: o.is_correct,
            explanation: o.explanation,
          }));

          // Shuffle options if question has shuffle_answers enabled
          const finalOptions = q.shuffle_answers
            ? shuffleArray(optionsSnapshot)
            : optionsSnapshot;

          instances.push({
            block_id: block.id,
            question_id: q.id,
            question_version: q.version,
            question_type: q.question_type,
            weight: 1.0,
            sort_order: globalSortOrder++,
            question_text_snapshot: q.question_text,
            options_snapshot: finalOptions,
          });
        }
      }

      if (instances.length === 0) {
        return { error: 'No questions could be resolved from quiz blocks', status: 400 };
      }

      // Create attempt with question instances in a transaction
      const attempt = await prisma.$transaction(async (tx) => {
        const newAttempt = await tx.quiz_attempts.create({
          data: {
            quiz_id: quizId,
            user_id: userId,
            course_id: parsed.data.course_id || null,
            quiz_type: quiz.quiz_type,
            attempt_number: attemptCount + 1,
            status: 'in_progress',
          },
        });

        // Create all question instances
        await tx.quiz_question_instances.createMany({
          data: instances.map(inst => ({
            attempt_id: newAttempt.id,
            ...inst,
          })),
        });

        // Fetch created instances
        const createdInstances = await tx.quiz_question_instances.findMany({
          where: { attempt_id: newAttempt.id },
          orderBy: { sort_order: 'asc' },
        });

        return {
          ...newAttempt,
          question_instances: createdInstances,
          answers: [],
        };
      });

      return {
        attempt: {
          ...attempt,
          question_instances: sanitizeInstances(attempt.question_instances),
        },
        resumed: false,
      };
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result, { status: result.resumed ? 200 : 201 });
  } catch (error) {
    console.error('Error starting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to start attempt' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quizzes/[quizId]/attempts
 * List user's attempts for this quiz.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params;
    const userId = session.user.id;

    const data = await withDatabaseRetry(async () => {
      const attempts = await prisma.quiz_attempts.findMany({
        where: { quiz_id: quizId, user_id: userId },
        orderBy: { attempt_number: 'desc' },
        select: {
          id: true,
          attempt_number: true,
          status: true,
          score: true,
          raw_score: true,
          points_earned: true,
          points_possible: true,
          passed: true,
          started_at: true,
          submitted_at: true,
          time_spent_seconds: true,
          xp_awarded: true,
          quiz_type: true,
        },
      });

      const completedAttempts = attempts.filter(
        a => a.status === 'submitted'
      );
      const bestScore =
        completedAttempts.length > 0
          ? Math.max(
              ...completedAttempts
                .filter(a => a.score !== null)
                .map(a => a.score!),
              0
            )
          : null;

      return {
        attempts,
        totalCount: attempts.length,
        bestScore,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}
