'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Eye,
  Edit,
  EyeOff,
  Trash2,
  Loader2,
  BookOpen,
  FileText,
  AlertCircle,
  AlertTriangle,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Course {
  id: string;
  title: string;
  slug: string;
  author: {
    name: string;
    email: string;
  };
  status: string;
  moduleCount: number;
  enrolledCount?: number;
  updatedAt: string;
}

interface Module {
  id: string;
  title: string;
  slug: string;
  author: {
    name: string;
    email: string;
  };
  status: string;
  courseCount: number;
  difficultyLevel: string;
  questType: string;
  updatedAt: string;
}

type ConfirmAction = {
  type: 'unpublish' | 'delete';
  contentType: 'course' | 'module';
  id: string;
  title: string;
  metadata?: {
    moduleCount?: number;
    courseCount?: number;
    enrolledCount?: number;
  };
} | null;

export function ContentModerationView() {
  const [activeTab, setActiveTab] = useState<'courses' | 'modules'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [coursesRes, modulesRes] = await Promise.all([
          fetch('/api/admin/content/courses'),
          fetch('/api/admin/content/modules'),
        ]);

        if (!coursesRes.ok || !modulesRes.ok) {
          throw new Error('Failed to fetch content');
        }

        const [coursesData, modulesData] = await Promise.all([
          coursesRes.json(),
          modulesRes.json(),
        ]);

        setCourses(coursesData.courses || []);
        setModules(modulesData.modules || []);
      } catch (error) {
        console.error('Error fetching content:', error);
        toast.error('Failed to load content. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Open confirmation dialog
  const openConfirmDialog = (action: ConfirmAction) => {
    setConfirmAction(action);
  };

  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmAction(null);
  };

  // Unpublish course/module
  const handleUnpublish = async () => {
    if (!confirmAction) return;

    const { contentType, id, title } = confirmAction;
    const actionId = `${contentType}-${id}-unpublish`;

    try {
      setActionInProgress(actionId);

      const response = await fetch('/api/admin/content/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contentType, id, status: 'draft' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unpublish');
      }

      // Optimistic update
      if (contentType === 'course') {
        setCourses(courses.map(c => c.id === id ? { ...c, status: 'draft' } : c));
      } else {
        setModules(modules.map(m => m.id === id ? { ...m, status: 'draft' } : m));
      }

      toast.success(`${contentType === 'course' ? 'Course' : 'Module'} "${title}" unpublished successfully`, {
        description: 'It is now hidden from students',
      });

      closeConfirmDialog();
    } catch (error) {
      console.error('Error unpublishing:', error);
      toast.error(`Failed to unpublish ${contentType}`, {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete course/module
  const handleDelete = async () => {
    if (!confirmAction) return;

    const { contentType, id, title } = confirmAction;
    const actionId = `${contentType}-${id}-delete`;

    try {
      setActionInProgress(actionId);

      const response = await fetch('/api/admin/content/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contentType, id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      // Optimistic update
      if (contentType === 'course') {
        setCourses(courses.filter(c => c.id !== id));
      } else {
        setModules(modules.filter(m => m.id !== id));
      }

      toast.success(`${contentType === 'course' ? 'Course' : 'Module'} "${title}" deleted permanently`, {
        description: 'This action cannot be undone',
        duration: 5000,
      });

      closeConfirmDialog();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Failed to delete ${contentType}`, {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter data based on search
  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-neural-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published Courses</p>
                <p className="text-2xl font-bold text-green-600">
                  {courses.filter(c => c.status === 'published').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Modules</p>
                <p className="text-2xl font-bold">{modules.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published Modules</p>
                <p className="text-2xl font-bold text-green-600">
                  {modules.filter(m => m.status === 'published').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 sm:gap-8">
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors ${
              activeTab === 'courses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📚 Courses ({filteredCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors ${
              activeTab === 'modules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📄 Modules ({filteredModules.length})
          </button>
        </nav>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>
              All courses created by faculty members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No courses found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map(course => {
                  const isUnpublishing = actionInProgress === `course-${course.id}-unpublish`;
                  const isDeleting = actionInProgress === `course-${course.id}-delete`;
                  const isDisabled = isUnpublishing || isDeleting;

                  return (
                    <div
                      key={course.id}
                      className="border rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start flex-wrap gap-2 mb-2">
                            <h3 className="font-semibold text-base sm:text-lg">{course.title}</h3>
                            <Badge variant={course.status === 'published' ? 'default' : 'outline'} className="flex-shrink-0">
                              {course.status}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5">
                            <p className="truncate">Author: {course.author.name}</p>
                            <p>Modules: {course.moduleCount} • Updated {formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/courses/${course.slug}`} target="_blank">
                                <NeuralButton size="sm" variant="outline" disabled={isDisabled}>
                                  <Eye className="h-4 w-4" />
                                </NeuralButton>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>View as student</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/faculty/courses/edit/${course.id}`}>
                                <NeuralButton size="sm" variant="outline" disabled={isDisabled}>
                                  <Edit className="h-4 w-4" />
                                </NeuralButton>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Edit course</TooltipContent>
                          </Tooltip>
                          {course.status === 'published' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <NeuralButton
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openConfirmDialog({
                                    type: 'unpublish',
                                    contentType: 'course',
                                    id: course.id,
                                    title: course.title,
                                  })}
                                  disabled={isDisabled}
                                >
                                  {isUnpublishing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </NeuralButton>
                              </TooltipTrigger>
                              <TooltipContent>Unpublish (hide from students)</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <NeuralButton
                                size="sm"
                                variant="destructive"
                                onClick={() => openConfirmDialog({
                                  type: 'delete',
                                  contentType: 'course',
                                  id: course.id,
                                  title: course.title,
                                  metadata: {
                                    moduleCount: course.moduleCount,
                                    enrolledCount: course.enrolledCount,
                                  },
                                })}
                                disabled={isDisabled}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </NeuralButton>
                            </TooltipTrigger>
                            <TooltipContent>Delete permanently</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>
              All modules created by faculty members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredModules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No modules found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredModules.map(module => {
                  const isUnpublishing = actionInProgress === `module-${module.id}-unpublish`;
                  const isDeleting = actionInProgress === `module-${module.id}-delete`;
                  const isDisabled = isUnpublishing || isDeleting;

                  return (
                    <div
                      key={module.id}
                      className="border rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1.5 mb-2 flex-wrap">
                            <h3 className="font-semibold text-base sm:text-lg">{module.title}</h3>
                            <Badge variant={module.status === 'published' ? 'default' : 'outline'} className="flex-shrink-0">
                              {module.status}
                            </Badge>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {module.difficultyLevel}
                            </Badge>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {module.questType}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5">
                            <p className="truncate">Author: {module.author.name}</p>
                            <p>
                              Used in {module.courseCount} course{module.courseCount !== 1 ? 's' : ''} •
                              Updated {formatDistanceToNow(new Date(module.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/modules/${module.slug}`} target="_blank">
                                <NeuralButton size="sm" variant="outline" disabled={isDisabled}>
                                  <Eye className="h-4 w-4" />
                                </NeuralButton>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>View as student</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/faculty/modules/edit/${module.id}`}>
                                <NeuralButton size="sm" variant="outline" disabled={isDisabled}>
                                  <Edit className="h-4 w-4" />
                                </NeuralButton>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Edit module</TooltipContent>
                          </Tooltip>
                          {module.status === 'published' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <NeuralButton
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openConfirmDialog({
                                    type: 'unpublish',
                                    contentType: 'module',
                                    id: module.id,
                                    title: module.title,
                                  })}
                                  disabled={isDisabled}
                                >
                                  {isUnpublishing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </NeuralButton>
                              </TooltipTrigger>
                              <TooltipContent>Unpublish (hide from students)</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <NeuralButton
                                size="sm"
                                variant="destructive"
                                onClick={() => openConfirmDialog({
                                  type: 'delete',
                                  contentType: 'module',
                                  id: module.id,
                                  title: module.title,
                                  metadata: {
                                    courseCount: module.courseCount,
                                  },
                                })}
                                disabled={isDisabled}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </NeuralButton>
                            </TooltipTrigger>
                            <TooltipContent>Delete permanently</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction?.type === 'delete' ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirm Deletion
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Confirm Unpublish
                </>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                {confirmAction?.type === 'unpublish' ? (
                  <>
                    <p>
                      Are you sure you want to unpublish <strong>{confirmAction.title}</strong>?
                    </p>
                    <p className="text-sm">
                      This will immediately hide it from students. You can republish it later.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Are you sure you want to permanently delete <strong>{confirmAction?.title}</strong>?
                    </p>

                    {/* Warnings for courses */}
                    {confirmAction?.contentType === 'course' && (
                      <div className="space-y-2">
                        {confirmAction.metadata?.moduleCount ? (
                          <div className="flex items-start gap-2 text-sm bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md border border-orange-200 dark:border-orange-900">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-orange-900 dark:text-orange-100">
                                This course contains {confirmAction.metadata.moduleCount} module{confirmAction.metadata.moduleCount !== 1 ? 's' : ''}
                              </p>
                              <p className="text-orange-700 dark:text-orange-300">
                                The modules will remain, but will be removed from this course.
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {confirmAction.metadata?.enrolledCount ? (
                          <div className="flex items-start gap-2 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900">
                            <Users className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-red-900 dark:text-red-100">
                                {confirmAction.metadata.enrolledCount} student{confirmAction.metadata.enrolledCount !== 1 ? 's are' : ' is'} enrolled
                              </p>
                              <p className="text-red-700 dark:text-red-300">
                                Their progress will be lost permanently.
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Warnings for modules */}
                    {confirmAction?.contentType === 'module' && confirmAction.metadata?.courseCount ? (
                      <div className="flex items-start gap-2 text-sm bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md border border-orange-200 dark:border-orange-900">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-orange-900 dark:text-orange-100">
                            This module is used in {confirmAction.metadata.courseCount} course{confirmAction.metadata.courseCount !== 1 ? 's' : ''}
                          </p>
                          <p className="text-orange-700 dark:text-orange-300">
                            It will be removed from all courses that use it.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <p className="text-sm font-semibold text-destructive">
                      This action cannot be undone.
                    </p>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <NeuralButton
              variant="outline"
              onClick={closeConfirmDialog}
              disabled={!!actionInProgress}
            >
              Cancel
            </NeuralButton>
            <NeuralButton
              variant={confirmAction?.type === 'delete' ? 'destructive' : 'neural'}
              onClick={confirmAction?.type === 'delete' ? handleDelete : handleUnpublish}
              disabled={!!actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {confirmAction?.type === 'delete' ? 'Deleting...' : 'Unpublishing...'}
                </>
              ) : (
                confirmAction?.type === 'delete' ? 'Delete Permanently' : 'Unpublish'
              )}
            </NeuralButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
