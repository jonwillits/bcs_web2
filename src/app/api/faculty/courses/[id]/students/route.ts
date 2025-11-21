import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions';

/**
 * GET /api/faculty/courses/[id]/students
 * Faculty views all enrolled learners (students, faculty, admin) who started their course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: courseId } = await params;

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only faculty/admin can access
    if (!hasFacultyAccess(session)) {
      return NextResponse.json(
        { error: 'Only faculty can access this endpoint' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Check if user has permission to view this course
    const hasAccess = await canEditCourseWithRetry(userId, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view this course' },
        { status: 403 }
      );
    }

    // Get all enrolled learners who started this course
    const learners = await withDatabaseRetry(async () => {
      return await prisma.course_tracking.findMany({
        where: {
          course_id: courseId,
          status: 'active',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar_url: true,
              major: true,
              graduation_year: true,
              university: true,
            },
          },
        },
        orderBy: { started_at: 'desc' },
      });
    });

    // Calculate active count (accessed in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCount = learners.filter(
      (l) => l.last_accessed >= thirtyDaysAgo
    ).length;

    // Transform data for response
    const learnersData = learners.map((tracking) => ({
      trackingId: tracking.id,
      startedAt: tracking.started_at.toISOString(),
      lastAccessed: tracking.last_accessed.toISOString(),
      learner: {
        id: tracking.user.id,
        name: tracking.user.name,
        email: tracking.user.email,
        role: tracking.user.role,
        avatarUrl: tracking.user.avatar_url,
        major: tracking.user.major,
        graduationYear: tracking.user.graduation_year,
        university: tracking.user.university,
      },
    }));

    return NextResponse.json({
      learners: learnersData,
      totalCount: learners.length,
      activeCount, // Learners who accessed in last 30 days
    });

  } catch (error) {
    console.error('Error fetching course learners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learners' },
      { status: 500 }
    );
  }
}
