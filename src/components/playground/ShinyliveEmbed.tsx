"use client";

import { useState, useEffect, useMemo } from 'react';
import { compressToEncodedURIComponent } from 'lz-string';

interface ShinyliveEmbedProps {
  /**
   * The source code of the Shiny app (app.py content)
   */
  sourceCode: string;

  /**
   * Required Python packages
   */
  requirements?: string[];

  /**
   * Height of the iframe
   */
  height?: string | number;

  /**
   * Width of the iframe
   */
  width?: string | number;

  /**
   * App title
   */
  title?: string;

  /**
   * Loading message
   */
  loadingMessage?: string;
}

/**
 * ShinyliveEmbed Component
 *
 * Embeds a Shinylive app (Shiny for Python running in browser via WebAssembly)
 * into a Next.js application using an iframe.
 *
 * HOW IT WORKS:
 * 1. Shinylive uses WebAssembly (Pyodide) to run Python directly in the browser
 * 2. No server required - everything runs client-side
 * 3. Apps are embedded via iframe with encoded source code
 *
 * USAGE:
 * ```tsx
 * <ShinyliveEmbed
 *   sourceCode={appCode}
 *   requirements={['plotly', 'numpy']}
 *   height={600}
 * />
 * ```
 */
export function ShinyliveEmbed({
  sourceCode,
  requirements = [],
  height = 600,
  width = '100%',
  title,
  loadingMessage = 'Loading interactive demo...'
}: ShinyliveEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shinylive app URL (hosted on shinylive.io) - using app mode instead of editor mode
  // App mode directly loads the app without showing the editor interface
  const SHINYLIVE_APP_URL = 'https://shinylive.io/py/app/';

  /**
   * Generate Shinylive URL with embedded code (memoized)
   *
   * The URL format is:
   * https://shinylive.io/py/app/#code=<lz_compressed_code>
   *
   * IMPORTANT: Shinylive requires LZ-string compression (compressToEncodedURIComponent)
   * not base64 encoding. Using 'app' mode instead of 'editor' mode ensures
   * the correct code loads without Shinylive's default template interfering.
   */
  const shinyliveUrl = useMemo(() => {
    try {
      console.log('[ShinyliveEmbed] Generating URL with sourceCode:', {
        length: sourceCode.length,
        preview: sourceCode.substring(0, 100),
        requirements
      });

      // Create app bundle structure (Shinylive expects an array of files)
      const appBundle = [
        {
          name: 'app.py',
          content: sourceCode,
          type: 'text'
        }
      ];

      // Add requirements.txt if packages specified
      if (requirements.length > 0) {
        appBundle.push({
          name: 'requirements.txt',
          content: requirements.join('\n'),
          type: 'text'
        });
      }

      // Encode app bundle using LZ-string compression (required by Shinylive)
      const bundleStr = JSON.stringify(appBundle);
      console.log('[ShinyliveEmbed] Bundle structure:', appBundle);

      const encoded = compressToEncodedURIComponent(bundleStr);
      console.log('[ShinyliveEmbed] LZ-compressed length:', encoded.length);

      // Return full URL with cache-busting parameter
      // Using app mode for direct execution instead of editor mode
      const url = `${SHINYLIVE_APP_URL}#code=${encoded}`;
      console.log('[ShinyliveEmbed] Generated URL:', url.substring(0, 150) + '...');

      return url;

    } catch (err) {
      console.error('[ShinyliveEmbed] Error generating URL:', err);
      setError('Failed to generate app URL');
      return '';
    }
  }, [sourceCode, requirements]);

  useEffect(() => {
    // Simulate loading delay (Shinylive apps take time to initialize)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-8"
           style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Demo</div>
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="shinylive-embed-container relative" style={{ width }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg z-10"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">{loadingMessage}</div>
            <div className="text-gray-400 text-sm mt-2">Initializing Python runtime...</div>
          </div>
        </div>
      )}

      {/* Shinylive Iframe */}
      <iframe
        src={shinyliveUrl}
        title={title || 'Interactive Playground'}
        width="100%"
        height={typeof height === 'number' ? `${height}px` : height}
        className="border border-gray-300 rounded-lg"
        sandbox="allow-scripts allow-same-origin allow-downloads"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
      />

      {/* Info Banner */}
      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          Powered by Shinylive - Python running in your browser (no server required)
        </span>
      </div>
    </div>
  );
}

/**
 * Example Usage:
 *
 * ```tsx
 * const exampleApp = `
 * from shiny import App, ui, render
 *
 * app_ui = ui.page_fluid(
 *     ui.input_slider("n", "N", 0, 100, 20),
 *     ui.output_text_verbatim("txt")
 * )
 *
 * def server(input, output, session):
 *     @output
 *     @render.text
 *     def txt():
 *         return f"n*2 is {input.n() * 2}"
 *
 * app = App(app_ui, server)
 * `;
 *
 * <ShinyliveEmbed
 *   sourceCode={exampleApp}
 *   title="Simple Interactive Demo"
 *   height={500}
 * />
 * ```
 */
