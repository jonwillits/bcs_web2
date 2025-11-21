/**
 * Admin audit logging utilities
 * Creates audit trail for all admin actions
 */

import { prisma } from '../db'

export interface CreateAuditLogParams {
  adminId: string
  action: string
  targetType?: string
  targetId?: string
  reason?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry for admin action
 */
export async function createAuditLog({
  adminId,
  action,
  targetType,
  targetId,
  reason,
  details,
  ipAddress,
  userAgent,
}: CreateAuditLogParams) {
  try {
    const auditLog = await prisma.admin_audit_logs.create({
      data: {
        admin_id: adminId,
        action,
        target_type: targetType || null,
        target_id: targetId || null,
        reason: reason || null,
        details: details || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      },
    })

    return auditLog
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break the main operation
    return null
  }
}

/**
 * Common admin actions (for consistency)
 */
export const ADMIN_ACTIONS = {
  // Faculty management
  APPROVED_FACULTY: 'approved_faculty',
  DECLINED_FACULTY: 'declined_faculty',

  // User management
  SUSPENDED_USER: 'suspended_user',
  ACTIVATED_USER: 'activated_user',
  DELETED_USER: 'deleted_user',
  CHANGED_USER_ROLE: 'changed_user_role',

  // Content moderation
  DELETED_COURSE: 'deleted_course',
  DELETED_MODULE: 'deleted_module',
  HIDDEN_COURSE: 'hidden_course',
  HIDDEN_MODULE: 'hidden_module',
  EDITED_COURSE: 'edited_course',
  EDITED_MODULE: 'edited_module',

  // Content flags
  RESOLVED_FLAG: 'resolved_flag',
  DISMISSED_FLAG: 'dismissed_flag',
} as const

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return realIp || undefined
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}
