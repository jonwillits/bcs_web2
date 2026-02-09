/**
 * Loss Functions
 * MSE and regularization loss calculations
 */

import { DataPoint, RegularizationConfig } from '../types';
import { NeuralNetwork } from '../nn/network';
import { computeRegularizationPenalty } from '../nn/regularization';

/**
 * Mean Squared Error loss
 * Works for both classification (labels -1, 1) and regression
 */
export function mse(predictions: number[], targets: number[]): number {
  if (predictions.length !== targets.length) {
    throw new Error('Predictions and targets must have same length');
  }

  let sum = 0;
  for (let i = 0; i < predictions.length; i++) {
    const diff = predictions[i] - targets[i];
    sum += diff * diff;
  }

  return sum / (2 * predictions.length);
}

/**
 * Compute loss for a dataset
 */
export function computeLoss(
  network: NeuralNetwork,
  data: DataPoint[],
  computeFeatures: (x1: number, x2: number) => number[]
): number {
  if (data.length === 0) return 0;

  const predictions: number[] = [];
  const targets: number[] = [];

  for (const point of data) {
    const features = computeFeatures(point.x, point.y);

    // Validate feature dimension matches network input size
    if (features.length !== network.config.inputSize) {
      // Return safe fallback for dimension mismatch (e.g., during feature toggling)
      return 0;
    }

    const prediction = network.forward(features);

    // Check for NaN and return safe value if detected
    if (isNaN(prediction)) {
      return 0;
    }

    predictions.push(prediction);
    targets.push(point.label);
  }

  const loss = mse(predictions, targets);

  // Guard against NaN in final loss
  return isNaN(loss) ? 0 : loss;
}

/**
 * Compute loss with regularization penalty
 */
export function computeTotalLoss(
  network: NeuralNetwork,
  data: DataPoint[],
  computeFeatures: (x1: number, x2: number) => number[],
  regularization: RegularizationConfig
): number {
  const dataLoss = computeLoss(network, data, computeFeatures);

  // Add regularization penalty
  if (regularization.type !== 'none' && regularization.rate > 0) {
    let regPenalty = 0;
    for (const layer of network.layers) {
      for (const neuron of layer) {
        regPenalty += computeRegularizationPenalty(neuron.weights, regularization);
      }
    }
    return dataLoss + regPenalty;
  }

  return dataLoss;
}

/**
 * Classification accuracy (for display purposes)
 */
export function computeAccuracy(
  network: NeuralNetwork,
  data: DataPoint[],
  computeFeatures: (x1: number, x2: number) => number[]
): number {
  if (data.length === 0) return 0;

  let correct = 0;
  for (const point of data) {
    const features = computeFeatures(point.x, point.y);
    const prediction = network.forward(features);
    const predictedLabel = prediction >= 0 ? 1 : -1;
    if (predictedLabel === Math.sign(point.label)) {
      correct++;
    }
  }

  return correct / data.length;
}
