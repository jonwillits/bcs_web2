import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions';

const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  canvas_course_id: z.string().trim().max(100).optional().nullable(),
});

// Helper: look up group and confirm it belongs to the expected course.
// Returns null if not found or course mismatch (treat both as 404).
async function findGroupInCourse(groupId: string, courseId: string) {
  return withDatabaseRetry(async () => {
    const group = await prisma.course_groups.findUnique({
      where: { id: groupId },
      select: { id: true, course_id: true, name: true },
    });
    if (!group || group.course_id !== courseId) return null;
    return group;
  });
}

/**
 * PATCH /api/faculty/courses/[id]/groups/[groupId]
 * Update a group's name, description, or canvas_course_id.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, groupId } = await params;
    const hasAccess = await canEditCourseWithRetry(session.user.id, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this course' },
        { status: 403 }
      );
    }

    const existing = await findGroupInCourse(groupId, courseId);
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates = updateGroupSchema.parse(body);

    // If renaming, check for collision with another group in this course
    if (updates.name && updates.name !== existing.name) {
      const collision = await withDatabaseRetry(async () => {
        return prisma.course_groups.findFirst({
          where: {
            course_id: courseId,
            name: updates.name!,
            NOT: { id: groupId },
          },
          select: { id: true },
        });
      });
      if (collision) {
        return NextResponse.json(
          { error: `A group named "${updates.name}" already exists in this course` },
          { status: 409 }
        );
      }
    }

    const updated = await withDatabaseRetry(async () => {
      return prisma.course_groups.update({
        where: { id: groupId },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.description !== undefined && {
            description: updates.description || null,
          }),
          ...(updates.canvas_course_id !== undefined && {
            canvas_course_id: updates.canvas_course_id || null,
          }),
        },
        include: {
          _count: { select: { memberships: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json({
      group: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        canvasCourseId: updated.canvas_course_id,
        memberCount: updated._count.memberships,
        createdAt: updated.created_at.toISOString(),
        updatedAt: updated.updated_at.toISOString(),
        creator: updated.creator,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating course group:', error);
    return NextResponse.json(
      { error: 'Failed to update course group' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/faculty/courses/[id]/groups/[groupId]
 * Delete a group. Memberships cascade via the FK.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, groupId } = await params;
    const hasAccess = await canEditCourseWithRetry(session.user.id, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this course' },
        { status: 403 }
      );
    }

    const existing = await findGroupInCourse(groupId, courseId);
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    await withDatabaseRetry(async () => {
      return prisma.course_groups.delete({ where: { id: groupId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course group:', error);
    return NextResponse.json(
      { error: 'Failed to delete course group' },
      { status: 500 }
    );
  }
}
