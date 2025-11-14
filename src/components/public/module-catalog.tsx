"use client";

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NeuralButton } from '@/components/ui/neural-button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
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
  FileText,
  Play,
  Users,
  FolderTree,
  Copy,
  X,
  AlertCircle
} from 'lucide-react'

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'submodules'

interface Module {
  id: string
  title: string
  slug: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  tags: string[]
  users: {
    name: string
  }
  parentModule: {
    title: string
    slug: string
  } | null
  _count: {
    subModules: number
  }
}

async function fetchPublicModules(): Promise<Module[]> {
  const response = await fetch('/api/modules?status=published')
  if (!response.ok) {
    throw new Error('Failed to fetch modules')
  }
  const data = await response.json()
  return data.modules
}

type ModuleCatalogProps = {
  initialSearch?: string;
  session?: any;
};

export function ModuleCatalog({ initialSearch = '', session }: ModuleCatalogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [showRootOnly, setShowRootOnly] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [moduleToClone, setModuleToClone] = useState<Module | null>(null)
  const [cloneOptions, setCloneOptions] = useState({
    newTitle: '',
    cloneMedia: true,
    cloneCollaborators: false,
  })

  const isFaculty = session?.user?.role === 'faculty'

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

  const cloneMutation = useMutation({
    mutationFn: async () => {
      if (!moduleToClone) throw new Error('No module selected')

      const response = await fetch(`/api/modules/${moduleToClone.id}/clone`, {
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
      setModuleToClone(null)
      setCloneOptions({ newTitle: '', cloneMedia: true, cloneCollaborators: false })
      // Navigate to the cloned module
      router.push(`/faculty/modules/${data.module.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clone module')
    },
  })

  const handleCloneClick = (module: Module, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setModuleToClone(module)
    setCloneOptions({
      newTitle: `${module.title} (Copy)`,
      cloneMedia: true,
      cloneCollaborators: false,
    })
    setShowCloneDialog(true)
  }

  const { data: modules = [], isLoading, error } = useQuery({
    queryKey: ['publicModules'],
    queryFn: fetchPublicModules,
  })

  // Get all unique tags and authors
  const allTags = useMemo(() => {
    const tags = modules.flatMap(module => module.tags || [])
    return Array.from(new Set(tags)).sort()
  }, [modules])

  const allAuthors = useMemo(() => {
    const authors = modules.map(module => module.users?.name).filter(Boolean)
    return Array.from(new Set(authors)).sort()
  }, [modules])

  // Calculate stats
  const stats = useMemo(() => {
    const rootModules = modules.filter(m => !m.parentModule)
    const modulesWithSubs = modules.filter(m => m._count.subModules > 0)
    return {
      totalModules: modules.length,
      totalAuthors: allAuthors.length,
      rootModules: rootModules.length,
      modulesWithSubmodules: modulesWithSubs.length
    }
  }, [modules, allAuthors])

  // Filter and sort modules
  const filteredModules = useMemo(() => {
    let filtered = modules.filter(module => {
      const matchesSearch =
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (module.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (module.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesRoot = !showRootOnly || !module.parentModule
      const matchesTag = !selectedTag || (module.tags || []).includes(selectedTag)
      const matchesAuthor = !selectedAuthor || module.users?.name === selectedAuthor

      return matchesSearch && matchesRoot && matchesTag && matchesAuthor
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'a-z':
          return a.title.localeCompare(b.title)
        case 'z-a':
          return b.title.localeCompare(a.title)
        case 'submodules':
          return b._count.subModules - a._count.subModules
        default:
          return 0
      }
    })

    return filtered
  }, [modules, searchTerm, showRootOnly, selectedTag, selectedAuthor, sortBy])

  const rootModules = modules.filter(module => !module.parentModule)

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
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Unable to Load Modules
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
                <FileText className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-neural-primary mb-6">
              Learning Modules
              <span className="block text-3xl text-synapse-primary mt-2">
                Interactive Educational Content
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore individual learning modules created by faculty experts. 
              Each module focuses on specific topics with interactive content, 
              assessments, and comprehensive materials.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search modules, topics, tags, or authors..."
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
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalModules}</div>
                  <div className="text-sm text-gray-600">Total Modules</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalAuthors}</div>
                  <div className="text-sm text-gray-600">Authors</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.rootModules}</div>
                  <div className="text-sm text-gray-600">Root Modules</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <FolderTree className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.modulesWithSubmodules}</div>
                  <div className="text-sm text-gray-600">With Submodules</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Root Modules */}
      {rootModules.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-neural-light/5 to-synapse-light/5">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Star className="h-6 w-6 text-cognition-orange" />
                <h2 className="text-3xl font-bold text-neural-primary">Root Modules</h2>
                <p className="text-muted-foreground">Foundational learning modules</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rootModules.slice(0, 6).map((module) => (
                <Link key={module.id} href={`/modules/${module.slug}`}>
                  <Card className="cognitive-card group cursor-pointer h-full transform transition-all duration-300 hover:scale-105 hover:shadow-floating">
                    <CardHeader className="relative">
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-neural-primary text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Root
                        </Badge>
                      </div>
                      <CardTitle className="flex items-start text-lg">
                        <FileText className="mr-2 h-5 w-5 text-neural-primary mt-1 flex-shrink-0" />
                        <span className="group-hover:text-neural-primary transition-colors">
                          {module.title}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {module.description || 'Explore this comprehensive module covering important concepts and practical applications.'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(module.tags || []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(module.tags || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(module.tags || []).length - 3} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {module.users?.name || 'Unknown'}
                        </div>
                        <div className="flex items-center">
                          <Layers className="mr-1 h-3 w-3" />
                          {module._count.subModules} sub-modules
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground mb-4">
                        <Clock className="mr-1 h-3 w-3" />
                        Updated {new Date(module.updatedAt).toLocaleDateString()}
                      </div>

                      {isFaculty ? (
                        <div className="flex gap-2">
                          <NeuralButton variant="neural" size="sm" className="flex-1 group-hover:bg-neural-deep">
                            View
                            <Play className="ml-1 h-3 w-3" />
                          </NeuralButton>
                          <NeuralButton
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleCloneClick(module, e)}
                            className="flex-1"
                          >
                            <Copy className="mr-2 h-3 w-3" />
                            Clone
                          </NeuralButton>
                        </div>
                      ) : (
                        <NeuralButton variant="neural" size="sm" className="w-full group-hover:bg-neural-deep">
                          Start Learning
                          <Play className="ml-1 h-3 w-3" />
                        </NeuralButton>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Modules */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-neural-primary mb-2">All Modules</h2>
              <p className="text-muted-foreground">
                {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''} available
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
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
                <option value="submodules">Most Submodules</option>
              </select>

              {/* Author Filter */}
              {allAuthors.length > 0 && (
                <select
                  value={selectedAuthor || ''}
                  onChange={(e) => setSelectedAuthor(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Authors</option>
                  {allAuthors.map((author) => (
                    <option key={author} value={author}>
                      {author}
                    </option>
                  ))}
                </select>
              )}

              <NeuralButton
                variant={showRootOnly ? 'neural' : 'ghost'}
                size="sm"
                onClick={() => setShowRootOnly(!showRootOnly)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showRootOnly ? 'Show All' : 'Root Only'}
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
                    ? 'bg-purple-600 text-white'
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
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {filteredModules.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredModules.map((module) => (
                <Link key={module.id} href={`/modules/${module.slug}`}>
                  <Card className="cognitive-card group cursor-pointer h-full hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-start text-lg">
                          <FileText className="mr-2 h-5 w-5 text-neural-primary mt-1 flex-shrink-0" />
                          <span className="group-hover:text-neural-primary transition-colors">
                            {module.title}
                          </span>
                        </CardTitle>
                        <div className="flex flex-col space-y-1 ml-2">
                          {!module.parentModule && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Root
                            </Badge>
                          )}
                          {module.status === 'published' && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {module.parentModule && (
                        <div className="text-sm text-muted-foreground">
                          Sub-module of: <Link href={`/modules/${module.parentModule.slug}`} className="text-neural-primary hover:underline">{module.parentModule.title}</Link>
                        </div>
                      )}
                      
                      <CardDescription className="mt-2 line-clamp-3">
                        {module.description || 'Explore this comprehensive module covering important concepts and practical applications in brain and cognitive sciences.'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Tags */}
                      {(module.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {(module.tags || []).slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(module.tags || []).length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{(module.tags || []).length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {module.users?.name || 'Unknown'}
                        </div>
                        <div className="flex items-center">
                          <Layers className="mr-1 h-3 w-3" />
                          {module._count.subModules} sub-modules
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(module.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {isFaculty ? (
                        <div className="flex gap-2">
                          <NeuralButton variant="outline" size="sm" className="flex-1 group-hover:bg-neural-primary group-hover:text-white">
                            View
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </NeuralButton>
                          <NeuralButton
                            variant="neural"
                            size="sm"
                            onClick={(e) => handleCloneClick(module, e)}
                            className="flex-1"
                          >
                            <Copy className="mr-2 h-3 w-3" />
                            Clone
                          </NeuralButton>
                        </div>
                      ) : (
                        <NeuralButton variant="outline" size="sm" className="w-full group-hover:bg-neural-primary group-hover:text-white">
                          Explore Module
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </NeuralButton>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="cognitive-card">
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No modules found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search terms.
                </p>
                <NeuralButton
                  variant="neural"
                  onClick={() => {
                    setSearchTerm('')
                    setShowRootOnly(false)
                    setSelectedTag(null)
                    setSelectedAuthor(null)
                  }}
                >
                  Clear All Filters
                </NeuralButton>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Clone Module Dialog */}
      {showCloneDialog && moduleToClone && (
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
                  Original Module: {moduleToClone.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Author: {moduleToClone.users?.name || 'Unknown'}
                </p>
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
                  A unique slug will be generated automatically (e.g., &quot;{moduleToClone.slug}-copy&quot;)
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
