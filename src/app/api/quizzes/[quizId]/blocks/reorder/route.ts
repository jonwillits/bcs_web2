import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { reorderBlocksSchema } from '@/lib/quiz/schemas';

/**
 * PUT /api/quizzes/[quizId]/blocks/reorder
 * Reorder blocks within a quiz.
 * Body: { blockIds: string[] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params;

    const body = await request.json();
    const parsed = reorderBlocksSchema.safeParse(body);
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

      // Verify all block IDs belong to this quiz
      const existingBlocks = await prisma.quiz_blocks.findMany({
        where: { quiz_id: quizId },
        select: { id: true },
      });

      const existingIds = new Set(existingBlocks.map(b => b.id));
      for (const blockId of parsed.data.blockIds) {
        if (!existingIds.has(blockId)) {
          return {
            error: `Block ${blockId} does not belong to this quiz`,
            status: 400,
          };
        }
      }

      // Update sort_order for each block
      await prisma.$transaction(
        parsed.data.blockIds.map((blockId, index) =>
          prisma.quiz_blocks.update({
            where: { id: blockId },
            data: { sort_order: index },
          })
        )
      );

      // Return updated blocks
      const blocks = await prisma.quiz_blocks.findMany({
        where: { quiz_id: quizId },
        orderBy: { sort_order: 'asc' },
        include: { set: true },
      });

      return { blocks };
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ blocks: result.blocks });
  } catch (error) {
    console.error('Error reordering blocks:', error);
    return NextResponse.json(
      { error: 'Failed to reorder blocks' },
      { status: 500 }
    );
  }
}
