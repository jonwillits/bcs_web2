import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { createBlockSchema } from '@/lib/quiz/schemas';

/**
 * POST /api/quizzes/[quizId]/blocks
 * Add a block to a quiz. Verifies that the set belongs to the same module's bank.
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

    const body = await request.json();
    const parsed = createBlockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await withDatabaseRetry(async () => {
      // Get quiz and its module
      const quiz = await prisma.quizzes.findUnique({
        where: { id: quizId },
        select: { id: true, module_id: true },
      });

      if (!quiz) {
        return { error: 'Quiz not found', status: 404 };
      }

      // Check permission on module
      const canEdit = await canEditModuleWithRetry(session.user!.id, quiz.module_id);
      if (!canEdit) {
        return { error: 'Forbidden', status: 403 };
      }

      // Verify the set belongs to this module's bank
      const set = await prisma.question_sets.findUnique({
        where: { id: parsed.data.set_id },
        include: {
          bank: { select: { module_id: true } },
        },
      });

      if (!set) {
        return { error: 'Question set not found', status: 404 };
      }

      if (set.bank.module_id !== quiz.module_id) {
        return {
          error: 'Question set does not belong to this module\'s bank',
          status: 400,
        };
      }

      // Verify questions_to_pull doesn't exceed available questions
      const membershipCount = await prisma.question_set_memberships.count({
        where: { set_id: parsed.data.set_id },
      });

      if (parsed.data.questions_to_pull > membershipCount) {
        return {
          error: `Set only has ${membershipCount} questions, cannot pull ${parsed.data.questions_to_pull}`,
          status: 400,
        };
      }

      const block = await prisma.quiz_blocks.create({
        data: {
          quiz_id: quizId,
          set_id: parsed.data.set_id,
          title: parsed.data.title,
          show_title: parsed.data.show_title,
          questions_to_pull: parsed.data.questions_to_pull,
          randomize_within: parsed.data.randomize_within,
          sort_order: parsed.data.sort_order,
        },
        include: {
          set: true,
        },
      });

      return { block };
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ block: result.block }, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz block:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz block' },
      { status: 500 }
    );
  }
}
