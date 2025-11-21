import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { z } from 'zod'
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions'
import { hasFacultyAccess } from '@/lib/auth/utils'

const updateCourseModuleSchema = z.object({
  custom_notes: z.string().optional().nullable(),
  custom_context: z.string().optional().nullable(),
  custom_objectives: z.string().optional().nullable(),
  custom_title: z.string().max(200).optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId, moduleId } = await params

    // Check if user can edit this course
    const canEdit = await canEditCourseWithRetry(session.user.id, courseId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = updateCourseModuleSchema.parse(body)

    // Check if the course-module relationship exists
    const existingRelation = await withDatabaseRetry(async () => {
      return prisma.course_modules.findFirst({
        where: {
          course_id: courseId,
          module_id: moduleId,
        },
      })
    })

    if (!existingRelation) {
      return NextResponse.json(
        { error: 'This module is not part of this course' },
        { status: 404 }
      )
    }

    // Update the course_modules record
    const updated = await withDatabaseRetry(async () => {
      return prisma.course_modules.update({
        where: {
          id: existingRelation.id,
        },
        data: validatedData,
        include: {
          modules: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              content: true,
              status: true,
            },
          },
        },
      })
    })

    return NextResponse.json({
      courseModule: updated,
      message: 'Module notes updated successfully',
    })
  } catch (error) {
    console.error('Error updating course module notes:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update module notes' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId, moduleId } = await params

    // Check if user can access this course
    const canAccess = await canEditCourseWithRetry(session.user.id, courseId)
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to access it' },
        { status: 404 }
      )
    }

    // Fetch the course-module relationship
    const courseModule = await withDatabaseRetry(async () => {
      return prisma.course_modules.findFirst({
        where: {
          course_id: courseId,
          module_id: moduleId,
        },
        include: {
          modules: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              content: true,
              status: true,
            },
          },
        },
      })
    })

    if (!courseModule) {
      return NextResponse.json(
        { error: 'This module is not part of this course' },
        { status: 404 }
      )
    }

    return NextResponse.json({ courseModule })
  } catch (error) {
    console.error('Error fetching course module:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course module' },
      { status: 500 }
    )
  }
}
