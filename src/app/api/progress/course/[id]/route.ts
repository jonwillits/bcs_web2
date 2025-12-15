import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/progress/course/[id]
 * Get user's progress for a specific course
 * Returns a map of module IDs to their progress status
 *
 * Quest Map Feature - Progress data endpoint
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: courseId } = await params;
  const userId = session.user.id;

  const data = await withDatabaseRetry(async () => {
    // Fetch all progress records for this user in this course
    const progressRecords = await prisma.module_progress.findMany({
      where: {
        user_id: userId,
        course_id: courseId
      },
      select: {
        module_id: true,
        status: true,
        completed_at: true,
        started_at: true,
        xp_earned: true,
        attempts: true
      }
    });

    // Transform to a map for easy lookup
    const progressMap: Record<string, {
      status: string;
      completedAt: string | null;
      startedAt: string | null;
      xpEarned: number;
      attempts: number;
    }> = {};

    progressRecords.forEach(p => {
      progressMap[p.module_id] = {
        status: p.status,
        completedAt: p.completed_at?.toISOString() || null,
        startedAt: p.started_at?.toISOString() || null,
        xpEarned: p.xp_earned,
        attempts: p.attempts
      };
    });

    // Also return overall course progress
    const tracking = await prisma.course_tracking.findUnique({
      where: {
        course_id_user_id: {
          course_id: courseId,
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

    return {
      progress: progressMap,
      courseProgress: tracking ? {
        completionPct: tracking.completion_pct,
        modulesCompleted: tracking.modules_completed,
        modulesTotal: tracking.modules_total,
        startedAt: tracking.started_at.toISOString(),
        lastAccessed: tracking.last_accessed.toISOString()
      } : null
    };
  });

  return NextResponse.json(data);
}
