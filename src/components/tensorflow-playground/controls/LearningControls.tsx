'use client';

/**
 * Learning Controls
 * Learning rate, regularization type and rate
 */

import React from 'react';
import { usePlayground } from '../context/PlaygroundContext';
import {
  LEARNING_RATES,
  REGULARIZATION_RATES,
  RegularizationType,
} from '@/lib/tensorflow-playground/types';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/** Available regularization type options displayed in the dropdown. */
const REGULARIZATION_TYPES: { type: RegularizationType; label: string }[] = [
  { type: 'none', label: 'None' },
  { type: 'l1', label: 'L1' },
  { type: 'l2', label: 'L2' },
];

/**
 * LearningControls component
 * Renders dropdowns for learning rate, regularization type (None/L1/L2),
 * and regularization rate. The regularization rate dropdown only appears
 * when a regularization type other than "None" is selected.
 */
export function LearningControls() {
  const { state, dispatch } = usePlayground();

  const handleLearningRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_LEARNING_RATE', rate: parseFloat(e.target.value) });
  };

  const handleRegularizationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: 'SET_REGULARIZATION',
      regularization: e.target.value as RegularizationType,
    });
  };

  const handleRegularizationRateChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    dispatch({
      type: 'SET_REGULARIZATION_RATE',
      rate: parseFloat(e.target.value),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Learning Rate */}
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-2 cursor-help">
              Learning Rate
            </label>
          </TooltipTrigger>
          <TooltipContent>Step size for weight updates</TooltipContent>
        </Tooltip>
        <select
          value={state.learningRate}
          onChange={handleLearningRateChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
        >
          {LEARNING_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate}
            </option>
          ))}
        </select>
      </div>

      {/* Regularization Type */}
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-2 cursor-help">
              Regularization
            </label>
          </TooltipTrigger>
          <TooltipContent>Penalty method: None, L1 (sparse), L2 (decay)</TooltipContent>
        </Tooltip>
        <select
          value={state.regularization}
          onChange={handleRegularizationChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
        >
          {REGULARIZATION_TYPES.map(({ type, label }) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Regularization Rate */}
      {state.regularization !== 'none' && (
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-2 cursor-help">
                Regularization Rate
              </label>
            </TooltipTrigger>
            <TooltipContent>Strength of regularization penalty</TooltipContent>
          </Tooltip>
          <select
            value={state.regularizationRate}
            onChange={handleRegularizationRateChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {REGULARIZATION_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
