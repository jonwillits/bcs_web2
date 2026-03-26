'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Attempt {
  id: string;
  attempt_number: number;
  status: string;
  score: number | null;
  passed: boolean;
  started_at: string;
  submitted_at: string | null;
  xp_awarded: number;
  quiz_type?: string;
}

interface QuizAttemptHistoryProps {
  attempts: Attempt[];
  onSelectAttempt: (attemptId: string) => void;
}

export function QuizAttemptHistory({ attempts, onSelectAttempt }: QuizAttemptHistoryProps) {
  if (attempts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No attempts yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {attempts.map(attempt => (
        <button
          key={attempt.id}
          onClick={() => onSelectAttempt(attempt.id)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-neural-primary/50 hover:bg-accent/50 transition-colors text-left"
        >
          {attempt.status === 'in_progress' ? (
            <Clock className="h-5 w-5 text-orange-500 shrink-0" />
          ) : attempt.passed ? (
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Attempt {attempt.attempt_number}
              </span>
              {attempt.status === 'in_progress' && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                  In Progress
                </Badge>
              )}
            </div>
            {attempt.submitted_at && (
              <p className="text-xs text-muted-foreground">
                {new Date(attempt.submitted_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {attempt.score !== null && (
            <div className="text-right shrink-0">
              <span className={`text-lg font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                {Math.round(attempt.score)}%
              </span>
              {attempt.xp_awarded > 0 && (
                <p className="text-xs text-yellow-600">+{attempt.xp_awarded} XP</p>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
