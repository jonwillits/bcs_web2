import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { updateQuestionSchema } from '@/lib/quiz/schemas';

/**
 * PUT /api/modules/[id]/question-bank/questions/[qId]
 * Update a question (increments version). Replaces all options.
 */
export async function PUT(
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

    const body = await request.json();
    const parsed = updateQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const question = await withDatabaseRetry(async () => {
      // Verify the question belongs to this module's bank
      const bank = await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
        select: { id: true },
      });

      if (!bank) {
        throw new Error('BANK_NOT_FOUND');
      }

      const existing = await prisma.bank_questions.findFirst({
        where: { id: qId, bank_id: bank.id },
      });

      if (!existing) {
        throw new Error('QUESTION_NOT_FOUND');
      }

      const { options, ...questionData } = parsed.data;

      return await prisma.$transaction(async (tx) => {
        // Update the question and increment version
        const updated = await tx.bank_questions.update({
          where: { id: qId },
          data: {
            ...questionData,
            version: { increment: 1 },
          },
        });

        // Replace options if provided
        if (options) {
          await tx.bank_question_options.deleteMany({
            where: { question_id: qId },
          });

          await tx.bank_question_options.createMany({
            data: options.map((opt) => ({
              question_id: qId,
              option_text: opt.option_text,
              is_correct: opt.is_correct,
              explanation: opt.explanation ?? null,
              sort_order: opt.sort_order,
            })),
          });
        }

        // Return the updated question with new options
        return await tx.bank_questions.findUnique({
          where: { id: qId },
          include: {
            options: { orderBy: { sort_order: 'asc' } },
          },
        });
      });
    });

    return NextResponse.json({ question });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BANK_NOT_FOUND') {
        return NextResponse.json({ error: 'Question bank not found' }, { status: 404 });
      }
      if (error.message === 'QUESTION_NOT_FOUND') {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
    }
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/modules/[id]/question-bank/questions/[qId]
 * Delete a question (cascade deletes options and set memberships).
 */
export async function DELETE(
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

    await withDatabaseRetry(async () => {
      // Verify the question belongs to this module's bank
      const bank = await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
        select: { id: true },
      });

      if (!bank) {
        throw new Error('BANK_NOT_FOUND');
      }

      const existing = await prisma.bank_questions.findFirst({
        where: { id: qId, bank_id: bank.id },
      });

      if (!existing) {
        throw new Error('QUESTION_NOT_FOUND');
      }

      // Delete question (cascade handles options and memberships)
      await prisma.bank_questions.delete({
        where: { id: qId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BANK_NOT_FOUND') {
        return NextResponse.json({ error: 'Question bank not found' }, { status: 404 });
      }
      if (error.message === 'QUESTION_NOT_FOUND') {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
    }
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
