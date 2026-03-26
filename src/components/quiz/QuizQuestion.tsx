'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
  explanation?: string | null;
}

interface QuestionInstance {
  id: string;
  question_id: string;
  question_text_snapshot: string;
  options_snapshot: QuestionOption[];
  weight: number;
  sort_order: number;
  block_id: string;
}

interface QuizQuestionProps {
  instance: QuestionInstance;
  index: number;
  questionType: string;
  selectedOptionIds: string[];
  onSelectOption: (questionId: string, instanceId: string, optionIds: string[]) => void;
  onResponseTime?: (questionId: string, instanceId: string, timeMs: number) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  imageUrl?: string | null;
}

export function QuizQuestion({
  instance,
  index,
  questionType,
  selectedOptionIds,
  onSelectOption,
  onResponseTime,
  disabled = false,
  showFeedback = false,
  imageUrl,
}: QuizQuestionProps) {
  const startTimeRef = useRef<number>(Date.now());
  const reportedRef = useRef(false);

  // Track response time
  useEffect(() => {
    startTimeRef.current = Date.now();
    reportedRef.current = false;
  }, [instance.id]);

  const handleSelect = (optionId: string) => {
    if (disabled) return;

    // Report response time on first interaction
    if (!reportedRef.current && onResponseTime) {
      const elapsed = Date.now() - startTimeRef.current;
      onResponseTime(instance.question_id, instance.id, elapsed);
      reportedRef.current = true;
    }

    const isMultiSelect = questionType === 'multiple_select';
    if (isMultiSelect) {
      const newIds = selectedOptionIds.includes(optionId)
        ? selectedOptionIds.filter(id => id !== optionId)
        : [...selectedOptionIds, optionId];
      onSelectOption(instance.question_id, instance.id, newIds);
    } else {
      onSelectOption(instance.question_id, instance.id, [optionId]);
    }
  };

  const options = instance.options_snapshot as QuestionOption[];

  return (
    <div className="space-y-3">
      {/* Question header */}
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-muted-foreground mt-0.5">Q{index + 1}</span>
        <div className="flex-1">
          <p className="font-medium text-sm">{instance.question_text_snapshot}</p>
          {imageUrl && (
            <div className="mt-2 relative max-w-md">
              <Image src={imageUrl} alt="Question image" width={400} height={300} className="rounded-md border" />
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="ml-7 space-y-1.5">
        {options.map(opt => {
          const isSelected = selectedOptionIds.includes(opt.id);
          const isMulti = questionType === 'multiple_select';

          let borderClass = 'border-gray-200 hover:border-neural-primary/50';
          if (disabled) borderClass = 'border-gray-200';

          if (showFeedback && isSelected) {
            borderClass = opt.is_correct
              ? 'border-green-400 bg-green-50'
              : 'border-red-400 bg-red-50';
          } else if (showFeedback && opt.is_correct) {
            borderClass = 'border-green-400 bg-green-50/50';
          } else if (isSelected) {
            borderClass = 'border-neural-primary bg-neural-primary/5';
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-sm text-left transition-colors ${borderClass} ${
                disabled ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              {/* Radio/Checkbox indicator */}
              <div className={`shrink-0 w-4 h-4 ${isMulti ? 'rounded-sm' : 'rounded-full'} border-2 flex items-center justify-center ${
                isSelected
                  ? 'bg-neural-primary border-neural-primary'
                  : 'border-gray-300'
              }`}>
                {isSelected && (
                  <div className={`${isMulti ? 'w-2 h-2 rounded-sm' : 'w-1.5 h-1.5 rounded-full'} bg-white`} />
                )}
              </div>

              <span className="flex-1">{opt.text}</span>

              {isSelected && !showFeedback && (
                <Badge variant="outline" className="text-xs shrink-0">Selected</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Inline feedback (mastery mode) */}
      {showFeedback && (
        <div className="ml-7 space-y-1.5">
          {options.filter(opt => opt.explanation).map(opt => {
            const isSelected = selectedOptionIds.includes(opt.id);
            if (!isSelected && !opt.is_correct) return null;
            return (
              <div
                key={`exp-${opt.id}`}
                className={`p-2 rounded text-xs border ${
                  opt.is_correct
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <strong>{opt.is_correct ? 'Correct:' : 'Explanation:'}</strong> {opt.explanation}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
