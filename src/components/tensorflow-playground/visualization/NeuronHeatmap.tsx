'use client';

/**
 * NeuronHeatmap
 * Mini heatmap visualization inside each hidden layer neuron
 * Shows the neuron's output across the coordinate space
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { usePlayground } from '../context/PlaygroundContext';

// Coordinate space: -6 to 6 for both axes
const COORD_MIN = -6;
const COORD_MAX = 6;
const COORD_RANGE = COORD_MAX - COORD_MIN;

/**
 * Convert value in [-1, 1] to color
 * Same color scheme as DecisionBoundary
 */
function valueToColor(value: number): [number, number, number] {
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

interface NeuronHeatmapProps {
  layerIndex: number;  // Index into hidden layers (0 = first hidden layer)
  neuronIndex: number;
  size?: number;       // Size of the heatmap canvas
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function NeuronHeatmap({
  layerIndex,
  neuronIndex,
  size = 30,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}: NeuronHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { computeIntermediateOutput, state } = usePlayground();
  const { networkState } = state;

  // Low resolution for performance (10x10 grid)
  const resolution = 10;

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create image data at low resolution
    const imageData = ctx.createImageData(resolution, resolution);
    const data = imageData.data;

    // Sample the neuron output at each grid point
    for (let py = 0; py < resolution; py++) {
      for (let px = 0; px < resolution; px++) {
        // Convert pixel to data coordinates
        const x = COORD_MIN + (px / resolution) * COORD_RANGE;
        const y = COORD_MAX - (py / resolution) * COORD_RANGE; // Flip Y

        // Get neuron output
        const output = computeIntermediateOutput(x, y, layerIndex, neuronIndex);
        const [r, g, b] = valueToColor(output);

        // Set pixel
        const idx = (py * resolution + px) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    // Draw the image data scaled up to the canvas size
    // First, put the low-res image data on a temp canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = resolution;
    tempCanvas.height = resolution;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.putImageData(imageData, 0, 0);

    // Clear the main canvas and draw scaled up with nearest-neighbor interpolation
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(tempCanvas, 0, 0, resolution, resolution, 0, 0, size, size);
  }, [computeIntermediateOutput, layerIndex, neuronIndex, size, resolution]);

  // Redraw when network state changes
  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap, networkState]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`cursor-pointer transition-transform ${
        isHovered ? 'ring-2 ring-yellow-400 scale-110' : ''
      }`}
      style={{
        borderRadius: '50%',
        imageRendering: 'pixelated',
      }}
    />
  );
}
