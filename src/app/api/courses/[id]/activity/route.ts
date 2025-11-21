import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions'
import { getActivityFeed } from '@/lib/collaboration/activity'
import type { ActivityAction } from '@/types/collaboration'
import { hasFacultyAccess } from '@/lib/auth/utils'

/**
 * GET /api/courses/[id]/activity
 * Get activity feed for a course with pagination and filters
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - userId: Filter by user ID (optional)
 * - action: Filter by action type (optional)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId } = await params

    // Check if user can access this course (author or collaborator)
    const canAccess = await canEditCourseWithRetry(session.user.id, courseId)
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to access it' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!, 10)
      : undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') as ActivityAction | undefined

    // Get activity feed
    const feed = await getActivityFeed('course', courseId, {
      page,
      limit,
      userId,
      action,
    })

    return NextResponse.json(feed)
  } catch (error) {
    console.error('Error fetching activity feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    )
  }
}
