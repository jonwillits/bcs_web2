import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const course = await withDatabaseRetry(async () => {
      return await prisma.courses.findFirst({
        where: {
          slug,
          status: 'published', // Only show published courses publicly
        },
        include: {
          users: {
            select: {
              name: true,
              email: true,
            },
          },
          course_modules: {
            include: {
              modules: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  description: true,
                  content: true,
                  status: true,
                  parent_module_id: true,
                  sort_order: true,
                  created_at: true,
                  updated_at: true,
                },
              },
            },
            where: {
              modules: {
                status: 'published', // Only include published modules
              },
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
          _count: {
            select: {
              course_modules: true,
            },
          },
        },
      })
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Transform data structure to match component expectations
    const transformedCourse = {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      featured: course.featured || false,
      status: course.status,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      author: {
        name: course.users.name,
        email: course.users.email,
      },
      courseModules: course.course_modules.map(cm => ({
        sortOrder: cm.sort_order,
        module: {
          id: cm.modules.id,
          title: cm.modules.title,
          slug: cm.modules.slug,
          description: cm.modules.description,
          content: cm.modules.content,
          status: cm.modules.status,
          parentModuleId: cm.modules.parent_module_id,
          sortOrder: cm.modules.sort_order,
          createdAt: cm.modules.created_at,
          updatedAt: cm.modules.updated_at,
        }
      })),
      _count: {
        courseModules: course._count.course_modules,
      },
    }

    const res = NextResponse.json({ course: transformedCourse })
    res.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    return res
  } catch (error) {
    console.error('Error fetching public course by slug:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}
