'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';
import { ChevronDown, ChevronUp, Trash2, GripVertical, X, Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
}

interface QuestionSet {
  id: string;
  title: string;
  description?: string | null;
  tags: string[];
  sort_order: number;
  memberships: Array<{
    id: string;
    question_id: string;
    sort_order: number;
    question: Question;
  }>;
}

interface QuestionSetEditorProps {
  set: QuestionSet;
  allQuestions: Question[];
  moduleId: string;
  onUpdate: (set: Partial<QuestionSet>) => Promise<void>;
  onDelete: () => void | Promise<void>;
  onAddQuestions: (questionIds: string[]) => Promise<void>;
  onRemoveQuestion: (questionId: string) => Promise<void>;
}

export function QuestionSetEditor({
  set,
  allQuestions,
  moduleId,
  onUpdate,
  onDelete,
  onAddQuestions,
  onRemoveQuestion,
}: QuestionSetEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(set.title);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(set.tags);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const memberQuestionIds = new Set(set.memberships.map(m => m.question_id));
  const availableQuestions = allQuestions.filter(q => !memberQuestionIds.has(q.id));

  const handleTitleSave = async () => {
    if (title.trim() !== set.title) {
      await onUpdate({ title: title.trim() });
    }
  };

  const addTag = async () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      setTagInput('');
      await onUpdate({ tags: newTags });
    }
  };

  const removeTag = async (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    await onUpdate({ tags: newTags });
  };

  const typeLabel: Record<string, string> = {
    multiple_choice: 'MC',
    multiple_select: 'MS',
    true_false: 'T/F',
  };

  return (
    <Card className={`cognitive-card ${expanded ? 'relative z-20 overflow-visible' : ''}`} style={expanded ? { overflow: 'visible' } : undefined}>
      <CardHeader className="p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <CardTitle className="text-sm flex-1">{set.title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {set.memberships.length} question{set.memberships.length !== 1 ? 's' : ''}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-3 pt-0 space-y-3 overflow-visible">
          {/* Title edit */}
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              className="text-sm font-medium"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} <X className="h-2.5 w-2.5 ml-1" />
                </Badge>
              ))}
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..."
                className="w-24 h-6 text-xs"
              />
            </div>
          </div>

          {/* Question list */}
          <div className="space-y-1">
            {set.memberships
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded border text-sm group">
                  <div className="flex-1 min-w-0 truncate">{m.question.question_text}</div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {typeLabel[m.question.question_type] || m.question.question_type}
                  </Badge>
                  <NeuralButton
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={() => onRemoveQuestion(m.question_id)}
                  >
                    <X className="h-3 w-3" />
                  </NeuralButton>
                </div>
              ))}

            {set.memberships.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No questions in this set
              </p>
            )}
          </div>

          {/* Add questions */}
          <div className="relative">
            <NeuralButton
              variant="outline"
              size="sm"
              onClick={() => setShowAddMenu(!showAddMenu)}
              disabled={availableQuestions.length === 0}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Questions
            </NeuralButton>

            {showAddMenu && availableQuestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-background border rounded-md shadow-lg">
                {availableQuestions.map(q => (
                  <button
                    key={q.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent truncate"
                    onClick={async () => {
                      await onAddQuestions([q.id]);
                      setShowAddMenu(false);
                    }}
                  >
                    {q.question_text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete set */}
          <div className="pt-2 border-t">
            <NeuralButton
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete()}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete Set
            </NeuralButton>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
