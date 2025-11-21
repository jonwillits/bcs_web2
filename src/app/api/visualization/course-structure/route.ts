import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { hasFacultyAccess } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (courseId) {
      // Get specific course structure
      const course = await withDatabaseRetry(async () =>
        prisma.courses.findFirst({
          where: {
            id: courseId,
            author_id: session.user.id,
          },
          include: {
            course_modules: {
              include: {
                modules: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    status: true,
                    parent_module_id: true,
                    sort_order: true,
                  },
                },
              },
              orderBy: {
                sort_order: 'asc',
              },
            },
          },
        })
      )

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      // Transform field names to match frontend expectations
      const transformedCourse = {
        ...course,
        courseModules: course.course_modules.map(cm => ({
          ...cm,
          module: {
            ...cm.modules,
            parentModuleId: cm.modules.parent_module_id,
            sortOrder: cm.modules.sort_order,
          }
        }))
      }

      return NextResponse.json({ 
        type: 'course',
        course: transformedCourse,
        modules: course.course_modules.map(cm => ({
          ...cm.modules,
          parentModuleId: cm.modules.parent_module_id,
          sortOrder: cm.modules.sort_order,
        }))
      })
    } else {
      // Get all user's modules and courses for full structure view
      const [modules, courses] = await Promise.all([
        withDatabaseRetry(async () =>
          prisma.modules.findMany({
            where: {
              author_id: session.user.id,
            },
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              status: true,
              parent_module_id: true,
              sort_order: true,
              created_at: true,
            },
            orderBy: {
              sort_order: 'asc',
            },
          })
        ),
        withDatabaseRetry(async () =>
          prisma.courses.findMany({
            where: {
              author_id: session.user.id,
            },
            include: {
              course_modules: {
                include: {
                  modules: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      description: true,
                      status: true,
                      parent_module_id: true,
                      sort_order: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  course_modules: true,
                },
              },
            },
          })
        ),
      ])

      // Transform field names to match frontend expectations
      const transformedModules = modules.map(module => ({
        ...module,
        parentModuleId: module.parent_module_id,
        sortOrder: module.sort_order,
        createdAt: module.created_at?.toISOString(),
      }))

      const transformedCourses = courses.map(course => ({
        ...course,
        courseModules: course.course_modules?.map(cm => ({
          ...cm,
          module: {
            ...cm.modules,
            parentModuleId: cm.modules.parent_module_id,
            sortOrder: cm.modules.sort_order,
          }
        })) || [],
        _count: {
          courseModules: course._count.course_modules,
        }
      }))

      return NextResponse.json({
        type: 'full',
        modules: transformedModules,
        courses: transformedCourses,
      })
    }
  } catch (error) {
    console.error('Error fetching course structure:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course structure' },
      { status: 500 }
    )
  }
}
