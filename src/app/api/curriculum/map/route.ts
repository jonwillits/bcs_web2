import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/curriculum/map
 * Returns curriculum map with all published courses
 * Authenticated: Shows personalized progress
 * Public: Shows all courses without progress
 *
 * Curriculum Visualization Feature - Level 0 (Curriculum Map)
 */

type CourseStatus = 'locked' | 'available' | 'in_progress' | 'completed';

interface CourseProgressData {
  course_id: string;
  completion_pct: number;
  started_at: Date;
  status: string;
  modules_completed: number;
  modules_total: number;
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  const data = await withDatabaseRetry(async () => {
    // Fetch all published courses
    const courses = await prisma.courses.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        tags: true,
        featured: true,
        prerequisite_course_ids: true,
        curriculum_position_x: true,
        curriculum_position_y: true,
        users: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            title: true,
            department: true
          }
        },
        course_modules: {
          select: {
            id: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { created_at: 'desc' }
      ]
    });

    // If user is authenticated, fetch their progress
    let progressMap = new Map<string, CourseProgressData>();
    let userStats = null;

    if (userId) {
      const progressRecords = await prisma.course_tracking.findMany({
        where: {
          user_id: userId,
          course_id: { in: courses.map(c => c.id) }
        },
        select: {
          course_id: true,
          completion_pct: true,
          started_at: true,
          status: true,
          modules_completed: true,
          modules_total: true
        }
      });

      progressRecords.forEach(p => {
        progressMap.set(p.course_id, p as CourseProgressData);
      });

      // Get user gamification stats
      userStats = await prisma.user_gamification_stats.findUnique({
        where: { user_id: userId },
        select: {
          total_xp: true,
          level: true,
          current_streak: true,
          longest_streak: true
        }
      });
    }

    // Transform courses to curriculum nodes
    const curriculumNodes = courses.map(course => {
      const progress = progressMap.get(course.id);
      const status = userId
        ? calculateCourseStatus(course, progressMap)
        : 'viewable' as const;

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description || '',
        tags: course.tags,
        featured: course.featured,
        position: {
          x: course.curriculum_position_x ?? 50,
          y: course.curriculum_position_y ?? 50
        },
        prerequisites: course.prerequisite_course_ids || [],
        moduleCount: course.course_modules.length,
        instructor: {
          name: course.users.name,
          avatar_url: course.users.avatar_url,
          title: course.users.title,
          department: course.users.department
        },
        // Authenticated users get progress data
        ...(userId && {
          status,
          completionPct: progress?.completion_pct || 0,
          modulesCompleted: progress?.modules_completed || 0,
          modulesTotal: progress?.modules_total || course.course_modules.length,
          startedAt: progress?.started_at?.toISOString() || null,
          isCompleted: progress?.completion_pct === 100 || progress?.status === 'completed'
        })
      };
    });

    return {
      courses: curriculumNodes,
      totalCourses: courses.length,
      // User stats (only for authenticated users)
      ...(userId && userStats && {
        userProgress: {
          totalXP: userStats.total_xp,
          level: userStats.level,
          currentStreak: userStats.current_streak,
          longestStreak: userStats.longest_streak,
          coursesStarted: progressMap.size,
          coursesCompleted: Array.from(progressMap.values()).filter(p => p.completion_pct === 100 || p.status === 'completed').length
        }
      })
    };
  });

  return NextResponse.json(data);
}

/**
 * Calculate course status based on prerequisites and user progress
 */
function calculateCourseStatus(
  course: { id: string; prerequisite_course_ids: string[] },
  progressMap: Map<string, CourseProgressData>
): CourseStatus {
  const progress = progressMap.get(course.id);

  // If completed (100% or status is completed)
  if (progress && (progress.completion_pct === 100 || progress.status === 'completed')) {
    return 'completed';
  }

  // Check prerequisites
  const prerequisites = course.prerequisite_course_ids || [];

  if (prerequisites.length > 0) {
    const allPrereqsCompleted = prerequisites.every(prereqId => {
      const prereqProgress = progressMap.get(prereqId);
      return prereqProgress && (prereqProgress.completion_pct === 100 || prereqProgress.status === 'completed');
    });

    if (!allPrereqsCompleted) {
      return 'locked';
    }
  }

  // If started but not completed
  if (progress?.started_at) {
    return 'in_progress';
  }

  // If prerequisites met but not started
  return 'available';
}
