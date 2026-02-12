# BCS E-Textbook Platform User Guide

Welcome to the **Brain & Cognitive Sciences (BCS) E-Textbook Platform** — an interactive learning platform built for students, faculty, and researchers in the brain and cognitive sciences. This guide walks you through every part of the platform, from browsing courses as a visitor to managing content as faculty or administering the platform as an admin.

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
10. [Curriculum Map](#10-curriculum-map)
11. [User Profiles](#11-user-profiles)
12. [Student Features](#12-student-features)
13. [Faculty Features](#13-faculty-features)
14. [Admin Features](#14-admin-features)
15. [Quick Reference](#15-quick-reference)

---

## 1. Platform Overview

The BCS E-Textbook Platform is a web-based learning environment designed specifically for brain and cognitive sciences education. It provides:

- **Interactive courses** with hierarchical module structures and rich media content
- **Standalone modules** that can be shared across multiple courses
- **Interactive playgrounds** — live-running React/JavaScript demos for simulations, visualizations, and neural network experiments
- **Network visualization** — an interactive graph showing how courses and modules relate to each other
- **Learning paths** — curated sequences of courses for guided progression
- **Progress tracking** — enrollment, module completion, and achievement tracking for students

### User Roles

| Role | Description |
|------|-------------|
| **Public Visitor** | Can browse all courses, modules, playgrounds, and visualizations without an account |
| **Student** | Can enroll in courses, track progress, mark modules complete, and earn achievements |
| **Faculty** | Can create and manage courses, modules, and playgrounds; view analytics |
| **Admin** | Full platform management: user administration, faculty approvals, content moderation, audit logs |

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
- **Navigation Links** — The first several links are shown inline; additional links appear in a **More** dropdown menu. The links you see depend on your role:

**All Users:**
- Home, Courses, Modules, Learning Paths, Curriculum, Playgrounds

**Students (additional):**
- My Learning, Network

**Faculty (additional):**
- Dashboard, My Learning, Visualization, My Modules, My Courses, Create Module, Network

**Admins (additional):**
- Admin Dashboard, Users, Analytics, Audit Logs, Faculty Requests, plus all faculty links

- **Search Bar** — A global search field with the placeholder "Search courses, modules, people..." Use it to quickly find content across the platform.
- **User Menu** — When logged in, your name and role appear. Clicking opens a dropdown with:
  - My Profile
  - My Achievements
  - Admin Tools (admin only): Admin Dashboard, User Management, Platform Analytics, Audit Logs
  - Faculty Tools (faculty/admin only): Dashboard, My Courses, My Modules, Quest Map Editor
  - My Learning
  - Edit Profile
  - Sign Out

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
- **Quick Links** — Shortcuts to the Curriculum Map and Learning Paths
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
- **Course Map** button — opens the Quest Map visualization for this course
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
- **Explore Module** button (or **View** + **Clone** buttons for faculty)

### Viewing a Module

Click a module to open it at `/modules/[slug]`. The view is similar to the course module viewer, with the module's content, resources, and hierarchical navigation if it has submodules.

### Cloning a Module (Faculty)

Faculty members see a **Clone** button on module cards. Clicking it opens a dialog where you can:

- See the original module name and author
- Enter a new title for the cloned module
- Choose whether to clone media associations and collaborators
- The clone starts as a private draft in your library

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
| **My Playgrounds** | Your own playgrounds (logged-in faculty only) |

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
  - **Version History** — View previous versions (owners/admins only)
  - **Fork** — Create a personal copy of the playground (non-owners only)
  - **Edit** — Open the builder to modify the code (owners/admins only)
- A **full-screen live preview** showing the running playground output

### Creating a Playground (Faculty)

Faculty members see a **Create Playground** button in the gallery. Clicking it opens the Playground Builder at `/playgrounds/builder`.

The builder has three panels:

1. **Toolbar** — Title input, save status indicator, view mode buttons (code-only, split, preview-only), dependency manager toggle, and Save button
2. **Code Editor** — A full code editor with syntax highlighting, line numbers, and inline error display. The editor loads a starter template for new playgrounds.
3. **Live Preview** — Shows the running output of your code, updating automatically as you type

Use the **dependency manager** (package icon) to add npm packages like Three.js, Framer Motion, D3, Recharts, and more.

Keyboard shortcut: **Cmd/Ctrl+S** to save.

### TensorFlow Neural Network Playground

A standalone tool at `/playgrounds/tensorflow` provides a dedicated neural network playground experience, separate from the React-based playgrounds.

---

## 8. Learning Paths

Navigate to `/paths` to browse curated learning paths.

A learning path is an ordered sequence of courses designed to guide you through a topic from start to finish. Each path shows:

- Title and description
- The courses included (in order)
- Whether it's featured

Click a path to view its details at `/paths/[slug]`, which lists the courses in the recommended sequence.

### Creating Learning Paths (Faculty)

Faculty members can create and edit learning paths from their dashboard. The Learning Path Form includes:

- **Title** and **Slug** fields
- **Description**
- **Course Selection** — Choose from published courses and add them to the path
- **Drag-and-Drop Ordering** — Reorder courses by dragging
- **Featured** toggle and **Sort Order** setting

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

## 10. Curriculum Map

Navigate to `/curriculum/map` to see a full curriculum visualization.

The curriculum map shows how courses relate to each other, including prerequisites. What you see depends on your authentication status:

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

Visit `/profile/achievements` to view your earned milestones and learning achievements.

---

## 12. Student Features

### Enrolling in a Course

When viewing a course, click the **Start Course** button on the course overview page. This enrolls you and enables progress tracking for that course.

### Tracking Progress

Once enrolled in a course:

- A **reading progress bar** appears at the very top of the page — a gradient bar that fills as you scroll through module content
- Each module has a **Mark Complete** button that records your completion
- The navigation footer shows a **dot progress indicator** reflecting how many modules you've completed

### My Learning Dashboard

Navigate to `/learning` to see your personalized learning dashboard. It shows:

- **Statistics Cards** — Four cards displaying Total Enrolled Courses, Courses Completed, Modules Completed, and Average Progress percentage
- **Enrolled Courses** — All courses you've started, sorted by most recently accessed. Each course shows the title, description, instructor info (name, avatar, university), module count, a progress bar with completion percentage, modules completed vs total, start date, and last accessed date. Click **Continue Learning** to jump back into a course.
- **Recent Activity** — Your last 10 completed modules with the module title, course title, and completion date

### Achievements

Visit `/profile/achievements` to see milestones you've earned through learning activity on the platform.

---

## 13. Faculty Features

### Faculty Dashboard

Navigate to `/faculty/dashboard` to access your faculty control center. The dashboard provides:

- **Statistics Cards** — Four cards showing your Modules count, Courses count, Students count, and Views count
- **Quick Actions** — Six shortcut cards:
  - Create Module (`/faculty/modules/create`)
  - Create Course (`/faculty/courses/create`)
  - Module Library (`/faculty/modules`)
  - Curriculum Map (`/faculty/curriculum/edit`)
  - Learning Paths (`/faculty/paths`)
- **Recent Activity** — Your last 5 recently updated modules and courses, each showing the title, status badge, date, and links to View or Edit

### Managing Courses

#### Creating a Course

1. Go to your Faculty Dashboard and click **Create Course** (or navigate to the course creation page)
2. Fill in the form:
   - **Title** — The course name
   - **Slug** — URL-friendly identifier (auto-generated from title)
   - **Description** — Full course description
   - **Status** — Draft (hidden) or Published (visible to all)
   - **Featured** — Whether to highlight the course
   - **Tags** — Topic tags for categorization
3. Save to create the course

#### Editing a Course

Navigate to `/faculty/courses/edit/[id]` to edit an existing course. In addition to the fields above, you can:

- **Add/Remove Modules** — Search for published modules and add them to the course. Drag to reorder.
- **Module Notes** — Add course-specific notes, context, and objectives for each module
- **Manage Collaborators** — Invite other faculty members as co-instructors
- **View Activity Feed** — See recent changes made by collaborators

#### Publishing a Course

Toggle the Status from "Draft" to "Published" and save. Published courses appear in the public catalog.

### Managing Modules

#### Creating a Module

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
   - **XP Reward** — Experience points awarded on completion
3. Save the module

#### Editing a Module

Navigate to `/faculty/modules/edit/[id]` to update any module field, add media, or change the hierarchy.

### Course Analytics

Faculty can view student engagement metrics for their courses, including enrollment counts and completion rates.

### Creating Playgrounds

See [Interactive Playgrounds > Creating a Playground](#creating-a-playground-faculty) above for the full playground builder workflow.

### Forking Playgrounds

When viewing a playground created by another user, click the **Fork** button to create your own copy. The forked version opens in the builder for you to modify.

### Quest Map Editor

Navigate to `/faculty/curriculum/edit` to access the Quest Map Editor. This tool lets you:

- **Position Modules** — Drag module nodes on a 2D canvas to arrange the quest map
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
- 📚 Standard
- ⚡ Challenge
- 👑 Boss
- ⭐ Bonus

### Curriculum Map Editor

Navigate to `/faculty/curriculum/edit` to arrange courses on the curriculum map. Drag course nodes to position them, define prerequisites between courses, and save the layout.

### Managing Learning Paths

Faculty can create and edit learning paths from `/faculty/paths`. See [Learning Paths](#8-learning-paths) for details on the path creation form.

### Editing Faculty Profile

Navigate to your profile edit page at `/faculty/profile/edit` to update your bio, speciality, university, interested fields, avatar, and social links.

---

## 14. Admin Features

### Admin Dashboard

Navigate to `/admin/dashboard` for a bird's-eye view of the platform:

- **Statistics Cards** — Six cards showing Total Users, Students, Faculty, Pending Requests, Total Courses, and Total Modules
- **Pending Faculty Requests** — Up to 5 pending requests, each showing the requester's name, email, request date, and a Review button. A "View All" link leads to the full requests page.
- **Recent Registrations** — The last 5 users to join, each showing their name, email, role badge, and registration date

### User Management

Navigate to `/admin/users` to manage platform users:

- **Search** — Find users by name or email
- **Filter by Role** — All, Student, Faculty, Pending Faculty, or Admin
- **Filter by Status** — All, Active, or Suspended
- **Pagination** — 20 users per page
- **User Table** — Each row shows the user's name, email, role badge, email verification status, creation date, and stats (courses authored, modules authored, courses started)
- **Actions per user:**
  - **Edit** — Change role or account status via a dialog
  - **Suspend / Activate** — Toggle account status (with confirmation)
  - **Delete** — Permanently remove a user (with confirmation)

### Faculty Request Review

Navigate to `/admin/faculty-requests` to review pending faculty registration requests. Each request card shows:

- Requester's name, email, and email verification status
- Request date
- Expandable details: university, department, title/position, research area, personal website, and the applicant's statement

Admin actions for each request:

- **Approve** — Opens a confirmation dialog explaining the action. Grants the user full faculty access.
- **Decline** — Opens a dialog requiring a decline reason (sent to the applicant).
- An optional admin note field is available for internal record-keeping.

All approval and decline actions are recorded in the audit log.

### Content Moderation

Navigate to `/admin/content` to manage all courses and modules across the platform:

- **Tabs** — Switch between Courses and Modules
- **Search** — Find content by title
- **Course cards** show: title, author (name and email), module count, enrolled student count, status badge, last updated date
- **Module cards** show: title, author (name and email), difficulty level, quest type, course usage count, status badge, last updated date
- **Actions per item:**
  - **View** — Open the course or module
  - **Edit** — Navigate to the edit page
  - **Unpublish** — Hide from public view (with confirmation showing impact on enrolled students)
  - **Delete** — Permanently remove (with confirmation)

### Platform Analytics

Navigate to `/admin/analytics` for platform-wide metrics:

- **User Analytics** — Total users with breakdown by role (pie chart), active users, suspended users, unverified users
- **Content Analytics** — Total courses and modules with published/draft breakdowns
- **Enrollment Analytics** — Total enrollments, active/completed counts, and completion rate percentage
- **Trends** — User growth over time (line chart)
- **Recent Activity** — Latest user registrations, course creations, and enrollments

### Audit Logs

Navigate to `/admin/audit-logs` to view a chronological record of administrative actions:

- **Filter by Action** — Role Change, Status Change, Deleted User, Approved Faculty, Declined Faculty
- **Filter by Target Type** — User, Course, Module
- **Pagination** — 20 entries per page

Each log entry shows:
- The action taken (color-coded badge)
- Target type and ID
- The admin who performed the action
- Timestamp
- Reason (if provided)
- Additional details (expandable)

---

## 15. Quick Reference

### Page Directory

| Page | URL | Access |
|------|-----|--------|
| Homepage | `/` | Public |
| Course Catalog | `/courses` | Public |
| Course Viewer | `/courses/[slug]` | Public |
| Module in Course | `/courses/[slug]/[moduleSlug]` | Public |
| Quest Map | `/courses/[slug]/map` | Public |
| Module Library | `/modules` | Public |
| Module Viewer | `/modules/[slug]` | Public |
| Playground Gallery | `/playgrounds` | Public |
| Playground Viewer | `/playgrounds/[id]` | Public |
| Playground Builder | `/playgrounds/builder` | Faculty |
| TensorFlow Playground | `/playgrounds/tensorflow` | Public |
| Learning Paths | `/paths` | Public |
| Learning Path Detail | `/paths/[slug]` | Public |
| Network Visualization | `/network` | Public |
| Curriculum Map | `/curriculum/map` | Public |
| User Profile | `/profile/[userId]` | Public |
| Achievements | `/profile/achievements` | Authenticated |
| Login | `/auth/login` | Guest |
| Register | `/auth/register` | Guest |
| My Learning | `/learning` | Authenticated |
| Faculty Dashboard | `/faculty/dashboard` | Faculty |
| Faculty Course Library | `/faculty/courses` | Faculty |
| Create Course | `/faculty/courses/create` | Faculty |
| Edit Course | `/faculty/courses/edit/[id]` | Faculty |
| Faculty Module Library | `/faculty/modules` | Faculty |
| Create Module | `/faculty/modules/create` | Faculty |
| Edit Module | `/faculty/modules/edit/[id]` | Faculty |
| Faculty Profile Edit | `/faculty/profile/edit` | Faculty |
| Student Profile Edit | `/student/profile/edit` | Student |
| Faculty Learning Paths | `/faculty/paths` | Faculty |
| Create Learning Path | `/faculty/paths/create` | Faculty |
| Edit Learning Path | `/faculty/paths/edit/[slug]` | Faculty |
| Curriculum Map Editor | `/faculty/curriculum/edit` | Faculty |
| Quest Map Editor | `/faculty/quest-map` | Faculty |
| Faculty Visualization | `/faculty/visualization` | Faculty |
| Admin Dashboard | `/admin/dashboard` | Admin |
| User Management | `/admin/users` | Admin |
| Faculty Requests | `/admin/faculty-requests` | Admin |
| Content Moderation | `/admin/content` | Admin |
| Platform Analytics | `/admin/analytics` | Admin |
| Audit Logs | `/admin/audit-logs` | Admin |
| Admin Profile Edit | `/admin/profile/edit` | Admin |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `←` / `→` Arrow Keys | Navigate between modules (in course viewer) |
| `Ctrl/Cmd + F` | Focus the search field |
| `Ctrl/Cmd + S` | Save (in playground builder) |
| `Escape` | Close drawers and modals |
