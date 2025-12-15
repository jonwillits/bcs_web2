import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/courses/[slug]/map
 * Public endpoint to fetch course structure for quest map visualization
 * No authentication required - for course preview/marketing
 *
 * Quest Map Feature - Public preview endpoint
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const data = await withDatabaseRetry(async () => {
    // Fetch course with modules
    const course = await prisma.courses.findUnique({
      where: { slug, status: 'published' },
      include: {
        course_modules: {
          include: {
            modules: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                module_number: true,
                parent_module_id: true,
                sort_order: true,
                status: true,
                // Quest map fields
                prerequisite_module_ids: true,
                quest_map_position_x: true,
                quest_map_position_y: true,
                xp_reward: true,
                difficulty_level: true,
                estimated_minutes: true,
                quest_type: true
              }
            }
          },
          orderBy: { sort_order: 'asc' }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            title: true,
            department: true
          }
        }
      }
    });

    if (!course) {
      return null;
    }

    // Filter out draft modules and transform to quest format
    const publishedModules = course.course_modules
      .map(cm => cm.modules)
      .filter(m => m.status === 'published');

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        author: {
          name: course.users.name,
          email: course.users.email,
          avatar_url: course.users.avatar_url,
          title: course.users.title,
          department: course.users.department
        },
        tags: course.tags,
        featured: course.featured
      },
      quests: publishedModules.map(m => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        description: m.description || '',
        moduleNumber: m.module_number,
        position: {
          x: m.quest_map_position_x ?? 50,
          y: m.quest_map_position_y ?? 50
        },
        prerequisites: m.prerequisite_module_ids || [],
        xp: m.xp_reward,
        difficulty: m.difficulty_level,
        estimatedMinutes: m.estimated_minutes,
        type: m.quest_type,
        // Public mode: all quests are viewable
        status: 'viewable' as const
      })),
      totalModules: publishedModules.length,
      totalXP: publishedModules.reduce((sum, m) => sum + m.xp_reward, 0)
    };
  });

  if (!data) {
    return NextResponse.json(
      { error: 'Course not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
