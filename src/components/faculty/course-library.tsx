"use client";

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { NeuralButton } from '@/components/ui/neural-button'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  BookOpen, 
  FileText, 
  Clock, 
  Eye,
  Edit,
  Brain,
  Layers,
  Calendar,
  Users,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Star,
  Copy,
  Trash2
} from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  status: 'draft' | 'published'
  featured: boolean
  createdAt: string
  updatedAt: string
  author: {
    name: string
    email: string
  }
  _count: {
    courseModules: number
  }
}

async function fetchCourses(type: 'authored' | 'collaborated'): Promise<Course[]> {
  const queryParam = type === 'authored' ? 'authorOnly=true' : 'collaboratorOnly=true'
  const response = await fetch(`/api/courses?${queryParam}`)
  if (!response.ok) {
    throw new Error('Failed to fetch courses')
  }
  const data = await response.json()
  return data.courses
}

export function CourseLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [activeTab, setActiveTab] = useState<'authored' | 'collaborated'>('authored')

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses', activeTab],
    queryFn: () => fetchCourses(activeTab),
  })

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.slug.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter
    
    return matchesSearch && matchesStatus
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="cognitive-card">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gradient-to-r from-neural-light/30 to-neural-primary/30 rounded w-3/4"></div>
                    <div className="h-4 bg-gradient-to-r from-neural-primary/30 to-neural-light/30 rounded w-1/2"></div>
                    <div className="h-20 bg-gradient-to-br from-neural-light/20 to-cognition-teal/20 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="cognitive-card max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Unable to Load Courses
            </h2>
            <p className="text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-neural">
                <BookOpen className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neural-primary">Course Library</h1>
                <p className="text-muted-foreground">
                  Create and manage your educational courses
                </p>
              </div>
            </div>
            
            <Link href="/faculty/courses/create">
              <NeuralButton variant="neural" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Course
              </NeuralButton>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-neural-primary" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                    <p className="text-2xl font-bold text-foreground">{courses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Published</p>
                    <p className="text-2xl font-bold text-foreground">
                      {courses.filter(c => c.status === 'published').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Edit className="h-8 w-8 text-orange-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                    <p className="text-2xl font-bold text-foreground">
                      {courses.filter(c => c.status === 'draft').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-cognition-orange" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Featured</p>
                    <p className="text-2xl font-bold text-foreground">
                      {courses.filter(c => c.featured).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-2 mb-6">
            <NeuralButton
              variant={activeTab === 'authored' ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('authored')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              My Courses
            </NeuralButton>
            <NeuralButton
              variant={activeTab === 'collaborated' ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('collaborated')}
            >
              <Users className="mr-2 h-4 w-4" />
              Shared with Me
            </NeuralButton>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses by title, description, or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-neural-light/30 focus:border-neural-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <NeuralButton
                variant={statusFilter === 'all' ? 'neural' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </NeuralButton>
              <NeuralButton
                variant={statusFilter === 'published' ? 'neural' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('published')}
              >
                Published
              </NeuralButton>
              <NeuralButton
                variant={statusFilter === 'draft' ? 'neural' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('draft')}
              >
                Drafts
              </NeuralButton>
              
              <div className="flex border border-border rounded-lg">
                <NeuralButton
                  variant={viewMode === 'grid' ? 'neural' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </NeuralButton>
                <NeuralButton
                  variant={viewMode === 'list' ? 'neural' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none border-l"
                >
                  <List className="h-4 w-4" />
                </NeuralButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {filteredCourses.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredCourses.map((course) => (
              <Card key={course.id} className="cognitive-card group cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center">
                        <BookOpen className="mr-2 h-5 w-5 text-neural-primary" />
                        {course.title}
                        {course.featured && (
                          <Star className="ml-2 h-4 w-4 text-cognition-orange fill-current" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {course.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={course.status === 'published' ? 'default' : 'outline'}
                        className={course.status === 'published' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'text-orange-600 border-orange-200'
                        }
                      >
                        {course.status === 'published' ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <Edit className="mr-1 h-3 w-3" />
                        )}
                        {course.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(course.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Layers className="mr-1 h-3 w-3" />
                        {course._count.courseModules} modules
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      /{course.slug}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link href={`/courses/${course.slug}`}>
                        <NeuralButton variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </NeuralButton>
                      </Link>
                      <Link href={`/faculty/courses/edit/${course.id}`}>
                        <NeuralButton
                          variant="neural"
                          size="sm"
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </NeuralButton>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="cognitive-card">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              {searchTerm || statusFilter !== 'all' ? (
                <>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No courses found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search terms or filters.
                  </p>
                  <NeuralButton 
                    variant="neural" 
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                    }}
                  >
                    Clear Filters
                  </NeuralButton>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No courses yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start building your educational content by creating your first course.
                  </p>
                  <Link href="/faculty/courses/create">
                    <NeuralButton variant="neural">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Course
                    </NeuralButton>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
