/**
 * TensorFlow Playground Library
 * Main exports
 */

// Types
export * from './types';

// Neural Network
export { NeuralNetwork, createNetwork } from './nn/network';
export { Neuron } from './nn/neuron';
export { getActivation, getActivationName } from './nn/activations';
export {
  computeRegularizationPenalty,
  computeRegularizationGradient,
  getRegularizationName,
} from './nn/regularization';

// Data
export {
  generateCircle,
  generateXOR,
  generateGaussian,
  generateSpiral,
  generatePlane,
  generateGaussianRegression,
  generateDataset,
  splitData,
  generateFullDataset,
  isRegressionDataset,
  getDatasetName,
} from './data/datasets';

export {
  computeFeatures,
  createFeatureComputer,
  countEnabledFeatures,
  getEnabledFeatureNames,
  FEATURE_INFO,
} from './data/features';

// Training
export { Trainer, createTrainer } from './training/trainer';
export { mse, computeLoss, computeTotalLoss, computeAccuracy } from './training/loss';
