import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { updateSetSchema } from '@/lib/quiz/schemas';

/**
 * PUT /api/modules/[id]/question-bank/sets/[setId]
 * Update a question set (title, description, tags).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: moduleId, setId } = await params;

    const canEdit = await canEditModuleWithRetry(session.user.id, moduleId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const set = await withDatabaseRetry(async () => {
      // Verify the set belongs to this module's bank
      const bank = await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
        select: { id: true },
      });

      if (!bank) {
        return null;
      }

      const existing = await prisma.question_sets.findFirst({
        where: { id: setId, bank_id: bank.id },
      });

      if (!existing) {
        return null;
      }

      return await prisma.question_sets.update({
        where: { id: setId },
        data: parsed.data,
        include: {
          memberships: {
            orderBy: { sort_order: 'asc' },
            include: {
              question: {
                include: {
                  options: { orderBy: { sort_order: 'asc' } },
                },
              },
            },
          },
        },
      });
    });

    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }

    return NextResponse.json({ set });
  } catch (error) {
    console.error('Error updating question set:', error);
    return NextResponse.json(
      { error: 'Failed to update question set' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/modules/[id]/question-bank/sets/[setId]
 * Delete a question set (cascade deletes memberships).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: moduleId, setId } = await params;

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

      const existing = await prisma.question_sets.findFirst({
        where: { id: setId, bank_id: bank.id },
      });

      if (!existing) {
        throw new Error('SET_NOT_FOUND');
      }

      // Delete set (cascade handles memberships)
      await prisma.question_sets.delete({
        where: { id: setId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BANK_NOT_FOUND' || error.message === 'SET_NOT_FOUND') {
        return NextResponse.json({ error: 'Set not found' }, { status: 404 });
      }
    }
    console.error('Error deleting question set:', error);
    return NextResponse.json(
      { error: 'Failed to delete question set' },
      { status: 500 }
    );
  }
}
