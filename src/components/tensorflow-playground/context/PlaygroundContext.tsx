'use client';

/**
 * Playground Context
 * Central state management for the TensorFlow Playground
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  PlaygroundState,
  PlaygroundAction,
  INITIAL_STATE,
  FeatureFlags,
  DataPoint,
  HoveredNode,
} from '@/lib/tensorflow-playground/types';
import { NeuralNetwork, createNetwork } from '@/lib/tensorflow-playground/nn/network';
import { Trainer } from '@/lib/tensorflow-playground/training/trainer';
import { generateFullDataset } from '@/lib/tensorflow-playground/data/datasets';
import { countEnabledFeatures, computeFeatures } from '@/lib/tensorflow-playground/data/features';

// Reducer
function playgroundReducer(
  state: PlaygroundState,
  action: PlaygroundAction
): PlaygroundState {
  switch (action.type) {
    case 'SET_HIDDEN_LAYERS':
      return { ...state, hiddenLayers: action.layers };

    case 'SET_ACTIVATION':
      return { ...state, activation: action.activation };

    case 'SET_LEARNING_RATE':
      return { ...state, learningRate: action.rate };

    case 'SET_REGULARIZATION':
      return { ...state, regularization: action.regularization };

    case 'SET_REGULARIZATION_RATE':
      return { ...state, regularizationRate: action.rate };

    case 'SET_BATCH_SIZE':
      return { ...state, batchSize: action.size };

    case 'SET_DATASET':
      return { ...state, dataset: action.dataset };

    case 'SET_NOISE':
      return { ...state, noise: action.noise };

    case 'SET_TRAIN_RATIO':
      return { ...state, trainRatio: action.ratio };

    case 'TOGGLE_FEATURE':
      return {
        ...state,
        features: {
          ...state.features,
          [action.feature]: !state.features[action.feature],
        },
      };

    case 'SET_RUNNING':
      return { ...state, isRunning: action.isRunning };

    case 'UPDATE_METRICS':
      return {
        ...state,
        epoch: action.metrics.epoch,
        trainLoss: action.metrics.trainLoss,
        testLoss: action.metrics.testLoss,
      };

    case 'UPDATE_NETWORK_STATE':
      return { ...state, networkState: action.state };

    case 'ADD_LOSS_HISTORY':
      return {
        ...state,
        lossHistory: [...state.lossHistory, action.point],
      };

    case 'SET_DATA':
      return {
        ...state,
        trainData: action.trainData,
        testData: action.testData,
      };

    case 'RESET_NETWORK':
      return {
        ...state,
        epoch: 0,
        trainLoss: 0.5,
        testLoss: 0.5,
        lossHistory: [],
        networkState: null,
        isRunning: false,
      };

    case 'RESET_TRAINING':
      return {
        ...state,
        epoch: 0,
        lossHistory: [],
        isRunning: false,
      };

    case 'ADD_LAYER':
      if (state.hiddenLayers.length >= 6) return state;
      return {
        ...state,
        hiddenLayers: [...state.hiddenLayers, 2],
      };

    case 'REMOVE_LAYER':
      if (state.hiddenLayers.length <= 1) return state;
      return {
        ...state,
        hiddenLayers: state.hiddenLayers.slice(0, -1),
      };

    case 'ADD_NEURON': {
      const newLayers = [...state.hiddenLayers];
      if (newLayers[action.layerIndex] < 8) {
        newLayers[action.layerIndex]++;
      }
      return { ...state, hiddenLayers: newLayers };
    }

    case 'REMOVE_NEURON': {
      const newLayers = [...state.hiddenLayers];
      if (newLayers[action.layerIndex] > 1) {
        newLayers[action.layerIndex]--;
      }
      return { ...state, hiddenLayers: newLayers };
    }

    case 'SET_HOVERED_NODE':
      return { ...state, hoveredNode: action.node };

    default:
      return state;
  }
}

// Context type
interface PlaygroundContextType {
  state: PlaygroundState;
  dispatch: React.Dispatch<PlaygroundAction>;
  network: NeuralNetwork | null;
  trainer: Trainer | null;
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  regenerateData: () => void;
  computeOutput: (x: number, y: number) => number;
  computeIntermediateOutput: (x: number, y: number, layerIndex: number, neuronIndex: number) => number;
  setHoveredNode: (node: HoveredNode | null) => void;
}

const PlaygroundContext = createContext<PlaygroundContextType | null>(null);

// Provider component
export function PlaygroundProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playgroundReducer, INITIAL_STATE);

  const networkRef = useRef<NeuralNetwork | null>(null);
  const trainerRef = useRef<Trainer | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize network
  const initNetwork = useCallback(() => {
    const inputSize = countEnabledFeatures(state.features);
    if (inputSize === 0) return;

    const network = createNetwork(inputSize, state.hiddenLayers, state.activation);
    networkRef.current = network;

    // Update visualization state
    dispatch({ type: 'UPDATE_NETWORK_STATE', state: network.getState() });
  }, [state.hiddenLayers, state.activation, state.features]);

  // Initialize trainer
  const initTrainer = useCallback(() => {
    if (!networkRef.current || state.trainData.length === 0) return;

    // Ensure feature count matches network input size to prevent dimension mismatch
    const featureCount = countEnabledFeatures(state.features);
    if (featureCount !== networkRef.current.config.inputSize) {
      // Network and features are out of sync, skip trainer initialization
      // This can happen during rapid feature toggling - the network will be reinitialized
      return;
    }

    const trainer = new Trainer(
      networkRef.current,
      state.trainData,
      state.testData,
      {
        learningRate: state.learningRate,
        regularization: {
          type: state.regularization,
          rate: state.regularizationRate,
        },
        batchSize: state.batchSize,
      },
      state.features
    );
    trainerRef.current = trainer;

    // Get initial loss
    const { trainLoss, testLoss } = trainer.getLoss();
    dispatch({
      type: 'UPDATE_METRICS',
      metrics: { epoch: 0, trainLoss, testLoss },
    });
  }, [
    state.trainData,
    state.testData,
    state.learningRate,
    state.regularization,
    state.regularizationRate,
    state.batchSize,
    state.features,
  ]);

  // Generate initial data
  useEffect(() => {
    const { train, test } = generateFullDataset(
      state.dataset,
      200,
      state.noise,
      state.trainRatio
    );
    dispatch({ type: 'SET_DATA', trainData: train, testData: test });
  }, [state.dataset, state.noise, state.trainRatio]);

  // Initialize network when config changes
  useEffect(() => {
    initNetwork();
  }, [initNetwork]);

  // Initialize trainer when data or network changes
  useEffect(() => {
    if (networkRef.current && state.trainData.length > 0) {
      initTrainer();
    }
  }, [state.trainData, initTrainer]);

  // Update trainer config when learning params change
  useEffect(() => {
    if (trainerRef.current) {
      trainerRef.current.updateConfig({
        learningRate: state.learningRate,
        regularization: {
          type: state.regularization,
          rate: state.regularizationRate,
        },
        batchSize: state.batchSize,
      });
      trainerRef.current.updateFeatures(state.features);
    }
  }, [
    state.learningRate,
    state.regularization,
    state.regularizationRate,
    state.batchSize,
    state.features,
  ]);

  // Training loop
  const trainStep = useCallback(() => {
    if (!trainerRef.current || !networkRef.current) return;

    const metrics = trainerRef.current.step();
    dispatch({ type: 'UPDATE_METRICS', metrics });
    dispatch({
      type: 'UPDATE_NETWORK_STATE',
      state: networkRef.current.getState(),
    });

    // Add to loss history every 10 epochs (or first epoch)
    if (metrics.epoch % 10 === 0 || metrics.epoch === 0) {
      dispatch({
        type: 'ADD_LOSS_HISTORY',
        point: metrics,
      });
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (state.isRunning) {
      const loop = () => {
        trainStep();
        animationRef.current = requestAnimationFrame(loop);
      };
      animationRef.current = requestAnimationFrame(loop);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isRunning, trainStep]);

  // Control functions
  const play = useCallback(() => {
    dispatch({ type: 'SET_RUNNING', isRunning: true });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: 'SET_RUNNING', isRunning: false });
  }, []);

  const step = useCallback(() => {
    pause();
    trainStep();
  }, [pause, trainStep]);

  const reset = useCallback(() => {
    pause();
    dispatch({ type: 'RESET_NETWORK' });
    initNetwork();
    setTimeout(() => initTrainer(), 0);
  }, [pause, initNetwork, initTrainer]);

  const regenerateData = useCallback(() => {
    const { train, test } = generateFullDataset(
      state.dataset,
      200,
      state.noise,
      state.trainRatio
    );
    dispatch({ type: 'SET_DATA', trainData: train, testData: test });
    reset();
  }, [state.dataset, state.noise, state.trainRatio, reset]);

  // Compute network output for a point
  const computeOutput = useCallback(
    (x: number, y: number): number => {
      if (!networkRef.current) return 0;
      const features = computeFeatures(x, y, state.features);
      return networkRef.current.forward(features);
    },
    [state.features]
  );

  // Compute intermediate neuron output for a point
  const computeIntermediateOutput = useCallback(
    (x: number, y: number, layerIndex: number, neuronIndex: number): number => {
      if (!networkRef.current) return 0;
      const features = computeFeatures(x, y, state.features);
      return networkRef.current.forwardToNode(features, layerIndex, neuronIndex);
    },
    [state.features]
  );

  // Set hovered node
  const setHoveredNode = useCallback(
    (node: HoveredNode | null) => {
      dispatch({ type: 'SET_HOVERED_NODE', node });
    },
    []
  );

  return (
    <PlaygroundContext.Provider
      value={{
        state,
        dispatch,
        network: networkRef.current,
        trainer: trainerRef.current,
        play,
        pause,
        step,
        reset,
        regenerateData,
        computeOutput,
        computeIntermediateOutput,
        setHoveredNode,
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  );
}

// Hook to use context
export function usePlayground() {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error('usePlayground must be used within PlaygroundProvider');
  }
  return context;
}
