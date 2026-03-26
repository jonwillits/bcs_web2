'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeuralButton } from '@/components/ui/neural-button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Download, Upload, BookOpen } from 'lucide-react';
import { QuestionBankQuestionEditor } from './QuestionBankQuestionEditor';
import { QuestionSetEditor } from './QuestionSetEditor';
import { QuizImportExport } from './QuizImportExport';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

interface QuestionBankEditorProps {
  moduleId: string;
}

export function QuestionBankEditor({ moduleId }: QuestionBankEditorProps) {
  const queryClient = useQueryClient();
  const [showImportExport, setShowImportExport] = useState(false);
  const [newQuestion, setNewQuestion] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [showNewSet, setShowNewSet] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'question' | 'set'; id: string; label: string } | null>(null);

  const { data: bank, isLoading } = useQuery({
    queryKey: ['question-bank', moduleId],
    queryFn: async () => {
      const res = await fetch(`/api/modules/${moduleId}/question-bank`);
      if (!res.ok) throw new Error('Failed to load question bank');
      const data = await res.json();
      return data.bank;
    },
  });

  const invalidateBank = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['question-bank', moduleId] });
  }, [queryClient, moduleId]);

  // Question CRUD
  const saveQuestion = useCallback(async (question: any) => {
    const isUpdate = !!question.id;
    const url = isUpdate
      ? `/api/modules/${moduleId}/question-bank/questions/${question.id}`
      : `/api/modules/${moduleId}/question-bank/questions`;
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save question');
    }
    toast.success(isUpdate ? 'Question updated' : 'Question created');
    invalidateBank();
    setNewQuestion(false);
  }, [moduleId, invalidateBank]);

  const doDeleteQuestion = useCallback(async (questionId: string) => {
    const res = await fetch(`/api/modules/${moduleId}/question-bank/questions/${questionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete question');
    toast.success('Question deleted');
    invalidateBank();
  }, [moduleId, invalidateBank]);

  const deleteQuestion = useCallback((questionId: string) => {
    setDeleteConfirm({ type: 'question', id: questionId, label: 'Delete this question?' });
  }, []);

  const duplicateQuestion = useCallback(async (questionId: string) => {
    const res = await fetch(`/api/modules/${moduleId}/question-bank/questions/${questionId}/duplicate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to duplicate question');
    toast.success('Question duplicated');
    invalidateBank();
  }, [moduleId, invalidateBank]);

  // Set CRUD
  const createSet = useCallback(async () => {
    if (!newSetName.trim()) return;
    const res = await fetch(`/api/modules/${moduleId}/question-bank/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSetName.trim() }),
    });
    if (!res.ok) throw new Error('Failed to create set');
    toast.success('Set created');
    setNewSetName('');
    setShowNewSet(false);
    invalidateBank();
  }, [moduleId, newSetName, invalidateBank]);

  const updateSet = useCallback(async (setId: string, data: any) => {
    const res = await fetch(`/api/modules/${moduleId}/question-bank/sets/${setId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update set');
    invalidateBank();
  }, [moduleId, invalidateBank]);

  const deleteSet = useCallback(async (setId: string) => {
    const res = await fetch(`/api/modules/${moduleId}/question-bank/sets/${setId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete set');
    toast.success('Set deleted');
    invalidateBank();
  }, [moduleId, invalidateBank]);

  const addQuestionsToSet = useCallback(async (setId: string, questionIds: string[]) => {
    const res = await fetch(`/api/modules/${moduleId}/question-bank/sets/${setId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_ids: questionIds }),
    });
    if (!res.ok) throw new Error('Failed to add questions to set');
    invalidateBank();
  }, [moduleId, invalidateBank]);

  const removeQuestionFromSet = useCallback(async (setId: string, questionId: string) => {
    const res = await fetch(`/api/modules/${moduleId}/question-bank/sets/${setId}/questions/${questionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove question from set');
    invalidateBank();
  }, [moduleId, invalidateBank]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-neural-primary" />
      </div>
    );
  }

  const questions = bank?.questions || [];
  const sets = bank?.sets || [];
  const bankId = bank?.id || '';

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
        title={deleteConfirm?.type === 'question' ? 'Delete Question' : 'Delete Set'}
        description={deleteConfirm?.type === 'question'
          ? 'This question will be permanently removed from the bank.'
          : 'This set will be deleted. Questions will remain in the bank.'}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteConfirm) return;
          if (deleteConfirm.type === 'question') {
            await doDeleteQuestion(deleteConfirm.id);
          } else {
            await deleteSet(deleteConfirm.id);
          }
          setDeleteConfirm(null);
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <BookOpen className="h-5 w-5 text-neural-primary" />
          <h3 className="font-semibold">Question Bank</h3>
          <Badge variant="outline">{questions.length} questions</Badge>
          <Badge variant="outline">{sets.length} sets</Badge>
        </div>
        <div className="flex items-center gap-2">
          <NeuralButton variant="outline" size="sm" onClick={() => setShowImportExport(!showImportExport)}>
            {showImportExport ? 'Hide' : 'Import/Export'}
          </NeuralButton>
        </div>
      </div>

      {/* Import/Export */}
      {showImportExport && (
        <QuizImportExport moduleId={moduleId} onImportComplete={invalidateBank} />
      )}

      {/* Question Sets Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Question Sets</h4>
          <NeuralButton variant="outline" size="sm" onClick={() => setShowNewSet(true)}>
            <Plus className="h-3 w-3 mr-1" /> New Set
          </NeuralButton>
        </div>

        {showNewSet && (
          <Card className="cognitive-card mb-3">
            <CardContent className="p-3 flex items-center gap-2">
              <input
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') createSet(); }}
                placeholder="Set name..."
                className="flex-1 text-sm rounded-md border border-input bg-background px-3 py-1.5"
                autoFocus
              />
              <NeuralButton variant="neural" size="sm" onClick={createSet}>Create</NeuralButton>
              <NeuralButton variant="outline" size="sm" onClick={() => { setShowNewSet(false); setNewSetName(''); }}>Cancel</NeuralButton>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {sets
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((set: any) => (
              <QuestionSetEditor
                key={set.id}
                set={set}
                allQuestions={questions}
                moduleId={moduleId}
                onUpdate={(data) => updateSet(set.id, data)}
                onDelete={() => setDeleteConfirm({ type: 'set', id: set.id, label: set.title })}
                onAddQuestions={(qIds) => addQuestionsToSet(set.id, qIds)}
                onRemoveQuestion={(qId) => removeQuestionFromSet(set.id, qId)}
              />
            ))}
          {sets.length === 0 && !showNewSet && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No question sets yet. Create a set to organize questions.
            </p>
          )}
        </div>
      </div>

      {/* Questions Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">All Questions</h4>
          <NeuralButton variant="neural" size="sm" onClick={() => setNewQuestion(true)}>
            <Plus className="h-3 w-3 mr-1" /> New Question
          </NeuralButton>
        </div>

        <div className="space-y-2">
          {newQuestion && (
            <QuestionBankQuestionEditor
              question={{
                question_type: 'multiple_choice',
                question_text: '',
                points: 1,
                shuffle_answers: false,
                tags: [],
                options: [
                  { option_text: '', is_correct: false, sort_order: 0 },
                  { option_text: '', is_correct: false, sort_order: 1 },
                ],
              }}
              index={questions.length}
              moduleId={moduleId}
              bankId={bankId}
              onSave={saveQuestion}
              isNew
            />
          )}

          {questions
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((q: any, i: number) => (
              <QuestionBankQuestionEditor
                key={q.id}
                question={q}
                index={i}
                moduleId={moduleId}
                bankId={bankId}
                onSave={saveQuestion}
                onDelete={() => deleteQuestion(q.id)}
                onDuplicate={() => duplicateQuestion(q.id)}
              />
            ))}

          {questions.length === 0 && !newQuestion && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No questions yet. Add questions to build your question bank.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
