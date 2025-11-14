"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { NeuralButton } from "@/components/ui/neural-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Brain,
  Clock,
  Eye,
  Edit,
  RefreshCw,
  Loader2,
  Layers
} from "lucide-react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

interface DashboardStats {
  modules: number;
  courses: number;
  students: number;
  views: number;
}

interface RecentActivity {
  id: string;
  title: string;
  type: 'module' | 'course';
  status: string;
  updatedAt: string;
  moduleCount?: number;
  author: {
    name: string;
    email: string;
  };
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}

async function fetchDashboardStats(): Promise<DashboardData> {
  const response = await fetch('/api/dashboard/stats')
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Dashboard API error:', response.status, errorText)
    throw new Error(`Failed to fetch dashboard statistics (${response.status})`)
  }
  return response.json()
}

interface FacultyDashboardProps {
  user: User;
}

export function FacultyDashboard({ user }: FacultyDashboardProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      console.log(`Dashboard stats retry attempt ${failureCount}:`, error)
      return failureCount < 5 // Increased from 3 to 5
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neural">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neural-primary">
                  Faculty Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.name || user.email}
                </p>
              </div>
            </div>
            <NeuralButton variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </NeuralButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="cognitive-card group hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-neural-primary/5 to-neural-primary/10">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-neural-primary/10 group-hover:bg-neural-primary/20 transition-colors">
                  <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-neural-primary" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Modules</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : error ? (
                      <span className="text-red-500">--</span>
                    ) : (
                      dashboardData?.stats.modules || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cognitive-card group hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-synapse-primary/5 to-synapse-primary/10">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-synapse-primary/10 group-hover:bg-synapse-primary/20 transition-colors">
                  <BookOpen className="h-6 sm:h-8 w-6 sm:w-8 text-synapse-primary" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Courses</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : error ? (
                      <span className="text-red-500">--</span>
                    ) : (
                      dashboardData?.stats.courses || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cognitive-card group hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-cognition-teal/5 to-cognition-teal/10">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-cognition-teal/10 group-hover:bg-cognition-teal/20 transition-colors">
                  <Users className="h-6 sm:h-8 w-6 sm:w-8 text-cognition-teal" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Students</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : error ? (
                      <span className="text-red-500">--</span>
                    ) : (
                      dashboardData?.stats.students || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cognitive-card group hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-4 sm:p-6 bg-gradient-to-br from-cognition-orange/5 to-cognition-orange/10">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-cognition-orange/10 group-hover:bg-cognition-orange/20 transition-colors">
                  <BarChart3 className="h-6 sm:h-8 w-6 sm:w-8 text-cognition-orange" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Views</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : error ? (
                      <span className="text-red-500">--</span>
                    ) : (
                      dashboardData?.stats.views || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error state for stats */}
        {error && (
          <div className="mb-6">
            <Card className="cognitive-card border-red-200 bg-red-50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-red-600">Failed to load dashboard statistics</div>
                </div>
                <NeuralButton variant="ghost" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </NeuralButton>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cognitive-card hover:shadow-neural transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5 text-neural-primary" />
                Create Module
              </CardTitle>
              <CardDescription>
                Build standalone learning modules with rich content and media
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/faculty/modules/create">
                <NeuralButton variant="neural" className="w-full">
                  Create New Module
                </NeuralButton>
              </Link>
            </CardContent>
          </Card>

          <Card className="cognitive-card hover:shadow-synaptic transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-synapse-primary" />
                Create Course
              </CardTitle>
              <CardDescription>
                Assemble courses by selecting and organizing existing modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/faculty/courses/create">
                <NeuralButton variant="synaptic" className="w-full">
                  Create New Course
                </NeuralButton>
              </Link>
            </CardContent>
          </Card>

          <Card className="cognitive-card hover:shadow-cognitive transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-cognition-teal" />
                Module Library
              </CardTitle>
              <CardDescription>
                Browse and manage your existing modules and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/faculty/modules">
                <NeuralButton variant="cognitive" className="w-full">
                  View All Modules
                </NeuralButton>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Activity
              {dashboardData?.recentActivity.length > 0 && (
                <Badge variant="outline">
                  {dashboardData.recentActivity.length} items
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Your latest modules and courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 p-4 rounded-lg border">
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">Failed to load recent activity</div>
                <NeuralButton variant="ghost" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </NeuralButton>
              </div>
            ) : dashboardData?.recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Welcome to Brain & Cognitive Sciences
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start by creating your first module or course to see activity here.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/faculty/modules/create">
                    <NeuralButton variant="neural">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Module
                    </NeuralButton>
                  </Link>
                  <Link href="/faculty/courses/create">
                    <NeuralButton variant="synaptic">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Course
                    </NeuralButton>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData?.recentActivity.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center space-x-4 p-4 rounded-lg border border-border hover:border-neural-primary/30 transition-colors">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      item.type === 'module' 
                        ? 'bg-gradient-neural' 
                        : 'bg-gradient-synaptic'
                    }`}>
                      {item.type === 'module' ? (
                        <FileText className="h-5 w-5 text-white" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title}
                        </p>
                        <Badge 
                          variant={item.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                        {item.type === 'course' && item.moduleCount !== undefined && (
                          <div className="flex items-center">
                            <Layers className="h-3 w-3 mr-1" />
                            {item.moduleCount} modules
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link href={item.type === 'module' ? `/faculty/modules/${item.id}` : `/courses/${item.id}`}>
                        <NeuralButton variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </NeuralButton>
                      </Link>
                      <Link href={item.type === 'module' ? `/faculty/modules/edit/${item.id}` : '#'}>
                        <NeuralButton variant="neural" size="sm" disabled={item.type === 'course'}>
                          <Edit className="h-4 w-4" />
                        </NeuralButton>
                      </Link>
                    </div>
                  </div>
                ))}
                
                {dashboardData?.recentActivity.length > 5 && (
                  <div className="text-center pt-4">
                    <Link href="/faculty/modules">
                      <NeuralButton variant="outline" size="sm">
                        View All Content
                      </NeuralButton>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
