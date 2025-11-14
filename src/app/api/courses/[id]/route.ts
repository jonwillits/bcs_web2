import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions'

const updateCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long').optional(),
  description: z.string().optional(),
  modules: z.array(z.object({
    moduleId: z.string(),
    order: z.number(),
  })).optional(),
  status: z.enum(['draft', 'published']).optional(),
  featured: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeModules = searchParams.get('includeModules') === 'true'

    const course = await prisma.courses.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            name: true,
            email: true,
          },
        },
        ...(includeModules && {
          course_modules: {
            include: {
              modules: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  description: true,
                  content: true,
                  status: true,
                  created_at: true,
                },
              },
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
        }),
        _count: {
          select: {
            course_modules: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user has access (public if published, or author for any status)
    const session = await auth()
    const isAuthor = session?.user?.id === course.author_id
    const isPublished = course.status === 'published'

    if (!isPublished && !isAuthor) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
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

    // Check if user can edit this course (author or collaborator)
    const canEdit = await canEditCourseWithRetry(session.user.id, id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Fetch the existing course for validation
    const existingCourse = await prisma.courses.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateCourseSchema.parse(body)

    // If slug is being updated, check uniqueness for the course author
    if (validatedData.slug && validatedData.slug !== existingCourse.slug) {
      const slugExists = await prisma.courses.findFirst({
        where: {
          slug: validatedData.slug,
          author_id: existingCourse.author_id, // Check against original author, not current user
          id: { not: id },
        },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'A course with this slug already exists for this author' },
          { status: 400 }
        )
      }
    }

    // CRITICAL FIX: Verify modules exist, are published, and respect visibility rules
    // Course collaborators can ADD any public module without needing edit access
    // This separates curation (course structure) from content creation (module editing)
    if (validatedData.modules) {
      if (validatedData.modules.length > 0) {
        const moduleIds = validatedData.modules.map(m => m.moduleId)

        // Fetch modules with visibility and status info
        const existingModules = await prisma.modules.findMany({
          where: { id: { in: moduleIds }},
          select: {
            id: true,
            title: true,
            status: true,
            visibility: true,
            author_id: true
          }
        })

        // Check 1: Do all modules exist?
        if (existingModules.length !== moduleIds.length) {
          const missingIds = moduleIds.filter(
            id => !existingModules.find(m => m.id === id)
          )
          return NextResponse.json(
            { error: 'Some modules no longer exist', missingModuleIds: missingIds },
            { status: 400 }
          )
        }

        // Check 2: Validate each module can be added to course
        const invalidModules: Array<{id: string, title: string, reason: string}> = []

        for (const mod of existingModules) {
          // Must be published
          if (mod.status !== 'published') {
            invalidModules.push({
              id: mod.id,
              title: mod.title,
              reason: 'Module must be published before adding to course'
            })
            continue
          }

          // If private, only author can add to courses
          if (mod.visibility === 'private' && mod.author_id !== session.user.id) {
            invalidModules.push({
              id: mod.id,
              title: mod.title,
              reason: 'This is a private module. Only the author can add it to courses.'
            })
            continue
          }

          // If public and published, anyone can add! No permission check needed.
        }

        if (invalidModules.length > 0) {
          return NextResponse.json({
            error: 'Some modules cannot be added to this course',
            invalidModules
          }, { status: 400 })
        }
      }
    }

    // Update course and modules in a transaction
    const updatedCourse = await prisma.$transaction(async (tx) => {
      // Update course basic info
      const course = await tx.courses.update({
        where: { id },
        data: {
          title: validatedData.title,
          slug: validatedData.slug,
          description: validatedData.description,
          status: validatedData.status,
          featured: validatedData.featured,
        },
      })

      // Update modules if provided
      if (validatedData.modules !== undefined) {
        // Delete existing course-module relationships
        await tx.course_modules.deleteMany({
          where: { course_id: id },
        })

        // Create new relationships
        if (validatedData.modules.length > 0) {
          await tx.course_modules.createMany({
            data: validatedData.modules.map(({ moduleId, order }, index) => ({
              id: `${id}_${moduleId}_${Date.now()}_${index}`,
              course_id: id,
              module_id: moduleId,
              sort_order: order,
            })),
          })
        }
      }

      return course
    })

    // Fetch the updated course with complete details
    const courseWithDetails = await prisma.courses.findUnique({
      where: { id },
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
    })

    return NextResponse.json({ course: courseWithDetails })
  } catch (error) {
    console.error('Error updating course:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update course' },
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

    // Check if user can edit this course (author or collaborator)
    const canEdit = await canEditCourseWithRetry(session.user.id, id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Verify course exists
    const course = await prisma.courses.findUnique({
      where: { id },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Delete course in a transaction to ensure all related records are cleaned up
    await prisma.$transaction(async (tx) => {
      // Manual cleanup for collaboration_activity (no foreign key CASCADE due to polymorphic relationship)
      await tx.collaboration_activity.deleteMany({
        where: {
          entity_type: 'course',
          entity_id: id,
        },
      })

      // Delete course (CASCADE will handle course_modules and course_collaborators)
      await tx.courses.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
