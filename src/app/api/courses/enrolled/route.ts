import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/courses/enrolled
 * Get user's enrolled courses list (for any authenticated user - student, faculty, or admin)
 * Query params: sort=recent|alphabetical, limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication - any authenticated user can access
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'recent'; // recent | alphabetical
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get enrolled courses with course details
    const enrolledCourses = await withDatabaseRetry(async () => {
      return await prisma.course_tracking.findMany({
        where: {
          user_id: userId,
          status: 'active',
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              status: true,
              users: {
                select: {
                  id: true,
                  name: true,
                  avatar_url: true,
                  university: true,
                },
              },
              _count: {
                select: {
                  course_modules: true,
                },
              },
            },
          },
        },
        orderBy:
          sort === 'alphabetical'
            ? { course: { title: 'asc' } }
            : { started_at: 'desc' },
        take: limit,
      });
    });

    // Transform data for response
    const courses = enrolledCourses.map((tracking) => ({
      trackingId: tracking.id,
      startedAt: tracking.started_at.toISOString(),
      lastAccessed: tracking.last_accessed.toISOString(),
      course: {
        id: tracking.course.id,
        title: tracking.course.title,
        slug: tracking.course.slug,
        description: tracking.course.description,
        status: tracking.course.status,
        moduleCount: tracking.course._count.course_modules,
        instructor: {
          id: tracking.course.users.id,
          name: tracking.course.users.name,
          avatarUrl: tracking.course.users.avatar_url,
          university: tracking.course.users.university,
        },
      },
    }));

    return NextResponse.json({
      courses,
      totalCount: courses.length,
    });

  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
