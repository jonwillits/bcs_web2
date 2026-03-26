import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';

/**
 * POST /api/quizzes/[quizId]/duplicate
 * Duplicate a quiz (can optionally change quiz_type).
 * Copies quiz settings + blocks. Does NOT copy attempts.
 * Body: { quiz_type?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params;

    let body: { quiz_type?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const result = await withDatabaseRetry(async () => {
      // Load original quiz with blocks
      const original = await prisma.quizzes.findUnique({
        where: { id: quizId },
        include: {
          blocks: {
            orderBy: { sort_order: 'asc' },
          },
        },
      });

      if (!original) {
        return { error: 'Quiz not found', status: 404 };
      }

      // Check permission on module
      const canEdit = await canEditModuleWithRetry(session.user!.id, original.module_id);
      if (!canEdit) {
        return { error: 'Forbidden', status: 403 };
      }

      // Determine target quiz_type
      const targetType = body.quiz_type || original.quiz_type;
      if (!['mastery_check', 'module_assessment'].includes(targetType)) {
        return { error: 'Invalid quiz_type', status: 400 };
      }

      // Check if target type already exists for this module
      const existingTarget = await prisma.quizzes.findUnique({
        where: {
          module_id_quiz_type: {
            module_id: original.module_id,
            quiz_type: targetType,
          },
        },
      });

      if (existingTarget) {
        return {
          error: `Module already has a ${targetType} quiz`,
          status: 409,
        };
      }

      const isMastery = targetType === 'mastery_check';

      // Create duplicate quiz with blocks
      const duplicated = await prisma.$transaction(async (tx) => {
        const newQuiz = await tx.quizzes.create({
          data: {
            module_id: original.module_id,
            title: `${original.title} (Copy)`,
            description: original.description,
            quiz_type: targetType,
            status: 'draft', // Always start as draft
            xp_reward: original.xp_reward,
            randomize_blocks: original.randomize_blocks,
            time_limit_minutes: isMastery ? null : original.time_limit_minutes,
            max_attempts: isMastery ? 0 : original.max_attempts,
            pass_threshold: isMastery ? original.mastery_threshold : original.pass_threshold,
            scoring_procedure: isMastery ? 'best' : original.scoring_procedure,
            scoring_drop_count: isMastery ? 0 : original.scoring_drop_count,
            feedback_timing: isMastery ? 'per_question' : original.feedback_timing,
            feedback_depth: isMastery ? 'full' : original.feedback_depth,
            mastery_threshold: original.mastery_threshold,
          },
        });

        // Copy blocks
        if (original.blocks.length > 0) {
          await tx.quiz_blocks.createMany({
            data: original.blocks.map(block => ({
              quiz_id: newQuiz.id,
              set_id: block.set_id,
              title: block.title,
              show_title: block.show_title,
              questions_to_pull: block.questions_to_pull,
              randomize_within: block.randomize_within,
              sort_order: block.sort_order,
            })),
          });
        }

        // Return with blocks
        return await tx.quizzes.findUnique({
          where: { id: newQuiz.id },
          include: {
            blocks: {
              orderBy: { sort_order: 'asc' },
              include: { set: true },
            },
          },
        });
      });

      return { quiz: duplicated };
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ quiz: result.quiz }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate quiz' },
      { status: 500 }
    );
  }
}
