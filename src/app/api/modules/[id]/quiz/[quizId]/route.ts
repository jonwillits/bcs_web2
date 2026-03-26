import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { updateQuizSchema } from '@/lib/quiz/schemas';

/**
 * PUT /api/modules/[id]/quiz/[quizId]
 * Update quiz settings (faculty only).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: moduleId, quizId } = await params;

    const canEdit = await canEditModuleWithRetry(session.user.id, moduleId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const quiz = await withDatabaseRetry(async () => {
      // Verify quiz belongs to this module
      const existing = await prisma.quizzes.findFirst({
        where: { id: quizId, module_id: moduleId },
      });

      if (!existing) {
        return null;
      }

      const data = parsed.data;
      const isMastery = existing.quiz_type === 'mastery_check';

      // Build update data, respecting quiz_type constraints
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.xp_reward !== undefined) updateData.xp_reward = data.xp_reward;
      if (data.randomize_blocks !== undefined) updateData.randomize_blocks = data.randomize_blocks;

      if (isMastery) {
        // Mastery check: only allow mastery-relevant fields
        if (data.mastery_threshold !== undefined) {
          updateData.mastery_threshold = data.mastery_threshold;
          updateData.pass_threshold = data.mastery_threshold;
        }
        // Force mastery settings
        updateData.max_attempts = 0;
        updateData.feedback_timing = 'per_question';
        updateData.feedback_depth = 'full';
      } else {
        // Assessment: allow all assessment settings
        if (data.time_limit_minutes !== undefined) updateData.time_limit_minutes = data.time_limit_minutes;
        if (data.max_attempts !== undefined) updateData.max_attempts = data.max_attempts;
        if (data.pass_threshold !== undefined) updateData.pass_threshold = data.pass_threshold;
        if (data.scoring_procedure !== undefined) updateData.scoring_procedure = data.scoring_procedure;
        if (data.scoring_drop_count !== undefined) updateData.scoring_drop_count = data.scoring_drop_count;
        if (data.feedback_timing !== undefined) updateData.feedback_timing = data.feedback_timing;
        if (data.feedback_depth !== undefined) updateData.feedback_depth = data.feedback_depth;
        if (data.mastery_threshold !== undefined) updateData.mastery_threshold = data.mastery_threshold;
      }

      return await prisma.quizzes.update({
        where: { id: quizId },
        data: updateData,
        include: {
          blocks: {
            orderBy: { sort_order: 'asc' },
            include: { set: true },
          },
        },
      });
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/modules/[id]/quiz/[quizId]
 * Delete quiz (cascade to blocks, attempts).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: moduleId, quizId } = await params;

    const canEdit = await canEditModuleWithRetry(session.user.id, moduleId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await withDatabaseRetry(async () => {
      // Verify quiz belongs to this module
      const existing = await prisma.quizzes.findFirst({
        where: { id: quizId, module_id: moduleId },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      await prisma.quizzes.delete({
        where: { id: quizId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}
