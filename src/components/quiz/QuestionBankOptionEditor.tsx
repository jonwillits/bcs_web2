'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NeuralButton } from '@/components/ui/neural-button';
import { Check, X, GripVertical, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
  explanation?: string | null;
  sort_order: number;
}

interface QuestionBankOptionEditorProps {
  option: Option;
  index: number;
  questionType: string;
  onChange: (option: Option) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function QuestionBankOptionEditor({
  option,
  index,
  questionType,
  onChange,
  onRemove,
  canRemove,
}: QuestionBankOptionEditorProps) {
  const [showExplanation, setShowExplanation] = useState(!!option.explanation);

  const isTrueFalse = questionType === 'true_false';

  return (
    <div className="flex items-start gap-2 group">
      <div className="mt-2.5 text-muted-foreground cursor-grab">
        <GripVertical className="h-4 w-4" />
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...option, is_correct: !option.is_correct })}
        className={`mt-2.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          option.is_correct
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        title={option.is_correct ? 'Correct answer' : 'Mark as correct'}
      >
        {option.is_correct && <Check className="h-3 w-3" />}
      </button>

      <div className="flex-1 space-y-2">
        <Input
          value={option.option_text}
          onChange={(e) => onChange({ ...option, option_text: e.target.value })}
          placeholder={isTrueFalse ? (index === 0 ? 'True' : 'False') : `Option ${index + 1}`}
          disabled={isTrueFalse}
          className="text-sm"
        />

        {showExplanation ? (
          <Textarea
            value={option.explanation || ''}
            onChange={(e) => onChange({ ...option, explanation: e.target.value })}
            placeholder="Explain why this answer is correct/incorrect..."
            rows={2}
            className="text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowExplanation(true)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <MessageSquare className="h-3 w-3" />
            Add explanation
          </button>
        )}
      </div>

      {canRemove && !isTrueFalse && (
        <NeuralButton
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </NeuralButton>
      )}
    </div>
  );
}
