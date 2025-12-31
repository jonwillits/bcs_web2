/**
 * React Playground Type Definitions
 *
 * Types for the Sandpack-based live code preview system.
 * Similar to Claude Artifacts - supports React/JSX with npm dependencies.
 */

// Playground data stored in database
export interface ReactPlaygroundData {
  id: string;
  title: string;
  description: string;
  category: PlaygroundCategory;

  // Code content
  sourceCode: string;

  // npm dependencies (e.g., ['three', '@react-three/fiber'])
  dependencies: string[];

  // Metadata
  createdBy: string;
  isPublic: boolean;
  shareUrl: string;

  // Analytics
  viewCount: number;
  forkCount: number;
  rating?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;

  // Optional template reference
  templateId?: string;
}

// Categories for organizing playgrounds
export type PlaygroundCategory =
  | 'simulations'      // Interactive simulations (Braitenberg, physics)
  | 'visualizations'   // Data visualizations, charts
  | '3d-graphics'      // THREE.js, React Three Fiber
  | 'neural-networks'  // Neural network demos
  | 'algorithms'       // Algorithm visualizations
  | 'ui-components'    // React UI component demos
  | 'tutorials'        // Educational tutorials
  | 'other';           // Miscellaneous

// Template definition for pre-built demos
export interface PlaygroundTemplate {
  id: string;
  name: string;
  description: string;
  category: PlaygroundCategory;

  // Template code
  sourceCode: string;
  dependencies: string[];

  // Display
  thumbnail?: string;
  tags: string[];

  // Metadata
  isPublic: boolean;
  authorId?: string;
}

// Form data for creating/editing playgrounds
export interface PlaygroundFormData {
  title: string;
  description: string;
  category: PlaygroundCategory;
  sourceCode: string;
  dependencies: string[];
  isPublic: boolean;
}

// Sandpack file structure
export interface SandpackFile {
  code: string;
  active?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
}

export interface SandpackFiles {
  [path: string]: SandpackFile | string;
}

// Dependency with version info
export interface NpmDependency {
  name: string;
  version: string;  // 'latest' or specific version
  description?: string;
}

// Curated package suggestions
export interface PackageSuggestion {
  name: string;
  description: string;
  category: 'graphics' | 'animation' | 'charts' | 'utils' | 'ui';
  defaultVersion: string;
}

// Builder state
export interface PlaygroundBuilderState {
  title: string;
  description: string;
  category: PlaygroundCategory;
  sourceCode: string;
  dependencies: Record<string, string>;
  isDirty: boolean;
  lastSaved?: Date;
  autoSaveEnabled: boolean;
}

// Preview state
export interface PlaygroundPreviewState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  isFullscreen: boolean;
}

// API request/response types
export interface CreatePlaygroundRequest {
  title: string;
  description: string;
  category: PlaygroundCategory;
  sourceCode: string;
  dependencies: string[];
  isPublic?: boolean;
  templateId?: string;
}

export interface UpdatePlaygroundRequest {
  title?: string;
  description?: string;
  category?: PlaygroundCategory;
  sourceCode?: string;
  dependencies?: string[];
  isPublic?: boolean;
}

export interface PlaygroundListResponse {
  playgrounds: ReactPlaygroundData[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

// Editor configuration
export interface EditorConfig {
  theme: 'light' | 'dark';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
}

// Default values
export const DEFAULT_SOURCE_CODE = `export default function App() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>Hello, World!</h1>
    </div>
  );
}
`;

export const DEFAULT_DEPENDENCIES: Record<string, string> = {
  'react': '^18.0.0',
  'react-dom': '^18.0.0',
};

export const CATEGORY_LABELS: Record<PlaygroundCategory, string> = {
  'simulations': 'Simulations',
  'visualizations': 'Visualizations',
  '3d-graphics': '3D Graphics',
  'neural-networks': 'Neural Networks',
  'algorithms': 'Algorithms',
  'ui-components': 'UI Components',
  'tutorials': 'Tutorials',
  'other': 'Other',
};

export const CATEGORY_ICONS: Record<PlaygroundCategory, string> = {
  'simulations': 'Cpu',
  'visualizations': 'BarChart3',
  '3d-graphics': 'Box',
  'neural-networks': 'Brain',
  'algorithms': 'GitBranch',
  'ui-components': 'Layout',
  'tutorials': 'GraduationCap',
  'other': 'Folder',
};
