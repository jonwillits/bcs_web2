"use client";

import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NeuralButton } from '@/components/ui/neural-button'
import { withFetchRetry } from '@/lib/retry'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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
  Tag,
  SortAsc,
  SortDesc,
  X,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Copy
} from 'lucide-react'

interface Module {
  id: string
  title: string
  slug: string
  description: string | null
  status: 'draft' | 'published'
  tags: string[]
  createdAt: string
  updatedAt: string
  parentModule: {
    id: string
    title: string
  } | null
  author: {
    name: string
    email: string
  }
  _count: {
    subModules: number
    courseModules: number
  }
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface ModulesResponse {
  modules: Module[]
  availableTags: string[]
  pagination?: PaginationData
}

async function fetchModules(params: {
  search?: string
  status?: string
  tags?: string
  parentId?: string
  sortBy?: string
  sortOrder?: string
  page?: number
  limit?: number
  authorOnly?: string
  collaboratorOnly?: string
}): Promise<ModulesResponse> {
  return withFetchRetry(async () => {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        searchParams.append(key, String(value))
      }
    })

    const url = `/api/modules?${searchParams.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch modules`)
    }

    const data = await response.json()
    return {
      modules: data.modules || [],
      availableTags: data.availableTags || [],
      pagination: data.pagination
    }
  }, {
    maxAttempts: 5, // Increased from 3 to 5
    baseDelayMs: 1000
  })
}

export function ModuleLibrary() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [parentFilter, setParentFilter] = useState<'all' | 'root' | 'sub'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'authored' | 'collaborated'>('authored')
  const itemsPerPage = 50
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [moduleToClone, setModuleToClone] = useState<Module | null>(null)
  const [cloneOptions, setCloneOptions] = useState({
    newTitle: '',
    cloneMedia: true,
    cloneCollaborators: false,
  })

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

  // Memoize query params to prevent unnecessary re-fetches
  const queryParams = useMemo(() => ({
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    parentId: parentFilter === 'root' ? 'root' : parentFilter === 'sub' ? 'sub' : undefined,
    sortBy,
    sortOrder,
    page: currentPage,
    limit: itemsPerPage,
    authorOnly: activeTab === 'authored' ? 'true' : undefined,
    collaboratorOnly: activeTab === 'collaborated' ? 'true' : undefined
  }), [searchTerm, statusFilter, selectedTags, parentFilter, sortBy, sortOrder, currentPage, itemsPerPage, activeTab])

  const {
    data = { modules: [], availableTags: [] },
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['modules', queryParams],
    queryFn: () => fetchModules(queryParams),
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    retry: 5, // Increased from 2 to 5 for better reliability
  })

  const { modules, availableTags, pagination } = data

  // Helper functions for tag management
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setParentFilter('all')
    setSelectedTags([])
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  // Calculate statistics based on current filters
  const filteredRootModules = modules.filter(module => !module.parentModule)
  const filteredSubModules = modules.filter(module => module.parentModule)
  const filteredPublishedCount = modules.filter(m => m.status === 'published').length
  const filteredDraftCount = modules.filter(m => m.status === 'draft').length

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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="cognitive-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Unable to Load Modules
            </h2>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <div className="space-y-3">
              <NeuralButton 
                variant="neural" 
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </NeuralButton>
              <p className="text-xs text-muted-foreground">
                If the problem persists, please contact support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-neural flex-shrink-0">
                <Brain className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-neural-primary">Module Library</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Create and manage your educational content modules
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {isFetching && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Link href="/modules" className="flex-1 sm:flex-initial">
                <NeuralButton variant="outline" size="lg" className="w-full sm:w-auto">
                  <FileText className="mr-2 h-5 w-5" />
                  Browse Public Modules
                </NeuralButton>
              </Link>
              <Link href="/faculty/modules/create" className="flex-1 sm:flex-initial">
                <NeuralButton variant="neural" size="lg" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Module
                </NeuralButton>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-2 mb-6">
            <NeuralButton
              variant={activeTab === 'authored' ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('authored')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              My Modules
            </NeuralButton>
            <NeuralButton
              variant={activeTab === 'collaborated' ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('collaborated')}
            >
              <Users className="mr-2 h-4 w-4" />
              Shared With Me
            </NeuralButton>
          </div>

          {/* Enhanced Stats Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-neural-primary to-neural-deep">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neural-primary">{modules.length}</div>
                    <div className="text-xs text-muted-foreground">Total Modules</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-synapse-primary to-synapse-deep">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-synapse-primary">
                      {filteredRootModules.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Root Modules</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-cognition-teal to-cognition-deep">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cognition-teal">
                      {filteredSubModules.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Sub-modules</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {filteredPublishedCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Published</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
                    <Edit className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {filteredDraftCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Drafts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Main Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search modules by title, description, slug, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-neural-light/30 focus:border-neural-primary"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <NeuralButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(selectedTags.length > 0 || statusFilter !== 'all' || parentFilter !== 'all') && (
                    <Badge variant="secondary" className="ml-2">
                      {[
                        selectedTags.length,
                        statusFilter !== 'all' ? 1 : 0,
                        parentFilter !== 'all' ? 1 : 0
                      ].reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
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

            {/* Advanced Filters Panel */}
            {isFiltersOpen && (
              <Card className="cognitive-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Filters & Sorting</h3>
                  <NeuralButton
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </NeuralButton>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'published', 'draft'] as const).map((status) => (
                        <NeuralButton
                          key={status}
                          variant={statusFilter === status ? 'neural' : 'outline'}
                          size="sm"
                          onClick={() => setStatusFilter(status)}
                        >
                          {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </NeuralButton>
                      ))}
                    </div>
                  </div>

                  {/* Parent Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'root', 'sub'] as const).map((parent) => (
                        <NeuralButton
                          key={parent}
                          variant={parentFilter === parent ? 'neural' : 'outline'}
                          size="sm"
                          onClick={() => setParentFilter(parent)}
                        >
                          {parent === 'all' ? 'All' : parent === 'root' ? 'Root' : 'Sub-modules'}
                        </NeuralButton>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Sort By</label>
                    <div className="flex space-x-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="created_at">Created</SelectItem>
                          <SelectItem value="updated_at">Updated</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                      <NeuralButton
                        variant="outline"
                        size="sm"
                        onClick={toggleSortOrder}
                      >
                        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </NeuralButton>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tags {availableTags.length > 0 && `(${availableTags.length} available)`}
                    </label>
                    {availableTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {availableTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                            className="cursor-pointer hover:bg-neural-primary hover:text-white transition-colors"
                            onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags available</p>
                    )}
                  </div>
                </div>

                {/* Selected Tags Display */}
                {selectedTags.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">Selected tags:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <Badge key={tag} variant="default" className="pr-1">
                            {tag}
                            <X
                              className="h-3 w-3 ml-1 cursor-pointer hover:bg-white hover:text-black rounded-full"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Active Filters Display */}
        {(statusFilter !== 'all' || parentFilter !== 'all' || selectedTags.length > 0 || searchTerm.trim()) && (
          <div className="mb-6">
            <Card className="cognitive-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-neural-primary" />
                      <span className="text-sm font-medium">Active filters:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchTerm.trim() && (
                        <Badge variant="outline" className="text-neural-primary border-neural-primary/30">
                          Search: &quot;{searchTerm}&quot;
                        </Badge>
                      )}
                      {statusFilter !== 'all' && (
                        <Badge variant="outline" className="text-neural-primary border-neural-primary/30">
                          Status: {statusFilter}
                        </Badge>
                      )}
                      {parentFilter !== 'all' && (
                        <Badge variant="outline" className="text-neural-primary border-neural-primary/30">
                          Type: {parentFilter === 'root' ? 'Root modules' : 'Sub-modules'}
                        </Badge>
                      )}
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="default" className="pr-1">
                          {tag}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:bg-white hover:text-black rounded-full"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <NeuralButton
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </NeuralButton>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {modules.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {modules.map((module) => (
              <Card key={module.id} className="cognitive-card group cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center">
                        {module.parentModule ? (
                          <Layers className="mr-2 h-5 w-5 text-synapse-primary" />
                        ) : (
                          <BookOpen className="mr-2 h-5 w-5 text-neural-primary" />
                        )}
                        {module.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {module.parentModule && (
                          <span className="text-xs text-synapse-primary">
                            Sub-module of: {module.parentModule.title}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={module.status === 'published' ? 'default' : 'outline'}
                        className={module.status === 'published' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'text-orange-600 border-orange-200'
                        }
                      >
                        {module.status === 'published' ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <Edit className="mr-1 h-3 w-3" />
                        )}
                        {module.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {module.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {module.description}
                    </p>
                  )}

                  {/* Tags */}
                  {module.tags && module.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {module.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {module.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{module.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(module.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-4">
                      {module._count.subModules > 0 && (
                        <div className="flex items-center text-synapse-primary">
                          <Layers className="mr-1 h-3 w-3" />
                          <span className="font-medium">{module._count.subModules}</span>
                          <span className="ml-1">sub{module._count.subModules === 1 ? '' : 's'}</span>
                        </div>
                      )}
                      {module._count.courseModules > 0 && (
                        <div className="flex items-center text-neural-primary">
                          <BookOpen className="mr-1 h-3 w-3" />
                          <span className="font-medium">{module._count.courseModules}</span>
                          <span className="ml-1">course{module._count.courseModules === 1 ? '' : 's'}</span>
                        </div>
                      )}
                      {module.parentModule && (
                        <div className="flex items-center text-cognition-teal">
                          <div className="w-2 h-2 bg-cognition-teal rounded-full mr-1"></div>
                          <span className="text-xs font-medium">Sub-module</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      /{module.slug}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link href={`/faculty/modules/${module.id}`}>
                        <NeuralButton variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </NeuralButton>
                      </Link>
                      <Link href={`/faculty/modules/edit/${module.id}`}>
                        <NeuralButton variant="neural" size="sm">
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </NeuralButton>
                      </Link>
                      <NeuralButton
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleCloneClick(module, e)}
                      >
                        <Copy className="h-4 w-4" />
                      </NeuralButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="cognitive-card">
            <CardContent className="p-12 text-center">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              {searchTerm || statusFilter !== 'all' || parentFilter !== 'all' || selectedTags.length > 0 ? (
                <>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No modules found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search terms or filters.
                  </p>
                  <NeuralButton
                    variant="neural"
                    onClick={clearAllFilters}
                  >
                    Clear Filters
                  </NeuralButton>
                </>
              ) : activeTab === 'collaborated' ? (
                <>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No shared modules yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Modules that other faculty members share with you will appear here.
                    You&apos;ll have edit access to all shared modules and their submodules.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No modules yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start building your educational content by creating your first module.
                  </p>
                  <Link href="/faculty/modules/create">
                    <NeuralButton variant="neural">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Module
                    </NeuralButton>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        {modules.length > 0 && pagination && pagination.totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2">
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

                  // Smart pagination display logic
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

            {/* Page Info */}
            <div className="text-center text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, pagination.totalCount)} of {pagination.totalCount} modules
            </div>
          </div>
        )}
      </main>

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
                  Author: {moduleToClone.author.name}
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
