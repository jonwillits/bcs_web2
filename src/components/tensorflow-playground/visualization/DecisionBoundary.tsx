'use client';

/**
 * Decision Boundary Visualization
 * Canvas-based heatmap showing network's classification regions
 * with data points overlaid
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { usePlayground } from '../context/PlaygroundContext';
import { DataPoint } from '@/lib/tensorflow-playground/types';

/** Minimum coordinate value for both X and Y axes. */
const COORD_MIN = -6;
/** Maximum coordinate value for both X and Y axes. */
const COORD_MAX = 6;
/** Total range of the coordinate space (COORD_MAX - COORD_MIN). */
const COORD_RANGE = COORD_MAX - COORD_MIN;

/**
 * Convert value in [-1, 1] to color
 * Negative = Orange (#FF6B35)
 * Positive = Blue (#4A90D9)
 * Zero = White
 */
function valueToColor(value: number): [number, number, number] {
  // Clamp to [-1, 1]
  const v = Math.max(-1, Math.min(1, value));
  const t = (v + 1) / 2; // Normalize to [0, 1]

  if (t < 0.5) {
    // Orange (#FF6B35) to White
    const factor = t * 2;
    const r = 255;
    const g = Math.round(107 + (255 - 107) * factor);
    const b = Math.round(53 + (255 - 53) * factor);
    return [r, g, b];
  } else {
    // White to Blue (#4A90D9)
    const factor = (t - 0.5) * 2;
    const r = Math.round(255 - (255 - 74) * factor);
    const g = Math.round(255 - (255 - 144) * factor);
    const b = Math.round(255 - (255 - 217) * factor);
    return [r, g, b];
  }
}

/**
 * Convert data coordinate to canvas coordinate
 */
function dataToCanvas(coord: number, canvasSize: number): number {
  return ((coord - COORD_MIN) / COORD_RANGE) * canvasSize;
}

interface DecisionBoundaryProps {
  width?: number;
  height?: number;
}

/**
 * DecisionBoundary component
 * Renders a canvas-based heatmap showing the network's classification regions.
 * Orange (#FF6B35) represents negative class, blue (#4A90D9) represents positive class,
 * white represents the decision boundary (output near 0).
 * Training data points are drawn as filled circles, test points as hollow circles.
 * When a hidden neuron is hovered, shows that neuron's individual output instead.
 */
export function DecisionBoundary({
  width = 250,
  height = 250,
}: DecisionBoundaryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, computeOutput, computeIntermediateOutput } = usePlayground();
  const { trainData, testData, networkState, hoveredNode } = state;

  // Resolution for heatmap sampling
  const resolution = 50;

  // Compute output based on whether a node is hovered
  const getOutputValue = useCallback(
    (x: number, y: number): number => {
      if (hoveredNode) {
        return computeIntermediateOutput(x, y, hoveredNode.layerIndex, hoveredNode.neuronIndex);
      }
      return computeOutput(x, y);
    },
    [hoveredNode, computeIntermediateOutput, computeOutput]
  );

  /**
   * Draw the heatmap
   */
  const drawHeatmap = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Sample the network at each pixel
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          // Convert pixel to data coordinates
          const x = COORD_MIN + (px / width) * COORD_RANGE;
          const y = COORD_MAX - (py / height) * COORD_RANGE; // Flip Y

          // Get network output (or intermediate neuron output if hovered)
          const output = getOutputValue(x, y);
          const [r, g, b] = valueToColor(output);

          // Set pixel
          const idx = (py * width + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },
    [width, height, getOutputValue]
  );

  /**
   * Draw data points
   */
  const drawPoints = useCallback(
    (ctx: CanvasRenderingContext2D, points: DataPoint[], isTest: boolean) => {
      const pointRadius = 4;
      const strokeWidth = isTest ? 2 : 0;

      for (const point of points) {
        const cx = dataToCanvas(point.x, width);
        const cy = dataToCanvas(-point.y, height); // Flip Y

        // Color based on label
        const isPositive = point.label > 0;
        const fillColor = isPositive ? '#4A90D9' : '#FF6B35';
        const strokeColor = isPositive ? '#2563eb' : '#dc2626';

        ctx.beginPath();
        ctx.arc(cx, cy, pointRadius, 0, Math.PI * 2);

        if (isTest) {
          // Test points: hollow
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fill();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        } else {
          // Train points: filled
          ctx.fillStyle = fillColor;
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    },
    [width, height]
  );

  /**
   * Main render
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw heatmap
    drawHeatmap(ctx);

    // Draw data points (test first so train points are on top)
    drawPoints(ctx, testData, true);
    drawPoints(ctx, trainData, false);
  }, [width, height, networkState, trainData, testData, hoveredNode, drawHeatmap, drawPoints]);

  // Generate label for hovered neuron
  const hoveredLabel = useMemo(() => {
    if (!hoveredNode) return null;
    return `Layer ${hoveredNode.layerIndex + 1}, Neuron ${hoveredNode.neuronIndex + 1}`;
  }, [hoveredNode]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`rounded-lg border ${hoveredNode ? 'border-yellow-500 border-2' : 'border-gray-700'}`}
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Hovered neuron indicator */}
      {hoveredLabel && (
        <div className="absolute top-2 left-2 bg-gray-900/90 text-yellow-400 text-xs px-2 py-1 rounded">
          {hoveredLabel}
        </div>
      )}
      {/* Axis labels */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-500">
        X₁
      </div>
      <div
        className="absolute top-1/2 -left-5 -translate-y-1/2 text-xs text-gray-500"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        X₂
      </div>
    </div>
  );
}
