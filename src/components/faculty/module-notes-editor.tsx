"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NeuralButton } from '@/components/ui/neural-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { X, Save, FileText, Target, BookOpen } from 'lucide-react';

interface ModuleNotesEditorProps {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  currentNotes?: string | null;
  currentContext?: string | null;
  currentObjectives?: string | null;
  currentTitle?: string | null;
  onClose: () => void;
  onSave?: () => void;
}

export function ModuleNotesEditor({
  courseId,
  moduleId,
  moduleTitle,
  currentNotes = '',
  currentContext = '',
  currentObjectives = '',
  currentTitle = '',
  onClose,
  onSave,
}: ModuleNotesEditorProps) {
  const queryClient = useQueryClient();
  const [customTitle, setCustomTitle] = useState(currentTitle || '');
  const [customNotes, setCustomNotes] = useState(currentNotes || '');
  const [customContext, setCustomContext] = useState(currentContext || '');
  const [customObjectives, setCustomObjectives] = useState(currentObjectives || '');

  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_title: customTitle || null,
          custom_notes: customNotes || null,
          custom_context: customContext || null,
          custom_objectives: customObjectives || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save notes');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Module notes saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      onSave?.();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save notes');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center px-2 sm:px-4 pt-8 sm:pt-12 pb-4 z-[100]">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-neural-primary" />
                Course-Specific Module Notes
              </CardTitle>
              <CardDescription className="mt-1">
                Add context and notes for &quot;{moduleTitle}&quot; in this course
              </CardDescription>
            </div>
            <NeuralButton variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </NeuralButton>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {/* Custom Title */}
          <div className="space-y-2">
            <Label htmlFor="custom-title" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4 text-neural-primary" />
              Custom Title (Optional)
            </Label>
            <Input
              id="custom-title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={`Default: ${moduleTitle}`}
              className="font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Override the module title for this course only
            </p>
          </div>

          {/* Tabs for different note types */}
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="context">
                <BookOpen className="h-4 w-4 mr-2" />
                Context
              </TabsTrigger>
              <TabsTrigger value="objectives">
                <Target className="h-4 w-4 mr-2" />
                Objectives
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="space-y-2 mt-4">
              <Label htmlFor="custom-notes">Course-Specific Notes</Label>
              <Textarea
                id="custom-notes"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Add additional context, examples, or explanations specific to this course..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                These notes will be displayed alongside the module content when viewing this course.
              </p>
            </TabsContent>

            <TabsContent value="context" className="space-y-2 mt-4">
              <Label htmlFor="custom-context">Prerequisites & Context</Label>
              <Textarea
                id="custom-context"
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="Prerequisites for this module, connections to previous topics, or how it fits into the course flow..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Help students understand how this module connects to other course materials.
              </p>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-2 mt-4">
              <Label htmlFor="custom-objectives">Learning Objectives</Label>
              <Textarea
                id="custom-objectives"
                value={customObjectives}
                onChange={(e) => setCustomObjectives(e.target.value)}
                placeholder="What should students learn from this module in the context of this course? List specific learning objectives..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Define course-specific learning outcomes for this module.
              </p>
            </TabsContent>
          </Tabs>

          {/* Info Alert */}
          <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-neural-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">About Course-Specific Notes</p>
                <ul className="text-muted-foreground space-y-1 text-xs list-disc list-inside">
                  <li>These notes are specific to this course and won&apos;t affect the original module</li>
                  <li>Other courses using the same module will have their own notes</li>
                  <li>Students will see these notes when viewing the module in this course</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer with Save/Cancel buttons */}
        <div className="border-t p-4 flex items-center justify-between bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {customNotes || customContext || customObjectives || customTitle ? (
              <span className="text-neural-primary font-medium">Unsaved changes</span>
            ) : (
              <span>No changes yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <NeuralButton variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
              Cancel
            </NeuralButton>
            <NeuralButton
              variant="synaptic"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notes
                </>
              )}
            </NeuralButton>
          </div>
        </div>
      </Card>
    </div>
  );
}