"use client";

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import mediumZoom from 'medium-zoom'
import 'medium-zoom/dist/style.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NeuralButton } from '@/components/ui/neural-button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Loading } from '@/components/ui/loading'
import { ModuleResources } from '@/components/public/module-resources'
import { StartCourseButton } from '@/components/student/StartCourseButton'
import { ModuleTreeSidebar } from '@/components/modules/module-tree-sidebar'
import { InstructorsSection } from '@/components/public/instructors-section'
import { ReadingProgressBar } from '@/components/public/reading-progress-bar'
import { CourseNotesSection } from '@/components/public/course-notes-section'
import { MarkCompleteButton } from '@/components/progress/MarkCompleteButton'
import type { ModuleTreeNode } from '@/lib/modules/tree-utils'
import {
  ArrowLeft,
  BookOpen,
  User,
  Calendar,
  Layers,
  Clock,
  CheckCircle,
  Brain,
  Play,
  List,
  ChevronRight,
  ChevronLeft,
  Star,
  Share2,
  Bookmark,
  Search,
  Home,
  Menu,
  X,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Eye,
  FileText,
  Navigation
} from 'lucide-react'

interface MediaFile {
  id: string
  name: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
}

interface Module {
  id: string
  title: string
  slug: string
  description: string | null
  content: string
  status: 'draft' | 'published'
  parentModuleId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  resources?: MediaFile[]
}

interface CourseModule {
  sortOrder: number
  customTitle?: string | null
  customNotes?: string | null
  customContext?: string | null
  customObjectives?: string | null
  module: Module
}

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  featured: boolean
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
    speciality?: string | null
    university?: string | null
    about?: string | null
    google_scholar_url?: string | null
    personal_website_url?: string | null
    linkedin_url?: string | null
    twitter_url?: string | null
    github_url?: string | null
  }
  collaborators?: Array<{
    id: string
    name: string
    email: string
    avatar_url?: string | null
    speciality?: string | null
    university?: string | null
    about?: string | null
    google_scholar_url?: string | null
    personal_website_url?: string | null
    linkedin_url?: string | null
    twitter_url?: string | null
    github_url?: string | null
  }>
  courseModules: CourseModule[]
  moduleTree?: ModuleTreeNode[] // Optional hierarchical tree structure
  moduleNumbering?: Record<string, string> // Optional module numbering (e.g., "1.2.3")
  _count: {
    courseModules: number
  }
}

interface EnhancedCourseViewerProps {
  course: Course
  initialModule?: string
  initialSearch?: string
  session?: any
  isStarted?: boolean
}

export function EnhancedCourseViewer({ course, initialModule, initialSearch = '', session, isStarted = false }: EnhancedCourseViewerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentRef = useRef<HTMLDivElement>(null)

  // State management
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(() => {
    if (initialModule) {
      const moduleExists = course.courseModules.find(cm => cm.module.slug === initialModule)
      return moduleExists ? moduleExists.module.id : null
    }
    // Return null to show course overview when no module specified
    return null
  })
  
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [moduleProgress, setModuleProgress] = useState<Record<string, 'not_started' | 'completed'>>({})
  
  // Find current module and navigation
  const selectedCourseModule = course.courseModules.find(
    cm => cm.module.id === selectedModuleId
  )
  const selectedModule = selectedCourseModule?.module

  const currentModuleIndex = course.courseModules.findIndex(
    cm => cm.module.id === selectedModuleId
  )

  const nextModuleData = course.courseModules[currentModuleIndex + 1]?.module
  const prevModuleData = course.courseModules[currentModuleIndex - 1]?.module

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { label: 'Home', href: '/' },
      { label: 'Courses', href: '/courses' },
      { label: course.title, href: `/courses/${course.slug}` },
    ]
    
    if (selectedModule) {
      crumbs.push({ 
        label: selectedModule.title, 
        href: `/courses/${course.slug}?module=${selectedModule.slug}` 
      })
    }
    
    return crumbs
  }, [course, selectedModule])

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return course.courseModules
    
    const query = searchQuery.toLowerCase()
    return course.courseModules.filter(cm => 
      cm.module.title.toLowerCase().includes(query) ||
      cm.module.description?.toLowerCase().includes(query) ||
      cm.module.content.toLowerCase().includes(query)
    )
  }, [course.courseModules, searchQuery])

  // Update URL when module changes
  useEffect(() => {
    if (selectedModule) {
      const params = new URLSearchParams(searchParams)
      params.set('module', selectedModule.slug)
      if (searchQuery) params.set('search', searchQuery)

      // Update URL without triggering navigation
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, '', newUrl)
    }
  }, [selectedModule, searchQuery, searchParams])

  // Fetch progress data when user is enrolled
  useEffect(() => {
    if (session?.user && isStarted) {
      fetch(`/api/progress/course/${course.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.modules) {
            const progressMap: Record<string, 'not_started' | 'completed'> = {}
            data.modules.forEach((m: any) => {
              progressMap[m.id] = m.progress.status
            })
            setModuleProgress(progressMap)
          }
        })
        .catch(err => console.error('Error fetching progress:', err))
    }
  }, [course.id, session, isStarted])

  // Handle module selection
  const handleModuleSelect = (module: Module) => {
    setSelectedModuleId(module.id)
    setShowMobileSidebar(false)
    
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Share functionality
  const handleShare = async () => {
    const shareUrl = selectedModule 
      ? `${window.location.origin}/courses/${course.slug}?module=${selectedModule.slug}`
      : `${window.location.origin}/courses/${course.slug}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return
      
      switch (e.key) {
        case 'ArrowLeft':
          if (prevModuleData) {
            e.preventDefault()
            handleModuleSelect(prevModuleData)
          }
          break
        case 'ArrowRight':
          if (nextModuleData) {
            e.preventDefault()
            handleModuleSelect(nextModuleData)
          }
          break
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            document.getElementById('course-search')?.focus()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [prevModuleData, nextModuleData])

  // Initialize medium-zoom on module content images
  useEffect(() => {
    if (contentRef.current && selectedModule) {
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
  }, [selectedModule])

  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Reading Progress Bar - Only show when viewing a module */}
      {selectedModule && <ReadingProgressBar />}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* Breadcrumbs - Hidden on mobile, visible on sm+ */}
          <nav aria-label="Breadcrumb" className="hidden sm:block mb-2 sm:mb-4 overflow-x-auto">
            <ol className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center flex-shrink-0">
                  {index > 0 && <ChevronRight className="mx-1 h-3 w-3 flex-shrink-0" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-foreground font-medium truncate max-w-32 sm:max-w-48 md:max-w-none">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="hover:text-neural-primary transition-colors truncate max-w-20 sm:max-w-24 md:max-w-none"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
              {/* Mobile Menu Toggle */}
              <NeuralButton 
                variant="ghost" 
                size="sm"
                className="lg:hidden"
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                aria-label="Toggle course navigation"
              >
                {showMobileSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </NeuralButton>

              {/* Back Button */}
              <Link href="/courses" className="hidden sm:block">
                <NeuralButton variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Catalog
                </NeuralButton>
              </Link>
              
              {/* Course Info */}
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-neural flex-shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-neural-primary truncate">
                    {course.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    by {course.author.name} • {course.courseModules.length} modules
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {course.featured && (
                <Badge className="bg-cognition-orange text-white hidden sm:inline-flex">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              <NeuralButton 
                variant="ghost" 
                size="sm" 
                onClick={handleShare}
                aria-label={copiedUrl ? "URL Copied" : "Share course"}
              >
                {copiedUrl ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </NeuralButton>
              <NeuralButton 
                variant="ghost" 
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </NeuralButton>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Course Overview Section */}
        {!selectedModule && (
          <div className="mb-8 space-y-6">
            {/* Course Description */}
            <Card className="cognitive-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-neural-primary" />
                  Course Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  {course.description || 'This course provides comprehensive coverage of key concepts through interactive modules and hands-on learning.'}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>{course.courseModules.length} Modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {course.featured && (
                    <div className="flex items-center gap-2 text-cognition-orange">
                      <Star className="h-4 w-4" />
                      <span>Featured Course</span>
                    </div>
                  )}
                </div>

                {/* Start Course Button - Available to all authenticated users (Week 3: Inclusive Enrollment) */}
                {session?.user && (
                  <div className="pt-4">
                    <StartCourseButton
                      courseId={course.id}
                      courseName={course.title}
                      isStarted={isStarted}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructors Section */}
            <InstructorsSection author={course.author} collaborators={course.collaborators} />
          </div>
        )}

        <div className={`grid grid-cols-1 ${isFullscreen ? 'lg:grid-cols-1' : 'lg:grid-cols-[320px_1fr]'} gap-4 sm:gap-8`}>
          {/* Course Navigation Sidebar - Increased width for better readability */}
          <div className={`${isFullscreen ? 'hidden' : ''} ${showMobileSidebar ? 'fixed inset-0 z-30 bg-background lg:relative lg:inset-auto lg:bg-transparent' : 'hidden lg:block'}`}>
            {showMobileSidebar && (
              <div className="lg:hidden absolute top-4 right-4 z-40">
                <NeuralButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowMobileSidebar(false)}
                >
                  <X className="h-4 w-4" />
                </NeuralButton>
              </div>
            )}
            
            <div className={`${showMobileSidebar ? 'p-4 pt-16' : ''} lg:p-0`}>
              {/* Conditionally render tree sidebar or flat list */}
              {course.moduleTree && course.moduleTree.length > 0 ? (
                /* Hierarchical Tree Navigation */
                <div className="cognitive-card sticky top-24 overflow-hidden rounded-lg border">
                  <ModuleTreeSidebar
                    tree={course.moduleTree}
                    currentModuleId={selectedModuleId || undefined}
                    baseUrl={`/courses/${course.slug}`}
                    showSearch={true}
                  />
                </div>
              ) : (
                /* Fallback: Flat Module List (Backward Compatibility) */
                <Card className="cognitive-card sticky top-24">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <List className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-neural-primary" />
                      Course Modules
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {course.description || 'Interactive learning modules covering key concepts and applications.'}
                    </CardDescription>

                    {/* Search within course */}
                    <div className="relative mt-3">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="course-search"
                        placeholder="Search modules..."
                        className="pl-10 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto pt-0">
                    {filteredModules.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No modules found matching &quot;{searchQuery}&quot;
                      </p>
                    ) : (
                      filteredModules.map((courseModule, index) => {
                        const currentModule = courseModule.module
                        const isSelected = selectedModuleId === currentModule.id
                        const isCompleted = false // TODO: Add completion tracking
                        const originalIndex = course.courseModules.findIndex(
                          (cm) => cm.module.id === currentModule.id
                        )

                        return (
                          <button
                            key={currentModule.id}
                            onClick={() => handleModuleSelect(currentModule)}
                            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neural-primary focus:ring-offset-2 ${
                              isSelected
                                ? 'border-neural-primary bg-neural-primary/10 shadow-sm'
                                : 'border-border hover:border-neural-light hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                  isCompleted
                                    ? 'bg-green-500 text-white'
                                    : isSelected
                                    ? 'bg-neural-primary text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <span>{originalIndex + 1}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-medium text-sm ${
                                    isSelected ? 'text-neural-primary' : 'text-foreground'
                                  }`}
                                >
                                  {currentModule.title}
                                </p>
                                {currentModule.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {currentModule.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <ChevronRight className="h-4 w-4 text-neural-primary flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Module Content - Uses full remaining width */}
          <div className={`${isFullscreen ? 'max-w-5xl mx-auto' : 'max-w-full'}`}>
            {selectedModule ? (
              <div className="space-y-6">
                {/* Module Header */}
                <Card className="cognitive-card">
                  <CardHeader>
                    <div className="flex items-start justify-between flex-col sm:flex-row space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        <CardTitle className="flex items-center text-xl sm:text-2xl">
                          <Brain className="mr-3 h-5 w-5 sm:h-6 sm:w-6 text-neural-primary flex-shrink-0" />
                          <span className="break-words">{selectedModule.title}</span>
                        </CardTitle>
                        {selectedModule.description && (
                          <CardDescription className="mt-2 text-sm sm:text-base">
                            {selectedModule.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs sm:text-sm">
                          Module {currentModuleIndex + 1} of {course.courseModules.length}
                        </Badge>
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          <Eye className="mr-1 h-3 w-3" />
                          {Math.ceil(selectedModule.content.split(' ').length / 200)} min read
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                        Updated {new Date(selectedModule.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                        {course.author.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course-Specific Notes */}
                {selectedCourseModule && (
                  <CourseNotesSection
                    customTitle={selectedCourseModule.customTitle}
                    customNotes={selectedCourseModule.customNotes}
                    customContext={selectedCourseModule.customContext}
                    customObjectives={selectedCourseModule.customObjectives}
                  />
                )}

                {/* Module Content */}
                <Card className="cognitive-card">
                  <CardContent className={`${isFullscreen ? 'p-12' : 'p-6 sm:p-8 lg:p-12'}`}>
                    <article
                      ref={contentRef}
                      className="neural-content reading-interface prose prose-sm sm:prose-base lg:prose-lg prose-neural max-w-none mx-auto"
                      style={{ maxWidth: '90ch' }}
                      dangerouslySetInnerHTML={{ __html: selectedModule.content }}
                    />
                  </CardContent>
                </Card>

                {/* Mark Complete Button (shown only if user is enrolled) */}
                {session?.user && isStarted && selectedModule && (
                  <div className="flex justify-end">
                    <MarkCompleteButton
                      moduleId={selectedModule.id}
                      courseId={course.id}
                      initialStatus={moduleProgress[selectedModule.id] || 'not_started'}
                      onComplete={() => {
                        // Refetch progress after marking complete
                        fetch(`/api/progress/course/${course.id}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.modules) {
                              const progressMap: Record<string, 'not_started' | 'completed'> = {}
                              data.modules.forEach((m: any) => {
                                progressMap[m.id] = m.progress.status
                              })
                              setModuleProgress(progressMap)
                            }
                          })
                          .catch(err => console.error('Error fetching progress:', err))
                      }}
                    />
                  </div>
                )}

                {/* Next Module Navigation */}
                {(() => {
                  const currentIndex = course.courseModules.findIndex(cm => cm.module.id === selectedModuleId)
                  const nextModule = currentIndex >= 0 && currentIndex < course.courseModules.length - 1
                    ? course.courseModules[currentIndex + 1].module
                    : null

                  return nextModule ? (
                    <div className="flex justify-end">
                      <NeuralButton
                        variant="neural"
                        size="lg"
                        onClick={() => handleModuleSelect(nextModule)}
                        className="group"
                      >
                        <span>Next: {nextModule.title}</span>
                        <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </NeuralButton>
                    </div>
                  ) : null
                })()}

                {/* Module Resources */}
                {selectedModule.resources && selectedModule.resources.length > 0 && (
                  <ModuleResources resources={selectedModule.resources} />
                )}

                {/* Course Modules Overview */}
                <Card className="cognitive-card">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <List className="mr-3 h-5 w-5 text-neural-primary" />
                      All Course Modules
                      <Badge variant="outline" className="ml-3">
                        {course.courseModules.length} modules
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Explore all modules in this course. Click on any module to jump directly to its content.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {course.courseModules.map((courseModule, index) => {
                        const currentModule = courseModule.module
                        const isCurrentModule = selectedModuleId === currentModule.id
                        
                        return (
                          <button
                            key={currentModule.id}
                            onClick={() => handleModuleSelect(currentModule)}
                            className={`group relative p-4 rounded-lg border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neural-primary focus:ring-offset-2 ${
                              isCurrentModule 
                                ? 'border-neural-primary bg-neural-primary/10 shadow-md' 
                                : 'border-border hover:border-neural-light hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                                isCurrentModule 
                                  ? 'bg-neural-primary text-white' 
                                  : 'bg-muted text-muted-foreground group-hover:bg-neural-primary group-hover:text-white'
                              } transition-colors`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold text-sm ${
                                  isCurrentModule ? 'text-neural-primary' : 'text-foreground group-hover:text-neural-primary'
                                } transition-colors`}>
                                  {currentModule.title}
                                </h3>
                                {currentModule.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {currentModule.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.ceil(currentModule.content.split(' ').length / 200)} min read
                                  </Badge>
                                  {isCurrentModule && (
                                    <Badge className="bg-neural-primary text-white text-xs">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Click to navigate indicator */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight className="h-4 w-4 text-neural-primary" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Quick navigation hint */}
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground text-center">
                        💡 Tip: Use keyboard arrows (← →) to navigate between modules, or click any module above to jump directly to it
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation Footer */}
                <Card className="cognitive-card">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                      <div className="w-full sm:w-auto">
                        {prevModuleData ? (
                          <NeuralButton 
                            variant="outline" 
                            onClick={() => handleModuleSelect(prevModuleData)}
                            className="w-full sm:w-auto"
                          >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            <span className="truncate max-w-48">
                              Previous: {prevModuleData.title}
                            </span>
                          </NeuralButton>
                        ) : (
                          <div className="sm:w-32" /> // Spacer for alignment
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {currentModuleIndex + 1} of {course.courseModules.length} modules
                        </p>
                        <div className="flex space-x-1 mt-2">
                          {course.courseModules.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-1 rounded-full ${
                                index <= currentModuleIndex 
                                  ? 'bg-neural-primary' 
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto">
                        {nextModuleData ? (
                          <NeuralButton 
                            variant="neural" 
                            onClick={() => handleModuleSelect(nextModuleData)}
                            className="w-full sm:w-auto"
                          >
                            <span className="truncate max-w-48">
                              Next: {nextModuleData.title}
                            </span>
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </NeuralButton>
                        ) : (
                          <NeuralButton variant="synaptic" className="w-full sm:w-auto">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Course Complete!
                          </NeuralButton>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="cognitive-card">
                <CardContent className="p-8 sm:p-12 text-center">
                  <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                    Welcome to {course.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                    Select a module from the sidebar to begin your learning journey.
                  </p>
                  {course.courseModules.length > 0 && (
                    <NeuralButton 
                      variant="neural"
                      onClick={() => handleModuleSelect(course.courseModules[0].module)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start with Module 1
                    </NeuralButton>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
    </div>
  )
}
