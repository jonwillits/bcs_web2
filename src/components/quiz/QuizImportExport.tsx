'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { NeuralButton } from '@/components/ui/neural-button';
import { Download, Upload, Loader2, FileJson } from 'lucide-react';
import { toast } from 'sonner';

interface QuizImportExportProps {
  moduleId: string;
  onImportComplete: () => void;
}

export function QuizImportExport({ moduleId, onImportComplete }: QuizImportExportProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}/question-bank/export`);
      if (!res.ok) {
        toast.error('Failed to export');
        return;
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `question-bank-${moduleId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Question bank exported');
    } catch {
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        toast.error('Invalid JSON file');
        return;
      }

      const res = await fetch(`/api/modules/${moduleId}/question-bank/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to import');
        return;
      }

      const result = await res.json();
      toast.success(`Imported ${result.questions_created} questions and ${result.sets_created} sets`);
      onImportComplete();
    } catch {
      toast.error('Failed to import');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="cognitive-card">
      <CardContent className="p-4 flex items-center gap-3 flex-wrap">
        <FileJson className="h-5 w-5 text-neural-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Import / Export Questions</p>
          <p className="text-xs text-muted-foreground">
            JSON format with questions, options, explanations, and sets.{' '}
            <Link
              href="/guide/quiz-system#11-import--export"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              View format
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NeuralButton variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Export
          </NeuralButton>
          <NeuralButton
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            Import
          </NeuralButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </CardContent>
    </Card>
  );
}
