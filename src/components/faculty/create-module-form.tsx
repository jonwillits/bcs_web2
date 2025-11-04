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
  FileText, 
  Brain, 
  Layers,
  AlertCircle,
  Hash,
  BookOpen,
  CheckCircle
} from 'lucide-react'

const createModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
  description: z.string().optional(),
  parentModuleId: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
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
  // Transform parentModuleId to parent_module_id for API
  const { parentModuleId, ...rest } = data;
  const apiData = {
    ...rest,
    parent_module_id: parentModuleId,
  }

  console.log('Sending to API:', apiData);

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
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [insertImageFn, setInsertImageFn] = useState<((url: string, alt?: string, caption?: string) => void) | null>(null)

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

  const createModuleMutation = useMutation({
    mutationFn: createModule,
    onSuccess: (data) => {
      toast.success('Module created successfully!')
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      // Redirect to the module view page instead of edit
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
    formState: { errors, isSubmitting },
  } = useForm<CreateModuleFormData>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      status: 'draft',
      tags: [],
    },
  })

  const watchedTitle = watch('title')
  const watchedStatus = watch('status')
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

  const onSubmit = async (data: CreateModuleFormData) => {
    try {
      console.log('Submitting module data:', {
        ...data,
        tags,
        content: content ? 'Content provided' : 'No content'
      });
      
      await createModuleMutation.mutateAsync({
        ...data,
        tags,
        content,
      })
    } catch (error) {
      console.error('Error in onSubmit:', error);
      // Error is handled by mutation
    }
  }

  const rootModules = modules.filter(module => !module.parentModuleId)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/faculty/modules">
                <NeuralButton variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Modules
                </NeuralButton>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neural">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neural-primary">Create New Module</h1>
                  <p className="text-sm text-muted-foreground">
                    Build engaging educational content with rich media support
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <NeuralButton
                variant={isPreviewMode ? 'neural' : 'ghost'}
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {isPreviewMode ? 'Edit' : 'Preview'}
              </NeuralButton>
              
              <NeuralButton
                variant="synaptic"
                size="sm"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Creating...' : 'Create Module'}
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
                    placeholder="Brief description of the module content..."
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
                    value={watchedParentModuleId ?? 'none'}
                    onValueChange={(value) => {
                      console.log('Parent module selected:', value);
                      setValue('parentModuleId', value === 'none' ? undefined : value);
                    }}
                  >
                    <SelectTrigger className="border-neural-light/30 focus:border-neural-primary">
                      <SelectValue placeholder="Select parent module (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Root Level Module
                        </div>
                      </SelectItem>
                      {rootModules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <Layers className="mr-2 h-4 w-4" />
                              {module.title}
                            </div>
                            {module._count.subModules > 0 && (
                              <Badge variant="outline" className="ml-2">
                                {module._count.subModules}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoadingModules && (
                    <p className="text-sm text-muted-foreground">Loading modules...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={watchedStatus}
                    onValueChange={(value: 'draft' | 'published') => setValue('status', value)}
                  >
                    <SelectTrigger className="border-neural-light/30 focus:border-neural-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-orange-500" />
                          Draft
                        </div>
                      </SelectItem>
                      <SelectItem value="published">
                        <div className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Published
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card className="cognitive-card">
              <CardHeader>
                <CardTitle className="text-sm">Writing Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Use clear, concise language</p>
                <p>• Include examples and visuals</p>
                <p>• Structure content with headings</p>
                <p>• Add interactive elements when possible</p>
                <p>• Review and test before publishing</p>
              </CardContent>
            </Card>
          </div>

          {/* Content Editor */}
          <div className="lg:col-span-3">
            {isPreviewMode ? (
              <Card className="cognitive-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="mr-2 h-5 w-5 text-synapse-primary" />
                    Preview Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-lg max-w-none neural-content"
                    dangerouslySetInnerHTML={{ __html: content || '<p>No content yet. Switch to edit mode to start writing.</p>' }}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neural-primary">Content Editor</h2>
                  <Badge variant="outline" className="text-neural-primary border-neural-primary/30">
                    Rich Text Editor
                  </Badge>
                </div>
                
                <NeuralRichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your module content here. Use the toolbar above to format your text, add headings, lists, images, and more..."
                  className="min-h-[600px]"
                  autoSave={true}
                  onEditorReady={(insertImage) => setInsertImageFn(() => insertImage)}
                />

                {!content && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your module content is empty. Add some text, headings, or media to create engaging educational content.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Media Library */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <MediaLibraryPanel
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
    </div>
  )
}
