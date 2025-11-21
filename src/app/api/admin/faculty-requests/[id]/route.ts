import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import { isAdmin, USER_ROLES, ACCOUNT_STATUS } from '@/lib/auth/utils'
import { createAuditLog, ADMIN_ACTIONS, getClientIp, getUserAgent } from '@/lib/admin/audit'
import { z } from 'zod'

const updateRequestSchema = z.object({
  action: z.enum(['approve', 'decline']),
  admin_note: z.string().optional(),
  decline_reason: z.string().optional(),
})

/**
 * PUT /api/admin/faculty-requests/[id]
 * Approve or decline a faculty request
 * Admin only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validatedData = updateRequestSchema.parse(body)
    const { action, admin_note, decline_reason } = validatedData

    // Fetch the request
    const facultyRequest = await prisma.faculty_requests.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!facultyRequest) {
      return NextResponse.json(
        { error: 'Faculty request not found' },
        { status: 404 }
      )
    }

    // Check if already processed
    if (facultyRequest.approval_status !== 'pending') {
      return NextResponse.json(
        {
          error: `Request already ${facultyRequest.approval_status}`,
        },
        { status: 400 }
      )
    }

    // Validate decline reason if declining
    if (action === 'decline' && !decline_reason?.trim()) {
      return NextResponse.json(
        { error: 'Decline reason is required when declining a request' },
        { status: 400 }
      )
    }

    const now = new Date()
    const adminId = session.user.id!

    // Process the request in a transaction
    const result = await prisma.$transaction(async (tx) => {
      if (action === 'approve') {
        // Update user role to faculty
        await tx.users.update({
          where: { id: facultyRequest.user_id },
          data: {
            role: USER_ROLES.FACULTY,
            account_status: ACCOUNT_STATUS.ACTIVE,
          },
        })

        // Update faculty request
        const updatedRequest = await tx.faculty_requests.update({
          where: { id },
          data: {
            approval_status: 'approved',
            reviewed_by: adminId,
            reviewed_at: now,
            admin_note: admin_note || null,
          },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        })

        // Create audit log
        await createAuditLog({
          adminId,
          action: ADMIN_ACTIONS.APPROVED_FACULTY,
          targetType: 'user',
          targetId: facultyRequest.user_id,
          reason: admin_note,
          details: {
            requestId: id,
            facultyEmail: facultyRequest.requester.email,
            facultyName: facultyRequest.requester.name,
          },
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
        })

        return { updatedRequest, action: 'approved' }
      } else {
        // Decline - update request only, keep user as pending_faculty
        const updatedRequest = await tx.faculty_requests.update({
          where: { id },
          data: {
            approval_status: 'declined',
            reviewed_by: adminId,
            reviewed_at: now,
            admin_note: admin_note || null,
            decline_reason: decline_reason || null,
          },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        })

        // Create audit log
        await createAuditLog({
          adminId,
          action: ADMIN_ACTIONS.DECLINED_FACULTY,
          targetType: 'user',
          targetId: facultyRequest.user_id,
          reason: decline_reason,
          details: {
            requestId: id,
            facultyEmail: facultyRequest.requester.email,
            facultyName: facultyRequest.requester.name,
            adminNote: admin_note,
          },
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
        })

        return { updatedRequest, action: 'declined' }
      }
    })

    // TODO: Send email notification to user (approved or declined)
    // For now, just log it
    console.log(
      `Faculty request ${action}d for ${facultyRequest.requester.email}`
    )

    return NextResponse.json({
      success: true,
      message: `Faculty request ${action}d successfully`,
      request: result.updatedRequest,
    })
  } catch (error) {
    console.error('Error processing faculty request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process faculty request',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/faculty-requests/[id]
 * Get details of a specific faculty request
 * Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const facultyRequest = await prisma.faculty_requests.findUnique({
      where: { id },
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
    })

    if (!facultyRequest) {
      return NextResponse.json(
        { error: 'Faculty request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      request: facultyRequest,
    })
  } catch (error) {
    console.error('Error fetching faculty request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch faculty request',
      },
      { status: 500 }
    )
  }
}
