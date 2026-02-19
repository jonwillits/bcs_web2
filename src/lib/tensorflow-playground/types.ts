/**
 * TensorFlow Playground Types
 * Core TypeScript interfaces for the neural network playground
 */

// ============================================================================
// Activation Functions
// ============================================================================

export type ActivationType = 'relu' | 'tanh' | 'sigmoid' | 'linear';

export interface ActivationFunction {
  activate: (x: number) => number;
  derivative: (output: number) => number;
}

// ============================================================================
// Regularization
// ============================================================================

export type RegularizationType = 'none' | 'l1' | 'l2';

export interface RegularizationConfig {
  type: RegularizationType;
  rate: number;
}

// ============================================================================
// Dataset
// ============================================================================

export type DatasetType = 'circle' | 'xor' | 'gaussian' | 'spiral' | 'plane' | 'gaussianReg';

export interface DataPoint {
  x: number;  // x1 coordinate (-6 to 6)
  y: number;  // x2 coordinate (-6 to 6)
  label: number;  // Classification: -1 or 1, Regression: continuous
}

export interface Dataset {
  train: DataPoint[];
  test: DataPoint[];
}

// ============================================================================
// Features
// ============================================================================

export interface FeatureFlags {
  x1: boolean;
  x2: boolean;
  x1Sq: boolean;
  x2Sq: boolean;
  x1x2: boolean;
  sinX1: boolean;
  sinX2: boolean;
}

/** Default feature toggle state. Only X₁ and X₂ are enabled initially. */
export const DEFAULT_FEATURES: FeatureFlags = {
  x1: true,
  x2: true,
  x1Sq: false,
  x2Sq: false,
  x1x2: false,
  sinX1: false,
  sinX2: false,
};

// ============================================================================
// Network Configuration
// ============================================================================

export interface NetworkConfig {
  inputSize: number;
  hiddenLayers: number[];  // e.g., [4, 2] = 2 hidden layers with 4 and 2 neurons
  outputSize: number;  // 1 for binary classification/regression
  activation: ActivationType;
}

// ============================================================================
// Training Configuration
// ============================================================================

export interface TrainingConfig {
  learningRate: number;
  regularization: RegularizationConfig;
  batchSize: number;
}

// ============================================================================
// Training Metrics
// ============================================================================

export interface TrainingMetrics {
  epoch: number;
  trainLoss: number;
  testLoss: number;
}

export interface LossHistoryPoint {
  epoch: number;
  trainLoss: number;
  testLoss: number;
}

// ============================================================================
// Network State (for visualization)
// ============================================================================

export interface NetworkState {
  weights: number[][][];  // [layer][neuron][weight]
  biases: number[][];     // [layer][neuron]
  activations: number[][]; // [layer][neuron] - output values
}

// ============================================================================
// Playground State
// ============================================================================

export interface HoveredNode {
  layerIndex: number;  // Index into hidden layers (0 = first hidden layer)
  neuronIndex: number;
}

export interface PlaygroundState {
  // Network configuration
  hiddenLayers: number[];
  activation: ActivationType;

  // Training configuration
  learningRate: number;
  regularization: RegularizationType;
  regularizationRate: number;
  batchSize: number;

  // Data configuration
  dataset: DatasetType;
  noise: number;  // 0-50
  trainRatio: number;  // 10-90

  // Input features
  features: FeatureFlags;

  // Runtime state
  epoch: number;
  trainLoss: number;
  testLoss: number;
  isRunning: boolean;

  // Network state for visualization
  networkState: NetworkState | null;

  // Loss history for chart
  lossHistory: LossHistoryPoint[];

  // Data points
  trainData: DataPoint[];
  testData: DataPoint[];

  // Hover state for neuron preview
  hoveredNode: HoveredNode | null;
}

// ============================================================================
// Playground Actions
// ============================================================================

export type PlaygroundAction =
  | { type: 'SET_HIDDEN_LAYERS'; layers: number[] }
  | { type: 'SET_ACTIVATION'; activation: ActivationType }
  | { type: 'SET_LEARNING_RATE'; rate: number }
  | { type: 'SET_REGULARIZATION'; regularization: RegularizationType }
  | { type: 'SET_REGULARIZATION_RATE'; rate: number }
  | { type: 'SET_BATCH_SIZE'; size: number }
  | { type: 'SET_DATASET'; dataset: DatasetType }
  | { type: 'SET_NOISE'; noise: number }
  | { type: 'SET_TRAIN_RATIO'; ratio: number }
  | { type: 'TOGGLE_FEATURE'; feature: keyof FeatureFlags }
  | { type: 'SET_RUNNING'; isRunning: boolean }
  | { type: 'UPDATE_METRICS'; metrics: TrainingMetrics }
  | { type: 'UPDATE_NETWORK_STATE'; state: NetworkState }
  | { type: 'ADD_LOSS_HISTORY'; point: LossHistoryPoint }
  | { type: 'SET_DATA'; trainData: DataPoint[]; testData: DataPoint[] }
  | { type: 'RESET_NETWORK' }
  | { type: 'RESET_TRAINING' }
  | { type: 'ADD_LAYER' }
  | { type: 'REMOVE_LAYER' }
  | { type: 'ADD_NEURON'; layerIndex: number }
  | { type: 'REMOVE_NEURON'; layerIndex: number }
  | { type: 'SET_HOVERED_NODE'; node: HoveredNode | null };

// ============================================================================
// Preset Values
// ============================================================================

/** Available learning rate options for the dropdown. Default selection is 0.03. */
export const LEARNING_RATES = [
  0.00001, 0.0001, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10
];

/** Available regularization rate options for the dropdown. Default selection is 0 (no regularization). */
export const REGULARIZATION_RATES = [
  0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10
];

/** Available batch size options for the dropdown. Default selection is 10. */
export const BATCH_SIZES = [1, 10, 20, 30];

// ============================================================================
// Initial State
// ============================================================================

/**
 * Initial playground state used when the page first loads.
 * Defines defaults for network architecture, training parameters, dataset, and features.
 * Modify these values to change what users see when they first visit the playground.
 */
export const INITIAL_STATE: PlaygroundState = {
  hiddenLayers: [4, 2],
  activation: 'tanh',
  learningRate: 0.03,
  regularization: 'none',
  regularizationRate: 0,
  batchSize: 10,
  dataset: 'circle',
  noise: 0,
  trainRatio: 50,
  features: { ...DEFAULT_FEATURES },
  epoch: 0,
  trainLoss: 0.5,
  testLoss: 0.5,
  isRunning: false,
  networkState: null,
  lossHistory: [],
  trainData: [],
  testData: [],
  hoveredNode: null,
};
