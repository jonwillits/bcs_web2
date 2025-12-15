import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { type, id, status } = body;

    // Validate input
    if (!type || !id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: type, id, status' },
        { status: 400 }
      );
    }

    if (type !== 'course' && type !== 'module') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "course" or "module"' },
        { status: 400 }
      );
    }

    if (status !== 'draft' && status !== 'published') {
      return NextResponse.json(
        { error: 'Invalid status. Must be "draft" or "published"' },
        { status: 400 }
      );
    }

    // Update status
    await withDatabaseRetry(async () => {
      if (type === 'course') {
        return await prisma.courses.update({
          where: { id },
          data: { status },
        });
      } else {
        return await prisma.modules.update({
          where: { id },
          data: { status },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'course' ? 'Course' : 'Module'} status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
