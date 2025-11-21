import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import { isAdmin } from '@/lib/auth/utils'

/**
 * GET /api/admin/faculty-requests
 * List all faculty requests (pending, approved, declined)
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'pending' // pending | approved | declined | all
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status !== 'all') {
      where.approval_status = status
    }

    // Fetch faculty requests with user details
    const [requests, totalCount] = await Promise.all([
      prisma.faculty_requests.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
              department: true,
              title: true,
              research_area: true,
              personal_website_url: true,
              role: true,
              account_status: true,
              created_at: true,
              email_verified: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          requested_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.faculty_requests.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching faculty requests:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch faculty requests',
      },
      { status: 500 }
    )
  }
}
