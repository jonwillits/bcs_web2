import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { createQuestionSchema } from '@/lib/quiz/schemas';

/**
 * POST /api/modules/[id]/question-bank/questions
 * Create a new question with options in the module's question bank.
 */
export async function POST(
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
    const parsed = createQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const question = await withDatabaseRetry(async () => {
      // Get the bank for this module
      const bank = await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
        select: { id: true },
      });

      if (!bank) {
        throw new Error('BANK_NOT_FOUND');
      }

      const { options, ...questionData } = parsed.data;

      return await prisma.bank_questions.create({
        data: {
          bank_id: bank.id,
          question_type: questionData.question_type,
          question_text: questionData.question_text,
          image_url: questionData.image_url ?? null,
          sort_order: questionData.sort_order,
          points: questionData.points,
          shuffle_answers: questionData.shuffle_answers,
          tags: questionData.tags,
          options: {
            create: options.map((opt) => ({
              option_text: opt.option_text,
              is_correct: opt.is_correct,
              explanation: opt.explanation ?? null,
              sort_order: opt.sort_order,
            })),
          },
        },
        include: {
          options: { orderBy: { sort_order: 'asc' } },
        },
      });
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'BANK_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Question bank not found. Open the question bank first.' },
        { status: 404 }
      );
    }
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
