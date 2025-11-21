import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/admin/users/[userId]
 * Get detailed user information (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const user = await withDatabaseRetry(async () => {
      return await prisma.users.findUnique({
        where: { id: userId },
        include: {
          courses: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          modules: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          started_courses: {
            select: {
              course_id: true,
              started_at: true,
              completion_pct: true,
              course: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
            orderBy: { started_at: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              courses: true,
              modules: true,
              started_courses: true,
            },
          },
        },
      });
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users/[userId]
 * Update user role or account status (admin only)
 * Body: { role?, account_status?, admin_note? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { role, account_status, admin_note } = body;

    // Prevent admin from modifying their own role or status
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account role or status' },
        { status: 400 }
      );
    }

    // Verify user exists
    const existingUser = await withDatabaseRetry(async () => {
      return await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, role: true, account_status: true, email: true, name: true },
      });
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (account_status !== undefined) updateData.account_status = account_status;

    // Update user
    const updatedUser = await withDatabaseRetry(async () => {
      return await prisma.users.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          account_status: true,
          email_verified: true,
          created_at: true,
          updated_at: true,
        },
      });
    });

    // Log admin action in audit log
    const actionDetails: any = {};
    if (role !== undefined && role !== existingUser.role) {
      actionDetails.role_change = { from: existingUser.role, to: role };
    }
    if (account_status !== undefined && account_status !== existingUser.account_status) {
      actionDetails.status_change = { from: existingUser.account_status, to: account_status };
    }

    await withDatabaseRetry(async () => {
      return await prisma.admin_audit_logs.create({
        data: {
          admin_id: session.user.id!,
          action: role !== undefined ? 'role_change' : 'status_change',
          target_type: 'user',
          target_id: userId,
          reason: admin_note || null,
          details: actionDetails,
        },
      });
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Delete a user (admin only)
 * This will cascade delete related data (sessions, courses, modules, etc.)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user info before deletion (for audit log)
    const userToDelete = await withDatabaseRetry(async () => {
      return await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          account_status: true,
          _count: {
            select: {
              courses: true,
              modules: true,
              started_courses: true,
            },
          },
        },
      });
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade will handle related data)
    await withDatabaseRetry(async () => {
      return await prisma.users.delete({
        where: { id: userId },
      });
    });

    // Log admin action
    await withDatabaseRetry(async () => {
      return await prisma.admin_audit_logs.create({
        data: {
          admin_id: session.user.id!,
          action: 'deleted_user',
          target_type: 'user',
          target_id: userId,
          details: {
            user_email: userToDelete.email,
            user_name: userToDelete.name,
            user_role: userToDelete.role,
            cascaded_data: {
              courses: userToDelete._count.courses,
              modules: userToDelete._count.modules,
              enrollments: userToDelete._count.started_courses,
            },
          },
        },
      });
    });

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: userToDelete.id,
        email: userToDelete.email,
        name: userToDelete.name,
      },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
