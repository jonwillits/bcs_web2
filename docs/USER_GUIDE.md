# BCS E-Learning Platform User Guide

Welcome to the **Brain & Cognitive Sciences (BCS) E-Learning Platform** — an interactive learning platform built for students, faculty, and researchers in the brain and cognitive sciences. This guide walks you through the platform from a student and visitor perspective — browsing courses, tracking progress, earning achievements, and more.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Getting Started](#2-getting-started)
3. [Navigating the Platform](#3-navigating-the-platform)
4. [Browsing Courses](#4-browsing-courses)
5. [Viewing a Course](#5-viewing-a-course)
6. [Browsing Modules](#6-browsing-modules)
7. [Interactive Playgrounds](#7-interactive-playgrounds)
8. [Learning Paths](#8-learning-paths)
9. [Network Visualization](#9-network-visualization)
10. [Program Map](#10-program-map)
11. [User Profiles](#11-user-profiles)
12. [Student Features](#12-student-features) — Enrollment, Quizzes & Assessments, Progress, Achievements

---

## 1. Platform Overview

The BCS E-Learning Platform is a web-based learning environment designed specifically for brain and cognitive sciences education. It provides:

- **Interactive courses** with hierarchical module structures and rich media content
- **Standalone modules** that can be shared across multiple courses
- **Quizzes & assessments** — mastery checks for practice with instant feedback, and module assessments for graded evaluation, both powered by randomized question banks
- **Interactive playgrounds** — live-running React/JavaScript demos for simulations, visualizations, and neural network experiments
- **Network visualization** — an interactive graph showing how courses and modules relate to each other
- **Learning paths** — curated sequences of courses for guided progression
- **Progress tracking** — enrollment, module completion, quiz performance, and achievement tracking for students

### User Roles

| Role | Description |
|------|-------------|
| **Public Visitor** | Can browse all courses, modules, playgrounds, and visualizations without an account |
| **Student** | Can enroll in courses, track progress, mark modules complete, and earn achievements |
| **Faculty** | Can create and manage courses, modules, and playgrounds |
| **Admin** | Platform management and user administration |

---

## 2. Getting Started

### Visiting the Homepage

When you first visit the platform, you'll see the homepage with three main sections:

1. **Hero Section** — A large banner introducing the platform with the heading "Interactive Learning for the Mind" and a brief description. Two buttons let you jump in:
   - **Start Exploring** takes you to the course catalog
   - **Explore Network** takes you to the interactive network visualization

2. **Featured Courses** — A grid of highlighted courses chosen by the platform's faculty. Each course card shows the title, description, instructor, module count, and tags. Click any card to start reading, or click **View All Courses** to browse the full catalog.

3. **Advanced Learning Features** — Six feature cards describing the platform's capabilities: Neural Learning Pathways, Interactive Modules, Collaborative Learning, Real-time Analytics, Adaptive Assessment, and Hierarchical Content.

### Creating an Account

To create an account, click **Sign In** in the top-right corner of the header, then click **Create an account** on the login page.

First, choose your role:

- **Student** — Enroll in courses and track your progress
- **Faculty** — Create courses and manage content (requires admin approval)

Then fill in the common fields:

- **Full Name** — Letters, spaces, hyphens, and apostrophes only (max 100 characters)
- **Email Address** — A valid email (max 255 characters)
- **Password** — Must be 8–128 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character (`@$!%*?&`)
- **Confirm Password**

#### Student Registration

Students also provide:

- **Major** — Select from a predefined list of academic fields
- **Expected Graduation Year** — Select from a dropdown (current year through 10 years ahead)
- **Academic Interests** (optional) — Type to search and select from suggested interests; selected interests appear as removable tags

After submitting, a verification email is sent and you're redirected to the login page.

#### Faculty Registration

Faculty also provide:

- **University** — The institution you are affiliated with
- **Department** — Your academic department
- **Title/Position** — Select from a list (Professor, Associate Professor, Assistant Professor, Lecturer, etc.)
- **Research Area/Speciality** — Your primary area of research or teaching
- **Personal/Academic Website** (optional) — Your personal or departmental website (helps verify credentials)
- **Statement** — Explain why you need faculty access and how you plan to use the platform (minimum 50 characters, maximum 2,000)

If you register with a non-`.edu` email address, a warning will note that additional verification may be required.

After submitting, your account is created with a **Pending Faculty** status. You'll receive a verification email and be redirected to a Pending Approval page.

### Email Verification

After registering, check your inbox for a verification email. Click the verification link to activate your account. Verification links are valid for **24 hours** and can only be used once.

If you don't receive the email:

- Check your spam/junk folder
- On the verification page or login page, enter your email to resend the verification (there is a 60-second cooldown between resend requests)

You must verify your email before you can log in.

### Logging In

Navigate to `/auth/login` or click **Sign In** in the header. Enter your email and password. If you've forgotten your password, click **Forgot your password?** to receive a password reset email. Reset links are valid for **1 hour**.

### Faculty Approval Process

After registering as faculty:

1. Your account is created with "Pending Faculty" status
2. You'll see a Pending Approval page explaining that your request is under review
3. Administrators review your credentials, university affiliation, and statement
4. Most requests are reviewed within 1–2 business days
5. You'll receive an email notification once your request is approved or declined
6. Once approved, your role is upgraded to Faculty and you gain access to the faculty dashboard and content creation tools
7. While waiting, you can still browse courses and modules as a public visitor

---

## 3. Navigating the Platform

### Header / Navigation Bar

The header is a sticky bar at the top of every page. It contains:

- **Logo** — The Brain & Cognitive Sciences logo and name (abbreviated to "BCS" on mobile). Click it to return to the homepage.
- **Navigation Links** — The first several links are shown inline; additional links appear in a **More** dropdown menu. All users see links to Home, Courses, Modules, Learning Paths, Program Map, and Playgrounds. Students also see My Learning and Network. Additional links appear based on your role once logged in.
- **Search Bar** — A global search field with the placeholder "Search courses, modules, people..." Use it to quickly find content across the platform.
- **User Menu** — When logged in, your name and role appear. Clicking opens a dropdown with links to your profile, achievements, learning dashboard, and sign out.

On mobile devices, the navigation collapses into a hamburger menu.

### Footer

The footer at the bottom of every page contains four columns:

1. **Brand** — Platform name, description, and social media icons
2. **Explore** — Links to Course Catalog, Module Library, Network Visualization, and Interactive Playgrounds
3. **For Faculty** — Links to Sign In, Create Account, Dashboard, and Create Content
4. **About** — Links to the About page, GitHub repository, and Contact Support

---

## 4. Browsing Courses

Navigate to `/courses` (or click **Courses** in the header) to open the Course Catalog.

### Catalog Layout

At the top of the page you'll find:

- **Search Bar** — Search across course titles, descriptions, authors, and tags
- **Quick Links** — Shortcuts to the Program Map and Learning Paths
- **Stats Dashboard** — Four cards showing Total Courses, Total Instructors, Total Modules, and Featured Courses

### Featured Courses Section

Below the stats, up to three featured courses appear in a highlighted grid. Each card shows the course title, a brief description, the author, module count, last updated date, and a "Featured" badge. Click **Start Learning** to jump into the course.

### All Courses Section

The full catalog appears below with sorting and filtering controls:

- **Sort** — Newest First, Oldest First, A–Z, Z–A, or Most Modules
- **Instructor Filter** — Filter courses by a specific instructor
- **Featured Only** — Toggle to show only featured courses
- **View Mode** — Switch between Grid (card) and List views
- **Tag Filters** — Click any tag pill to filter courses by topic. The selected tag is highlighted in blue.

Each course card displays the title, description (3-line preview), author, module count, last updated date, tags (up to 3 shown), and an **Explore Course** button.

### Pagination

The catalog paginates at 20 courses per page. Navigation controls at the bottom show page numbers, Previous/Next buttons, and a count of courses displayed (e.g., "Showing 1–20 of 45 courses").

---

## 5. Viewing a Course

Click on any course to open the Course Viewer at `/courses/[slug]`.

### Course Header

A sticky header bar at the top shows:

- **Back to Catalog** link
- **Course Title** and author
- **Module Count**
- **Course Map** button — opens the Course Map visualization for this course
- **Share** button — copies the course URL to your clipboard
- **Fullscreen** toggle

On mobile, the header simplifies to show icon-only buttons and a hamburger menu for the sidebar.

### Course Overview

When you first open a course (before selecting a module), you'll see the **Course Overview** page with:

- The full course description
- Metadata: module count, last updated date, featured status
- **Start Course** button (for logged-in users)
- **Instructor Cards** — Each instructor is shown with their avatar, name, role (Course Creator or Co-Instructor), speciality, university, bio excerpt, and social links (LinkedIn, Google Scholar, Website, GitHub, Twitter)

### Module Sidebar

On the left side (or as a full-screen overlay on mobile), a sidebar lists all modules in the course:

- **Search Box** — Filter modules by title within the sidebar
- **Module List** — Each module shows a sequential number, title, and description excerpt. Click a module to load its content.
- If the course has hierarchical (nested) modules, they appear as an expandable tree structure.

### Reading Module Content

When you select a module, the main content area shows:

- **Module Header** — Title with a brain icon, description, "Module X of Y" badge, estimated reading time, author, and last updated date
- **Course-Specific Notes** (if provided) — Collapsible section with tabs for Notes, Context, and Objectives added by the instructor
- **Module Content** — The full module text rendered as rich HTML content. Click any image to zoom in.
- **Mark Complete** button — Available to enrolled students (see [Student Features](#12-student-features))
- **Next Module** button — Navigates to the next module in sequence
- **Resources** — If the module has attached files, a table lists each resource with its name, type, size, and a download button

### Navigation Footer

At the bottom of each module:

- **Previous / Next** buttons to move between modules
- A **progress indicator** showing your position (e.g., "3 of 12 modules") with filled/empty dots
- **Keyboard navigation** — Use the left and right arrow keys to move between modules

### All Course Modules

Below the content, a grid shows all modules in the course as cards. Each card displays the module number, title, description, reading time, and a "Current" badge for the module you're viewing. Click any card to jump to that module.

---

## 6. Browsing Modules

Navigate to `/modules` to open the Module Library.

### Module Catalog

The layout is similar to the Course Catalog, with:

- **Search Bar** and stats (Total Modules, Total Authors, Root Modules, Modules with Submodules)
- **Root Modules** section highlighting top-level foundational modules
- **All Modules** section with sorting, filtering, and grid/list view options

### Filters and Controls

- **Sort** — Newest, Oldest, A–Z, Z–A, or Most Submodules
- **Author Filter** — Filter by a specific author
- **Root Only** — Toggle to show only root-level modules (no parent)
- **Tag Filters** — Click tag pills to filter by topic

### Module Cards

Each module card shows:

- Title with a file icon
- "Root" badge (if it has no parent) and "Published" badge
- "Sub-module of: [Parent Title]" link (if it's a child module)
- Description, tags, author, submodule count, and last updated date
- **Explore Module** button

### Viewing a Module

Click a module to open it at `/modules/[slug]`. The view is similar to the course module viewer, with the module's content, resources, and hierarchical navigation if it has submodules.

---

## 7. Interactive Playgrounds

Navigate to `/playgrounds` to browse interactive code demos.

### Playground Gallery

The gallery has four tabs:

| Tab | Contents |
|-----|----------|
| **All** | Featured and community playgrounds combined |
| **Featured** | Curated playgrounds marked by administrators |
| **Community** | User-created public playgrounds |
| **My Playgrounds** | Your own playgrounds (logged-in users) |

### Category Filters

Filter playgrounds by clicking category buttons:

- Simulations
- Visualizations
- 3D Graphics
- Neural Networks
- Algorithms
- UI Components
- Tutorials
- Other

### Playground Cards

Each card displays a gradient thumbnail with a category icon, the title, description, author name, view count, creation date, category label, and a "Featured" badge if applicable.

### Viewing a Playground

Click a card to open the playground viewer at `/playgrounds/[id]`. You'll see:

- A **thin header bar** with the playground title, a Back button, and action buttons:
  - **Info** — Opens a slide-out drawer with the title, author, view count, creation date, category, description, tags, and dependencies
  - **Fork** — Create a personal copy of the playground
- A **full-screen live preview** showing the running playground output

### TensorFlow Neural Network Playground

A standalone tool at `/playgrounds/tensorflow` provides a dedicated neural network playground experience, separate from the React-based playgrounds. It lets you experiment with neural network architectures, datasets, and training parameters in real time — adjust the number of layers and neurons, pick a dataset, tune the learning rate, and watch the network learn to classify data points.

For a detailed explanation of how the playground works internally (training flow, neural network math, datasets, visualizations), see the [TensorFlow Playground Technical Guide](/guide/tensorflow-technical).

---

## 8. Learning Paths

Navigate to `/paths` to browse curated learning paths.

A learning path is an ordered sequence of courses designed to guide you through a topic from start to finish. Each path shows:

- Title and description
- The courses included (in order)
- Whether it's featured

Click a path to view its details at `/paths/[slug]`, which lists the courses in the recommended sequence.

---

## 9. Network Visualization

Navigate to `/network` to see an interactive graph of the platform's courses and modules.

The network visualization uses React Flow to display:

- **Course Nodes** — Larger nodes with gradient backgrounds representing courses
- **Module Nodes** — Smaller nodes representing individual modules
- **Edges** — Lines connecting courses to their modules, showing relationships

### Controls

- **Pan** — Click and drag the background
- **Zoom** — Scroll wheel or pinch gesture
- **Minimap** — A small overview in the corner showing your position
- **Zoom Controls** — Buttons to zoom in, zoom out, and fit the entire graph to the screen

Click any node to navigate to the corresponding course or module.

---

## 10. Program Map

Navigate to `/program/map` to see a full program map visualization.

The program map shows how courses relate to each other, including prerequisites. What you see depends on your authentication status:

- **Authenticated + Enrolled** — A personalized view highlighting your progress and enrolled courses
- **Authenticated + Not Enrolled** — The full map with an option to enroll
- **Public Visitor** — The full map with a prompt to sign in for tracking

---

## 11. User Profiles

### Viewing a Profile

Visit `/profile/[userId]` to view any user's public profile. Profiles display:

- **Avatar** — Profile image or a gradient circle with the user's initial
- **Name and Email**
- **Role Badge** — Student, Faculty, or Admin
- **Instructor Badge** — Shown for faculty/admins with published courses
- **University** and **Speciality** (if provided)
- **Social/Academic Links** — Google Scholar, Personal Website, LinkedIn, Twitter, GitHub (when provided)

Faculty profiles also show their published courses.

### Editing Your Profile

Navigate to your profile edit page to update your information. The fields available depend on your role:

**Faculty Profile Fields:**
- Name, About, Speciality, University
- Interested Fields (add/remove tags)
- Avatar URL
- Social links: Google Scholar, Personal Website, LinkedIn, Twitter, GitHub

**Student Profile Fields:**
- Name, About, University
- Major (from predefined list)
- Graduation Year
- Academic Interests (add/remove tags)
- Avatar URL
- Social links: Personal Website, LinkedIn, Twitter, GitHub

### Achievements

Visit `/profile/achievements` to view your earned milestones and learning achievements. The page shows all available achievements organized by category, with earned badges highlighted and locked ones grayed out. Your current level, total XP, and streak are displayed at the top. See the [Achievements & Gamification](#achievements--gamification) section under Student Features for a complete breakdown of how XP, levels, and achievements work.

---

## 12. Student Features

### Enrolling in a Course

When viewing a course, click the **Start Course** button on the course overview page. This enrolls you and enables progress tracking for that course.

### Tracking Progress

Once enrolled in a course:

- A **reading progress bar** appears at the very top of the page — a gradient bar that fills as you scroll through module content
- Each module has a **Mark Complete** button that records your completion
- The navigation footer shows a **dot progress indicator** reflecting how many modules you've completed

### Quizzes & Assessments

Modules may include quizzes that appear below the module content after you enroll. There are two types:

#### Mastery Checks

Mastery checks are **practice quizzes** designed for learning:

- Questions are shown **one at a time**
- After answering, click **Check Answer** to see immediate feedback — whether you were correct, the right answer, and explanations for each option
- You have **unlimited attempts** to achieve mastery
- Mastery is achieved when your score meets the threshold (typically 80%)
- XP is awarded once, on the first attempt that achieves mastery

#### Module Assessments

Module assessments are **graded evaluations**:

- All questions appear at once — answer in any order
- A timer counts down if the quiz is timed
- Your answers auto-save every 30 seconds
- Click **Submit Quiz** when finished (confirm before submitting — you cannot change answers afterward)
- The number of allowed attempts may be limited
- XP is based on your score, with bonuses for first attempts and perfect scores

#### Quiz Unlock Conditions

Some modules require you to complete quizzes before you can mark the module as done. When this is the case, the **Mark Complete** button will show a message explaining what you need to do — for example, "Complete the mastery check to unlock this module." Possible requirements:

- Pass the mastery check
- Submit the assessment
- Both of the above

#### Reviewing Past Attempts

Click **View History** on any quiz card to see all your past attempts, including scores, pass/fail status, and time spent. Click an attempt to review your answers and read the explanations (subject to the quiz's feedback settings).

### My Learning Dashboard

Navigate to `/learning` to see your personalized learning dashboard. It shows:

- **Statistics Cards** — Four cards displaying Total Enrolled Courses, Courses Completed, Modules Completed, and Average Progress percentage
- **Enrolled Courses** — All courses you've started, sorted by most recently accessed. Each course shows the title, description, instructor info (name, avatar, university), module count, a progress bar with completion percentage, modules completed vs total, start date, and last accessed date. Click **Continue Learning** to jump back into a course.
- **Recent Activity** — Your last 10 completed modules with the module title, course title, and completion date

### Achievements & Gamification

Visit `/profile/achievements` to see milestones you've earned through learning activity on the platform.

#### How XP and Levels Work

Every module has an **XP reward** (set by the course creator). When you mark a module complete, that XP is added to your total. Your **level** is calculated from your total XP using the formula:

> Level = floor(sqrt(total_xp / 100))

This means early levels come quickly, but higher levels require progressively more XP:

| Level | Total XP Required |
|-------|-------------------|
| 1 | 100 |
| 2 | 400 |
| 3 | 900 |
| 5 | 2,500 |
| 10 | 10,000 |
| 25 | 62,500 |

#### Achievement Categories

Achievements are earned automatically when you meet their criteria. They are grouped into categories:

**Completion** — Based on how many modules or courses you've completed:
- First Steps (1 module, 50 XP, bronze)
- On a Roll (5 modules, 100 XP, bronze)
- Double Digits (10 modules, 200 XP, silver)
- Quarter Century (25 modules, 500 XP, gold)
- Half Century (50 modules, 1,000 XP, gold)
- Course Champion (1 course, 250 XP, silver)
- Triple Threat (3 courses, 500 XP, gold)
- Academic Achiever (5 courses, 1,000 XP, gold)

**Consistency** — Based on learning streaks (consecutive days with activity):
- Getting Consistent (3-day streak, 100 XP, bronze)
- Week Warrior (7-day streak, 250 XP, silver)
- Fortnight Focus (14-day streak, 500 XP, gold)
- Monthly Dedication (30-day streak, 1,000 XP, gold)

**Mastery** — Based on difficulty and special accomplishments:
- Perfectionist (complete a course at 100%, 300 XP, silver)
- Boss Slayer (complete a boss-level module, 200 XP, silver)
- Challenge Accepted (complete 5 challenge modules, 300 XP, gold)
- Chain Breaker (complete a course with prerequisites, 200 XP, silver)
- Foundation Scholar (complete all foundation courses, 500 XP, gold)

**Quiz** — Based on quiz performance:
- Quiz Taker (complete 1 quiz, 50 XP, bronze)
- Quiz Master (complete 10 quizzes, 300 XP, silver)
- Perfect Score (score 100% on any quiz, 200 XP, gold)
- Speed Quizzer (complete a timed quiz in less than half the time limit, 150 XP, silver)
- Quiz Streak (pass 5 quizzes in a row, 250 XP, silver)
- Master Mind (pass a mastery check on the first attempt, 100 XP, bronze)
- Knowledge Master (pass 10 mastery checks, 300 XP, silver)
- Assessment Ace (score 90%+ on a module assessment, 200 XP, silver)

**Speed** — Based on completing modules quickly:
- Quick Learner (3 modules in one day, 150 XP, bronze)
- Speed Demon (5 modules in one day, 300 XP, silver)

**Level Milestones** — Earned when you reach certain levels:
- Level 5 (100 XP, bronze), Level 10 (250 XP, silver), Level 25 (500 XP, gold), Level 50 (1,000 XP, gold)

Achievement badges come in four tiers: **gray** (locked), **bronze**, **silver**, and **gold**.
