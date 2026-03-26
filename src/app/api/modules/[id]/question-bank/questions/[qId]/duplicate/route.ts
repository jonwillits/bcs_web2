import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';

/**
 * POST /api/modules/[id]/question-bank/questions/[qId]/duplicate
 * Duplicate a question within the same bank. Copies question + options,
 * sets cloned_from, and assigns sort_order = max + 1.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: moduleId, qId } = await params;

    const canEdit = await canEditModuleWithRetry(session.user.id, moduleId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const duplicate = await withDatabaseRetry(async () => {
      // Verify the question belongs to this module's bank
      const bank = await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
        select: { id: true },
      });

      if (!bank) {
        throw new Error('BANK_NOT_FOUND');
      }

      const original = await prisma.bank_questions.findFirst({
        where: { id: qId, bank_id: bank.id },
        include: {
          options: { orderBy: { sort_order: 'asc' } },
        },
      });

      if (!original) {
        throw new Error('QUESTION_NOT_FOUND');
      }

      // Get max sort_order in the bank
      const maxResult = await prisma.bank_questions.aggregate({
        where: { bank_id: bank.id },
        _max: { sort_order: true },
      });
      const nextSortOrder = (maxResult._max.sort_order ?? 0) + 1;

      // Create the duplicate
      return await prisma.bank_questions.create({
        data: {
          bank_id: bank.id,
          question_type: original.question_type,
          question_text: original.question_text,
          image_url: original.image_url,
          sort_order: nextSortOrder,
          points: original.points,
          shuffle_answers: original.shuffle_answers,
          tags: original.tags,
          cloned_from: original.id,
          version: 1,
          options: {
            create: original.options.map((opt) => ({
              option_text: opt.option_text,
              is_correct: opt.is_correct,
              explanation: opt.explanation,
              sort_order: opt.sort_order,
            })),
          },
        },
        include: {
          options: { orderBy: { sort_order: 'asc' } },
        },
      });
    });

    return NextResponse.json({ question: duplicate }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BANK_NOT_FOUND') {
        return NextResponse.json({ error: 'Question bank not found' }, { status: 404 });
      }
      if (error.message === 'QUESTION_NOT_FOUND') {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
    }
    console.error('Error duplicating question:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate question' },
      { status: 500 }
    );
  }
}
