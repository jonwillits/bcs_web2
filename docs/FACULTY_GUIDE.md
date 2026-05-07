# Faculty Guide

This guide covers all faculty features on the BCS E-Learning Platform — creating courses and modules, building quizzes, viewing analytics, managing groups, exporting grades, and more.

---

## Table of Contents

1. [Faculty Dashboard](#1-faculty-dashboard)
2. [Managing Courses](#2-managing-courses)
3. [Managing Modules](#3-managing-modules)
4. [Module Content Editor](#4-module-content-editor)
5. [Bulk Media Upload](#5-bulk-media-upload)
6. [Managing Quizzes](#6-managing-quizzes)
7. [Course Analytics](#7-course-analytics)
8. [Course Groups](#8-course-groups)
9. [Gradebook Export](#9-gradebook-export)
10. [Canvas Grade Sync](#10-canvas-grade-sync)
11. [Creating Playgrounds](#11-creating-playgrounds)
12. [Customizing the TensorFlow Playground](#12-customizing-the-tensorflow-playground)
13. [Course Map Editor](#13-course-map-editor)
14. [Program Map Editor](#14-program-map-editor)
15. [Managing Learning Paths](#15-managing-learning-paths)
16. [Editing Faculty Profile](#16-editing-faculty-profile)

---

## 1. Faculty Dashboard

Navigate to `/faculty/dashboard` to access your faculty control center. The dashboard provides:

- **Statistics Cards** — Four cards showing your Modules count, Courses count, Students count, and Views count
- **Quick Actions** — Six shortcut cards:
  - Create Module (`/faculty/modules/create`)
  - Create Course (`/faculty/courses/create`)
  - Module Library (`/faculty/modules`)
  - Program Map (`/faculty/program/edit`)
  - Learning Paths (`/faculty/paths`)
- **Recent Activity** — Your last 5 recently updated modules and courses, each showing the title, status badge, date, and links to View or Edit

---

## 2. Managing Courses

### Creating a Course

1. Go to your Faculty Dashboard and click **Create Course** (or navigate to the course creation page)
2. Fill in the form:
   - **Title** — The course name
   - **Slug** — URL-friendly identifier (auto-generated from title)
   - **Description** — Full course description
   - **Status** — Draft (hidden) or Published (visible to all)
   - **Featured** — Whether to highlight the course
   - **Tags** — Topic tags for categorization
3. Save to create the course

### Editing a Course

Navigate to `/faculty/courses/edit/[id]` to edit an existing course. In addition to the fields above, you can:

- **Add/Remove Modules** — Search for published modules and add them to the course. Drag to reorder.
- **Module Notes** — Add course-specific notes, context, and objectives for each module
- **Manage Collaborators** — Invite other faculty members as co-instructors
- **View Activity Feed** — See recent changes made by collaborators

### Publishing a Course

Toggle the Status from "Draft" to "Published" and save. Published courses appear in the public catalog.

---

## 3. Managing Modules

### Creating a Module

1. Navigate to the module creation page from your dashboard
2. Fill in the form:
   - **Title** and **Slug**
   - **Description**
   - **Content** — Rich text content for the module
   - **Status** — Draft or Published
   - **Tags**
   - **Parent Module** — Optionally nest under another module
   - **Difficulty Level** — Beginner, Intermediate, Advanced, or Boss
   - **Quest Type** — Standard, Challenge, Boss, or Bonus
   - **XP Reward** — Experience points awarded on completion (default: 100)
3. Save the module

### Choosing Difficulty Level, Quest Type, and XP

These three fields work together to create the gamified learning experience students see on the course map.

**Difficulty Level** determines the color of the module node on the course map and signals to students how challenging the content is:

| Difficulty | Color | When to use |
|-----------|-------|-------------|
| Beginner | Green | Introductory content, no prior knowledge needed |
| Intermediate | Blue | Builds on foundational concepts |
| Advanced | Orange | Requires solid understanding of prerequisites |
| Boss | Red/Purple | Most challenging content, typically end-of-section assessments or capstone modules |

**Quest Type** determines the icon shown on the course map and how the module counts toward achievements:

| Quest Type | Icon | When to use |
|-----------|------|-------------|
| Standard | Regular learning content (most modules) |
| Challenge | Modules that test understanding — problem sets, case studies, critical thinking exercises. Completing 5 earns the "Challenge Accepted" achievement. |
| Boss | Major milestone modules — final exams, capstone projects, comprehensive assessments. Completing one earns the "Boss Slayer" achievement. |
| Bonus | Optional enrichment content — supplementary readings, advanced topics, fun explorations |

**XP Reward** is the experience points students earn when they mark the module complete. Suggested values:

| XP | Use for |
|----|---------|
| 50 | Short, simple modules (quick reads, single-concept introductions) |
| 100 | Standard modules (default — typical lesson content) |
| 150–200 | Longer or more complex modules (multi-topic lessons, exercises) |
| 250–300 | Challenge or advanced modules |
| 500+ | Boss modules, capstone projects, major assessments |

These are guidelines, not rules. The key is internal consistency within a course — if a standard module is 100 XP, a module that takes twice the effort should be roughly 200 XP.

### Cloning a Module

On the Module Library page, faculty members see a **Clone** button on module cards. Clicking it opens a dialog where you can:

- See the original module name and author
- Enter a new title for the cloned module
- Choose whether to clone media associations and collaborators
- The clone starts as a private draft in your library

Cloning also copies the module's **entire question bank** — all questions, answer options, explanations, question sets, and set memberships. Any quizzes (mastery checks and assessments) configured on the original module are cloned as well, including their blocks and settings. This means you can clone a fully quizzed module and immediately have a working copy without re-creating the quiz setup from scratch.

### Editing a Module

Navigate to `/faculty/modules/edit/[id]` to update any module field, add media, or change the hierarchy. The editor has three tabs: **Edit** (content), **Settings** (metadata, difficulty, unlock conditions), and **Quiz** (question bank and assessments).

---

## 4. Module Content Editor

The rich text editor supports:

- **Text formatting** — Bold, italic, strikethrough, inline code
- **Headings** — H1, H2, H3
- **Lists** — Bullet and numbered
- **Block quotes**
- **Text alignment** — Left, center, right
- **Links** — Click the link icon and enter a URL
- **Images** — Click the upload icon to upload from your computer or enter an image URL. Images are stored in Supabase and served from your media library.
- **YouTube videos** — Click the video icon (next to the upload icon) and paste a YouTube link. Supports `youtube.com/watch?v=...`, `youtu.be/...`, and `youtube.com/shorts/...` URLs. You can also **paste a YouTube URL directly** into the editor text — it auto-converts to an embedded video. Videos render at 16:9 aspect ratio and are responsive on mobile. Privacy mode is on by default (uses `youtube-nocookie.com`).
- **Markdown import** — Click the import icon to upload a `.md` file, which replaces the editor content
- **Undo / Redo** — Standard keyboard shortcuts (`Ctrl+Z` / `Ctrl+Y`)
- **Auto-save** — Content is automatically saved after 2 seconds of inactivity

---

## 5. Bulk Media Upload

The **Media** panel (right sidebar of the module editor) supports uploading multiple files at once:

1. Click **Media** to expand the panel
2. Drag and drop multiple files or click to browse
3. Files upload in parallel — each shows its own progress indicator
4. Uploaded files appear in the module's media library and can be inserted into content

Supported file types include images (PNG, JPG, GIF, WebP, SVG) and documents. This is useful for uploading a full lecture's worth of figures and diagrams in one go.

---

## 6. Managing Quizzes

The **Quiz** tab in the module editor is where you build question banks and configure quizzes. Each module supports one question bank and up to two quizzes: a **Mastery Check** (formative, unlimited attempts) and a **Module Assessment** (summative, configurable limits).

> For the full technical reference — including block configuration, scoring procedures, XP calculations, item analysis, and import/export — see the [Quiz System Guide](/guide/quiz-system).

### Question Bank

The question bank is a reusable pool of questions for the module. It is auto-created when you first open the Quiz tab.

1. **Create questions** — Click **New Question** and choose from Multiple Choice, Multiple Select, or True/False. Write the question text, add answer options, and write an explanation for each option (explaining why it's correct or incorrect). Set the point value and optional tags.
2. **Organize into sets** — Click **New Set** to group questions by topic or difficulty (e.g., "Chapter 3 Review"). A question can belong to multiple sets. Sets are what quiz blocks pull from.
3. **Import/Export** — Click **Import/Export** to download the bank as JSON or upload a JSON file from another module.

### Building a Quiz

1. Select the **Mastery Check** or **Assessment** tab
2. Set the title, status (draft or published), and type-specific settings:
   - **Mastery Check**: mastery threshold (default 80%), XP reward
   - **Assessment**: time limit, max attempts, pass threshold, scoring procedure (best/last/average), feedback timing and depth, XP reward
3. Click **Add Block** to create a quiz section. Each block links to a question set and specifies how many questions to randomly pull from it per attempt
4. Configure block settings: randomize within, show title to students
5. Click **Create Quiz** (or **Update Quiz** if editing)

### Quiz Analytics

Below each quiz, a real-time analytics panel shows:

- **Summary**: unique students, average score, pass rate, average completion time
- **Score distribution**: histogram across score ranges
- **Per-question analysis**: correct rate for each question
- **Item Analysis**: click to see advanced statistics including option distribution and point-biserial correlation (available after 30+ responses)

### Module Unlock Conditions

On the **Settings** tab, set the **Unlock Condition** to require students to complete quizzes before marking the module done:

| Condition | Requirement |
|-----------|-------------|
| Completion | No quiz required (default) |
| Mastery | Must pass the mastery check |
| Assessment | Must submit the assessment |
| Both | Must pass mastery AND submit assessment |

---

## 7. Course Analytics

Navigate to the analytics dashboard for any course you own to see student engagement at a glance. The dashboard shows:

- **Statistics cards** — Total Enrollments, Active Students (last 7 days), Completion Rate, and Average Progress
- **Module Completion Rates chart** — Bar chart of completion percentages across your top modules
- **Enrollment Trend chart** — Line chart of new enrollments over the last 30 days
- **Module Performance table** — Per-module breakdown with Started, Completed, Completion Rate, and Dropoff Rate columns
- **Recent Completions** — The latest 10 module completions with timestamps

### Filtering by Group

If you have created course groups (see below), a **group picker** appears in the dashboard header. Selecting a group filters **all** dashboard data — cards, charts, table, and recent activity — to show only the students in that group. The "Export Grades" button respects the same filter.

---

## 8. Course Groups

Course groups let you scope your analytics and grade exports to a specific set of students. This is particularly useful when your platform enrollment is open but you only want to track or export grades for the students in your actual class section.

### Creating a Group

1. From the course analytics page, click **Groups** in the top-right corner (or navigate to `/faculty/courses/[id]/groups`)
2. Click **Create Group**
3. Enter a **name** (e.g., "Spring 2026 Section A"), optional **description**, and optional **Canvas Course ID** (the numeric ID from your Canvas course URL — used for [Canvas grade sync](/guide/canvas-integration))
4. Click **Create**

### Adding Members

1. Open a group and click **Add Members**
2. Search for enrolled students by name or email, or paste a list of emails
3. Only students who are actively enrolled in the course can be added
4. Each student can belong to **at most one group** per course. If you try to add a student who is already in another group, you'll see an error with the conflicting group name

### Managing Groups

- **Rename or update** a group by clicking its edit button
- **Remove members** individually from the group detail view
- **Delete a group** — this removes the group and all its memberships (students are not unenrolled from the course)

---

## 9. Gradebook Export

The **Export Grades** button on the analytics dashboard lets you download student grades in two formats:

### Excel (.xlsx)

Downloads a workbook with **two sheets**:

1. **Course Gradebook** — One row per student with columns: Student Name, Student Email, Student ID, Overall Grade %, Total Points Earned, Total Points Possible, Quizzes Attempted, Quizzes Passed, Modules Completed, Modules Total, Last Activity
2. **Quiz Breakdown** — One row per student per quiz with columns: Student Name, Student Email, Student ID, Module Title, Quiz Type, Quiz Title, Best Score %, Points Earned, Points Possible, Attempts Used, Passed, Last Attempt Date

### CSV

CSV files can only contain one sheet, so you choose which one to download:
- **Course Gradebook** — Same columns as the Excel gradebook sheet
- **Quiz Breakdown** — Same columns as the Excel quiz sheet

### Canvas CSV

Downloads a CSV file formatted specifically for **Canvas LMS grade import**. Unlike the regular CSV which has one row per student per quiz, the Canvas CSV uses a **pivot table** layout with one column per quiz — exactly the format Canvas expects when you use "Import" in the Canvas gradebook.

The file includes:
- **Student** and **SIS Login ID** (email) columns for Canvas to match students
- One column per quiz, named to match the Canvas assignment naming convention (e.g., "Module Title — Quiz Title")
- A **Points Possible** row that tells Canvas the point value of each assignment
- Each student's **best score** (in points) for each quiz, with blank cells for unattempted quizzes

**How to use it:**
1. Click **Export Grades** > **Canvas CSV** to download the file
2. In Canvas, go to your course's **Grades** page
3. Click the **Import** button (top-right)
4. Upload the downloaded CSV file
5. Canvas will preview the import — review the column mappings and click **Save Changes**

Canvas automatically creates assignments for any quiz column names it does not recognize. Students are matched by their **SIS Login ID** (email address), so student emails must match between BCS and Canvas.

> **Tip:** If you select a group before exporting, the Canvas CSV will only include students in that group. This is recommended so the file matches the roster of a specific Canvas course section.

### Grade Calculation

The overall grade is calculated as: `sum(best points earned across all quizzes) / sum(total points possible) * 100`, rounded to one decimal place. Students with zero quiz attempts show 0%.

### Group Filtering

If you select a group from the picker before clicking Export, the download only includes students in that group. The filename also includes the group name for easy identification.

---

## 10. Canvas Grade Sync

If your group has a Canvas Course ID configured, a **Sync to Canvas** button appears next to "Export Grades" when that group is selected. This pushes quiz grades directly to your Canvas gradebook — one Canvas assignment per quiz, matched by student email.

For the complete setup walkthrough, see the dedicated [Canvas LMS Grade Sync Guide](/guide/canvas-integration).

---

## 11. Creating Playgrounds

Faculty members see a **Create Playground** button in the playground gallery. Clicking it opens the Playground Builder at `/playgrounds/builder`.

The builder has three panels:

1. **Toolbar** — Title input, save status indicator, view mode buttons (code-only, split, preview-only), dependency manager toggle, and Save button
2. **Code Editor** — A full code editor with syntax highlighting, line numbers, and inline error display. The editor loads a starter template for new playgrounds.
3. **Live Preview** — Shows the running output of your code, updating automatically as you type

Use the **dependency manager** (package icon) to add npm packages like Three.js, Framer Motion, D3, Recharts, and more.

Keyboard shortcut: **Cmd/Ctrl+S** to save.

### Viewing and Managing Playgrounds

When viewing a playground you own, additional action buttons appear in the header:

- **Version History** — View previous versions and revert if needed
- **Edit** — Open the builder to modify the code

These actions are also available to admins on any playground.

### Forking Playgrounds

When viewing a playground created by another user, click the **Fork** button to create your own copy. The forked version opens in the builder for you to modify.

---

## 12. Customizing the TensorFlow Playground

The TensorFlow Neural Network Playground at `/playgrounds/tensorflow` is built directly into the codebase (unlike the React/Sandpack playgrounds, which are stored in the database). This means that customizing it requires editing source code files and deploying the changes. This section provides a complete guide for making common modifications, even if you are not deeply familiar with the tech stack.

> **Want to understand how the playground works first?** See the [TensorFlow Playground Technical Guide](/guide/tensorflow-technical) for a detailed explanation of the neural network engine, training process, datasets, and visualizations.

### Prerequisites

Before making changes, you will need:

1. **A code editor** — [Visual Studio Code](https://code.visualstudio.com/) (free) is recommended. Download and install it.
2. **Git** — Version control software. Check if it is installed by opening a terminal and typing `git --version`. If not installed, download from [git-scm.com](https://git-scm.com/).
3. **Node.js** — The JavaScript runtime. Check with `node --version`. If not installed, download from [nodejs.org](https://nodejs.org/) (use the LTS version).
4. **Access to the GitHub repository** — You need to be able to clone and push to the project repository.

**The workflow for any change is:**
1. Open the project folder in VS Code
2. Edit the relevant file(s)
3. Save your changes
4. Open a terminal (in VS Code: `Terminal > New Terminal`)
5. Run `git add .` then `git commit -m "Describe your change"` then `git push`
6. Vercel automatically deploys from the main branch — your changes will be live within a few minutes

### How the Playground is Organized

The playground is split across two directories. Here is a plain-English map of what each file does:

**Page file** — Controls the browser tab title and SEO description:
- `src/app/playgrounds/tensorflow/page.tsx`

**Main component** — Assembles all the panels, sets section headers like "Network Architecture", "Output", and "Loss Over Time":
- `src/components/tensorflow-playground/TensorFlowPlayground.tsx`

**Controls** (6 panels in the left and right columns):
| Panel | File | What it configures |
|-------|------|--------------------|
| Playback (play/pause/step/reset) | `controls/PlaybackControls.tsx` | Training controls and epoch/loss display |
| Data (dataset selector, noise, ratio, batch size) | `controls/DataControls.tsx` | Which dataset to use, noise level, train/test split |
| Features (X1, X2, X1^2, etc.) | `controls/FeatureControls.tsx` | Which input features are enabled |
| Network (activation function, layers, neurons) | `controls/NetworkControls.tsx` | Network architecture controls |
| Learning (learning rate, regularization) | `controls/LearningControls.tsx` | Training hyperparameters |
| Output legend (Negative/Positive labels) | Inline in `TensorFlowPlayground.tsx` | Color legend below the decision boundary |

All control files are in `src/components/tensorflow-playground/controls/`.

**Visualizations** (3 visual components):
| Visualization | File | What it shows |
|---------------|------|---------------|
| Network Diagram | `visualization/NetworkDiagram.tsx` | Interactive diagram of layers, neurons, and weight connections |
| Decision Boundary | `visualization/DecisionBoundary.tsx` | Heatmap showing how the network classifies the 2D space |
| Loss Chart | `visualization/LossChart.tsx` | Line chart of training and test loss over time |

All visualization files are in `src/components/tensorflow-playground/visualization/`.

**Engine** (the neural network math — you generally do not need to touch these):
| File | Purpose |
|------|---------|
| `data/datasets.ts` | Dataset generator functions (circle, XOR, Gaussian, spiral) |
| `data/features.ts` | Feature definitions and transformations |
| `nn/network.ts` | Neural network forward/backward pass |
| `nn/neuron.ts` | Individual neuron weights and biases |
| `nn/activations.ts` | Activation functions (ReLU, Tanh, Sigmoid, Linear) |
| `nn/regularization.ts` | L1 and L2 regularization |
| `training/trainer.ts` | Training loop (batch processing, shuffling) |
| `training/loss.ts` | Loss calculation (Mean Squared Error) |

All engine files are in `src/lib/tensorflow-playground/`.

**State management** — Holds all default values, preset option lists, and network limits:
- `src/lib/tensorflow-playground/types.ts` — Default values and preset arrays
- `src/components/tensorflow-playground/context/PlaygroundContext.tsx` — Network limits (max layers, max neurons)

### Common Modifications — Step by Step

Each modification below tells you exactly which file to open, what to look for, and what to change.

#### a. Change the page title or description

**File:** `src/app/playgrounds/tensorflow/page.tsx`

Find these lines near the top:

```typescript
title: 'Neural Network Playground | BCS E-Learning',
description:
  'Interactive neural network visualization. Explore how neural networks learn by adjusting architecture, datasets, and training parameters.',
```

Change the text inside the quotes to whatever you want. The `title` appears in the browser tab. The `description` appears in search engine results and social media previews.

#### b. Change the main heading and subtitle

**File:** `src/components/tensorflow-playground/TensorFlowPlayground.tsx`

Find these lines:

```typescript
Neural Network Playground
```

and:

```typescript
Explore neural networks interactively. Adjust the architecture, pick a dataset, and watch the network learn.
```

Change the text to whatever you want. These appear at the top of the playground page.

#### c. Change the default starting configuration

**File:** `src/lib/tensorflow-playground/types.ts`

Find the `INITIAL_STATE` object near the bottom of the file. These are the values the playground starts with when a user first loads the page:

```typescript
export const INITIAL_STATE: PlaygroundState = {
  hiddenLayers: [4, 2],        // Start with 2 hidden layers: 4 neurons, then 2 neurons
  activation: 'tanh',          // Starting activation function
  learningRate: 0.03,          // Starting learning rate
  regularization: 'none',      // No regularization by default
  regularizationRate: 0,       // Regularization strength
  batchSize: 10,               // Samples per training step
  dataset: 'circle',           // Starting dataset
  noise: 0,                    // No noise by default
  trainRatio: 50,              // 50% train, 50% test
  features: { ...DEFAULT_FEATURES },  // Which features are on/off
  ...
};
```

For example:
- To start with 3 hidden layers of 4, 3, and 2 neurons: change `hiddenLayers: [4, 2]` to `hiddenLayers: [4, 3, 2]`
- To start with the XOR dataset: change `dataset: 'circle'` to `dataset: 'xor'`
- To start with a learning rate of 0.01: change `learningRate: 0.03` to `learningRate: 0.01`

To change which features are enabled by default, find the `DEFAULT_FEATURES` object above `INITIAL_STATE`:

```typescript
export const DEFAULT_FEATURES: FeatureFlags = {
  x1: true,     // enabled by default
  x2: true,     // enabled by default
  x1Sq: false,  // disabled by default
  x2Sq: false,
  x1x2: false,
  sinX1: false,
  sinX2: false,
};
```

Change `false` to `true` (or vice versa) for any feature you want to toggle.

#### d. Change available preset values

**File:** `src/lib/tensorflow-playground/types.ts`

The dropdown menus for learning rate, regularization rate, and batch size are populated from these arrays:

```typescript
export const LEARNING_RATES = [
  0.00001, 0.0001, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10
];

export const REGULARIZATION_RATES = [
  0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10
];

export const BATCH_SIZES = [1, 10, 20, 30];
```

Add or remove values from these arrays. For example, to add a batch size of 50, change the line to:

```typescript
export const BATCH_SIZES = [1, 10, 20, 30, 50];
```

#### e. Change network limits (max layers, max neurons)

**File:** `src/components/tensorflow-playground/context/PlaygroundContext.tsx`

Find these lines in the reducer function:

```typescript
case 'ADD_LAYER':
  if (state.hiddenLayers.length >= 6) return state;
```

Change `6` to your desired maximum number of hidden layers.

```typescript
case 'REMOVE_LAYER':
  if (state.hiddenLayers.length <= 1) return state;
```

Change `1` to your desired minimum (though 1 is usually sensible).

```typescript
case 'ADD_NEURON': {
  const newLayers = [...state.hiddenLayers];
  if (newLayers[action.layerIndex] < 8) {
```

Change `8` to your desired maximum neurons per layer.

```typescript
case 'REMOVE_NEURON': {
  const newLayers = [...state.hiddenLayers];
  if (newLayers[action.layerIndex] > 1) {
```

Change `1` to your desired minimum neurons per layer.

**Also update the tooltip text** in `src/components/tensorflow-playground/controls/NetworkControls.tsx` to match your new limits. Search for strings like `"max 6"` and `"max 8"` and update them.

#### f. Change dataset labels or tooltips

**File:** `src/components/tensorflow-playground/controls/DataControls.tsx`

Find the `DATASETS` array near the top of the file:

```typescript
const DATASETS: DatasetOption[] = [
  {
    type: 'circle',
    label: 'Circle',
    tooltip: 'Circular boundary - simple classification',
    icon: ( ... ),
  },
  {
    type: 'xor',
    label: 'XOR',
    tooltip: 'XOR problem - requires non-linear boundary',
    icon: ( ... ),
  },
  ...
];
```

Change the `label` string to change what users see, and the `tooltip` string to change the hover description.

#### g. Change visualization colors

The playground uses a consistent color scheme: **orange (#FF6B35)** for the negative class and **blue (#4A90D9)** for the positive class.

**Decision Boundary colors** — `src/components/tensorflow-playground/visualization/DecisionBoundary.tsx`

Find the `valueToColor` function. The key color values are:
- Orange (negative): `r=255, g=107, b=53` (hex #FF6B35)
- Blue (positive): `r=74, g=144, b=217` (hex #4A90D9)

Also find the data point colors further down:
```typescript
const fillColor = isPositive ? '#4A90D9' : '#FF6B35';
```

**Network Diagram colors** — `src/components/tensorflow-playground/visualization/NetworkDiagram.tsx`

Search for the same hex values (`#4A90D9`, `#FF6B35`) to change connection weight colors.

**Loss Chart colors** — `src/components/tensorflow-playground/visualization/LossChart.tsx`

Find the line colors for train loss and test loss:
```
stroke="#4A90D9"   (train loss — blue)
stroke="#FF6B35"   (test loss — orange)
```

**Color legend** — `src/components/tensorflow-playground/TensorFlowPlayground.tsx`

Find the legend dots:
```typescript
<div className="w-3 h-3 rounded-full bg-[#FF6B35]" />
<span>Negative</span>
...
<div className="w-3 h-3 rounded-full bg-[#4A90D9]" />
<span>Positive</span>
```

If you change the colors, update them consistently across all four files.

#### h. Change visualization sizes

**Decision Boundary canvas size** — In `TensorFlowPlayground.tsx`, find:
```typescript
<DecisionBoundary width={220} height={220} />
```
Change `220` to make it larger or smaller.

**Loss Chart height** — In the same file, find:
```typescript
<LossChart height={180} />
```

**Neuron radius in the network diagram** — In `visualization/NetworkDiagram.tsx`, find:
```typescript
const NEURON_RADIUS = 18;
const LAYER_SPACING = 120;
const NEURON_SPACING = 50;
```
Adjust these values to change the network diagram layout.

#### i. Change section labels in the UI

**File:** `src/components/tensorflow-playground/TensorFlowPlayground.tsx`

The section headers are plain text strings. Search for:
- `Network Architecture` — the header above the network diagram
- `Loss Over Time` — the header above the loss chart
- `Output` — the header above the decision boundary
- `Negative` / `Positive` — the legend labels

Change these strings to whatever you prefer.

#### j. Add a new dataset

This is a multi-step modification:

**Step 1** — Add the generator function in `src/lib/tensorflow-playground/data/datasets.ts`. Copy an existing generator (e.g., `generateCircle`) and modify the math. Your function should accept `(n: number, noise: number)` and return `DataPoint[]`.

**Step 2** — Add the dataset type. In `src/lib/tensorflow-playground/types.ts`, find:
```typescript
export type DatasetType = 'circle' | 'xor' | 'gaussian' | 'spiral' | 'plane' | 'gaussianReg';
```
Add your new type name, e.g.: `| 'myDataset'`

**Step 3** — Wire it into the generator switch. In `datasets.ts`, find the `generateDataset` function and add a case:
```typescript
case 'myDataset':
  return generateMyDataset(n, noise);
```

**Step 4** — Add a display name. In the `getDatasetName` function in the same file, add:
```typescript
case 'myDataset':
  return 'My Dataset';
```

**Step 5** — Add it to the UI dropdown. In `src/components/tensorflow-playground/controls/DataControls.tsx`, add a new entry to the `DATASETS` array with a `type`, `label`, `tooltip`, and `icon` (SVG).

### File Quick-Reference Table

| What you want to change | File to edit | What to look for |
|--------------------------|-------------|------------------|
| Browser tab title | `src/app/playgrounds/tensorflow/page.tsx` | `title:` string |
| SEO description | `src/app/playgrounds/tensorflow/page.tsx` | `description:` string |
| Main heading / subtitle | `src/components/tensorflow-playground/TensorFlowPlayground.tsx` | `Neural Network Playground` and paragraph text |
| Section labels (Output, Loss Over Time, etc.) | `src/components/tensorflow-playground/TensorFlowPlayground.tsx` | Uppercase text strings |
| Default dataset, learning rate, layers, etc. | `src/lib/tensorflow-playground/types.ts` | `INITIAL_STATE` object |
| Default enabled features | `src/lib/tensorflow-playground/types.ts` | `DEFAULT_FEATURES` object |
| Learning rate options | `src/lib/tensorflow-playground/types.ts` | `LEARNING_RATES` array |
| Batch size options | `src/lib/tensorflow-playground/types.ts` | `BATCH_SIZES` array |
| Regularization rate options | `src/lib/tensorflow-playground/types.ts` | `REGULARIZATION_RATES` array |
| Max hidden layers (6) | `src/components/tensorflow-playground/context/PlaygroundContext.tsx` | `>= 6` in ADD_LAYER case |
| Max neurons per layer (8) | `src/components/tensorflow-playground/context/PlaygroundContext.tsx` | `< 8` in ADD_NEURON case |
| Dataset labels / tooltips | `src/components/tensorflow-playground/controls/DataControls.tsx` | `DATASETS` array |
| Activation function list | `src/components/tensorflow-playground/controls/NetworkControls.tsx` | `ACTIVATIONS` array |
| Decision boundary colors | `src/components/tensorflow-playground/visualization/DecisionBoundary.tsx` | `#FF6B35` and `#4A90D9` |
| Loss chart line colors | `src/components/tensorflow-playground/visualization/LossChart.tsx` | `stroke=` values |
| Network diagram neuron size | `src/components/tensorflow-playground/visualization/NetworkDiagram.tsx` | `NEURON_RADIUS` |
| Decision boundary canvas size | `src/components/tensorflow-playground/TensorFlowPlayground.tsx` | `width={220} height={220}` |
| Loss chart height | `src/components/tensorflow-playground/TensorFlowPlayground.tsx` | `height={180}` |
| Dataset generator math | `src/lib/tensorflow-playground/data/datasets.ts` | `generate...` functions |
| Color legend labels | `src/components/tensorflow-playground/TensorFlowPlayground.tsx` | `Negative` / `Positive` |
| Page background color | `src/app/playgrounds/tensorflow/page.tsx` | `bg-[#0a0a0f]` |

### Deploying Your Changes

After editing files:

1. **Save all files** in VS Code (`Cmd+S` on Mac, `Ctrl+S` on Windows)
2. **Open a terminal** in VS Code (`Terminal > New Terminal`)
3. **(Optional but recommended)** Run `npm run build` to check for errors before pushing. If the build succeeds, your changes are safe to deploy. If it fails, see Troubleshooting below.
4. **Stage your changes:**
   ```
   git add .
   ```
5. **Commit with a description:**
   ```
   git commit -m "Change default dataset to XOR"
   ```
6. **Push to GitHub:**
   ```
   git push
   ```
7. **Vercel auto-deploys** from the main branch. Your changes will be live at the production URL within a few minutes. You can check the deployment status in the Vercel dashboard.

### Troubleshooting

**Syntax errors** — If you see a red squiggly underline in VS Code, hover over it to see the error. Common causes:
- Missing comma between array items or object properties
- Missing closing quote (`'` or `"`)
- Missing closing bracket (`}`, `]`, or `)`)
- Mismatched quotes (opened with `'` but closed with `"`)

**TypeScript errors** — If `npm run build` fails with a TypeScript error, the error message will tell you the file and line number. For example:
```
src/lib/tensorflow-playground/types.ts(204,5): error TS...
```
This means the error is in `types.ts` at line 204. Look at that line for the issue.

**Undoing changes** — If something goes wrong and you want to revert a file to its last committed state:
```
git checkout -- path/to/file.tsx
```
For example:
```
git checkout -- src/lib/tensorflow-playground/types.ts
```
This discards your local changes to that file and restores the last committed version.

**Build check before pushing** — You can always run `npm run build` locally to verify everything compiles correctly before pushing. This catches most errors before they reach production.

---

## 13. Course Map Editor

Navigate to `/faculty/course-map` to access the Course Map Editor. This tool lets you:

- **Position Modules** — Drag module nodes on a 2D canvas to arrange the course map
- **Set Prerequisites** — Define which modules must be completed before others
- **Configure Module Properties** — Set difficulty levels, quest types, and XP rewards
- **Auto-Layout** — The system can automatically arrange modules if no positions are set
- **Save Layout** — Persist your changes

Module nodes are color-coded by difficulty:
- Green — Beginner
- Blue — Intermediate
- Orange — Advanced
- Red/Purple — Boss

Quest type indicators:
- Standard
- Challenge
- Boss
- Bonus

### How Positioning Works

Module positions on the course map use a **percentage-based coordinate system** (0–100 for both X and Y). This means positions are relative to the canvas size and will scale correctly on any screen:

- **X** = 0 is the left edge, X = 100 is the right edge
- **Y** = 0 is the top, Y = 100 is the bottom
- The default position for new modules is (50, 50) — center of the canvas

You can position modules by **dragging them** on the visual editor. The auto-layout algorithm will automatically arrange modules if it detects that multiple modules are stacked at the default position or overlapping (within 10% distance). It arranges modules in rows based on their prerequisite depth — modules with no prerequisites go at the top, their dependents go below them, and so on.

**Tips for good layouts:**
- Place introductory/prerequisite modules near the top-left
- Arrange modules left-to-right or top-to-bottom in learning order
- Keep related modules close together, with prerequisite arrows flowing downward
- Leave space between nodes so labels don't overlap — a spacing of 15–20 units works well

---

## 14. Program Map Editor

Navigate to `/faculty/program/edit` to arrange courses on the program map. Drag course nodes to position them, define prerequisites between courses, and save the layout. The program map uses the same percentage-based coordinate system (0–100) as the course map.

---

## 15. Managing Learning Paths

Faculty can create and edit learning paths from `/faculty/paths`. The Learning Path Form includes:

- **Title** and **Slug** fields
- **Description**
- **Course Selection** — Choose from published courses and add them to the path
- **Drag-and-Drop Ordering** — Reorder courses by dragging
- **Featured** toggle and **Sort Order** setting

---

## 16. Editing Faculty Profile

Navigate to your profile edit page at `/faculty/profile/edit` to update your bio, speciality, university, interested fields, avatar, and social links.
