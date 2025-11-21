import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { z } from 'zod'
import { hasFacultyAccess } from '@/lib/auth/utils'

const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
  description: z.string().optional(),
  modules: z.array(z.object({
    moduleId: z.string(),
    order: z.number(),
  })).optional().default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  featured: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCourseSchema.parse(body)

    // Check if slug is unique for this author
    const existingCourse = await prisma.courses.findFirst({
      where: {
        slug: validatedData.slug,
        author_id: session.user.id,
      },
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'A course with this slug already exists' },
        { status: 400 }
      )
    }

    // Verify all modules belong to the author
    if (validatedData.modules.length > 0) {
      const moduleIds = validatedData.modules.map(m => m.moduleId)
      const userModules = await prisma.modules.findMany({
        where: {
          id: { in: moduleIds },
          author_id: session.user.id,
        },
      })

      if (userModules.length !== moduleIds.length) {
        return NextResponse.json(
          { error: 'Some modules do not exist or do not belong to you' },
          { status: 400 }
        )
      }
    }

    // Clean and validate tags
    const cleanTags = validatedData.tags
      .map(tag => tag.trim().toLowerCase())
      .filter((tag, index, arr) => tag.length > 0 && arr.indexOf(tag) === index) // Remove duplicates and empty tags

    // Create course with modules in a transaction
    const newCourse = await prisma.$transaction(async (tx) => {
      const course = await tx.courses.create({
        data: {
          id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          title: validatedData.title,
          slug: validatedData.slug,
          description: validatedData.description,
          status: validatedData.status,
          featured: validatedData.featured,
          tags: cleanTags,
          author_id: session.user.id,
        },
      })

      // Create course-module relationships
      if (validatedData.modules.length > 0) {
        await tx.course_modules.createMany({
          data: validatedData.modules.map(({ moduleId, order }, index) => ({
            id: `${course.id}_${moduleId}_${Date.now()}_${index}`,
            course_id: course.id,
            module_id: moduleId,
            sort_order: order,
          })),
        })
      }

      return course
    })

    // Fetch the complete course with modules and author
    const courseWithDetails = await prisma.courses.findUnique({
      where: { id: newCourse.id },
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
    console.error('Error creating course:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const status = searchParams.get('status')
    const authorOnly = searchParams.get('authorOnly')
    const collaboratorOnly = searchParams.get('collaboratorOnly')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Validate pagination parameters
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 100) // Max 100 items per page
    const skip = (validPage - 1) * validLimit

    // If authorOnly is specified, require authentication
    if (authorOnly === 'true') {
      const session = await auth()
      if (!hasFacultyAccess(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const whereClause = {
        author_id: session.user.id,
        ...(status && { status }),
      }

      const [courses, totalCount] = await withDatabaseRetry(async () => {
        return await Promise.all([
          prisma.courses.findMany({
            where: whereClause,
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
                  collaborators: true,
                },
              },
            },
            orderBy: {
              updated_at: 'desc',
            },
            skip,
            take: validLimit,
          }),
          prisma.courses.count({ where: whereClause }),
        ]);
      }, { maxAttempts: 3, baseDelayMs: 500 })

      return NextResponse.json({
        courses,
        pagination: {
          page: validPage,
          limit: validLimit,
          totalCount,
          totalPages: Math.ceil(totalCount / validLimit),
        }
      })
    }

    // If collaboratorOnly is specified, require authentication
    if (collaboratorOnly === 'true') {
      const session = await auth()
      if (!hasFacultyAccess(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const whereClause = {
        collaborators: {
          some: {
            user_id: session.user.id,
          }
        },
        ...(status && { status }),
      }

      const [courses, totalCount] = await withDatabaseRetry(async () => {
        return await Promise.all([
          prisma.courses.findMany({
            where: whereClause,
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
                  collaborators: true,
                },
              },
            },
            orderBy: {
              updated_at: 'desc',
            },
            skip,
            take: validLimit,
          }),
          prisma.courses.count({ where: whereClause }),
        ]);
      }, { maxAttempts: 3, baseDelayMs: 500 })

      return NextResponse.json({
        courses,
        pagination: {
          page: validPage,
          limit: validLimit,
          totalCount,
          totalPages: Math.ceil(totalCount / validLimit),
        }
      })
    }

    // Public course listing with proper PgBouncer configuration
    const whereClause = {
      status: 'published',
      ...(featured === 'true' && { featured: true }),
    }

    const [courses, totalCount] = await Promise.all([
      prisma.courses.findMany({
        where: whereClause,
        include: {
          users: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              course_modules: true,
            },
          },
        },
        orderBy: [
          { featured: 'desc' },
          { updated_at: 'desc' },
        ],
        skip,
        take: validLimit,
      }),
      prisma.courses.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      courses,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / validLimit),
      }
    })
  } catch (error) {
    console.error('=== DETAILED ERROR ANALYSIS ===')
    console.error('Error fetching courses - Full details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      code: error.code || 'N/A'
    })
    
    // Log environment info (without sensitive data)
    console.error('Environment info:', {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.slice(0, 20) + '...',
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses', 
        errorType: error.name,
        errorCode: error.code || 'UNKNOWN',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Check server logs for details'
      },
      { status: 500 }
    )
  }
}