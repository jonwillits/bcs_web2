/**
 * Authentication utility functions
 * Helper functions for role checking, permissions, and auth-related operations
 */

import { Session } from 'next-auth'

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  PENDING_FACULTY: 'pending_faculty',
  ADMIN: 'admin',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

// Account statuses
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING_APPROVAL: 'pending_approval',
  DELETED: 'deleted',
} as const

export type AccountStatus =
  (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS]

/**
 * Check if user is an admin
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === USER_ROLES.ADMIN
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(session: Session | null): boolean {
  return (
    session?.user?.role === USER_ROLES.ADMIN &&
    (session?.user as any)?.is_super_admin === true
  )
}

/**
 * Check if user is faculty (approved)
 */
export function isFaculty(session: Session | null): boolean {
  return session?.user?.role === USER_ROLES.FACULTY
}

/**
 * Check if user is pending faculty approval
 */
export function isPendingFaculty(session: Session | null): boolean {
  return session?.user?.role === USER_ROLES.PENDING_FACULTY
}

/**
 * Check if user is a student
 */
export function isStudent(session: Session | null): boolean {
  return session?.user?.role === USER_ROLES.STUDENT
}

/**
 * Check if user can create content (faculty or admin)
 */
export function canCreateContent(session: Session | null): boolean {
  return isFaculty(session) || isAdmin(session)
}

/**
 * Check if user has faculty access (faculty or admin as superuser)
 * Use this for UI/UX checks where admin should see faculty features
 */
export function hasFacultyAccess(session: Session | null): boolean {
  return isFaculty(session) || isAdmin(session)
}

/**
 * Check if a role string has faculty access (for API routes)
 */
export function roleHasFacultyAccess(role?: string): boolean {
  return role === USER_ROLES.FACULTY || role === USER_ROLES.ADMIN
}

/**
 * Check if user can enroll in courses (student, faculty, or admin)
 */
export function canEnroll(session: Session | null): boolean {
  return isStudent(session) || isFaculty(session) || isAdmin(session)
}

/**
 * Check if user can moderate content (admin only)
 */
export function canModerateContent(session: Session | null): boolean {
  return isAdmin(session)
}

/**
 * Check if user can approve faculty requests (admin only)
 */
export function canApproveFaculty(session: Session | null): boolean {
  return isAdmin(session)
}

/**
 * Check if user can manage other users (admin only)
 */
export function canManageUsers(session: Session | null): boolean {
  return isAdmin(session)
}

/**
 * Check if user can view admin dashboard
 */
export function canViewAdminDashboard(session: Session | null): boolean {
  return isAdmin(session)
}

/**
 * Check if user can delete other admins (super admin only)
 */
export function canDeleteAdmins(session: Session | null): boolean {
  return isSuperAdmin(session)
}

/**
 * Check if user account is active
 */
export function isAccountActive(session: Session | null): boolean {
  const status = (session?.user as any)?.account_status
  return status === ACCOUNT_STATUS.ACTIVE
}

/**
 * Check if user account is suspended
 */
export function isAccountSuspended(session: Session | null): boolean {
  const status = (session?.user as any)?.account_status
  return status === ACCOUNT_STATUS.SUSPENDED
}

/**
 * Check if user account is pending approval
 */
export function isAccountPendingApproval(session: Session | null): boolean {
  const status = (session?.user as any)?.account_status
  return status === ACCOUNT_STATUS.PENDING_APPROVAL
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case USER_ROLES.STUDENT:
      return 'Student'
    case USER_ROLES.FACULTY:
      return 'Faculty'
    case USER_ROLES.PENDING_FACULTY:
      return 'Pending Faculty'
    case USER_ROLES.ADMIN:
      return 'Administrator'
    default:
      return role
  }
}

/**
 * Get account status display name
 */
export function getAccountStatusDisplayName(status: string): string {
  switch (status) {
    case ACCOUNT_STATUS.ACTIVE:
      return 'Active'
    case ACCOUNT_STATUS.SUSPENDED:
      return 'Suspended'
    case ACCOUNT_STATUS.PENDING_APPROVAL:
      return 'Pending Approval'
    case ACCOUNT_STATUS.DELETED:
      return 'Deleted'
    default:
      return status
  }
}

/**
 * Check if email is a university email (.edu domain)
 */
export function isUniversityEmail(email: string): boolean {
  return email.toLowerCase().endsWith('.edu')
}

/**
 * Check if email is in admin emails list
 * Reads from environment variable ADMIN_EMAILS
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  return adminEmails.includes(email.toLowerCase())
}

/**
 * Check if email is the super admin email
 * Reads from environment variable SUPER_ADMIN_EMAIL
 */
export function isSuperAdminEmail(email: string): boolean {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
  return !!superAdminEmail && email.toLowerCase() === superAdminEmail
}

/**
 * Determine user role based on email during registration
 */
export function determineRoleFromEmail(
  email: string,
  requestedRole: UserRole
): UserRole {
  // If email is admin email, override to admin
  if (isAdminEmail(email)) {
    return USER_ROLES.ADMIN
  }

  // Otherwise use requested role
  return requestedRole
}

/**
 * Determine account status based on role
 */
export function determineAccountStatus(role: UserRole): AccountStatus {
  switch (role) {
    case USER_ROLES.PENDING_FACULTY:
      return ACCOUNT_STATUS.PENDING_APPROVAL
    case USER_ROLES.STUDENT:
    case USER_ROLES.FACULTY:
    case USER_ROLES.ADMIN:
      return ACCOUNT_STATUS.ACTIVE
    default:
      return ACCOUNT_STATUS.ACTIVE
  }
}

/**
 * Get dashboard URL for user role
 */
export function getDashboardUrl(session: Session | null): string {
  if (!session) return '/'

  if (isAdmin(session)) return '/admin/dashboard'
  if (isFaculty(session)) return '/faculty/dashboard'
  if (isStudent(session)) return '/learning'
  if (isPendingFaculty(session)) return '/auth/pending-approval'

  return '/'
}

/**
 * Get profile URL for user
 */
export function getProfileUrl(userId: string): string {
  return `/profile/${userId}`
}

/**
 * Get edit profile URL for current user (role-based)
 */
export function getEditProfileUrl(session: Session | null): string {
  if (isAdmin(session)) return '/admin/profile/edit'
  if (isFaculty(session)) return '/faculty/profile/edit'
  if (isStudent(session)) return '/student/profile/edit'

  return '/auth/login'
}
