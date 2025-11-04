// Shinylive Template Registry
// All available Shinylive-based playground templates

import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';

// Import templates
import { dataVizFunctionPlotterTemplate } from './data-viz-function-plotter';
import { neuralNetworkPlaygroundTemplate } from './neural-network-playground';
import { sortingAlgorithmVisualizerTemplate } from './sorting-algorithm-visualizer';
import { physicsProjectileMotionTemplate } from './physics-projectile-motion';
import { statisticalDistributionsTemplate } from './statistical-distributions';
import { linearRegressionTemplate } from './linear-regression';
import { monteCarloPiTemplate } from './monte-carlo-pi';
import { fourierSeriesTemplate } from './fourier-series';
import { lorenzAttractorTemplate } from './lorenz-attractor';
import { simplePendulumTemplate } from './simple-pendulum';

/**
 * Shinylive Template Registry
 * Central registry for all Shinylive templates
 */
export const SHINYLIVE_TEMPLATES: Record<string, ShinyliveTemplate> = {
  // Data Visualization
  'data-viz-function-plotter': dataVizFunctionPlotterTemplate,
  'linear-regression': linearRegressionTemplate,
  'statistical-distributions': statisticalDistributionsTemplate,

  // Neural Networks & ML
  'neural-network-playground': neuralNetworkPlaygroundTemplate,

  // Algorithms
  'sorting-algorithm-visualizer': sortingAlgorithmVisualizerTemplate,

  // Physics
  'physics-projectile-motion': physicsProjectileMotionTemplate,
  'simple-pendulum': simplePendulumTemplate,
  'lorenz-attractor': lorenzAttractorTemplate,

  // Mathematics
  'fourier-series': fourierSeriesTemplate,

  // Simulations
  'monte-carlo-pi': monteCarloPiTemplate,
};

/**
 * Get template by ID
 */
export function getShinyliveTemplate(id: string): ShinyliveTemplate | undefined {
  return SHINYLIVE_TEMPLATES[id];
}

/**
 * Get all templates
 */
export function getAllShinyliveTemplates(): ShinyliveTemplate[] {
  return Object.values(SHINYLIVE_TEMPLATES);
}

/**
 * Get templates by category
 */
export function getShinyliveTemplatesByCategory(category: ShinyliveCategory): ShinyliveTemplate[] {
  return getAllShinyliveTemplates().filter(template => template.category === category);
}

/**
 * Search templates by query
 */
export function searchShinyliveTemplates(query: string): ShinyliveTemplate[] {
  const lowerQuery = query.toLowerCase();
  return getAllShinyliveTemplates().filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get template count
 */
export function getShinyliveTemplateCount(): number {
  return Object.keys(SHINYLIVE_TEMPLATES).length;
}

/**
 * Get category counts
 */
export function getShinyliveTemplateCategoryCounts(): Record<ShinyliveCategory, number> {
  const counts: Record<string, number> = {};

  for (const category of Object.values(ShinyliveCategory)) {
    counts[category] = 0;
  }

  for (const template of getAllShinyliveTemplates()) {
    counts[template.category]++;
  }

  return counts as Record<ShinyliveCategory, number>;
}

/**
 * Get featured templates (first 6 for showcase)
 */
export function getFeaturedShinyliveTemplates(): ShinyliveTemplate[] {
  return [
    dataVizFunctionPlotterTemplate,
    neuralNetworkPlaygroundTemplate,
    sortingAlgorithmVisualizerTemplate,
    physicsProjectileMotionTemplate,
    statisticalDistributionsTemplate,
    monteCarloPiTemplate,
  ];
}
