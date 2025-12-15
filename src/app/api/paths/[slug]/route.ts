import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/paths/[slug]
 * Returns learning path details with courses
 * Shows user progress if authenticated
 *
 * Curriculum Visualization Feature - Learning Path Detail
 */

type CourseStatus = 'locked' | 'available' | 'in_progress' | 'completed';

interface CourseProgressData {
  course_id: string;
  completion_pct: number;
  started_at: Date;
  status: string;
  modules_completed: number;
  modules_total: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  const { slug } = await params;

  const data = await withDatabaseRetry(async () => {
    // Fetch learning path
    const path = await prisma.learning_paths.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        course_ids: true,
        is_featured: true,
        created_at: true,
        creator: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            title: true,
            department: true
          }
        }
      }
    });

    if (!path) {
      return { error: 'Learning path not found', status: 404 };
    }

    // Fetch courses in this path (preserve order from course_ids)
    const coursesData = await prisma.courses.findMany({
      where: {
        id: { in: path.course_ids },
        status: 'published'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        tags: true,
        featured: true,
        prerequisite_course_ids: true,
        curriculum_position_x: true,
        curriculum_position_y: true,
        users: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            title: true,
            department: true
          }
        },
        course_modules: {
          select: {
            id: true
          }
        }
      }
    });

    // Create a map for quick lookup and preserve order
    const courseMap = new Map(coursesData.map(c => [c.id, c]));
    const courses = path.course_ids
      .map(id => courseMap.get(id))
      .filter(Boolean) as typeof coursesData;

    // If user is authenticated, fetch their progress
    let progressMap = new Map<string, CourseProgressData>();

    if (userId) {
      const progressRecords = await prisma.course_tracking.findMany({
        where: {
          user_id: userId,
          course_id: { in: courses.map(c => c.id) }
        },
        select: {
          course_id: true,
          completion_pct: true,
          started_at: true,
          status: true,
          modules_completed: true,
          modules_total: true
        }
      });

      progressRecords.forEach(p => {
        progressMap.set(p.course_id, p as CourseProgressData);
      });
    }

    // Transform courses to curriculum nodes
    const curriculumNodes = courses.map(course => {
      const progress = progressMap.get(course.id);
      const status = userId
        ? calculateCourseStatus(course, progressMap)
        : 'viewable' as const;

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description || '',
        tags: course.tags,
        featured: course.featured,
        position: {
          x: course.curriculum_position_x ?? 50,
          y: course.curriculum_position_y ?? 50
        },
        prerequisites: course.prerequisite_course_ids || [],
        moduleCount: course.course_modules.length,
        instructor: {
          name: course.users.name,
          avatar_url: course.users.avatar_url,
          title: course.users.title,
          department: course.users.department
        },
        // Authenticated users get progress data
        ...(userId && {
          status,
          completionPct: progress?.completion_pct || 0,
          modulesCompleted: progress?.modules_completed || 0,
          modulesTotal: progress?.modules_total || course.course_modules.length,
          startedAt: progress?.started_at?.toISOString() || null,
          isCompleted: progress?.completion_pct === 100 || progress?.status === 'completed'
        })
      };
    });

    // Calculate path progress for authenticated users
    let pathProgress = null;
    if (userId) {
      const completedCourses = curriculumNodes.filter(c => c.isCompleted).length;
      const totalCourses = curriculumNodes.length;
      const overallCompletion = totalCourses > 0
        ? Math.round((completedCourses / totalCourses) * 100)
        : 0;

      pathProgress = {
        coursesCompleted: completedCourses,
        coursesTotal: totalCourses,
        completionPct: overallCompletion,
        coursesInProgress: curriculumNodes.filter(c => c.status === 'in_progress').length
      };
    }

    return {
      path: {
        id: path.id,
        title: path.title,
        slug: path.slug,
        description: path.description,
        isFeatured: path.is_featured,
        createdBy: {
          name: path.creator.name,
          avatar_url: path.creator.avatar_url,
          title: path.creator.title,
          department: path.creator.department
        },
        createdAt: path.created_at.toISOString()
      },
      courses: curriculumNodes,
      ...(pathProgress && { pathProgress })
    };
  });

  if ('error' in data) {
    return NextResponse.json(
      { error: data.error },
      { status: data.status }
    );
  }

  return NextResponse.json(data);
}

/**
 * Calculate course status based on prerequisites and user progress
 */
function calculateCourseStatus(
  course: { id: string; prerequisite_course_ids: string[] },
  progressMap: Map<string, CourseProgressData>
): CourseStatus {
  const progress = progressMap.get(course.id);

  // If completed (100% or status is completed)
  if (progress && (progress.completion_pct === 100 || progress.status === 'completed')) {
    return 'completed';
  }

  // Check prerequisites
  const prerequisites = course.prerequisite_course_ids || [];

  if (prerequisites.length > 0) {
    const allPrereqsCompleted = prerequisites.every(prereqId => {
      const prereqProgress = progressMap.get(prereqId);
      return prereqProgress && (prereqProgress.completion_pct === 100 || prereqProgress.status === 'completed');
    });

    if (!allPrereqsCompleted) {
      return 'locked';
    }
  }

  // If started but not completed
  if (progress?.started_at) {
    return 'in_progress';
  }

  // If prerequisites met but not started
  return 'available';
}

/**
 * PUT /api/paths/[slug]
 * Update learning path
 * Faculty/Admin only (must be creator or admin)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  // Get current path
  const currentPath = await prisma.learning_paths.findUnique({
    where: { slug },
    select: { created_by: true }
  });

  if (!currentPath) {
    return NextResponse.json({ error: 'Learning path not found' }, { status: 404 });
  }

  // Check permissions (must be creator or admin)
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (currentPath.created_by !== session.user.id && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Not authorized to edit this path' }, { status: 403 });
  }

  const { title, description, course_ids, is_featured, sort_order, newSlug } = await request.json();

  // If changing slug, check it's available
  if (newSlug && newSlug !== slug) {
    const existing = await prisma.learning_paths.findUnique({
      where: { slug: newSlug }
    });

    if (existing) {
      return NextResponse.json({ error: 'New slug already exists' }, { status: 400 });
    }
  }

  const updatedPath = await withDatabaseRetry(async () => {
    return await prisma.learning_paths.update({
      where: { slug },
      data: {
        ...(title && { title }),
        ...(newSlug && { slug: newSlug }),
        ...(description !== undefined && { description }),
        ...(course_ids && { course_ids }),
        ...(is_featured !== undefined && { is_featured }),
        ...(sort_order !== undefined && { sort_order })
      }
    });
  });

  return NextResponse.json({ path: updatedPath });
}

/**
 * DELETE /api/paths/[slug]
 * Delete learning path
 * Faculty/Admin only (must be creator or admin)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  // Get current path
  const currentPath = await prisma.learning_paths.findUnique({
    where: { slug },
    select: { created_by: true }
  });

  if (!currentPath) {
    return NextResponse.json({ error: 'Learning path not found' }, { status: 404 });
  }

  // Check permissions (must be creator or admin)
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (currentPath.created_by !== session.user.id && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Not authorized to delete this path' }, { status: 403 });
  }

  await withDatabaseRetry(async () => {
    await prisma.learning_paths.delete({
      where: { slug }
    });
  });

  return NextResponse.json({ success: true });
}
