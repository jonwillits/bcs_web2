import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/admin/analytics
 * Get platform-wide analytics (admin only)
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

    // Calculate date thresholds
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all analytics in parallel
    const [
      // User statistics
      totalUsers,
      studentCount,
      facultyCount,
      pendingFacultyCount,
      adminCount,
      activeUsers,
      suspendedUsers,
      unverifiedUsers,

      // Content statistics
      totalCourses,
      publishedCourses,
      draftCourses,
      totalModules,
      publishedModules,

      // Enrollment statistics
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,

      // Recent activity
      recentUsers,
      recentCourses,
      recentEnrollments,

      // User growth (last 30 days)
      userGrowth,
    ] = await Promise.all([
      // User counts
      withDatabaseRetry(() => prisma.users.count()),
      withDatabaseRetry(() => prisma.users.count({ where: { role: 'student' } })),
      withDatabaseRetry(() => prisma.users.count({ where: { role: 'faculty' } })),
      withDatabaseRetry(() => prisma.users.count({ where: { role: 'pending_faculty' } })),
      withDatabaseRetry(() => prisma.users.count({ where: { role: 'admin' } })),
      withDatabaseRetry(() => prisma.users.count({ where: { updated_at: { gte: sevenDaysAgo } } })),
      withDatabaseRetry(() => prisma.users.count({ where: { account_status: 'suspended' } })),
      withDatabaseRetry(() => prisma.users.count({ where: { email_verified: false } })),

      // Content counts
      withDatabaseRetry(() => prisma.courses.count()),
      withDatabaseRetry(() => prisma.courses.count({ where: { status: 'published' } })),
      withDatabaseRetry(() => prisma.courses.count({ where: { status: 'draft' } })),
      withDatabaseRetry(() => prisma.modules.count()),
      withDatabaseRetry(() => prisma.modules.count({ where: { status: 'published' } })),

      // Enrollment counts
      withDatabaseRetry(() => prisma.course_tracking.count()),
      withDatabaseRetry(() => prisma.course_tracking.count({
        where: { last_accessed: { gte: sevenDaysAgo } }
      })),
      withDatabaseRetry(() => prisma.course_tracking.count({
        where: { completion_pct: 100 }
      })),

      // Recent activity
      withDatabaseRetry(() => prisma.users.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      })),
      withDatabaseRetry(() => prisma.courses.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          created_at: true,
          users: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      })),
      withDatabaseRetry(() => prisma.course_tracking.findMany({
        select: {
          id: true,
          started_at: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { started_at: 'desc' },
        take: 10,
      })),

      // User growth trend
      withDatabaseRetry(() => prisma.users.groupBy({
        by: ['created_at'],
        where: {
          created_at: { gte: thirtyDaysAgo },
        },
        _count: {
          id: true,
        },
      })),
    ]);

    // Calculate enrollment completion rate
    const enrollmentCompletionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    // Format user growth by day
    const userGrowthByDay = userGrowth.map(item => ({
      date: item.created_at.toISOString().split('T')[0],
      count: item._count.id,
    }));

    // Fill in missing days with 0 for better visualization
    const last30Days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const existing = userGrowthByDay.find(d => d.date === dateStr);
      last30Days.push({
        date: dateStr,
        count: existing?.count || 0,
      });
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: {
          student: studentCount,
          faculty: facultyCount,
          pending_faculty: pendingFacultyCount,
          admin: adminCount,
        },
        active: activeUsers,
        suspended: suspendedUsers,
        unverified: unverifiedUsers,
      },
      content: {
        courses: {
          total: totalCourses,
          published: publishedCourses,
          draft: draftCourses,
        },
        modules: {
          total: totalModules,
          published: publishedModules,
        },
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
        completionRate: enrollmentCompletionRate,
      },
      recentActivity: {
        users: recentUsers,
        courses: recentCourses,
        enrollments: recentEnrollments,
      },
      trends: {
        userGrowth: last30Days,
      },
    });
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
