'use client';

import { CheckCircle, XCircle } from 'lucide-react';

interface MasteryFeedbackInlineProps {
  isCorrect: boolean;
  explanations: Array<{
    optionText: string;
    isCorrect: boolean;
    explanation: string | null;
    wasSelected: boolean;
  }>;
}

export function MasteryFeedbackInline({ isCorrect, explanations }: MasteryFeedbackInlineProps) {
  return (
    <div className={`ml-7 p-3 rounded-lg border ${
      isCorrect
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {isCorrect ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </span>
      </div>

      <div className="space-y-1">
        {explanations
          .filter(e => e.explanation && (e.isCorrect || e.wasSelected))
          .map((e, i) => (
            <p key={i} className="text-xs text-gray-700">
              <strong className={e.isCorrect ? 'text-green-700' : 'text-amber-700'}>
                {e.optionText}:
              </strong>{' '}
              {e.explanation}
            </p>
          ))}
      </div>
    </div>
  );
}
