'use client';

/**
 * PlaygroundViewerClient
 *
 * Client component wrapper for displaying playground previews.
 * Handles the dynamic import with ssr: false for Sandpack.
 */

import dynamic from 'next/dynamic';

// Lazy load the preview component (Sandpack doesn't support SSR)
const ReactPlaygroundPreview = dynamic(
  () => import('@/components/react-playground/ReactPlaygroundPreview'),
  {
    loading: () => (
      <div className="bg-[#0a0a0f] rounded-lg p-12 text-center min-h-[500px] flex items-center justify-center">
        <div>
          <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading playground...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

interface PlaygroundViewerClientProps {
  code: string;
  dependencies: Record<string, string>;
  showConsole?: boolean;
  className?: string;
}

export default function PlaygroundViewerClient({
  code,
  dependencies,
  showConsole = true,
  className,
}: PlaygroundViewerClientProps) {
  return (
    <ReactPlaygroundPreview
      code={code}
      dependencies={dependencies}
      showConsole={showConsole}
      className={className}
    />
  );
}
