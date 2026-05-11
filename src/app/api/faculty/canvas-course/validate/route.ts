import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { hasFacultyAccess } from '@/lib/auth/utils'
import { getCanvasConfigForUser, getCanvasCourse } from '@/lib/canvas/client'

// GET /api/faculty/canvas-course/validate?courseId=68879
// Validates a Canvas Course ID using the faculty's own token and returns the course name.
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canvasCourseId = request.nextUrl.searchParams.get('courseId')
    if (!canvasCourseId || !/^\d+$/.test(canvasCourseId)) {
      return NextResponse.json(
        { error: 'A valid numeric Canvas Course ID is required.' },
        { status: 400 }
      )
    }

    const config = await getCanvasConfigForUser(session.user.id)
    if (!config) {
      return NextResponse.json(
        { error: 'Canvas is not configured. Please add your Canvas API token in your profile settings.' },
        { status: 400 }
      )
    }

    const result = await getCanvasCourse(config, canvasCourseId)

    if (!result.ok) {
      if (result.error.status === 404 || result.error.status === 401 || result.error.status === 403) {
        return NextResponse.json(
          { error: `Canvas course ${canvasCourseId} was not found, or you don't have access to it.` },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Canvas API error: ${result.error.message}` },
        { status: 502 }
      )
    }

    return NextResponse.json({
      id: result.data.id,
      name: result.data.name,
      courseCode: result.data.course_code,
    })
  } catch (error) {
    console.error('Error validating Canvas course:', error)
    return NextResponse.json({ error: 'Failed to validate Canvas course' }, { status: 500 })
  }
}
