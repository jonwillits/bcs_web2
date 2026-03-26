'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuizBlockEditor } from './QuizBlockEditor';
import { MasterySettingsForm } from './MasterySettingsForm';
import { AssessmentSettingsForm } from './AssessmentSettingsForm';
import { QuizAnalytics } from './QuizAnalytics';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

interface QuizBuilderV2Props {
  moduleId: string;
  quizType: 'mastery_check' | 'module_assessment';
}

interface QuizData {
  id?: string;
  title: string;
  description: string;
  quiz_type: string;
  status: string;
  xp_reward: number;
  randomize_blocks: boolean;
  time_limit_minutes: number | null;
  max_attempts: number;
  pass_threshold: number;
  scoring_procedure: string;
  scoring_drop_count: number;
  feedback_timing: string;
  feedback_depth: string;
  mastery_threshold: number;
  blocks: any[];
}

const defaultMastery: QuizData = {
  title: 'Mastery Check',
  description: '',
  quiz_type: 'mastery_check',
  status: 'draft',
  xp_reward: 50,
  randomize_blocks: false,
  time_limit_minutes: null,
  max_attempts: 0,
  pass_threshold: 70,
  scoring_procedure: 'best',
  scoring_drop_count: 0,
  feedback_timing: 'per_question',
  feedback_depth: 'full',
  mastery_threshold: 80,
  blocks: [],
};

const defaultAssessment: QuizData = {
  title: 'Module Assessment',
  description: '',
  quiz_type: 'module_assessment',
  status: 'draft',
  xp_reward: 50,
  randomize_blocks: false,
  time_limit_minutes: null,
  max_attempts: 0,
  pass_threshold: 70,
  scoring_procedure: 'best',
  scoring_drop_count: 0,
  feedback_timing: 'after_quiz',
  feedback_depth: 'full',
  mastery_threshold: 80,
  blocks: [],
};

export function QuizBuilderV2({ moduleId, quizType }: QuizBuilderV2Props) {
  const queryClient = useQueryClient();
  const [mastery, setMastery] = useState<QuizData>(defaultMastery);
  const [assessment, setAssessment] = useState<QuizData>(defaultAssessment);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load existing quizzes
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes', moduleId],
    queryFn: async () => {
      const res = await fetch(`/api/modules/${moduleId}/quiz`);
      if (!res.ok) return { quizzes: [] };
      return res.json();
    },
  });

  // Load question bank sets for block editor
  const { data: bank } = useQuery({
    queryKey: ['question-bank', moduleId],
    queryFn: async () => {
      const res = await fetch(`/api/modules/${moduleId}/question-bank`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.bank;
    },
  });

  // Initialize from loaded data
  useEffect(() => {
    if (quizzes?.quizzes) {
      const m = quizzes.quizzes.find((q: any) => q.quiz_type === 'mastery_check');
      const a = quizzes.quizzes.find((q: any) => q.quiz_type === 'module_assessment');
      if (m) setMastery({ ...defaultMastery, ...m });
      if (a) setAssessment({ ...defaultAssessment, ...a });
    }
  }, [quizzes]);

  const availableSets = (bank?.sets || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    questionCount: s.memberships?.length || 0,
  }));

  const currentQuiz = quizType === 'mastery_check' ? mastery : assessment;
  const setCurrentQuiz = quizType === 'mastery_check' ? setMastery : setAssessment;

  const handleSave = async () => {
    const data = currentQuiz;
    if (!data.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      if (data.id) {
        // Update existing quiz
        const res = await fetch(`/api/modules/${moduleId}/quiz/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || 'Failed to update quiz');
          return;
        }

        // Save blocks
        await syncBlocks(data.id, data.blocks);
        toast.success('Quiz updated');
      } else {
        // Create new quiz
        const res = await fetch(`/api/modules/${moduleId}/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || 'Failed to create quiz');
          return;
        }
        const result = await res.json();
        setCurrentQuiz({ ...data, id: result.quiz.id });

        // Save blocks
        await syncBlocks(result.quiz.id, data.blocks);
        toast.success('Quiz created');
      }

      queryClient.invalidateQueries({ queryKey: ['quizzes', moduleId] });
    } catch {
      toast.error('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const syncBlocks = async (quizId: string, blocks: any[]) => {
    for (const block of blocks) {
      if (block.id) {
        await fetch(`/api/quizzes/${quizId}/blocks/${block.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(block),
        });
      } else {
        const res = await fetch(`/api/quizzes/${quizId}/blocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(block),
        });
        if (res.ok) {
          const result = await res.json();
          block.id = result.block.id;
        }
      }
    }
  };

  const handleDeleteClick = () => {
    if (!currentQuiz.id) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentQuiz.id) return;
    try {
      const res = await fetch(`/api/modules/${moduleId}/quiz/${currentQuiz.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setCurrentQuiz(quizType === 'mastery_check' ? defaultMastery : defaultAssessment);
      toast.success('Quiz deleted');
      queryClient.invalidateQueries({ queryKey: ['quizzes', moduleId] });
    } catch {
      toast.error('Failed to delete quiz');
    }
    setShowDeleteConfirm(false);
  };

  const addBlock = () => {
    if (availableSets.length === 0) {
      toast.error('Create question sets in the Question Bank first');
      return;
    }
    const newBlock = {
      set_id: availableSets[0].id,
      title: `Section ${currentQuiz.blocks.length + 1}`,
      show_title: false,
      questions_to_pull: 1,
      randomize_within: true,
      sort_order: currentQuiz.blocks.length,
    };
    setCurrentQuiz({ ...currentQuiz, blocks: [...currentQuiz.blocks, newBlock] });
  };

  const updateBlock = (index: number, block: any) => {
    const newBlocks = [...currentQuiz.blocks];
    newBlocks[index] = block;
    setCurrentQuiz({ ...currentQuiz, blocks: newBlocks });
  };

  const deleteBlock = async (index: number) => {
    const block = currentQuiz.blocks[index];
    if (block.id && currentQuiz.id) {
      await fetch(`/api/quizzes/${currentQuiz.id}/blocks/${block.id}`, { method: 'DELETE' });
    }
    const newBlocks = currentQuiz.blocks.filter((_: any, i: number) => i !== index)
      .map((b: any, i: number) => ({ ...b, sort_order: i }));
    setCurrentQuiz({ ...currentQuiz, blocks: newBlocks });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-neural-primary" />
      </div>
    );
  }

  const typeLabel = quizType === 'mastery_check' ? 'Mastery Check' : 'Module Assessment';

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={`Delete ${typeLabel}`}
        description="This quiz and all its blocks will be permanently deleted. Student attempt data will be preserved."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
      />

      {/* Basic Info */}
      <Card className="cognitive-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {typeLabel} Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={currentQuiz.title}
                onChange={(e) => setCurrentQuiz({ ...currentQuiz, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={currentQuiz.status}
                onValueChange={(v) => setCurrentQuiz({ ...currentQuiz, status: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={currentQuiz.description}
              onChange={(e) => setCurrentQuiz({ ...currentQuiz, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Type-specific settings */}
          {quizType === 'mastery_check' ? (
            <MasterySettingsForm
              settings={{
                mastery_threshold: currentQuiz.mastery_threshold,
                xp_reward: currentQuiz.xp_reward,
              }}
              onChange={(s) => setCurrentQuiz({ ...currentQuiz, ...s })}
            />
          ) : (
            <AssessmentSettingsForm
              settings={{
                time_limit_minutes: currentQuiz.time_limit_minutes,
                max_attempts: currentQuiz.max_attempts,
                pass_threshold: currentQuiz.pass_threshold,
                scoring_procedure: currentQuiz.scoring_procedure,
                scoring_drop_count: currentQuiz.scoring_drop_count,
                feedback_timing: currentQuiz.feedback_timing,
                feedback_depth: currentQuiz.feedback_depth,
                xp_reward: currentQuiz.xp_reward,
                randomize_blocks: currentQuiz.randomize_blocks,
              }}
              onChange={(s) => setCurrentQuiz({ ...currentQuiz, ...s })}
            />
          )}
        </CardContent>
      </Card>

      {/* Blocks */}
      <Card className="cognitive-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Quiz Blocks</CardTitle>
            <NeuralButton variant="outline" size="sm" onClick={addBlock}>
              <Plus className="h-3 w-3 mr-1" /> Add Block
            </NeuralButton>
          </div>
          <p className="text-xs text-muted-foreground">
            Each block pulls N questions from a question set
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentQuiz.blocks.map((block: any, i: number) => (
            <QuizBlockEditor
              key={block.id || `new-${i}`}
              block={block}
              index={i}
              availableSets={availableSets}
              onChange={(b) => updateBlock(i, b)}
              onDelete={() => deleteBlock(i)}
            />
          ))}
          {currentQuiz.blocks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No blocks yet. Add a block to pull questions from a set.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <NeuralButton variant="neural" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          {currentQuiz.id ? 'Update Quiz' : 'Create Quiz'}
        </NeuralButton>
        {currentQuiz.id && (
          <NeuralButton
            variant="outline"
            onClick={handleDeleteClick}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </NeuralButton>
        )}
      </div>

      {/* Analytics */}
      {currentQuiz.id && (
        <div>
          <h4 className="text-sm font-medium mb-3">Analytics</h4>
          <QuizAnalytics quizId={currentQuiz.id} />
        </div>
      )}
    </div>
  );
}
