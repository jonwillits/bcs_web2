/**
 * Dataset Generators
 * Generate synthetic datasets for classification and regression
 */

import { DataPoint, DatasetType, Dataset } from '../types';

/**
 * Add Gaussian noise to a value
 */
function addNoise(value: number, noiseLevel: number): number {
  if (noiseLevel === 0) return value;
  const noise = (Math.random() * 2 - 1) * noiseLevel * 0.5;
  return value + noise;
}

/**
 * Generate random point in range [-6, 6]
 */
function randomCoord(): number {
  return (Math.random() * 2 - 1) * 5;
}

/**
 * Shuffle array in place
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Circle dataset (classification)
 * Points inside radius get label 1, outside get label -1
 */
export function generateCircle(n: number, noise: number): DataPoint[] {
  const points: DataPoint[] = [];
  const radius = 3;

  for (let i = 0; i < n; i++) {
    const r = Math.random() < 0.5
      ? Math.random() * radius * 0.5  // Inner circle
      : radius + Math.random() * (5 - radius);  // Outer ring

    const angle = Math.random() * Math.PI * 2;
    const x = addNoise(r * Math.cos(angle), noise);
    const y = addNoise(r * Math.sin(angle), noise);

    // Original radius determines label
    const label = r < radius ? 1 : -1;

    points.push({ x, y, label });
  }

  return shuffle(points);
}

/**
 * XOR dataset (classification)
 * Classic non-linearly separable problem
 */
export function generateXOR(n: number, noise: number): DataPoint[] {
  const points: DataPoint[] = [];

  for (let i = 0; i < n; i++) {
    const x = randomCoord();
    const y = randomCoord();

    // XOR: positive when signs are different
    const label = (x * y >= 0) ? -1 : 1;

    points.push({
      x: addNoise(x, noise),
      y: addNoise(y, noise),
      label,
    });
  }

  return shuffle(points);
}

/**
 * Gaussian clusters dataset (classification)
 * Two overlapping Gaussian distributions
 */
export function generateGaussian(n: number, noise: number): DataPoint[] {
  const points: DataPoint[] = [];
  const spread = 1 + noise * 0.05;

  for (let i = 0; i < n; i++) {
    const isPositive = Math.random() < 0.5;
    const centerX = isPositive ? 2 : -2;
    const centerY = isPositive ? 2 : -2;

    // Box-Muller transform for Gaussian distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const r = Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;

    const x = centerX + r * Math.cos(theta) * spread;
    const y = centerY + r * Math.sin(theta) * spread;
    const label = isPositive ? 1 : -1;

    points.push({ x, y, label });
  }

  return shuffle(points);
}

/**
 * Spiral dataset (classification)
 * Two interleaved spirals - very challenging for simple networks
 */
export function generateSpiral(n: number, noise: number): DataPoint[] {
  const points: DataPoint[] = [];
  const halfN = Math.floor(n / 2);

  for (let i = 0; i < n; i++) {
    const isPositive = i < halfN;
    const idx = isPositive ? i : i - halfN;
    const radius = (idx / halfN) * 5;
    const baseAngle = (idx / halfN) * Math.PI * 3;
    const angle = isPositive ? baseAngle : baseAngle + Math.PI;

    const x = addNoise(radius * Math.cos(angle), noise);
    const y = addNoise(radius * Math.sin(angle), noise);
    const label = isPositive ? 1 : -1;

    points.push({ x, y, label });
  }

  return shuffle(points);
}

/**
 * Plane dataset (regression)
 * Linear relationship: z = x + y
 */
export function generatePlane(n: number, noise: number): DataPoint[] {
  const points: DataPoint[] = [];

  for (let i = 0; i < n; i++) {
    const x = randomCoord();
    const y = randomCoord();

    // Linear function normalized to [-1, 1]
    let label = (x + y) / 10;  // Normalize to roughly [-1, 1]
    label = Math.max(-1, Math.min(1, label + (Math.random() - 0.5) * noise * 0.1));

    points.push({ x, y, label });
  }

  return shuffle(points);
}

/**
 * Gaussian regression dataset
 * Radial Gaussian function: high in center, low at edges
 */
export function generateGaussianRegression(n: number, noise: number): DataPoint[] {
  const points: DataPoint[] = [];
  const sigma = 2.5;

  for (let i = 0; i < n; i++) {
    const x = randomCoord();
    const y = randomCoord();

    // 2D Gaussian centered at origin
    const distSq = x * x + y * y;
    let label = Math.exp(-distSq / (2 * sigma * sigma));

    // Map to [-1, 1] range and add noise
    label = label * 2 - 1;
    label = Math.max(-1, Math.min(1, label + (Math.random() - 0.5) * noise * 0.1));

    points.push({ x, y, label });
  }

  return shuffle(points);
}

/**
 * Generate dataset by type
 */
export function generateDataset(
  type: DatasetType,
  n: number,
  noise: number
): DataPoint[] {
  switch (type) {
    case 'circle':
      return generateCircle(n, noise);
    case 'xor':
      return generateXOR(n, noise);
    case 'gaussian':
      return generateGaussian(n, noise);
    case 'spiral':
      return generateSpiral(n, noise);
    case 'plane':
      return generatePlane(n, noise);
    case 'gaussianReg':
      return generateGaussianRegression(n, noise);
    default:
      throw new Error(`Unknown dataset type: ${type}`);
  }
}

/**
 * Split data into train and test sets
 */
export function splitData(
  data: DataPoint[],
  trainRatio: number
): Dataset {
  const shuffled = shuffle([...data]);
  const trainSize = Math.floor(shuffled.length * (trainRatio / 100));

  return {
    train: shuffled.slice(0, trainSize),
    test: shuffled.slice(trainSize),
  };
}

/**
 * Generate full dataset with train/test split
 */
export function generateFullDataset(
  type: DatasetType,
  totalPoints: number,
  noise: number,
  trainRatio: number
): Dataset {
  const data = generateDataset(type, totalPoints, noise);
  return splitData(data, trainRatio);
}

/**
 * Check if dataset type is regression
 */
export function isRegressionDataset(type: DatasetType): boolean {
  return type === 'plane' || type === 'gaussianReg';
}

/**
 * Get dataset display name
 */
export function getDatasetName(type: DatasetType): string {
  switch (type) {
    case 'circle':
      return 'Circle';
    case 'xor':
      return 'XOR';
    case 'gaussian':
      return 'Gaussian';
    case 'spiral':
      return 'Spiral';
    case 'plane':
      return 'Plane';
    case 'gaussianReg':
      return 'Gaussian';
    default:
      return type;
  }
}
