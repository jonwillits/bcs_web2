/**
 * Training Manager
 * Handles training loop, batch processing, and metric tracking
 */

import { NeuralNetwork } from '../nn/network';
import {
  DataPoint,
  TrainingConfig,
  TrainingMetrics,
  FeatureFlags,
} from '../types';
import { computeLoss } from './loss';
import { computeFeatures } from '../data/features';

export class Trainer {
  network: NeuralNetwork;
  trainData: DataPoint[];
  testData: DataPoint[];
  config: TrainingConfig;
  features: FeatureFlags;
  epoch: number = 0;
  private batchIndex: number = 0;
  private shuffledIndices: number[] = [];

  constructor(
    network: NeuralNetwork,
    trainData: DataPoint[],
    testData: DataPoint[],
    config: TrainingConfig,
    features: FeatureFlags
  ) {
    this.network = network;
    this.trainData = trainData;
    this.testData = testData;
    this.config = config;
    this.features = features;
    this.shuffleData();
  }

  /**
   * Compute features for a point
   */
  private getFeatures(x1: number, x2: number): number[] {
    return computeFeatures(x1, x2, this.features);
  }

  /**
   * Shuffle training data indices
   */
  private shuffleData(): void {
    this.shuffledIndices = Array.from({ length: this.trainData.length }, (_, i) => i);
    for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledIndices[i], this.shuffledIndices[j]] =
        [this.shuffledIndices[j], this.shuffledIndices[i]];
    }
    this.batchIndex = 0;
  }

  /**
   * Get next batch of training data
   */
  private getNextBatch(): DataPoint[] {
    const batch: DataPoint[] = [];
    const { batchSize } = this.config;

    for (let i = 0; i < batchSize; i++) {
      const idx = this.shuffledIndices[this.batchIndex];
      batch.push(this.trainData[idx]);
      this.batchIndex++;

      // If we've gone through all data, shuffle and increment epoch
      if (this.batchIndex >= this.trainData.length) {
        this.shuffleData();
        this.epoch++;
      }
    }

    return batch;
  }

  /**
   * Perform one training step (one batch)
   */
  step(): TrainingMetrics {
    const batch = this.getNextBatch();
    const { learningRate, regularization } = this.config;

    // Clear gradients before processing new batch
    this.network.clearGradients();

    // Forward and backward pass for each sample in batch
    for (const point of batch) {
      const features = this.getFeatures(point.x, point.y);
      this.network.forward(features);
      this.network.backward(point.label);
    }

    // Update weights
    this.network.updateWeights(
      learningRate,
      batch.length,
      regularization.type,
      regularization.rate
    );

    // Compute losses after weight update
    // Note: This runs forward pass on all data which updates neuron states,
    // but that's fine since we clear gradients at the start of each step()
    const trainLoss = computeLoss(
      this.network,
      this.trainData,
      (x1, x2) => this.getFeatures(x1, x2)
    );
    const testLoss = computeLoss(
      this.network,
      this.testData,
      (x1, x2) => this.getFeatures(x1, x2)
    );

    return {
      epoch: this.epoch,
      trainLoss,
      testLoss,
    };
  }

  /**
   * Train for multiple steps (one full epoch)
   */
  trainEpoch(): TrainingMetrics {
    const stepsPerEpoch = Math.ceil(this.trainData.length / this.config.batchSize);
    let metrics: TrainingMetrics = { epoch: 0, trainLoss: 0, testLoss: 0 };

    for (let i = 0; i < stepsPerEpoch; i++) {
      metrics = this.step();
    }

    return metrics;
  }

  /**
   * Update training configuration
   */
  updateConfig(config: Partial<TrainingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update feature flags
   */
  updateFeatures(features: FeatureFlags): void {
    this.features = features;
  }

  /**
   * Update training data
   */
  updateData(trainData: DataPoint[], testData: DataPoint[]): void {
    this.trainData = trainData;
    this.testData = testData;
    this.shuffleData();
    this.epoch = 0;
  }

  /**
   * Reset trainer for new training session
   */
  reset(): void {
    this.epoch = 0;
    this.shuffleData();
  }

  /**
   * Get current loss metrics
   */
  getLoss(): { trainLoss: number; testLoss: number } {
    const trainLoss = computeLoss(
      this.network,
      this.trainData,
      (x1, x2) => this.getFeatures(x1, x2)
    );
    const testLoss = computeLoss(
      this.network,
      this.testData,
      (x1, x2) => this.getFeatures(x1, x2)
    );

    return { trainLoss, testLoss };
  }
}

/**
 * Create a trainer instance
 */
export function createTrainer(
  network: NeuralNetwork,
  trainData: DataPoint[],
  testData: DataPoint[],
  learningRate: number,
  batchSize: number,
  regularizationType: 'none' | 'l1' | 'l2',
  regularizationRate: number,
  features: FeatureFlags
): Trainer {
  return new Trainer(network, trainData, testData, {
    learningRate,
    regularization: {
      type: regularizationType,
      rate: regularizationRate,
    },
    batchSize,
  }, features);
}
