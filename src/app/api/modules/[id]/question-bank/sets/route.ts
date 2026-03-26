import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { createSetSchema } from '@/lib/quiz/schemas';

/**
 * POST /api/modules/[id]/question-bank/sets
 * Create a question set in the module's question bank.
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
    const parsed = createSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const set = await withDatabaseRetry(async () => {
      // Get the bank (must exist)
      const bank = await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
      });

      if (!bank) {
        return null;
      }

      return await prisma.question_sets.create({
        data: {
          bank_id: bank.id,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          sort_order: parsed.data.sort_order,
          tags: parsed.data.tags,
        },
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
      return NextResponse.json(
        { error: 'Question bank not found. Open the question bank first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ set }, { status: 201 });
  } catch (error) {
    console.error('Error creating question set:', error);
    return NextResponse.json(
      { error: 'Failed to create question set' },
      { status: 500 }
    );
  }
}
