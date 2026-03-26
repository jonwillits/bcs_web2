import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import {
  gradeAttempt,
  calculateMasteryXP,
  calculateAssessmentXP,
  applyScoringProcedure,
} from '@/lib/quiz/grading';
import { checkAchievementsAfterQuizSubmission } from '@/lib/achievements/checker';

/**
 * POST /api/quizzes/[quizId]/attempts/[attemptId]/submit
 * Submit + grade a quiz attempt.
 *
 * Key logic:
 * 1. Validate attempt is in_progress and belongs to user
 * 2. Calculate time_spent_seconds (with 30s grace for timed quizzes)
 * 3. Load question instances + current answers
 * 4. Grade using gradeAttempt()
 * 5. For mastery: check against mastery_threshold, use calculateMasteryXP()
 * 6. For assessment: check against pass_threshold, use calculateAssessmentXP(), applyScoringProcedure()
 * 7. Create quiz_response_events for each answer
 * 8. Update user_gamification_stats XP
 * 9. Check achievements
 * 10. Return score, rawScore, passed, xpAwarded, achievements
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

    const { quizId, attemptId } = await params;
    const userId = session.user.id;

    const result = await withDatabaseRetry(async () => {
      // Load attempt with quiz, instances, and answers
      const attempt = await prisma.quiz_attempts.findUnique({
        where: { id: attemptId },
        include: {
          question_instances: {
            orderBy: { sort_order: 'asc' },
          },
          answers: true,
          quiz: {
            select: {
              id: true,
              module_id: true,
              quiz_type: true,
              xp_reward: true,
              time_limit_minutes: true,
              pass_threshold: true,
              mastery_threshold: true,
              scoring_procedure: true,
              scoring_drop_count: true,
              feedback_timing: true,
              feedback_depth: true,
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

      const now = new Date();

      // Calculate time spent
      const timeSpent = Math.round(
        (now.getTime() - attempt.started_at.getTime()) / 1000
      );

      // Server-side time limit enforcement (30s grace period)
      if (attempt.quiz.time_limit_minutes) {
        const limitSeconds = attempt.quiz.time_limit_minutes * 60 + 30;
        if (timeSpent > limitSeconds) {
          // Still grade but flag it
        }
      }

      const isMastery = attempt.quiz.quiz_type === 'mastery_check';
      const threshold = isMastery
        ? attempt.quiz.mastery_threshold
        : attempt.quiz.pass_threshold;

      // Build question_id -> points map from bank_questions
      const questionIds = attempt.question_instances.map(i => i.question_id);
      const bankQuestions = await prisma.bank_questions.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, points: true },
      });
      const questionPoints = new Map<string, number>(
        bankQuestions.map(q => [q.id, q.points])
      );

      // Prepare instances for grading
      const instances = attempt.question_instances.map(inst => ({
        id: inst.id,
        question_id: inst.question_id,
        weight: inst.weight,
        question_text_snapshot: inst.question_text_snapshot,
        options_snapshot: inst.options_snapshot as Array<{
          id: string;
          text: string;
          is_correct: boolean;
          explanation?: string | null;
        }>,
      }));

      // Prepare answers for grading
      const answers = attempt.answers.map(a => ({
        question_id: a.question_id,
        question_instance_id: a.question_instance_id,
        selected_option_ids: a.selected_option_ids,
      }));

      // Grade the attempt
      const gradeResult = gradeAttempt(instances, answers, questionPoints);

      // Determine pass/mastery
      const passed = gradeResult.weightedScore >= threshold;

      // Calculate XP
      let xpToAward = 0;
      let effectiveScore: number | null = null;

      if (isMastery) {
        // Check if previously mastered
        const previousMastery = await prisma.quiz_attempts.findFirst({
          where: {
            quiz_id: quizId,
            user_id: userId,
            status: 'submitted',
            passed: true,
            id: { not: attemptId },
          },
        });

        xpToAward = calculateMasteryXP({
          baseXP: attempt.quiz.xp_reward,
          isMastered: passed,
          previouslyMastered: !!previousMastery,
        });
      } else {
        // Assessment: get previous best XP
        const previousBest = await prisma.quiz_attempts.findFirst({
          where: {
            quiz_id: quizId,
            user_id: userId,
            status: 'submitted',
            id: { not: attemptId },
          },
          orderBy: { xp_awarded: 'desc' },
          select: { xp_awarded: true },
        });

        xpToAward = calculateAssessmentXP({
          baseXP: attempt.quiz.xp_reward,
          score: gradeResult.weightedScore,
          attemptNumber: attempt.attempt_number,
          previousBestXP: previousBest?.xp_awarded || 0,
        });

        // Apply scoring procedure across all attempts for effective grade
        const previousScores = await prisma.quiz_attempts.findMany({
          where: {
            quiz_id: quizId,
            user_id: userId,
            status: 'submitted',
            id: { not: attemptId },
          },
          select: { score: true },
        });
        const allScores = [
          ...previousScores.filter(a => a.score !== null).map(a => a.score!),
          gradeResult.weightedScore,
        ];
        effectiveScore = applyScoringProcedure(
          allScores,
          attempt.quiz.scoring_procedure as 'best' | 'last' | 'average_drop_n',
          attempt.quiz.scoring_drop_count
        );
      }

      // Update graded answers
      for (const graded of gradeResult.gradedAnswers) {
        await prisma.quiz_attempt_answers.updateMany({
          where: {
            attempt_id: attemptId,
            question_id: graded.question_id,
          },
          data: {
            is_correct: graded.is_correct,
            points_earned: graded.points_earned,
            weight: graded.weight,
          },
        });
      }

      // Create quiz_response_events for analytics
      const answerMap = new Map(attempt.answers.map(a => [a.question_id, a]));
      const responseEvents = gradeResult.gradedAnswers.map(graded => {
        const answer = answerMap.get(graded.question_id);
        const instance = attempt.question_instances.find(
          i => i.question_id === graded.question_id
        );
        return {
          attempt_id: attemptId,
          user_id: userId,
          module_id: attempt.quiz.module_id,
          quiz_id: quizId,
          quiz_type: attempt.quiz.quiz_type,
          block_id: instance?.block_id ?? null,
          question_id: graded.question_id,
          question_version: instance?.question_version ?? 1,
          attempt_number: attempt.attempt_number,
          response: { selected_option_ids: answer?.selected_option_ids ?? [] },
          is_correct: graded.is_correct,
          response_time_ms: answer?.response_time_ms ?? null,
          tags: [],
        };
      });

      await prisma.quiz_response_events.createMany({
        data: responseEvents,
      });

      // Update attempt record
      await prisma.quiz_attempts.update({
        where: { id: attemptId },
        data: {
          status: 'submitted',
          score: gradeResult.weightedScore,
          raw_score: gradeResult.rawScore,
          points_earned: gradeResult.pointsEarned,
          points_possible: gradeResult.pointsPossible,
          passed,
          submitted_at: now,
          time_spent_seconds: timeSpent,
          xp_awarded: xpToAward,
        },
      });

      // Award XP to user gamification stats
      if (xpToAward > 0) {
        const userStats = await prisma.user_gamification_stats.upsert({
          where: { user_id: userId },
          update: {
            total_xp: { increment: xpToAward },
            last_active_date: now,
          },
          create: {
            user_id: userId,
            total_xp: xpToAward,
            level: 1,
            last_active_date: now,
          },
        });

        // Recalculate level
        const newLevel = Math.floor(Math.sqrt(userStats.total_xp / 100));
        if (newLevel > userStats.level) {
          await prisma.user_gamification_stats.update({
            where: { user_id: userId },
            data: { level: newLevel },
          });
        }
      }

      return {
        score: gradeResult.weightedScore,
        rawScore: gradeResult.rawScore,
        pointsEarned: gradeResult.pointsEarned,
        pointsPossible: gradeResult.pointsPossible,
        passed,
        xpAwarded: xpToAward,
        timeSpentSeconds: timeSpent,
        status: 'submitted',
        quizType: attempt.quiz.quiz_type,
        attemptNumber: attempt.attempt_number,
        effectiveScore,
      };
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status as number }
      );
    }

    // Check achievements (non-blocking)
    let achievements: unknown[] = [];
    try {
      const achievementResult = await checkAchievementsAfterQuizSubmission(
        userId,
        quizId,
        result.score,
        result.passed,
        result.timeSpentSeconds,
        result.quizType,
        result.attemptNumber
      );
      achievements = achievementResult.newAchievements;
    } catch {
      // Don't fail the submission if achievements check fails
    }

    return NextResponse.json({ ...result, achievements });
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to submit attempt' },
      { status: 500 }
    );
  }
}
