import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { addQuestionsToSetSchema } from '@/lib/quiz/schemas';

/**
 * POST /api/modules/[id]/question-bank/sets/[setId]/questions
 * Add questions to a question set by creating memberships.
 */
export async function POST(
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
    const parsed = addQuestionsToSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { question_ids } = parsed.data;

    const memberships = await withDatabaseRetry(async () => {
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

      // Verify all questions belong to this bank
      const questions = await prisma.bank_questions.findMany({
        where: { id: { in: question_ids }, bank_id: bank.id },
        select: { id: true },
      });

      const validIds = new Set(questions.map((q) => q.id));
      const invalidIds = question_ids.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw new Error(`INVALID_QUESTIONS:${invalidIds.join(',')}`);
      }

      // Get current max sort_order in this set
      const maxResult = await prisma.question_set_memberships.aggregate({
        where: { set_id: setId },
        _max: { sort_order: true },
      });
      let nextSortOrder = (maxResult._max.sort_order ?? -1) + 1;

      // Create memberships, skipping duplicates
      const created = [];
      for (const questionId of question_ids) {
        try {
          const membership = await prisma.question_set_memberships.create({
            data: {
              set_id: setId,
              question_id: questionId,
              sort_order: nextSortOrder++,
            },
          });
          created.push(membership);
        } catch (e: unknown) {
          // Skip unique constraint violations (question already in set)
          if (
            e instanceof Error &&
            'code' in e &&
            (e as { code: string }).code === 'P2002'
          ) {
            continue;
          }
          throw e;
        }
      }

      return created;
    });

    return NextResponse.json(
      { memberships, added: memberships.length },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BANK_NOT_FOUND') {
        return NextResponse.json({ error: 'Question bank not found' }, { status: 404 });
      }
      if (error.message === 'SET_NOT_FOUND') {
        return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
      }
      if (error.message.startsWith('INVALID_QUESTIONS:')) {
        const ids = error.message.split(':')[1];
        return NextResponse.json(
          { error: `Questions not found in this bank: ${ids}` },
          { status: 400 }
        );
      }
    }
    console.error('Error adding questions to set:', error);
    return NextResponse.json(
      { error: 'Failed to add questions to set' },
      { status: 500 }
    );
  }
}
