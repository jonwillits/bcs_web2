import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { updateBlockSchema } from '@/lib/quiz/schemas';

/**
 * PUT /api/quizzes/[quizId]/blocks/[blockId]
 * Update a quiz block.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; blockId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId, blockId } = await params;

    const body = await request.json();
    const parsed = updateBlockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await withDatabaseRetry(async () => {
      // Get quiz to check module permissions
      const quiz = await prisma.quizzes.findUnique({
        where: { id: quizId },
        select: { module_id: true },
      });

      if (!quiz) {
        return { error: 'Quiz not found', status: 404 };
      }

      const canEdit = await canEditModuleWithRetry(session.user!.id, quiz.module_id);
      if (!canEdit) {
        return { error: 'Forbidden', status: 403 };
      }

      // Verify block belongs to this quiz
      const existing = await prisma.quiz_blocks.findFirst({
        where: { id: blockId, quiz_id: quizId },
      });

      if (!existing) {
        return { error: 'Block not found', status: 404 };
      }

      const data = parsed.data;
      const updateData: Record<string, unknown> = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.show_title !== undefined) updateData.show_title = data.show_title;
      if (data.questions_to_pull !== undefined) updateData.questions_to_pull = data.questions_to_pull;
      if (data.randomize_within !== undefined) updateData.randomize_within = data.randomize_within;
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

      // If set_id is changing, verify it belongs to the same module's bank
      if (data.set_id !== undefined && data.set_id !== existing.set_id) {
        const set = await prisma.question_sets.findUnique({
          where: { id: data.set_id },
          include: { bank: { select: { module_id: true } } },
        });

        if (!set || set.bank.module_id !== quiz.module_id) {
          return {
            error: 'Question set does not belong to this module\'s bank',
            status: 400,
          };
        }
        updateData.set_id = data.set_id;
      }

      // Validate questions_to_pull against set membership count
      const setId = (data.set_id ?? existing.set_id) as string;
      const pullCount = (data.questions_to_pull ?? existing.questions_to_pull) as number;
      const membershipCount = await prisma.question_set_memberships.count({
        where: { set_id: setId },
      });

      if (pullCount > membershipCount) {
        return {
          error: `Set only has ${membershipCount} questions, cannot pull ${pullCount}`,
          status: 400,
        };
      }

      const block = await prisma.quiz_blocks.update({
        where: { id: blockId },
        data: updateData,
        include: { set: true },
      });

      return { block };
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ block: result.block });
  } catch (error) {
    console.error('Error updating quiz block:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz block' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quizzes/[quizId]/blocks/[blockId]
 * Delete a quiz block.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; blockId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId, blockId } = await params;

    await withDatabaseRetry(async () => {
      // Get quiz to check module permissions
      const quiz = await prisma.quizzes.findUnique({
        where: { id: quizId },
        select: { module_id: true },
      });

      if (!quiz) {
        throw new Error('QUIZ_NOT_FOUND');
      }

      const canEdit = await canEditModuleWithRetry(session.user!.id, quiz.module_id);
      if (!canEdit) {
        throw new Error('FORBIDDEN');
      }

      // Verify block belongs to this quiz
      const existing = await prisma.quiz_blocks.findFirst({
        where: { id: blockId, quiz_id: quizId },
      });

      if (!existing) {
        throw new Error('BLOCK_NOT_FOUND');
      }

      await prisma.quiz_blocks.delete({
        where: { id: blockId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'QUIZ_NOT_FOUND' || error.message === 'BLOCK_NOT_FOUND') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    console.error('Error deleting quiz block:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz block' },
      { status: 500 }
    );
  }
}
