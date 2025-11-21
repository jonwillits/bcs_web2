import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { AuthenticatedLayout } from '@/components/layouts/app-layout';
import { LearningDashboard } from '@/components/learning/LearningDashboard';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

async function getUserLearningData(userId: string) {
  try {
    // Fetch enrolled courses
    const enrolledCourses = await withDatabaseRetry(async () => {
      return await prisma.course_tracking.findMany({
        where: {
          user_id: userId,
          status: 'active',
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              status: true,
              users: {
                select: {
                  id: true,
                  name: true,
                  avatar_url: true,
                  university: true,
                },
              },
              _count: {
                select: {
                  course_modules: true,
                },
              },
            },
          },
        },
        orderBy: {
          last_accessed: 'desc',
        },
      });
    });

    // Get total completed modules across all courses
    const totalCompletedModules = await withDatabaseRetry(async () => {
      return await prisma.module_progress.count({
        where: {
          user_id: userId,
          status: 'completed',
        },
      });
    });

    // Get recently completed modules (last 10)
    const recentActivity = await withDatabaseRetry(async () => {
      return await prisma.module_progress.findMany({
        where: {
          user_id: userId,
          status: 'completed',
          completed_at: {
            not: null,
          },
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: {
          completed_at: 'desc',
        },
        take: 10,
      });
    });

    // Calculate stats
    const totalEnrolledCourses = enrolledCourses.length;
    const totalCompletedCourses = enrolledCourses.filter(
      (e) => e.completion_pct === 100
    ).length;

    const avgProgress =
      totalEnrolledCourses > 0
        ? Math.round(
            enrolledCourses.reduce((sum, e) => sum + e.completion_pct, 0) /
              totalEnrolledCourses
          )
        : 0;

    // Transform enrolled courses data
    const coursesWithProgress = enrolledCourses.map((enrollment) => ({
      trackingId: enrollment.id,
      startedAt: enrollment.started_at.toISOString(),
      lastAccessed: enrollment.last_accessed.toISOString(),
      completionPct: enrollment.completion_pct,
      modulesCompleted: enrollment.modules_completed,
      modulesTotal: enrollment.modules_total,
      status: enrollment.status,
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        description: enrollment.course.description,
        status: enrollment.course.status,
        moduleCount: enrollment.course._count.course_modules,
        instructor: {
          id: enrollment.course.users.id,
          name: enrollment.course.users.name,
          avatarUrl: enrollment.course.users.avatar_url,
          university: enrollment.course.users.university,
        },
      },
    }));

    // Transform recent activity
    const recentCompletions = recentActivity.map((activity) => ({
      moduleId: activity.module.id,
      moduleTitle: activity.module.title,
      moduleSlug: activity.module.slug,
      courseId: activity.course.id,
      courseTitle: activity.course.title,
      courseSlug: activity.course.slug,
      completedAt: activity.completed_at?.toISOString() || null,
    }));

    return {
      stats: {
        totalEnrolledCourses,
        totalCompletedCourses,
        totalCompletedModules,
        averageProgress: avgProgress,
      },
      enrolledCourses: coursesWithProgress,
      recentActivity: recentCompletions,
    };
  } catch (error) {
    console.error('Error fetching user learning data:', error);
    return null;
  }
}

export const metadata = {
  title: 'My Learning - Brain & Cognitive Sciences',
  description: 'Track your learning progress and manage your enrolled courses',
};

export default async function LearningPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/learning');
  }

  const learningData = await getUserLearningData(session.user.id);

  return (
    <AuthenticatedLayout>
      <LearningDashboard
        userName={session.user.name || 'Learner'}
        userRole={session.user.role}
        data={learningData}
      />
    </AuthenticatedLayout>
  );
}
