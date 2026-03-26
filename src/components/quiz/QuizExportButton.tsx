'use client';

import { useState } from 'react';
import { NeuralButton } from '@/components/ui/neural-button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuizExportButtonProps {
  courseId: string;
}

export function QuizExportButton({ courseId }: QuizExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty/courses/${courseId}/quiz-export`);
      if (!res.ok) {
        toast.error('Failed to export grades');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quiz-grades-${courseId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Grades exported successfully');
    } catch {
      toast.error('Failed to export grades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeuralButton
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <Download className="h-4 w-4 mr-1" />
      )}
      Export Quiz Grades (CSV)
    </NeuralButton>
  );
}
