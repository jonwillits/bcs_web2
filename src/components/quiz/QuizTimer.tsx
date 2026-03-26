'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface QuizTimerProps {
  timeLimitMinutes: number;
  startedAt: string;
  onTimeUp: () => void;
}

export function QuizTimer({ timeLimitMinutes, startedAt, onTimeUp }: QuizTimerProps) {
  const calculateRemaining = useCallback(() => {
    const start = new Date(startedAt).getTime();
    const limitMs = timeLimitMinutes * 60 * 1000;
    const elapsed = Date.now() - start;
    return Math.max(0, Math.floor((limitMs - elapsed) / 1000));
  }, [timeLimitMinutes, startedAt]);

  const [remaining, setRemaining] = useState(calculateRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calculateRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateRemaining, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining < 60;
  const isWarning = remaining < 300 && remaining >= 60;

  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-sm px-3 py-1.5 rounded-lg border ${
        isLow
          ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
          : isWarning
          ? 'bg-orange-50 border-orange-200 text-orange-700'
          : 'bg-gray-50 border-gray-200 text-gray-700'
      }`}
    >
      <Clock className="h-4 w-4" />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
