import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { importBankSchema } from '@/lib/quiz/schemas';

/**
 * POST /api/modules/[id]/question-bank/import
 * Import questions from JSON into the question bank.
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
    const parsed = importBankSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { bank: importData } = parsed.data;

    const result = await withDatabaseRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        // Get or create the bank
        let bank = await tx.question_banks.findUnique({
          where: { module_id: moduleId },
        });

        if (!bank) {
          const mod = await tx.modules.findUnique({
            where: { id: moduleId },
            select: { title: true },
          });

          bank = await tx.question_banks.create({
            data: {
              module_id: moduleId,
              title: importData.title || (mod ? `${mod.title} – Question Bank` : 'Question Bank'),
            },
          });
        } else if (importData.title) {
          bank = await tx.question_banks.update({
            where: { id: bank.id },
            data: { title: importData.title },
          });
        }

        // Get current max sort_order for questions in this bank
        const maxQResult = await tx.bank_questions.aggregate({
          where: { bank_id: bank.id },
          _max: { sort_order: true },
        });
        let nextQSortOrder = (maxQResult._max.sort_order ?? -1) + 1;

        // Create questions with options
        const createdQuestions = [];
        for (const q of importData.questions) {
          const question = await tx.bank_questions.create({
            data: {
              bank_id: bank.id,
              question_type: q.type,
              question_text: q.text,
              image_url: q.image_url ?? null,
              shuffle_answers: q.shuffle_answers,
              points: q.points,
              tags: q.tags,
              sort_order: nextQSortOrder++,
              options: {
                create: q.options.map((opt, oi) => ({
                  option_text: opt.text,
                  is_correct: opt.is_correct,
                  explanation: opt.explanation ?? null,
                  sort_order: oi,
                })),
              },
            },
          });
          createdQuestions.push(question);
        }

        // Create sets with memberships
        let setsCreated = 0;
        if (importData.sets && importData.sets.length > 0) {
          const maxSResult = await tx.question_sets.aggregate({
            where: { bank_id: bank.id },
            _max: { sort_order: true },
          });
          let nextSSortOrder = (maxSResult._max.sort_order ?? -1) + 1;

          for (const s of importData.sets) {
            // Map question_indexes to actual question IDs
            const membershipData = s.question_indexes
              .filter((idx) => idx >= 0 && idx < createdQuestions.length)
              .map((idx, mi) => ({
                question_id: createdQuestions[idx].id,
                sort_order: mi,
              }));

            await tx.question_sets.create({
              data: {
                bank_id: bank.id,
                title: s.title,
                tags: s.tags,
                sort_order: nextSSortOrder++,
                memberships: {
                  create: membershipData,
                },
              },
            });
            setsCreated++;
          }
        }

        return {
          bank_id: bank.id,
          questions_created: createdQuestions.length,
          sets_created: setsCreated,
        };
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error importing question bank:', error);
    return NextResponse.json(
      { error: 'Failed to import question bank' },
      { status: 500 }
    );
  }
}
