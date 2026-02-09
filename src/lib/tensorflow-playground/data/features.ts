/**
 * Feature Transformations
 * Convert raw x, y coordinates into feature vectors
 */

import { FeatureFlags } from '../types';

/**
 * Compute feature vector from coordinates based on enabled features
 */
export function computeFeatures(
  x1: number,
  x2: number,
  enabledFeatures: FeatureFlags
): number[] {
  const features: number[] = [];

  // Normalize coordinates to roughly [-1, 1] range
  const nx1 = x1 / 5;
  const nx2 = x2 / 5;

  if (enabledFeatures.x1) {
    features.push(nx1);
  }
  if (enabledFeatures.x2) {
    features.push(nx2);
  }
  if (enabledFeatures.x1Sq) {
    features.push(nx1 * nx1);
  }
  if (enabledFeatures.x2Sq) {
    features.push(nx2 * nx2);
  }
  if (enabledFeatures.x1x2) {
    features.push(nx1 * nx2);
  }
  if (enabledFeatures.sinX1) {
    features.push(Math.sin(x1));
  }
  if (enabledFeatures.sinX2) {
    features.push(Math.sin(x2));
  }

  return features;
}

/**
 * Create a feature computation function with bound feature flags
 */
export function createFeatureComputer(
  enabledFeatures: FeatureFlags
): (x1: number, x2: number) => number[] {
  return (x1: number, x2: number) => computeFeatures(x1, x2, enabledFeatures);
}

/**
 * Count number of enabled features
 */
export function countEnabledFeatures(features: FeatureFlags): number {
  let count = 0;
  if (features.x1) count++;
  if (features.x2) count++;
  if (features.x1Sq) count++;
  if (features.x2Sq) count++;
  if (features.x1x2) count++;
  if (features.sinX1) count++;
  if (features.sinX2) count++;
  return count;
}

/**
 * Get ordered list of enabled feature names
 */
export function getEnabledFeatureNames(features: FeatureFlags): string[] {
  const names: string[] = [];
  if (features.x1) names.push('X₁');
  if (features.x2) names.push('X₂');
  if (features.x1Sq) names.push('X₁²');
  if (features.x2Sq) names.push('X₂²');
  if (features.x1x2) names.push('X₁X₂');
  if (features.sinX1) names.push('sin(X₁)');
  if (features.sinX2) names.push('sin(X₂)');
  return names;
}

/**
 * Feature metadata for UI
 */
export interface FeatureInfo {
  key: keyof FeatureFlags;
  label: string;
  shortLabel: string;
  tooltip: string;
}

export const FEATURE_INFO: FeatureInfo[] = [
  { key: 'x1', label: 'X₁', shortLabel: 'X₁', tooltip: 'Raw X₁ input coordinate' },
  { key: 'x2', label: 'X₂', shortLabel: 'X₂', tooltip: 'Raw X₂ input coordinate' },
  { key: 'x1Sq', label: 'X₁²', shortLabel: 'X₁²', tooltip: 'X₁ squared (polynomial)' },
  { key: 'x2Sq', label: 'X₂²', shortLabel: 'X₂²', tooltip: 'X₂ squared (polynomial)' },
  { key: 'x1x2', label: 'X₁X₂', shortLabel: 'X₁X₂', tooltip: 'X₁ times X₂ (interaction)' },
  { key: 'sinX1', label: 'sin(X₁)', shortLabel: 'sin', tooltip: 'Sine of X₁ (trigonometric)' },
  { key: 'sinX2', label: 'sin(X₂)', shortLabel: 'sin', tooltip: 'Sine of X₂ (trigonometric)' },
];
