"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { NeuralButton } from '@/components/ui/neural-button'
import { TagsInput } from '@/components/ui/tags-input'
import { CollaboratorPanel } from '@/components/collaboration/CollaboratorPanel'
import { ActivityFeed } from '@/components/collaboration/ActivityFeed'
import { ModuleNotesEditor } from '@/components/faculty/module-notes-editor'
import { ResponsiveEditLayout } from '@/components/layout/ResponsiveEditLayout'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group-custom'
import { Checkbox } from '@/components/ui/checkbox-custom'
import { toast } from 'sonner'
import {
  Save,
  Eye,
  ArrowLeft,
  BookOpen,
  Brain,
  Layers,
  AlertCircle,
  Hash,
  CheckCircle,
  GripVertical,
  Plus,
  X,
  Search,
  FileText,
  Trash2,
  Calendar,
  Users
} from 'lucide-react'

const editCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
  description: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})

type EditCourseFormData = z.infer<typeof editCourseSchema>

interface Module {
  id: string
  title: string
  slug: string
  description: string | null
  status: 'draft' | 'published'
  parentModule: {
    id: string
    title: string
  } | null
}

interface SelectedModule {
  moduleId: string
  order: number
  module: Module
}

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  status: 'draft' | 'published'
  featured: boolean
  tags: string[]
  author_id: string
  created_at: string
  updated_at: string
  course_modules?: {
    id: string
    sort_order: number
    modules: Module
  }[]
}

function SortableModuleItem({
  item,
  onRemove,
  onEditNotes
}: {
  item: SelectedModule;
  onRemove: (moduleId: string) => void;
  onEditNotes: (moduleId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.moduleId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group"
    >
      <Card className="cognitive-card border-2 border-neural-light/30 hover:border-neural-primary/50 hover:bg-neural-primary/5 transition-all duration-200 hover:shadow-md">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
            >
              <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center min-w-0 flex-1">
                  {item.module.parentModule ? (
                    <Layers className="h-4 w-4 text-synapse-primary mr-1 flex-shrink-0" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-neural-primary mr-1 flex-shrink-0" />
                  )}
                  <h4 className="font-medium text-sm truncate">{item.module.title}</h4>
                </div>
                <Badge
                  variant={item.module.status === 'published' ? 'default' : 'outline'}
                  className="text-xs flex-shrink-0"
                >
                  {item.module.status}
                </Badge>
              </div>
              {item.module.description && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {item.module.description}
                </p>
              )}
              {item.module.parentModule && (
                <p className="text-xs text-synapse-primary mt-1 truncate">
                  Sub-module of: {item.module.parentModule.title}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <NeuralButton
                variant="ghost"
                size="sm"
                onClick={() => onEditNotes(item.moduleId)}
                className="hidden sm:flex"
                title="Edit course-specific notes"
              >
                <FileText className="h-4 w-4" />
              </NeuralButton>
              <NeuralButton
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.moduleId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <X className="h-4 w-4" />
              </NeuralButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function fetchCourse(courseId: string): Promise<Course> {
  const response = await fetch(`/api/courses/${courseId}?includeModules=true`)
  if (!response.ok) {
    throw new Error('Failed to fetch course')
  }
  const data = await response.json()
  return data.course
}

async function fetchModules(): Promise<{ modules: Module[], availableTags: string[] }> {
  const response = await fetch('/api/modules')
  if (!response.ok) {
    throw new Error('Failed to fetch modules')
  }
  const data = await response.json()
  return { modules: data.modules, availableTags: data.availableTags || [] }
}

async function updateCourse(courseId: string, data: EditCourseFormData & { modules: { moduleId: string; order: number }[] }) {
  const response = await fetch(`/api/courses/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update course')
  }

  return response.json()
}

async function deleteCourse(courseId: string) {
  const response = await fetch(`/api/courses/${courseId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete course')
  }

  return response.json()
}

export function EditCourseForm({ courseId }: { courseId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModuleSelector, setShowModuleSelector] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingNotesForModule, setEditingNotesForModule] = useState<string | null>(null)

  // Disable body scroll when modal is open
  useEffect(() => {
    const isModalOpen = showDeleteConfirm || editingNotesForModule !== null
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDeleteConfirm, editingNotesForModule])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { data: course, isLoading: isLoadingCourse, error: courseError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId),
  })

  const { data: moduleData, isLoading: isLoadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: fetchModules,
  })

  const modules = moduleData?.modules || []

  // Update available tags when data changes
  useEffect(() => {
    if (moduleData?.availableTags) {
      setAvailableTags(moduleData.availableTags)
    }
  }, [moduleData?.availableTags])

  const updateCourseMutation = useMutation({
    mutationFn: (data: EditCourseFormData & { modules: { moduleId: string; order: number }[] }) =>
      updateCourse(courseId, data),
    onSuccess: (data) => {
      toast.success('Course updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      router.push(`/faculty/courses`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update course')
    },
  })

  const deleteCourseMutation = useMutation({
    mutationFn: () => deleteCourse(courseId),
    onSuccess: () => {
      toast.success('Course deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      router.push('/faculty/courses')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete course')
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
  } = useForm<EditCourseFormData>({
    resolver: zodResolver(editCourseSchema),
  })

  const watchedTitle = watch('title')
  const watchedStatus = watch('status')

  // Initialize form when course data loads
  useEffect(() => {
    if (course) {
      setValue('title', course.title)
      setValue('slug', course.slug)
      setValue('description', course.description || '')
      setValue('status', course.status)
      setValue('featured', course.featured)
      setValue('tags', course.tags || [])
      setTags(course.tags || [])

      // Initialize selected modules
      const initialModules: SelectedModule[] = (course.course_modules || []).map((cm) => ({
        moduleId: cm.modules.id,
        order: cm.sort_order,
        module: cm.modules,
      }))
      setSelectedModules(initialModules)
    }
  }, [course, setValue])

  // Auto-generate slug from title
  useEffect(() => {
    if (watchedTitle && course && watchedTitle !== course.title) {
      const slug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      setValue('slug', slug)
    }
  }, [watchedTitle, setValue, course])

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSelectedModules((items) => {
        const oldIndex = items.findIndex((item) => item.moduleId === active.id)
        const newIndex = items.findIndex((item) => item.moduleId === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        // Update order values
        return newItems.map((item, index) => ({
          ...item,
          order: index,
        }))
      })
    }
  }

  const addModule = (module: Module) => {
    const isAlreadySelected = selectedModules.some(item => item.moduleId === module.id)
    if (isAlreadySelected) {
      toast.error('Module is already added to the course')
      return
    }

    const newItem: SelectedModule = {
      moduleId: module.id,
      order: selectedModules.length,
      module,
    }
    setSelectedModules([...selectedModules, newItem])
    toast.success(`Added "${module.title}" to course`)
  }

  const removeModule = (moduleId: string) => {
    setSelectedModules(prev => {
      const filtered = prev.filter(item => item.moduleId !== moduleId)
      // Re-order remaining items
      return filtered.map((item, index) => ({
        ...item,
        order: index,
      }))
    })
  }

  const openNotesEditor = (moduleId: string) => {
    setEditingNotesForModule(moduleId)
  }

  const filteredModules = modules.filter(module =>
    module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const availableModules = filteredModules.filter(module =>
    !selectedModules.some(selected => selected.moduleId === module.id)
  )

  const onSubmit = async (data: EditCourseFormData) => {
    try {
      await updateCourseMutation.mutateAsync({
        ...data,
        tags,
        modules: selectedModules.map(({ moduleId, order }) => ({ moduleId, order })),
      })
    } catch (error) {
      // Error is handled by mutation
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCourseMutation.mutateAsync()
    } catch (error) {
      // Error is handled by mutation
    }
  }

  if (isLoadingCourse) {
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

  // Error state
  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="cognitive-card max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
              Course Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              The course you are trying to edit does not exist or you do not have permission to edit it.
            </p>
            <Link href="/faculty/courses">
              <NeuralButton variant="neural">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </NeuralButton>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // RENDER SECTIONS FOR NEW LAYOUT
  // ============================================================================

  // EDIT TAB: Module Management + Statistics
  const editTabContent = (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Modules Count */}
        <Card className="cognitive-card border-2 hover:border-blue-300 hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950">
                <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Modules</p>
                <p className="text-2xl font-bold">{selectedModules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Published Modules */}
        <Card className="cognitive-card border-2 hover:border-green-300 hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">
                  {selectedModules.filter(item => item.module.status === 'published').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Status */}
        <Card className="cognitive-card border-2 hover:border-purple-300 hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-950">
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={watchedStatus === 'published' ? 'default' : 'outline'}>
                  {watchedStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <Card className="cognitive-card border-2 hover:border-orange-300 hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-950">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm font-bold">
                  {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Assembly */}
      <Card className="cognitive-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center">
                <Layers className="mr-2 h-5 w-5 text-neural-primary" />
                Course Assembly
              </CardTitle>
              <CardDescription>Build your course by adding and arranging modules</CardDescription>
            </div>
            <NeuralButton
              variant="neural"
              size="sm"
              onClick={() => setShowModuleSelector(!showModuleSelector)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {showModuleSelector ? 'Hide' : 'Add'} Modules
            </NeuralButton>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Module Selector */}
          {showModuleSelector && (
            <Card className="border-2 border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Search className="mr-2 h-4 w-4 text-neural-primary" />
                  Select Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {isLoadingModules ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : availableModules.length > 0 ? (
                    availableModules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {module.parentModule ? (
                              <Layers className="h-4 w-4 text-synapse-primary flex-shrink-0" />
                            ) : (
                              <BookOpen className="h-4 w-4 text-neural-primary flex-shrink-0" />
                            )}
                            <span className="font-medium truncate">{module.title}</span>
                            <Badge variant={module.status === 'published' ? 'default' : 'outline'} className="text-xs">
                              {module.status}
                            </Badge>
                          </div>
                          {module.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{module.description}</p>
                          )}
                        </div>
                        <NeuralButton
                          variant="ghost"
                          size="sm"
                          onClick={() => addModule(module)}
                        >
                          <Plus className="h-4 w-4" />
                        </NeuralButton>
                      </div>
                    ))
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {searchTerm ? 'No modules found matching your search.' : 'No modules available.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Modules List */}
          {selectedModules.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedModules.map(item => item.moduleId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {selectedModules.map((item) => (
                    <SortableModuleItem
                      key={item.moduleId}
                      item={item}
                      onRemove={removeModule}
                      onEditNotes={openNotesEditor}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No modules added yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Start building your course by adding modules. You can reorder them later by dragging and dropping.
              </p>
              <NeuralButton
                variant="neural"
                size="sm"
                onClick={() => setShowModuleSelector(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Module
              </NeuralButton>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // SETTINGS TAB: Course Details + Publishing + Danger Zone
  const settingsTabContent = (
    <div className="space-y-6">
      {/* Course Details */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Configure the basic information for your course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter course title..."
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the course..."
              rows={4}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <TagsInput
              value={tags}
              onChange={setTags}
              label="Tags"
              placeholder="Add tags..."
              suggestions={availableTags}
              maxTags={10}
              id="tags"
            />
          </div>
        </CardContent>
      </Card>

      {/* Publishing Settings */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle>Publishing Settings</CardTitle>
          <CardDescription>Control course status and visibility</CardDescription>
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

          <Separator />

          <div className="flex items-center space-x-2">
            <Controller
              name="featured"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="featured"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="featured" className="cursor-pointer font-normal">
              Feature this course on the homepage
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="cognitive-card border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions that permanently affect this course</CardDescription>
        </CardHeader>
        <CardContent>
          <NeuralButton
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteCourseMutation.isPending}
            className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Course
          </NeuralButton>
        </CardContent>
      </Card>
    </div>
  );

  // TEAM CONTENT: Collaborators + Activity Feed
  const teamContent = (
    <div className="space-y-6">
      <CollaboratorPanel
        entityType="course"
        entityId={courseId}
        authorId={course.author_id}
      />
      <ActivityFeed
        entityType="course"
        entityId={courseId}
        limit={10}
      />
    </div>
  );

  // MEDIA CONTENT: Placeholder (courses don't have media library)
  const mediaContent = (
    <div className="p-4">
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          <strong>Media Library Not Available</strong>
          <p className="mt-2 text-sm">
            Courses organize modules and don&apos;t have their own media library. Media files are managed at the module level.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div>
      <ResponsiveEditLayout
        header={{
          title: "Edit Course",
          subtitle: course.title,
          backHref: "/faculty/courses",
          backLabel: "Back to Courses",
          previewHref: `/courses/${course.slug}`,
          collaboratorCount: 0, // TODO: Get actual collaborator count
          onSave: handleSubmit(onSubmit),
          isSaving: isSubmitting || updateCourseMutation.isPending,
          saveDisabled: isSubmitting || updateCourseMutation.isPending,
          icon: 'brain',
        }}
        editTabContent={editTabContent}
        settingsTabContent={settingsTabContent}
        teamContent={teamContent}
        mediaContent={mediaContent}
        defaultTab="edit"
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
                This action cannot be undone. This will permanently delete the course and all its relationships.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <NeuralButton
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </NeuralButton>
                <NeuralButton
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteCourseMutation.isPending}
                  className="flex-1 bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteCourseMutation.isPending ? 'Deleting...' : 'Delete Course'}
                </NeuralButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Module Notes Editor */}
      {editingNotesForModule && (() => {
        const moduleData = selectedModules.find(m => m.moduleId === editingNotesForModule);
        return moduleData ? (
          <ModuleNotesEditor
            courseId={courseId}
            moduleId={editingNotesForModule}
            moduleTitle={moduleData.module.title}
            onClose={() => setEditingNotesForModule(null)}
          />
        ) : null;
      })()}
    </div>
  )
}
