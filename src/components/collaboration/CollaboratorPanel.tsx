"use client"

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NeuralButton } from '@/components/ui/neural-button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FacultySearchInput } from './FacultySearchInput'
import { toast } from 'sonner'
import { Users, UserPlus, X, AlertCircle, Clock, Edit, Layers } from 'lucide-react'
import type { Collaborator } from '@/types/collaboration'
import Image from 'next/image'

interface CollaboratorPanelProps {
  entityType: 'course' | 'module'
  entityId: string
  authorId: string
}

interface CollaboratorsResponse {
  collaborators: Collaborator[]
  count: number
}

async function fetchCollaborators(
  entityType: 'course' | 'module',
  entityId: string
): Promise<CollaboratorsResponse> {
  const response = await fetch(`/api/${entityType}s/${entityId}/collaborators`)
  if (!response.ok) {
    throw new Error('Failed to fetch collaborators')
  }
  return response.json()
}

async function addCollaborator(
  entityType: 'course' | 'module',
  entityId: string,
  userId: string,
  cascadeToModules?: boolean
) {
  const response = await fetch(`/api/${entityType}s/${entityId}/collaborators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, cascadeToModules }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add collaborator')
  }

  return response.json()
}

async function removeCollaborator(
  entityType: 'course' | 'module',
  entityId: string,
  userId: string
) {
  const response = await fetch(
    `/api/${entityType}s/${entityId}/collaborators/${userId}`,
    { method: 'DELETE' }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to remove collaborator')
  }

  return response.json()
}

export function CollaboratorPanel({
  entityType,
  entityId,
  authorId,
}: CollaboratorPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [cascadeToModules, setCascadeToModules] = useState(false)
  const queryClient = useQueryClient()

  // Disable body scroll when modal is open
  useEffect(() => {
    const isModalOpen = showAddDialog || confirmRemoveId !== null
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showAddDialog, confirmRemoveId])

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['collaborators', entityType, entityId],
    queryFn: () => fetchCollaborators(entityType, entityId),
  })

  const addMutation = useMutation({
    mutationFn: ({ userId, cascade }: { userId: string; cascade: boolean }) =>
      addCollaborator(entityType, entityId, userId, cascade),
    onSuccess: (data, variables) => {
      const message = variables.cascade && entityType === 'course'
        ? 'Collaborator added and permissions cascaded to public modules'
        : 'Collaborator added successfully'
      toast.success(message)
      queryClient.invalidateQueries({
        queryKey: ['collaborators', entityType, entityId],
      })
      setShowAddDialog(false)
      setCascadeToModules(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add collaborator')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      removeCollaborator(entityType, entityId, userId),
    onSuccess: () => {
      toast.success('Collaborator removed successfully')
      queryClient.invalidateQueries({
        queryKey: ['collaborators', entityType, entityId],
      })
      setConfirmRemoveId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove collaborator')
    },
  })

  const handleAddCollaborator = (userId: string) => {
    if (userId === authorId) {
      toast.error('Cannot add the author as a collaborator')
      return
    }
    addMutation.mutate({
      userId,
      cascade: entityType === 'course' ? cascadeToModules : false
    })
  }

  const handleRemoveCollaborator = (userId: string) => {
    removeMutation.mutate(userId)
  }

  if (isLoading) {
    return (
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-neural-primary" />
            Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gradient-to-r from-neural-light/30 to-neural-primary/30 rounded" />
            <div className="h-12 bg-gradient-to-r from-neural-primary/30 to-neural-light/30 rounded" />
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
            <Users className="mr-2 h-5 w-5 text-neural-primary" />
            Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load collaborators. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const collaborators = data?.collaborators || []
  const count = data?.count || 0

  return (
    <Card className="cognitive-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-neural-primary" />
              Collaborators
            </CardTitle>
            <CardDescription>
              {count === 0
                ? 'No collaborators yet'
                : `${count} ${count === 1 ? 'collaborator' : 'collaborators'}`}
            </CardDescription>
          </div>
          <NeuralButton
            variant="neural"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add
          </NeuralButton>
        </div>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-neural/10 mb-4">
              <Users className="h-8 w-8 text-neural-primary opacity-50" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No collaborators yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add faculty members to collaborate on this {entityType}.
            </p>
            <NeuralButton
              variant="neural"
              size="sm"
              onClick={() => setShowAddDialog(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add First Collaborator
            </NeuralButton>
          </div>
        ) : (
          <div className="space-y-3">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:border-neural-primary/30 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-neural flex-shrink-0">
                    {collaborator.user.avatar_url ? (
                      <Image
                        src={collaborator.user.avatar_url}
                        alt={collaborator.user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary-foreground font-semibold">
                        {collaborator.user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {collaborator.user.name}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Edit className="mr-1 h-3 w-3" />
                        {collaborator.editCount} edits
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(collaborator.lastAccessed).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <NeuralButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRemoveId(collaborator.userId)}
                  disabled={removeMutation.isPending}
                >
                  <X className="h-4 w-4 text-red-500" />
                </NeuralButton>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Collaborator Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center px-2 sm:px-4 pt-8 sm:pt-12 pb-4 z-[100]">
          <Card className="w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5 text-neural-primary" />
                Add Collaborator
              </CardTitle>
              <CardDescription>
                Search for faculty members to add as collaborators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FacultySearchInput
                onSelect={handleAddCollaborator}
                excludeUserIds={[
                  authorId,
                  ...collaborators.map((c) => c.userId),
                ]}
              />

              {/* Cascade permissions checkbox - only for courses */}
              {entityType === 'course' && (
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/40 bg-muted/30">
                  <Checkbox
                    id="cascade-permissions"
                    checked={cascadeToModules}
                    onCheckedChange={(checked) => setCascadeToModules(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="cascade-permissions"
                      className="text-sm font-medium cursor-pointer"
                    >
                      <Layers className="inline-block mr-1.5 h-4 w-4 text-neural-primary" />
                      Also add to public modules
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Automatically grant edit permissions on all public modules in this course. Private modules will not be affected.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <NeuralButton
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false)
                    setCascadeToModules(false)
                  }}
                  disabled={addMutation.isPending}
                >
                  Cancel
                </NeuralButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      {confirmRemoveId && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center px-2 sm:px-4 pt-8 sm:pt-12 pb-4 z-[100]">
          <Card className="w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertCircle className="mr-2 h-5 w-5" />
                Remove Collaborator
              </CardTitle>
              <CardDescription>
                Are you sure you want to remove this collaborator? They will
                immediately lose access to this {entityType}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <NeuralButton
                  variant="outline"
                  onClick={() => setConfirmRemoveId(null)}
                  disabled={removeMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </NeuralButton>
                <NeuralButton
                  variant="destructive"
                  onClick={() => handleRemoveCollaborator(confirmRemoveId)}
                  disabled={removeMutation.isPending}
                  className="flex-1"
                >
                  {removeMutation.isPending ? 'Removing...' : 'Remove'}
                </NeuralButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}
