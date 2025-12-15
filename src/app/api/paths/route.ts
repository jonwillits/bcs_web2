import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/paths
 * Returns list of all learning paths
 *
 * Curriculum Visualization Feature - Learning Paths
 */
export async function GET() {
  const data = await withDatabaseRetry(async () => {
    const paths = await prisma.learning_paths.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        course_ids: true,
        is_featured: true,
        sort_order: true,
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
      },
      orderBy: [
        { is_featured: 'desc' },
        { sort_order: 'asc' },
        { created_at: 'desc' }
      ]
    });

    // Get course counts for each path
    const pathsWithCounts = await Promise.all(
      paths.map(async path => {
        const courseCount = await prisma.courses.count({
          where: {
            id: { in: path.course_ids },
            status: 'published'
          }
        });

        return {
          id: path.id,
          title: path.title,
          slug: path.slug,
          description: path.description,
          courseCount,
          isFeatured: path.is_featured,
          createdBy: {
            name: path.creator.name,
            avatar_url: path.creator.avatar_url,
            title: path.creator.title,
            department: path.creator.department
          },
          createdAt: path.created_at.toISOString()
        };
      })
    );

    return {
      paths: pathsWithCounts,
      totalPaths: paths.length
    };
  });

  return NextResponse.json(data);
}

/**
 * POST /api/paths
 * Create a new learning path
 * Faculty/Admin only
 */
export async function POST(request: Request) {
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

  const { title, slug, description, course_ids, is_featured, sort_order } = await request.json();

  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
  }

  // Check if slug already exists
  const existing = await prisma.learning_paths.findUnique({
    where: { slug }
  });

  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
  }

  const path = await withDatabaseRetry(async () => {
    return await prisma.learning_paths.create({
      data: {
        title,
        slug,
        description: description || null,
        course_ids: course_ids || [],
        is_featured: is_featured || false,
        sort_order: sort_order || 0,
        created_by: session.user.id
      }
    });
  });

  return NextResponse.json({ path }, { status: 201 });
}
