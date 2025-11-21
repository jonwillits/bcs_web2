'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { NeuralButton } from '../ui/neural-button';
import { useRouter } from 'next/navigation';

interface MarkCompleteButtonProps {
  moduleId: string;
  courseId: string;
  initialStatus: 'not_started' | 'completed';
  onComplete?: () => void;
}

export function MarkCompleteButton({
  moduleId,
  courseId,
  initialStatus,
  onComplete,
}: MarkCompleteButtonProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(initialStatus === 'completed');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/progress/module/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          courseId,
          completed: !isCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const data = await response.json();

      if (data.success) {
        setIsCompleted(!isCompleted);
        onComplete?.();

        // Refresh the page to update progress indicators
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      alert('Failed to update progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <NeuralButton
        variant="ghost"
        onClick={handleToggle}
        disabled={isLoading}
        className="gap-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        <span>Completed</span>
      </NeuralButton>
    );
  }

  return (
    <NeuralButton
      variant="synaptic"
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating...</span>
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          <span>Mark as Complete</span>
        </>
      )}
    </NeuralButton>
  );
}
