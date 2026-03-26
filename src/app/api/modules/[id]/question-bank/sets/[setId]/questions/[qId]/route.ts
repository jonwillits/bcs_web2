import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';

/**
 * DELETE /api/modules/[id]/question-bank/sets/[setId]/questions/[qId]
 * Remove a question from a set (deletes the membership, not the question itself).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string; qId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: moduleId, setId, qId } = await params;

    const canEdit = await canEditModuleWithRetry(session.user.id, moduleId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await withDatabaseRetry(async () => {
      // Verify the set belongs to this module's bank
      const bank = await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
        select: { id: true },
      });

      if (!bank) {
        throw new Error('BANK_NOT_FOUND');
      }

      const set = await prisma.question_sets.findFirst({
        where: { id: setId, bank_id: bank.id },
      });

      if (!set) {
        throw new Error('SET_NOT_FOUND');
      }

      // Find and delete the membership
      const membership = await prisma.question_set_memberships.findFirst({
        where: { set_id: setId, question_id: qId },
      });

      if (!membership) {
        throw new Error('MEMBERSHIP_NOT_FOUND');
      }

      await prisma.question_set_memberships.delete({
        where: { id: membership.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BANK_NOT_FOUND' || error.message === 'SET_NOT_FOUND') {
        return NextResponse.json({ error: 'Set not found' }, { status: 404 });
      }
      if (error.message === 'MEMBERSHIP_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Question is not in this set' },
          { status: 404 }
        );
      }
    }
    console.error('Error removing question from set:', error);
    return NextResponse.json(
      { error: 'Failed to remove question from set' },
      { status: 500 }
    );
  }
}
