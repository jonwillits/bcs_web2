'use client';

/**
 * UnifiedPlaygroundViewer
 *
 * Immersive playground viewer with thin header and info drawer.
 * Used for both Featured Templates and Community Playgrounds.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Info, Code, Star, History, GitFork, Loader2 } from 'lucide-react';
import PlaygroundInfoDrawer from './PlaygroundInfoDrawer';
import VersionHistoryDrawer from './VersionHistoryDrawer';

// Lazy load the preview component (Sandpack doesn't support SSR)
const PlaygroundViewerClient = dynamic(
  () => import('@/components/react-playground/PlaygroundViewerClient'),
  {
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading playground...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export interface UnifiedPlaygroundViewerProps {
  // Required
  title: string;
  sourceCode: string;
  dependencies: Record<string, string>;

  // Optional metadata
  playgroundId?: string; // Required for versioning and forking
  description?: string;
  author?: {
    name: string;
    avatar?: string;
    university?: string;
  };
  stats?: {
    viewCount: number;
    createdAt: Date;
  };
  category?: string;
  tags?: string[];
  requirementsList?: string[]; // Raw list for info drawer

  // Access control
  canEdit?: boolean;
  editUrl?: string;
  canFork?: boolean; // Show fork button (non-owner viewing public playground)
  canViewHistory?: boolean; // Show version history (owner/admin only)

  // Status flags
  isFeatured?: boolean;
  isProtected?: boolean;
}

export default function UnifiedPlaygroundViewer({
  title,
  sourceCode,
  dependencies,
  playgroundId,
  description,
  author,
  stats,
  category,
  tags,
  requirementsList,
  canEdit,
  editUrl,
  canFork,
  canViewHistory,
  isFeatured,
  isProtected,
}: UnifiedPlaygroundViewerProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [forking, setForking] = useState(false);
  const [currentCode, setCurrentCode] = useState(sourceCode);

  // Check if we have any metadata to show
  const hasMetadata = description || author || stats || category || tags?.length || requirementsList?.length || isFeatured;

  // Handle fork
  const handleFork = useCallback(async () => {
    if (!playgroundId || forking) return;

    setForking(true);
    try {
      const response = await fetch(`/api/playgrounds/${playgroundId}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fork');
      }

      const data = await response.json();
      // Redirect to builder with the new forked playground
      router.push(`/playgrounds/builder?edit=${data.playground.id}`);
    } catch (err) {
      console.error('Failed to fork:', err);
      alert(err instanceof Error ? err.message : 'Failed to fork playground');
    } finally {
      setForking(false);
    }
  }, [playgroundId, forking, router]);

  // Handle revert - refresh the playground
  const handleRevert = useCallback(() => {
    // Reload the page to get updated content
    window.location.reload();
  }, []);

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Thin Header */}
      <header className="h-12 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800 shrink-0">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/playgrounds"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>
          <div className="w-px h-5 bg-gray-700 shrink-0" />
          <h1 className="text-white font-medium truncate">{title}</h1>
          {isFeatured && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full shrink-0">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </span>
          )}
        </div>

        {/* Right: Info + History + Fork + Edit */}
        <div className="flex items-center gap-2 shrink-0">
          {hasMetadata && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Show info"
              title="About this playground"
            >
              <Info className="h-5 w-5" />
            </button>
          )}
          {canViewHistory && playgroundId && (
            <button
              onClick={() => setHistoryDrawerOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Version history"
              title="Version history"
            >
              <History className="h-5 w-5" />
            </button>
          )}
          {canFork && playgroundId && (
            <button
              onClick={handleFork}
              disabled={forking}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              title="Create your own copy"
            >
              {forking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitFork className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Fork</span>
            </button>
          )}
          {canEdit && editUrl && (
            <Link
              href={editUrl}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          )}
        </div>
      </header>

      {/* Full-screen Preview */}
      <div className="flex-1 min-h-0">
        <PlaygroundViewerClient
          code={sourceCode}
          dependencies={dependencies}
          showConsole={true}
          className="h-full w-full"
        />
      </div>

      {/* Info Drawer */}
      <PlaygroundInfoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={title}
        description={description}
        author={author}
        stats={stats}
        category={category}
        tags={tags}
        dependencies={requirementsList}
        isFeatured={isFeatured}
      />

      {/* Version History Drawer */}
      {playgroundId && (
        <VersionHistoryDrawer
          open={historyDrawerOpen}
          onClose={() => setHistoryDrawerOpen(false)}
          playgroundId={playgroundId}
          onRevert={handleRevert}
        />
      )}
    </div>
  );
}
