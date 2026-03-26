'use client';

import { useEffect, useState } from 'react';
import { QuizTakerV2 } from './QuizTakerV2';
import { Badge } from '@/components/ui/badge';
import { Brain, ClipboardCheck } from 'lucide-react';

interface QuizSectionProps {
  moduleId: string;
  courseId?: string;
  onQuizComplete?: () => void;
}

interface QuizStatus {
  mastery: {
    quizId: string;
    status: string;
    isMastered: boolean;
    bestScore: number | null;
    attemptsUsed: number;
    threshold: number;
  } | null;
  assessment: {
    quizId: string;
    status: string;
    passed: boolean;
    bestScore: number | null;
    attemptsUsed: number;
    maxAttempts: number;
    threshold: number;
  } | null;
  unlockCondition: string;
  canComplete: boolean;
}

export function QuizSection({ moduleId, courseId, onQuizComplete }: QuizSectionProps) {
  const [status, setStatus] = useState<QuizStatus | null>(null);

  useEffect(() => {
    async function checkQuiz() {
      try {
        const res = await fetch(`/api/progress/module/${moduleId}/quiz-status`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch {
        // No quiz check possible
      }
    }
    checkQuiz();
  }, [moduleId]);

  if (!status) return null;

  const hasMastery = status.mastery && status.mastery.status === 'published';
  const hasAssessment = status.assessment && status.assessment.status === 'published';

  if (!hasMastery && !hasAssessment) return null;

  return (
    <div className="mt-6 space-y-6">
      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {hasMastery && (
          <Badge
            variant="outline"
            className={status.mastery!.isMastered ? 'bg-green-50 text-green-700 border-green-200' : ''}
          >
            <Brain className="h-3 w-3 mr-1" />
            {status.mastery!.isMastered ? 'Mastered' : 'Mastery Check'}
          </Badge>
        )}
        {hasAssessment && (
          <Badge
            variant="outline"
            className={status.assessment!.passed ? 'bg-green-50 text-green-700 border-green-200' : ''}
          >
            <ClipboardCheck className="h-3 w-3 mr-1" />
            {status.assessment!.passed ? 'Assessment Passed' : 'Assessment'}
          </Badge>
        )}
      </div>

      {/* Mastery Check */}
      {hasMastery && status.mastery && (
        <QuizTakerV2
          quizId={status.mastery.quizId}
          quizType="mastery_check"
          moduleId={moduleId}
          courseId={courseId}
          onQuizComplete={onQuizComplete}
        />
      )}

      {/* Assessment */}
      {hasAssessment && status.assessment && (
        <QuizTakerV2
          quizId={status.assessment.quizId}
          quizType="module_assessment"
          moduleId={moduleId}
          courseId={courseId}
          onQuizComplete={onQuizComplete}
        />
      )}
    </div>
  );
}
