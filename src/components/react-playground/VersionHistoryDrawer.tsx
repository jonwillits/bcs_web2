'use client';

/**
 * VersionHistoryDrawer
 *
 * Slide-out drawer that displays playground version history.
 * Allows viewing previous versions and reverting to them.
 */

import { useEffect, useState, useCallback } from 'react';
import { X, History, RotateCcw, Eye, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Version {
  id: string;
  version: number;
  title: string;
  created_at: string;
  change_note: string | null;
  save_type: string;
  author?: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface VersionHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  playgroundId: string;
  onRevert?: () => void; // Called after successful revert to refresh playground
}

export default function VersionHistoryDrawer({
  open,
  onClose,
  playgroundId,
  onRevert,
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reverting, setReverting] = useState<number | null>(null);
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [confirmRevert, setConfirmRevert] = useState<number | null>(null);

  // Fetch versions when drawer opens
  const fetchVersions = useCallback(async () => {
    if (!playgroundId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playgrounds/${playgroundId}/versions`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch versions');
      }
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  }, [playgroundId]);

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, fetchVersions]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmRevert !== null) {
          setConfirmRevert(null);
        } else if (previewVersion !== null) {
          setPreviewVersion(null);
          setPreviewCode(null);
        } else if (open) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, confirmRevert, previewVersion]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Preview a version
  const handlePreview = async (version: number) => {
    try {
      const response = await fetch(`/api/playgrounds/${playgroundId}/versions/${version}`);
      if (!response.ok) {
        throw new Error('Failed to load version');
      }
      const data = await response.json();
      setPreviewVersion(version);
      setPreviewCode(data.source_code);
    } catch (err) {
      console.error('Failed to preview version:', err);
    }
  };

  // Revert to a version
  const handleRevert = async (version: number) => {
    setReverting(version);
    setConfirmRevert(null);

    try {
      const response = await fetch(`/api/playgrounds/${playgroundId}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revert');
      }

      // Refresh versions list
      await fetchVersions();

      // Close preview if open
      setPreviewVersion(null);
      setPreviewCode(null);

      // Notify parent to refresh playground
      onRevert?.();
    } catch (err) {
      console.error('Failed to revert:', err);
      setError(err instanceof Error ? err.message : 'Failed to revert');
    } finally {
      setReverting(null);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 transform transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 id="version-drawer-title" className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-neural-primary" />
            Version History
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-65px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-neural-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchVersions}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
              >
                Retry
              </button>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No version history yet</p>
              <p className="text-sm mt-2">Versions are created when you save changes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    index === 0
                      ? 'bg-neural-primary/10 border-neural-primary/30'
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          v{version.version}
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-neural-primary/20 text-neural-primary text-xs rounded-full">
                            Current
                          </span>
                        )}
                        {version.save_type === 'fork_source' && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Fork Source
                          </span>
                        )}
                      </div>

                      {version.change_note && (
                        <p className="text-sm text-gray-300 mb-2 truncate">
                          {version.change_note}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatRelativeTime(version.created_at)}</span>
                        {version.author && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {version.author.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {index !== 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(version.version)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Preview this version"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmRevert(version.version)}
                          disabled={reverting !== null}
                          className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Revert to this version"
                        >
                          {reverting === version.version ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewVersion !== null && previewCode !== null && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Version {previewVersion} Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmRevert(previewVersion)}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Revert to this
                </button>
                <button
                  onClick={() => {
                    setPreviewVersion(null);
                    setPreviewCode(null);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap bg-gray-950 p-4 rounded-lg">
                {previewCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Revert Modal */}
      {confirmRevert !== null && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Revert to Version {confirmRevert}?
            </h3>
            <p className="text-gray-400 mb-6">
              This will create a new version with the content from version {confirmRevert}.
              Your current version will be saved in the history.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmRevert(null)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevert(confirmRevert)}
                disabled={reverting !== null}
                className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2"
              >
                {reverting !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reverting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Revert
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
