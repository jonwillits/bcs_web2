/**
 * Regularization Functions
 * L1 (Lasso) and L2 (Ridge) regularization penalties
 */

import { RegularizationType, RegularizationConfig } from '../types';

/**
 * Compute regularization penalty for a set of weights
 */
export function computeRegularizationPenalty(
  weights: number[],
  config: RegularizationConfig
): number {
  if (config.type === 'none' || config.rate === 0) {
    return 0;
  }

  let penalty = 0;

  switch (config.type) {
    case 'l1':
      // L1: sum of absolute values
      for (const w of weights) {
        penalty += Math.abs(w);
      }
      break;
    case 'l2':
      // L2: sum of squared values
      for (const w of weights) {
        penalty += w * w;
      }
      // L2 typically uses half the sum of squares
      penalty *= 0.5;
      break;
  }

  return penalty * config.rate;
}

/**
 * Compute regularization gradient for a single weight
 * This is the derivative of the regularization penalty with respect to weight
 */
export function computeRegularizationGradient(
  weight: number,
  config: RegularizationConfig
): number {
  if (config.type === 'none' || config.rate === 0) {
    return 0;
  }

  switch (config.type) {
    case 'l1':
      // Derivative of |w| is sign(w)
      return config.rate * Math.sign(weight);
    case 'l2':
      // Derivative of 0.5 * w^2 is w
      return config.rate * weight;
    default:
      return 0;
  }
}

/**
 * Get regularization display name
 */
export function getRegularizationName(type: RegularizationType): string {
  switch (type) {
    case 'none':
      return 'None';
    case 'l1':
      return 'L1';
    case 'l2':
      return 'L2';
    default:
      return type;
  }
}
