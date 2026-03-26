import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { reorderSetsSchema } from '@/lib/quiz/schemas';

/**
 * PUT /api/modules/[id]/question-bank/sets/reorder
 * Reorder question sets by updating sort_order based on array index.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: moduleId } = await params;

    const canEdit = await canEditModuleWithRetry(session.user.id, moduleId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = reorderSetsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { setIds } = parsed.data;

    await withDatabaseRetry(async () => {
      // Verify the bank exists for this module
      const bank = await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
        select: { id: true },
      });

      if (!bank) {
        throw new Error('BANK_NOT_FOUND');
      }

      // Update sort_order for each set in a transaction
      await prisma.$transaction(
        setIds.map((setId, index) =>
          prisma.question_sets.updateMany({
            where: { id: setId, bank_id: bank.id },
            data: { sort_order: index },
          })
        )
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'BANK_NOT_FOUND') {
      return NextResponse.json({ error: 'Question bank not found' }, { status: 404 });
    }
    console.error('Error reordering question sets:', error);
    return NextResponse.json(
      { error: 'Failed to reorder question sets' },
      { status: 500 }
    );
  }
}
