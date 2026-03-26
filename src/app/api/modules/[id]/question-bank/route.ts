import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { updateBankSchema } from '@/lib/quiz/schemas';

/**
 * GET /api/modules/[id]/question-bank
 * Get or auto-create question bank for a module (faculty/admin only).
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
      // Try to find existing bank
      let existing = await prisma.question_banks.findUnique({
        where: { module_id: moduleId },
        include: {
          sets: {
            orderBy: { sort_order: 'asc' },
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
          },
          questions: {
            orderBy: { sort_order: 'asc' },
            include: {
              options: { orderBy: { sort_order: 'asc' } },
            },
          },
        },
      });

      // Auto-create if it doesn't exist
      if (!existing) {
        // Fetch module title for default bank name
        const mod = await prisma.modules.findUnique({
          where: { id: moduleId },
          select: { title: true },
        });

        existing = await prisma.question_banks.create({
          data: {
            module_id: moduleId,
            title: mod ? `${mod.title} – Question Bank` : 'Question Bank',
          },
          include: {
            sets: {
              orderBy: { sort_order: 'asc' },
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
            },
            questions: {
              orderBy: { sort_order: 'asc' },
              include: {
                options: { orderBy: { sort_order: 'asc' } },
              },
            },
          },
        });
      }

      return existing;
    });

    return NextResponse.json({ bank });
  } catch (error) {
    console.error('Error fetching question bank:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question bank' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/modules/[id]/question-bank
 * Update bank metadata (title, description).
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
    const parsed = updateBankSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const bank = await withDatabaseRetry(async () => {
      return await prisma.question_banks.update({
        where: { module_id: moduleId },
        data: parsed.data,
      });
    });

    return NextResponse.json({ bank });
  } catch (error) {
    console.error('Error updating question bank:', error);
    return NextResponse.json(
      { error: 'Failed to update question bank' },
      { status: 500 }
    );
  }
}
