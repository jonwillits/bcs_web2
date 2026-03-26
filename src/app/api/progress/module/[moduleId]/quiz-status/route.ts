import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/progress/module/[moduleId]/quiz-status
 * Returns status for BOTH quiz types (mastery_check and module_assessment).
 * Also returns unlock condition and whether the module can be completed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;
    const userId = session.user.id;

    const data = await withDatabaseRetry(async () => {
      // Get module's unlock condition
      const moduleData = await prisma.modules.findUnique({
        where: { id: moduleId },
        select: { unlock_condition: true },
      });

      if (!moduleData) {
        return { error: 'Module not found', status: 404 };
      }

      const unlockCondition = moduleData.unlock_condition as
        | 'completion'
        | 'mastery'
        | 'assessment'
        | 'both';

      // Get both quiz types for this module
      const quizzes = await prisma.quizzes.findMany({
        where: { module_id: moduleId },
        select: {
          id: true,
          quiz_type: true,
          status: true,
          pass_threshold: true,
          mastery_threshold: true,
          max_attempts: true,
        },
      });

      const masteryQuiz = quizzes.find(q => q.quiz_type === 'mastery_check') || null;
      const assessmentQuiz = quizzes.find(q => q.quiz_type === 'module_assessment') || null;

      // Helper to get attempts info for a quiz
      async function getQuizStatus(
        quiz: { id: string; quiz_type: string; status: string; pass_threshold: number; mastery_threshold: number; max_attempts: number } | null,
        type: 'mastery' | 'assessment'
      ) {
        if (!quiz) return null;

        const attempts = await prisma.quiz_attempts.findMany({
          where: {
            quiz_id: quiz.id,
            user_id: userId,
          },
          select: {
            score: true,
            passed: true,
            status: true,
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
        const hasPassed = attempts.some(a => a.passed);

        if (type === 'mastery') {
          return {
            quizId: quiz.id,
            status: quiz.status,
            isMastered: hasPassed,
            bestScore,
            attemptsUsed: attempts.length,
            threshold: quiz.mastery_threshold,
          };
        }

        return {
          quizId: quiz.id,
          status: quiz.status,
          passed: hasPassed,
          bestScore,
          attemptsUsed: attempts.length,
          maxAttempts: quiz.max_attempts,
          threshold: quiz.pass_threshold,
        };
      }

      const mastery = await getQuizStatus(masteryQuiz, 'mastery');
      const assessment = await getQuizStatus(assessmentQuiz, 'assessment');

      // Determine if the module can be completed based on unlock_condition
      let canComplete = true;

      switch (unlockCondition) {
        case 'completion':
          // No quiz requirements, just needs module completion
          canComplete = true;
          break;
        case 'mastery':
          // Must have mastered the mastery check
          canComplete = !mastery || mastery.isMastered;
          break;
        case 'assessment':
          // Must have passed the assessment
          canComplete = !assessment || assessment.passed;
          break;
        case 'both':
          // Must have mastered AND passed
          canComplete =
            (!mastery || mastery.isMastered) &&
            (!assessment || assessment.passed);
          break;
        default:
          canComplete = true;
      }

      return {
        mastery,
        assessment,
        unlockCondition,
        canComplete,
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
    console.error('Error fetching quiz status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz status' },
      { status: 500 }
    );
  }
}
