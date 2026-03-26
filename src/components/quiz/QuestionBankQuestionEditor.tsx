'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { QuestionBankOptionEditor } from './QuestionBankOptionEditor';
import { Plus, Save, Trash2, Copy, ChevronDown, ChevronUp, Tag, X } from 'lucide-react';
import { toast } from 'sonner';

interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
  explanation?: string | null;
  sort_order: number;
}

interface Question {
  id?: string;
  question_type: string;
  question_text: string;
  image_url?: string | null;
  points: number;
  shuffle_answers: boolean;
  tags: string[];
  options: Option[];
  version?: number;
}

interface QuestionBankQuestionEditorProps {
  question: Question;
  index: number;
  moduleId: string;
  bankId: string;
  onSave: (question: Question) => Promise<void>;
  onDelete?: () => void | Promise<void>;
  onDuplicate?: () => Promise<void>;
  isNew?: boolean;
}

export function QuestionBankQuestionEditor({
  question: initialQuestion,
  index,
  moduleId,
  bankId,
  onSave,
  onDelete,
  onDuplicate,
  isNew = false,
}: QuestionBankQuestionEditorProps) {
  const [question, setQuestion] = useState<Question>(initialQuestion);
  const [expanded, setExpanded] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleTypeChange = (type: string) => {
    let options = question.options;
    if (type === 'true_false') {
      options = [
        { option_text: 'True', is_correct: true, sort_order: 0 },
        { option_text: 'False', is_correct: false, sort_order: 1 },
      ];
    } else if (question.question_type === 'true_false') {
      options = [
        { option_text: '', is_correct: false, sort_order: 0 },
        { option_text: '', is_correct: false, sort_order: 1 },
      ];
    }
    setQuestion({ ...question, question_type: type, options });
  };

  const handleOptionChange = (idx: number, option: Option) => {
    const newOptions = [...question.options];
    // For MC/TF, only one correct answer
    if (option.is_correct && question.question_type !== 'multiple_select') {
      newOptions.forEach((o, i) => {
        if (i !== idx) o.is_correct = false;
      });
    }
    newOptions[idx] = option;
    setQuestion({ ...question, options: newOptions });
  };

  const addOption = () => {
    setQuestion({
      ...question,
      options: [
        ...question.options,
        { option_text: '', is_correct: false, sort_order: question.options.length },
      ],
    });
  };

  const removeOption = (idx: number) => {
    const newOptions = question.options.filter((_, i) => i !== idx)
      .map((o, i) => ({ ...o, sort_order: i }));
    setQuestion({ ...question, options: newOptions });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !question.tags.includes(tag)) {
      setQuestion({ ...question, tags: [...question.tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setQuestion({ ...question, tags: question.tags.filter(t => t !== tag) });
  };

  const handleSave = async () => {
    if (!question.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (question.options.length < 2) {
      toast.error('At least 2 options required');
      return;
    }
    if (!question.options.some(o => o.is_correct)) {
      toast.error('At least one option must be marked correct');
      return;
    }

    setSaving(true);
    try {
      await onSave(question);
      if (isNew) setExpanded(false);
    } catch {
      toast.error('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = {
    multiple_choice: 'Multiple Choice',
    multiple_select: 'Multiple Select',
    true_false: 'True / False',
  }[question.question_type] || question.question_type;

  if (!expanded) {
    return (
      <Card className="cognitive-card cursor-pointer hover:border-neural-primary/30 transition-colors" onClick={() => setExpanded(true)}>
        <CardContent className="p-3 flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-8">Q{index + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{question.question_text || 'New question'}</p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">{typeLabel}</Badge>
          <Badge variant="outline" className="text-xs shrink-0">{question.points} pt{question.points !== 1 ? 's' : ''}</Badge>
          {question.version && question.version > 1 && (
            <Badge variant="outline" className="text-xs shrink-0">v{question.version}</Badge>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cognitive-card border-neural-primary/30">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
            {question.version && question.version > 1 && (
              <Badge variant="outline" className="text-xs">v{question.version}</Badge>
            )}
          </div>
          <NeuralButton variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            <ChevronUp className="h-4 w-4" />
          </NeuralButton>
        </div>

        {/* Question Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Question Type</Label>
            <Select value={question.question_type} onValueChange={handleTypeChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="multiple_select">Multiple Select</SelectItem>
                <SelectItem value="true_false">True / False</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Points</Label>
            <Input
              type="number"
              min={1}
              value={question.points}
              onChange={(e) => setQuestion({ ...question, points: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Question Text */}
        <div>
          <Label className="text-xs">Question Text</Label>
          <textarea
            value={question.question_text}
            onChange={(e) => setQuestion({ ...question, question_text: e.target.value })}
            placeholder="Enter your question..."
            rows={3}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Image URL */}
        <div>
          <Label className="text-xs">Image URL (optional)</Label>
          <Input
            value={question.image_url || ''}
            onChange={(e) => setQuestion({ ...question, image_url: e.target.value || null })}
            placeholder="https://..."
            className="mt-1"
          />
        </div>

        {/* Options */}
        <div>
          <Label className="text-xs">Answer Options</Label>
          <div className="mt-2 space-y-2">
            {question.options.map((opt, i) => (
              <QuestionBankOptionEditor
                key={i}
                option={opt}
                index={i}
                questionType={question.question_type}
                onChange={(o) => handleOptionChange(i, o)}
                onRemove={() => removeOption(i)}
                canRemove={question.options.length > 2}
              />
            ))}
          </div>
          {question.question_type !== 'true_false' && (
            <NeuralButton variant="outline" size="sm" className="mt-2" onClick={addOption}>
              <Plus className="h-3 w-3 mr-1" /> Add Option
            </NeuralButton>
          )}
        </div>

        {/* Shuffle & Tags */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch
              checked={question.shuffle_answers}
              onCheckedChange={(v) => setQuestion({ ...question, shuffle_answers: v })}
            />
            <Label className="text-xs">Shuffle answers</Label>
          </div>
        </div>

        {/* Tags */}
        <div>
          <Label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</Label>
          <div className="flex gap-1 flex-wrap mt-1">
            {question.tags.map(tag => (
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

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <NeuralButton variant="neural" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </NeuralButton>
          {onDuplicate && (
            <NeuralButton variant="outline" size="sm" onClick={onDuplicate}>
              <Copy className="h-3 w-3 mr-1" /> Duplicate
            </NeuralButton>
          )}
          {onDelete && (
            <NeuralButton variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700 ml-auto">
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </NeuralButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
