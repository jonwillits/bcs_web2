import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/faculty/curriculum/layout
 * Fetch all courses for curriculum editor
 * Faculty/Admin only
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is faculty or admin
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden - Faculty/Admin only' }, { status: 403 });
  }

  const courses = await withDatabaseRetry(async () => {
    return await prisma.courses.findMany({
      where: {
        status: 'published' // Only show published courses in curriculum
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        prerequisite_course_ids: true,
        curriculum_position_x: true,
        curriculum_position_y: true,
        featured: true,
        tags: true,
        users: {
          select: {
            name: true
          }
        },
        course_modules: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });
  });

  return NextResponse.json({
    courses: courses.map(course => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      prerequisite_course_ids: course.prerequisite_course_ids || [],
      curriculum_position_x: course.curriculum_position_x ?? 50,
      curriculum_position_y: course.curriculum_position_y ?? 50,
      featured: course.featured,
      tags: course.tags,
      author: course.users.name,
      moduleCount: course.course_modules.length
    }))
  });
}

/**
 * PUT /api/faculty/curriculum/layout
 * Save curriculum layout (positions and prerequisites)
 * Faculty/Admin only
 */
export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is faculty or admin
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden - Faculty/Admin only' }, { status: 403 });
  }

  const { courses } = await request.json();

  if (!Array.isArray(courses)) {
    return NextResponse.json({ error: 'Invalid request - courses must be an array' }, { status: 400 });
  }

  // Validate data
  for (const course of courses) {
    if (!course.id || typeof course.curriculum_position_x !== 'number' || typeof course.curriculum_position_y !== 'number') {
      return NextResponse.json({ error: 'Invalid course data' }, { status: 400 });
    }
  }

  // Update courses in database
  await withDatabaseRetry(async () => {
    // Use transaction for atomic update
    await prisma.$transaction(
      courses.map(course =>
        prisma.courses.update({
          where: { id: course.id },
          data: {
            curriculum_position_x: course.curriculum_position_x,
            curriculum_position_y: course.curriculum_position_y,
            prerequisite_course_ids: course.prerequisite_course_ids || []
          }
        })
      )
    );
  });

  return NextResponse.json({
    success: true,
    message: `Updated ${courses.length} courses`
  });
}
