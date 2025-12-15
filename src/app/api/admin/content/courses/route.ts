import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all courses with author info, module count, and enrollment count
    const courses = await withDatabaseRetry(async () => {
      return await prisma.courses.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          updated_at: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course_modules: {
            select: {
              id: true,
            },
          },
          course_tracking: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          updated_at: 'desc',
        },
      });
    });

    // Format response
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      author: {
        name: course.users.name || 'Unknown',
        email: course.users.email || '',
      },
      status: course.status,
      moduleCount: course.course_modules.length,
      enrolledCount: course.course_tracking.length,
      updatedAt: course.updated_at.toISOString(),
    }));

    return NextResponse.json({ courses: formattedCourses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
