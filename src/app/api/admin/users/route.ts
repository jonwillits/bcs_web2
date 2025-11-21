import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/admin/users
 * Get all users with search and filtering (admin only)
 * Query params:
 * - search: Search by name or email
 * - role: Filter by role (student, faculty, pending_faculty, admin)
 * - status: Filter by account_status (active, suspended, pending_approval)
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
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleFilter !== 'all') {
      where.role = roleFilter;
    }

    if (statusFilter !== 'all') {
      where.account_status = statusFilter;
    }

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      withDatabaseRetry(async () => {
        return await prisma.users.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            account_status: true,
            email_verified: true,
            created_at: true,
            updated_at: true,
            // Student fields
            major: true,
            graduation_year: true,
            // Faculty fields
            title: true,
            department: true,
            research_area: true,
            // Counts
            _count: {
              select: {
                courses: true,
                modules: true,
                started_courses: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        });
      }),
      withDatabaseRetry(async () => {
        return await prisma.users.count({ where });
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
