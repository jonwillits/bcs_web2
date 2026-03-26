import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { computeItemAnalysis } from '@/lib/quiz/analytics';

/**
 * GET /api/faculty/analytics/quiz/[quizId]/item-analysis
 * Item analysis endpoint using computeItemAnalysis().
 * Returns per-question: correct_rate, point_biserial, avg_response_time_ms, option_distribution.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params;

    const data = await withDatabaseRetry(async () => {
      const quiz = await prisma.quizzes.findUnique({
        where: { id: quizId },
        select: { id: true, title: true, quiz_type: true },
      });

      if (!quiz) {
        return { error: 'Quiz not found', status: 404 };
      }

      // Get all completed attempts with scores
      const attempts = await prisma.quiz_attempts.findMany({
        where: {
          quiz_id: quizId,
          status: 'submitted',
        },
        select: {
          id: true,
          score: true,
        },
      });

      if (attempts.length === 0) {
        return {
          quizTitle: quiz.title,
          quizType: quiz.quiz_type,
          totalAttempts: 0,
          items: [],
        };
      }

      const attemptIds = attempts.map(a => a.id);
      const attemptScoreMap = new Map(attempts.map(a => [a.id, a.score ?? 0]));

      // Get all question instances from completed attempts to find unique questions
      const instances = await prisma.quiz_question_instances.findMany({
        where: { attempt_id: { in: attemptIds } },
        select: {
          question_id: true,
          question_text_snapshot: true,
          options_snapshot: true,
          attempt_id: true,
        },
      });

      // Group by question_id, taking the first instance for text/options snapshot
      const questionSnapshotMap = new Map<
        string,
        {
          text: string;
          options: Array<{ id: string; text: string; is_correct: boolean }>;
        }
      >();

      for (const inst of instances) {
        if (!questionSnapshotMap.has(inst.question_id)) {
          const options = Array.isArray(inst.options_snapshot)
            ? (inst.options_snapshot as Array<{
                id: string;
                text: string;
                is_correct: boolean;
              }>).map(o => ({
                id: o.id,
                text: o.text,
                is_correct: o.is_correct,
              }))
            : [];

          questionSnapshotMap.set(inst.question_id, {
            text: inst.question_text_snapshot,
            options,
          });
        }
      }

      // Map question_id -> which attempt_ids include this question
      const questionAttemptMap = new Map<string, Set<string>>();
      for (const inst of instances) {
        if (!questionAttemptMap.has(inst.question_id)) {
          questionAttemptMap.set(inst.question_id, new Set());
        }
        questionAttemptMap.get(inst.question_id)!.add(inst.attempt_id);
      }

      // Get all answers for these attempts
      const answers = await prisma.quiz_attempt_answers.findMany({
        where: { attempt_id: { in: attemptIds } },
        select: {
          attempt_id: true,
          question_id: true,
          is_correct: true,
          selected_option_ids: true,
          response_time_ms: true,
        },
      });

      // Group answers by question_id
      const answersByQuestion = new Map<
        string,
        Array<{
          attempt_id: string;
          is_correct: boolean;
          selected_option_ids: string[];
          response_time_ms: number | null;
        }>
      >();

      for (const ans of answers) {
        if (!answersByQuestion.has(ans.question_id)) {
          answersByQuestion.set(ans.question_id, []);
        }
        answersByQuestion.get(ans.question_id)!.push({
          attempt_id: ans.attempt_id,
          is_correct: ans.is_correct ?? false,
          selected_option_ids: ans.selected_option_ids,
          response_time_ms: ans.response_time_ms,
        });
      }

      // Compute item analysis for each question
      const items = Array.from(questionSnapshotMap.entries()).map(
        ([questionId, snapshot]) => {
          const questionAnswers = answersByQuestion.get(questionId) || [];

          // Build responses for computeItemAnalysis
          const responses = questionAnswers.map(a => ({
            is_correct: a.is_correct,
            total_score: attemptScoreMap.get(a.attempt_id) ?? 0,
            response_time_ms: a.response_time_ms,
            selected_option_ids: a.selected_option_ids,
          }));

          return computeItemAnalysis(
            questionId,
            snapshot.text,
            responses,
            snapshot.options
          );
        }
      );

      return {
        quizTitle: quiz.title,
        quizType: quiz.quiz_type,
        totalAttempts: attempts.length,
        items,
      };
    });

    if ('error' in data) {
      return NextResponse.json(
        { error: data.error },
        { status: data.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching item analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item analysis' },
      { status: 500 }
    );
  }
}
