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
  Globe,
  Lock,
  Lightbulb
} from 'lucide-react'

const createModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
  description: z.string().optional(),
  parentModuleId: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  visibility: z.enum(['public', 'private']).default('public'),
  tags: z.array(z.string()).default([]),
})

type CreateModuleFormData = z.infer<typeof createModuleSchema>

interface Module {
  id: string
  title: string
  slug: string
  parentModuleId: string | null
  _count: {
    subModules: number
  }
}

async function fetchModules(): Promise<{ modules: Module[], availableTags: string[] }> {
  const response = await fetch('/api/modules')
  if (!response.ok) {
    throw new Error('Failed to fetch modules')
  }
  const data = await response.json()
  return { modules: data.modules, availableTags: data.availableTags || [] }
}

async function createModule(data: CreateModuleFormData & { content?: string }) {
  const { parentModuleId, ...rest } = data;
  const apiData = {
    ...rest,
    parent_module_id: parentModuleId,
  }

  const response = await fetch('/api/modules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create module')
  }

  return response.json()
}

export function CreateModuleForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [insertImageFn, setInsertImageFn] = useState<((url: string, alt?: string, caption?: string) => void) | null>(null)

  const { data: moduleData, isLoading: isLoadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: fetchModules,
  })

  const modules = moduleData?.modules || []

  useEffect(() => {
    if (moduleData?.availableTags) {
      setAvailableTags(moduleData.availableTags)
    }
  }, [moduleData?.availableTags])

  const createModuleMutation = useMutation({
    mutationFn: createModule,
    onSuccess: (data) => {
      toast.success('Module created successfully!')
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      router.push(`/modules/${data.module.slug}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create module')
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateModuleFormData>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      status: 'draft',
      visibility: 'public',
      tags: [],
    },
  })

  const watchedTitle = watch('title')
  const watchedStatus = watch('status')
  const watchedVisibility = watch('visibility')
  const watchedParentModuleId = watch('parentModuleId')

  // Auto-generate slug from title
  useEffect(() => {
    if (watchedTitle) {
      const slug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      setValue('slug', slug)
    }
  }, [watchedTitle, setValue])

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

  const onSubmit = async (data: CreateModuleFormData) => {
    try {
      await createModuleMutation.mutateAsync({
        ...data,
        tags,
        content,
      })
    } catch (error) {
      // Error is handled by mutation
    }
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
          content={content}
          onChange={setContent}
          placeholder="Start writing your module content..."
          autoSave={false}
          onEditorReady={(insertImage) => setInsertImageFn(() => insertImage)}
        />
        {content.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            💡 Tip: You can save as draft and add content later
          </p>
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
            <p className="text-xs text-muted-foreground">
              Auto-generated from title, but you can customize it
            </p>
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
              value={watchedParentModuleId || 'none'}
              onValueChange={(value) => setValue('parentModuleId', value === 'none' ? undefined : value)}
              disabled={isLoadingModules}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingModules ? "Loading..." : "None (Root Module)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Root Module)</SelectItem>
                {modules.filter(m => m.parentModuleId === null).map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Root modules appear at the top level. Sub-modules are nested under parents.
            </p>
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
            <p className="text-xs text-muted-foreground">
              Drafts are only visible to you. Published modules are accessible to students.
            </p>
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

      {/* Quick Tips */}
      <Card className="cognitive-card border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
            <Lightbulb className="mr-2 h-4 w-4" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Save as <strong>draft</strong> to continue editing later</li>
            <li>• Add <strong>tags</strong> to make your module discoverable</li>
            <li>• Use <strong>Ctrl/Cmd + S</strong> to quickly save</li>
            <li>• You can add collaborators after creating the module</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  // TEAM CONTENT: Info message (no collaborators for new modules)
  const teamContent = (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Brain className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Collaboration Coming Soon</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        After creating this module, you&apos;ll be able to add collaborators and track activity from the edit page.
      </p>
    </div>
  );

  // MEDIA CONTENT: Placeholder since no module ID yet
  const mediaContent = (
    <div className="p-4">
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <strong>Media Library Available After Creation</strong>
          <p className="mt-2 text-sm">
            Once you create this module, you&apos;ll be able to upload images and other media files. For now, focus on writing your content!
          </p>
        </AlertDescription>
      </Alert>

      <div className="mt-6 p-6 bg-muted/30 rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          💡 You can embed images using URLs in the editor, or upload files after creation.
        </p>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <ResponsiveEditLayout
      header={{
        title: "Create Module",
        subtitle: "Build a new learning module with rich content",
        backHref: "/faculty/modules",
        backLabel: "Back to Modules",
        collaboratorCount: 0,
        onSave: handleSubmit(onSubmit),
        isSaving: isSubmitting || createModuleMutation.isPending,
        saveDisabled: isSubmitting || createModuleMutation.isPending,
        icon: watchedParentModuleId ? 'layers' : 'brain',
      }}
      editTabContent={editTabContent}
      settingsTabContent={settingsTabContent}
      teamContent={teamContent}
      mediaContent={mediaContent}
      defaultTab="edit"
    />
  )
}
