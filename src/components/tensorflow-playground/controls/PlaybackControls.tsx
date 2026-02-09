'use client';

/**
 * Playback Controls
 * Play, Pause, Step, Reset buttons and epoch/loss display
 */

import React from 'react';
import { usePlayground } from '../context/PlaygroundContext';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function PlaybackControls() {
  const { state, play, pause, step, reset } = usePlayground();
  const { isRunning, epoch, trainLoss, testLoss } = state;

  return (
    <div className="flex flex-col gap-4">
      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={isRunning ? pause : play}
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${
                isRunning
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {isRunning ? 'Pause training' : 'Start continuous training'}
          </TooltipContent>
        </Tooltip>

        {/* Step Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={step}
              disabled={isRunning}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Train on one batch</TooltipContent>
        </Tooltip>

        {/* Reset Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={reset}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reset network weights and epoch to zero</TooltipContent>
        </Tooltip>
      </div>

      {/* Epoch Counter */}
      <div className="text-sm">
        <div className="text-gray-400">Epoch</div>
        <div className="text-2xl font-mono text-white">
          {epoch.toLocaleString()}
        </div>
      </div>

      {/* Loss Display */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-400">Train Loss</div>
          <div className="font-mono text-white">
            {trainLoss.toFixed(3)}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Test Loss</div>
          <div className="font-mono text-white">
            {testLoss.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
}
