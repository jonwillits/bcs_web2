import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/faculty/analytics/[courseId]
 * Get detailed analytics for a course (faculty/admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    const { courseId } = await params;

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify course exists
    const course = await withDatabaseRetry(async () => {
      return await prisma.courses.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          author_id: true,
          status: true,
        },
      });
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Only course author or admin can view analytics
    const isAuthor = course.author_id === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view analytics for this course' },
        { status: 403 }
      );
    }

    // Fetch enrollment data
    const enrollments = await withDatabaseRetry(async () => {
      return await prisma.course_tracking.findMany({
        where: {
          course_id: courseId,
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
          completion_pct: true,
          modules_completed: true,
          modules_total: true,
          started_at: true,
          last_accessed: true,
        },
      });
    });

    // Calculate enrollment stats
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(e => e.completion_pct === 100).length;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeEnrollments = enrollments.filter(e => e.last_accessed >= sevenDaysAgo).length;

    // Calculate completion rate
    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    // Calculate average progress
    const averageProgress = totalEnrollments > 0
      ? Math.round(
          enrollments.reduce((sum, e) => sum + e.completion_pct, 0) / totalEnrollments
        )
      : 0;

    // Fetch module-level analytics
    const moduleProgress = await withDatabaseRetry(async () => {
      return await prisma.module_progress.findMany({
        where: {
          course_id: courseId,
        },
        select: {
          module_id: true,
          status: true,
          completed_at: true,
          module: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });
    });

    // Group by module and calculate stats
    const moduleStatsMap = new Map<string, {
      moduleId: string;
      moduleTitle: string;
      moduleSlug: string;
      startedCount: number;
      completedCount: number;
      dropoffRate: number;
    }>();

    moduleProgress.forEach(progress => {
      const moduleId = progress.module_id;
      if (!moduleStatsMap.has(moduleId)) {
        moduleStatsMap.set(moduleId, {
          moduleId: progress.module.id,
          moduleTitle: progress.module.title,
          moduleSlug: progress.module.slug,
          startedCount: 0,
          completedCount: 0,
          dropoffRate: 0,
        });
      }

      const stats = moduleStatsMap.get(moduleId)!;
      if (progress.status === 'in_progress' || progress.status === 'completed') {
        stats.startedCount++;
      }
      if (progress.status === 'completed') {
        stats.completedCount++;
      }
    });

    // Calculate dropoff rates
    const moduleAnalytics = Array.from(moduleStatsMap.values()).map(stats => ({
      ...stats,
      dropoffRate: stats.startedCount > 0
        ? Math.round(((stats.startedCount - stats.completedCount) / stats.startedCount) * 100)
        : 0,
      completionRate: stats.startedCount > 0
        ? Math.round((stats.completedCount / stats.startedCount) * 100)
        : 0,
    }));

    // Sort by completion count (most popular first)
    moduleAnalytics.sort((a, b) => b.completedCount - a.completedCount);

    // Get recent activity (last 10 completions)
    const recentActivity = await withDatabaseRetry(async () => {
      return await prisma.module_progress.findMany({
        where: {
          course_id: courseId,
          status: 'completed',
          completed_at: {
            not: null,
          },
        },
        select: {
          module: {
            select: {
              title: true,
            },
          },
          completed_at: true,
        },
        orderBy: {
          completed_at: 'desc',
        },
        take: 10,
      });
    });

    // Get enrollment trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const enrollmentTrend = await withDatabaseRetry(async () => {
      return await prisma.course_tracking.groupBy({
        by: ['started_at'],
        where: {
          course_id: courseId,
          started_at: {
            gte: thirtyDaysAgo,
          },
        },
        _count: {
          id: true,
        },
      });
    });

    // Format enrollment trend by day
    const enrollmentByDay = enrollmentTrend.map(item => ({
      date: item.started_at.toISOString().split('T')[0],
      count: item._count.id,
    }));

    return NextResponse.json({
      courseTitle: course.title,
      enrollment: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
      },
      completionRate,
      averageProgress,
      moduleAnalytics,
      recentActivity: recentActivity.map(activity => ({
        moduleTitle: activity.module.title,
        completedAt: activity.completed_at,
      })),
      enrollmentTrend: enrollmentByDay,
    });

  } catch (error) {
    console.error('Error fetching course analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course analytics' },
      { status: 500 }
    );
  }
}
