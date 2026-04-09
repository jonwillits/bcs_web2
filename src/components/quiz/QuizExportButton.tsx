'use client';

import { useState } from 'react';
import { NeuralButton } from '@/components/ui/neural-button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Download, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

type CsvSheet = 'quiz' | 'gradebook';

interface QuizExportButtonProps {
  courseId: string;
  /**
   * Group id to scope the export to. "all" (or undefined) exports every
   * enrolled student. The picker itself lives in the parent now so analytics
   * and export stay in sync.
   */
  groupId?: string;
}

export function QuizExportButton({ courseId, groupId = 'all' }: QuizExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvSheet, setCsvSheet] = useState<CsvSheet>('gradebook');

  const download = async (format: 'xlsx' | 'csv', sheet?: CsvSheet) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ format });
      if (format === 'csv' && sheet) params.set('sheet', sheet);
      if (groupId && groupId !== 'all') params.set('groupId', groupId);

      const res = await fetch(
        `/api/faculty/courses/${courseId}/quiz-export?${params.toString()}`
      );
      if (!res.ok) {
        toast.error('Failed to export grades');
        return;
      }

      const blob = await res.blob();

      // Try to pull filename from Content-Disposition, fall back to a default
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ||
        `gradebook-${courseId}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Grades exported successfully');
      setCsvDialogOpen(false);
    } catch {
      toast.error('Failed to export grades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <NeuralButton variant="outline" size="sm" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Export Grades
            <ChevronDown className="h-4 w-4 ml-1" />
          </NeuralButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => download('xlsx')}>
            <div className="flex flex-col">
              <span className="font-medium">Excel (.xlsx)</span>
              <span className="text-xs text-muted-foreground">
                Course gradebook + quiz-by-quiz breakdown
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCsvDialogOpen(true)}>
            <div className="flex flex-col">
              <span className="font-medium">CSV</span>
              <span className="text-xs text-muted-foreground">
                Gradebook or quiz breakdown (pick one)
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export as CSV</DialogTitle>
            <DialogDescription>
              CSV files can only contain one sheet. Choose which one to download.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={csvSheet}
            onValueChange={(v) => setCsvSheet(v as CsvSheet)}
            className="gap-3 py-2"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
              <RadioGroupItem value="gradebook" id="csv-gradebook" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="csv-gradebook" className="cursor-pointer font-medium">
                  Course gradebook
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  One row per student with their overall grade and totals
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
              <RadioGroupItem value="quiz" id="csv-quiz" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="csv-quiz" className="cursor-pointer font-medium">
                  Quiz-by-quiz breakdown
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  One row per student per quiz with scores and attempts
                </p>
              </div>
            </div>
          </RadioGroup>

          <DialogFooter>
            <NeuralButton
              variant="outline"
              size="sm"
              onClick={() => setCsvDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </NeuralButton>
            <NeuralButton
              variant="neural"
              size="sm"
              onClick={() => download('csv', csvSheet)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Download
            </NeuralButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
