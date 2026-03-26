'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, Lock } from 'lucide-react';
import { NeuralButton } from '../ui/neural-button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { showAchievementsSequence, showLevelUpToast } from '../achievements/AchievementToast';

interface MarkCompleteButtonProps {
  moduleId: string;
  courseId?: string; // Optional - if not provided, will use smart detection
  initialStatus: 'not_started' | 'completed';
  context?: 'course' | 'standalone'; // Show different messaging
  onComplete?: () => void;
}

export function MarkCompleteButton({
  moduleId,
  courseId,
  initialStatus,
  context = 'course',
  onComplete,
}: MarkCompleteButtonProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(initialStatus === 'completed');
  const [isLoading, setIsLoading] = useState(false);
  const [quizGate, setQuizGate] = useState<{
    canComplete: boolean;
    unlockCondition: string;
  } | null>(null);

  // Check quiz gate status
  useEffect(() => {
    async function checkQuizGate() {
      try {
        const res = await fetch(`/api/progress/module/${moduleId}/quiz-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.unlockCondition && data.unlockCondition !== 'completion') {
            setQuizGate({ canComplete: data.canComplete, unlockCondition: data.unlockCondition });
          }
        }
      } catch {
        // Ignore
      }
    }
    checkQuizGate();
  }, [moduleId]);

  const isQuizBlocked = quizGate && !quizGate.canComplete && !isCompleted;

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      const requestBody: {
        moduleId: string;
        courseId?: string;
        completed: boolean;
      } = {
        moduleId,
        completed: !isCompleted,
      };

      // Only include courseId if provided
      if (courseId) {
        requestBody.courseId = courseId;
      }

      const response = await fetch('/api/progress/module/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const data = await response.json();

      if (data.success) {
        setIsCompleted(!isCompleted);
        onComplete?.();

        // Show success message with mode info
        if (!isCompleted) {
          if (data.mode === 'auto-linked') {
            toast.success('Progress Saved!', {
              description: `Module marked complete and linked to ${data.linkedCourses} course(s)!`,
            });
          } else if (data.mode === 'standalone') {
            toast.success('Progress Saved!', {
              description: `Module marked as read. Progress will sync when you enroll in courses.`,
            });
          } else {
            toast.success('Progress Saved!', {
              description: `Module marked complete! +${data.xpAwarded || 0} XP`,
            });
          }

          // Show achievement toasts if any were earned
          if (data.achievements && data.achievements.length > 0) {
            // Wait a moment before showing achievements to avoid overlapping with success toast
            setTimeout(() => {
              showAchievementsSequence(data.achievements);
            }, 500);
          }

          // Show level up toast if leveled up
          if (data.leveledUp && data.level) {
            const nextLevelXP = Math.pow(data.level + 1, 2) * 100;
            setTimeout(() => {
              showLevelUpToast(data.level, nextLevelXP);
            }, data.achievements && data.achievements.length > 0 ? 1500 : 500);
          }
        }

        // Refresh the page to update progress indicators
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast.error('Update Failed', {
        description: 'Failed to update progress. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = context === 'standalone' ? 'Mark as Read' : 'Mark as Complete';
  const completedText = context === 'standalone' ? 'Read' : 'Completed';

  // Quiz-gated: show locked button
  if (isQuizBlocked) {
    return (
      <NeuralButton
        variant="outline"
        disabled
        className="gap-2 opacity-70 cursor-not-allowed"
      >
        <Lock className="h-4 w-4" />
        <span>{
          quizGate?.unlockCondition === 'mastery' ? 'Pass the mastery check to complete' :
          quizGate?.unlockCondition === 'assessment' ? 'Pass the assessment to complete' :
          quizGate?.unlockCondition === 'both' ? 'Pass mastery check and assessment to complete' :
          'Complete quiz requirements to continue'
        }</span>
      </NeuralButton>
    );
  }

  if (isCompleted) {
    return (
      <NeuralButton
        variant="ghost"
        onClick={handleToggle}
        disabled={isLoading}
        className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-2 border-green-500"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        <span className="font-semibold">{completedText}</span>
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
          <span>{buttonText}</span>
        </>
      )}
    </NeuralButton>
  );
}
