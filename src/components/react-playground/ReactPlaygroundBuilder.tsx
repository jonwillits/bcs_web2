'use client';

/**
 * ReactPlaygroundBuilder
 *
 * Main builder component combining code editor and live preview.
 * Features resizable panels, dependency management, and save functionality.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  useSandpack,
} from '@codesandbox/sandpack-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import {
  Save,
  Eye,
  Code,
  Package,
  Terminal,
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  neuralTheme,
  getDefaultFiles,
  DEFAULT_DEPENDENCIES,
  arrayToDependencies,
} from '@/lib/react-playground/sandpack-config';
import DependencyManager from './DependencyManager';
import type {
  PlaygroundFormData,
  PlaygroundCategory,
  CATEGORY_LABELS,
} from '@/types/react-playground';
import { cn } from '@/lib/utils';

interface ReactPlaygroundBuilderProps {
  initialData?: Partial<PlaygroundFormData>;
  playgroundId?: string;
  onSave?: (data: PlaygroundFormData) => Promise<void>;
  readOnly?: boolean;
}

// Toolbar component with save status
function BuilderToolbar({
  title,
  onTitleChange,
  isSaving,
  lastSaved,
  isDirty,
  onSave,
  viewMode,
  onViewModeChange,
  showDeps,
  onToggleDeps,
  readOnly,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  onSave: () => void;
  viewMode: 'split' | 'code' | 'preview';
  onViewModeChange: (mode: 'split' | 'code' | 'preview') => void;
  showDeps: boolean;
  onToggleDeps: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
      {/* Left side - back button and title */}
      <div className="flex items-center gap-4">
        <Link
          href="/playgrounds"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>
        <div className="w-px h-6 bg-gray-700" />
        {readOnly ? (
          <h1 className="text-white font-medium">{title}</h1>
        ) : (
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Playground"
            className="bg-transparent text-white font-medium text-lg focus:outline-none border-b border-transparent focus:border-neural-primary"
          />
        )}

        {/* Save status */}
        {!readOnly && (
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-neural-primary" />
                <span className="text-gray-400">Saving...</span>
              </>
            ) : isDirty ? (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-gray-400">Unsaved changes</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-gray-500">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Right side - controls */}
      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex items-center bg-gray-800 rounded-md p-1">
          <button
            onClick={() => onViewModeChange('code')}
            className={cn(
              'px-3 py-1 rounded text-sm transition-colors',
              viewMode === 'code'
                ? 'bg-neural-primary text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('split')}
            className={cn(
              'px-3 py-1 rounded text-sm transition-colors',
              viewMode === 'split'
                ? 'bg-neural-primary text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            Split
          </button>
          <button
            onClick={() => onViewModeChange('preview')}
            className={cn(
              'px-3 py-1 rounded text-sm transition-colors',
              viewMode === 'preview'
                ? 'bg-neural-primary text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        {/* Dependencies toggle */}
        {!readOnly && (
          <button
            onClick={onToggleDeps}
            className={cn(
              'p-2 rounded-md transition-colors',
              showDeps
                ? 'bg-neural-primary/20 text-neural-primary'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            )}
            title="Dependencies"
          >
            <Package className="h-4 w-4" />
          </button>
        )}

        {/* Save button */}
        {!readOnly && (
          <button
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-neural-primary text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neural-primary/90 transition-colors"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        )}
      </div>
    </div>
  );
}

// Inner editor that syncs with Sandpack state
function CodeEditorPanel({ onCodeChange }: { onCodeChange: (code: string) => void }) {
  const { sandpack } = useSandpack();

  // Sync code changes back to parent
  useEffect(() => {
    const code = sandpack.files['/App.js']?.code || '';
    onCodeChange(code);
  }, [sandpack.files, onCodeChange]);

  return (
    <SandpackCodeEditor
      showTabs={false}
      showLineNumbers
      showInlineErrors
      wrapContent
      style={{ height: '100%' }}
    />
  );
}

// Floating refresh button for preview (Claude artifact style)
function PreviewRefreshButton() {
  const { sandpack } = useSandpack();

  const handleRefresh = () => {
    sandpack.runSandpack();
  };

  return (
    <button
      onClick={handleRefresh}
      className="absolute top-3 right-3 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white hover:bg-black/70 transition-all"
      title="Refresh preview"
    >
      <RefreshCw className="h-4 w-4" />
    </button>
  );
}

export default function ReactPlaygroundBuilder({
  initialData,
  playgroundId,
  onSave,
  readOnly = false,
}: ReactPlaygroundBuilderProps) {
  // Form state
  const [title, setTitle] = useState(initialData?.title || 'Untitled Playground');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<PlaygroundCategory>(
    initialData?.category || 'other'
  );
  const [sourceCode, setSourceCode] = useState(
    initialData?.sourceCode || `export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    }}>
      <h1>Hello, World!</h1>
      <p>Start editing to see changes in real-time</p>
    </div>
  );
}
`
  );
  const [dependencies, setDependencies] = useState<Record<string, string>>(() =>
    initialData?.dependencies
      ? arrayToDependencies(initialData.dependencies)
      : { ...DEFAULT_DEPENDENCIES }
  );

  // UI state
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [showDeps, setShowDeps] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Panel refs for programmatic resize
  const codePanelRef = useRef<ImperativePanelHandle>(null);
  const previewPanelRef = useRef<ImperativePanelHandle>(null);

  // Track initial mount to avoid setting isDirty on load
  const isInitialMount = useRef(true);

  // Programmatically resize panels based on viewMode
  useEffect(() => {
    // Small delay to ensure panels are mounted
    const timer = setTimeout(() => {
      if (viewMode === 'code') {
        codePanelRef.current?.resize(100);
        previewPanelRef.current?.resize(0);
      } else if (viewMode === 'preview') {
        codePanelRef.current?.resize(0);
        previewPanelRef.current?.resize(100);
      } else {
        codePanelRef.current?.resize(50);
        previewPanelRef.current?.resize(50);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [viewMode]);

  // Track changes - skip on initial mount to avoid false "unsaved changes"
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setIsDirty(true);
  }, [title, description, category, sourceCode, dependencies]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!readOnly && isDirty) {
      const draft = {
        title,
        description,
        category,
        sourceCode,
        dependencies: Object.keys(dependencies).filter(
          (d) => d !== 'react' && d !== 'react-dom'
        ),
      };
      localStorage.setItem(
        `playground-draft-${playgroundId || 'new'}`,
        JSON.stringify(draft)
      );
    }
  }, [title, description, category, sourceCode, dependencies, playgroundId, isDirty, readOnly]);

  // Load draft from localStorage
  useEffect(() => {
    if (!readOnly && !initialData?.sourceCode) {
      const saved = localStorage.getItem(`playground-draft-${playgroundId || 'new'}`);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setTitle(draft.title || 'Untitled Playground');
          setDescription(draft.description || '');
          setCategory(draft.category || 'other');
          setSourceCode(draft.sourceCode || '');
          if (draft.dependencies) {
            setDependencies(arrayToDependencies(draft.dependencies));
          }
        } catch {
          // Invalid draft, ignore
        }
      }
    }
  }, [playgroundId, initialData, readOnly]);

  // Sync code from editor
  const handleCodeChange = useCallback((code: string) => {
    setSourceCode(code);
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!onSave || readOnly) return;

    setIsSaving(true);
    try {
      await onSave({
        title,
        description,
        category,
        sourceCode,
        dependencies: Object.keys(dependencies).filter(
          (d) => d !== 'react' && d !== 'react-dom'
        ),
        isPublic: true,
      });
      setLastSaved(new Date());
      setIsDirty(false);
      // Clear draft on successful save
      localStorage.removeItem(`playground-draft-${playgroundId || 'new'}`);
    } catch (error) {
      console.error('Failed to save playground:', error);
      // Show error to user
      alert('Failed to save playground. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, title, description, category, sourceCode, dependencies, playgroundId, readOnly]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Memoize files to prevent unnecessary re-renders
  const files = useMemo(() => getDefaultFiles(sourceCode), [sourceCode]);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      {/* Toolbar */}
      <BuilderToolbar
        title={title}
        onTitleChange={setTitle}
        isSaving={isSaving}
        lastSaved={lastSaved}
        isDirty={isDirty}
        onSave={handleSave}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showDeps={showDeps}
        onToggleDeps={() => setShowDeps(!showDeps)}
        readOnly={readOnly}
      />

      {/* Main content - resizable panels */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <SandpackProvider
          template="react"
          theme={neuralTheme}
          files={files}
          customSetup={{
            dependencies,
          }}
          options={{
            recompileMode: 'delayed',
            recompileDelay: 500,
            autorun: true,
          }}
        >
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Code Editor Panel - ALWAYS RENDERED */}
            <ResizablePanel
              ref={codePanelRef}
              defaultSize={50}
              minSize={0}
              className="flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                <span className="text-gray-400 text-sm font-medium">
                  App.js
                </span>
                <button
                  onClick={() => setShowConsole(!showConsole)}
                  className={cn(
                    'p-1 rounded transition-colors',
                    showConsole
                      ? 'bg-neural-primary/20 text-neural-primary'
                      : 'text-gray-500 hover:text-white'
                  )}
                >
                  <Terminal className="h-4 w-4" />
                </button>
              </div>
              <div className={cn('flex-1 min-h-0 overflow-hidden', showConsole ? 'h-[60%]' : 'h-full')}>
                {readOnly ? (
                  <SandpackCodeEditor
                    showTabs={false}
                    showLineNumbers
                    readOnly
                    style={{ height: '100%' }}
                  />
                ) : (
                  <CodeEditorPanel onCodeChange={handleCodeChange} />
                )}
              </div>
              {showConsole && (
                <div className="h-[40%] border-t border-gray-800">
                  <SandpackConsole style={{ height: '100%' }} />
                </div>
              )}
            </ResizablePanel>

            {/* Resize Handle - only visible in split mode */}
            <ResizableHandle
              withHandle
              className={cn(viewMode !== 'split' && 'hidden')}
            />

            {/* Preview Panel - ALWAYS RENDERED */}
            <ResizablePanel
              ref={previewPanelRef}
              defaultSize={50}
              minSize={0}
              className="min-h-0 overflow-hidden"
            >
              <div className="h-full relative">
                {/* Floating refresh button - inside canvas */}
                <PreviewRefreshButton />

                {/* Preview fills entire space */}
                <SandpackPreview
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </SandpackProvider>

        {/* Dependencies Panel */}
        {showDeps && !readOnly && (
          <div className="w-80 border-l border-gray-800 overflow-y-auto flex-shrink-0">
            <DependencyManager
              dependencies={dependencies}
              onChange={setDependencies}
            />
          </div>
        )}
      </div>
    </div>
  );
}
