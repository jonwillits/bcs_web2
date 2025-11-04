"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { NeuralRichTextEditor } from '@/components/editor/neural-rich-text-editor'
import { NeuralButton } from '@/components/ui/neural-button'
import { TagsInput } from '@/components/ui/tags-input'
import { MediaLibraryPanel } from '@/components/ui/media-library-panel'
import { CollaboratorPanel } from '@/components/collaboration/CollaboratorPanel'
import { ActivityFeed } from '@/components/collaboration/ActivityFeed'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Brain, 
  Hash,
  CheckCircle,
  FileText,
  AlertCircle,
  Layers,
  Trash2
} from 'lucide-react'

const editModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  parentModuleId: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(z.string()).default([]),
})

type EditModuleFormData = z.infer<typeof editModuleSchema>

interface Module {
  id: string
  title: string
  slug: string
  description: string | null
  content: string
  status: 'draft' | 'published'
  tags: string[]
  parentModuleId: string | null
  createdAt: string
  updatedAt: string
  author_id: string
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

interface ParentModule {
  id: string
  title: string
  slug: string
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

async function fetchParentModules(): Promise<{ modules: ParentModule[], availableTags: string[] }> {
  const response = await fetch('/api/modules?parentModuleId=null')
  if (!response.ok) {
    throw new Error('Failed to fetch parent modules')
  }
  const data = await response.json()
  return { modules: data.modules, availableTags: data.availableTags || [] }
}

async function updateModule(id: string, data: EditModuleFormData) {
  // Transform parentModuleId to parent_module_id for API consistency
  const { parentModuleId, ...rest } = data;
  const apiData = {
    ...rest,
    parent_module_id: parentModuleId,
  }

  console.log('Updating module with data:', apiData);

  const response = await fetch(`/api/modules/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update module')
  }

  return response.json()
}

async function deleteModule(id: string) {
  const response = await fetch(`/api/modules/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete module')
  }

  return response.json()
}

interface EditModuleFormProps {
  moduleId: string
}

export function EditModuleForm({ moduleId }: EditModuleFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [insertImageFn, setInsertImageFn] = useState<((url: string, alt?: string, caption?: string) => void) | null>(null)

  const { data: module, isLoading: isLoadingModule, error: moduleError } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => fetchModule(moduleId),
  })

  const { data: parentModuleData, isLoading: isLoadingParents } = useQuery({
    queryKey: ['modules', 'parents'],
    queryFn: fetchParentModules,
  })

  const parentModules = parentModuleData?.modules || []

  // Populate tags and available tags when data loads
  useEffect(() => {
    if (module?.tags) {
      setTags(module.tags)
    }
  }, [module?.tags])

  useEffect(() => {
    if (parentModuleData?.availableTags) {
      setAvailableTags(parentModuleData.availableTags)
    }
  }, [parentModuleData?.availableTags])

  const updateMutation = useMutation({
    mutationFn: (data: EditModuleFormData) => updateModule(moduleId, data),
    onSuccess: () => {
      toast.success('Module updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['module', moduleId] })
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      // Redirect to the module's view page
      router.push(`/faculty/modules/${moduleId}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update module')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteModule(moduleId),
    onSuccess: () => {
      toast.success('Module deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      router.push('/faculty/modules')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete module')
      setShowDeleteConfirm(false)
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditModuleFormData>({
    resolver: zodResolver(editModuleSchema),
  })

  const watchedTitle = watch('title')
  const watchedStatus = watch('status')
  const watchedParentId = watch('parentModuleId')

  // Initialize form when module data loads
  useEffect(() => {
    if (module) {
      setValue('title', module.title)
      setValue('slug', module.slug)
      setValue('description', module.description || '')
      setValue('content', module.content)
      setValue('parentModuleId', module.parentModuleId)
      setValue('status', module.status)
      setValue('tags', module.tags || [])
      // Also set the tags state
      setTags(module.tags || [])
    }
  }, [module, setValue])

  // Auto-generate slug from title
  useEffect(() => {
    if (watchedTitle && module && watchedTitle !== module.title) {
      const slug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      setValue('slug', slug)
    }
  }, [watchedTitle, setValue, module])

  const onSubmit = async (data: EditModuleFormData) => {
    try {
      await updateMutation.mutateAsync({
        ...data,
        tags
      })
    } catch (error) {
      // Error is handled by mutation
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync()
    } catch (error) {
      // Error is handled by mutation
    }
  }

  // Available parent modules (exclude self and descendants)
  const availableParentModules = parentModules.filter(parent => 
    parent.id !== moduleId && 
    (!module?.subModules?.some(sub => sub.id === parent.id))
  )

  if (isLoadingModule) {
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
      </div>
    )
  }

  if (moduleError || !module) {
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
                Module Not Found
              </h2>
              <p className="text-muted-foreground mb-6">
                The module you are trying to edit does not exist or you do not have permission to edit it.
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/faculty/modules/${moduleId}`}>
                <NeuralButton variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Module
                </NeuralButton>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neural">
                  {module.parentModule ? (
                    <Layers className="h-6 w-6 text-primary-foreground" />
                  ) : (
                    <Brain className="h-6 w-6 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neural-primary">Edit Module</h1>
                  <p className="text-sm text-muted-foreground">
                    Modify content and settings for: {module.title}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <NeuralButton
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </NeuralButton>
              <NeuralButton
                variant="synaptic"
                size="sm"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || updateMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </NeuralButton>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Module Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="cognitive-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-neural-primary" />
                  Module Details
                </CardTitle>
                <CardDescription>
                  Configure the basic information for your module
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter module title..."
                    {...register('title')}
                    className="border-neural-light/30 focus:border-neural-primary"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="slug"
                      placeholder="url-friendly-slug"
                      {...register('slug')}
                      className="pl-10 border-neural-light/30 focus:border-neural-primary"
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-sm text-red-500">{errors.slug.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the module..."
                    rows={3}
                    {...register('description')}
                    className="border-neural-light/30 focus:border-neural-primary"
                  />
                </div>

                <TagsInput
                  value={tags}
                  onChange={setTags}
                  label="Tags"
                  placeholder="Add tags to categorize this module..."
                  suggestions={availableTags}
                  maxTags={10}
                  id="tags"
                />

                <div className="space-y-2">
                  <Label htmlFor="parentModule">Parent Module</Label>
                  <Select
                    value={watchedParentId ?? 'none'}
                    onValueChange={(value) => setValue('parentModuleId', value === 'none' ? null : value)}
                  >
                    <SelectTrigger className="border-neural-light/30 focus:border-neural-primary">
                      <SelectValue placeholder="None (Root Module)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Root Module)</SelectItem>
                      {isLoadingParents ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        availableParentModules.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="draft"
                        {...register('status')}
                        className="text-neural-primary"
                      />
                      <span className="flex items-center text-sm">
                        <FileText className="mr-1 h-4 w-4 text-orange-500" />
                        Draft
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="published"
                        {...register('status')}
                        className="text-neural-primary"
                      />
                      <span className="flex items-center text-sm">
                        <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        Published
                      </span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Statistics */}
            <Card className="cognitive-card">
              <CardHeader>
                <CardTitle className="text-sm">Module Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={watchedStatus === 'published' ? 'default' : 'outline'}>
                    {watchedStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(module.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium">
                    {new Date(module.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sub-modules:</span>
                  <span className="font-medium">{module.subModules?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration */}
            <CollaboratorPanel
              entityType="module"
              entityId={moduleId}
              authorId={module.author_id}
            />

            {/* Activity Feed */}
            <ActivityFeed
              entityType="module"
              entityId={moduleId}
              limit={10}
            />
          </div>

          {/* Content Editor */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="cognitive-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-neural-primary" />
                  Module Content
                </CardTitle>
                <CardDescription>
                  Write and format your educational content using the rich text editor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NeuralRichTextEditor
                  content={watch('content') || ''}
                  onChange={(html) => setValue('content', html)}
                  placeholder="Start writing your module content..."
                  autoSave={true}
                  onSave={(html) => setValue('content', html)}
                  moduleId={moduleId}
                  onEditorReady={(insertImage) => setInsertImageFn(() => insertImage)}
                />
                {errors.content && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.content.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Media Library */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <MediaLibraryPanel
                moduleId={moduleId}
                onMediaSelect={(file, altText, caption) => {
                  if (insertImageFn) {
                    insertImageFn(file.url, altText || file.originalName, caption);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertCircle className="mr-2 h-5 w-5" />
                Confirm Deletion
              </CardTitle>
              <CardDescription>
                This action cannot be undone. This will permanently delete the module and all its content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <NeuralButton
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </NeuralButton>
                <NeuralButton
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Module'}
                </NeuralButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
