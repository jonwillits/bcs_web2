import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { checkAnswerSchema } from '@/lib/quiz/schemas';

/**
 * POST /api/quizzes/[quizId]/attempts/[attemptId]/check-answer
 * Server-side answer checking for mastery check per-question feedback.
 * Returns correctness, correct answer IDs, and option explanations.
 */
export async function POST(
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
    const parsed = checkAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { question_instance_id, selected_option_ids } = parsed.data;
    const userId = session.user.id;

    const result = await withDatabaseRetry(async () => {
      // Load the attempt and verify ownership + status
      const attempt = await prisma.quiz_attempts.findUnique({
        where: { id: attemptId },
        select: {
          user_id: true,
          status: true,
          quiz: {
            select: {
              quiz_type: true,
              feedback_timing: true,
            },
          },
        },
      });

      if (!attempt || attempt.user_id !== userId) {
        return { error: 'Attempt not found', status: 404 };
      }

      if (attempt.status !== 'in_progress') {
        return { error: 'Attempt already submitted', status: 409 };
      }

      // Only allow per-question checking for mastery checks
      if (attempt.quiz.quiz_type !== 'mastery_check') {
        return { error: 'Per-question checking only available for mastery checks', status: 403 };
      }

      // Load the question instance with full options (including is_correct)
      const instance = await prisma.quiz_question_instances.findUnique({
        where: { id: question_instance_id },
      });

      if (!instance || instance.attempt_id !== attemptId) {
        return { error: 'Question instance not found', status: 404 };
      }

      const options = instance.options_snapshot as Array<{
        id: string;
        text: string;
        is_correct: boolean;
        explanation?: string | null;
      }>;

      // Grade the answer
      const correctIds = new Set(options.filter(o => o.is_correct).map(o => o.id));
      const selectedIds = new Set(selected_option_ids);
      const isCorrect =
        correctIds.size === selectedIds.size &&
        [...correctIds].every(id => selectedIds.has(id));

      // Build per-option feedback
      const explanations = options.map(opt => ({
        optionId: opt.id,
        optionText: opt.text,
        isCorrect: opt.is_correct,
        explanation: opt.explanation ?? null,
        wasSelected: selectedIds.has(opt.id),
      }));

      // Also save/upsert the answer so it's persisted
      await prisma.quiz_attempt_answers.upsert({
        where: {
          attempt_id_question_id: {
            attempt_id: attemptId,
            question_id: instance.question_id,
          },
        },
        update: {
          selected_option_ids,
          question_instance_id,
          is_correct: isCorrect,
        },
        create: {
          attempt_id: attemptId,
          question_id: instance.question_id,
          question_instance_id,
          selected_option_ids,
          is_correct: isCorrect,
        },
      });

      return {
        is_correct: isCorrect,
        explanations,
      };
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status as number }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking answer:', error);
    return NextResponse.json(
      { error: 'Failed to check answer' },
      { status: 500 }
    );
  }
}
