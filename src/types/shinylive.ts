// Shinylive Template Type Definitions
// Simplified types for Shinylive-based playgrounds

export enum ShinyliveCategory {
  DATA_VIZ = 'data_viz',
  NEURAL_NETWORKS = 'neural_networks',
  ALGORITHMS = 'algorithms',
  PHYSICS = 'physics',
  BIOLOGY = 'biology',
  MATHEMATICS = 'mathematics',
  SIMULATIONS = 'simulations',
  CUSTOM = 'custom',
}

/**
 * Shinylive Template
 * Much simpler than legacy PlaygroundTemplate - Shiny handles UI internally
 */
export interface ShinyliveTemplate {
  id: string;
  name: string;
  description: string;
  category: ShinyliveCategory;
  thumbnail?: string;

  // The complete Shiny app.py source code
  sourceCode: string;

  // Required Python packages (e.g., ['plotly', 'numpy', 'scikit-learn'])
  requirements: string[];

  // Metadata
  author?: string;
  version: string;
  tags: string[];

  // Preview/demo data
  previewImage?: string;
  features?: string[]; // List of key features for UI display
}

/**
 * Shinylive Playground Instance
 * A playground created from a template or from scratch
 */
export interface ShinylivePlayground {
  id: string;
  title: string;
  description: string;
  category: ShinyliveCategory;

  // Ownership & Permissions
  createdBy: string; // Faculty user ID
  organizationId?: string;
  isPublic: boolean;
  shareUrl: string;

  // Template reference
  templateId?: string;

  // The actual Shiny app code
  sourceCode: string;
  requirements: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  version: number;

  // Analytics
  viewCount: number;
  forkCount: number;
  rating?: number;
}
