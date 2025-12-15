import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { z } from 'zod'
import { hasFacultyAccess } from '@/lib/auth/utils'

const createModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
  content: z.string().optional(),
  description: z.string().optional(),
  parent_module_id: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  visibility: z.enum(['public', 'private']).default('public'),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),

  // Quest Map fields
  prerequisite_module_ids: z.array(z.string()).default([]),
  quest_map_position_x: z.number().min(0).max(100).default(50),
  quest_map_position_y: z.number().min(0).max(100).default(50),
  xp_reward: z.number().int().min(0).max(10000).default(100),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced', 'boss']).default('beginner'),
  estimated_minutes: z.number().int().min(0).max(999).optional(),
  quest_type: z.enum(['standard', 'challenge', 'boss', 'bonus']).default('standard'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received in API:', body);
    const validatedData = createModuleSchema.parse(body)
    console.log('Validated data:', validatedData);

    // Check if slug is unique for this author (with retry)
    const existingModule = await withDatabaseRetry(async () => {
      return prisma.modules.findFirst({
        where: {
          slug: validatedData.slug,
          author_id: session.user.id,
        },
      })
    })

    if (existingModule) {
      return NextResponse.json(
        { error: 'A module with this slug already exists' },
        { status: 400 }
      )
    }

    // Determine sort order for hierarchical positioning (with retry)
    let sort_order = 0
    if (validatedData.parent_module_id) {
      const lastSibling = await withDatabaseRetry(async () => {
        return prisma.modules.findFirst({
          where: {
            parent_module_id: validatedData.parent_module_id,
            author_id: session.user.id,
          },
          orderBy: { sort_order: 'desc' },
        })
      })
      sort_order = (lastSibling?.sort_order || 0) + 1
    } else {
      const lastRootModule = await withDatabaseRetry(async () => {
        return prisma.modules.findFirst({
          where: {
            parent_module_id: null,
            author_id: session.user.id,
          },
          orderBy: { sort_order: 'desc' },
        })
      })
      sort_order = (lastRootModule?.sort_order || 0) + 1
    }

    // Clean and validate tags
    const cleanTags = validatedData.tags
      .map(tag => tag.trim().toLowerCase())
      .filter((tag, index, arr) => tag.length > 0 && arr.indexOf(tag) === index) // Remove duplicates and empty tags

    const newModule = await withDatabaseRetry(async () => {
      return prisma.modules.create({
        data: {
          id: `module_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          title: validatedData.title,
          slug: validatedData.slug,
          content: validatedData.content,
          description: validatedData.description,
          parent_module_id: validatedData.parent_module_id,
          status: validatedData.status,
          visibility: validatedData.visibility,
          tags: cleanTags,
          author_id: session.user.id,
          sort_order,
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
          _count: {
            select: {
              other_modules: true,
              course_modules: true,
            },
          },
        },
      })
    })

    return NextResponse.json({ module: newModule })
  } catch (error) {
    console.error('Error creating module:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const parent_module_id = searchParams.get('parent_module_id')
    const status = searchParams.get('status')
    const tags = searchParams.get('tags')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'sort_order'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const authorOnly = searchParams.get('authorOnly')
    const collaboratorOnly = searchParams.get('collaboratorOnly')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Validate pagination parameters
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 100) // Max 100 items per page
    const skip = (validPage - 1) * validLimit

    // If authorOnly is specified, require authentication
    if (authorOnly === 'true') {
      if (!hasFacultyAccess(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const whereClause: any = {
        author_id: session.user.id,
        ...(status && { status }),
      }

      // Apply parent filtering
      if (parentId === 'root') {
        whereClause.parent_module_id = null
      } else if (parentId === 'sub') {
        whereClause.parent_module_id = { not: null }
      } else if (parentId && parentId !== 'all') {
        whereClause.parent_module_id = parentId
      }

      // Apply tag filtering
      if (tags) {
        const tagList = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
        if (tagList.length > 0) {
          whereClause.tags = { hasSome: tagList }
        }
      }

      // Apply search filtering
      if (search && search.trim().length > 0) {
        const searchTerm = search.trim()
        whereClause.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { slug: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { hasSome: [searchTerm.toLowerCase()] } }
        ]
      }

      // Build order by clause
      let orderByClause: any
      switch (sortBy) {
        case 'title':
          orderByClause = { title: sortOrder }
          break
        case 'created_at':
          orderByClause = { created_at: sortOrder }
          break
        case 'updated_at':
          orderByClause = { updated_at: sortOrder }
          break
        case 'status':
          orderByClause = { status: sortOrder }
          break
        default:
          orderByClause = { sort_order: sortOrder }
      }

      const [modules, totalCount] = await withDatabaseRetry(async () => {
        return await Promise.all([
          prisma.modules.findMany({
            where: whereClause,
            include: {
              users: { select: { name: true, email: true } },
              modules: { select: { id: true, title: true } },
              _count: { select: { other_modules: true, course_modules: true } }
            },
            orderBy: orderByClause,
            skip,
            take: validLimit,
          }),
          prisma.modules.count({ where: whereClause })
        ])
      })

      const transformedModules = modules.map(module => ({
        ...module,
        author: module.users,
        parentModule: module.modules,
        subModulesCount: module._count.other_modules,
        courseModulesCount: module._count.course_modules,
        createdAt: module.created_at,
        updatedAt: module.updated_at,
      }))

      const availableTags = await withDatabaseRetry(async () => {
        const modulesWithTags = await prisma.modules.findMany({
          where: { author_id: session.user.id },
          select: { tags: true }
        })
        const tagsSet = new Set<string>()
        modulesWithTags.forEach(module => {
          if (Array.isArray(module.tags)) {
            module.tags.forEach(tag => tagsSet.add(tag))
          }
        })
        return Array.from(tagsSet).sort()
      })

      return NextResponse.json({
        modules: transformedModules,
        availableTags,
        pagination: {
          page: validPage,
          limit: validLimit,
          totalCount,
          totalPages: Math.ceil(totalCount / validLimit)
        }
      })
    }

    // If collaboratorOnly is specified, return modules where user is a collaborator
    // This includes both direct collaboration and inherited through parent modules
    if (collaboratorOnly === 'true') {
      if (!hasFacultyAccess(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get modules where user is a direct collaborator
      const whereClause: any = {
        collaborators: {
          some: { user_id: session.user.id }
        },
        ...(status && { status }),
      }

      // Apply parent filtering
      if (parentId === 'root') {
        whereClause.parent_module_id = null
      } else if (parentId === 'sub') {
        whereClause.parent_module_id = { not: null }
      } else if (parentId && parentId !== 'all') {
        whereClause.parent_module_id = parentId
      }

      // Apply tag filtering
      if (tags) {
        const tagList = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
        if (tagList.length > 0) {
          whereClause.tags = { hasSome: tagList }
        }
      }

      // Apply search filtering
      if (search && search.trim().length > 0) {
        const searchTerm = search.trim()
        whereClause.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { slug: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { hasSome: [searchTerm.toLowerCase()] } }
        ]
      }

      // Build order by clause
      let orderByClause: any
      switch (sortBy) {
        case 'title':
          orderByClause = { title: sortOrder }
          break
        case 'created_at':
          orderByClause = { created_at: sortOrder }
          break
        case 'updated_at':
          orderByClause = { updated_at: sortOrder }
          break
        case 'status':
          orderByClause = { status: sortOrder }
          break
        default:
          orderByClause = { sort_order: sortOrder }
      }

      const [directCollaborationModules, totalCount] = await withDatabaseRetry(async () => {
        return await Promise.all([
          prisma.modules.findMany({
            where: whereClause,
            include: {
              users: { select: { name: true, email: true } },
              modules: { select: { id: true, title: true } },
              _count: { select: { other_modules: true, course_modules: true } }
            },
            orderBy: orderByClause,
            skip,
            take: validLimit,
          }),
          prisma.modules.count({ where: whereClause })
        ])
      })

      const transformedModules = directCollaborationModules.map(module => ({
        ...module,
        author: module.users,
        parentModule: module.modules,
        subModulesCount: module._count.other_modules,
        courseModulesCount: module._count.course_modules,
        createdAt: module.created_at,
        updatedAt: module.updated_at,
      }))

      const availableTags = await withDatabaseRetry(async () => {
        const modulesWithTags = await prisma.modules.findMany({
          where: {
            collaborators: { some: { user_id: session.user.id } }
          },
          select: { tags: true }
        })
        const tagsSet = new Set<string>()
        modulesWithTags.forEach(module => {
          if (Array.isArray(module.tags)) {
            module.tags.forEach(tag => tagsSet.add(tag))
          }
        })
        return Array.from(tagsSet).sort()
      })

      return NextResponse.json({
        modules: transformedModules,
        availableTags,
        pagination: {
          page: validPage,
          limit: validLimit,
          totalCount,
          totalPages: Math.ceil(totalCount / validLimit)
        }
      })
    }

    // Handle different access patterns
    let whereClause: any = {}

    // Public access: only allow published modules
    if (!session?.user) {
      if (status !== 'published') {
        return NextResponse.json({ error: 'Unauthorized - only published modules are publicly accessible' }, { status: 401 })
      }
      whereClause.status = 'published'
      whereClause.visibility = 'public'
    }
    // Faculty/Admin access: can see their own modules + published public modules from others
    else if (session.user.role === 'faculty' || session.user.role === 'admin') {
      // Build own modules filter (respects status if provided)
      const ownModulesFilter: any = { author_id: session.user.id }
      if (status) {
        ownModulesFilter.status = status
      }

      whereClause.OR = [
        // Show own modules (filtered by status if provided)
        ownModulesFilter,
        // Show published PUBLIC modules from other users
        {
          status: 'published',
          visibility: 'public'
        }
      ]
    }
    // Other authenticated users: only published modules
    else {
      whereClause.status = 'published'
      whereClause.visibility = 'public'
    }

    // Parent filtering logic - FIXED
    if (parentId === 'root') {
      // Only show root modules (no parent)
      whereClause.parent_module_id = null
    } else if (parentId === 'sub') {
      // Only show sub-modules (has parent)
      whereClause.parent_module_id = { not: null }
    } else if (parentId && parentId !== 'all') {
      // Show modules with specific parent ID
      whereClause.parent_module_id = parentId
    }
    // ✅ IMPORTANT: When parentId is undefined or 'all', we DON'T add any parent filtering
    // This allows the query to return ALL modules (both root and sub-modules)

    // Add tag filtering
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
      if (tagList.length > 0) {
        whereClause.tags = {
          hasSome: tagList
        }
      }
    }

    // Add text search
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim()
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { hasSome: [searchTerm.toLowerCase()] } }
      ]
    }

    // Build order by clause
    let orderByClause: any
    switch (sortBy) {
      case 'title':
        orderByClause = { title: sortOrder }
        break
      case 'created_at':
        orderByClause = { created_at: sortOrder }
        break
      case 'updated_at':
        orderByClause = { updated_at: sortOrder }
        break
      case 'status':
        orderByClause = { status: sortOrder }
        break
      default:
        orderByClause = { sort_order: sortOrder }
    }

    const [modules, totalCount] = await withDatabaseRetry(async () => {
      try {
        // Try the full query first
        return await Promise.all([
          prisma.modules.findMany({
            where: whereClause,
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
            orderBy: orderByClause,
            skip,
            take: validLimit,
          }),
          prisma.modules.count({ where: whereClause }),
        ])
      } catch (complexQueryError) {
        console.warn('Complex query failed, trying simplified query:', complexQueryError)

        // Fallback to simpler query without complex includes
        return await Promise.all([
          prisma.modules.findMany({
            where: whereClause,
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
            orderBy: orderByClause,
            skip,
            take: validLimit,
          }),
          prisma.modules.count({ where: whereClause }),
        ])
      }
    })

    // Get all unique tags (for filtering UI)
    let allUserTags: string[] = []
    try {
      allUserTags = await withDatabaseRetry(async () => {
        let tagQuery = {}
        
        // For faculty/admin, get their own module tags; for public, get all published module tags
        if (session?.user?.role === 'faculty' || session?.user?.role === 'admin') {
          tagQuery = { author_id: session.user.id }
        } else {
          tagQuery = { status: 'published' }
        }
        
        const userModules = await prisma.modules.findMany({
          where: tagQuery,
          select: { tags: true }
        })
        
        const tagSet = new Set<string>()
        userModules.forEach(module => {
          if (module.tags && Array.isArray(module.tags)) {
            module.tags.forEach(tag => tagSet.add(tag))
          }
        })
        
        return Array.from(tagSet).sort()
      })
    } catch (tagsError) {
      console.warn('Failed to fetch user tags, continuing without tags:', tagsError)
      allUserTags = []
    }


    // Transform the data to match frontend interface expectations
    const transformedModules = modules.map(module => ({
      id: module.id,
      title: module.title,
      slug: module.slug,
      description: module.description,
      content: module.content,
      status: module.status,
      tags: module.tags,
      createdAt: module.created_at,
      updatedAt: module.updated_at,
      parentModuleId: module.parent_module_id,
      // Transform 'modules' to 'parentModule' (parent relationship)
      parentModule: module.modules ? {
        id: module.modules.id,
        title: module.modules.title,
      } : null,
      // Transform 'other_modules' to 'subModules' (children relationship)
      subModules: module.other_modules || [],
      // Transform users (author info)
      users: module.users,
      // Transform counts
      _count: {
        subModules: module._count?.other_modules || 0,
        courseModules: module._count?.course_modules || 0,
      },
    }))

    return NextResponse.json({
      modules: transformedModules,
      availableTags: allUserTags,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / validLimit),
      }
    })
  } catch (error) {
    console.error('Error fetching modules:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      cause: error instanceof Error ? error.cause : 'No cause',
      name: error instanceof Error ? error.name : 'Unknown error type'
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch modules',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    )
  }
}
