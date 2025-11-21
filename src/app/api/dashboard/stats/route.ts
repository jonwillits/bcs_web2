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

    console.log('Dashboard stats request for user:', session.user.id)

    // Start with basic counts (most likely to succeed)
    let modulesCount = 0
    let coursesCount = 0

    try {
      modulesCount = await withDatabaseRetry(async () => 
        prisma.modules.count({
          where: { author_id: session.user.id }
        })
      )
      console.log('Modules count:', modulesCount)
    } catch (error) {
      console.error('Error counting modules:', error)
    }

    try {
      coursesCount = await withDatabaseRetry(async () =>
        prisma.courses.count({
          where: { author_id: session.user.id }
        })
      )
      console.log('Courses count:', coursesCount)
    } catch (error) {
      console.error('Error counting courses:', error)
    }

    // Try to get recent activity, but don't fail if this errors
    let recentActivity = []
    
    try {
      // Get recent modules (simplified query)
      const recentModules = await withDatabaseRetry(async () =>
        prisma.modules.findMany({
          where: { author_id: session.user.id },
          select: {
            id: true,
            title: true,
            status: true,
            updated_at: true,
            users: {
              select: { 
                name: true,
                email: true 
              }
            }
          },
          orderBy: { updated_at: 'desc' },
          take: 3
        })
      )
      
      // Get recent courses (simplified query)
      const recentCourses = await withDatabaseRetry(async () =>
        prisma.courses.findMany({
          where: { author_id: session.user.id },
          select: {
            id: true,
            title: true,
            status: true,
            updated_at: true,
            users: {
              select: { 
                name: true,
                email: true 
              }
            }
          },
          orderBy: { updated_at: 'desc' },
          take: 3
        })
      )

      // Transform to activity items
      const moduleActivity = recentModules.map(module => ({
        id: module.id,
        title: module.title,
        type: 'module' as const,
        status: module.status,
        updatedAt: module.updated_at.toISOString(),
        author: {
          name: module.users?.name || 'Unknown',
          email: module.users?.email || ''
        }
      }))

      const courseActivity = recentCourses.map(course => ({
        id: course.id,
        title: course.title,
        type: 'course' as const,
        status: course.status,
        updatedAt: course.updated_at.toISOString(),
        author: {
          name: course.users?.name || 'Unknown',
          email: course.users?.email || ''
        }
      }))

      recentActivity = [...moduleActivity, ...courseActivity]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8)
        
      console.log('Recent activity items:', recentActivity.length)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      recentActivity = []
    }

    return NextResponse.json({
      stats: {
        modules: modulesCount,
        courses: coursesCount,
        students: 0, // Placeholder for future enrollment system
        views: 0,    // Placeholder for future analytics
      },
      recentActivity
    })
  } catch (error) {
    console.error('Critical error in dashboard stats:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    })
    
    // Return basic fallback data instead of 500 error
    return NextResponse.json({
      stats: {
        modules: 0,
        courses: 0,
        students: 0,
        views: 0,
      },
      recentActivity: []
    })
  }
}