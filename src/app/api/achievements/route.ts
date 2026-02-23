import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { seedAchievements } from '@/lib/achievements/checker';

/**
 * GET /api/achievements
 * Get all available achievements
 *
 * Lazy Initialization: Automatically seeds achievements if table is empty
 */
export async function GET() {
  try {
    // Check if achievements are seeded
    const count = await withDatabaseRetry(async () => {
      return await prisma.achievements.count();
    });

    // Lazy initialization: seed if empty
    if (count === 0) {
      console.log('Achievements table empty - auto-seeding...');
      await seedAchievements();
    }

    const achievements = await withDatabaseRetry(async () => {
      return await prisma.achievements.findMany({
        orderBy: [
          { category: 'asc' },
          { xp_reward: 'asc' }
        ]
      });
    });

    return NextResponse.json({
      achievements: achievements.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        category: a.category,
        xpReward: a.xp_reward,
        badgeColor: a.badge_color,
        criteria: a.criteria
      }))
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

