'use client';

/**
 * TensorFlow Playground
 * Main container component that assembles all parts
 */

import React from 'react';
import { PlaygroundProvider } from './context/PlaygroundContext';
import {
  PlaybackControls,
  DataControls,
  FeatureControls,
  NetworkControls,
  LearningControls,
} from './controls';
import { DecisionBoundary, NetworkDiagram, LossChart } from './visualization';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * PlaygroundContent component
 * Renders the main playground layout with three columns:
 * - Left: Playback, Data, and Feature controls
 * - Center: Network Architecture diagram and Loss Over Time chart
 * - Right: Decision Boundary output, Network controls, and Learning controls
 */
function PlaygroundContent() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Main Layout */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            Neural Network Playground
          </h1>
          <p className="text-gray-400 text-sm lg:text-base">
            Explore neural networks interactively. Adjust the architecture, pick a dataset, and watch the network learn.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Controls */}
          <div className="xl:col-span-3 space-y-6">
            {/* Playback Section */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <PlaybackControls />
            </div>

            {/* Data Section */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <DataControls />
            </div>

            {/* Features Section */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <FeatureControls />
            </div>
          </div>

          {/* Center Column - Network Visualization */}
          <div className="xl:col-span-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-4">
                Network Architecture
              </div>
              <div className="flex justify-center overflow-x-auto pb-2">
                <NetworkDiagram />
              </div>
            </div>

            {/* Loss Chart */}
            <div className="mt-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
                Loss Over Time
              </div>
              <LossChart height={180} />
            </div>
          </div>

          {/* Right Column - Output & Settings */}
          <div className="xl:col-span-3 space-y-6">
            {/* Decision Boundary */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-4">
                Output
              </div>
              <div className="flex justify-center">
                <DecisionBoundary width={220} height={220} />
              </div>
              <div className="flex justify-center gap-4 mt-3 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#FF6B35]" />
                  <span>Negative</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#4A90D9]" />
                  <span>Positive</span>
                </div>
              </div>
            </div>

            {/* Network Controls */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <NetworkControls />
            </div>

            {/* Learning Controls */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <LearningControls />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Inspired by{' '}
            <a
              href="https://playground.tensorflow.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              TensorFlow Playground
            </a>
            {' '}by Google. Built with pure TypeScript for educational purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * TensorFlowPlayground component
 * Top-level wrapper that provides the TooltipProvider and PlaygroundProvider context,
 * then renders PlaygroundContent. This is the component imported by the page.
 */
export function TensorFlowPlayground() {
  return (
    <TooltipProvider delayDuration={300}>
      <PlaygroundProvider>
        <PlaygroundContent />
      </PlaygroundProvider>
    </TooltipProvider>
  );
}
