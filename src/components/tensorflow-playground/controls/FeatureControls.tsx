'use client';

/**
 * Feature Controls
 * Toggle input features (X1, X2, X1², X2², X1X2, sin(X1), sin(X2))
 */

import React from 'react';
import { usePlayground } from '../context/PlaygroundContext';
import { FeatureFlags } from '@/lib/tensorflow-playground/types';
import { FEATURE_INFO } from '@/lib/tensorflow-playground/data/features';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FeatureControls() {
  const { state, dispatch, reset } = usePlayground();

  const handleToggle = (feature: keyof FeatureFlags) => {
    dispatch({ type: 'TOGGLE_FEATURE', feature });
    reset();
  };

  // Count enabled features
  const enabledCount = Object.values(state.features).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-gray-300 uppercase tracking-wider">
        Features
      </div>

      <div className="grid grid-cols-2 gap-2">
        {FEATURE_INFO.map(({ key, label, tooltip }) => {
          const isEnabled = state.features[key];
          const isDisabled = enabledCount <= 1 && isEnabled;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => !isDisabled && handleToggle(key)}
                  disabled={isDisabled}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    isEnabled
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {label}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isDisabled ? 'At least one feature required' : tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="text-xs text-gray-500 mt-1">
        {enabledCount} feature{enabledCount !== 1 ? 's' : ''} selected
      </div>
    </div>
  );
}
