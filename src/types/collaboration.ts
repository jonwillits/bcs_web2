/**
 * Collaboration Feature TypeScript Definitions
 * Provides type safety for all collaboration-related features
 */

// ==================== CORE TYPES ====================

export type EntityType = 'course' | 'module'

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'published'
  | 'deleted'
  | 'invited_user'
  | 'removed_user'

// ==================== COLLABORATOR TYPES ====================

export interface Collaborator {
  id: string
  userId: string
  addedBy: string | null
  addedAt: Date
  lastAccessed: Date
  editCount: number

  // Populated user information
  user: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }

  // Populated inviter information (if available)
  inviter?: {
    id: string
    name: string
    email: string
  } | null
}

export interface CourseCollaborator extends Collaborator {
  courseId: string
}

export interface ModuleCollaborator extends Collaborator {
  moduleId: string
}

// ==================== ACTIVITY TYPES ====================

export interface ActivityEntry {
  id: string
  entityType: EntityType
  entityId: string
  userId: string
  action: ActivityAction
  description: string
  changes?: Record<string, any>
  createdAt: Date

  // Populated user information
  user: {
    id: string
    name: string
    avatar_url: string | null
  }
}

export interface ActivityFeedResponse {
  activities: ActivityEntry[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface AddCollaboratorRequest {
  userId: string
}

export interface AddCollaboratorResponse {
  collaborator: Collaborator
}

export interface ListCollaboratorsResponse {
  collaborators: Collaborator[]
  count: number
}

export interface RemoveCollaboratorResponse {
  success: boolean
}

export interface ActivityQuery {
  page?: number
  limit?: number
  userId?: string
  action?: ActivityAction
}

// ==================== ACTIVITY LOG TYPES ====================

export interface ActivityLogParams {
  entityType: EntityType
  entityId: string
  userId: string
  action: ActivityAction
  description: string
  changes?: Record<string, any>
}

export interface ChangeLog {
  field: string
  from: any
  to: any
  timestamp?: string
}

// ==================== PERMISSION TYPES ====================

export interface PermissionCheck {
  canEdit: boolean
  isAuthor: boolean
  isCollaborator: boolean
}

// ==================== API ERROR TYPES ====================

export interface CollaborationError {
  error: string
  code?:
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'ALREADY_COLLABORATOR'
    | 'LAST_COLLABORATOR_PROTECTION'
    | 'VALIDATION_ERROR'
    | 'CONFLICT'
    | 'INTERNAL_ERROR'
  details?: any
  timestamp?: string
}

// ==================== HELPER TYPES ====================

export interface User {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}
