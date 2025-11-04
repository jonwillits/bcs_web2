"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NeuralButton } from '@/components/ui/neural-button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  UserPlus,
  UserMinus,
  Edit,
  Trash,
  CheckCircle,
} from 'lucide-react'
import type { ActivityEntry, ActivityFeedResponse } from '@/types/collaboration'
import Image from 'next/image'

interface ActivityFeedProps {
  entityType: 'course' | 'module'
  entityId: string
  limit?: number
}

async function fetchActivity(
  entityType: 'course' | 'module',
  entityId: string,
  page: number = 1,
  limit: number = 20
): Promise<ActivityFeedResponse> {
  const response = await fetch(
    `/api/${entityType}s/${entityId}/activity?page=${page}&limit=${limit}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch activity feed')
  }

  return response.json()
}

function getActionIcon(action: string) {
  switch (action) {
    case 'created':
      return <FileText className="h-4 w-4 text-blue-500" />
    case 'updated':
      return <Edit className="h-4 w-4 text-orange-500" />
    case 'published':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'deleted':
      return <Trash className="h-4 w-4 text-red-500" />
    case 'invited_user':
      return <UserPlus className="h-4 w-4 text-synapse-primary" />
    case 'removed_user':
      return <UserMinus className="h-4 w-4 text-red-500" />
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />
  }
}

function getActionBadgeVariant(
  action: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (action) {
    case 'created':
      return 'default'
    case 'updated':
      return 'secondary'
    case 'published':
      return 'default'
    case 'deleted':
      return 'destructive'
    case 'invited_user':
    case 'removed_user':
      return 'outline'
    default:
      return 'secondary'
  }
}

function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  return date.toLocaleDateString()
}

export function ActivityFeed({
  entityType,
  entityId,
  limit = 20,
}: ActivityFeedProps) {
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['activity', entityType, entityId, page, limit],
    queryFn: () => fetchActivity(entityType, entityId, page, limit),
  })

  if (isLoading) {
    return (
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-neural-primary" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse flex items-start space-x-3"
              >
                <div className="h-10 w-10 bg-gradient-to-r from-neural-light/30 to-neural-primary/30 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gradient-to-r from-neural-primary/30 to-neural-light/30 rounded w-3/4" />
                  <div className="h-3 bg-gradient-to-r from-neural-light/30 to-neural-primary/30 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-neural-primary" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load activity feed. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const activities = data?.activities || []
  const pagination = data?.pagination || {
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  }

  return (
    <Card className="cognitive-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-neural-primary" />
              Activity Feed
            </CardTitle>
            <CardDescription>
              {pagination.totalCount === 0
                ? 'No activity yet'
                : `${pagination.totalCount} ${pagination.totalCount === 1 ? 'activity' : 'activities'}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">
              No activity yet. Changes and collaboration events will appear
              here.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border/40 hover:border-neural-primary/30 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-neural flex-shrink-0">
                    {activity.user.avatar_url ? (
                      <Image
                        src={activity.user.avatar_url}
                        alt={activity.user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                        {activity.user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        {getActionIcon(activity.action)}
                        <Badge
                          variant={getActionBadgeVariant(activity.action)}
                          className="text-xs"
                        >
                          {activity.action.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Show changes if available */}
                    {activity.changes && (
                      <div className="mt-2 p-2 bg-muted/30 rounded text-xs font-mono">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(activity.changes, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.totalCount} total)
                </p>
                <div className="flex items-center space-x-2">
                  <NeuralButton
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </NeuralButton>
                  <NeuralButton
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={!pagination.hasNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </NeuralButton>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
