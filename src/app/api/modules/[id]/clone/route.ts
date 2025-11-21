import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { z } from 'zod'
import { hasFacultyAccess } from '@/lib/auth/utils'

const cloneModuleSchema = z.object({
  cloneMedia: z.boolean().optional().default(true),
  cloneCollaborators: z.boolean().optional().default(false),
  newTitle: z.string().min(1).max(200).optional(),
})

// Generate unique slug for cloned module
async function generateUniqueSlug(originalSlug: string, authorId: string): Promise<string> {
  let candidateSlug = `${originalSlug}-copy`
  let counter = 1

  while (true) {
    const exists = await prisma.modules.findFirst({
      where: {
        slug: candidateSlug,
        author_id: authorId,
      },
    })

    if (!exists) {
      return candidateSlug
    }

    candidateSlug = `${originalSlug}-copy-${counter}`
    counter++
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: originalModuleId } = await params

    // Validate request body
    const body = await request.json()
    const { cloneMedia, cloneCollaborators, newTitle } = cloneModuleSchema.parse(body)

    // Fetch the original module (must be public or user must have access)
    const originalModule = await withDatabaseRetry(async () => {
      return prisma.modules.findFirst({
        where: {
          id: originalModuleId,
          OR: [
            { visibility: 'public' },
            { author_id: session.user.id },
            {
              collaborators: {
                some: {
                  user_id: session.user.id,
                },
              },
            },
          ],
        },
        include: {
          module_media: {
            include: {
              media_files: true,
            },
          },
          collaborators: {
            include: {
              collaborator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    })

    if (!originalModule) {
      return NextResponse.json(
        { error: 'Module not found or you do not have permission to clone it' },
        { status: 404 }
      )
    }

    // Generate unique slug for the clone
    const clonedSlug = await generateUniqueSlug(originalModule.slug, session.user.id)

    // Generate new module ID
    const clonedModuleId = `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create the cloned module
    const clonedModule = await withDatabaseRetry(async () => {
      return prisma.$transaction(async (tx) => {
        // 1. Create the new module
        const newModule = await tx.modules.create({
          data: {
            id: clonedModuleId,
            title: newTitle || `${originalModule.title} (Copy)`,
            slug: clonedSlug,
            content: originalModule.content,
            description: originalModule.description,
            author_id: session.user.id,
            parent_module_id: null, // Clones are always root modules
            sort_order: 0,
            module_number: null,
            status: 'draft', // Clones start as drafts
            visibility: 'private', // Clones start as private
            cloned_from: originalModuleId,
            clone_count: 0,
            tags: originalModule.tags,
          },
          include: {
            users: {
              select: {
                name: true,
                email: true,
              },
            },
            modules: {
              select: {
                id: true,
                title: true,
              },
            },
            other_modules: {
              select: {
                id: true,
                title: true,
                status: true,
                created_at: true,
              },
            },
            module_media: {
              include: {
                media_files: true,
              },
            },
            original_module: {
              select: {
                id: true,
                title: true,
                slug: true,
                author_id: true,
                users: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                other_modules: true,
                course_modules: true,
              },
            },
          },
        })

        // 2. Clone media associations if requested
        if (cloneMedia && originalModule.module_media.length > 0) {
          const mediaAssociations = originalModule.module_media.map((mm) => ({
            id: `module_media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            module_id: clonedModuleId,
            media_file_id: mm.media_file_id,
          }))

          await tx.module_media.createMany({
            data: mediaAssociations,
          })
        }

        // 3. Clone collaborators if requested
        if (cloneCollaborators && originalModule.collaborators.length > 0) {
          const collaboratorAssociations = originalModule.collaborators
            .filter((c) => c.user_id !== session.user.id) // Don't add yourself as collaborator
            .map((c) => ({
              id: `module_collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              module_id: clonedModuleId,
              user_id: c.user_id,
              added_by: session.user.id,
            }))

          if (collaboratorAssociations.length > 0) {
            await tx.module_collaborators.createMany({
              data: collaboratorAssociations,
            })
          }
        }

        // 4. Increment clone count on original module
        await tx.modules.update({
          where: { id: originalModuleId },
          data: {
            clone_count: {
              increment: 1,
            },
          },
        })

        return newModule
      })
    })

    return NextResponse.json({
      module: clonedModule,
      message: 'Module cloned successfully',
    })
  } catch (error) {
    console.error('Error cloning module:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to clone module' },
      { status: 500 }
    )
  }
}
