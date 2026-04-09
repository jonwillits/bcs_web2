import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions';

/**
 * DELETE /api/faculty/courses/[id]/groups/[groupId]/members/[userId]
 * Remove a single member from a group.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, groupId, userId } = await params;
    const hasAccess = await canEditCourseWithRetry(session.user.id, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this course' },
        { status: 403 }
      );
    }

    // Verify the group belongs to this course, and the membership exists
    const group = await withDatabaseRetry(async () => {
      return prisma.course_groups.findUnique({
        where: { id: groupId },
        select: { id: true, course_id: true },
      });
    });
    if (!group || group.course_id !== courseId) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const deleted = await withDatabaseRetry(async () => {
      return prisma.course_group_memberships.deleteMany({
        where: { group_id: groupId, user_id: userId },
      });
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing group member:', error);
    return NextResponse.json(
      { error: 'Failed to remove group member' },
      { status: 500 }
    );
  }
}
