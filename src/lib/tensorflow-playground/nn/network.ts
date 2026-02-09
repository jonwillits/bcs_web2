/**
 * Neural Network Class
 * Full neural network implementation with forward/backward propagation
 */

import { Neuron } from './neuron';
import { getActivation } from './activations';
import {
  NetworkConfig,
  RegularizationType,
  ActivationType,
  NetworkState,
} from '../types';

export class NeuralNetwork {
  layers: Neuron[][];
  config: NetworkConfig;

  constructor(config: NetworkConfig) {
    this.config = config;
    this.layers = [];
    this.buildNetwork();
  }

  /**
   * Build the network architecture
   */
  private buildNetwork(): void {
    this.layers = [];
    const { inputSize, hiddenLayers, outputSize } = this.config;

    // Track input size for each layer
    let prevSize = inputSize;

    // Create hidden layers
    for (const layerSize of hiddenLayers) {
      const layer: Neuron[] = [];
      for (let i = 0; i < layerSize; i++) {
        layer.push(new Neuron(prevSize));
      }
      this.layers.push(layer);
      prevSize = layerSize;
    }

    // Create output layer
    const outputLayer: Neuron[] = [];
    for (let i = 0; i < outputSize; i++) {
      outputLayer.push(new Neuron(prevSize));
    }
    this.layers.push(outputLayer);
  }

  /**
   * Forward propagation
   * @param input Input feature vector
   * @returns Network output
   */
  forward(input: number[]): number {
    // Validate input dimension matches network configuration
    if (input.length !== this.config.inputSize) {
      // Return 0 for dimension mismatch to prevent NaN
      return 0;
    }

    const activation = getActivation(this.config.activation);
    let currentInput = input;

    // Pass through all hidden layers
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layerOutput: number[] = [];
      for (const neuron of this.layers[i]) {
        layerOutput.push(neuron.forward(currentInput, activation));
      }
      currentInput = layerOutput;
    }

    // Output layer uses tanh for bounded output in [-1, 1]
    const outputActivation = getActivation('tanh');
    const outputNeuron = this.layers[this.layers.length - 1][0];
    return outputNeuron.forward(currentInput, outputActivation);
  }

  /**
   * Backward propagation
   * @param target Target value (-1 or 1 for classification)
   */
  backward(target: number): void {
    const activation = getActivation(this.config.activation);
    const outputActivation = getActivation('tanh');

    // Compute output layer delta
    const outputLayer = this.layers[this.layers.length - 1];
    const outputNeuron = outputLayer[0];

    // MSE derivative: dL/dOutput = d/dOutput (0.5 * (target - output)^2) = -(target - output) = output - target
    // For gradient descent: w -= lr * dL/dw, so we use (output - target) as the error signal
    const outputError = outputNeuron.output - target;
    outputNeuron.delta = outputError * outputActivation.derivative(outputNeuron.output);
    outputNeuron.accumulateGradients();

    // Backpropagate through hidden layers (from last to first)
    for (let l = this.layers.length - 2; l >= 0; l--) {
      const layer = this.layers[l];
      const nextLayer = this.layers[l + 1];

      for (let i = 0; i < layer.length; i++) {
        const neuron = layer[i];

        // Sum of weighted deltas from next layer
        let errorSum = 0;
        for (const nextNeuron of nextLayer) {
          errorSum += nextNeuron.delta * nextNeuron.weights[i];
        }

        neuron.delta = errorSum * activation.derivative(neuron.output);
        neuron.accumulateGradients();
      }
    }
  }

  /**
   * Clear accumulated gradients for all neurons
   * Should be called at the start of each training batch
   */
  clearGradients(): void {
    for (const layer of this.layers) {
      for (const neuron of layer) {
        neuron.clearGradients();
      }
    }
  }

  /**
   * Update weights after batch
   */
  updateWeights(
    learningRate: number,
    batchSize: number,
    regularizationType: RegularizationType,
    regularizationRate: number
  ): void {
    for (const layer of this.layers) {
      for (const neuron of layer) {
        neuron.updateWeights(
          learningRate,
          batchSize,
          regularizationRate,
          regularizationType
        );
      }
    }
  }

  /**
   * Get all weights for visualization
   */
  getWeights(): number[][][] {
    return this.layers.map((layer) =>
      layer.map((neuron) => [...neuron.weights])
    );
  }

  /**
   * Get all biases
   */
  getBiases(): number[][] {
    return this.layers.map((layer) =>
      layer.map((neuron) => neuron.bias)
    );
  }

  /**
   * Get all activations (outputs) for visualization
   */
  getActivations(): number[][] {
    return this.layers.map((layer) =>
      layer.map((neuron) => neuron.output)
    );
  }

  /**
   * Get full network state for visualization
   */
  getState(): NetworkState {
    return {
      weights: this.getWeights(),
      biases: this.getBiases(),
      activations: this.getActivations(),
    };
  }

  /**
   * Reset network with new random weights
   */
  reset(): void {
    let prevSize = this.config.inputSize;

    for (let l = 0; l < this.layers.length; l++) {
      for (const neuron of this.layers[l]) {
        neuron.reset(prevSize);
      }
      prevSize = this.layers[l].length;
    }
  }

  /**
   * Reconfigure network with new architecture
   */
  reconfigure(config: NetworkConfig): void {
    this.config = config;
    this.buildNetwork();
  }

  /**
   * Get input size for a specific layer
   */
  getInputSizeForLayer(layerIndex: number): number {
    if (layerIndex === 0) {
      return this.config.inputSize;
    }
    return this.layers[layerIndex - 1].length;
  }

  /**
   * Compute heatmap value for a position
   * Returns the network output for that point
   */
  computeHeatmapValue(x1: number, x2: number, computeFeatures: (x1: number, x2: number) => number[]): number {
    const features = computeFeatures(x1, x2);
    return this.forward(features);
  }

  /**
   * Forward propagation up to a specific neuron
   * Returns the output of the specified neuron
   * @param input Input feature vector
   * @param layerIndex Index of the layer (0 = first hidden layer)
   * @param neuronIndex Index of the neuron within that layer
   * @returns Output of the specified neuron
   */
  forwardToNode(input: number[], layerIndex: number, neuronIndex: number): number {
    const activation = getActivation(this.config.activation);
    let currentInput = input;

    // Pass through layers up to and including the target layer
    for (let i = 0; i <= layerIndex && i < this.layers.length; i++) {
      const layerOutput: number[] = [];
      for (const neuron of this.layers[i]) {
        layerOutput.push(neuron.forward(currentInput, activation));
      }

      // If this is the target layer, return the specific neuron's output
      if (i === layerIndex) {
        return this.layers[i][neuronIndex]?.output ?? 0;
      }

      currentInput = layerOutput;
    }

    return 0;
  }
}

/**
 * Create a new neural network with the given configuration
 */
export function createNetwork(
  inputSize: number,
  hiddenLayers: number[],
  activation: ActivationType
): NeuralNetwork {
  return new NeuralNetwork({
    inputSize,
    hiddenLayers,
    outputSize: 1,
    activation,
  });
}
