/**
 * Activity Logging Helper Functions
 * Provides utilities for tracking and logging user activity on courses and modules
 *
 * All activity logs are stored in the collaboration_activity table
 */

import { prisma } from '@/lib/db'
import type {
  EntityType,
  ActivityAction,
  ActivityLogParams,
  ActivityEntry,
  ActivityFeedResponse,
  ActivityQuery
} from '@/types/collaboration'

// ==================== ACTIVITY LOGGING ====================

/**
 * Log an activity entry for a course or module
 *
 * @param params - Activity log parameters
 * @returns Promise<void>
 *
 * @example
 * await logActivity({
 *   entityType: 'course',
 *   entityId: courseId,
 *   userId: session.user.id,
 *   action: 'updated',
 *   description: `Updated course title from "${oldTitle}" to "${newTitle}"`,
 *   changes: { field: 'title', from: oldTitle, to: newTitle }
 * })
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  const { entityType, entityId, userId, action, description, changes } = params

  await prisma.collaboration_activity.create({
    data: {
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      action,
      description,
      changes: changes ? JSON.stringify(changes) : null
    }
  })
}

// ==================== ACTIVITY DESCRIPTION GENERATORS ====================

/**
 * Generate a human-readable description for an activity
 * Useful for creating consistent activity messages
 *
 * @param action - The type of action performed
 * @param entityType - 'course' or 'module'
 * @param userName - Name of the user who performed the action
 * @param changes - Optional change details
 * @returns string - Human-readable description
 */
export function generateActivityDescription(
  action: ActivityAction,
  entityType: EntityType,
  userName: string,
  changes?: Record<string, any>
): string {
  switch (action) {
    case 'created':
      return `${userName} created this ${entityType}`

    case 'updated':
      if (changes?.field) {
        const field = changes.field
        const from = changes.from
        const to = changes.to

        // Special handling for specific fields
        if (field === 'title') {
          return `${userName} updated ${entityType} title from "${from}" to "${to}"`
        }
        if (field === 'status') {
          if (to === 'published') {
            return `${userName} published the ${entityType}`
          }
          if (to === 'draft') {
            return `${userName} unpublished the ${entityType}`
          }
        }
        if (field === 'description') {
          return `${userName} updated the ${entityType} description`
        }
        if (field === 'content') {
          return `${userName} updated the ${entityType} content`
        }
        if (field === 'modules') {
          return `${userName} updated the course modules`
        }

        // Generic field update
        return `${userName} updated ${field}`
      }
      return `${userName} updated the ${entityType}`

    case 'published':
      return `${userName} published the ${entityType}`

    case 'deleted':
      return `${userName} deleted the ${entityType}`

    case 'invited_user':
      const invitedUserName = changes?.invitedUserName || 'a collaborator'
      return `${userName} invited ${invitedUserName} to collaborate`

    case 'removed_user':
      const removedUserName = changes?.removedUserName || 'a collaborator'
      return `${userName} removed ${removedUserName} as collaborator`

    default:
      return `${userName} ${action} the ${entityType}`
  }
}

// ==================== ACTIVITY FEED RETRIEVAL ====================

/**
 * Get activity feed for a course or module with pagination
 *
 * @param entityType - 'course' or 'module'
 * @param entityId - The ID of the course or module
 * @param query - Query parameters (page, limit, filters)
 * @returns Promise<ActivityFeedResponse> - Paginated activity feed
 *
 * @example
 * const feed = await getActivityFeed('course', courseId, { page: 1, limit: 20 })
 */
export async function getActivityFeed(
  entityType: EntityType,
  entityId: string,
  query: ActivityQuery = {}
): Promise<ActivityFeedResponse> {
  // Parse and validate query parameters
  const page = Math.max(1, query.page || 1)
  const limit = Math.min(100, Math.max(1, query.limit || 20))
  const skip = (page - 1) * limit

  // Build where clause with filters
  const where: any = {
    entity_type: entityType,
    entity_id: entityId
  }

  if (query.userId) {
    where.user_id = query.userId
  }

  if (query.action) {
    where.action = query.action
  }

  // Fetch activities and total count in parallel
  const [activities, totalCount] = await Promise.all([
    prisma.collaboration_activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.collaboration_activity.count({ where })
  ])

  // Transform to ActivityEntry format
  const transformedActivities: ActivityEntry[] = activities.map((activity) => ({
    id: activity.id,
    entityType: activity.entity_type as EntityType,
    entityId: activity.entity_id,
    userId: activity.user_id,
    action: activity.action as ActivityAction,
    description: activity.description,
    changes: activity.changes ? (JSON.parse(activity.changes as string) as Record<string, any>) : undefined,
    createdAt: activity.created_at,
    user: {
      id: activity.user.id,
      name: activity.user.name,
      avatar_url: activity.user.avatar_url
    }
  }))

  // Build pagination metadata
  const totalPages = Math.ceil(totalCount / limit)

  return {
    activities: transformedActivities,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: skip + limit < totalCount,
      hasPrev: page > 1
    }
  }
}

// ==================== ATOMIC UPDATE + LOG PATTERN ====================

/**
 * Update a course with automatic activity logging (atomic transaction)
 * Ensures that the update and log always succeed or fail together
 *
 * @param courseId - The ID of the course to update
 * @param userId - The ID of the user performing the update
 * @param updates - The fields to update
 * @param activityDescription - Human-readable description of the change
 * @returns Promise<Course> - The updated course
 */
export async function updateCourseWithActivity<T>(
  courseId: string,
  userId: string,
  userName: string,
  updates: Record<string, any>,
  activityDescription?: string
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // 1. Update the course
    const course = await tx.courses.update({
      where: { id: courseId },
      data: updates
    })

    // 2. Generate description if not provided
    const description =
      activityDescription ||
      generateActivityDescription('updated', 'course', userName, {
        field: Object.keys(updates)[0],
        from: null,
        to: Object.values(updates)[0]
      })

    // 3. Log the activity (atomic with update)
    await tx.collaboration_activity.create({
      data: {
        entity_type: 'course',
        entity_id: courseId,
        user_id: userId,
        action: 'updated',
        description,
        changes: JSON.stringify(updates)
      }
    })

    return course as T
  })
}

/**
 * Update a module with automatic activity logging (atomic transaction)
 *
 * @param moduleId - The ID of the module to update
 * @param userId - The ID of the user performing the update
 * @param updates - The fields to update
 * @param activityDescription - Human-readable description of the change
 * @returns Promise<Module> - The updated module
 */
export async function updateModuleWithActivity<T>(
  moduleId: string,
  userId: string,
  userName: string,
  updates: Record<string, any>,
  activityDescription?: string
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // 1. Update the module
    const moduleData = await tx.modules.update({
      where: { id: moduleId },
      data: updates
    })

    // 2. Generate description if not provided
    const description =
      activityDescription ||
      generateActivityDescription('updated', 'module', userName, {
        field: Object.keys(updates)[0],
        from: null,
        to: Object.values(updates)[0]
      })

    // 3. Log the activity
    await tx.collaboration_activity.create({
      data: {
        entity_type: 'module',
        entity_id: moduleId,
        user_id: userId,
        action: 'updated',
        description,
        changes: JSON.stringify(updates)
      }
    })

    return moduleData as T
  })
}

// ==================== COLLABORATOR ACTIVITY HELPERS ====================

/**
 * Log when a user is added as a collaborator
 */
export async function logCollaboratorAdded(
  entityType: EntityType,
  entityId: string,
  inviterId: string,
  inviterName: string,
  collaboratorId: string,
  collaboratorName: string
): Promise<void> {
  await logActivity({
    entityType,
    entityId,
    userId: inviterId,
    action: 'invited_user',
    description: `${inviterName} invited ${collaboratorName} to collaborate`,
    changes: {
      invitedUserId: collaboratorId,
      invitedUserName: collaboratorName
    }
  })
}

/**
 * Log when a collaborator is removed
 */
export async function logCollaboratorRemoved(
  entityType: EntityType,
  entityId: string,
  removerId: string,
  removerName: string,
  collaboratorId: string,
  collaboratorName: string
): Promise<void> {
  await logActivity({
    entityType,
    entityId,
    userId: removerId,
    action: 'removed_user',
    description: `${removerName} removed ${collaboratorName} as collaborator`,
    changes: {
      removedUserId: collaboratorId,
      removedUserName: collaboratorName
    }
  })
}
