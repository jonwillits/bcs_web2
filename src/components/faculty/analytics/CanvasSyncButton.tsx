'use client';

import { useState } from 'react';
import { NeuralButton } from '@/components/ui/neural-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SyncResult {
  status: 'success' | 'partial' | 'failed';
  quizzesSynced: number;
  studentsSynced: number;
  studentsSkipped: number;
  unmatchedStudents: string[];
  errors: string[];
  message?: string;
}

interface CanvasSyncButtonProps {
  courseId: string;
  groupId: string;
  canvasCourseId?: string | null;
  groupName?: string;
}

export function CanvasSyncButton({
  courseId,
  groupId,
  canvasCourseId,
  groupName,
}: CanvasSyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  // Only show when a specific group with a Canvas ID is selected
  if (!canvasCourseId || groupId === 'all') return null;

  const handleSync = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty/courses/${courseId}/canvas-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Sync failed');
        return;
      }

      setResult(data);
      setResultOpen(true);

      if (data.status === 'success') {
        toast.success('Grades synced to Canvas');
      } else if (data.status === 'partial') {
        toast.warning('Grades partially synced — some errors occurred');
      } else {
        toast.error('Sync failed');
      }
    } catch {
      toast.error('Failed to sync grades to Canvas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NeuralButton
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => setConfirmOpen(true)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Upload className="h-4 w-4 mr-1" />
        )}
        Sync to Canvas
      </NeuralButton>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Grades to Canvas</DialogTitle>
            <DialogDescription>
              This will push quiz grades for <strong>{groupName || 'this group'}</strong> to
              Canvas course <strong>{canvasCourseId}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm text-muted-foreground py-2">
            <p>For each quiz in this course, the sync will:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create a Canvas assignment (or reuse one from a previous sync)</li>
              <li>Push each student&apos;s best score</li>
              <li>Match students by email address</li>
            </ul>
          </div>

          <DialogFooter>
            <NeuralButton
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </NeuralButton>
            <NeuralButton
              variant="neural"
              size="sm"
              onClick={handleSync}
            >
              <Upload className="h-4 w-4 mr-1" />
              Sync Now
            </NeuralButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result?.status === 'success' && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {result?.status === 'partial' && (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              {result?.status === 'failed' && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Sync {result?.status === 'success' ? 'Complete' : result?.status === 'partial' ? 'Partially Complete' : 'Failed'}
            </DialogTitle>
          </DialogHeader>

          {result && (
            <div className="space-y-4 py-2">
              {result.message ? (
                <p className="text-sm text-muted-foreground">{result.message}</p>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border/40 p-3 text-center">
                      <div className="text-2xl font-bold">{result.quizzesSynced}</div>
                      <div className="text-xs text-muted-foreground">Quizzes synced</div>
                    </div>
                    <div className="rounded-lg border border-border/40 p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{result.studentsSynced}</div>
                      <div className="text-xs text-muted-foreground">Students synced</div>
                    </div>
                    <div className="rounded-lg border border-border/40 p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{result.studentsSkipped}</div>
                      <div className="text-xs text-muted-foreground">Skipped</div>
                    </div>
                  </div>

                  {/* Unmatched students */}
                  {result.unmatchedStudents.length > 0 && (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                      <div className="text-sm font-medium text-yellow-600 mb-1">
                        Students not found in Canvas:
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {result.unmatchedStudents.map((email) => (
                          <li key={email}>{email}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                      <div className="text-sm font-medium text-red-600 mb-1">
                        Errors:
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <NeuralButton
              variant="outline"
              size="sm"
              onClick={() => setResultOpen(false)}
            >
              Close
            </NeuralButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
