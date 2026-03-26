'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Trash2, Layers } from 'lucide-react';

interface QuizBlock {
  id?: string;
  set_id: string;
  title: string;
  show_title: boolean;
  questions_to_pull: number;
  randomize_within: boolean;
  sort_order: number;
}

interface SetInfo {
  id: string;
  title: string;
  questionCount: number;
}

interface QuizBlockEditorProps {
  block: QuizBlock;
  index: number;
  availableSets: SetInfo[];
  onChange: (block: QuizBlock) => void;
  onDelete: () => void;
}

export function QuizBlockEditor({
  block,
  index,
  availableSets,
  onChange,
  onDelete,
}: QuizBlockEditorProps) {
  const selectedSet = availableSets.find(s => s.id === block.set_id);
  const maxQuestions = selectedSet?.questionCount || 0;

  return (
    <Card className="cognitive-card">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <Layers className="h-4 w-4 text-neural-primary" />
          <span className="text-sm font-medium">Block {index + 1}</span>
          <div className="flex-1" />
          <NeuralButton variant="ghost" size="sm" onClick={onDelete} className="text-red-600 h-7 w-7 p-0">
            <Trash2 className="h-3.5 w-3.5" />
          </NeuralButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Block title */}
          <div>
            <Label className="text-xs">Block Title</Label>
            <Input
              value={block.title}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
              placeholder="Section name..."
              className="mt-1 text-sm"
            />
          </div>

          {/* Linked set */}
          <div>
            <Label className="text-xs">Question Set</Label>
            <Select value={block.set_id} onValueChange={(v) => onChange({ ...block, set_id: v })}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue placeholder="Select a set..." />
              </SelectTrigger>
              <SelectContent>
                {availableSets.map(set => (
                  <SelectItem key={set.id} value={set.id}>
                    {set.title} ({set.questionCount} Q)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Questions to pull */}
          <div>
            <Label className="text-xs">Questions to Pull</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min={1}
                max={maxQuestions || 999}
                value={block.questions_to_pull}
                onChange={(e) => onChange({ ...block, questions_to_pull: parseInt(e.target.value) || 1 })}
                className="text-sm"
              />
              {maxQuestions > 0 && (
                <Badge variant="outline" className="text-xs shrink-0">
                  / {maxQuestions} available
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={block.show_title}
              onCheckedChange={(v) => onChange({ ...block, show_title: v })}
            />
            <Label className="text-xs">Show title to students</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={block.randomize_within}
              onCheckedChange={(v) => onChange({ ...block, randomize_within: v })}
            />
            <Label className="text-xs">Randomize within block</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
