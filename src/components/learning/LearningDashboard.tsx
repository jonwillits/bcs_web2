'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, TrendingUp, Award, Filter } from 'lucide-react';
import { LearningCourseCard } from './LearningCourseCard';
import { RecentActivityTimeline } from './RecentActivityTimeline';
import { EmptyLearningState } from './EmptyLearningState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LearningDashboardProps {
  userName: string;
  userRole: string;
  data: {
    stats: {
      totalEnrolledCourses: number;
      totalCompletedCourses: number;
      totalCompletedModules: number;
      averageProgress: number;
    };
    enrolledCourses: Array<{
      trackingId: string;
      startedAt: string;
      lastAccessed: string;
      completionPct: number;
      modulesCompleted: number;
      modulesTotal: number;
      status: string;
      course: {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        status: string;
        moduleCount: number;
        instructor: {
          id: string;
          name: string;
          avatarUrl: string | null;
          university: string | null;
        };
      };
    }>;
    recentActivity: Array<{
      moduleId: string;
      moduleTitle: string;
      moduleSlug: string;
      courseId: string;
      courseTitle: string;
      courseSlug: string;
      completedAt: string | null;
    }>;
  } | null;
}

type SortOption = 'recent' | 'alphabetical' | 'progress';
type FilterOption = 'all' | 'in-progress' | 'completed';

export function LearningDashboard({ userName, userRole, data }: LearningDashboardProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500">
          Failed to load learning data. Please try again.
        </div>
      </div>
    );
  }

  const { stats, enrolledCourses, recentActivity } = data;

  // Filter courses
  let filteredCourses = [...enrolledCourses];

  if (filterBy === 'in-progress') {
    filteredCourses = filteredCourses.filter((c) => c.completionPct > 0 && c.completionPct < 100);
  } else if (filterBy === 'completed') {
    filteredCourses = filteredCourses.filter((c) => c.completionPct === 100);
  }

  // Sort courses
  if (sortBy === 'alphabetical') {
    filteredCourses.sort((a, b) => a.course.title.localeCompare(b.course.title));
  } else if (sortBy === 'progress') {
    filteredCourses.sort((a, b) => b.completionPct - a.completionPct);
  } else {
    // Default: recent (already sorted by last_accessed from DB)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neural-primary mb-2">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground">
          Track your learning progress and continue where you left off
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="cognitive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrolledCourses}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompletedModules}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
            <p className="text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <Award className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompletedCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCompletedCourses > 0 ? 'Keep it up!' : 'Start learning'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Courses Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-neural-primary mb-4 sm:mb-0">
            Your Courses
          </h2>

          {enrolledCourses.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filter */}
              <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Accessed</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="progress">By Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {filteredCourses.length === 0 ? (
          filterBy !== 'all' ? (
            <Card className="cognitive-card">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No {filterBy} courses</h3>
                <p className="text-muted-foreground">
                  Try changing the filter to see your other courses
                </p>
              </CardContent>
            </Card>
          ) : (
            <EmptyLearningState />
          )
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredCourses.map((enrollment) => (
              <LearningCourseCard key={enrollment.trackingId} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-neural-primary mb-4">Recent Activity</h2>
          <RecentActivityTimeline activities={recentActivity} />
        </div>
      )}
    </div>
  );
}
