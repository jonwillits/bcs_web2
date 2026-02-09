'use client';

/**
 * Network Controls
 * Add/remove layers, adjust neurons, select activation function
 */

import React from 'react';
import { usePlayground } from '../context/PlaygroundContext';
import { ActivationType } from '@/lib/tensorflow-playground/types';
import { Plus, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ACTIVATIONS: { type: ActivationType; label: string }[] = [
  { type: 'relu', label: 'ReLU' },
  { type: 'tanh', label: 'Tanh' },
  { type: 'sigmoid', label: 'Sigmoid' },
  { type: 'linear', label: 'Linear' },
];

export function NetworkControls() {
  const { state, dispatch, reset } = usePlayground();

  const handleActivationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_ACTIVATION', activation: e.target.value as ActivationType });
    reset();
  };

  const handleAddLayer = () => {
    dispatch({ type: 'ADD_LAYER' });
    reset();
  };

  const handleRemoveLayer = () => {
    dispatch({ type: 'REMOVE_LAYER' });
    reset();
  };

  const handleAddNeuron = (layerIndex: number) => {
    dispatch({ type: 'ADD_NEURON', layerIndex });
    reset();
  };

  const handleRemoveNeuron = (layerIndex: number) => {
    dispatch({ type: 'REMOVE_NEURON', layerIndex });
    reset();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Activation Function */}
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-2 cursor-help">
              Activation
            </label>
          </TooltipTrigger>
          <TooltipContent>Activation function for hidden layers</TooltipContent>
        </Tooltip>
        <select
          value={state.activation}
          onChange={handleActivationChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
        >
          {ACTIVATIONS.map(({ type, label }) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Hidden Layers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">
            Hidden Layers
          </span>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleRemoveLayer}
                  disabled={state.hiddenLayers.length <= 1}
                  className="p-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  <Minus size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Remove last hidden layer (min 1)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleAddLayer}
                  disabled={state.hiddenLayers.length >= 6}
                  className="p-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  <Plus size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Add hidden layer (max 6)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Layer neurons controls */}
        <div className="flex gap-2 flex-wrap">
          {state.hiddenLayers.map((neurons, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 p-2 bg-gray-800 rounded-lg border border-gray-700"
            >
              <span className="text-xs text-gray-500">Layer {idx + 1}</span>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleRemoveNeuron(idx)}
                      disabled={neurons <= 1}
                      className="p-0.5 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    >
                      <Minus size={12} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Decrease neurons in this layer (min 1)</TooltipContent>
                </Tooltip>
                <span className="w-6 text-center font-mono text-white">
                  {neurons}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleAddNeuron(idx)}
                      disabled={neurons >= 8}
                      className="p-0.5 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    >
                      <Plus size={12} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Increase neurons in this layer (max 8)</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
