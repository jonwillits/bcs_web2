import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { saveAnswersSchema } from '@/lib/quiz/schemas';

/**
 * GET /api/quizzes/[quizId]/attempts/[attemptId]
 * Get attempt detail for review.
 * Faculty can view any attempt, students only their own.
 * For students, conditionally include correct answers based on feedback_depth.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; attemptId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;
    const isFaculty = hasFacultyAccess(session);

    const attempt = await withDatabaseRetry(async () => {
      return await prisma.quiz_attempts.findUnique({
        where: { id: attemptId },
        include: {
          question_instances: {
            orderBy: { sort_order: 'asc' },
          },
          answers: true,
          quiz: {
            select: {
              id: true,
              title: true,
              quiz_type: true,
              pass_threshold: true,
              mastery_threshold: true,
              feedback_timing: true,
              feedback_depth: true,
            },
          },
        },
      });
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Faculty can view any attempt, students only their own
    if (attempt.user_id !== session.user.id && !isFaculty) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For faculty, return full data including correct answers
    if (isFaculty) {
      return NextResponse.json({ attempt });
    }

    // For students, apply feedback_depth rules
    const feedbackDepth = attempt.quiz.feedback_depth;
    const isSubmitted = attempt.status === 'submitted';

    // If attempt is still in progress, strip correct answers
    if (!isSubmitted) {
      const sanitizedInstances = attempt.question_instances.map(inst => ({
        ...inst,
        options_snapshot: Array.isArray(inst.options_snapshot)
          ? (inst.options_snapshot as Array<Record<string, unknown>>).map(
              ({ is_correct: _removed, explanation: _exp, ...opt }) => opt
            )
          : inst.options_snapshot,
      }));

      return NextResponse.json({
        attempt: {
          ...attempt,
          question_instances: sanitizedInstances,
        },
      });
    }

    // For submitted attempts, apply feedback depth
    if (feedbackDepth === 'score_only') {
      // Only show score, no question-level details
      return NextResponse.json({
        attempt: {
          id: attempt.id,
          quiz_id: attempt.quiz_id,
          quiz_type: attempt.quiz_type,
          attempt_number: attempt.attempt_number,
          status: attempt.status,
          score: attempt.score,
          raw_score: attempt.raw_score,
          points_earned: attempt.points_earned,
          points_possible: attempt.points_possible,
          passed: attempt.passed,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          time_spent_seconds: attempt.time_spent_seconds,
          xp_awarded: attempt.xp_awarded,
          quiz: attempt.quiz,
          question_instances: [],
          answers: [],
        },
      });
    }

    if (feedbackDepth === 'which_wrong') {
      // Show which answers were wrong, but not the correct answers
      const sanitizedInstances = attempt.question_instances.map(inst => ({
        ...inst,
        options_snapshot: Array.isArray(inst.options_snapshot)
          ? (inst.options_snapshot as Array<Record<string, unknown>>).map(
              ({ is_correct: _removed, explanation: _exp, ...opt }) => opt
            )
          : inst.options_snapshot,
      }));

      return NextResponse.json({
        attempt: {
          ...attempt,
          question_instances: sanitizedInstances,
          // answers still include is_correct flag per answer so student sees which they got wrong
        },
      });
    }

    // feedback_depth === 'full' — show everything including correct answers and explanations
    return NextResponse.json({ attempt });
  } catch (error) {
    console.error('Error fetching attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempt' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quizzes/[quizId]/attempts/[attemptId]
 * Save answers (auto-save). Upsert quiz_attempt_answers.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; attemptId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;

    const body = await request.json();
    const parsed = saveAnswersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await withDatabaseRetry(async () => {
      // Verify attempt belongs to user and is in_progress
      const attempt = await prisma.quiz_attempts.findUnique({
        where: { id: attemptId },
        select: { user_id: true, status: true },
      });

      if (!attempt || attempt.user_id !== session.user!.id) {
        throw new Error('NOT_FOUND');
      }

      if (attempt.status !== 'in_progress') {
        throw new Error('ALREADY_SUBMITTED');
      }

      // Upsert each answer
      for (const answer of parsed.data.answers) {
        await prisma.quiz_attempt_answers.upsert({
          where: {
            attempt_id_question_id: {
              attempt_id: attemptId,
              question_id: answer.question_id,
            },
          },
          update: {
            selected_option_ids: answer.selected_option_ids,
            question_instance_id: answer.question_instance_id,
            response_time_ms: answer.response_time_ms ?? null,
          },
          create: {
            attempt_id: attemptId,
            question_id: answer.question_id,
            question_instance_id: answer.question_instance_id,
            selected_option_ids: answer.selected_option_ids,
            response_time_ms: answer.response_time_ms ?? null,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }
      if (error.message === 'ALREADY_SUBMITTED') {
        return NextResponse.json(
          { error: 'Attempt already submitted' },
          { status: 409 }
        );
      }
    }
    console.error('Error saving answers:', error);
    return NextResponse.json(
      { error: 'Failed to save answers' },
      { status: 500 }
    );
  }
}
