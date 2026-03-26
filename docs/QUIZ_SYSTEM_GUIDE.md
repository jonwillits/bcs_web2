# Quiz System Guide

This guide covers the complete Quiz V2 system — the architecture, configuration, and usage of question banks, mastery checks, and module assessments on the BCS E-Learning Platform.

For a student-oriented walkthrough, see the [User Guide](/guide) sections on Quizzes & Assessments and Achievements. This document is the comprehensive technical and operational reference for faculty and administrators.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Key Concepts](#2-key-concepts)
3. [Question Banks](#3-question-banks)
4. [Question Sets](#4-question-sets)
5. [Quiz Types](#5-quiz-types)
6. [Quiz Blocks](#6-quiz-blocks)
7. [Grading & Scoring](#7-grading--scoring)
8. [XP & Gamification](#8-xp--gamification)
9. [Module Unlock Conditions](#9-module-unlock-conditions)
10. [Analytics & Item Analysis](#10-analytics--item-analysis)
11. [Import & Export](#11-import--export)
12. [Faculty Workflow: Building a Quiz from Scratch](#12-faculty-workflow-building-a-quiz-from-scratch)
13. [Student Experience](#13-student-experience)
14. [FAQ & Troubleshooting](#14-faq--troubleshooting)

---

## 1. System Overview

The quiz system is built around a **question bank architecture**. Instead of creating questions directly inside a quiz, faculty build a reusable bank of questions for each module. Quizzes then pull questions from the bank at attempt time, enabling randomization, reuse, and rich analytics.

Each module can have:
- **One question bank** containing all questions for that module
- **Up to two quizzes**: a **Mastery Check** and a **Module Assessment**

The two quiz types serve different pedagogical purposes and have different default behaviors, but share the same underlying question bank.

### Architecture Diagram

```
Module
├── Question Bank (one per module)
│   ├── Questions (with options + per-option explanations)
│   └── Question Sets (named groups of questions)
│
├── Mastery Check (optional)
│   └── Quiz Blocks → pull N questions from a Question Set
│
└── Module Assessment (optional)
    └── Quiz Blocks → pull N questions from a Question Set
```

---

## 2. Key Concepts

| Concept | Description |
|---------|-------------|
| **Question Bank** | A module-level container for all questions. Auto-created when you first open the Quiz tab. |
| **Question** | A single question with a type (multiple choice, multiple select, or true/false), text, optional image, point value, per-option explanations, and tags. |
| **Question Set** | A named group of questions within a bank. Used to organize questions by topic, difficulty, or chapter. A question can belong to multiple sets. |
| **Quiz** | A configured assessment tied to a module. Has settings for thresholds, timing, feedback, and scoring. |
| **Quiz Block** | A section within a quiz that pulls a specified number of random questions from a question set at attempt time. |
| **Question Instance** | A per-attempt snapshot of a question and its options, preserving the exact version and option order the student saw. |
| **Attempt** | A single student sitting of a quiz, from start to submission. |

---

## 3. Question Banks

Every module has exactly one question bank. It is automatically created the first time you open the Quiz tab in the module editor.

### Questions

Each question has:

| Field | Description |
|-------|-------------|
| **Type** | `Multiple Choice` (one correct), `Multiple Select` (one or more correct), or `True/False` |
| **Question Text** | The question prompt (required) |
| **Image URL** | Optional image to display with the question |
| **Points** | Point value for grading (default: 1) |
| **Shuffle Answers** | Whether to randomize option order per attempt |
| **Tags** | Freeform tags for organization and filtering |
| **Options** | 2+ answer options, each with text, a correct/incorrect flag, and an optional explanation |

#### Per-Option Explanations

Every option can have an **explanation** — a short text explaining why that specific option is correct or incorrect. These explanations are shown to students during mastery check feedback and in full quiz reviews. This is one of the most valuable pedagogical features: students learn not just which answer is right, but *why* each alternative is wrong.

#### Versioning

When you edit a question that has already been used in attempts, the system increments the question's **version number**. Past attempts retain a snapshot of the version the student saw, so historical data is never altered.

### Creating Questions

1. Open the module editor and click the **Quiz** tab
2. Click the **Question Bank** sub-tab
3. Click **New Question**
4. Select the question type, enter the text, set the point value
5. Add answer options with explanations
6. Mark the correct option(s)
7. Click **Save**

### Duplicating Questions

Click the **Duplicate** button on any question to create a copy. This is useful when creating variations of the same question.

---

## 4. Question Sets

Question sets are named groups within a bank. They let you organize questions by topic, chapter, difficulty, or any other grouping.

### Why Sets Matter

Sets are the bridge between the question bank and quizzes. When you create a quiz block, you link it to a set and specify how many questions to pull. This means:

- Different quizzes can pull from the same set
- Each attempt can get a different random subset of questions
- You can add questions to a set over time without modifying the quiz configuration

### Creating Sets

1. In the **Question Bank** sub-tab, click **New Set**
2. Give it a title (e.g., "Chapter 3 — Memory & Cognition")
3. Optionally add tags
4. Add questions to the set by clicking the add button next to each question

### Managing Set Membership

A question can belong to multiple sets simultaneously. For example, a question about synaptic plasticity could be in both a "Neuroscience Basics" set and an "Exam Review" set.

---

## 5. Quiz Types

### Mastery Check

A **mastery check** is a low-stakes, formative assessment designed for practice and learning.

| Setting | Value |
|---------|-------|
| Attempts | Unlimited (always) |
| Feedback timing | Per-question (immediate) |
| Feedback depth | Full (correct answer + all explanations) |
| XP | Awarded on first mastery only; no XP on retakes |

**Student experience**: Questions are presented one at a time. After answering each question, the student clicks "Check Answer" to see immediate feedback — whether they were correct, the right answer, and explanations for every option. They then proceed to the next question. After all questions, the quiz is submitted and scored.

**When to use**: Use mastery checks for study and practice. Students can retake them unlimited times to improve their understanding. The threshold determines what counts as "mastered."

### Module Assessment

A **module assessment** is a higher-stakes, summative evaluation.

| Setting | Description | Default |
|---------|-------------|---------|
| Time Limit | Optional countdown timer in minutes | None |
| Max Attempts | Number of allowed attempts (0 = unlimited) | 0 |
| Pass Threshold | Percentage needed to pass | 70% |
| Scoring Procedure | How the final grade is calculated across attempts | Best |
| Feedback Timing | When students see results | After quiz |
| Feedback Depth | How much detail students see | Full |
| XP | Delta-only: students earn the difference between their new XP and previous best | — |

**Student experience**: All questions are presented at once. Students can answer in any order, navigate freely, and change answers before submitting. If a time limit is set, a countdown timer appears. Answers are auto-saved every 30 seconds.

**When to use**: Use assessments for graded evaluations. Configure the attempt limit, time constraints, and feedback depth based on your course policy.

### Configurable Settings Reference

#### Scoring Procedure (Assessment Only)

When a student takes an assessment multiple times, the **scoring procedure** determines their effective grade:

| Procedure | How it works |
|-----------|--------------|
| **Best** | The highest score across all attempts is the final grade |
| **Last** | The most recent attempt score is the final grade |
| **Average (drop N)** | Average all attempt scores after dropping the N lowest |

#### Feedback Depth (Assessment Only)

| Depth | What the student sees after submission |
|-------|----------------------------------------|
| **Score only** | Total score and pass/fail — no question details |
| **Which wrong** | Which questions were wrong, but not the correct answers |
| **Full** | Correct answers, selected answers, and all explanations |

#### Feedback Timing (Assessment Only)

| Timing | Behavior |
|--------|----------|
| **Per question** | Feedback after each question (same as mastery) |
| **After quiz** | Feedback only after the entire quiz is submitted |

---

## 6. Quiz Blocks

Quiz blocks are the mechanism that connects quizzes to question sets. Each block says: "Pull N random questions from this set."

### How Blocks Work

When a student starts an attempt:

1. The system processes each block in order
2. For each block, it randomly selects the specified number of questions from the linked set
3. If **Randomize within block** is on, the selected questions are shuffled
4. If the quiz has **Randomize blocks** enabled, the block order itself is shuffled
5. Each selected question is snapshotted (text + options frozen at that moment)
6. If a question has **Shuffle answers** enabled, its options are randomized

This means every attempt can present a different combination and order of questions.

### Block Configuration

| Field | Description |
|-------|-------------|
| **Question Set** | Which set to pull questions from |
| **Questions to Pull** | How many questions to select (must be ≤ set size) |
| **Block Title** | Optional section title (e.g., "Part A — Short Answer") |
| **Show Title** | Whether students see the block title |
| **Randomize Within** | Shuffle the order of questions within this block |

### Example Configuration

A quiz with 3 blocks:

| Block | Set | Pull | Effect |
|-------|-----|------|--------|
| Recall Questions | Vocabulary & Definitions | 5 of 20 | 5 random definition questions |
| Application | Case Studies | 3 of 8 | 3 random case analysis questions |
| Synthesis | Critical Thinking | 2 of 5 | 2 random synthesis questions |

Each attempt serves 10 questions, but the specific combination varies.

---

## 7. Grading & Scoring

### Question-Level Grading

All question types use **all-or-nothing** grading:

| Type | Rule |
|------|------|
| Multiple Choice | Correct if the selected option matches the single correct answer |
| True/False | Correct if the selected option matches the correct answer |
| Multiple Select | Correct only if the selected set exactly matches the correct set (no partial credit) |

### Weighted Scoring

Each question has a **weight** (default 1.0) and a **point value**. The final score is:

```
Weighted Score = Σ(weight × points_earned) / Σ(weight × points_possible) × 100
```

For most quizzes where all questions have equal weight and 1 point, this simplifies to `(correct / total) × 100`.

### Pass/Mastery Determination

- **Mastery Check**: Passed if weighted score ≥ mastery threshold (default 80%)
- **Assessment**: Passed if weighted score ≥ pass threshold (default 70%)

---

## 8. XP & Gamification

### Mastery Check XP

- XP is awarded **once** — the first time a student achieves mastery (score ≥ threshold)
- Retakes after mastery award **0 XP**, even with higher scores
- If a student fails their first attempt and masters it on the second, they earn XP on the second attempt

### Assessment XP

Assessment XP uses a **delta-only** model to reward improvement without double-counting:

1. **Base XP** = `quiz_xp_reward × (score / 100)`
2. **Bonuses**:
   - First attempt: 1.25x multiplier
   - Perfect score (100%): 1.5x multiplier
3. **Delta**: `XP awarded = max(0, new_xp - previous_best_xp)`

This means a student who scores 60% on attempt 1 and 80% on attempt 2 earns XP for both, but the second attempt only awards the incremental difference.

### Quiz Achievements

The following achievements can be earned through quiz activity:

| Achievement | Criteria | XP | Badge |
|------------|----------|-----|-------|
| Quiz Taker | Complete 1 quiz | 50 | Bronze |
| Quiz Master | Complete 10 quizzes | 300 | Silver |
| Perfect Score | Score 100% on any quiz | 200 | Gold |
| Speed Quizzer | Complete a timed quiz in less than half the time limit | 150 | Silver |
| Quiz Streak | Pass 5 quizzes in a row | 250 | Silver |
| Master Mind | Pass a mastery check on the first attempt | 100 | Bronze |
| Knowledge Master | Pass 10 mastery checks | 300 | Silver |
| Assessment Ace | Score 90%+ on a module assessment | 200 | Silver |

---

## 9. Module Unlock Conditions

Faculty can gate module completion behind quiz requirements using the **unlock condition** setting on each module.

| Condition | Requirement to complete the module |
|-----------|-----------------------------------|
| **Completion** (default) | No quiz requirement — reading the content is sufficient |
| **Mastery** | Must pass the mastery check before marking complete |
| **Assessment** | Must submit the assessment before marking complete |
| **Both** | Must pass the mastery check AND submit the assessment |

When a module has a quiz requirement, the **Mark Complete** button is disabled until the condition is met. Students see a message explaining what they need to do (e.g., "Complete the mastery check to unlock this module").

---

## 10. Analytics & Item Analysis

### Quiz Analytics Dashboard

Faculty see a real-time analytics panel below each quiz in the editor. It includes:

- **Summary cards**: Unique students, average score, pass rate, average time
- **Score distribution**: Histogram showing how scores cluster (0-20%, 20-40%, etc.)
- **Per-question breakdown**: Correct rate for each question

### Item Analysis

Click **Item Analysis** in the analytics section to see advanced per-question statistics:

| Metric | Description |
|--------|-------------|
| **Correct Rate** | Percentage of students who answered correctly |
| **Average Response Time** | Mean time spent on this question (if response times are tracked) |
| **Point-Biserial Correlation** | Statistical measure of question quality (requires 30+ responses) |
| **Option Distribution** | How many students selected each option, as both count and percentage |

#### Understanding Point-Biserial Correlation

The point-biserial correlation (r_pbi) measures how well a question discriminates between high-performing and low-performing students:

| r_pbi | Interpretation |
|-------|---------------|
| > 0.30 | Good discrimination — strong students tend to get this right |
| 0.15 – 0.30 | Acceptable — some discrimination |
| < 0.15 | Poor — the question doesn't differentiate; consider revising |
| Negative | Problematic — strong students are getting this wrong more often; likely a confusing question or incorrect answer key |

This metric requires at least 30 completed attempts to calculate. Until then, it shows as null.

---

## 11. Import & Export

### JSON Import/Export

Faculty can export a module's entire question bank to JSON and import it into another module. This is useful for:

- Sharing question banks between modules or courses
- Backing up questions before major edits
- Migrating content from external systems

#### Export Format

```json
{
  "schema_version": 1,
  "exported_at": "2026-03-18T...",
  "bank": {
    "title": "Question Bank",
    "questions": [
      {
        "type": "multiple_choice",
        "text": "What is...?",
        "image_url": null,
        "shuffle_answers": false,
        "points": 1,
        "tags": ["chapter3", "recall"],
        "options": [
          {
            "text": "Option A",
            "is_correct": true,
            "explanation": "Correct because..."
          },
          {
            "text": "Option B",
            "is_correct": false,
            "explanation": "Incorrect because..."
          }
        ]
      }
    ],
    "sets": [
      {
        "title": "Chapter 3 Review",
        "tags": ["chapter3"],
        "question_indexes": [0, 1]
      }
    ]
  }
}
```

The `question_indexes` in sets refer to the position of questions in the `questions` array (zero-based).

#### How to Export

1. Open the module editor, go to the **Quiz** tab → **Question Bank** sub-tab
2. Click **Import/Export**
3. Click **Export** to download the JSON file

#### How to Import

1. Open the target module editor, go to the **Quiz** tab → **Question Bank** sub-tab
2. Click **Import/Export**
3. Select your JSON file
4. The system validates the format, creates all questions with options, and recreates sets with the correct memberships

### CSV Grade Export

Faculty can export quiz grades for an entire course as a CSV file. Navigate to the course analytics or use the export button. The CSV includes:

- Student name, email, and ID
- Module title, quiz type, quiz title
- Best score, points earned/possible, attempts used
- Pass status and last attempt date

One row is generated per student per quiz, including students with no attempts (shown as "N/A").

---

## 12. Faculty Workflow: Building a Quiz from Scratch

Here is a step-by-step walkthrough for creating a complete quiz setup for a module.

### Step 1: Build the Question Bank

1. Navigate to `/faculty/modules/edit/[moduleId]`
2. Click the **Quiz** tab, then the **Question Bank** sub-tab
3. Click **New Question**
4. Create 10–20 questions covering the module's key concepts
5. For each question:
   - Choose the type (MC, MS, or T/F)
   - Write the question text
   - Add 3–5 options (2 for T/F)
   - Write an explanation for **every** option (correct and incorrect)
   - Set the point value
   - Add tags for organization
6. Repeat until you have a good pool of questions

### Step 2: Organize into Sets

1. Still in the **Question Bank** sub-tab, click **New Set** and name it (e.g., "Key Concepts")
2. Add relevant questions to the set
3. Create additional sets as needed (e.g., "Application Questions", "Review Questions")
4. A question can be in multiple sets

### Step 3: Configure the Mastery Check

1. Click the **Mastery Check** sub-tab
2. Set the title (e.g., "Module 3 Mastery Check")
3. Set the mastery threshold (default 80%)
4. Set the XP reward (e.g., 50 XP)
5. Click **Add Block** and select a question set
6. Set the number of questions to pull (e.g., 5 of 15)
7. Toggle **Randomize within block** for variety
8. Add more blocks if you want questions from multiple sets
9. Set status to **Published**
10. Click **Create Quiz**

### Step 4: Configure the Assessment (optional)

1. Click the **Assessment** sub-tab
2. Set the title, pass threshold, and XP reward
3. Configure assessment-specific settings:
   - Time limit (e.g., 30 minutes)
   - Max attempts (e.g., 3)
   - Scoring procedure (e.g., Best)
   - Feedback depth (e.g., Full)
4. Add blocks the same way as the mastery check
5. Publish and save

### Step 5: Set the Unlock Condition

1. Go to the **Settings** tab in the module editor
2. Set the **Unlock Condition** to control what students must complete before marking the module done:
   - `completion` — No quiz required
   - `mastery` — Must pass the mastery check
   - `assessment` — Must submit the assessment
   - `both` — Must pass mastery AND submit assessment

### Step 6: Verify

1. Preview the module as a student (use a test account or the preview feature)
2. Confirm the quiz section appears below the module content
3. Take the mastery check and verify per-question feedback works
4. Take the assessment and verify the scoring, feedback, and attempt limits work
5. Check the analytics panel in the editor for quiz statistics

---

## 13. Student Experience

### Finding Quizzes

Quizzes appear automatically at the bottom of any module that has published quizzes. You don't need to navigate to a separate page. After reading the module content, scroll down to find:

- A **Mastered** or **Mastery Check** badge if a mastery check exists
- An **Assessment Passed** or **Assessment** badge if an assessment exists
- The quiz card(s) with a start/retake button

### Taking a Mastery Check

1. Click **Start** on the mastery check card
2. Read the question and select your answer
3. Click **Check Answer** to see immediate feedback
4. Review the explanations — green highlights correct options, red highlights incorrect ones
5. Click **Next Question** to continue
6. After the last question, click **Finish & Submit**
7. See your score and whether you achieved mastery
8. Click **Retake** to try again (unlimited attempts)

### Taking an Assessment

1. Click **Start** on the assessment card
2. All questions appear at once — scroll through and answer each one
3. A progress indicator shows how many you've answered
4. If there's a time limit, a countdown timer appears at the top
5. Your answers are auto-saved every 30 seconds
6. When ready, click **Submit Quiz** and confirm
7. See your score, pass/fail status, and XP earned
8. Click **View History** to see past attempts

### Reviewing Past Attempts

Click **View History** on any quiz to see all your past attempts with:
- Attempt number, score, pass/fail, date, and time spent
- Click any attempt to review your answers and see explanations (subject to the quiz's feedback depth setting)

---

## 14. FAQ & Troubleshooting

**Q: I created a quiz but students don't see it.**
A: Make sure the quiz status is set to **Published**. Draft quizzes are hidden from students.

**Q: A student says they can't mark the module complete.**
A: Check the module's unlock condition. If it's set to "mastery" or "both", the student must pass the mastery check first. The "Mark Complete" button shows a message explaining the requirement.

**Q: Why did a student get 0 XP on their retake?**
A: Mastery checks only award XP once — on the first attempt that achieves mastery. Subsequent retakes earn 0 XP by design. Assessments use delta-only XP: if their new score doesn't exceed their previous best, the delta is 0.

**Q: Can I change a question after students have taken the quiz?**
A: Yes. Editing a question increments its version. Past attempts retain a snapshot of the version the student saw, so historical grades are unaffected.

**Q: How do I create a quiz with questions from multiple topics?**
A: Create separate question sets for each topic, then add multiple blocks to the quiz — one block per set. Each block pulls independently from its set.

**Q: What happens if I set "questions to pull" higher than the number of questions in the set?**
A: The system pulls the minimum of the two. If you set pull=10 but the set has 5 questions, students will get all 5.

**Q: Why is the point-biserial correlation showing as null?**
A: Point-biserial requires at least 30 completed attempts to compute a statistically meaningful result. Once you have enough data, it will populate automatically.

**Q: Can students see the correct answers before submitting?**
A: For mastery checks, students see correct answers after each question (by design). For assessments, correct answers are hidden until after submission, and the level of detail depends on the feedback depth setting.

**Q: How does the timer work?**
A: Assessment timers start when the student begins the attempt. If time expires, the quiz is auto-submitted with whatever answers have been saved. There is a 30-second grace period on the server side.
