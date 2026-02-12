import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/progress/streaks
 * Get user's learning streak data and session history
 * Returns current streak, longest streak, and calendar heatmap data
 *
 * Course Map Feature - Learning streaks endpoint
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const data = await withDatabaseRetry(async () => {
    // Get user gamification stats for streak info
    const userStats = await prisma.user_gamification_stats.findUnique({
      where: { user_id: userId },
      select: {
        current_streak: true,
        longest_streak: true,
        last_active_date: true
      }
    });

    // Fetch learning sessions for the last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const sessions = await prisma.learning_sessions.findMany({
      where: {
        user_id: userId,
        date: {
          gte: oneYearAgo
        }
      },
      orderBy: {
        date: 'desc'
      },
      select: {
        date: true,
        modules_completed: true,
        modules_viewed: true,
        courses_accessed: true,
        minutes_studied: true
      }
    });

    // Calculate current streak from sessions
    const currentStreak = calculateCurrentStreak(sessions.map(s => s.date));

    // Calculate longest streak from sessions
    const longestStreak = calculateLongestStreak(sessions.map(s => s.date));

    // Update stats if they don't match
    if (userStats && (userStats.current_streak !== currentStreak || userStats.longest_streak < longestStreak)) {
      await prisma.user_gamification_stats.update({
        where: { user_id: userId },
        data: {
          current_streak: currentStreak,
          longest_streak: Math.max(userStats.longest_streak, longestStreak)
        }
      });
    }

    // Transform sessions for calendar heatmap
    const calendarData = sessions.map(s => ({
      date: s.date.toISOString().split('T')[0], // YYYY-MM-DD format
      count: s.modules_completed,
      modulesViewed: s.modules_viewed,
      coursesAccessed: s.courses_accessed,
      minutesStudied: s.minutes_studied
    }));

    // Calculate stats for recent activity
    const last7Days = sessions.slice(0, 7);
    const last30Days = sessions.slice(0, 30);

    const stats = {
      last7Days: {
        totalModules: last7Days.reduce((sum, s) => sum + s.modules_completed, 0),
        totalMinutes: last7Days.reduce((sum, s) => sum + s.minutes_studied, 0),
        activeDays: last7Days.length
      },
      last30Days: {
        totalModules: last30Days.reduce((sum, s) => sum + s.modules_completed, 0),
        totalMinutes: last30Days.reduce((sum, s) => sum + s.minutes_studied, 0),
        activeDays: last30Days.length
      },
      allTime: {
        totalSessions: sessions.length,
        totalModules: sessions.reduce((sum, s) => sum + s.modules_completed, 0),
        totalMinutes: sessions.reduce((sum, s) => sum + s.minutes_studied, 0)
      }
    };

    return {
      currentStreak,
      longestStreak: Math.max(userStats?.longest_streak || 0, longestStreak),
      lastActiveDate: userStats?.last_active_date?.toISOString() || null,
      calendarData,
      stats
    };
  });

  return NextResponse.json(data);
}

/**
 * Calculate current streak from an array of dates
 * A streak is consecutive days of activity
 */
function calculateCurrentStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Sort dates descending (most recent first)
  const sortedDates = dates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentDate = today;
  const mostRecentActivity = startOfDay(sortedDates[0]);

  // Streak can start today or yesterday
  if (isSameDay(mostRecentActivity, today)) {
    streak = 1;
    currentDate = yesterday;
  } else if (isSameDay(mostRecentActivity, yesterday)) {
    streak = 1;
    currentDate = new Date(yesterday);
    currentDate.setDate(currentDate.getDate() - 1);
  } else {
    // No recent activity
    return 0;
  }

  // Count consecutive days
  for (let i = 1; i < sortedDates.length; i++) {
    const sessionDate = startOfDay(sortedDates[i]);

    if (isSameDay(sessionDate, currentDate)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (sessionDate < currentDate) {
      // Gap in streak
      break;
    }
    // Skip duplicate dates
  }

  return streak;
}

/**
 * Calculate longest streak from an array of dates
 */
function calculateLongestStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Sort dates ascending
  const sortedDates = dates
    .map(d => startOfDay(new Date(d)))
    .sort((a, b) => a.getTime() - b.getTime());

  // Remove duplicates
  const uniqueDates = sortedDates.filter((date, index, array) => {
    return index === 0 || !isSameDay(date, array[index - 1]);
  });

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = uniqueDates[i - 1];
    const currDate = uniqueDates[i];

    const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      // Consecutive day
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      // Gap - reset streak
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Get start of day (00:00:00) for a date
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
