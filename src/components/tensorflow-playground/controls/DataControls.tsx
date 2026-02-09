'use client';

/**
 * Data Controls
 * Dataset selection, noise slider, train/test ratio, batch size
 */

import React from 'react';
import { usePlayground } from '../context/PlaygroundContext';
import { DatasetType, BATCH_SIZES } from '@/lib/tensorflow-playground/types';
import { RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DatasetOption {
  type: DatasetType;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
}

const DATASETS: DatasetOption[] = [
  {
    type: 'circle',
    label: 'Circle',
    tooltip: 'Circular boundary - simple classification',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <circle cx="12" cy="12" r="4" fill="#4A90D9" />
        <circle cx="12" cy="12" r="8" fill="none" stroke="#FF6B35" strokeWidth="2" />
      </svg>
    ),
  },
  {
    type: 'xor',
    label: 'XOR',
    tooltip: 'XOR problem - requires non-linear boundary',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <rect x="2" y="2" width="9" height="9" fill="#4A90D9" />
        <rect x="13" y="2" width="9" height="9" fill="#FF6B35" />
        <rect x="2" y="13" width="9" height="9" fill="#FF6B35" />
        <rect x="13" y="13" width="9" height="9" fill="#4A90D9" />
      </svg>
    ),
  },
  {
    type: 'gaussian',
    label: 'Gaussian',
    tooltip: 'Two overlapping Gaussian clusters',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <circle cx="7" cy="7" r="5" fill="#4A90D9" opacity="0.8" />
        <circle cx="17" cy="17" r="5" fill="#FF6B35" opacity="0.8" />
      </svg>
    ),
  },
  {
    type: 'spiral',
    label: 'Spiral',
    tooltip: 'Spiral boundary - most challenging',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path
          d="M12 12 C12 8, 16 8, 16 12 C16 16, 8 16, 8 12 C8 6, 20 6, 20 12"
          fill="none"
          stroke="#4A90D9"
          strokeWidth="2"
        />
        <path
          d="M12 12 C12 16, 8 16, 8 12 C8 8, 16 8, 16 12 C16 18, 4 18, 4 12"
          fill="none"
          stroke="#FF6B35"
          strokeWidth="2"
        />
      </svg>
    ),
  },
];

export function DataControls() {
  const { state, dispatch, regenerateData, reset } = usePlayground();

  const handleDatasetChange = (type: DatasetType) => {
    dispatch({ type: 'SET_DATASET', dataset: type });
    reset();
  };

  const handleNoiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_NOISE', noise: parseInt(e.target.value) });
  };

  const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_TRAIN_RATIO', ratio: parseInt(e.target.value) });
  };

  const handleBatchSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_BATCH_SIZE', size: parseInt(e.target.value) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium text-gray-300 uppercase tracking-wider">
        Data
      </div>

      {/* Dataset Selection */}
      <div className="flex gap-2">
        {DATASETS.map((ds) => (
          <Tooltip key={ds.type}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleDatasetChange(ds.type)}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  state.dataset === ds.type
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                }`}
              >
                {ds.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent>{ds.tooltip}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Regenerate Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={regenerateData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-white"
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
        </TooltipTrigger>
        <TooltipContent>Generate new random data points</TooltipContent>
      </Tooltip>

      {/* Noise Slider */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Noise</span>
              <span className="text-white">{state.noise}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={state.noise}
              onChange={handleNoiseChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Add noise to data (0-50)</TooltipContent>
      </Tooltip>

      {/* Train/Test Ratio */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Ratio of training data</span>
              <span className="text-white">{state.trainRatio}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="10"
              value={state.trainRatio}
              onChange={handleRatioChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Percentage of data for training vs testing</TooltipContent>
      </Tooltip>

      {/* Batch Size */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <label className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Batch size</span>
            </label>
            <select
              value={state.batchSize}
              onChange={handleBatchSizeChange}
              className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {BATCH_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </TooltipTrigger>
        <TooltipContent>Samples per training update</TooltipContent>
      </Tooltip>
    </div>
  );
}
