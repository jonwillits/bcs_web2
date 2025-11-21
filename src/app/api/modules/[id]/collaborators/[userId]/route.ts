import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions'
import { logCollaboratorRemoved } from '@/lib/collaboration/activity'
import { hasFacultyAccess } from '@/lib/auth/utils'

/**
 * DELETE /api/modules/[id]/collaborators/[userId]
 * Remove a collaborator from a module
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: moduleId, userId } = await params

    // Check if current user can manage collaborators for this module
    const canManage = await canEditModuleWithRetry(session.user.id, moduleId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Module not found or you do not have permission to manage collaborators' },
        { status: 404 }
      )
    }

    // Find the collaborator to remove
    const collaborator = await prisma.module_collaborators.findUnique({
      where: {
        module_id_user_id: {
          module_id: moduleId,
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
    await prisma.module_collaborators.delete({
      where: {
        module_id_user_id: {
          module_id: moduleId,
          user_id: userId,
        },
      },
    })

    // Log activity
    await logCollaboratorRemoved(
      'module',
      moduleId,
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
