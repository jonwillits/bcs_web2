'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import mediumZoom from 'medium-zoom'
import 'medium-zoom/dist/style.css'
import { 
  BookOpen, 
  Clock, 
  User, 
  Calendar,
  Layers,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NeuralButton } from '@/components/ui/neural-button'
import { Separator } from '@/components/ui/separator'
import { ModuleResources } from '@/components/public/module-resources'
import { MarkCompleteButton } from '@/components/progress/MarkCompleteButton'

interface MediaFile {
  id: string
  name: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
}

interface StandaloneModuleProps {
  module: {
    id: string
    title: string
    slug: string
    content: string
    description: string | null
    status: 'draft' | 'published'
    createdAt: string
    updatedAt: string
    author: {
      name: string
      email: string
    }
    parentModule?: {
      id: string
      title: string
      slug: string
    } | null
    subModules: {
      id: string
      title: string
      slug: string
      description: string | null
      sortOrder: number
    }[]
    resources?: MediaFile[]
  }
  userId?: string
  initialProgress?: 'not_started' | 'completed'
}

export function StandaloneModuleViewer({ module, userId, initialProgress = 'not_started' }: StandaloneModuleProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Initialize medium-zoom on module content images
  useEffect(() => {
    if (contentRef.current) {
      const images = contentRef.current.querySelectorAll('img')
      const zoom = mediumZoom(images, {
        margin: 24,
        background: 'rgba(0, 0, 0, 0.9)',
        scrollOffset: 0,
      })

      return () => {
        zoom.detach()
      }
    }
  }, [module.id])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <NeuralButton variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </NeuralButton>
            </Link>
            {module.parentModule && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Link href={`/modules/${module.parentModule.slug}`}>
                  <NeuralButton variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to {module.parentModule.title}
                  </NeuralButton>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-neural-primary mb-2">
                {module.title}
              </h1>
              {module.description && (
                <p className="text-lg text-muted-foreground mb-4">
                  {module.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Published
              </Badge>
              {userId && (
                <MarkCompleteButton
                  moduleId={module.id}
                  initialStatus={initialProgress}
                  context="standalone"
                />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <User className="mr-1 h-4 w-4" />
              {module.author?.name || 'Unknown'}
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              Updated {new Date(module.updatedAt).toLocaleDateString()}
            </div>
            {(module.subModules?.length || 0) > 0 && (
              <div className="flex items-center">
                <Layers className="mr-1 h-4 w-4" />
                {module.subModules?.length || 0} submodule{(module.subModules?.length || 0) !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <Card className="cognitive-card">
            <CardContent className="p-8">
              <div
                ref={contentRef}
                className="neural-content reading-interface prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: module.content }}
              />
            </CardContent>
          </Card>

          {/* Module Resources */}
          {module.resources && module.resources.length > 0 && (
            <ModuleResources resources={module.resources} />
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Module Info */}
          <Card className="cognitive-card">
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <BookOpen className="mr-2 h-4 w-4 text-neural-primary" />
                Module Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    Published
                  </Badge>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Author:</span>
                  <span className="font-medium">{module.author?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(module.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(module.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submodules */}
          {(module.subModules?.length || 0) > 0 && (
            <Card className="cognitive-card">
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Layers className="mr-2 h-4 w-4 text-neural-primary" />
                  Submodules
                </CardTitle>
                <CardDescription>
                  Continue learning with related content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(module.subModules || []).map((subModule) => (
                  <Link 
                    key={subModule.id} 
                    href={`/modules/${subModule.slug}`}
                    className="block"
                  >
                    <div className="p-3 rounded-lg border border-border hover:border-neural-primary/50 hover:bg-neural-primary/5 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {subModule.title}
                          </h4>
                          {subModule.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {subModule.description}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Navigation Help */}
          <Card className="cognitive-card">
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <ExternalLink className="mr-2 h-4 w-4 text-neural-primary" />
                Explore More
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/courses">
                <NeuralButton variant="neural" size="sm" className="w-full">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse All Courses
                </NeuralButton>
              </Link>
              {module.parentModule && (
                <Link href={`/modules/${module.parentModule.slug}`}>
                  <NeuralButton variant="ghost" size="sm" className="w-full">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Parent Module
                  </NeuralButton>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
