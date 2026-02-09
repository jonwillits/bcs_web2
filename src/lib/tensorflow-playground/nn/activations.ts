/**
 * Activation Functions
 * Implementations for ReLU, Tanh, Sigmoid, and Linear activations
 */

import { ActivationType, ActivationFunction } from '../types';

/**
 * ReLU (Rectified Linear Unit)
 * f(x) = max(0, x)
 * Popular for hidden layers due to avoiding vanishing gradient
 */
const relu: ActivationFunction = {
  activate: (x: number): number => Math.max(0, x),
  derivative: (output: number): number => output > 0 ? 1 : 0,
};

/**
 * Tanh (Hyperbolic Tangent)
 * f(x) = tanh(x) = (e^x - e^-x) / (e^x + e^-x)
 * Output range: (-1, 1), zero-centered
 */
const tanh: ActivationFunction = {
  activate: (x: number): number => Math.tanh(x),
  derivative: (output: number): number => 1 - output * output,
};

/**
 * Sigmoid (Logistic)
 * f(x) = 1 / (1 + e^-x)
 * Output range: (0, 1), useful for probability outputs
 */
const sigmoid: ActivationFunction = {
  activate: (x: number): number => 1 / (1 + Math.exp(-x)),
  derivative: (output: number): number => output * (1 - output),
};

/**
 * Linear (Identity)
 * f(x) = x
 * Used for output layer in regression tasks
 */
const linear: ActivationFunction = {
  activate: (x: number): number => x,
  derivative: (): number => 1,
};

/**
 * Get activation function by type
 */
export function getActivation(type: ActivationType): ActivationFunction {
  switch (type) {
    case 'relu':
      return relu;
    case 'tanh':
      return tanh;
    case 'sigmoid':
      return sigmoid;
    case 'linear':
      return linear;
    default:
      throw new Error(`Unknown activation type: ${type}`);
  }
}

/**
 * Get activation display name
 */
export function getActivationName(type: ActivationType): string {
  switch (type) {
    case 'relu':
      return 'ReLU';
    case 'tanh':
      return 'Tanh';
    case 'sigmoid':
      return 'Sigmoid';
    case 'linear':
      return 'Linear';
    default:
      return type;
  }
}

export { relu, tanh, sigmoid, linear };
