"use client";

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NeuralButton } from '@/components/ui/neural-button'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit,
  Eye,
  Calendar,
  User,
  Hash,
  CheckCircle,
  FileText,
  Brain,
  Layers,
  BookOpen,
  AlertCircle,
  ExternalLink,
  Copy,
  X
} from 'lucide-react'

interface Module {
  id: string
  title: string
  slug: string
  description: string | null
  content: string
  status: 'draft' | 'published'
  visibility: 'public' | 'private'
  created_at: string
  updated_at: string
  cloned_from: string | null
  clone_count: number
  author: {
    name: string
    email: string
  }
  parentModule: {
    id: string
    title: string
    slug: string
  } | null
  subModules: {
    id: string
    title: string
    slug: string
  }[]
}

async function fetchModule(id: string): Promise<Module> {
  const response = await fetch(`/api/modules/${id}`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Module not found')
    }
    throw new Error('Failed to fetch module')
  }
  const data = await response.json()
  return data.module
}

interface ModuleViewerProps {
  moduleId: string
}

export function ModuleViewer({ moduleId }: ModuleViewerProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [cloneOptions, setCloneOptions] = useState({
    newTitle: '',
    cloneMedia: true,
    cloneCollaborators: false,
  })

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showCloneDialog) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showCloneDialog])

  const { data: module, isLoading, error } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => fetchModule(moduleId),
  })

  const cloneMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/modules/${moduleId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloneOptions),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to clone module')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success('Module cloned successfully!')
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      setShowCloneDialog(false)
      setCloneOptions({ newTitle: '', cloneMedia: true, cloneCollaborators: false })
      // Navigate to the cloned module
      router.push(`/faculty/modules/${data.module.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clone module')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-6 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gradient-to-r from-neural-light/30 to-neural-primary/30 rounded w-1/3"></div>
              <div className="h-4 bg-gradient-to-r from-neural-primary/30 to-neural-light/30 rounded w-1/2"></div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            <Card className="cognitive-card">
              <CardContent className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gradient-to-r from-neural-light/30 to-neural-primary/30 rounded w-3/4"></div>
                  <div className="h-4 bg-gradient-to-r from-neural-primary/30 to-neural-light/30 rounded w-1/2"></div>
                  <div className="h-32 bg-gradient-to-br from-neural-light/20 to-cognition-teal/20 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <Link href="/faculty/modules">
                <NeuralButton variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Modules
                </NeuralButton>
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <Card className="cognitive-card max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {error instanceof Error && error.message === 'Module not found' 
                  ? 'Module Not Found' 
                  : 'Unable to Load Module'
                }
              </h2>
              <p className="text-muted-foreground mb-6">
                {error instanceof Error && error.message === 'Module not found'
                  ? 'The module you are looking for does not exist or you do not have permission to view it.'
                  : 'Please try again later or contact support if the problem persists.'
                }
              </p>
              <Link href="/faculty/modules">
                <NeuralButton variant="neural">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Modules
                </NeuralButton>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!module) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link href="/faculty/modules">
                <NeuralButton variant="ghost" size="sm" className="flex-shrink-0">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Modules</span>
                </NeuralButton>
              </Link>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neural flex-shrink-0">
                  {module.parentModule ? (
                    <Layers className="h-6 w-6 text-primary-foreground" />
                  ) : (
                    <Brain className="h-6 w-6 text-primary-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-bold text-neural-primary truncate">{module.title}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {module.parentModule ? 'Sub-module' : 'Root module'} • /{module.slug}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link href={`/faculty/modules/edit/${module.id}`} className="flex-1 sm:flex-initial">
                <NeuralButton variant="neural" size="sm" className="w-full sm:w-auto">
                  <Edit className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Edit Module</span>
                  <span className="sm:hidden">Edit</span>
                </NeuralButton>
              </Link>
              <NeuralButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setCloneOptions({
                    newTitle: `${module.title} (Copy)`,
                    cloneMedia: true,
                    cloneCollaborators: false,
                  })
                  setShowCloneDialog(true)
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Clone
              </NeuralButton>
              {module.status === 'published' && (
                <Link href={`/modules/${module.slug}`}>
                  <NeuralButton variant="synaptic" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Public
                  </NeuralButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Module Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="cognitive-card">
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <FileText className="mr-2 h-4 w-4 text-neural-primary" />
                  Module Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant={module.status === 'published' ? 'default' : 'outline'}
                    className={module.status === 'published' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'text-orange-600 border-orange-200'
                    }
                  >
                    {module.status === 'published' ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <Edit className="mr-1 h-3 w-3" />
                    )}
                    {module.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Author:</span>
                  <span className="font-medium">{module.author?.name || 'Unknown'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Visibility:</span>
                  <Badge variant={module.visibility === 'public' ? 'default' : 'secondary'}>
                    {module.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(module.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium">
                    {new Date(module.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sub-modules:</span>
                  <span className="font-medium">{module.subModules?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Hierarchy */}
            {(module.parentModule || (module.subModules?.length || 0) > 0) && (
              <Card className="cognitive-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <Layers className="mr-2 h-4 w-4 text-synapse-primary" />
                    Module Hierarchy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {module.parentModule && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Parent Module:</p>
                      <Link href={`/faculty/modules/${module.parentModule.id}`}>
                        <div className="flex items-center p-2 rounded border hover:bg-muted/50 transition-colors">
                          <Brain className="h-4 w-4 text-neural-primary mr-2" />
                          <span className="text-sm font-medium">{module.parentModule.title}</span>
                        </div>
                      </Link>
                    </div>
                  )}

                  {(module.subModules?.length || 0) > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Sub-modules:</p>
                      <div className="space-y-1">
                        {(module.subModules || []).map((subModule) => (
                          <Link key={subModule.id} href={`/faculty/modules/${subModule.id}`}>
                            <div className="flex items-center p-2 rounded border hover:bg-muted/50 transition-colors">
                              <Layers className="h-4 w-4 text-synapse-primary mr-2" />
                              <span className="text-sm font-medium">{subModule.title}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Module Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="cognitive-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-neural-primary" />
                  Module Content
                </CardTitle>
                {module.description && (
                  <CardDescription>
                    {module.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div 
                  className="neural-content prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: module.content }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Clone Module Dialog */}
      {showCloneDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center px-2 sm:px-4 pt-8 sm:pt-12 pb-4 z-[100]">
          <Card className="w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Copy className="mr-2 h-5 w-5 text-neural-primary" />
                    Clone Module
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Create a copy of this module in your library
                  </CardDescription>
                </div>
                <NeuralButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCloneDialog(false)}
                >
                  <X className="h-4 w-4" />
                </NeuralButton>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Clone Info */}
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Original Module: {module.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Author: {module.author.name}
                </p>
                {module.cloned_from && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    This module is already a clone
                  </div>
                )}
              </div>

              {/* New Title */}
              <div className="space-y-2">
                <Label htmlFor="new-title">New Module Title</Label>
                <Input
                  id="new-title"
                  value={cloneOptions.newTitle}
                  onChange={(e) =>
                    setCloneOptions({ ...cloneOptions, newTitle: e.target.value })
                  }
                  placeholder="Enter a title for the cloned module"
                />
                <p className="text-xs text-muted-foreground">
                  A unique slug will be generated automatically (e.g., &quot;{module.slug}-copy&quot;)
                </p>
              </div>

              {/* Clone Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Clone Options</Label>

                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/40 bg-muted/30">
                  <Checkbox
                    id="clone-media"
                    checked={cloneOptions.cloneMedia}
                    onCheckedChange={(checked) =>
                      setCloneOptions({ ...cloneOptions, cloneMedia: checked === true })
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="clone-media"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Clone media associations
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Include all images and files linked to this module
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/40 bg-muted/30">
                  <Checkbox
                    id="clone-collaborators"
                    checked={cloneOptions.cloneCollaborators}
                    onCheckedChange={(checked) =>
                      setCloneOptions({
                        ...cloneOptions,
                        cloneCollaborators: checked === true,
                      })
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="clone-collaborators"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Clone collaborators
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add the same collaborators to the cloned module
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  The cloned module will start as a <strong>private draft</strong>. You can
                  edit and publish it independently from the original.
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <NeuralButton
                  variant="outline"
                  onClick={() => setShowCloneDialog(false)}
                  className="flex-1"
                  disabled={cloneMutation.isPending}
                >
                  Cancel
                </NeuralButton>
                <NeuralButton
                  variant="synaptic"
                  onClick={() => cloneMutation.mutate()}
                  className="flex-1"
                  disabled={cloneMutation.isPending || !cloneOptions.newTitle.trim()}
                >
                  {cloneMutation.isPending ? (
                    <>Cloning...</>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Clone Module
                    </>
                  )}
                </NeuralButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
