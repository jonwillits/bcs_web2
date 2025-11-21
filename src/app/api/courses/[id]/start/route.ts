import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * POST /api/courses/[id]/start
 * User enrolls in a course (any authenticated user can enroll - student, faculty, or admin)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: courseId } = await params;

    // Check authentication - any authenticated user can enroll
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if course exists and is published
    const course = await withDatabaseRetry(async () => {
      return await prisma.courses.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
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

    if (course.status !== 'published') {
      return NextResponse.json(
        { error: 'Course is not published' },
        { status: 403 }
      );
    }

    // Check if already enrolled (idempotent operation)
    const existingTracking = await withDatabaseRetry(async () => {
      return await prisma.course_tracking.findUnique({
        where: {
          course_id_user_id: {
            course_id: courseId,
            user_id: userId,
          },
        },
      });
    });

    if (existingTracking) {
      // Already enrolled - just update last_accessed
      const updated = await withDatabaseRetry(async () => {
        return await prisma.course_tracking.update({
          where: { id: existingTracking.id },
          data: { last_accessed: new Date() },
        });
      });

      return NextResponse.json({
        tracking: {
          id: updated.id,
          courseId: updated.course_id,
          startedAt: updated.started_at.toISOString(),
          lastAccessed: updated.last_accessed.toISOString(),
        },
        message: `Course already in your library`,
        alreadyStarted: true,
      });
    }

    // Create new tracking entry and increment count atomically
    const tracking = await withDatabaseRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        // Create tracking entry
        const newTracking = await tx.course_tracking.create({
          data: {
            course_id: courseId,
            user_id: userId,
          },
        });

        // Increment course tracking count
        await tx.courses.update({
          where: { id: courseId },
          data: { tracking_count: { increment: 1 } },
        });

        return newTracking;
      });
    });

    return NextResponse.json({
      tracking: {
        id: tracking.id,
        courseId: tracking.course_id,
        startedAt: tracking.started_at.toISOString(),
        lastAccessed: tracking.last_accessed.toISOString(),
      },
      message: `Started: ${course.title}`,
      alreadyStarted: false,
    });

  } catch (error) {
    console.error('Error starting course:', error);
    return NextResponse.json(
      { error: 'Failed to start course' },
      { status: 500 }
    );
  }
}
