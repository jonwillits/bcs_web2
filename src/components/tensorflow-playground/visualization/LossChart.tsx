'use client';

/**
 * Loss Chart
 * Line chart showing train and test loss over epochs
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePlayground } from '../context/PlaygroundContext';

interface LossChartProps {
  width?: number;
  height?: number;
}

/**
 * LossChart component
 * Renders a Recharts line chart showing train loss (blue, #4A90D9) and test loss (orange, #FF6B35)
 * over training epochs. Shows a placeholder message when no training data is available.
 * Loss history is recorded every 10 epochs by the PlaygroundContext.
 */
export function LossChart({ height = 150 }: LossChartProps) {
  const { state } = usePlayground();
  const { lossHistory } = state;

  // If no data, show placeholder
  if (lossHistory.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700"
        style={{ height }}
      >
        <span className="text-gray-500 text-sm">
          Loss chart will appear during training
        </span>
      </div>
    );
  }

  // Format data for Recharts
  const data = lossHistory.map((point) => ({
    epoch: point.epoch,
    train: Number(point.trainLoss.toFixed(4)),
    test: Number(point.testLoss.toFixed(4)),
  }));

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-2" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="epoch"
            stroke="#9ca3af"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={10}
            tickLine={false}
            domain={[0, 'auto']}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.375rem',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="train"
            name="Train Loss"
            stroke="#4A90D9"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="test"
            name="Test Loss"
            stroke="#FF6B35"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
