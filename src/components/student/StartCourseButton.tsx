'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StartCourseButtonProps {
  courseId: string;
  courseName: string;
  isStarted?: boolean;
  className?: string;
}

export function StartCourseButton({
  courseId,
  courseName,
  isStarted: initialIsStarted = false,
  className = ''
}: StartCourseButtonProps) {
  const [isStarted, setIsStarted] = useState(initialIsStarted);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartCourse = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/courses/${courseId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start course');
      }

      setIsStarted(true);

      if (data.alreadyStarted) {
        toast.success('Course already in your library');
      } else {
        toast.success(`Added to My Courses!`);
      }

      // Refresh to update UI
      router.refresh();

    } catch (error) {
      console.error('Error starting course:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start course');
    } finally {
      setIsLoading(false);
    }
  };

  if (isStarted) {
    return (
      <div className={`inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium ${className}`}>
        <CheckCircle className="h-5 w-5" />
        <span>Started • In My Courses</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartCourse}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neural-primary to-synapse-primary text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <BookOpen className="h-5 w-5" />
      <span>{isLoading ? 'Starting...' : 'Start Course'}</span>
    </button>
  );
}
