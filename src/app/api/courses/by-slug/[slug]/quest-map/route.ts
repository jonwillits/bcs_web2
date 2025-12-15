import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/courses/[slug]/quest-map
 * Authenticated endpoint to fetch course structure with user progress
 * Returns quest map with personalized unlock states
 *
 * Quest Map Feature - Authenticated personalized endpoint
 */

type QuestStatus = 'locked' | 'available' | 'active' | 'completed';

interface ModuleData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  prerequisite_module_ids: string[];
  quest_map_position_x: number | null;
  quest_map_position_y: number | null;
  xp_reward: number;
  difficulty_level: string;
  estimated_minutes: number | null;
  quest_type: string;
}

interface ProgressData {
  module_id: string;
  status: string;
  completed_at: Date | null;
  started_at: Date | null;
  xp_earned: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const userId = session.user.id;

  const data = await withDatabaseRetry(async () => {
    // Fetch course with modules
    const course = await prisma.courses.findUnique({
      where: { slug, status: 'published' },
      include: {
        course_modules: {
          include: {
            modules: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                prerequisite_module_ids: true,
                quest_map_position_x: true,
                quest_map_position_y: true,
                xp_reward: true,
                difficulty_level: true,
                estimated_minutes: true,
                quest_type: true,
                status: true
              }
            }
          },
          orderBy: { sort_order: 'asc' }
        }
      }
    });

    if (!course) {
      return { error: 'Course not found', status: 404 };
    }

    // Check enrollment
    const enrollment = await prisma.course_tracking.findUnique({
      where: {
        course_id_user_id: {
          course_id: course.id,
          user_id: userId
        }
      },
      select: {
        completion_pct: true,
        modules_completed: true,
        modules_total: true,
        started_at: true,
        last_accessed: true
      }
    });

    if (!enrollment) {
      return { error: 'Not enrolled in course', enrolled: false, status: 403 };
    }

    // Fetch user progress for all modules in course
    const publishedModules = course.course_modules
      .map(cm => cm.modules)
      .filter(m => m.status === 'published') as ModuleData[];

    const moduleIds = publishedModules.map(m => m.id);

    const progressRecords = await prisma.module_progress.findMany({
      where: {
        user_id: userId,
        course_id: course.id,
        module_id: { in: moduleIds }
      },
      select: {
        module_id: true,
        status: true,
        completed_at: true,
        started_at: true,
        xp_earned: true
      }
    }) as ProgressData[];

    // Build progress map
    const progressMap = new Map<string, ProgressData>();
    progressRecords.forEach(p => {
      progressMap.set(p.module_id, p);
    });

    // Calculate quest status for each module
    const questsWithStatus = publishedModules.map(m => {
      const progress = progressMap.get(m.id);
      const status = calculateQuestStatus(m, progressMap);

      return {
        id: m.id,
        title: m.title,
        slug: m.slug,
        description: m.description || '',
        position: {
          x: m.quest_map_position_x ?? 50,
          y: m.quest_map_position_y ?? 50
        },
        prerequisites: m.prerequisite_module_ids || [],
        xp: m.xp_reward,
        difficulty: m.difficulty_level,
        estimatedMinutes: m.estimated_minutes,
        type: m.quest_type,
        status,
        completedAt: progress?.completed_at?.toISOString() || null,
        startedAt: progress?.started_at?.toISOString() || null,
        xpEarned: progress?.xp_earned || 0
      };
    });

    // Calculate user stats
    const totalXP = questsWithStatus.reduce((sum, q) => sum + (q.xpEarned || 0), 0);
    const completedCount = questsWithStatus.filter(q => q.status === 'completed').length;

    // Get user gamification stats
    const userStats = await prisma.user_gamification_stats.findUnique({
      where: { user_id: userId },
      select: {
        total_xp: true,
        level: true,
        current_streak: true,
        longest_streak: true
      }
    });

    // Get recent achievements (placeholder - implement when achievement system is complete)
    const recentAchievements: Array<{
      id: string;
      title: string;
      icon: string;
      earnedAt: string;
    }> = [];

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description
      },
      quests: questsWithStatus,
      userProgress: {
        totalXP: userStats?.total_xp || totalXP,
        level: userStats?.level || 1,
        completedCount,
        totalCount: questsWithStatus.length,
        completionPct: enrollment.completion_pct,
        currentStreak: userStats?.current_streak || 0,
        longestStreak: userStats?.longest_streak || 0,
        startedAt: enrollment.started_at.toISOString(),
        lastAccessed: enrollment.last_accessed.toISOString()
      },
      recentAchievements
    };
  });

  if ('error' in data) {
    return NextResponse.json(
      { error: data.error, enrolled: data.enrolled },
      { status: data.status }
    );
  }

  return NextResponse.json(data);
}

/**
 * Calculate quest status based on prerequisites and user progress
 */
function calculateQuestStatus(
  module: ModuleData,
  progressMap: Map<string, ProgressData>
): QuestStatus {
  const progress = progressMap.get(module.id);

  // If completed
  if (progress?.status === 'completed') {
    return 'completed';
  }

  // Check prerequisites
  const prerequisites = module.prerequisite_module_ids || [];

  if (prerequisites.length > 0) {
    const allPrereqsCompleted = prerequisites.every(prereqId => {
      const prereqProgress = progressMap.get(prereqId);
      return prereqProgress?.status === 'completed';
    });

    if (!allPrereqsCompleted) {
      return 'locked';
    }
  }

  // If started but not completed
  if (progress?.status === 'in_progress') {
    return 'active';
  }

  // If prerequisites met but not started
  return 'available';
}
