/**
 * Permission Helper Functions
 * Centralized authorization logic for collaboration features
 *
 * Single Source of Truth for all permission checks
 */

import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import type { EntityType, PermissionCheck } from '@/types/collaboration'

// ==================== CORE PERMISSION CHECKS ====================

/**
 * Check if a user can edit a course (is author OR collaborator)
 *
 * @param userId - The ID of the user to check
 * @param courseId - The ID of the course
 * @returns Promise<boolean> - True if user can edit, false otherwise
 *
 * @example
 * const canEdit = await canEditCourse(session.user.id, courseId)
 * if (!canEdit) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
 * }
 */
export async function canEditCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const result = await prisma.courses.findFirst({
    where: {
      id: courseId,
      OR: [
        { author_id: userId }, // User is the original author
        {
          collaborators: {
            some: { user_id: userId } // User is a collaborator
          }
        }
      ]
    },
    select: { id: true } // Only select ID for existence check (performance)
  })

  return !!result
}

/**
 * Check if a user can edit a module (is author OR collaborator)
 * This includes inherited permissions from parent modules (cascading downward)
 *
 * @param userId - The ID of the user to check
 * @param moduleId - The ID of the module
 * @returns Promise<boolean> - True if user can edit, false otherwise
 *
 * @example
 * const canEdit = await canEditModule(session.user.id, moduleId)
 * if (!canEdit) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
 * }
 */
export async function canEditModule(
  userId: string,
  moduleId: string
): Promise<boolean> {
  // First check if user has direct access to this module
  const directAccess = await prisma.modules.findFirst({
    where: {
      id: moduleId,
      OR: [
        { author_id: userId }, // User is the original author
        {
          collaborators: {
            some: { user_id: userId } // User is a collaborator
          }
        }
      ]
    },
    select: { id: true }
  })

  if (directAccess) {
    return true
  }

  // Check if user has access through parent modules (inherited permission)
  // Walk up the module hierarchy to check all ancestors
  const moduleWithParent = await prisma.modules.findUnique({
    where: { id: moduleId },
    select: { parent_module_id: true }
  })

  if (!moduleWithParent?.parent_module_id) {
    return false // No parent, and no direct access
  }

  // Recursively check parent module
  // If user has access to parent, they inherit access to this child
  return canEditModule(userId, moduleWithParent.parent_module_id)
}

// ==================== PERMISSION CHECKS WITH RETRY ====================

/**
 * Same as canEditCourse but with automatic retry logic for serverless environments
 * Use this in API routes to handle connection pooling issues
 */
export async function canEditCourseWithRetry(
  userId: string,
  courseId: string
): Promise<boolean> {
  return withDatabaseRetry(() => canEditCourse(userId, courseId))
}

/**
 * Same as canEditModule but with automatic retry logic for serverless environments
 * Use this in API routes to handle connection pooling issues
 */
export async function canEditModuleWithRetry(
  userId: string,
  moduleId: string
): Promise<boolean> {
  return withDatabaseRetry(() => canEditModule(userId, moduleId))
}

// ==================== DETAILED PERMISSION INFO ====================

/**
 * Get detailed permission information for a user on a course
 * Returns whether user is author, collaborator, or neither
 *
 * @param userId - The ID of the user to check
 * @param courseId - The ID of the course
 * @returns Promise<PermissionCheck> - Object with detailed permission info
 */
export async function getCoursePermissions(
  userId: string,
  courseId: string
): Promise<PermissionCheck> {
  const course = await prisma.courses.findUnique({
    where: { id: courseId },
    select: {
      author_id: true,
      collaborators: {
        where: { user_id: userId },
        select: { id: true }
      }
    }
  })

  if (!course) {
    return {
      canEdit: false,
      isAuthor: false,
      isCollaborator: false
    }
  }

  const isAuthor = course.author_id === userId
  const isCollaborator = course.collaborators.length > 0

  return {
    canEdit: isAuthor || isCollaborator,
    isAuthor,
    isCollaborator
  }
}

/**
 * Get detailed permission information for a user on a module
 * Returns whether user is author, collaborator, or neither
 *
 * @param userId - The ID of the user to check
 * @param moduleId - The ID of the module
 * @returns Promise<PermissionCheck> - Object with detailed permission info
 */
export async function getModulePermissions(
  userId: string,
  moduleId: string
): Promise<PermissionCheck> {
  const moduleData = await prisma.modules.findUnique({
    where: { id: moduleId },
    select: {
      author_id: true,
      collaborators: {
        where: { user_id: userId },
        select: { id: true }
      }
    }
  })

  if (!moduleData) {
    return {
      canEdit: false,
      isAuthor: false,
      isCollaborator: false
    }
  }

  const isAuthor = moduleData.author_id === userId
  const isCollaborator = moduleData.collaborators.length > 0

  return {
    canEdit: isAuthor || isCollaborator,
    isAuthor,
    isCollaborator
  }
}

// ==================== GENERIC PERMISSION CHECK ====================

/**
 * Generic permission check that works for both courses and modules
 *
 * @param userId - The ID of the user to check
 * @param entityType - 'course' or 'module'
 * @param entityId - The ID of the course or module
 * @returns Promise<boolean> - True if user can edit, false otherwise
 */
export async function canEdit(
  userId: string,
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  if (entityType === 'course') {
    return canEditCourse(userId, entityId)
  } else {
    return canEditModule(userId, entityId)
  }
}

/**
 * Generic permission check with retry logic
 */
export async function canEditWithRetry(
  userId: string,
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  return withDatabaseRetry(() => canEdit(userId, entityType, entityId))
}

// ==================== OWNERSHIP CHECKS ====================

/**
 * Check if a user is the original author of a course
 * Used for operations that only the author should perform
 */
export async function isAuthorOfCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const course = await prisma.courses.findUnique({
    where: { id: courseId },
    select: { author_id: true }
  })

  return course?.author_id === userId
}

/**
 * Check if a user is the original author of a module
 * Used for operations that only the author should perform
 */
export async function isAuthorOfModule(
  userId: string,
  moduleId: string
): Promise<boolean> {
  const moduleData = await prisma.modules.findUnique({
    where: { id: moduleId },
    select: { author_id: true }
  })

  return moduleData?.author_id === userId
}
