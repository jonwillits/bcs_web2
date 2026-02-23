# TensorFlow Playground Technical Guide

## Who This Guide Is For

This guide explains **how the TensorFlow Neural Network Playground works** — what happens under the hood when you click Play, how the network learns, and how the visualizations are computed.

It is written for someone who understands neural networks conceptually but is not a software engineer. If you are looking for instructions on **how to customize** the playground (change defaults, add datasets, adjust colors), see the [Customizing the TensorFlow Playground](/guide#customizing-the-tensorflow-playground) section in the User Guide instead.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [How the Playground Is Wired](#2-how-the-playground-is-wired)
3. [What Happens When You Click Play](#3-what-happens-when-you-click-play)
4. [How the Neural Network Works](#4-how-the-neural-network-works)
5. [How Training Is Managed](#5-how-training-is-managed)
6. [How Datasets Are Generated](#6-how-datasets-are-generated)
7. [How Features Transform the Input](#7-how-features-transform-the-input)
8. [How Activation Functions Shape the Output](#8-how-activation-functions-shape-the-output)
9. [How Regularization Prevents Overfitting](#9-how-regularization-prevents-overfitting)
10. [How the Visualizations Work](#10-how-the-visualizations-work)
11. [How State Changes Cascade Through the System](#11-how-state-changes-cascade-through-the-system)
12. [Glossary](#12-glossary)

---

## 1. The Big Picture

The TensorFlow Playground is a self-contained neural network simulator that runs entirely in the browser. There is no server involved during training — everything happens on the user's machine using JavaScript.

At a high level, the system has four layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                           │
│  Controls (buttons, sliders, dropdowns, feature toggles)    │
└──────────────────────────┬──────────────────────────────────┘
                           │ user actions
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                          │
│  PlaygroundContext — holds all settings, data, and metrics  │
│  (React Context + Reducer pattern)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ reads/writes
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEURAL NETWORK ENGINE                     │
│  Network (neurons, weights, forward/backward pass)          │
│  Trainer (batch processing, loss calculation)               │
│  Data generators, feature transforms, activations           │
└──────────────────────────┬──────────────────────────────────┘
                           │ network state + metrics
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     VISUALIZATIONS                           │
│  Decision boundary heatmap, network diagram,                │
│  neuron heatmaps, loss chart                                │
└─────────────────────────────────────────────────────────────┘
```

**Key source files:**

| Layer | Files |
|-------|-------|
| State management | `context/PlaygroundContext.tsx` |
| Neural network | `nn/network.ts`, `nn/neuron.ts`, `nn/activations.ts`, `nn/regularization.ts` |
| Training | `training/trainer.ts`, `training/loss.ts` |
| Data | `data/datasets.ts`, `data/features.ts` |
| Visualizations | `visualization/DecisionBoundary.tsx`, `visualization/NetworkDiagram.tsx`, `visualization/NeuronHeatmap.tsx`, `visualization/OutputHeatmap.tsx`, `visualization/LossChart.tsx` |

All paths are relative to `src/components/tensorflow-playground/` (for visualization and context files) or `src/lib/tensorflow-playground/` (for the engine files).

---

## 2. How the Playground Is Wired

### State Management: The Central Nervous System

The playground uses a design pattern called **Context + Reducer**. Think of it as a central database that all parts of the playground can read from and write to.

**PlaygroundContext** (`context/PlaygroundContext.tsx`) holds:

- **Settings** — hidden layer sizes, activation function, learning rate, regularization, batch size, dataset type, noise, train ratio
- **Feature flags** — which input features are enabled (X₁, X₂, X₁², etc.)
- **Data** — the generated training and test data points
- **Metrics** — current epoch, training loss, test loss, and loss history over time
- **Network state** — a snapshot of all weights, biases, and neuron activations (used by visualizations)
- **UI state** — whether training is running, which neuron is being hovered

When something changes — say you click a button or adjust a slider — the system dispatches an **action** (a simple message like "set learning rate to 0.03"). The **reducer** receives that action and produces the new state. All components that read from the context automatically update.

### Why the Network and Trainer Are Not in State

There is a subtle but important design choice: the neural network object and the trainer object are stored as **refs** (mutable references), not inside the context state.

Why? Performance. The network and trainer are large, mutable objects that change constantly during training. If they were in the state, React would try to compare them on every update, which would be slow. By keeping them as refs, the system can mutate them freely during training and only copy a lightweight snapshot (weights and activations) into state when the visualizations need to update.

Think of it this way: the network ref is the "live" engine running in the background, and the `networkState` in context is a periodic photograph of that engine, taken once per animation frame, that the visualizations use to draw.

### Architecture Limits

The reducer enforces some hard limits:
- Maximum **6 hidden layers**
- **1 to 8 neurons** per hidden layer
- The output layer always has exactly **1 neuron**

---

## 3. What Happens When You Click Play

Here is exactly what happens, step by step, from the moment you click the Play button to the moment you see the visualizations update:

### Step 1: Play dispatches an action

The Play button calls `play()`, which dispatches `SET_RUNNING: true` to the reducer. This flips `isRunning` to `true` in the state.

### Step 2: The animation loop starts

A `useEffect` hook watches the `isRunning` flag. When it becomes `true`, it starts a **requestAnimationFrame loop** — this is the browser's built-in mechanism for running code at approximately 60 frames per second, synchronized with the display refresh rate.

### Step 3: Each frame runs one training step

On each animation frame, the loop calls `trainStep()`. This is the core function that makes the network learn.

### Step 4: trainStep() calls trainer.step()

The trainer processes one **batch** of training data:

1. **Get the next batch** — the trainer grabs the next `batchSize` samples from the shuffled training data
2. **Clear gradients** — resets all accumulated gradient values to zero
3. **Forward + backward for each sample** — for every data point in the batch:
   - Compute input features from the point's (x, y) coordinates
   - Run the forward pass (make a prediction)
   - Run the backward pass (compute how much each weight contributed to the error)
   - Accumulate gradients
4. **Update weights** — adjust all weights and biases using the averaged gradients
5. **Compute losses** — run the forward pass on ALL training data and ALL test data to get current loss values

### Step 5: Metrics are dispatched to state

The trainer returns `{ epoch, trainLoss, testLoss }`. These are dispatched to the context state. Every 10 epochs (or at epoch 0), a point is also added to `lossHistory` for the loss chart.

### Step 6: Network state snapshot is dispatched

A snapshot of the network's current weights, biases, and activations is copied into `networkState` in the context. This is what triggers the visualizations to redraw.

### Step 7: Visualizations update

Because `networkState` changed, all visualization components re-render:
- The **decision boundary** redraws its heatmap pixel by pixel
- The **network diagram** updates connection colors and thicknesses
- The **neuron heatmaps** inside each neuron redraw
- The **loss chart** adds a new data point (every 10 epochs)

### Step 8: Next frame

The animation loop calls `requestAnimationFrame` again, which schedules the next training step. This continues at roughly 60 steps per second until you click Pause.

### What Pause, Step, and Reset Do

- **Pause**: Dispatches `SET_RUNNING: false`, which causes the `useEffect` to cancel the animation frame loop. Training stops.
- **Step**: Calls `pause()` first, then runs `trainStep()` exactly once. This lets you advance training one batch at a time.
- **Reset**: Pauses training, resets the epoch counter to 0, clears the loss history, reinitializes the network with fresh random weights, and creates a new trainer. The data stays the same unless you also change the dataset.

---

## 4. How the Neural Network Works

### Network Architecture

The network is a standard **feedforward neural network** (also called a multilayer perceptron). Data flows in one direction: from input to output.

```
Input Layer          Hidden Layer(s)          Output Layer
(2-7 neurons)        (user-configurable)       (1 neuron)

  ┌───┐
  │ X₁├────┐
  └───┘    │     ┌───┐     ┌───┐
           ├────►│ H₁├────►│   │
  ┌───┐    │     └───┘     │   │     ┌───┐
  │ X₂├────┤              ─┤   ├────►│ O │── prediction
  └───┘    │     ┌───┐     │   │     └───┘
           ├────►│ H₂├────►│   │
  ┌───┐    │     └───┘     │   │
  │X₁²├────┘               └───┘
  └───┘

  Features        1-6 layers            Always 1 neuron
  (toggled        1-8 neurons each      Always uses tanh
   by user)       User's chosen         Output in [-1, 1]
                  activation fn
```

- **Input layer**: The number of neurons equals the number of enabled features (between 2 and 7). These are not real "neurons" — they just pass the feature values through.
- **Hidden layers**: 1 to 6 layers, each with 1 to 8 neurons. All hidden neurons use the activation function you select (ReLU, Tanh, Sigmoid, or Linear).
- **Output layer**: Always exactly 1 neuron, always using the tanh activation function. This forces the output into the range [-1, 1]. Positive output means "blue class," negative means "orange class."

**Source file**: `nn/network.ts` — the `NeuralNetwork` class and `createNetwork()` function.

### What a Neuron Does

Each neuron performs a simple two-step computation:

1. **Weighted sum**: Multiply each input by its corresponding weight, add them all up, then add the bias.
2. **Activation**: Pass the sum through an activation function to produce the output.

In mathematical notation:

```
output = activation(w₁·input₁ + w₂·input₂ + ... + wₙ·inputₙ + bias)
```

Or more concisely:

```
output = activation(Σ(wᵢ · inputᵢ) + bias)
```

The **weights** control how much each input contributes. The **bias** shifts the threshold. The **activation function** introduces non-linearity (which is what allows the network to learn complex patterns — without it, the entire network would just be a linear function).

**Source file**: `nn/neuron.ts` — the `Neuron` class.

### Weight Initialization: Xavier/Glorot

When the network is first created (or reset), each weight is initialized to a small random value using **Xavier/Glorot initialization**:

```
scale = sqrt(2 / (inputSize + 1))
weight = random(-1, 1) * scale
bias   = random(-1, 1) * scale * 0.1     (biases start even smaller)
```

Why not just use random numbers? If weights start too large, neuron outputs explode and the network can't learn. If too small, signals vanish to zero. Xavier initialization picks a "just right" range based on the number of inputs to each neuron, keeping values in a stable range from the start.

### Forward Pass: Making a Prediction

When the network makes a prediction for a data point, the input features flow through each layer sequentially:

1. The input features (e.g., X₁ = 0.3, X₂ = -0.5) are passed to every neuron in the first hidden layer.
2. Each neuron in the first hidden layer computes its weighted sum + activation and produces an output.
3. Those outputs become the inputs to the second hidden layer.
4. This continues through all hidden layers.
5. The output neuron receives the final hidden layer's outputs, computes its weighted sum, and applies tanh to produce a value in [-1, 1].

The output is interpreted as:
- **Positive** (toward +1) → blue class
- **Negative** (toward -1) → orange class
- **Near zero** → uncertain / on the decision boundary

**Source file**: `nn/network.ts` — the `forward()` method.

### Backward Pass: Learning from Mistakes

After making a prediction, the network needs to learn from the error. This is done through **backpropagation** — which is just the chain rule from calculus applied layer by layer.

Here is the process in plain English:

**Step 1: Compute the output error.**
The output neuron's error is `output - target`. If the network predicted 0.7 but the target was -1, the error is 1.7.

**Step 2: Compute the output neuron's delta.**
The delta is the error multiplied by the derivative of the activation function at the current output. The derivative tells us "how steep is the activation function at this point?" — steep means small changes in input cause large changes in output, so the weight update should be larger.

```
delta = (output - target) * activation_derivative(output)
```

**Step 3: Propagate error backward through hidden layers.**
For each hidden neuron, its delta is computed by asking: "how much did this neuron contribute to the error of the neurons in the next layer?"

```
error_sum = Σ(next_neuron.delta * weight connecting this neuron to next_neuron)
delta = error_sum * activation_derivative(this_neuron_output)
```

**Step 4: Accumulate gradients.**
Each neuron computes how much each of its weights should change:

```
weight_gradient += delta * input_to_this_weight
bias_gradient  += delta
```

These gradients are **accumulated** across all samples in the batch (not applied immediately).

**Source file**: `nn/network.ts` — the `backward()` method, and `nn/neuron.ts` — the `accumulateGradients()` method.

### Weight Updates: Adjusting the Network

After processing an entire batch, the accumulated gradients are used to update the weights:

```
new_weight = old_weight - (learning_rate / batch_size) * accumulated_gradient
```

In plain English: each weight is nudged in the direction that reduces the error, with the step size controlled by the **learning rate** divided by the **batch size** (averaging the gradient over the batch).

If regularization is enabled, an additional penalty is added to the gradient before the update (see [Section 9](#9-how-regularization-prevents-overfitting)).

**Source file**: `nn/neuron.ts` — the `updateWeights()` method.

---

## 5. How Training Is Managed

### Epochs and Batches

Training data is processed in small chunks called **batches**:

- **Batch**: A subset of the training data processed together before updating weights. Default size: 10.
- **Epoch**: One complete pass through all training data. If you have 160 training points and a batch size of 10, one epoch is 16 batches.

### Batch Processing

At the start of each epoch, the training data indices are **shuffled** using the Fisher-Yates algorithm (a well-known method for generating a uniformly random permutation). This means the network sees the data in a different order each time, which helps it learn more robustly.

The trainer then processes batches sequentially. When it reaches the end of the shuffled data, it:
1. Increments the epoch counter
2. Shuffles the data again
3. Starts from the beginning

### Loss Computation

After each batch's weight update, the trainer runs the forward pass on **all** training data and **all** test data to compute current loss values. This is more expensive than only computing loss on the batch, but it gives a stable, accurate picture of how well the network is doing.

### Loss Function: Mean Squared Error (MSE)

The loss function measures how wrong the network's predictions are:

```
loss = Σ(prediction - target)² / (2 * number_of_samples)
```

For each data point, the difference between prediction and target is squared (so large errors are penalized much more than small ones), then averaged across all samples. The factor of 2 in the denominator is a mathematical convenience that simplifies the derivative.

**Why MSE?** It's simple, differentiable everywhere, and penalizes large errors more heavily than small ones — which is usually what we want.

**Source files**: `training/trainer.ts` — the `Trainer` class, and `training/loss.ts` — the `mse()` and `computeLoss()` functions.

---

## 6. How Datasets Are Generated

All datasets are synthetic — they are generated mathematically, not loaded from a file. The default is **200 total data points**, which are shuffled and split into training and test sets based on the train ratio (default: 50%).

### Circle (Classification)

**What it looks like**: An inner cluster of blue points surrounded by an outer ring of orange points.

**How it's generated**: Random angles are sampled uniformly. Half the points get a radius within the inner circle (radius < 3), half get a radius in the outer ring (radius between 3 and 5). Inner points get label +1 (blue), outer points get label -1 (orange).

**Why it's useful**: Tests whether the network can learn a circular (radial) decision boundary. A network with only linear features (X₁, X₂) needs hidden layers to solve this. Enabling X₁² and X₂² features makes it much easier.

### XOR (Classification)

**What it looks like**: Four quadrants with alternating labels — top-left and bottom-right are blue, top-right and bottom-left are orange.

**How it's generated**: Random (x, y) coordinates in the range [-5, 5]. If x and y have the same sign (both positive or both negative), the label is -1 (orange). If they have different signs, the label is +1 (blue).

**Why it's useful**: This is the classic non-linear problem. A single-layer network cannot solve it because no single straight line can separate the classes. It requires at least one hidden layer (or the X₁X₂ interaction feature).

### Gaussian (Classification)

**What it looks like**: Two clusters of points — blue centered near (2, 2) and orange centered near (-2, -2), with some overlap in the middle.

**How it's generated**: Each point is assigned to one of two classes randomly. Its coordinates are sampled from a 2D Gaussian (bell curve) distribution centered at (2, 2) for class +1 or (-2, -2) for class -1, using the Box-Muller transform to generate Gaussian random numbers.

**Why it's useful**: This is the easiest dataset — it's approximately linearly separable. Even a network with no hidden layers (just input → output) can achieve good accuracy. It's a good baseline to verify the playground is working.

### Spiral (Classification)

**What it looks like**: Two interleaved spirals — blue and orange — winding around each other.

**How it's generated**: Points are placed along two spiral arms. For each arm, the radius increases linearly from 0 to 5, and the angle sweeps through 3π radians. The second spiral is offset by π radians (180 degrees) from the first.

**Why it's useful**: This is the **hardest** dataset. The spirals are deeply interleaved, so the decision boundary must be highly non-linear. It typically requires a deeper network (3+ hidden layers) and more neurons to solve.

### Plane (Regression)

**What it looks like**: Points colored along a gradient based on a linear function of their position.

**How it's generated**: Random (x, y) coordinates, with the label computed as `(x + y) / 10`, clamped to [-1, 1].

**Why it's useful**: Tests whether the network can learn a simple linear function. This is the regression equivalent of the Gaussian dataset — a baseline sanity check.

### Gaussian Regression (Regression)

**What it looks like**: A radial pattern where points near the center have high labels (blue) and points far from the center have low labels (orange).

**How it's generated**: Random (x, y) coordinates, with the label computed from a 2D Gaussian function centered at the origin: `label = exp(-(x² + y²) / (2 * 2.5²))`, then mapped to [-1, 1].

**Why it's useful**: A non-linear regression problem. The network needs to learn a smooth radial function — harder than the plane but not as hard as the classification spirals.

### Noise

For all datasets, the noise slider adds random perturbation to the data. The noise is applied as:

```
value + random(-1, 1) * noise * 0.5
```

Higher noise makes the boundaries between classes less clear, making the problem harder. The noise value ranges from 0 (no noise) to a maximum set by the slider.

### Train/Test Split

After generating all points, the data is shuffled and split:
- **Training set**: Used to update weights. The network learns from these points.
- **Test set**: Never used for weight updates. Used only to measure how well the network generalizes to unseen data.

The split ratio is controlled by the "train ratio" slider (e.g., 50% means 100 training points and 100 test points out of 200 total).

**Source file**: `data/datasets.ts` — all generator functions, `generateFullDataset()`, and `splitData()`.

---

## 7. How Features Transform the Input

### Why Features Matter

The raw input to the network is just an (x, y) coordinate. But many patterns — circles, XOR boundaries, spirals — can't be captured by a linear function of x and y alone. **Feature engineering** adds computed terms that give the network a head start.

### All 7 Features

All coordinates are first **normalized** by dividing by 5 (so values fall roughly in the [-1, 1] range). Then the following features can be toggled on or off:

| Feature | Formula | What It Helps With |
|---------|---------|-------------------|
| X₁ | `x / 5` | Horizontal position (always useful) |
| X₂ | `y / 5` | Vertical position (always useful) |
| X₁² | `(x/5)²` | Radial/circular patterns — helps with the Circle dataset |
| X₂² | `(y/5)²` | Radial/circular patterns — helps with the Circle dataset |
| X₁X₂ | `(x/5) * (y/5)` | Diagonal/interaction patterns — directly solves XOR |
| sin(X₁) | `sin(x)` | Periodic (repeating) patterns along the X axis |
| sin(X₂) | `sin(y)` | Periodic (repeating) patterns along the Y axis |

Note: The sine features use the **unnormalized** coordinates (`sin(x)` not `sin(x/5)`), while the polynomial features use normalized coordinates.

### How Features Affect the Network

When you toggle a feature on or off, the number of inputs to the network changes. For example, with just X₁ and X₂ enabled, the input layer has 2 neurons. With all 7 features enabled, it has 7.

Because the network's architecture depends on the input size, **changing features forces the entire network to be rebuilt** with fresh random weights. Training starts from scratch.

The key insight: adding the right features can make a hard problem easy. For example:
- **Circle** with just X₁ and X₂ requires hidden layers. But enabling X₁² and X₂² gives the network direct access to the radius, making it trivial.
- **XOR** with just X₁ and X₂ requires at least one hidden layer. But enabling X₁X₂ provides the exact interaction term the network needs.

**Source file**: `data/features.ts` — the `computeFeatures()` function and `FEATURE_INFO` array.

---

## 8. How Activation Functions Shape the Output

Activation functions are applied to each neuron's weighted sum. They introduce **non-linearity** — without them, stacking layers would be pointless because multiple linear transformations collapse into a single linear transformation.

### ReLU (Rectified Linear Unit)

```
f(x) = max(0, x)
```

- **What it does**: Passes positive values through unchanged. Blocks all negative values (outputs 0).
- **Derivative**: 1 for positive inputs, 0 for negative inputs.
- **Intuition**: Think of it as a gate that only lets positive signals through.
- **When to use**: Fast and efficient. Avoids the "vanishing gradient" problem where deep networks stop learning because gradients shrink to near-zero. However, neurons can "die" — if a neuron's output is always negative, it will never update (dead neuron problem).

### Tanh (Hyperbolic Tangent)

```
f(x) = (eˣ - e⁻ˣ) / (eˣ + e⁻ˣ)
```

- **What it does**: S-shaped curve that squashes any input to the range (-1, 1). Large positive inputs map near +1, large negative inputs near -1, and 0 maps to 0.
- **Derivative**: `1 - output²` (steepest at 0, flattens at extremes).
- **Intuition**: Like a soft switch that smoothly varies between -1 and +1.
- **When to use**: Good default choice. Zero-centered output means both positive and negative values flow through the network, which can help training. This is why it's the **default activation** and is always used for the output neuron.

### Sigmoid

```
f(x) = 1 / (1 + e⁻ˣ)
```

- **What it does**: S-shaped curve that squashes input to the range (0, 1). Similar shape to tanh but shifted up.
- **Derivative**: `output * (1 - output)` (steepest at 0.5, flattens at extremes).
- **Intuition**: Like tanh, but outputs are always positive. Originally popular for binary classification because the output resembles a probability.
- **When to use**: Less common for hidden layers now (tanh and ReLU are usually preferred), but still valid.

### Linear (Identity)

```
f(x) = x
```

- **What it does**: No transformation at all — the output equals the input.
- **Derivative**: Always 1.
- **Intuition**: No non-linearity. The neuron just computes a weighted sum.
- **When to use**: Only useful for regression problems where you want the network to output unbounded values. For classification, this is rarely a good choice because it provides no non-linearity.

### Important Note

Regardless of which activation you choose for the hidden layers, the **output neuron always uses tanh**. This ensures the final prediction is bounded in [-1, 1], which matches the label format (where -1 = orange class, +1 = blue class).

**Source file**: `nn/activations.ts` — each activation object with `activate` and `derivative` functions.

---

## 9. How Regularization Prevents Overfitting

### What Is Overfitting?

Overfitting occurs when the network memorizes the training data instead of learning general patterns. The telltale sign: **training loss keeps dropping, but test loss starts rising**. The network performs great on data it has seen but poorly on new data.

In the playground, you can spot overfitting by watching the loss chart — when the blue line (train) and orange line (test) diverge, with the orange line going up, the network is overfitting.

### How Regularization Helps

Regularization adds a **penalty** to the loss based on the size of the weights. This discourages the network from developing large weights — and large weights are what enable the complex, wiggly decision boundaries that indicate overfitting.

### L1 Regularization (Lasso)

```
penalty = rate * Σ|wᵢ|
```

Adds the sum of absolute weight values, multiplied by the regularization rate.

**Effect**: Pushes small weights all the way to exactly zero, effectively removing some connections. This creates a **sparse** network where only the most important connections survive.

**Gradient**: The derivative of |w| is `sign(w)` — a constant push toward zero regardless of weight size. Small weights feel the same force as large weights, which is why they tend to get zeroed out.

### L2 Regularization (Ridge)

```
penalty = rate * 0.5 * Σwᵢ²
```

Adds half the sum of squared weight values, multiplied by the regularization rate.

**Effect**: Pushes all weights toward zero proportionally — large weights are penalized more heavily than small ones. The result is a **smoother** decision boundary with no extremely large weights, but connections are rarely eliminated entirely.

**Gradient**: The derivative of 0.5 * w² is just `w` — the push toward zero is proportional to the weight's current value. Large weights feel a stronger pull.

### Regularization Rate

The rate slider controls how strong the penalty is:
- **0**: No regularization.
- **Low values (0.001–0.01)**: Gentle regularization. Allows the network to fit complex patterns while slightly discouraging extreme weights.
- **High values (0.1+)**: Strong regularization. Forces simple decision boundaries. Too high and the network can't learn at all (underfitting).

### How It's Applied in the Code

During weight updates, the regularization gradient is added to the loss gradient before subtracting from the weight:

```
gradient = (loss_gradient + regularization_gradient) * learning_rate / batch_size
new_weight = old_weight - gradient
```

For L1: `regularization_gradient = rate * sign(weight)`
For L2: `regularization_gradient = rate * weight`

**Source file**: `nn/regularization.ts` — penalty and gradient computation, and `nn/neuron.ts` — the `updateWeights()` method where regularization is applied.

---

## 10. How the Visualizations Work

### Decision Boundary (The Big Heatmap)

The large heatmap on the right side of the playground shows what the network has learned — which regions it classifies as blue (+1) and which as orange (-1).

**How it's rendered**:

1. The visualization covers a coordinate space from -6 to +6 on both axes.
2. For every pixel on the canvas (default 250 x 250 pixels), the system:
   - Converts the pixel position to data coordinates
   - Computes the input features for that (x, y) point
   - Runs the forward pass through the network
   - Gets the output value (between -1 and +1)
3. The output value is mapped to a color:
   - **-1** (strong orange class) → orange (#FF6B35)
   - **0** (boundary/uncertain) → white
   - **+1** (strong blue class) → blue (#4A90D9)
   - Values in between get interpolated colors
4. Data points are drawn on top:
   - **Filled circles** = training points
   - **Hollow circles** = test points
   - Color is blue (positive label) or orange (negative label)

**Hover behavior**: When you hover over a hidden neuron in the network diagram, the decision boundary switches to showing **that specific neuron's** output instead of the final network output. This lets you see what each individual neuron has learned. A yellow border and label appear to indicate you're viewing a single neuron.

**Source file**: `visualization/DecisionBoundary.tsx`.

### Network Diagram

The network diagram is an SVG visualization showing layers, neurons, and connections.

**Connections (lines between neurons)**:
- **Color**: Blue for positive weights, orange for negative weights. More intense color means larger weight magnitude.
- **Thickness**: Proportional to the weight's absolute value. A thick line means a strong connection; a thin line means a weak one.
- **Animation**: During training, connections show a "marching ants" animation (dashed lines that appear to move), indicating that learning is in progress. The dash offset advances with each epoch.

**Neurons**:
- **Input neurons**: Simple circles labeled with feature names (X₁, X₂, etc.)
- **Hidden neurons**: Each contains a mini heatmap showing what that neuron has learned. Hovering highlights the neuron in yellow and switches the decision boundary to show that neuron's output.
- **Output neuron**: Contains a mini heatmap of the final network output. Has a green border.

**Layout**: Layers are arranged left to right with 120px spacing. Neurons within a layer are spaced 50px apart vertically and centered.

**Source file**: `visualization/NetworkDiagram.tsx`.

### Neuron Heatmaps (Mini Previews Inside Neurons)

Each hidden neuron and the output neuron contain a tiny heatmap that previews what that neuron responds to.

**How they're rendered**:

1. A 10 x 10 sampling grid is created over the [-6, 6] coordinate space (100 total sample points).
2. For each grid point, the system runs the forward pass up to that specific neuron (for hidden neurons) or through the entire network (for the output neuron).
3. The output value at each grid point is mapped to a color using the same orange-white-blue color scheme as the decision boundary.
4. The 10 x 10 image is rendered to a small canvas and then scaled up to 36 x 36 pixels with nearest-neighbor interpolation (giving a pixelated look).
5. The canvas is clipped to a circle using CSS border-radius.

This gives a low-resolution but fast preview. Computing 100 forward passes per neuron per frame is much cheaper than the 62,500 (250 x 250) forward passes used for the full decision boundary.

**Source files**: `visualization/NeuronHeatmap.tsx` (hidden neurons) and `visualization/OutputHeatmap.tsx` (output neuron).

### Loss Chart

The loss chart tracks training and test loss over time using the Recharts library.

- **Blue line**: Training loss — how well the network fits the training data
- **Orange line**: Test loss — how well the network generalizes to unseen data
- **X-axis**: Epoch number
- **Y-axis**: Loss value (MSE)

Data points are recorded every **10 epochs** (to avoid overwhelming the chart with data). The chart is empty at the start and fills in as training progresses.

**What to look for**:
- Both lines dropping → the network is learning
- Lines converging to a low value → good generalization
- Train loss dropping but test loss rising → overfitting
- Neither line dropping → the network is stuck (try a different architecture, features, or learning rate)

Chart animations are disabled to prevent visual lag during real-time training updates.

**Source file**: `visualization/LossChart.tsx`.

---

## 11. How State Changes Cascade Through the System

Different user actions trigger different chains of effects. Here is what happens for each type of control:

### Change Dataset

```
User selects new dataset
  → generateFullDataset() creates 200 new points
  → Data dispatched to state (SET_DATA)
  → Trainer re-created with new data
  → Epoch reset to 0, loss history cleared
  → Loss recalculated on new data
  → Visualizations redraw with new data points
```

### Change Architecture (Add/Remove Layers or Neurons)

```
User adds a layer or neuron
  → Reducer updates hiddenLayers array
  → Network rebuilt with new architecture and fresh random weights
  → Trainer re-created
  → Epoch reset to 0, loss history cleared
  → Training starts from scratch
```

This is a "hard reset" — the network's previous learning is lost because the architecture changed.

### Toggle a Feature

```
User toggles X₁² on
  → Reducer updates features flags
  → Input size changes (e.g., 2 → 3)
  → Network rebuilt (because input layer size changed)
  → Trainer re-created
  → Training starts from scratch
```

Like architecture changes, toggling features forces a full rebuild.

### Change Learning Rate, Regularization, or Batch Size

```
User adjusts learning rate slider
  → Reducer updates config value
  → trainer.updateConfig() called on existing trainer
  → No rebuild — takes effect on the next training step
  → Training continues from current state
```

These are "soft" changes — the network keeps its current weights and continues learning with the new hyperparameters.

### Change Noise or Train Ratio

```
User adjusts noise slider
  → generateFullDataset() creates new data with new noise level
  → Data dispatched to state
  → Trainer re-created with new data
  → Epoch reset to 0, loss history cleared
  → Network keeps existing weights but training restarts
```

### Change Activation Function

```
User selects new activation
  → Reducer updates activation
  → Network rebuilt with new activation and fresh weights
  → Trainer re-created
  → Training starts from scratch
```

---

## 12. Glossary

**Activation Function**: A mathematical function applied to a neuron's weighted sum. Introduces non-linearity so the network can learn complex patterns. Common choices: ReLU, Tanh, Sigmoid, Linear.

**Backward Pass (Backpropagation)**: The process of computing how much each weight contributed to the prediction error, working backward from the output layer to the input layer. Uses the chain rule from calculus.

**Batch**: A subset of the training data processed together before updating weights. Smaller batches mean more frequent updates but noisier gradients.

**Decision Boundary**: The line (or curve) in the input space where the network's prediction switches from one class to another. Visualized as the border between blue and orange regions in the heatmap.

**Epoch**: One complete pass through all training data. After one epoch, every training sample has been seen exactly once (in a random order).

**Feature Engineering**: Creating new input variables from raw data. For example, computing X₁² from X₁ to help the network learn circular patterns.

**Forward Pass**: The process of computing the network's prediction by passing input through each layer sequentially, from input to output.

**Gradient**: The derivative of the loss with respect to a weight. Tells you the direction and magnitude of the steepest increase in loss — weights are updated in the opposite direction.

**Learning Rate**: Controls the step size of each weight update. Too high and the network overshoots and oscillates. Too low and learning is too slow. Typical values: 0.001 to 0.1.

**Loss**: A single number measuring how wrong the network's predictions are across the dataset. Lower is better. The playground uses Mean Squared Error.

**Mean Squared Error (MSE)**: A loss function that averages the squared differences between predictions and targets: `Σ(prediction - target)² / (2n)`. Penalizes large errors more than small ones.

**Overfitting**: When the network memorizes training data instead of learning general patterns. Symptoms: low training loss but high test loss.

**Regularization**: A penalty added to the loss based on weight magnitude. Discourages the network from developing complex, overfitted solutions. Two types: L1 (promotes sparsity) and L2 (promotes smoothness).

**Xavier/Glorot Initialization**: A method for setting initial random weights that keeps neuron activations in a stable range: `scale = sqrt(2 / (inputs + 1))`. Named after Xavier Glorot, who proved its effectiveness.
