import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { z } from 'zod'
import { canEditModuleWithRetry } from '@/lib/collaboration/permissions'

// Helper function to check if a module is an ancestor of another module
async function checkIfModuleIsAncestor(moduleId: string, potentialDescendantId: string): Promise<boolean> {
  if (moduleId === potentialDescendantId) {
    return true
  }

  const descendant = await prisma.modules.findUnique({
    where: { id: potentialDescendantId },
    select: { parent_module_id: true },
  })

  if (!descendant || !descendant.parent_module_id) {
    return false
  }

  return await checkIfModuleIsAncestor(moduleId, descendant.parent_module_id)
}

const updateModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long').optional(),
  content: z.string().optional(),
  description: z.string().optional(),
  parent_module_id: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'faculty') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Validate the ID parameter
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 })
    }
    // Check if user can access this module (author or collaborator)
    const canAccess = await canEditModuleWithRetry(session.user.id, id)
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Module not found or you do not have permission to access it' },
        { status: 404 }
      )
    }

    const foundModule = await withDatabaseRetry(async () => {
      return prisma.modules.findUnique({
        where: { id },
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
          _count: {
            select: {
              other_modules: true,
              course_modules: true,
            },
          },
        },
      })
    })

    if (!foundModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 }
      )
    }

    return NextResponse.json({ module: foundModule })
  } catch (error) {
    console.error('Error fetching module:', error)
    
    // Check if it's a Prisma validation error
    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'faculty') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user can edit this module (author or collaborator)
    const canEdit = await canEditModuleWithRetry(session.user.id, id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Module not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Fetch the existing module
    const existingModule = await prisma.modules.findUnique({
      where: { id },
    })

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const body = await request.json()
    console.log('Request body received:', JSON.stringify(body, null, 2))
    const validatedData = updateModuleSchema.parse(body)
    console.log('Validated data:', JSON.stringify(validatedData, null, 2))

    // If slug is being updated, check uniqueness for the module author
    if (validatedData.slug && validatedData.slug !== existingModule.slug) {
      const slugExists = await prisma.modules.findFirst({
        where: {
          slug: validatedData.slug,
          author_id: existingModule.author_id, // Check against original author
          id: { not: id },
        },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'A module with this slug already exists for this author' },
          { status: 400 }
        )
      }
    }

    // Simplified validation - just log what we receive
    console.log('=== MODULE UPDATE DEBUG ===')
    console.log('Module ID being updated:', id)
    console.log('User ID:', session.user.id)
    console.log('parent_module_id received:', validatedData.parent_module_id)
    console.log('parent_module_id type:', typeof validatedData.parent_module_id)
    console.log('================================')
    
    // Basic validation
    if (validatedData.parent_module_id !== undefined) {
      if (validatedData.parent_module_id === '') {
        // Convert empty string to null
        validatedData.parent_module_id = null
        console.log('Converted empty string to null')
      } else if (validatedData.parent_module_id !== null) {
        // Only validate if it's not null
        console.log('Checking if parent module exists...')
        const parentExists = await prisma.modules.findUnique({
          where: { id: validatedData.parent_module_id }
        })
        
        if (!parentExists) {
          console.log('❌ Parent module does not exist!')
          return NextResponse.json(
            { error: `Parent module '${validatedData.parent_module_id}' does not exist` },
            { status: 400 }
          )
        }
        
        console.log('✅ Parent module exists:', parentExists.title)
        
        // Basic circular reference check
        if (validatedData.parent_module_id === id) {
          console.log('❌ Circular reference detected!')
          return NextResponse.json(
            { error: 'A module cannot be its own parent' },
            { status: 400 }
          )
        }
      }
    }
    
    console.log('Final parent_module_id for update:', validatedData.parent_module_id)

    const updatedModule = await prisma.modules.update({
      where: { id },
      data: validatedData,
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
          orderBy: {
            sort_order: 'asc',
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

    return NextResponse.json({ module: updatedModule })
  } catch (error) {
    console.error('Error updating module:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'faculty') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user can delete this module (author or collaborator)
    const canEdit = await canEditModuleWithRetry(session.user.id, id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Module not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Fetch the module to delete
    const moduleToDelete = await prisma.modules.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            other_modules: true,
            course_modules: true,
          },
        },
      },
    })

    if (!moduleToDelete) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Prevent deletion if module has submodules or is used in courses
    if (moduleToDelete._count.other_modules > 0) {
      return NextResponse.json(
        { error: 'Cannot delete module with submodules. Please delete submodules first.' },
        { status: 400 }
      )
    }

    if (moduleToDelete._count.course_modules > 0) {
      return NextResponse.json(
        { error: 'Cannot delete module that is used in courses. Remove from courses first.' },
        { status: 400 }
      )
    }

    await prisma.modules.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting module:', error)
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    )
  }
}
