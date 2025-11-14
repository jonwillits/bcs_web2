import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions'
import { logCollaboratorAdded } from '@/lib/collaboration/activity'
import type { Collaborator } from '@/types/collaboration'

const addCollaboratorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  cascadeToModules: z.boolean().optional().default(false),
})

/**
 * GET /api/courses/[id]/collaborators
 * List all collaborators for a course
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

    const { id: courseId } = await params

    // Check if user can access this course (author or collaborator)
    const canAccess = await canEditCourseWithRetry(session.user.id, courseId)
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to access it' },
        { status: 404 }
      )
    }

    // Fetch all collaborators with user info
    const collaborators = await prisma.course_collaborators.findMany({
      where: { course_id: courseId },
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
 * POST /api/courses/[id]/collaborators
 * Add a new collaborator to a course
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

    const { id: courseId } = await params

    // Check if user can manage collaborators for this course (author or existing collaborator)
    const canManage = await canEditCourseWithRetry(session.user.id, courseId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to manage collaborators' },
        { status: 404 }
      )
    }

    // Validate request body
    const body = await request.json()
    const { userId, cascadeToModules } = addCollaboratorSchema.parse(body)

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

    // Check if user is the course author
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { author_id: true, title: true },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.author_id === userId) {
      return NextResponse.json(
        { error: 'Course author is already a collaborator by default' },
        { status: 400 }
      )
    }

    // Check if user is already a collaborator
    const existingCollaboration = await prisma.course_collaborators.findUnique({
      where: {
        course_id_user_id: {
          course_id: courseId,
          user_id: userId,
        },
      },
    })

    if (existingCollaboration) {
      return NextResponse.json(
        { error: 'User is already a collaborator on this course' },
        { status: 409 }
      )
    }

    // Add collaborator
    const newCollaborator = await prisma.course_collaborators.create({
      data: {
        course_id: courseId,
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

    // Cascade permissions to modules if requested
    if (cascadeToModules) {
      try {
        // Fetch all modules in this course
        const courseModules = await prisma.course_modules.findMany({
          where: { course_id: courseId },
          include: {
            modules: {
              select: {
                id: true,
                title: true,
                visibility: true,
                author_id: true,
              },
            },
          },
        })

        // Filter to only public modules and add collaborator to each
        const modulesToAddTo = courseModules
          .filter(cm => cm.modules.visibility === 'public')
          .map(cm => cm.modules)

        // For each public module, add the collaborator if not already added
        for (const courseModule of modulesToAddTo) {
          // Check if already a collaborator
          const existingModuleCollab = await prisma.module_collaborators.findUnique({
            where: {
              module_id_user_id: {
                module_id: courseModule.id,
                user_id: userId,
              },
            },
          })

          // Only add if not already a collaborator and not the author
          if (!existingModuleCollab && courseModule.author_id !== userId) {
            await prisma.module_collaborators.create({
              data: {
                module_id: courseModule.id,
                user_id: userId,
                added_by: session.user.id,
              },
            })

            // Log activity for module collaboration
            await logCollaboratorAdded(
              'module',
              courseModule.id,
              session.user.id,
              session.user.name || 'Unknown',
              userId,
              userToAdd.name
            )
          }
        }

        console.log(`Cascaded permissions to ${modulesToAddTo.length} public modules`)
      } catch (cascadeError) {
        // Log error but don't fail the request - course collaborator was already added
        console.error('Error cascading permissions to modules:', cascadeError)
      }
    }

    // Log activity
    await logCollaboratorAdded(
      'course',
      courseId,
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
