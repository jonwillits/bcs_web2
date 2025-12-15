import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/achievements/user/[userId]
 * Get a user's earned achievements
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    // Users can only view their own achievements (or admins can view anyone's)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch user achievements with full achievement details
    const [userAchievements, allAchievements, userStats] = await withDatabaseRetry(async () => {
      return await Promise.all([
        // Earned achievements
        prisma.user_achievements.findMany({
          where: { user_id: userId },
          include: {
            achievement: true
          },
          orderBy: {
            earned_at: 'desc'
          }
        }),

        // All available achievements
        prisma.achievements.findMany({
          orderBy: [
            { category: 'asc' },
            { xp_reward: 'asc' }
          ]
        }),

        // User stats for progress indicators
        prisma.user_gamification_stats.findUnique({
          where: { user_id: userId },
          select: {
            total_xp: true,
            level: true,
            current_streak: true
          }
        })
      ]);
    });

    // Calculate total achievements earned
    const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const totalAchievements = allAchievements.length;
    const earnedCount = userAchievements.length;
    const completionPct = Math.round((earnedCount / totalAchievements) * 100);

    // Calculate XP from achievements
    const achievementXP = userAchievements.reduce((sum, ua) => sum + ua.achievement.xp_reward, 0);

    // Group achievements by category
    const achievementsByCategory = {
      completion: [] as any[],
      speed: [] as any[],
      consistency: [] as any[],
      mastery: [] as any[]
    };

    // Add all achievements (earned and locked)
    allAchievements.forEach(achievement => {
      const isEarned = earnedAchievementIds.has(achievement.id);
      const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);

      const achievementData = {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        xpReward: achievement.xp_reward,
        badgeColor: achievement.badge_color,
        criteria: achievement.criteria,
        isEarned,
        earnedAt: isEarned ? userAchievement?.earned_at.toISOString() : null,
        progress: isEarned ? 100 : 0
      };

      if (achievement.category in achievementsByCategory) {
        achievementsByCategory[achievement.category as keyof typeof achievementsByCategory].push(achievementData);
      }
    });

    return NextResponse.json({
      userId,
      stats: {
        totalAchievements,
        earnedCount,
        completionPct,
        achievementXP,
        totalXP: userStats?.total_xp || 0,
        level: userStats?.level || 1,
        currentStreak: userStats?.current_streak || 0
      },
      achievements: achievementsByCategory,
      recentlyEarned: userAchievements.slice(0, 5).map(ua => ({
        id: ua.achievement.id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        xpReward: ua.achievement.xp_reward,
        badgeColor: ua.achievement.badge_color,
        earnedAt: ua.earned_at.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user achievements' },
      { status: 500 }
    );
  }
}
