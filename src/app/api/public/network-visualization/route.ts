import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'

export async function GET(request: NextRequest) {
  try {
    // No authentication required - this is a public endpoint
    // Only fetch published content from all users
    
    const [modules, courses] = await Promise.all([
      withDatabaseRetry(async () =>
        prisma.modules.findMany({
          where: {
            status: 'published', // Only published modules
          },
          take: 500, // Safety cap to prevent unbounded queries under load
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            status: true,
            parent_module_id: true,
            sort_order: true,
            created_at: true,
            users: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            sort_order: 'asc',
          },
        }), { maxAttempts: 5 }
      ),
      withDatabaseRetry(async () =>
        prisma.courses.findMany({
          where: {
            status: 'published', // Only published courses
          },
          take: 100, // Safety cap to prevent unbounded queries under load
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
            _count: {
              select: {
                course_modules: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        }), { maxAttempts: 5 }
      ),
    ])

    // Transform field names to match frontend expectations
    const transformedModules = modules.map(module => ({
      ...module,
      parentModuleId: module.parent_module_id,
      sortOrder: module.sort_order,
      createdAt: module.created_at?.toISOString(),
      author: module.users,
    }))

    const transformedCourses = courses.map(course => ({
      ...course,
      author: course.users,
      courseModules: course.course_modules
        ?.filter(cm => cm.modules && cm.modules.status === 'published') // Only include course modules with published modules
        .map(cm => ({
          ...cm,
          module: {
            ...cm.modules,
            parentModuleId: cm.modules.parent_module_id,
            sortOrder: cm.modules.sort_order,
          }
        })) || [],
      _count: {
        courseModules: course.course_modules?.filter(cm => cm.modules && cm.modules.status === 'published').length || 0,
      }
    }))

    // Filter out courses with no published modules
    const coursesWithModules = transformedCourses.filter(course => course.courseModules.length > 0)

    const response = {
      type: 'public',
      modules: transformedModules,
      courses: coursesWithModules,
      stats: {
        totalCourses: coursesWithModules.length,
        totalModules: transformedModules.length,
        rootModules: transformedModules.filter(m => !m.parentModuleId).length,
        subModules: transformedModules.filter(m => m.parentModuleId).length,
      }
    }

    const res = NextResponse.json(response)
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res
  } catch (error) {
    console.error('Error fetching public network data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch network visualization data',
        modules: [],
        courses: [],
        stats: { totalCourses: 0, totalModules: 0, rootModules: 0, subModules: 0 }
      },
      { status: 500 }
    )
  }
}
