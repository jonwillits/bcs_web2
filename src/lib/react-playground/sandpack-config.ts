/**
 * Sandpack Configuration
 *
 * Configuration for the Sandpack-based React playground.
 * Includes theme, default dependencies, and editor options.
 */

import type { SandpackTheme } from '@codesandbox/sandpack-react';

// Custom theme matching the neural design system
export const neuralTheme: SandpackTheme = {
  colors: {
    surface1: '#0a0a0f',      // Background - matches neural dark
    surface2: '#111118',      // Secondary background
    surface3: '#1a1a22',      // Tertiary background
    clickable: '#888888',     // Interactive elements
    base: '#e0e0e0',          // Primary text
    disabled: '#444444',      // Disabled state
    hover: '#ffffff',         // Hover state
    accent: '#6366f1',        // Neural primary accent
    error: '#ef4444',         // Error state
    errorSurface: '#450a0a',  // Error background
    warning: '#f59e0b',       // Warning state
    warningSurface: '#451a03',// Warning background
  },
  syntax: {
    plain: '#e0e0e0',
    comment: { color: '#6b7280', fontStyle: 'italic' },
    keyword: '#c084fc',       // Purple for keywords
    tag: '#22d3ee',           // Cyan for JSX tags
    punctuation: '#9ca3af',
    definition: '#34d399',    // Green for definitions
    property: '#60a5fa',      // Blue for properties
    static: '#f472b6',        // Pink for static values
    string: '#fcd34d',        // Yellow for strings
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    size: '14px',
    lineHeight: '1.6',
  },
};

// Light theme variant
export const neuralThemeLight: SandpackTheme = {
  colors: {
    surface1: '#ffffff',
    surface2: '#f8fafc',
    surface3: '#f1f5f9',
    clickable: '#64748b',
    base: '#1e293b',
    disabled: '#cbd5e1',
    hover: '#0f172a',
    accent: '#6366f1',
    error: '#ef4444',
    errorSurface: '#fef2f2',
    warning: '#f59e0b',
    warningSurface: '#fffbeb',
  },
  syntax: {
    plain: '#1e293b',
    comment: { color: '#94a3b8', fontStyle: 'italic' },
    keyword: '#7c3aed',
    tag: '#0891b2',
    punctuation: '#64748b',
    definition: '#059669',
    property: '#2563eb',
    static: '#db2777',
    string: '#ca8a04',
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    size: '14px',
    lineHeight: '1.6',
  },
};

// Default dependencies for React playgrounds
export const DEFAULT_DEPENDENCIES: Record<string, string> = {
  'react': '^18.2.0',
  'react-dom': '^18.2.0',
};

// THREE.js dependencies for 3D graphics
export const THREEJS_DEPENDENCIES: Record<string, string> = {
  ...DEFAULT_DEPENDENCIES,
  'three': '^0.160.0',
  '@react-three/fiber': '^8.15.0',
  '@react-three/drei': '^9.92.0',
};

// Animation dependencies
export const ANIMATION_DEPENDENCIES: Record<string, string> = {
  ...DEFAULT_DEPENDENCIES,
  'framer-motion': '^10.16.0',
  'gsap': '^3.12.0',
};

// Chart dependencies
export const CHART_DEPENDENCIES: Record<string, string> = {
  ...DEFAULT_DEPENDENCIES,
  'recharts': '^2.10.0',
  'd3': '^7.8.0',
};

// Curated package suggestions for faculty
export const PACKAGE_SUGGESTIONS = [
  // 3D Graphics
  {
    name: 'three',
    description: 'JavaScript 3D library',
    category: 'graphics' as const,
    defaultVersion: '^0.160.0',
  },
  {
    name: '@react-three/fiber',
    description: 'React renderer for Three.js',
    category: 'graphics' as const,
    defaultVersion: '^8.15.0',
  },
  {
    name: '@react-three/drei',
    description: 'Useful helpers for react-three-fiber',
    category: 'graphics' as const,
    defaultVersion: '^9.92.0',
  },
  // Animation
  {
    name: 'framer-motion',
    description: 'Production-ready motion library',
    category: 'animation' as const,
    defaultVersion: '^10.16.0',
  },
  {
    name: 'gsap',
    description: 'Professional-grade animation library',
    category: 'animation' as const,
    defaultVersion: '^3.12.0',
  },
  {
    name: '@react-spring/web',
    description: 'Spring-physics based animation',
    category: 'animation' as const,
    defaultVersion: '^9.7.0',
  },
  // Charts
  {
    name: 'recharts',
    description: 'Composable charting library',
    category: 'charts' as const,
    defaultVersion: '^2.10.0',
  },
  {
    name: 'd3',
    description: 'Data-Driven Documents',
    category: 'charts' as const,
    defaultVersion: '^7.8.0',
  },
  {
    name: 'victory',
    description: 'React data visualization components',
    category: 'charts' as const,
    defaultVersion: '^37.0.0',
  },
  // Utilities
  {
    name: 'lodash',
    description: 'Utility library',
    category: 'utils' as const,
    defaultVersion: '^4.17.21',
  },
  {
    name: 'uuid',
    description: 'UUID generation',
    category: 'utils' as const,
    defaultVersion: '^9.0.0',
  },
  {
    name: 'date-fns',
    description: 'Modern date utility library',
    category: 'utils' as const,
    defaultVersion: '^3.0.0',
  },
  // UI
  {
    name: 'lucide-react',
    description: 'Beautiful hand-crafted icons',
    category: 'ui' as const,
    defaultVersion: '^0.300.0',
  },
  {
    name: '@radix-ui/react-icons',
    description: 'Radix icon set',
    category: 'ui' as const,
    defaultVersion: '^1.3.0',
  },
];

// Sandpack editor options
export const EDITOR_OPTIONS = {
  showNavigator: false,
  showTabs: false,
  showLineNumbers: true,
  showInlineErrors: true,
  wrapContent: true,
  editorHeight: '100%',
  editorWidthPercentage: 50,
};

// Sandpack preview options
export const PREVIEW_OPTIONS = {
  showOpenInCodeSandbox: false,
  showRefreshButton: true,
  showSandpackErrorOverlay: true,
};

// Default App.js template
export const DEFAULT_APP_CODE = `export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        Hello, World!
      </h1>
      <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
        Start editing to see changes in real-time
      </p>
    </div>
  );
}
`;

// File structure for Sandpack
export const getDefaultFiles = (appCode: string = DEFAULT_APP_CODE) => ({
  '/App.js': {
    code: appCode,
    active: true,
  },
  '/index.js': {
    code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    hidden: true,
  },
  '/styles.css': {
    code: `/* Reset to remove white border */
html, body, #root {
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}
`,
    hidden: true,
  },
  '/public/index.html': {
    code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Playground</title>
    <style>
      /* Reset to remove white border - runs inside iframe */
      html, body, #root {
        margin: 0 !important;
        padding: 0 !important;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
    hidden: true,
  },
});

// Convert dependencies array to Sandpack format
export const arrayToDependencies = (deps: string[]): Record<string, string> => {
  const result: Record<string, string> = { ...DEFAULT_DEPENDENCIES };

  deps.forEach(dep => {
    // Check if it's in our suggestions
    const suggestion = PACKAGE_SUGGESTIONS.find(p => p.name === dep);
    result[dep] = suggestion?.defaultVersion || 'latest';
  });

  return result;
};

// Convert Sandpack dependencies to array
export const dependenciesToArray = (deps: Record<string, string>): string[] => {
  return Object.keys(deps).filter(
    dep => dep !== 'react' && dep !== 'react-dom'
  );
};
