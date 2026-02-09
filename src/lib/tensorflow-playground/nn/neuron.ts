/**
 * Neuron Class
 * A single neuron in the neural network
 */

import { ActivationFunction } from '../types';

export class Neuron {
  weights: number[];
  bias: number;
  output: number = 0;
  inputSum: number = 0;
  delta: number = 0;  // Error gradient for backpropagation
  inputs: number[] = [];  // Store inputs for backprop

  // Gradients accumulated during batch training
  weightGradients: number[];
  biasGradient: number = 0;

  constructor(inputSize: number) {
    // Xavier/Glorot initialization
    const scale = Math.sqrt(2.0 / (inputSize + 1));

    this.weights = Array(inputSize)
      .fill(0)
      .map(() => (Math.random() * 2 - 1) * scale);

    this.bias = (Math.random() * 2 - 1) * scale * 0.1;  // Smaller bias init
    this.weightGradients = Array(inputSize).fill(0);
  }

  /**
   * Forward pass: compute neuron output
   */
  forward(inputs: number[], activation: ActivationFunction): number {
    this.inputs = inputs;
    this.inputSum = this.bias;

    for (let i = 0; i < inputs.length; i++) {
      this.inputSum += inputs[i] * this.weights[i];
    }

    this.output = activation.activate(this.inputSum);
    return this.output;
  }

  /**
   * Clear accumulated gradients before a new batch
   */
  clearGradients(): void {
    this.weightGradients.fill(0);
    this.biasGradient = 0;
  }

  /**
   * Accumulate gradients for batch update
   */
  accumulateGradients(): void {
    for (let i = 0; i < this.inputs.length; i++) {
      this.weightGradients[i] += this.delta * this.inputs[i];
    }
    this.biasGradient += this.delta;
  }

  /**
   * Apply accumulated gradients with regularization
   */
  updateWeights(
    learningRate: number,
    batchSize: number,
    regularizationRate: number,
    regularizationType: 'none' | 'l1' | 'l2'
  ): void {
    const scale = learningRate / batchSize;

    for (let i = 0; i < this.weights.length; i++) {
      // Gradient from loss
      let gradient = this.weightGradients[i] * scale;

      // Add regularization gradient (regularization rate is already scaled appropriately)
      if (regularizationType === 'l1' && regularizationRate > 0) {
        gradient += regularizationRate * Math.sign(this.weights[i]) * scale;
      } else if (regularizationType === 'l2' && regularizationRate > 0) {
        gradient += regularizationRate * this.weights[i] * scale;
      }

      this.weights[i] -= gradient;
    }

    this.bias -= this.biasGradient * scale;

    // Reset accumulated gradients
    this.weightGradients.fill(0);
    this.biasGradient = 0;
  }

  /**
   * Reset neuron for new training
   */
  reset(inputSize: number): void {
    const scale = Math.sqrt(2.0 / (inputSize + 1));

    this.weights = Array(inputSize)
      .fill(0)
      .map(() => (Math.random() * 2 - 1) * scale);

    this.bias = (Math.random() * 2 - 1) * scale * 0.1;
    this.weightGradients = Array(inputSize).fill(0);
    this.biasGradient = 0;
    this.output = 0;
    this.inputSum = 0;
    this.delta = 0;
  }
}
