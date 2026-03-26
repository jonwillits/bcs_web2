import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';

/**
 * GET /api/modules/[id]/question-bank/export
 * Export the question bank as JSON.
 */
export async function GET(
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

    const bank = await withDatabaseRetry(async () => {
      return await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
        include: {
          questions: {
            orderBy: { sort_order: 'asc' },
            include: {
              options: { orderBy: { sort_order: 'asc' } },
            },
          },
          sets: {
            orderBy: { sort_order: 'asc' },
            include: {
              memberships: {
                orderBy: { sort_order: 'asc' },
                include: {
                  question: { select: { id: true } },
                },
              },
            },
          },
        },
      });
    });

    if (!bank) {
      return NextResponse.json({ error: 'No question bank found' }, { status: 404 });
    }

    // Build a map from question id to its index in the questions array
    const questionIdToIndex = new Map<string, number>();
    bank.questions.forEach((q, idx) => {
      questionIdToIndex.set(q.id, idx);
    });

    const exportData = {
      schema_version: 1,
      exported_at: new Date().toISOString(),
      bank: {
        title: bank.title,
        questions: bank.questions.map((q) => ({
          type: q.question_type,
          text: q.question_text,
          image_url: q.image_url,
          shuffle_answers: q.shuffle_answers,
          points: q.points,
          tags: q.tags,
          options: q.options.map((o) => ({
            text: o.option_text,
            is_correct: o.is_correct,
            explanation: o.explanation,
          })),
        })),
        sets: bank.sets.map((s) => ({
          title: s.title,
          tags: s.tags,
          question_indexes: s.memberships
            .map((m) => questionIdToIndex.get(m.question.id))
            .filter((idx): idx is number => idx !== undefined),
        })),
      },
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting question bank:', error);
    return NextResponse.json(
      { error: 'Failed to export question bank' },
      { status: 500 }
    );
  }
}
