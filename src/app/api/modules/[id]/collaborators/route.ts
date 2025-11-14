import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions'
import { logCollaboratorAdded } from '@/lib/collaboration/activity'
import type { Collaborator } from '@/types/collaboration'

const addCollaboratorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

/**
 * GET /api/modules/[id]/collaborators
 * List all collaborators for a module
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'faculty') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: moduleId } = await params

    // Check if user can access this module (author or collaborator)
    const canAccess = await canEditModuleWithRetry(session.user.id, moduleId)
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Module not found or you do not have permission to access it' },
        { status: 404 }
      )
    }

    // Fetch all collaborators with user info
    const collaborators = await prisma.module_collaborators.findMany({
      where: { module_id: moduleId },
      include: {
        collaborator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { added_at: 'asc' },
    })

    // Transform to API response format
    const transformedCollaborators: Collaborator[] = collaborators.map((collab) => ({
      id: collab.id,
      userId: collab.user_id,
      addedBy: collab.added_by,
      addedAt: collab.added_at,
      lastAccessed: collab.last_accessed,
      editCount: collab.edit_count,
      user: {
        id: collab.collaborator.id,
        name: collab.collaborator.name,
        email: collab.collaborator.email,
        avatar_url: collab.collaborator.avatar_url,
      },
      inviter: collab.inviter
        ? {
            id: collab.inviter.id,
            name: collab.inviter.name,
            email: collab.inviter.email,
          }
        : null,
    }))

    return NextResponse.json({
      collaborators: transformedCollaborators,
      count: transformedCollaborators.length,
    })
  } catch (error) {
    console.error('Error fetching collaborators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/modules/[id]/collaborators
 * Add a new collaborator to a module
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'faculty') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: moduleId } = await params

    // Check if user can manage collaborators for this module (author or existing collaborator)
    const canManage = await canEditModuleWithRetry(session.user.id, moduleId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Module not found or you do not have permission to manage collaborators' },
        { status: 404 }
      )
    }

    // Validate request body
    const body = await request.json()
    const { userId } = addCollaboratorSchema.parse(body)

    // Check if user exists and is faculty
    const userToAdd = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatar_url: true },
    })

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userToAdd.role !== 'faculty') {
      return NextResponse.json(
        { error: 'Only faculty members can be added as collaborators' },
        { status: 400 }
      )
    }

    // Check if user is the module author
    const moduleData = await prisma.modules.findUnique({
      where: { id: moduleId },
      select: { author_id: true, title: true },
    })

    if (!moduleData) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    if (moduleData.author_id === userId) {
      return NextResponse.json(
        { error: 'Module author is already a collaborator by default' },
        { status: 400 }
      )
    }

    // Check if user is already a collaborator
    const existingCollaboration = await prisma.module_collaborators.findUnique({
      where: {
        module_id_user_id: {
          module_id: moduleId,
          user_id: userId,
        },
      },
    })

    if (existingCollaboration) {
      return NextResponse.json(
        { error: 'User is already a collaborator on this module' },
        { status: 409 }
      )
    }

    // Add collaborator
    const newCollaborator = await prisma.module_collaborators.create({
      data: {
        module_id: moduleId,
        user_id: userId,
        added_by: session.user.id,
      },
      include: {
        collaborator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity
    await logCollaboratorAdded(
      'module',
      moduleId,
      session.user.id,
      session.user.name || 'Unknown',
      userId,
      userToAdd.name
    )

    // Transform to API response format
    const collaborator: Collaborator = {
      id: newCollaborator.id,
      userId: newCollaborator.user_id,
      addedBy: newCollaborator.added_by,
      addedAt: newCollaborator.added_at,
      lastAccessed: newCollaborator.last_accessed,
      editCount: newCollaborator.edit_count,
      user: {
        id: newCollaborator.collaborator.id,
        name: newCollaborator.collaborator.name,
        email: newCollaborator.collaborator.email,
        avatar_url: newCollaborator.collaborator.avatar_url,
      },
      inviter: newCollaborator.inviter
        ? {
            id: newCollaborator.inviter.id,
            name: newCollaborator.inviter.name,
            email: newCollaborator.inviter.email,
          }
        : null,
    }

    return NextResponse.json({ collaborator }, { status: 201 })
  } catch (error) {
    console.error('Error adding collaborator:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add collaborator' },
      { status: 500 }
    )
  }
}
