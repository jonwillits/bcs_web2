'use client';

/**
 * ReactPlaygroundPreview
 *
 * Sandpack-based live preview component with fullscreen support.
 * Renders React/JSX code in a sandboxed iframe with hot reloading.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { Maximize2, Minimize2, RefreshCw, Terminal, X, Square } from 'lucide-react';
import {
  neuralTheme,
  getDefaultFiles,
  DEFAULT_DEPENDENCIES,
} from '@/lib/react-playground/sandpack-config';
import { cn } from '@/lib/utils';

interface ReactPlaygroundPreviewProps {
  code: string;
  dependencies?: Record<string, string>;
  className?: string;
  showConsole?: boolean;
  autoReload?: boolean;
}

// Inner component that uses Sandpack context
function PreviewControls({
  isFullscreen,
  onToggleFullscreen,
  isFullWindow,
  onToggleFullWindow,
  showConsole,
  onToggleConsole,
  consoleVisible,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isFullWindow: boolean;
  onToggleFullWindow: () => void;
  showConsole: boolean;
  onToggleConsole: () => void;
  consoleVisible: boolean;
}) {
  const { sandpack } = useSandpack();

  const handleRefresh = () => {
    sandpack.runSandpack();
  };

  return (
    <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
      {showConsole && (
        <button
          onClick={onToggleConsole}
          className={cn(
            'p-2 rounded-md transition-colors',
            consoleVisible
              ? 'bg-neural-primary/20 text-neural-primary'
              : 'bg-black/50 text-gray-400 hover:text-white hover:bg-black/70'
          )}
          title={consoleVisible ? 'Hide Console' : 'Show Console'}
        >
          <Terminal className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={handleRefresh}
        className="p-2 bg-black/50 rounded-md text-gray-400 hover:text-white hover:bg-black/70 transition-colors"
        title="Refresh Preview"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <button
        onClick={onToggleFullWindow}
        className="p-2 bg-black/50 rounded-md text-gray-400 hover:text-white hover:bg-black/70 transition-colors"
        title={isFullWindow ? 'Exit Full Window' : 'Full Window'}
      >
        {isFullWindow ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={onToggleFullscreen}
        className="p-2 bg-black/50 rounded-md text-gray-400 hover:text-white hover:bg-black/70 transition-colors"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// Loading overlay
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading preview...</p>
      </div>
    </div>
  );
}

// Error boundary for preview
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 p-4">
        <div className="text-center">
          <p className="text-red-400 font-medium">Preview Error</p>
          <p className="text-gray-400 text-sm mt-2">
            An error occurred while rendering the preview.
          </p>
          <button
            onClick={() => setHasError(false)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function ReactPlaygroundPreview({
  code,
  dependencies = {},
  className,
  showConsole = true,
  autoReload = true,
}: ReactPlaygroundPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullWindow, setIsFullWindow] = useState(false);
  const [consoleVisible, setConsoleVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Merge dependencies with defaults
  const allDependencies = {
    ...DEFAULT_DEPENDENCIES,
    ...dependencies,
  };

  // Get files with user code
  const files = getDefaultFiles(code);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {
        // Fallback: use fixed positioning
        setIsFullscreen(true);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle Escape key for fullscreen and full window modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullWindow) setIsFullWindow(false);
        if (isFullscreen && !document.fullscreenElement) setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isFullWindow]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-[#0a0a0f] overflow-hidden',
        (isFullWindow || (isFullscreen && !document.fullscreenElement)) ? 'fixed inset-0 z-50 rounded-none' : 'rounded-lg',
        className
      )}
      style={{
        height: (isFullWindow || isFullscreen) ? '100vh' : '100%',
        width: (isFullWindow || isFullscreen) ? '100vw' : '100%'
      }}
    >
      <SandpackProvider
        template="react"
        theme={neuralTheme}
        files={files}
        customSetup={{
          dependencies: allDependencies,
        }}
        options={{
          recompileMode: autoReload ? 'delayed' : 'immediate',
          recompileDelay: 500,
          autorun: true,
          autoReload: autoReload,
        }}
      >
        {/* Full Window close button */}
        {isFullWindow && (
          <button
            onClick={() => setIsFullWindow(false)}
            className="absolute top-4 right-4 z-20 p-3 bg-black/80 backdrop-blur-sm rounded-full text-white hover:bg-black transition-colors"
            title="Exit Full Window (Esc)"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {/* Fullscreen close button (fallback mode) */}
        {isFullscreen && !document.fullscreenElement && !isFullWindow && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-20 p-3 bg-black/80 backdrop-blur-sm rounded-full text-white hover:bg-black transition-colors"
            title="Exit Fullscreen (Esc)"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {/* Controls */}
        <PreviewControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isFullWindow={isFullWindow}
          onToggleFullWindow={() => setIsFullWindow(!isFullWindow)}
          showConsole={showConsole}
          onToggleConsole={() => setConsoleVisible(!consoleVisible)}
          consoleVisible={consoleVisible}
        />

        {/* Preview Area */}
        <div
          className={cn(
            'w-full transition-all',
            consoleVisible ? 'h-[calc(100%-200px)]' : 'h-full'
          )}
        >
          <ErrorBoundary>
            <SandpackPreview
              showOpenInCodeSandbox={false}
              showRefreshButton={false}
              style={{
                height: '100%',
                border: 'none',
              }}
            />
          </ErrorBoundary>
        </div>

        {/* Console */}
        {consoleVisible && (
          <div className="h-[200px] border-t border-gray-800">
            <SandpackConsole
              style={{
                height: '100%',
              }}
            />
          </div>
        )}
      </SandpackProvider>
    </div>
  );
}

// Export a minimal preview for gallery/cards
export function ReactPlaygroundPreviewMini({
  code,
  dependencies = {},
}: {
  code: string;
  dependencies?: Record<string, string>;
}) {
  const allDependencies = {
    ...DEFAULT_DEPENDENCIES,
    ...dependencies,
  };
  const files = getDefaultFiles(code);

  return (
    <div className="w-full h-48 bg-[#0a0a0f] rounded-lg overflow-hidden pointer-events-none">
      <SandpackProvider
        template="react"
        theme={neuralTheme}
        files={files}
        customSetup={{
          dependencies: allDependencies,
        }}
        options={{
          autorun: true,
          recompileMode: 'immediate',
        }}
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
          style={{
            height: '100%',
            border: 'none',
          }}
        />
      </SandpackProvider>
    </div>
  );
}
