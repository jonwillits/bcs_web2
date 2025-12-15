"use client";

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NeuralButton } from '@/components/ui/neural-button'
import {
  Search,
  BookOpen,
  User,
  Calendar,
  Layers,
  Star,
  ArrowRight,
  Brain,
  Filter,
  Grid,
  List,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Users,
  FileText,
  Tag,
  Map
} from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  featured: boolean
  tags: string[]
  created_at?: string | null
  updated_at?: string | null
  users: {
    name: string
  }
  _count: {
    course_modules: number
  }
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface CoursesResponse {
  courses: Course[];
  pagination: PaginationData;
}

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'modules'

async function fetchPublicCourses(page: number = 1, limit: number = 20): Promise<CoursesResponse> {
  const response = await fetch(`/api/courses?page=${page}&limit=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch courses')
  }
  const data = await response.json()
  return data
}

type CourseCatalogProps = {
  initialSearch?: string;
};

export function CourseCatalog({ initialSearch = '' }: CourseCatalogProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null)
  const itemsPerPage = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['publicCourses', currentPage, itemsPerPage],
    queryFn: () => fetchPublicCourses(currentPage, itemsPerPage),
  })

  const courses = useMemo(() => data?.courses || [], [data?.courses])
  const pagination = data?.pagination

  // Extract unique tags and instructors
  const allTags = useMemo(() => {
    const tags = courses.flatMap(course => course.tags || [])
    return Array.from(new Set(tags)).sort()
  }, [courses])

  const allInstructors = useMemo(() => {
    const instructors = courses.map(course => course.users?.name).filter(Boolean)
    return Array.from(new Set(instructors)).sort()
  }, [courses])

  // Calculate stats
  const stats = useMemo(() => {
    const totalModules = courses.reduce((sum, course) => sum + (course._count?.course_modules || 0), 0)
    return {
      totalCourses: courses.length,
      totalInstructors: allInstructors.length,
      totalModules,
      featuredCount: courses.filter(c => c.featured).length
    }
  }, [courses, allInstructors])

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)

      const matchesFeatured = !showFeaturedOnly || course.featured
      const matchesTag = !selectedTag || (course.tags || []).includes(selectedTag)
      const matchesInstructor = !selectedInstructor || course.users?.name === selectedInstructor

      return matchesSearch && matchesFeatured && matchesTag && matchesInstructor
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        case 'a-z':
          return a.title.localeCompare(b.title)
        case 'z-a':
          return b.title.localeCompare(a.title)
        case 'modules':
          return (b._count?.course_modules || 0) - (a._count?.course_modules || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [courses, searchTerm, showFeaturedOnly, selectedTag, selectedInstructor, sortBy])

  const featuredCourses = courses.filter(course => course.featured)

  const handleUniversalSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-background">
        <div className="container mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="text-center space-y-4">
              <div className="h-12 bg-gradient-to-r from-neural-light/30 to-neural-primary/30 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gradient-to-r from-neural-primary/30 to-neural-light/30 rounded w-1/3 mx-auto"></div>
            </div>
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
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background flex items-center justify-center py-20">
        <Card className="cognitive-card max-w-md">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-neural-primary/10 via-background to-synapse-primary/10 py-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-neural">
                <Brain className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-neural-primary mb-6">
              Brain & Cognitive Sciences
              <span className="block text-3xl text-synapse-primary mt-2">
                Interactive Learning Platform
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore cutting-edge educational content created by faculty experts.
              Dive deep into neuroscience, psychology, and cognitive science through
              interactive modules and comprehensive courses.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses, topics, or authors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg border-neural-light/30 focus:border-neural-primary bg-background/80 backdrop-blur"
                />
              </div>
              {searchTerm.trim() && (
                <button
                  onClick={handleUniversalSearch}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-2 hover:underline"
                >
                  Or search across all content (courses, modules, people) →
                </button>
              )}

              {/* Navigation Links */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
                <Link href="/curriculum/map">
                  <NeuralButton variant="neural" size="lg" className="w-full sm:w-auto">
                    <Map className="h-5 w-5 mr-2" />
                    View Curriculum Map
                  </NeuralButton>
                </Link>
                <Link href="/paths">
                  <NeuralButton variant="outline" size="lg" className="w-full sm:w-auto">
                    <Layers className="h-5 w-5 mr-2" />
                    Browse Learning Paths
                  </NeuralButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalCourses}</div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalInstructors}</div>
                  <div className="text-sm text-gray-600">Instructors</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalModules}</div>
                  <div className="text-sm text-gray-600">Total Modules</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.featuredCount}</div>
                  <div className="text-sm text-gray-600">Featured</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-neural-light/5 to-synapse-light/5">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Star className="h-6 w-6 text-cognition-orange" />
                <h2 className="text-3xl font-bold text-neural-primary">Featured Courses</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.slice(0, 3).map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}>
                  <Card className="cognitive-card group cursor-pointer h-full transform transition-all duration-300 hover:scale-105 hover:shadow-floating">
                    <CardHeader className="relative">
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-cognition-orange text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                      <CardTitle className="flex items-start text-lg">
                        <BookOpen className="mr-2 h-5 w-5 text-neural-primary mt-1 flex-shrink-0" />
                        <span className="group-hover:text-neural-primary transition-colors">
                          {course.title}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {course.description || 'Explore this comprehensive course covering important concepts and practical applications.'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {course.users?.name || 'Unknown'}
                        </div>
                        <div className="flex items-center">
                          <Layers className="mr-1 h-3 w-3" />
                          {course._count?.course_modules || 0} modules
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {course.updated_at ? `Updated ${new Date(course.updated_at).toLocaleDateString()}` : 'Recently added'}
                        </div>

                        <NeuralButton variant="neural" size="sm" className="group-hover:bg-neural-deep">
                          Start Learning
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </NeuralButton>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Courses */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-neural-primary mb-2">All Courses</h2>
              <p className="text-muted-foreground">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">A-Z</option>
                <option value="z-a">Z-A</option>
                <option value="modules">Most Modules</option>
              </select>

              {/* Instructor Filter */}
              {allInstructors.length > 0 && (
                <select
                  value={selectedInstructor || ''}
                  onChange={(e) => setSelectedInstructor(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Instructors</option>
                  {allInstructors.map((instructor) => (
                    <option key={instructor} value={instructor}>
                      {instructor}
                    </option>
                  ))}
                </select>
              )}

              <NeuralButton
                variant={showFeaturedOnly ? 'neural' : 'ghost'}
                size="sm"
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFeaturedOnly ? 'Show All' : 'Featured Only'}
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

          {/* Tag Filter Pills */}
          {allTags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {filteredCourses.length > 0 ? (
            <>
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredCourses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.slug}`}>
                    <Card className="cognitive-card group cursor-pointer h-full hover:shadow-lg transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="flex items-start text-lg">
                            <BookOpen className="mr-2 h-5 w-5 text-neural-primary mt-1 flex-shrink-0" />
                            <span className="group-hover:text-neural-primary transition-colors">
                              {course.title}
                            </span>
                          </CardTitle>
                          {course.featured && (
                            <Badge variant="secondary" className="ml-2">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-2 line-clamp-3">
                          {course.description || 'Explore this comprehensive course covering important concepts and practical applications in brain and cognitive sciences.'}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            {course.users?.name || 'Unknown'}
                          </div>
                          <div className="flex items-center">
                            <Layers className="mr-1 h-3 w-3" />
                            {course._count?.course_modules || 0} modules
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : 'Recently added'}
                          </div>
                        </div>

                        {course.tags && course.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {course.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <NeuralButton variant="outline" size="sm" className="w-full group-hover:bg-neural-primary group-hover:text-white">
                          Explore Course
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </NeuralButton>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <NeuralButton
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </NeuralButton>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                      let pageNum: number;

                      if (pagination.totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 3) {
                        pageNum = pagination.totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }

                      return (
                        <NeuralButton
                          key={pageNum}
                          variant={currentPage === pageNum ? 'neural' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </NeuralButton>
                      );
                    })}
                  </div>

                  <NeuralButton
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </NeuralButton>
                </div>
              )}

              {/* Page Info */}
              {pagination && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, pagination.totalCount)} of {pagination.totalCount} courses
                </div>
              )}
            </>
          ) : (
            <Card className="cognitive-card">
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No courses found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search terms.
                </p>
                <NeuralButton
                  variant="neural"
                  onClick={() => {
                    setSearchTerm('')
                    setShowFeaturedOnly(false)
                    setSelectedTag(null)
                    setSelectedInstructor(null)
                  }}
                >
                  Clear All Filters
                </NeuralButton>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
