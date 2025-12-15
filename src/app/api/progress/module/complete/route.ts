import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { checkAchievementsAfterModuleCompletion } from '@/lib/achievements/checker';

/**
 * Helper: Mark a module as complete in a specific context (course or standalone)
 */
async function markModuleComplete(
  userId: string,
  moduleId: string,
  courseId: string | null
) {
  return await withDatabaseRetry(async () => {
    // Get module data
    const moduleData = await prisma.modules.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        title: true,
        xp_reward: true,
        quest_type: true,
        difficulty_level: true
      }
    });

    if (!moduleData) {
      return { error: 'Module not found', status: 404 };
    }

    // Upsert progress record
    const now = new Date();
    await prisma.module_progress.upsert({
      where: {
        user_id_module_id_course_id: {
          user_id: userId,
          module_id: moduleId,
          course_id: courseId
        }
      },
      update: {
        status: 'completed',
        completed_at: now,
        xp_earned: moduleData.xp_reward,
        updated_at: now
      },
      create: {
        user_id: userId,
        module_id: moduleId,
        course_id: courseId,
        status: 'completed',
        completed_at: now,
        started_at: now,
        xp_earned: moduleData.xp_reward
      }
    });

    // Update user gamification stats (XP and level)
    const userStats = await prisma.user_gamification_stats.upsert({
      where: { user_id: userId },
      update: {
        total_xp: { increment: moduleData.xp_reward },
        last_active_date: now
      },
      create: {
        user_id: userId,
        total_xp: moduleData.xp_reward,
        level: 1,
        last_active_date: now
      }
    });

    // Calculate new level
    const newLevel = Math.floor(Math.sqrt(userStats.total_xp / 100));
    const leveledUp = newLevel > userStats.level;
    if (leveledUp) {
      await prisma.user_gamification_stats.update({
        where: { user_id: userId },
        data: { level: newLevel }
      });
    }

    // Update learning session for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.learning_sessions.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: today
        }
      },
      update: {
        modules_completed: { increment: 1 },
        last_activity: now
      },
      create: {
        user_id: userId,
        date: today,
        modules_completed: 1,
        first_activity: now,
        last_activity: now
      }
    });

    // Course-specific tracking (only if courseId provided)
    let completionPct = 0;
    let modulesCompleted = 0;
    let totalModules = 0;
    let newlyUnlocked: Array<{ id: string; title: string }> = [];
    let achievements: Array<{ id: string; title: string; icon: string }> = [];

    if (courseId) {
      // Update course tracking
      const allProgress = await prisma.module_progress.findMany({
        where: { user_id: userId, course_id: courseId }
      });

      const completedCount = allProgress.filter(p => p.status === 'completed').length;

      const courseModules = await prisma.course_modules.findMany({
        where: { course_id: courseId },
        select: { module_id: true }
      });

      totalModules = courseModules.length;
      modulesCompleted = completedCount;
      completionPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

      await prisma.course_tracking.update({
        where: {
          course_id_user_id: { course_id: courseId, user_id: userId }
        },
        data: {
          modules_completed: completedCount,
          modules_total: totalModules,
          completion_pct: completionPct,
          last_accessed: now
        }
      });

      // Find newly unlocked modules
      const allModulesInCourse = await prisma.course_modules.findMany({
        where: { course_id: courseId },
        include: {
          modules: {
            select: {
              id: true,
              title: true,
              prerequisite_module_ids: true
            }
          }
        }
      });

      const completedModuleIds = new Set(
        allProgress.filter(p => p.status === 'completed').map(p => p.module_id)
      );

      newlyUnlocked = allModulesInCourse
        .map(cm => cm.modules)
        .filter(m => {
          const prereqs = m.prerequisite_module_ids || [];
          if (prereqs.length === 0) return false;
          if (!prereqs.includes(moduleId)) return false;
          if (completedModuleIds.has(m.id)) return false;
          return prereqs.every(prereqId => completedModuleIds.has(prereqId));
        })
        .map(m => ({ id: m.id, title: m.title }));

    }

    // Check for achievements using the achievement system
    const achievementResult = await checkAchievementsAfterModuleCompletion(
      userId,
      moduleId,
      courseId
    );

    // Add achievement XP to total XP
    const totalXPWithAchievements = userStats.total_xp + moduleData.xp_reward + achievementResult.totalXPAwarded;

    // Recalculate level if achievement XP was awarded
    let finalLevel = leveledUp ? newLevel : userStats.level;
    if (achievementResult.totalXPAwarded > 0) {
      finalLevel = Math.floor(Math.sqrt(totalXPWithAchievements / 100));
      if (finalLevel > userStats.level) {
        await prisma.user_gamification_stats.update({
          where: { user_id: userId },
          data: { level: finalLevel }
        });
      }
    }

    return {
      success: true,
      xpAwarded: moduleData.xp_reward,
      totalXP: totalXPWithAchievements,
      level: finalLevel,
      leveledUp: finalLevel > userStats.level,
      newlyUnlockedModules: newlyUnlocked,
      completionPct,
      modulesCompleted,
      totalModules,
      achievements: achievementResult.newAchievements
    };
  });
}

/**
 * Helper: Handle un-completion (toggle off)
 */
async function handleUncompletion(
  userId: string,
  moduleId: string,
  courseId?: string
) {
  return await withDatabaseRetry(async () => {
    // Find and delete the progress record(s)
    if (courseId) {
      // Delete specific course progress
      await prisma.module_progress.deleteMany({
        where: {
          user_id: userId,
          module_id: moduleId,
          course_id: courseId
        }
      });
    } else {
      // Delete all progress for this module (course + standalone)
      await prisma.module_progress.deleteMany({
        where: {
          user_id: userId,
          module_id: moduleId
        }
      });
    }

    return NextResponse.json({ success: true });
  });
}

/**
 * POST /api/progress/module/complete
 * Mark a module as complete, award XP, unlock dependents
 *
 * Supports 3 modes:
 * 1. Course context (courseId provided) - explicit course tracking
 * 2. Auto-linked (no courseId, but user enrolled) - link to enrolled courses
 * 3. Standalone (no courseId, user not enrolled) - standalone progress
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { moduleId, courseId, completed } = body;

  if (!moduleId) {
    return NextResponse.json(
      { error: 'moduleId required' },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  // Handle un-completion (toggle off)
  if (completed === false) {
    return await handleUncompletion(userId, moduleId, courseId);
  }

  // Mode 1: Explicit course context
  if (courseId) {
    // Verify enrollment
    const enrollment = await withDatabaseRetry(async () => {
      return await prisma.course_tracking.findUnique({
        where: {
          course_id_user_id: { course_id: courseId, user_id: userId }
        }
      });
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in course' },
        { status: 403 }
      );
    }

    const result = await markModuleComplete(userId, moduleId, courseId);
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ ...result, mode: 'course' });
  }

  // No courseId provided - smart detection
  const enrolledCourses = await withDatabaseRetry(async () => {
    return await prisma.course_tracking.findMany({
      where: {
        user_id: userId,
        course: {
          course_modules: {
            some: { module_id: moduleId }
          }
        }
      },
      select: { course_id: true }
    });
  });

  if (enrolledCourses.length > 0) {
    // Mode 2: Auto-link to all enrolled courses
    const results = [];
    for (const enrollment of enrolledCourses) {
      const result = await markModuleComplete(userId, moduleId, enrollment.course_id);
      if (!('error' in result)) {
        results.push(result);
      }
    }

    return NextResponse.json({
      success: true,
      mode: 'auto-linked',
      linkedCourses: enrolledCourses.length,
      ...(results[0] || {}) // Return first result for XP/level data
    });
  } else {
    // Mode 3: Standalone progress
    const result = await markModuleComplete(userId, moduleId, null);
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      ...result,
      mode: 'standalone'
    });
  }
}
