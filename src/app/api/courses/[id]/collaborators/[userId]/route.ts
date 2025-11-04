import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions'
import { logCollaboratorRemoved } from '@/lib/collaboration/activity'

/**
 * DELETE /api/courses/[id]/collaborators/[userId]
 * Remove a collaborator from a course
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'faculty') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId, userId } = await params

    // Check if current user can manage collaborators for this course
    const canManage = await canEditCourseWithRetry(session.user.id, courseId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to manage collaborators' },
        { status: 404 }
      )
    }

    // Find the collaborator to remove
    const collaborator = await prisma.course_collaborators.findUnique({
      where: {
        course_id_user_id: {
          course_id: courseId,
          user_id: userId,
        },
      },
      include: {
        collaborator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Collaborator not found' },
        { status: 404 }
      )
    }

    // Remove the collaborator
    await prisma.course_collaborators.delete({
      where: {
        course_id_user_id: {
          course_id: courseId,
          user_id: userId,
        },
      },
    })

    // Log activity
    await logCollaboratorRemoved(
      'course',
      courseId,
      session.user.id,
      session.user.name || 'Unknown',
      userId,
      collaborator.collaborator.name
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing collaborator:', error)
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    )
  }
}
