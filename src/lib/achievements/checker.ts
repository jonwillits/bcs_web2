/**
 * Achievement Checker
 *
 * Contains logic for checking if users have earned achievements
 * based on their progress and activity.
 */

import { prisma } from '@/lib/db';
import { ACHIEVEMENT_DEFINITIONS, type AchievementDefinition } from './definitions';
import { withDatabaseRetry } from '@/lib/retry';

export interface AchievementCheckResult {
  newAchievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    xp_reward: number;
    badge_color: string;
  }>;
  totalXPAwarded: number;
}

/**
 * Check for new achievements after a module is completed
 */
export async function checkAchievementsAfterModuleCompletion(
  userId: string,
  completedModuleId: string,
  courseId?: string
): Promise<AchievementCheckResult> {
  const newAchievements: AchievementCheckResult['newAchievements'] = [];
  let totalXPAwarded = 0;

  try {
    // Get user's existing achievements
    const existingAchievements = await withDatabaseRetry(async () => {
      return await prisma.user_achievements.findMany({
        where: { user_id: userId },
        select: { achievement_id: true }
      });
    });

    const existingAchievementIds = new Set(existingAchievements.map(a => a.achievement_id));

    // Get user stats
    const [moduleProgress, completedCourses, userStats, todaysSessions, completedModule] = await withDatabaseRetry(async () => {
      return await Promise.all([
        // Total modules completed
        prisma.module_progress.count({
          where: {
            user_id: userId,
            status: 'completed'
          }
        }),

        // Courses with 100% completion
        prisma.course_tracking.count({
          where: {
            user_id: userId,
            completion_pct: 100
          }
        }),

        // User gamification stats
        prisma.user_gamification_stats.findUnique({
          where: { user_id: userId },
          select: {
            level: true,
            current_streak: true
          }
        }),

        // Today's learning session
        prisma.learning_sessions.findFirst({
          where: {
            user_id: userId,
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          select: {
            modules_completed: true
          }
        }),

        // Get the completed module details
        prisma.modules.findUnique({
          where: { id: completedModuleId },
          select: {
            difficulty_level: true,
            quest_type: true
          }
        })
      ]);
    });

    const modulesCompletedToday = todaysSessions?.modules_completed || 0;
    const currentLevel = userStats?.level || 1;
    const currentStreak = userStats?.current_streak || 0;

    // Check each achievement definition
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      // Skip if already earned
      if (existingAchievementIds.has(achievement.id)) {
        continue;
      }

      let earned = false;

      switch (achievement.criteria.type) {
        case 'modules_completed':
          earned = moduleProgress >= achievement.criteria.count;
          break;

        case 'courses_completed':
          earned = completedCourses >= achievement.criteria.count;
          break;

        case 'streak':
          earned = currentStreak >= achievement.criteria.days;
          break;

        case 'perfect_course':
          if (courseId) {
            const courseTracking = await withDatabaseRetry(async () => {
              return await prisma.course_tracking.findUnique({
                where: {
                  course_id_user_id: {
                    course_id: courseId,
                    user_id: userId
                  }
                },
                select: { completion_pct: true }
              });
            });
            earned = courseTracking?.completion_pct === 100;
          }
          break;

        case 'module_difficulty':
          earned = completedModule?.difficulty_level === achievement.criteria.difficulty;
          break;

        case 'challenge_modules_completed':
          const challengeCount = await withDatabaseRetry(async () => {
            return await prisma.module_progress.count({
              where: {
                user_id: userId,
                status: 'completed',
                module: {
                  quest_type: 'challenge'
                }
              }
            });
          });
          earned = challengeCount >= achievement.criteria.count;
          break;

        case 'modules_per_day':
          earned = modulesCompletedToday >= achievement.criteria.count;
          break;

        case 'level_reached':
          earned = currentLevel >= achievement.criteria.level;
          break;

        case 'learning_paths_completed':
          // Check if user has completed learning paths
          // A learning path is complete when all its courses are completed
          const completedPaths = await withDatabaseRetry(async () => {
            const paths = await prisma.learning_paths.findMany({
              select: {
                id: true,
                course_ids: true
              }
            });

            let count = 0;
            for (const path of paths) {
              if (path.course_ids.length === 0) continue;

              // Check if all courses in path are completed
              const completedInPath = await prisma.course_tracking.count({
                where: {
                  user_id: userId,
                  course_id: { in: path.course_ids },
                  completion_pct: 100
                }
              });

              if (completedInPath === path.course_ids.length) {
                count++;
              }
            }
            return count;
          });
          earned = completedPaths >= achievement.criteria.count;
          break;

        case 'prerequisite_chain_completed':
          // Check if user completed a course that had prerequisites
          if (courseId) {
            const courseWithPrereqs = await withDatabaseRetry(async () => {
              return await prisma.courses.findUnique({
                where: { id: courseId },
                select: { prerequisite_course_ids: true }
              });
            });

            earned = (courseWithPrereqs?.prerequisite_course_ids.length || 0) >= achievement.criteria.min_prerequisites;
          }
          break;

        case 'foundation_courses_completed':
          // Foundation courses are those with no prerequisites
          const foundationCourses = await withDatabaseRetry(async () => {
            return await prisma.courses.findMany({
              where: {
                status: 'published',
                prerequisite_course_ids: { isEmpty: true }
              },
              select: { id: true }
            });
          });

          if (foundationCourses.length > 0) {
            const completedFoundation = await withDatabaseRetry(async () => {
              return await prisma.course_tracking.count({
                where: {
                  user_id: userId,
                  course_id: { in: foundationCourses.map(c => c.id) },
                  completion_pct: 100
                }
              });
            });

            earned = completedFoundation === foundationCourses.length;
          }
          break;
      }

      if (earned) {
        // Award the achievement
        await withDatabaseRetry(async () => {
          return await prisma.user_achievements.create({
            data: {
              user_id: userId,
              achievement_id: achievement.id,
              progress: 100
            }
          });
        });

        // Update user XP
        await withDatabaseRetry(async () => {
          return await prisma.user_gamification_stats.update({
            where: { user_id: userId },
            data: {
              total_xp: { increment: achievement.xp_reward }
            }
          });
        });

        newAchievements.push({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          xp_reward: achievement.xp_reward,
          badge_color: achievement.badge_color
        });

        totalXPAwarded += achievement.xp_reward;
      }
    }

    return {
      newAchievements,
      totalXPAwarded
    };
  } catch (error) {
    console.error('Error checking achievements:', error);
    return {
      newAchievements: [],
      totalXPAwarded: 0
    };
  }
}

/**
 * Seed achievements into database
 * Call this once to populate the achievements table
 */
export async function seedAchievements() {
  try {
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      await prisma.achievements.upsert({
        where: { id: achievement.id },
        update: {
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          criteria: achievement.criteria as any,
          xp_reward: achievement.xp_reward,
          badge_color: achievement.badge_color
        },
        create: {
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          criteria: achievement.criteria as any,
          xp_reward: achievement.xp_reward,
          badge_color: achievement.badge_color
        }
      });
    }
    console.log(`✅ Seeded ${ACHIEVEMENT_DEFINITIONS.length} achievements`);
  } catch (error) {
    console.error('Error seeding achievements:', error);
    throw error;
  }
}
