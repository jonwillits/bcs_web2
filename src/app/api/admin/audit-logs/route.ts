import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/admin/audit-logs
 * Get admin audit logs with filtering (admin only)
 * Query params:
 * - action: Filter by action type
 * - admin_id: Filter by admin who performed the action
 * - target_type: Filter by target type (user, course, module, etc.)
 * - page: Page number (default 1)
 * - limit: Results per page (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication and admin role
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const actionFilter = searchParams.get('action');
    const adminIdFilter = searchParams.get('admin_id');
    const targetTypeFilter = searchParams.get('target_type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (actionFilter) {
      where.action = actionFilter;
    }

    if (adminIdFilter) {
      where.admin_id = adminIdFilter;
    }

    if (targetTypeFilter) {
      where.target_type = targetTypeFilter;
    }

    // Fetch logs with pagination
    const [logs, totalCount] = await Promise.all([
      withDatabaseRetry(async () => {
        return await prisma.admin_audit_logs.findMany({
          where,
          select: {
            id: true,
            action: true,
            target_type: true,
            target_id: true,
            reason: true,
            details: true,
            created_at: true,
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        });
      }),
      withDatabaseRetry(async () => {
        return await prisma.admin_audit_logs.count({ where });
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
