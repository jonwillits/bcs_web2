'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, BookOpen, Award } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';

interface LearningCourseCardProps {
  enrollment: {
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
  };
}

export function LearningCourseCard({ enrollment }: LearningCourseCardProps) {
  const { course, completionPct, modulesCompleted, modulesTotal, lastAccessed } = enrollment;
  const isCompleted = completionPct === 100;
  const isInProgress = completionPct > 0 && completionPct < 100;
  const isNotStarted = completionPct === 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="cognitive-card hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-neural-primary line-clamp-2">
                {course.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Award className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {isInProgress && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  <BookOpen className="h-3 w-3 mr-1" />
                  In Progress
                </Badge>
              )}
              {isNotStarted && (
                <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                  Not Started
                </Badge>
              )}
            </div>
          </div>
        </div>

        {course.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {course.description}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-neural-primary">{completionPct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isCompleted
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : isInProgress
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                  : 'bg-gray-400'
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Course Stats */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>
                {modulesCompleted}/{modulesTotal} modules
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDate(lastAccessed)}</span>
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          {course.instructor.avatarUrl ? (
            <Image
              src={course.instructor.avatarUrl}
              alt={course.instructor.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neural-primary to-synapse-primary flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {course.instructor.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neural-primary truncate">
              {course.instructor.name}
            </p>
            {course.instructor.university && (
              <p className="text-xs text-muted-foreground truncate">
                {course.instructor.university}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/courses/${course.slug}`} className="block">
          <NeuralButton variant="neural" className="w-full">
            {isCompleted ? 'Review Course' : 'Continue Learning'}
          </NeuralButton>
        </Link>
      </CardContent>
    </Card>
  );
}
