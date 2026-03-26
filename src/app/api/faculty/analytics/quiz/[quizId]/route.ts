import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';

/**
 * GET /api/faculty/analytics/quiz/[quizId]
 * Enhanced quiz analytics.
 * Returns: uniqueStudents, avgScore, passRate, avgTimeSeconds, totalAttempts,
 *          scoreDistribution (5 buckets), questionAnalysis (per-question correct rate + avg response time).
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
        select: {
          id: true,
          title: true,
          quiz_type: true,
          module_id: true,
        },
      });

      if (!quiz) {
        return { error: 'Quiz not found', status: 404 };
      }

      // Get all completed attempts
      const attempts = await prisma.quiz_attempts.findMany({
        where: {
          quiz_id: quizId,
          status: 'submitted',
        },
        select: {
          id: true,
          user_id: true,
          score: true,
          raw_score: true,
          passed: true,
          time_spent_seconds: true,
        },
      });

      const totalAttempts = attempts.length;
      const uniqueStudents = new Set(attempts.map(a => a.user_id)).size;

      const scores = attempts
        .filter(a => a.score !== null)
        .map(a => a.score!);
      const avgScore =
        scores.length > 0
          ? Math.round(
              (scores.reduce((s, v) => s + v, 0) / scores.length) * 100
            ) / 100
          : 0;

      const passCount = attempts.filter(a => a.passed).length;
      const passRate =
        totalAttempts > 0
          ? Math.round((passCount / totalAttempts) * 10000) / 100
          : 0;

      const timesWithValues = attempts.filter(
        a => a.time_spent_seconds != null
      );
      const avgTimeSeconds =
        timesWithValues.length > 0
          ? Math.round(
              timesWithValues.reduce(
                (s, a) => s + a.time_spent_seconds!,
                0
              ) / timesWithValues.length
            )
          : null;

      // Score distribution (5 buckets: 0-20, 20-40, 40-60, 60-80, 80-100)
      const scoreDistribution = [0, 0, 0, 0, 0];
      scores.forEach(s => {
        const bucket = Math.min(Math.floor(s / 20), 4);
        scoreDistribution[bucket]++;
      });

      // Per-question analysis using question_instances and response events
      const attemptIds = attempts.map(a => a.id);

      // Get all question instances from these attempts
      const instances = await prisma.quiz_question_instances.findMany({
        where: { attempt_id: { in: attemptIds } },
        select: {
          question_id: true,
          question_text_snapshot: true,
          attempt_id: true,
        },
      });

      // Get unique questions
      const questionMap = new Map<
        string,
        { text: string; totalAnswers: number; correctCount: number; totalResponseTimeMs: number; responseTimeCount: number }
      >();

      for (const inst of instances) {
        if (!questionMap.has(inst.question_id)) {
          questionMap.set(inst.question_id, {
            text: inst.question_text_snapshot,
            totalAnswers: 0,
            correctCount: 0,
            totalResponseTimeMs: 0,
            responseTimeCount: 0,
          });
        }
      }

      // Get answer data for these attempts
      const answerData = await prisma.quiz_attempt_answers.findMany({
        where: {
          attempt_id: { in: attemptIds },
        },
        select: {
          question_id: true,
          is_correct: true,
          response_time_ms: true,
        },
      });

      for (const ans of answerData) {
        const entry = questionMap.get(ans.question_id);
        if (!entry) continue;
        entry.totalAnswers++;
        if (ans.is_correct === true) {
          entry.correctCount++;
        }
        if (ans.response_time_ms != null) {
          entry.totalResponseTimeMs += ans.response_time_ms;
          entry.responseTimeCount++;
        }
      }

      const questionAnalysis = Array.from(questionMap.entries()).map(
        ([questionId, entry]) => ({
          questionId,
          questionText:
            entry.text.length > 100
              ? entry.text.substring(0, 100) + '...'
              : entry.text,
          totalAnswers: entry.totalAnswers,
          correctCount: entry.correctCount,
          correctRate:
            entry.totalAnswers > 0
              ? Math.round(
                  (entry.correctCount / entry.totalAnswers) * 10000
                ) / 100
              : 0,
          avgResponseTimeMs:
            entry.responseTimeCount > 0
              ? Math.round(entry.totalResponseTimeMs / entry.responseTimeCount)
              : null,
        })
      );

      return {
        quizTitle: quiz.title,
        quizType: quiz.quiz_type,
        totalAttempts,
        uniqueStudents,
        avgScore,
        passRate,
        passCount,
        avgTimeSeconds,
        scoreDistribution,
        questionAnalysis,
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
    console.error('Error fetching quiz analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
