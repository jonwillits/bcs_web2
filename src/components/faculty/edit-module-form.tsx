"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { NeuralRichTextEditor } from '@/components/editor/neural-rich-text-editor'
import { NeuralButton } from '@/components/ui/neural-button'
import { TagsInput } from '@/components/ui/tags-input'
import { MediaLibraryPanel } from '@/components/ui/media-library-panel'
import { CollaboratorPanel } from '@/components/collaboration/CollaboratorPanel'
import { ActivityFeed } from '@/components/collaboration/ActivityFeed'
import { ResponsiveEditLayout } from '@/components/layout/ResponsiveEditLayout'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group-custom'
import { toast } from 'sonner'
import {
  Brain,
  Hash,
  CheckCircle,
  FileText,
  AlertCircle,
  Layers,
  Trash2,
  Globe,
  Lock,
  Calendar,
  Map,
  Trophy,
  Zap,
  Target,
  Clock,
  Shield,
  Link2
} from 'lucide-react'

const editModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  parentModuleId: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  visibility: z.enum(['public', 'private']).default('public'),
  tags: z.array(z.string()).default([]),

  // Course Map fields
  prerequisiteModuleIds: z.array(z.string()).default([]),
  courseMapPositionX: z.number().min(0).max(100).default(50),
  courseMapPositionY: z.number().min(0).max(100).default(50),
  xpReward: z.number().int().min(0).max(10000).default(100),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'boss']).default('beginner'),
  estimatedMinutes: z.number().int().min(0).max(999).optional(),
  questType: z.enum(['standard', 'challenge', 'boss', 'bonus']).default('standard'),
})

type EditModuleFormData = z.infer<typeof editModuleSchema>

interface Module {
  id: string
  title: string
  slug: string
  description: string | null
  content: string
  status: 'draft' | 'published'
  visibility: 'public' | 'private'
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

  // Course Map fields
  prerequisite_module_ids: string[]
  course_map_position_x: number
  course_map_position_y: number
  xp_reward: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'boss'
  estimated_minutes: number | null
  quest_type: 'standard' | 'challenge' | 'boss' | 'bonus'
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

async function fetchAllModules(): Promise<ParentModule[]> {
  const response = await fetch('/api/modules?limit=1000')
  if (!response.ok) {
    throw new Error('Failed to fetch modules')
  }
  const data = await response.json()
  return data.modules
}

async function updateModule(id: string, data: EditModuleFormData) {
  const {
    parentModuleId,
    prerequisiteModuleIds,
    courseMapPositionX,
    courseMapPositionY,
    xpReward,
    difficultyLevel,
    estimatedMinutes,
    questType,
    ...rest
  } = data;

  const apiData = {
    ...rest,
    parent_module_id: parentModuleId,
    prerequisite_module_ids: prerequisiteModuleIds,
    course_map_position_x: courseMapPositionX,
    course_map_position_y: courseMapPositionY,
    xp_reward: xpReward,
    difficulty_level: difficultyLevel,
    estimated_minutes: estimatedMinutes,
    quest_type: questType,
  }

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

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showDeleteConfirm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDeleteConfirm])

  const { data: module, isLoading: isLoadingModule, error: moduleError } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => fetchModule(moduleId),
  })

  const { data: parentModuleData, isLoading: isLoadingParents } = useQuery({
    queryKey: ['modules', 'parents'],
    queryFn: fetchParentModules,
  })

  const { data: allModules, isLoading: isLoadingAllModules } = useQuery({
    queryKey: ['modules', 'all'],
    queryFn: fetchAllModules,
  })

  const parentModules = parentModuleData?.modules || []

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditModuleFormData>({
    resolver: zodResolver(editModuleSchema),
  })

  const watchedTitle = watch('title')
  const watchedStatus = watch('status')
  const watchedVisibility = watch('visibility')
  const watchedParentId = watch('parentModuleId')

  // Course map field watchers
  const watchedPrerequisites = watch('prerequisiteModuleIds')
  const watchedDifficulty = watch('difficultyLevel')
  const watchedQuestType = watch('questType')

  // Initialize form when module data loads
  useEffect(() => {
    if (module) {
      setValue('title', module.title)
      setValue('slug', module.slug)
      setValue('description', module.description || '')
      setValue('content', module.content)
      setValue('parentModuleId', module.parentModuleId)
      setValue('status', module.status)
      setValue('visibility', module.visibility || 'public')
      setValue('tags', module.tags || [])
      setTags(module.tags || [])

      // Initialize course map fields
      setValue('prerequisiteModuleIds', module.prerequisite_module_ids || [])
      setValue('courseMapPositionX', module.course_map_position_x ?? 50)
      setValue('courseMapPositionY', module.course_map_position_y ?? 50)
      setValue('xpReward', module.xp_reward ?? 100)
      setValue('difficultyLevel', module.difficulty_level || 'beginner')
      setValue('estimatedMinutes', module.estimated_minutes ?? undefined)
      setValue('questType', module.quest_type || 'standard')
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

  // Keyboard shortcut: Ctrl+S (or Cmd+S) to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!isSubmitting) {
          handleSubmit(onSubmit)()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSubmit, isSubmitting])

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

  // Loading state
  if (isLoadingModule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 bg-gradient-to-r from-neural-light/30 to-neural-primary/30 rounded w-64 mx-auto"></div>
          <div className="h-4 bg-gradient-to-r from-neural-primary/30 to-neural-light/30 rounded w-48 mx-auto"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (moduleError || !module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="cognitive-card max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
              Module Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              The module you are trying to edit does not exist or you do not have permission to edit it.
            </p>
            <NeuralButton variant="neural" onClick={() => router.push('/faculty/modules')}>
              Back to Modules
            </NeuralButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // RENDER SECTIONS FOR NEW LAYOUT
  // ============================================================================

  // EDIT TAB: Rich Text Editor
  const editTabContent = (
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
  );

  // SETTINGS TAB: Module Details + Publishing Settings
  const settingsTabContent = (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core module details and metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter module title..."
              {...register('title')}
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
                className="pl-10"
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
            />
          </div>

          <div className="space-y-2">
            <TagsInput
              value={tags}
              onChange={setTags}
              label="Tags"
              placeholder="Add tags to categorize this module..."
              suggestions={availableTags}
              maxTags={10}
              id="tags"
            />
          </div>
        </CardContent>
      </Card>

      {/* Module Hierarchy */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle>Module Hierarchy</CardTitle>
          <CardDescription>Organize this module within a parent module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="parentModule">Parent Module</Label>
            <Select
              value={watchedParentId ?? 'none'}
              onValueChange={(value) => setValue('parentModuleId', value === 'none' ? null : value)}
              disabled={isLoadingParents}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingParents ? "Loading..." : "None (Root Module)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Root Module)</SelectItem>
                {availableParentModules.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Course Map Settings */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Map className="mr-2 h-5 w-5 text-neural-primary" />
            Course Map Settings
          </CardTitle>
          <CardDescription>Configure gamification and course map properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prerequisites */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-synapse-primary" />
              <Label>Prerequisites</Label>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Select modules that must be completed before this one
            </p>
            {isLoadingAllModules ? (
              <div className="text-sm text-muted-foreground">Loading modules...</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {allModules && allModules.length > 0 ? (
                  allModules
                    .filter(m => m.id !== moduleId)
                    .map((prereqModule) => (
                      <label
                        key={prereqModule.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={watchedPrerequisites?.includes(prereqModule.id) || false}
                          onChange={(e) => {
                            const currentPrereqs = watchedPrerequisites || []
                            if (e.target.checked) {
                              setValue('prerequisiteModuleIds', [...currentPrereqs, prereqModule.id])
                            } else {
                              setValue('prerequisiteModuleIds', currentPrereqs.filter(id => id !== prereqModule.id))
                            }
                          }}
                          className="rounded border-gray-300 text-neural-primary focus:ring-neural-primary"
                        />
                        <span className="text-sm flex-1">{prereqModule.title}</span>
                      </label>
                    ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No modules available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* XP Reward & Difficulty - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <Label htmlFor="xpReward">XP Reward</Label>
              </div>
              <Input
                id="xpReward"
                type="number"
                min={0}
                max={10000}
                {...register('xpReward', { valueAsNumber: true })}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">Points awarded (0-10000)</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <Label htmlFor="difficultyLevel">Difficulty</Label>
              </div>
              <Select
                value={watchedDifficulty}
                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced' | 'boss') =>
                  setValue('difficultyLevel', value)
                }
              >
                <SelectTrigger id="difficultyLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <span className="flex items-center">
                      <Target className="mr-2 h-4 w-4 text-green-500" />
                      Beginner
                    </span>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <span className="flex items-center">
                      <Target className="mr-2 h-4 w-4 text-blue-500" />
                      Intermediate
                    </span>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <span className="flex items-center">
                      <Target className="mr-2 h-4 w-4 text-orange-500" />
                      Advanced
                    </span>
                  </SelectItem>
                  <SelectItem value="boss">
                    <span className="flex items-center">
                      <Target className="mr-2 h-4 w-4 text-red-500" />
                      Boss
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estimated Time & Quest Type - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <Label htmlFor="estimatedMinutes">Estimated Time</Label>
              </div>
              <Input
                id="estimatedMinutes"
                type="number"
                min={0}
                max={999}
                {...register('estimatedMinutes', { valueAsNumber: true })}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">Minutes to complete (optional)</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <Label htmlFor="questType">Quest Type</Label>
              </div>
              <Select
                value={watchedQuestType}
                onValueChange={(value: 'standard' | 'challenge' | 'boss' | 'bonus') =>
                  setValue('questType', value)
                }
              >
                <SelectTrigger id="questType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                  <SelectItem value="boss">Boss</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Map Position - Responsive Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-neural-primary" />
              <Label>Course Map Position (%)</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Position on the course map grid (0-100 for X and Y coordinates)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseMapPositionX" className="text-sm">X Position (Horizontal)</Label>
                <Input
                  id="courseMapPositionX"
                  type="number"
                  min={0}
                  max={100}
                  {...register('courseMapPositionX', { valueAsNumber: true })}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseMapPositionY" className="text-sm">Y Position (Vertical)</Label>
                <Input
                  id="courseMapPositionY"
                  type="number"
                  min={0}
                  max={100}
                  {...register('courseMapPositionY', { valueAsNumber: true })}
                  placeholder="50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Settings */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle>Publishing Settings</CardTitle>
          <CardDescription>Control module status and visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="draft" id="status-draft" />
                    <Label htmlFor="status-draft" className="flex items-center cursor-pointer font-normal">
                      <FileText className="mr-1.5 h-4 w-4 text-orange-500" />
                      Draft
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="published" id="status-published" />
                    <Label htmlFor="status-published" className="flex items-center cursor-pointer font-normal">
                      <CheckCircle className="mr-1.5 h-4 w-4 text-green-500" />
                      Published
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className="space-y-3">
            <Label>Visibility</Label>
            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="visibility-public" />
                    <Label htmlFor="visibility-public" className="flex items-center cursor-pointer font-normal">
                      <Globe className="mr-1.5 h-4 w-4 text-blue-500" />
                      Public
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="visibility-private" />
                    <Label htmlFor="visibility-private" className="flex items-center cursor-pointer font-normal">
                      <Lock className="mr-1.5 h-4 w-4 text-purple-500" />
                      Private
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Public modules can be added to any course. Private modules are only accessible to you.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Module Statistics */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle>Module Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-synapse-primary" />
                <p className="text-sm font-medium text-muted-foreground">Status</p>
              </div>
              <Badge variant={watchedStatus === 'published' ? 'default' : 'outline'}>
                {watchedStatus}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-neural-primary" />
                <p className="text-sm font-medium text-muted-foreground">Sub-modules</p>
              </div>
              <p className="text-2xl font-bold">{module.subModules?.length || 0}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cognition-teal" />
                <p className="text-sm font-medium text-muted-foreground">Created</p>
              </div>
              <p className="text-sm font-semibold">
                {module.createdAt ? (
                  new Date(module.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                ) : (
                  'N/A'
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cognition-orange" />
                <p className="text-sm font-medium text-muted-foreground">Updated</p>
              </div>
              <p className="text-sm font-semibold">
                {module.updatedAt ? (
                  new Date(module.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                ) : (
                  'N/A'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="cognitive-card border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that permanently affect this module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NeuralButton
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Module
          </NeuralButton>
        </CardContent>
      </Card>
    </div>
  );

  // TEAM CONTENT: Collaborators + Activity Feed
  const teamContent = (
    <div className="space-y-6">
      <CollaboratorPanel
        entityType="module"
        entityId={moduleId}
        authorId={module.author_id}
      />
      <ActivityFeed
        entityType="module"
        entityId={moduleId}
        limit={10}
      />
    </div>
  );

  // MEDIA CONTENT: Media Library
  const mediaContent = (
    <MediaLibraryPanel
      moduleId={moduleId}
      onMediaSelect={(file, altText, caption) => {
        if (insertImageFn) {
          insertImageFn(file.url, altText || file.originalName, caption);
        }
      }}
    />
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div>
      <ResponsiveEditLayout
        header={{
          title: "Edit Module",
          subtitle: `Modify content and settings for: ${module.title}`,
          backHref: `/faculty/modules/${moduleId}`,
          backLabel: "Back to Module",
          previewHref: `/modules/${module.slug}`,
          collaboratorCount: 0, // TODO: Get actual count from API
          onSave: handleSubmit(onSubmit),
          isSaving: isSubmitting || updateMutation.isPending,
          saveDisabled: isSubmitting || updateMutation.isPending,
          icon: module.parentModule ? 'layers' : 'brain',
        }}
        editTabContent={editTabContent}
        settingsTabContent={settingsTabContent}
        teamContent={teamContent}
        mediaContent={mediaContent}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center px-2 sm:px-4 pt-8 sm:pt-12 pb-4 z-[100]">
          <Card className="w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
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
