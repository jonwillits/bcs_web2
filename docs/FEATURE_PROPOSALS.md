# 🚀 BCS E-Textbook Platform - Feature Proposals & Roadmap

**Document Version:** 1.2
**Date:** January 2025
**Status:** Proposed Features for Implementation

---

## 📋 Executive Summary

This document outlines **22 high-value features** to transform the BCS E-Textbook Platform from a content delivery system into a comprehensive educational ecosystem. Features are organized into 3 implementation phases based on priority, complexity, and educational impact, with **critical security enhancements** prioritized as #2.

**Total Estimated Timeline:** 6-8 months for all phases
**Tech Stack:** Next.js 15 + React 19 + PostgreSQL + Prisma
**Deployment:** Vercel-optimized (serverless)

---

## 📊 Current State Analysis

### ✅ What Currently Exists

**Faculty Features:**
- Rich content creation with Tiptap editor
- Course/module management with hierarchical structure
- Media upload and management
- Graph-based visualization tools
- User profiles with academic links
- Dashboard with basic stats

**Public/Student Features:**
- Browse courses and modules
- Public course viewing
- Search functionality (basic)
- Network visualization
- User profiles viewing

**Infrastructure:**
- NextAuth v5 authentication
- Email verification & password reset (Resend)
- PostgreSQL database with Prisma ORM
- Serverless-optimized deployment
- Playground UI (builder interface complete)

### ❌ Critical Gaps Identified

**Missing Core Features:**
- ❌ **NO student-facing features** despite "student" role existing in database
- ❌ **NO playground persistence** - schema exists but no API endpoints
- ❌ **NO enrollment system** - students can't enroll in courses
- ❌ **NO progress tracking** - no way to track learning progress
- ❌ **NO assessments** - no quizzes, assignments, or grading
- ❌ **NO discussion system** - no comments, questions, or collaboration
- ❌ **NO notifications** - users aren't alerted to updates
- ❌ **NO analytics** - faculty can't see engagement metrics
- ❌ **NO content versioning** - can't track changes or rollback
- ❌ **NO certificates** - no completion recognition

**Opportunity:** These gaps represent significant value-add opportunities that would make the platform production-ready for university deployment.

---

## 🎯 PHASE 1: High Priority Features (6-8 weeks)

### 1. Playground Persistence & API ⭐ HIGHEST PRIORITY

**Why This First:**
- Database schema already exists (`playgrounds`, `playground_templates` tables)
- UI builder is fully implemented and working
- **Cannot save playgrounds** - critical functionality gap
- Unlocks all playground features immediately

**Impact:** HIGH | **Complexity:** MEDIUM | **Effort:** 2 weeks

#### Implementation Details

**Database Models:**
```prisma
// Already exists in schema.prisma - just needs API implementation
model playgrounds {
  id                String   @id @default(cuid())
  title             String
  description       String   @db.Text
  category          String
  created_by        String
  organization_id   String?
  is_public         Boolean  @default(false)
  share_url         String   @unique @default(cuid())
  template_id       String?
  controls          Json     // ControlConfig[]
  visualization     Json     // VisualizationConfig
  code_config       Json     // CodeConfig
  published_at      DateTime?
  version           Int      @default(1)
  view_count        Int      @default(0)
  fork_count        Int      @default(0)
  rating            Float?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  author            users    @relation(...)
  template          playground_templates? @relation(...)
}

model playground_templates {
  id                     String   @id @default(cuid())
  name                   String
  description            String
  category               String
  thumbnail              String?
  default_controls       Json
  default_visualization  Json
  code_template          String   @db.Text
  python_libraries       String[]
  js_libraries           String[]
  author_id              String?
  version                String   @default("1.0.0")
  tags                   String[]
  is_public              Boolean  @default(true)
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt
}
```

**API Endpoints Needed:**

```typescript
// src/app/api/playgrounds/route.ts
POST   /api/playgrounds
// Create new playground
// Body: { title, description, category, controls, visualization, code_config }
// Returns: { id, share_url }

GET    /api/playgrounds
// List user's playgrounds
// Query: ?page=1&limit=20&category=neural_networks
// Returns: { playgrounds: [], pagination: {} }

// src/app/api/playgrounds/[id]/route.ts
GET    /api/playgrounds/[id]
// Get playground by ID
// Returns: Full playground object

PUT    /api/playgrounds/[id]
// Update playground
// Body: { title?, description?, controls?, visualization?, code_config? }

DELETE /api/playgrounds/[id]
// Delete playground (soft delete or hard delete)

// src/app/api/playgrounds/[id]/fork/route.ts
POST   /api/playgrounds/[id]/fork
// Fork a playground (create copy)
// Increments original's fork_count
// Returns: { id, share_url } of new playground

// src/app/api/playgrounds/share/[shareUrl]/route.ts
GET    /api/playgrounds/share/[shareUrl]
// Public access via share URL

// src/app/api/playground-templates/route.ts
GET    /api/playground-templates
// List all templates
// Query: ?category=neural_networks

POST   /api/playground-templates
// Create custom template (faculty only)
```

**Pages Integration:**
```
/playgrounds                    (Gallery - fetch from API)
/playgrounds/[id]               (Viewer - load from API)
/playgrounds/builder            (Save to API on submit)
/playgrounds/builder/[id]       (Load from API for editing)
/playgrounds/share/[shareUrl]   (Public sharing)
```

**Features:**
- ✅ Save playground configurations to database
- ✅ Load saved playgrounds in builder
- ✅ Fork functionality with attribution
- ✅ View count tracking (increment on load)
- ✅ Template marketplace
- ✅ Public sharing via unique URL
- ✅ Version control (increment version on update)
- ✅ Privacy controls (public/private)
- ✅ Rating system

**Testing Checklist:**
- [ ] Create playground and verify DB save
- [ ] Load playground in builder
- [ ] Fork playground and verify new copy
- [ ] Public share URL works
- [ ] View count increments
- [ ] Delete playground

---

### 2. Student Dashboard & Enrollment System ⭐⭐

**Why This Matters:**
- Core educational platform feature
- "Student" role exists but has no functionality
- Unlocks progress tracking, analytics, and engagement

**Impact:** VERY HIGH | **Complexity:** MEDIUM-HIGH | **Effort:** 3 weeks

#### Implementation Details

**New Database Models:**

```prisma
model course_enrollments {
  id            String   @id @default(cuid())
  student_id    String
  course_id     String
  enrolled_at   DateTime @default(now())
  status        String   @default("active") // active, completed, dropped, archived
  progress      Int      @default(0) // percentage 0-100
  last_accessed DateTime @default(now())

  student       users    @relation("StudentEnrollments", fields: [student_id], references: [id], onDelete: Cascade)
  course        courses  @relation(fields: [course_id], references: [id], onDelete: Cascade)

  @@unique([student_id, course_id])
  @@index([student_id])
  @@index([course_id])
  @@index([status])
}

model module_progress {
  id               String   @id @default(cuid())
  student_id       String
  module_id        String
  enrollment_id    String   // link to course enrollment

  status           String   @default("not_started") // not_started, in_progress, completed
  completion_date  DateTime?
  time_spent       Int      @default(0) // minutes
  last_accessed    DateTime @default(now())

  // Analytics
  visit_count      Int      @default(0)
  scroll_percentage Float   @default(0) // how far they scrolled

  student          users    @relation("StudentProgress", fields: [student_id], references: [id], onDelete: Cascade)
  module           modules  @relation(fields: [module_id], references: [id], onDelete: Cascade)
  enrollment       course_enrollments @relation(fields: [enrollment_id], references: [id], onDelete: Cascade)

  @@unique([student_id, module_id])
  @@index([student_id])
  @@index([module_id])
  @@index([enrollment_id])
}

model learning_sessions {
  id               String   @id @default(cuid())
  student_id       String
  module_id        String
  started_at       DateTime @default(now())
  ended_at         DateTime?
  duration         Int?     // seconds

  student          users    @relation(fields: [student_id], references: [id])
  module           modules  @relation(fields: [module_id], references: [id])

  @@index([student_id])
  @@index([module_id])
}
```

**API Endpoints:**

```typescript
// Enrollment Management
POST   /api/enrollments                    // Enroll in course
GET    /api/enrollments                    // List enrollments (with filters)
GET    /api/enrollments/[id]               // Get enrollment details
PUT    /api/enrollments/[id]               // Update status (drop, complete)
DELETE /api/enrollments/[id]               // Remove enrollment

// Progress Tracking
GET    /api/student/progress               // Get all progress
GET    /api/student/progress/[courseId]    // Course-specific progress
PUT    /api/student/progress/module/[id]   // Update module progress
POST   /api/student/sessions               // Log learning session

// Dashboard Stats
GET    /api/student/stats                  // Overall student stats
GET    /api/student/recommendations        // Course recommendations
```

**Pages:**

```
/student/dashboard              (Overview, enrolled courses, recent activity)
├── Stats cards: courses enrolled, modules completed, time spent, streak
├── Progress charts
├── Upcoming modules
└── Recommended courses

/student/courses                (Browse & enroll in courses)
├── All available courses
├── Filter by category/difficulty
├── Enroll button
└── Unenroll option

/student/courses/[slug]         (Course view with progress sidebar)
├── Course overview
├── Module list with completion status
├── Progress bar
├── Continue where you left off
└── Certificate progress

/student/progress               (Learning analytics)
├── Time spent per course
├── Completion rates
├── Learning patterns (time of day, frequency)
└── Achievements/milestones
```

**Features:**
- Self-enrollment in published courses
- Progress tracking per module
- Auto-calculate course completion percentage
- "Continue Learning" shortcuts
- Time tracking per module
- Learning streak tracking
- Course recommendations based on interests

**User Flow:**
1. Student browses courses → clicks "Enroll"
2. Enrollment created with status "active"
3. Student accesses module → module_progress created (status: "in_progress")
4. Student marks module complete → status updated to "completed"
5. When all modules complete → enrollment status = "completed"
6. Student can view progress dashboard

---

### 3. Discussion & Comments System ⭐⭐

**Why Essential:**
- Students need to ask questions
- Faculty need to engage with learners
- Builds community around courses
- Increases engagement and retention

**Impact:** HIGH | **Complexity:** MEDIUM | **Effort:** 2 weeks

#### Implementation Details

**Database Model:**

```prisma
model comments {
  id              String    @id @default(cuid())
  content         String    @db.Text
  author_id       String
  parent_id       String?   // for threaded replies

  // Polymorphic relation - can comment on course, module, or playground
  entity_type     String    // 'course', 'module', 'playground'
  entity_id       String

  // Moderation & Status
  is_edited       Boolean   @default(false)
  is_pinned       Boolean   @default(false) // faculty can pin important Q&A
  is_resolved     Boolean   @default(false) // mark questions as answered
  is_deleted      Boolean   @default(false) // soft delete

  // Engagement
  upvotes         Int       @default(0)

  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  author          users     @relation("CommentAuthor", fields: [author_id], references: [id], onDelete: Cascade)
  parent          comments? @relation("CommentReplies", fields: [parent_id], references: [id])
  replies         comments[] @relation("CommentReplies")
  upvoted_by      comment_upvotes[]

  @@index([entity_type, entity_id])
  @@index([author_id])
  @@index([parent_id])
  @@index([is_pinned, created_at])
}

model comment_upvotes {
  id          String   @id @default(cuid())
  comment_id  String
  user_id     String
  created_at  DateTime @default(now())

  comment     comments @relation(fields: [comment_id], references: [id], onDelete: Cascade)
  user        users    @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([comment_id, user_id])
  @@index([comment_id])
  @@index([user_id])
}
```

**API Endpoints:**

```typescript
// Comment CRUD
POST   /api/comments                    // Create comment
GET    /api/comments                    // List comments (with filters)
PUT    /api/comments/[id]               // Edit comment
DELETE /api/comments/[id]               // Delete comment (soft delete)

// Moderation (faculty only)
PUT    /api/comments/[id]/pin           // Pin/unpin comment
PUT    /api/comments/[id]/resolve       // Mark as resolved

// Engagement
POST   /api/comments/[id]/upvote        // Upvote comment
DELETE /api/comments/[id]/upvote        // Remove upvote

// Queries
GET    /api/comments?entity_type=module&entity_id=123&sort=top
// Sort options: newest, oldest, top (by upvotes)
```

**UI Components:**

```typescript
// components/comments/CommentSection.tsx
interface CommentSectionProps {
  entityType: 'course' | 'module' | 'playground'
  entityId: string
  allowComments?: boolean
}

// components/comments/Comment.tsx
// Shows avatar, name, timestamp, content
// Edit/delete for own comments
// Pin/resolve for faculty
// Upvote button
// Reply button

// components/comments/CommentForm.tsx
// Markdown editor
// Submit button
// Character limit
```

**Features:**
- Threaded discussions (up to 3 levels deep)
- Markdown support in comments
- @mentions for faculty (triggers notification)
- Faculty can pin important comments
- Faculty can mark questions as "resolved"
- Upvote system to surface best answers
- Real-time updates (optional using Pusher/Supabase)
- Email notifications on replies
- Edit history
- Soft delete (preserve context)

**Integration Points:**
- Module viewer page: comments at bottom
- Course overview page: recent discussions
- Playground viewer: discussion tab
- Student dashboard: recent activity feed

---

### 4. Notification System ⭐

**Why Needed:**
- Alerts for comments, replies, mentions
- Course updates and announcements
- Quiz submissions, grades
- Supports all other features

**Impact:** MEDIUM-HIGH | **Complexity:** MEDIUM | **Effort:** 1.5 weeks

#### Implementation Details

**Database Model:**

```prisma
model notifications {
  id           String    @id @default(cuid())
  user_id      String
  type         String    // 'comment', 'reply', 'mention', 'enrollment', 'course_update', 'quiz_graded', 'assignment_graded'
  title        String
  message      String    @db.Text
  link         String?   // Where to navigate when clicked
  icon         String?   // Icon identifier

  // Related entity (optional, for grouping)
  entity_type  String?   // 'course', 'module', 'comment', etc.
  entity_id    String?

  read         Boolean   @default(false)
  read_at      DateTime?

  created_at   DateTime  @default(now())

  user         users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, read])
  @@index([user_id, created_at])
  @@index([type])
}

model notification_preferences {
  id                        String   @id @default(cuid())
  user_id                   String   @unique

  // Email preferences
  email_on_comment          Boolean  @default(true)
  email_on_reply            Boolean  @default(true)
  email_on_mention          Boolean  @default(true)
  email_on_course_update    Boolean  @default(true)
  email_on_quiz_graded      Boolean  @default(true)
  email_digest              String   @default("daily") // none, daily, weekly

  // In-app preferences
  inapp_on_comment          Boolean  @default(true)
  inapp_on_reply            Boolean  @default(true)
  inapp_on_mention          Boolean  @default(true)

  user                      users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

**API Endpoints:**

```typescript
// Notification Management
GET    /api/notifications                  // Get user's notifications
GET    /api/notifications/unread-count     // Badge count
PUT    /api/notifications/[id]/read        // Mark as read
PUT    /api/notifications/mark-all-read    // Mark all as read
DELETE /api/notifications/[id]             // Delete notification

// Preferences
GET    /api/notifications/preferences      // Get preferences
PUT    /api/notifications/preferences      // Update preferences
```

**UI Components:**

```typescript
// components/notifications/NotificationCenter.tsx
// Dropdown in header with notifications list
// Badge with unread count
// "Mark all as read" button

// components/notifications/NotificationItem.tsx
// Icon, title, message, timestamp
// Click navigates to link
// Mark as read on click

// components/notifications/NotificationPreferences.tsx
// Settings page for email/in-app preferences
```

**Notification Types:**

```typescript
type NotificationType =
  | 'comment'              // Someone commented on your content
  | 'reply'                // Reply to your comment
  | 'mention'              // @mentioned in a comment
  | 'enrollment'           // Student enrolled in your course
  | 'course_update'        // Course you're enrolled in was updated
  | 'module_published'     // New module added to enrolled course
  | 'quiz_graded'          // Your quiz was graded
  | 'assignment_graded'    // Your assignment was graded
  | 'achievement'          // Unlocked an achievement
  | 'certificate_issued'   // Certificate ready for download
```

**Helper Functions:**

```typescript
// lib/notifications.ts

export async function createNotification({
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  entityType?: string,
  entityId?: string
}) {
  // Create in-app notification
  await prisma.notifications.create({...})

  // Check preferences and send email if enabled
  const prefs = await getUserPreferences(userId)
  if (shouldSendEmail(type, prefs)) {
    await sendEmailNotification(...)
  }
}

export async function notifyCommentAuthors(commentId: string) {
  // Notify original post author + parent comment author
}

export async function notifyMentionedUsers(content: string, entityType: string, entityId: string) {
  // Parse @mentions and create notifications
}
```

**Features:**
- Bell icon in header with badge
- Dropdown notification center
- Real-time updates (via polling or WebSocket)
- Email notifications (via Resend)
- Notification preferences page
- Daily/weekly email digests
- Smart grouping (e.g., "3 new comments on your course")
- Mark as read/unread
- Click notification → navigate to content

---

### 5. Quiz & Assessment System ⭐⭐⭐

**Why Critical:**
- Essential for educational platforms
- Measure learning outcomes
- Provide instant feedback
- Enable certifications

**Impact:** VERY HIGH | **Complexity:** HIGH | **Effort:** 3 weeks

#### Implementation Details

**Database Models:**

```prisma
model quizzes {
  id              String   @id @default(cuid())
  module_id       String
  title           String
  description     String?  @db.Text
  instructions    String?  @db.Text

  // Settings
  time_limit      Int?     // minutes (null = no limit)
  passing_score   Int      @default(70) // percentage
  attempts_allowed Int     @default(1) // -1 = unlimited
  randomize_questions Boolean @default(false)
  randomize_options   Boolean @default(false)
  show_answers_after  Boolean @default(true)
  show_correct_answer Boolean @default(true)

  // Scheduling
  available_from  DateTime?
  available_until DateTime?

  created_by      String
  status          String   @default("draft") // draft, published, archived

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  module          modules  @relation(fields: [module_id], references: [id], onDelete: Cascade)
  author          users    @relation(fields: [created_by], references: [id])
  questions       quiz_questions[]
  attempts        quiz_attempts[]

  @@index([module_id])
  @@index([status])
}

model quiz_questions {
  id              String   @id @default(cuid())
  quiz_id         String
  question_text   String   @db.Text
  question_type   String   // multiple_choice, true_false, short_answer, code, fill_in_blank

  // For multiple choice/true_false
  options         Json?    // [{text: string, isCorrect: boolean}]

  // For short answer/code
  correct_answer  String?  @db.Text
  case_sensitive  Boolean  @default(false)

  // For code questions
  starter_code    String?  @db.Text
  test_cases      Json?    // [{input: string, expected: string}]

  explanation     String?  @db.Text // shown after submission
  points          Int      @default(1)
  order           Int

  created_at      DateTime @default(now())

  quiz            quizzes  @relation(fields: [quiz_id], references: [id], onDelete: Cascade)

  @@index([quiz_id])
  @@index([order])
}

model quiz_attempts {
  id              String   @id @default(cuid())
  quiz_id         String
  student_id      String

  // Answers & Scoring
  answers         Json     // [{questionId: string, answer: string|string[]}]
  score           Float    // 0-100
  points_earned   Int
  points_possible Int
  passed          Boolean

  // Timing
  started_at      DateTime @default(now())
  submitted_at    DateTime?
  time_spent      Int?     // seconds

  // State
  attempt_number  Int      // 1, 2, 3...
  status          String   @default("in_progress") // in_progress, submitted, graded

  // Feedback
  feedback        String?  @db.Text
  graded_by       String?
  graded_at       DateTime?

  quiz            quizzes  @relation(fields: [quiz_id], references: [id], onDelete: Cascade)
  student         users    @relation("QuizAttempts", fields: [student_id], references: [id], onDelete: Cascade)
  grader          users?   @relation("QuizGrader", fields: [graded_by], references: [id])

  @@index([quiz_id, student_id])
  @@index([student_id])
  @@index([status])
}
```

**API Endpoints:**

```typescript
// Quiz Management (Faculty)
POST   /api/quizzes                      // Create quiz
GET    /api/quizzes                      // List quizzes
GET    /api/quizzes/[id]                 // Get quiz details
PUT    /api/quizzes/[id]                 // Update quiz
DELETE /api/quizzes/[id]                 // Delete quiz
PUT    /api/quizzes/[id]/publish         // Publish quiz

// Questions (Faculty)
POST   /api/quizzes/[id]/questions       // Add question
PUT    /api/quizzes/[id]/questions/[qId] // Edit question
DELETE /api/quizzes/[id]/questions/[qId] // Delete question
PUT    /api/quizzes/[id]/questions/order // Reorder questions

// Student - Taking Quiz
GET    /api/quizzes/[id]/start           // Start new attempt
GET    /api/quizzes/[id]/attempts/[attemptId] // Resume attempt
POST   /api/quizzes/[id]/submit          // Submit answers
GET    /api/quizzes/[id]/results/[attemptId]  // View results

// Analytics (Faculty)
GET    /api/quizzes/[id]/analytics       // Quiz analytics
GET    /api/quizzes/[id]/attempts        // All attempts
```

**Pages:**

```
Faculty:
/faculty/modules/[id]/quizzes           (List quizzes for module)
/faculty/quizzes/create                 (Quiz builder)
/faculty/quizzes/[id]/edit              (Edit quiz)
/faculty/quizzes/[id]/questions         (Manage questions)
/faculty/quizzes/[id]/analytics         (View results, stats)
/faculty/quizzes/[id]/attempts          (Grade short answer questions)

Student:
/student/courses/[slug]/quizzes/[id]    (Take quiz)
/student/courses/[slug]/quizzes/[id]/results/[attemptId] (View results)
/student/quizzes/history                (All quiz attempts)
```

**Quiz Builder UI:**

```typescript
// components/faculty/quiz/QuizBuilder.tsx
// - Quiz settings form (title, time limit, passing score, etc.)
// - Add questions interface
// - Drag-to-reorder questions
// - Preview mode
// - Publish/save draft buttons

// components/faculty/quiz/QuestionEditor.tsx
// Question type selector
// - Multiple Choice: Add options, mark correct
// - True/False: Select correct answer
// - Short Answer: Input correct answer, case sensitivity
// - Code: Starter code, test cases
// - Points assignment
// - Explanation field
```

**Quiz Taking UI:**

```typescript
// components/student/quiz/QuizTaker.tsx
// - Timer display (if time limit)
// - Progress indicator (Question 3 of 10)
// - Question display
// - Answer input (radio, checkbox, text area, code editor)
// - Navigation (previous/next)
// - Review answers before submit
// - Submit confirmation

// components/student/quiz/QuizResults.tsx
// - Score display
// - Pass/fail indicator
// - Question-by-question review
// - Correct answers shown (if enabled)
// - Explanations
// - Retry button (if attempts remaining)
```

**Auto-Grading Logic:**

```typescript
// lib/quiz-grading.ts

export function gradeQuizAttempt(quiz: Quiz, attempt: QuizAttempt): {
  score: number,
  pointsEarned: number,
  pointsPossible: number,
  passed: boolean,
  needsManualGrading: boolean
} {
  let pointsEarned = 0
  let pointsPossible = 0
  let needsManualGrading = false

  for (const question of quiz.questions) {
    pointsPossible += question.points

    const userAnswer = attempt.answers[question.id]

    switch (question.question_type) {
      case 'multiple_choice':
      case 'true_false':
        if (isCorrectChoice(question, userAnswer)) {
          pointsEarned += question.points
        }
        break

      case 'short_answer':
        if (isCorrectAnswer(question, userAnswer)) {
          pointsEarned += question.points
        } else {
          needsManualGrading = true // Faculty can review
        }
        break

      case 'code':
        const testResults = runTestCases(question, userAnswer)
        const passedTests = testResults.filter(r => r.passed).length
        pointsEarned += (passedTests / testResults.length) * question.points
        break
    }
  }

  const score = (pointsEarned / pointsPossible) * 100
  const passed = score >= quiz.passing_score

  return { score, pointsEarned, pointsPossible, passed, needsManualGrading }
}
```

**Features:**
- Multiple question types (MCQ, T/F, short answer, code)
- Auto-grading for objective questions
- Manual grading interface for subjective questions
- Time limits with countdown timer
- Multiple attempts with best score tracking
- Randomization of questions and options
- Scheduled availability (available_from/until)
- Instant feedback or delayed results
- Question explanations
- Quiz analytics (average score, completion rate, difficult questions)
- Export results to CSV
- Question bank for reuse
- Quiz templates

---

### 6. Enhanced Analytics Dashboard ⭐

**Why Valuable:**
- Faculty need insights on student engagement
- Identify struggling students early
- Measure course effectiveness
- Data-driven content improvements

**Impact:** HIGH | **Complexity:** MEDIUM | **Effort:** 1.5 weeks

#### Implementation Details

**No New Database Models** - uses existing enrollment, progress, quiz, comment data

**API Endpoints:**

```typescript
// Faculty Analytics
GET /api/analytics/courses/[id]/overview
// Returns: enrollments, completion rate, avg time spent, active students

GET /api/analytics/courses/[id]/engagement
// Returns: daily/weekly active users, module completion trends

GET /api/analytics/modules/[id]/stats
// Returns: views, completions, avg time, drop-off rate

GET /api/analytics/quizzes/[id]/performance
// Returns: avg score, pass rate, question difficulty analysis

GET /api/analytics/dashboard
// Faculty dashboard overview stats

// Student Analytics
GET /api/analytics/student/learning-patterns
// Returns: time of day preferences, session duration, streaks

GET /api/analytics/student/performance
// Returns: quiz scores over time, course completion predictions
```

**Pages:**

```
/faculty/analytics                      (Overall dashboard)
/faculty/analytics/courses/[id]         (Course-specific analytics)
/faculty/analytics/modules/[id]         (Module analytics)
/faculty/analytics/students             (Student roster with engagement metrics)

/student/analytics                      (Personal learning analytics)
```

**Visualizations (using Recharts):**

```typescript
// components/analytics/EnrollmentChart.tsx
// Line chart: enrollments over time

// components/analytics/CompletionFunnel.tsx
// Funnel chart: enrollment → module completion → course completion

// components/analytics/EngagementHeatmap.tsx
// Heatmap: student activity by day/hour

// components/analytics/QuizPerformanceChart.tsx
// Bar chart: quiz scores distribution

// components/analytics/ModulePopularity.tsx
// Bar chart: most/least viewed modules

// components/analytics/LearningTimeChart.tsx
// Line chart: time spent over weeks
```

**Metrics to Track:**

**Course Level:**
- Total enrollments
- Active students (accessed in last 7 days)
- Completion rate
- Average time to complete
- Drop-off rate
- Student satisfaction (if reviews added)

**Module Level:**
- View count
- Completion count
- Average time spent
- Bounce rate (students who leave quickly)
- Comments count
- Most common drop-off point

**Quiz Level:**
- Attempts count
- Average score
- Pass rate
- Question difficulty (% correct per question)
- Time to complete
- Most missed questions

**Student Level (for faculty view):**
- Courses enrolled
- Modules completed
- Quiz scores
- Time spent learning
- Last active date
- At-risk indicator (falling behind)

**Features:**
- Real-time dashboard updates
- Date range filters
- Export reports to CSV/PDF
- Comparison views (course A vs course B)
- Cohort analysis (Fall 2024 vs Spring 2025)
- Engagement alerts (e.g., "5 students haven't logged in for 2 weeks")
- Predictive analytics (likelihood of completion)
- A/B testing results (if content variants exist)

---

## 🔥 PHASE 2: Medium Priority Features (4-6 weeks)

### 7. Assignment Submission System

**Why Important:**
- Assessments beyond multiple choice
- File uploads for projects
- Faculty feedback and grading
- Portfolio building

**Impact:** HIGH | **Complexity:** HIGH | **Effort:** 2.5 weeks

#### Database Models

```prisma
model assignments {
  id              String   @id @default(cuid())
  module_id       String
  title           String
  description     String   @db.Text
  instructions    String?  @db.Text

  // Settings
  due_date        DateTime
  late_submission_allowed Boolean @default(false)
  late_penalty    Int?     // percentage deducted per day
  max_points      Int      @default(100)
  file_required   Boolean  @default(false)
  allowed_file_types String[] @default(["pdf", "docx", "zip"])
  max_file_size   BigInt   @default(10485760) // 10MB

  // Grading
  rubric          Json?    // [{criterion: string, points: number, description: string}]
  auto_grade      Boolean  @default(false)

  created_by      String
  status          String   @default("draft") // draft, published, closed

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  module          modules  @relation(fields: [module_id], references: [id])
  author          users    @relation(fields: [created_by], references: [id])
  submissions     assignment_submissions[]

  @@index([module_id])
  @@index([due_date])
}

model assignment_submissions {
  id              String   @id @default(cuid())
  assignment_id   String
  student_id      String

  // Submission
  content         String?  @db.Text // text submission
  file_url        String?  // uploaded file path
  file_name       String?
  file_size       BigInt?

  submitted_at    DateTime @default(now())
  is_late         Boolean  @default(false)
  attempt_number  Int      @default(1)

  // Grading
  grade           Float?   // points earned
  percentage      Float?   // calculated percentage
  passed          Boolean?
  feedback        String?  @db.Text
  rubric_scores   Json?    // [{criterion: string, score: number}]

  graded_at       DateTime?
  graded_by       String?
  status          String   @default("submitted") // submitted, graded, returned, resubmit_requested

  assignment      assignments @relation(fields: [assignment_id], references: [id])
  student         users       @relation("AssignmentStudent", fields: [student_id], references: [id])
  grader          users?      @relation("AssignmentGrader", fields: [graded_by], references: [id])

  @@index([assignment_id, student_id])
  @@index([student_id])
  @@index([status])
}
```

**Features:**
- File upload (PDF, DOCX, ZIP, code files)
- Text submission via rich text editor
- Late submission tracking with penalties
- Resubmission capability
- Rubric-based grading
- Batch download submissions
- Plagiarism detection integration (Turnitin API)
- Peer review option
- Draft saving
- Submission confirmation email

---

### 8. Content Versioning System

**Why Needed:**
- Track all changes to modules/courses
- Rollback to previous versions
- Compare versions side-by-side
- Compliance and auditing

**Impact:** MEDIUM-HIGH | **Complexity:** HIGH | **Effort:** 2 weeks

#### Database Models

```prisma
model content_versions {
  id              String   @id @default(cuid())
  entity_type     String   // 'course', 'module'
  entity_id       String
  version_number  Int

  // Snapshot of content
  content_snapshot Json   // Full object snapshot

  // Change metadata
  changed_by      String
  change_summary  String?  // Brief description of changes
  change_type     String   // 'created', 'updated', 'published', 'unpublished'

  // Diff from previous version
  changes_diff    Json?    // Computed diff

  created_at      DateTime @default(now())

  author          users    @relation(fields: [changed_by], references: [id])

  @@unique([entity_type, entity_id, version_number])
  @@index([entity_type, entity_id])
  @@index([changed_by])
}
```

**Features:**
- Auto-save version on every update
- Version history viewer
- Visual diff comparison
- Restore to previous version
- Version branching (experimental content)
- Version notes/comments
- Scheduled publish (save draft, publish later)

---

### 9. Advanced Search with Filters

**Why Enhance:**
- Current search is basic (title/description only)
- Students need better discovery
- Improve content accessibility

**Impact:** MEDIUM | **Complexity:** MEDIUM | **Effort:** 1 week

**Features:**
- Filter by category, tags, difficulty, author
- Sort by relevance, date, popularity, rating
- Search within specific course
- Autocomplete suggestions
- Search history
- Saved searches
- Advanced operators (AND, OR, NOT)
- Fuzzy matching
- Search analytics (trending searches)
- Elasticsearch integration (optional)

---

### 10. Collaborative Editing

**Why Valuable:**
- Multiple faculty can co-author courses
- TA assistance with content creation
- Peer review workflow
- Department-wide content

**Impact:** MEDIUM-HIGH | **Complexity:** VERY HIGH | **Effort:** 3 weeks

#### Database Models

```prisma
model course_collaborators {
  id              String   @id @default(cuid())
  course_id       String
  user_id         String
  role            String   // 'owner', 'editor', 'reviewer', 'viewer'
  invited_by      String
  invited_at      DateTime @default(now())
  accepted_at     DateTime?

  course          courses  @relation(fields: [course_id], references: [id])
  user            users    @relation("Collaborator", fields: [user_id], references: [id])
  inviter         users    @relation("Inviter", fields: [invited_by], references: [id])

  @@unique([course_id, user_id])
  @@index([user_id])
}

model module_collaborators {
  id              String   @id @default(cuid())
  module_id       String
  user_id         String
  role            String
  invited_by      String
  invited_at      DateTime @default(now())

  module          modules  @relation(fields: [module_id], references: [id])
  user            users    @relation("ModuleCollaborator", fields: [user_id], references: [id])

  @@unique([module_id, user_id])
}
```

**Features:**
- Invite collaborators by email
- Role-based permissions (owner, editor, reviewer, viewer)
- Real-time collaborative editing (using Yjs or Liveblocks)
- Presence indicators (who's viewing/editing)
- Change attribution (who edited what)
- Comment and suggestion mode
- Accept/reject changes
- Conflict resolution
- Collaboration activity log

---

### 11. Video Integration

**Why Essential:**
- Multimedia learning is critical
- Supplement text with video lectures
- Screen recordings, demos

**Impact:** HIGH | **Complexity:** MEDIUM | **Effort:** 1.5 weeks

**Integration Options:**

**Option 1: External Embeds (Simple)**
- YouTube/Vimeo embeds
- URL input in rich text editor
- Responsive video player
- No hosting costs

**Option 2: Self-Hosted (Advanced)**
- Mux integration for video hosting
- Adaptive bitrate streaming
- Video analytics (watch time, completion)
- Thumbnail generation
- Captions/subtitles support

**Database Extension:**

```prisma
model videos {
  id              String   @id @default(cuid())
  title           String
  description     String?  @db.Text

  // Storage
  video_url       String   // Mux playback URL or YouTube URL
  thumbnail_url   String?
  duration        Int?     // seconds

  // Metadata
  uploaded_by     String
  module_id       String?

  // Analytics
  view_count      Int      @default(0)

  created_at      DateTime @default(now())

  uploader        users    @relation(fields: [uploaded_by], references: [id])
  module          modules? @relation(fields: [module_id], references: [id])
}

model video_progress {
  id              String   @id @default(cuid())
  video_id        String
  student_id      String
  watch_time      Int      @default(0) // seconds watched
  completed       Boolean  @default(false)
  last_position   Int      @default(0) // resume playback

  video           videos   @relation(fields: [video_id], references: [id])
  student         users    @relation(fields: [student_id], references: [id])

  @@unique([video_id, student_id])
}
```

**Features:**
- Video upload (if self-hosted)
- Embed YouTube/Vimeo
- Custom video player with controls
- Playback speed (0.5x, 1x, 1.5x, 2x)
- Captions/subtitles
- Video chapters/timestamps
- Watch time tracking
- Resume playback
- Download option
- Video transcripts (auto-generated)

---

### 12. Certificate Generation

**Why Important:**
- Recognize course completion
- Motivate students
- Provide verifiable credentials
- Professional development

**Impact:** MEDIUM | **Complexity:** MEDIUM | **Effort:** 1 week

#### Database Model

```prisma
model certificates {
  id              String   @id @default(cuid())
  student_id      String
  course_id       String

  // Certificate details
  certificate_url String   // PDF URL
  verification_id String   @unique // Public verification code

  // Criteria met
  completion_date DateTime
  final_grade     Float?
  total_time_spent Int?   // hours

  issued_date     DateTime @default(now())
  expires_at      DateTime? // Optional expiration

  // Metadata
  template_used   String   @default("default")
  signed_by       String?  // Faculty member who signed

  student         users    @relation("CertificateRecipient", fields: [student_id], references: [id])
  course          courses  @relation(fields: [course_id], references: [id])
  signer          users?   @relation("CertificateSigner", fields: [signed_by], references: [id])

  @@index([student_id])
  @@index([verification_id])
}
```

**Features:**
- Auto-generate on course completion
- PDF generation with University of Illinois branding
- Digital signature
- QR code for verification
- Public verification page (`/verify/[verificationId]`)
- Share on LinkedIn
- Email delivery
- Certificate gallery in student profile
- Multiple templates (basic, honors, completion, mastery)
- Blockchain verification (optional)

**Implementation:**
```typescript
// lib/certificate-generator.ts
import { PDFDocument } from '@react-pdf/renderer'

export async function generateCertificate({
  studentName,
  courseName,
  completionDate,
  grade,
  verificationId
}): Promise<Buffer> {
  // Generate PDF using template
  // Add student name, course, date
  // Add QR code linking to verification page
  // Upload to storage (Vercel Blob or S3)
  // Return URL
}
```

---

## 🌟 PHASE 3: Advanced Features (6-8 weeks)

### 13. Learning Paths System

**Why Valuable:**
- Structured learning journeys
- Prerequisites and dependencies
- Career-oriented tracks
- Gamification element

**Impact:** MEDIUM-HIGH | **Complexity:** HIGH | **Effort:** 2 weeks

#### Database Models

```prisma
model learning_paths {
  id              String   @id @default(cuid())
  title           String
  description     String   @db.Text
  slug            String   @unique
  thumbnail       String?

  // Metadata
  difficulty      String   // beginner, intermediate, advanced
  estimated_time  Int      // hours
  category        String

  created_by      String
  is_public       Boolean  @default(true)
  featured        Boolean  @default(false)

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  author          users    @relation(fields: [created_by], references: [id])
  path_courses    learning_path_courses[]
  enrollments     learning_path_enrollments[]

  @@index([slug])
  @@index([category])
}

model learning_path_courses {
  id              String   @id @default(cuid())
  path_id         String
  course_id       String
  order           Int
  is_required     Boolean  @default(true)
  prerequisite_id String?  // Must complete this course first

  path            learning_paths @relation(fields: [path_id], references: [id])
  course          courses        @relation(fields: [course_id], references: [id])
  prerequisite    learning_path_courses? @relation("CoursePrerequisites", fields: [prerequisite_id], references: [id])
  dependents      learning_path_courses[] @relation("CoursePrerequisites")

  @@unique([path_id, course_id])
  @@index([path_id, order])
}

model learning_path_enrollments {
  id              String   @id @default(cuid())
  student_id      String
  path_id         String
  enrolled_at     DateTime @default(now())
  completed_at    DateTime?
  progress        Int      @default(0) // percentage

  student         users          @relation(fields: [student_id], references: [id])
  path            learning_paths @relation(fields: [path_id], references: [id])

  @@unique([student_id, path_id])
}
```

**Features:**
- Create learning paths with multiple courses
- Define prerequisites (Course A must be completed before Course B)
- Visual path roadmap
- Progress tracking across entire path
- Recommended paths based on interests
- Path completion certificate
- Share paths with others
- Fork and customize paths

---

### 14. AI-Powered Content Recommendations

**Why Innovative:**
- Personalized learning experience
- Increase engagement
- Help students discover content
- Predictive analytics

**Impact:** MEDIUM | **Complexity:** VERY HIGH | **Effort:** 3 weeks

**Features:**
- "Students who studied this also studied..." (collaborative filtering)
- Personalized course recommendations based on:
  - Enrolled courses
  - Completed modules
  - Interested fields
  - Performance data
  - Time spent on topics
- Difficulty level recommendations (if struggling, suggest easier content)
- Next best module suggestion
- Similar modules/courses finder
- Trending content

**Implementation Options:**
- Simple: TF-IDF similarity on tags/descriptions
- Medium: Collaborative filtering (user-item matrix)
- Advanced: OpenAI embeddings for semantic similarity
- Enterprise: Custom ML model trained on usage data

---

### 15. AI-Powered Q&A with RAG (Retrieval Augmented Generation)

**Why Transformative:**
- Students get instant, accurate answers from course content
- 24/7 intelligent tutoring assistant
- Reduces faculty support burden
- Context-aware responses using actual course materials
- Semantic search across all modules and courses

**Impact:** VERY HIGH | **Complexity:** VERY HIGH | **Effort:** 4 weeks

#### Implementation Details

**Architecture Overview:**

```
User Question → Vector Search → Retrieve Relevant Content → LLM Context → Generate Answer
                    ↓
              Vector Database
            (Course/Module Content)
```

**Database Models:**

```prisma
model content_embeddings {
  id              String   @id @default(cuid())
  entity_type     String   // 'course', 'module', 'course_description'
  entity_id       String

  // Content
  content_chunk   String   @db.Text // Original text chunk
  chunk_index     Int      // Order within document

  // Vector embedding (1536 dimensions for OpenAI ada-002)
  embedding       Float[]  // Stored as array or separate table

  // Metadata for context
  title           String?
  author_id       String?
  course_id       String?
  module_id       String?
  tags            String[]

  // Timestamps
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  author          users?   @relation(fields: [author_id], references: [id])
  course          courses? @relation(fields: [course_id], references: [id])
  module          modules? @relation(fields: [module_id], references: [id])

  @@index([entity_type, entity_id])
  @@index([course_id])
  @@index([module_id])
}

model qa_conversations {
  id              String   @id @default(cuid())
  student_id      String
  course_id       String?  // Optional: scoped to specific course

  // Conversation metadata
  title           String?  // Auto-generated from first question
  started_at      DateTime @default(now())
  last_message_at DateTime @default(now())

  // Analytics
  message_count   Int      @default(0)
  helpful_count   Int      @default(0)

  student         users    @relation(fields: [student_id], references: [id])
  course          courses? @relation(fields: [course_id], references: [id])
  messages        qa_messages[]

  @@index([student_id])
  @@index([course_id])
}

model qa_messages {
  id              String   @id @default(cuid())
  conversation_id String
  role            String   // 'user', 'assistant'
  content         String   @db.Text

  // RAG metadata (for assistant messages)
  sources         Json?    // [{moduleId, chunkIndex, similarity}]
  model_used      String?  // 'gpt-4', 'gpt-3.5-turbo', etc.
  tokens_used     Int?

  // Feedback
  helpful         Boolean?
  feedback_text   String?  @db.Text

  created_at      DateTime @default(now())

  conversation    qa_conversations @relation(fields: [conversation_id], references: [id], onDelete: Cascade)

  @@index([conversation_id])
}

model qa_analytics {
  id              String   @id @default(cuid())
  date            DateTime @db.Date

  // Usage stats
  total_questions Int      @default(0)
  total_conversations Int  @default(0)
  unique_users    Int      @default(0)

  // Performance
  avg_response_time_ms Int
  helpful_percentage Float

  // Popular topics (extracted from questions)
  top_topics      Json     // [{topic: string, count: number}]

  created_at      DateTime @default(now())

  @@unique([date])
  @@index([date])
}
```

**Vector Database Options:**

**Option 1: Pinecone (Recommended for Production)**
- Managed vector database
- Fast similarity search
- Scales automatically
- Cost: ~$70-200/month for 100K vectors

**Option 2: pgvector (PostgreSQL Extension)**
- Self-hosted in existing Supabase/Postgres
- No additional cost
- Good for moderate scale (up to 1M vectors)
- Requires Postgres 12+

**Option 3: Weaviate or Qdrant**
- Open-source alternatives
- Self-hosted or cloud
- More control, higher setup complexity

**Implementation with pgvector:**

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Update content_embeddings table
CREATE TABLE content_embeddings (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  content_chunk TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536), -- 1536 dimensions for OpenAI ada-002
  title TEXT,
  author_id TEXT,
  course_id TEXT,
  module_id TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON content_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Similarity search query
SELECT
  id,
  entity_type,
  entity_id,
  content_chunk,
  title,
  1 - (embedding <=> query_embedding) AS similarity
FROM content_embeddings
WHERE course_id = $1 -- Optional: scope to course
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

**API Endpoints:**

```typescript
// Q&A Endpoints
POST   /api/qa/ask                       // Ask a question
GET    /api/qa/conversations             // List conversations
GET    /api/qa/conversations/[id]        // Get conversation history
DELETE /api/qa/conversations/[id]        // Delete conversation
POST   /api/qa/messages/[id]/feedback    // Rate answer (helpful/not)

// Admin/Faculty Endpoints
POST   /api/qa/embed-content             // Generate embeddings for module
POST   /api/qa/embed-course/[id]         // Embed entire course
GET    /api/qa/analytics                 // Usage analytics
GET    /api/qa/unanswered                // Questions with low confidence

// Webhook for automatic embedding
POST   /api/webhooks/content-updated     // Triggered on module publish/update
```

**Content Ingestion Pipeline:**

```typescript
// lib/rag/ingestion.ts

import { OpenAI } from 'openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

export async function ingestModuleContent(moduleId: string) {
  // 1. Fetch module content
  const module = await prisma.modules.findUnique({
    where: { id: moduleId },
    include: { author: true, course_modules: { include: { course: true } } }
  })

  // 2. Extract text from rich content (strip HTML tags)
  const textContent = stripHtml(module.content)

  // 3. Split into chunks (overlap for context)
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,        // ~750 tokens
    chunkOverlap: 200,      // Preserve context
    separators: ['\n\n', '\n', '. ', ' ']
  })

  const chunks = await splitter.splitText(textContent)

  // 4. Generate embeddings for each chunk
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: chunks[i]
    })

    // 5. Store in vector database
    await prisma.content_embeddings.create({
      data: {
        entity_type: 'module',
        entity_id: moduleId,
        content_chunk: chunks[i],
        chunk_index: i,
        embedding: embedding.data[0].embedding,
        title: module.title,
        author_id: module.author_id,
        module_id: moduleId,
        course_id: module.course_modules[0]?.course_id,
        tags: module.tags || []
      }
    })
  }

  console.log(`Embedded ${chunks.length} chunks for module ${moduleId}`)
}

export async function ingestCourseContent(courseId: string) {
  const course = await prisma.courses.findUnique({
    where: { id: courseId },
    include: { course_modules: { include: { module: true } } }
  })

  // Embed course description
  await ingestContent('course', courseId, course.title, course.description)

  // Embed all modules in course
  for (const cm of course.course_modules) {
    await ingestModuleContent(cm.module.id)
  }
}
```

**RAG Query Pipeline:**

```typescript
// lib/rag/query.ts

import { OpenAI } from 'openai'

export async function answerQuestion({
  question: string,
  conversationId?: string,
  courseId?: string,
  studentId: string
}): Promise<{
  answer: string,
  sources: Array<{ moduleId: string, title: string, similarity: number }>,
  conversationId: string
}> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // 1. Generate embedding for question
  const questionEmbedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: question
  })

  // 2. Vector similarity search (retrieve top 5 relevant chunks)
  const relevantChunks = await prisma.$queryRaw`
    SELECT
      id,
      content_chunk,
      title,
      module_id,
      course_id,
      1 - (embedding <=> ${questionEmbedding.data[0].embedding}::vector) AS similarity
    FROM content_embeddings
    ${courseId ? `WHERE course_id = ${courseId}` : ''}
    ORDER BY embedding <=> ${questionEmbedding.data[0].embedding}::vector
    LIMIT 5
  `

  // Filter by similarity threshold (0.7+)
  const relevantContext = relevantChunks
    .filter(chunk => chunk.similarity > 0.7)
    .map(chunk => chunk.content_chunk)
    .join('\n\n---\n\n')

  // 3. Load conversation history (if exists)
  let conversationHistory = []
  if (conversationId) {
    const messages = await prisma.qa_messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
      take: 10 // Last 10 messages
    })
    conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  }

  // 4. Construct prompt with context
  const systemPrompt = `You are an intelligent tutoring assistant for a Brain and Cognitive Science course platform.

Your role is to:
- Answer student questions using ONLY the provided course content
- Provide clear, accurate explanations
- Reference specific concepts from the modules
- If the answer isn't in the provided context, say "I don't have information about that in the course materials"
- Be encouraging and supportive

Context from course materials:
${relevantContext}
`

  // 5. Call LLM
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview', // or gpt-3.5-turbo for cost savings
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: question }
    ],
    temperature: 0.7,
    max_tokens: 800
  })

  const answer = completion.choices[0].message.content

  // 6. Save to database
  const newConversationId = conversationId || cuid()

  if (!conversationId) {
    await prisma.qa_conversations.create({
      data: {
        id: newConversationId,
        student_id: studentId,
        course_id: courseId,
        title: question.slice(0, 100),
        message_count: 2
      }
    })
  }

  // Save user message
  await prisma.qa_messages.create({
    data: {
      conversation_id: newConversationId,
      role: 'user',
      content: question
    }
  })

  // Save assistant message
  await prisma.qa_messages.create({
    data: {
      conversation_id: newConversationId,
      role: 'assistant',
      content: answer,
      sources: relevantChunks.map(chunk => ({
        moduleId: chunk.module_id,
        title: chunk.title,
        similarity: chunk.similarity
      })),
      model_used: 'gpt-4-turbo-preview',
      tokens_used: completion.usage.total_tokens
    }
  })

  return {
    answer,
    sources: relevantChunks.map(chunk => ({
      moduleId: chunk.module_id,
      title: chunk.title,
      similarity: chunk.similarity
    })),
    conversationId: newConversationId
  }
}
```

**UI Components:**

```typescript
// components/student/qa/QAChat.tsx
interface QAChatProps {
  courseId?: string  // Optional: scope to specific course
}

// Features:
// - Chat interface (like ChatGPT)
// - Message history
// - Source citations (links to modules)
// - "Ask a follow-up question"
// - Thumbs up/down feedback
// - Copy answer button
// - Share conversation
// - Dark mode support

// components/student/qa/QAButton.tsx
// Floating button in bottom-right of module viewer
// Click opens chat modal
// Badge shows unread responses (if async)

// components/faculty/qa/QAAnalyticsDashboard.tsx
// - Most asked questions
// - Topics students struggle with
// - Questions marked "not helpful" (needs content improvement)
// - Usage over time
// - Cost tracking (API usage)
```

**Pages:**

```
/student/qa                          (All conversations)
/student/qa/[conversationId]         (Specific conversation)
/student/courses/[slug]/qa           (Course-scoped Q&A)

/faculty/qa/analytics                (Q&A analytics dashboard)
/faculty/qa/review                   (Review low-confidence answers)
/faculty/courses/[id]/qa-insights    (Course-specific Q&A insights)
```

**Features:**

**For Students:**
- Natural language Q&A about course content
- Chat-like interface with conversation history
- Source citations with links to modules
- Multi-turn conversations (follow-up questions)
- Course-scoped or platform-wide questions
- "Ask about this" button on any module
- Suggested questions based on module content
- Save/bookmark helpful conversations
- Share Q&A with classmates

**For Faculty:**
- Analytics on common questions
- Identify knowledge gaps in content
- Review AI responses for accuracy
- Override/edit AI responses
- See which modules generate most questions
- Export Q&A transcripts
- Cost monitoring (token usage)
- Disable Q&A for specific modules (if needed)

**Advanced Features:**

**1. Multimodal Support:**
- Question about images/diagrams in modules
- Upload images with questions (vision model)

**2. Code Understanding:**
- Ask about code snippets in modules
- Get code explanations
- Debug help for playground code

**3. Smart Suggestions:**
```typescript
// After student completes a module:
"Common questions about this topic:
- How does working memory differ from long-term memory?
- Can you explain the serial position effect?
- What are some real-world applications?"
```

**4. Confidence Scoring:**
```typescript
// If similarity < 0.7:
"I'm not confident about this answer. Here are some related modules you might want to check:
- Module: Introduction to Memory Systems
- Module: Cognitive Architecture"
```

**5. Question Routing:**
- Low confidence → escalate to faculty (create discussion post)
- High confidence → answer immediately
- Inappropriate questions → filtered/blocked

**Cost Optimization:**

**Embedding Costs (One-time per content):**
- text-embedding-ada-002: $0.0001 / 1K tokens
- Average module: 3,000 words = ~4,000 tokens
- Cost per module: ~$0.0004
- 1,000 modules: ~$0.40

**Query Costs (Per question):**
- gpt-3.5-turbo: $0.0015 / 1K tokens (input) + $0.002 / 1K tokens (output)
- gpt-4-turbo: $0.01 / 1K tokens (input) + $0.03 / 1K tokens (output)
- Average question: 1,500 tokens total
- Cost per question (GPT-3.5): ~$0.005
- Cost per question (GPT-4): ~$0.04

**Monthly Estimates:**
- 100 active students, 10 questions/month each = 1,000 questions
- With GPT-3.5: ~$5/month
- With GPT-4: ~$40/month
- Hybrid approach (GPT-3.5 for simple, GPT-4 for complex): ~$15/month

**Environment Variables:**

```bash
# .env.production
OPENAI_API_KEY="sk-..."

# Vector DB (choose one)
PINECONE_API_KEY="..."           # If using Pinecone
PINECONE_ENVIRONMENT="..."
DATABASE_URL="..."               # pgvector uses existing Postgres

# Feature flags
NEXT_PUBLIC_ENABLE_QA=true
QA_DEFAULT_MODEL="gpt-3.5-turbo" # or "gpt-4-turbo-preview"
QA_MAX_QUESTIONS_PER_DAY=50      # Rate limiting per user
```

**Testing Checklist:**

- [ ] Module content ingestion and chunking
- [ ] Embedding generation and storage
- [ ] Vector similarity search accuracy
- [ ] Question answering quality
- [ ] Source citation correctness
- [ ] Multi-turn conversation context
- [ ] Course-scoped queries
- [ ] Feedback mechanism
- [ ] Rate limiting
- [ ] Cost tracking
- [ ] Error handling (API failures)
- [ ] Privacy (no data leakage between courses)

**Rollout Strategy:**

**Phase 1: Beta (Week 1-2)**
- Enable for 1 pilot course
- Faculty review all AI responses
- Collect feedback from 10 students
- Tune similarity thresholds
- Adjust prompts based on quality

**Phase 2: Limited Release (Week 3-4)**
- Enable for 5 courses
- Monitor costs and performance
- Implement rate limiting
- Add analytics dashboard

**Phase 3: Full Release (Week 5+)**
- Enable platform-wide
- Launch faculty training
- Public documentation
- Marketing announcement

**Alternatives Considered:**

**1. Fine-tuned Model:**
- Pros: Better domain adaptation, potentially lower cost
- Cons: Complex training, maintenance, still needs RAG
- Verdict: Not recommended initially, consider later

**2. Prompt-only (No RAG):**
- Pros: Simpler implementation
- Cons: Hallucinations, outdated info, no source citations
- Verdict: Not suitable for educational platform

**3. Human-in-the-Loop:**
- Pros: Highest accuracy
- Cons: Defeats purpose of automation
- Verdict: Use as fallback for low-confidence answers

**Success Metrics:**

- Student satisfaction: > 4.0/5 helpful rating
- Answer accuracy: > 85% (based on faculty review)
- Response time: < 5 seconds
- Usage: > 50% of active students use Q&A
- Faculty time saved: > 10 hours/month (fewer support emails)
- Cost per active student: < $1/month

---

### 16. More Playground Templates

**Why Expand:**
- Currently only 1 template (Braitenberg Vehicles)
- Showcase platform capabilities
- Provide ready-to-use interactive content

**Impact:** MEDIUM | **Complexity:** MEDIUM | **Effort:** 2 weeks

**Templates to Add:**

1. **Neural Networks**
   - Perceptron visualization
   - Backpropagation demo
   - Activation function explorer
   - Neural network playground (TensorFlow.js)

2. **Cognitive Science**
   - Signal detection theory
   - Working memory model
   - Attention mechanisms
   - Cognitive load visualization

3. **Statistics & Data Science**
   - Probability distributions
   - Hypothesis testing
   - Regression visualization
   - Monte Carlo simulation

4. **Biology**
   - Population dynamics
   - Genetic algorithms
   - Neuron firing simulation
   - Reaction-diffusion systems

5. **Physics**
   - Pendulum simulation
   - Chaos theory (Lorenz attractor)
   - Wave interference
   - Particle systems

6. **Algorithms**
   - Sorting algorithm visualizations
   - Graph traversal (BFS/DFS)
   - Pathfinding (A*)
   - Recursion trees

---

### 17. Mobile App (React Native)

**Why Consider:**
- Mobile-first students
- Offline access
- Push notifications
- Native experience

**Impact:** HIGH | **Complexity:** VERY HIGH | **Effort:** 8+ weeks

**Tech Stack:**
- React Native (Expo)
- Same Next.js backend API
- AsyncStorage for offline data
- React Query for data fetching

**Features:**
- Native iOS/Android apps
- Offline course content
- Download modules for offline reading
- Push notifications
- Native video player
- Biometric authentication
- Background sync
- App-specific optimizations

---

### 18. Internationalization (i18n)

**Why Important:**
- Reach international students
- Accessibility for non-English speakers
- Multi-language content

**Impact:** MEDIUM | **Complexity:** MEDIUM | **Effort:** 2 weeks

**Implementation:**
- next-intl or react-i18next
- Translation files for UI strings
- RTL support for Arabic/Hebrew
- Locale-specific date/number formatting
- Language switcher in header
- Automatic locale detection
- Multi-language content support (courses in multiple languages)

**Languages to Support:**
- English (default)
- Spanish
- Mandarin
- French
- German
- Arabic

---

### 19. Content Import/Export

**Why Needed:**
- Migrate content from other platforms
- Backup courses
- Share content between institutions
- Bulk operations

**Impact:** MEDIUM | **Complexity:** MEDIUM | **Effort:** 1.5 weeks

**Features:**
- Bulk import courses from CSV/JSON
- Import from Moodle XML
- Import from Canvas
- Export courses to:
  - PDF (formatted e-book)
  - EPUB (e-reader compatible)
  - SCORM (LMS compatible)
  - JSON (backup)
- Backup/restore entire platform
- Migration tools for upgrades

---

### 20. Accessibility Enhancements

**Why Critical:
- Legal compliance (ADA, Section 508)
- Inclusive education
- Better UX for all users

**Impact:** HIGH | **Complexity:** MEDIUM | **Effort:** 1.5 weeks

**Enhancements:**
- WCAG 2.1 AAA compliance (currently AA)
- Enhanced screen reader support
- Keyboard navigation improvements
- Focus indicators
- High contrast mode toggle
- Text-to-speech for module content
- Adjustable font sizes
- Dyslexia-friendly font option
- Reduced motion mode
- Alt text enforcement for images
- Accessibility audit tools
- Automated testing (axe-core, Lighthouse)

---

### 21. Gamification System

**Why Engage:
- Increase motivation
- Improve retention
- Make learning fun
- Social learning

**Impact:** MEDIUM | **Complexity:** MEDIUM-HIGH | **Effort:** 2 weeks

#### Database Models

```prisma
model achievements {
  id              String   @id @default(cuid())
  name            String
  description     String
  icon            String   // Icon identifier
  points          Int
  category        String   // learning, social, streak, milestone
  criteria        Json     // {type: 'courses_completed', threshold: 5}
  rarity          String   @default("common") // common, rare, epic, legendary

  created_at      DateTime @default(now())

  earned_by       user_achievements[]
}

model user_achievements {
  id              String   @id @default(cuid())
  user_id         String
  achievement_id  String
  earned_at       DateTime @default(now())
  progress        Int?     // For multi-step achievements

  user            users        @relation(fields: [user_id], references: [id])
  achievement     achievements @relation(fields: [achievement_id], references: [id])

  @@unique([user_id, achievement_id])
  @@index([user_id])
}

model leaderboards {
  id              String   @id @default(cuid())
  user_id         String   @unique

  // Points & Levels
  total_points    Int      @default(0)
  level           Int      @default(1)
  xp_current      Int      @default(0)
  xp_needed       Int      @default(100)

  // Streaks
  current_streak  Int      @default(0)
  longest_streak  Int      @default(0)
  last_activity   DateTime @default(now())

  // Rankings
  global_rank     Int?
  course_ranks    Json?    // {courseId: rank}

  updated_at      DateTime @updatedAt

  user            users    @relation(fields: [user_id], references: [id])
}
```

**Achievement Examples:**
- "First Steps" - Complete first module
- "Quiz Master" - Score 100% on 5 quizzes
- "Streak Warrior" - 30-day learning streak
- "Social Butterfly" - Post 10 comments
- "Speed Learner" - Complete course in under 1 week
- "Night Owl" - Study session after midnight
- "Perfect Attendance" - Access platform every day for a month
- "Helping Hand" - Get 20 upvotes on comments
- "Course Completionist" - Finish 10 courses
- "Playground Creator" - Build 5 playgrounds

**Features:**
- Achievement system with badges
- Points and XP
- Leveling system
- Leaderboards (global, course-specific)
- Streak tracking
- Daily quests/challenges
- Progress bars
- Achievement notifications
- Shareable achievements
- Profile trophy case
- Seasonal events

---

### 22. Authentication & Security Enhancements ⭐⭐⭐ SECURITY CRITICAL

**Why Urgent:**
- Current JWT tokens valid for 30 days (stolen tokens = 30-day access)
- No rate limiting on login endpoint (vulnerable to brute force)
- No device session management (can't revoke stolen sessions)
- No MFA/2FA (single point of failure)
- These are **critical security vulnerabilities** that should be addressed ASAP

**Impact:** VERY HIGH | **Complexity:** MEDIUM | **Effort:** 2-3 weeks

**Current Security Score: 6.5/10** → **Target: 9/10**

#### Current Vulnerabilities

| Issue | Risk Level | Current State | Impact |
|-------|-----------|---------------|---------|
| Long-lived JWT (30 days) | 🔴 **CRITICAL** | `maxAge: 30 * 24 * 60 * 60` | Stolen JWT valid for month |
| No rate limiting | 🔴 **CRITICAL** | No protection | Unlimited brute force attempts |
| No MFA/2FA | 🟡 **HIGH** | Single-factor only | Compromised password = full access |
| No session management | 🟡 **HIGH** | Can't revoke sessions | Can't logout from all devices |
| Basic logging | 🟢 **MEDIUM** | console.error only | No anomaly detection |

#### Implementation Details

**1. JWT Security: Short-Lived Access + Refresh Tokens**

**Current Problem:**
```typescript
// src/lib/auth/config.ts (CURRENT - VULNERABLE)
jwt: {
  maxAge: 30 * 24 * 60 * 60, // 30 days ❌
}
```

**Recommended Solution:**
```typescript
// Short-lived access tokens + refresh tokens
jwt: {
  maxAge: 15 * 60, // 15 minutes ✅
}
```

**New Database Model:**

```prisma
model refresh_tokens {
  id              String   @id @default(cuid())
  user_id         String
  token           String   @unique

  // Security
  expires_at      DateTime
  revoked_at      DateTime?
  replaced_by     String?   // Token rotation tracking

  // Device tracking
  device_name     String?   // "Chrome on MacOS"
  ip_address      String?
  user_agent      String?

  // Analytics
  last_used_at    DateTime  @default(now())
  created_at      DateTime  @default(now())

  user            users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([token])
  @@index([expires_at])
}
```

**API Endpoints:**
```typescript
POST   /api/auth/refresh
// Body: { refreshToken: string }
// Returns: { accessToken: string, refreshToken: string (new, rotated) }

POST   /api/auth/logout-all
// Revokes all refresh tokens for user

GET    /api/auth/sessions
// List all active sessions (refresh tokens)

DELETE /api/auth/sessions/[id]
// Revoke specific session
```

**Refresh Token Flow:**
```typescript
// lib/auth/refresh-token.ts

export async function createRefreshToken(userId: string, deviceInfo: {
  userAgent?: string,
  ipAddress?: string
}): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex')

  await prisma.refresh_tokens.create({
    data: {
      user_id: userId,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      device_name: parseUserAgent(deviceInfo.userAgent),
      ip_address: deviceInfo.ipAddress,
      user_agent: deviceInfo.userAgent
    }
  })

  return token
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string, tokenId: string } | null> {
  const refreshToken = await prisma.refresh_tokens.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!refreshToken) return null
  if (refreshToken.revoked_at) return null
  if (refreshToken.expires_at < new Date()) return null

  // Update last used
  await prisma.refresh_tokens.update({
    where: { id: refreshToken.id },
    data: { last_used_at: new Date() }
  })

  return {
    userId: refreshToken.user_id,
    tokenId: refreshToken.id
  }
}

export async function rotateRefreshToken(oldToken: string): Promise<string> {
  const verified = await verifyRefreshToken(oldToken)
  if (!verified) throw new Error('Invalid refresh token')

  // Create new token
  const newToken = await createRefreshToken(verified.userId, {})

  // Mark old token as replaced (don't delete for audit trail)
  await prisma.refresh_tokens.update({
    where: { id: verified.tokenId },
    data: {
      revoked_at: new Date(),
      replaced_by: newToken
    }
  })

  return newToken
}
```

**Client-Side Implementation:**
```typescript
// lib/auth/client.ts

let accessToken: string | null = null
let refreshToken: string | null = null

// Store refresh token in HttpOnly cookie (secure)
// Store access token in memory (never localStorage!)

export async function apiRequest(url: string, options?: RequestInit) {
  // Try request with current access token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  })

  // If 401, try to refresh
  if (response.status === 401) {
    const refreshed = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include' // Send HttpOnly cookie
    })

    if (refreshed.ok) {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshed.json()
      accessToken = newAccessToken
      // New refresh token automatically set in HttpOnly cookie

      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'Authorization': `Bearer ${accessToken}`
        }
      })
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/auth/login'
    }
  }

  return response
}
```

---

**2. Rate Limiting**

**Basic Implementation (FREE - No External Services):**

```typescript
// lib/rate-limit.ts

const loginAttempts = new Map<string, { count: number, resetAt: number }>()

export function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): {
  allowed: boolean,
  remaining: number,
  resetAt: Date
} {
  const now = Date.now()
  const record = loginAttempts.get(identifier)

  // Clean up expired entries
  if (record && record.resetAt < now) {
    loginAttempts.delete(identifier)
  }

  const current = loginAttempts.get(identifier) || { count: 0, resetAt: now + windowMs }

  if (current.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(current.resetAt)
    }
  }

  current.count++
  loginAttempts.set(identifier, current)

  return {
    allowed: true,
    remaining: maxAttempts - current.count,
    resetAt: new Date(current.resetAt)
  }
}

// Usage in login endpoint:
const rateLimit = checkRateLimit(request.headers.get('x-forwarded-for') || 'unknown')
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: `Too many login attempts. Try again in ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000)} minutes` },
    { status: 429 }
  )
}
```

**Advanced Implementation (FREE TIER - Upstash Redis):**

```typescript
// lib/rate-limit-redis.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export async function checkRateLimitRedis(identifier: string, maxAttempts: number = 5, windowSec: number = 900) {
  const key = `rate_limit:${identifier}`
  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, windowSec)
  }

  const ttl = await redis.ttl(key)

  return {
    allowed: count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - count),
    resetAt: new Date(Date.now() + ttl * 1000)
  }
}
```

**Database Model (For Tracking):**

```prisma
model login_attempts {
  id              String   @id @default(cuid())
  identifier      String   // IP or email
  success         Boolean
  user_id         String?
  ip_address      String
  user_agent      String?
  error_message   String?
  created_at      DateTime @default(now())

  user            users?   @relation(fields: [user_id], references: [id], onDelete: SetNull)

  @@index([identifier, created_at])
  @@index([ip_address, created_at])
  @@index([user_id, created_at])
}
```

---

**3. MFA/2FA Support (FREE - TOTP with QR Codes)**

**Database Model:**

```prisma
model user_mfa {
  id              String   @id @default(cuid())
  user_id         String   @unique

  // TOTP (Time-based OTP)
  mfa_enabled     Boolean  @default(false)
  mfa_secret      String?  // Encrypted TOTP secret

  // Backup codes
  backup_codes    String[]  // Hashed backup codes

  // Recovery
  recovery_email  String?

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  user            users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

**API Endpoints:**

```typescript
POST   /api/auth/mfa/setup
// Generates TOTP secret and QR code
// Returns: { secret, qrCodeUrl, backupCodes }

POST   /api/auth/mfa/verify
// Verifies TOTP code and enables MFA
// Body: { code: string }

POST   /api/auth/mfa/validate
// Validates MFA code during login
// Body: { code: string }

POST   /api/auth/mfa/disable
// Disables MFA (requires password + code)
// Body: { password: string, code: string }
```

**Implementation:**

```typescript
// lib/mfa.ts
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'

export async function generateMFASecret(userId: string, email: string) {
  const secret = speakeasy.generateSecret({
    name: `BCS E-Textbook (${email})`,
    issuer: 'BCS E-Textbook Platform'
  })

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

  // Generate 10 backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  )

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes
  }
}

export function verifyMFACode(secret: string, code: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1 // Allow 30-second time drift
  })
}
```

---

**4. Device Session Management**

**Database Extension:**

```prisma
// Update existing sessions table
model sessions {
  id              String   @id
  session_token   String   @unique
  user_id         String
  expires         DateTime
  created_at      DateTime @default(now())

  // NEW: Device tracking
  device_name     String?
  browser         String?
  os              String?
  ip_address      String?
  location        String?  // City, Country (from IP)
  last_active     DateTime @default(now())

  @@index([user_id])
  @@index([session_token])
}
```

**UI Components:**

```typescript
// components/auth/SessionManager.tsx

export function SessionManager() {
  const { sessions } = useActiveSessions()

  return (
    <div>
      <h2>Active Sessions</h2>
      {sessions.map(session => (
        <Card key={session.id}>
          <div>
            <DeviceIcon device={session.device_name} />
            <div>
              <p>{session.device_name}</p>
              <p>{session.browser} on {session.os}</p>
              <p>{session.location}</p>
              <p>Last active: {formatRelativeTime(session.last_active)}</p>
            </div>
            {session.isCurrent ? (
              <Badge>Current Session</Badge>
            ) : (
              <Button onClick={() => revokeSession(session.id)}>
                Revoke
              </Button>
            )}
          </div>
        </Card>
      ))}
      <Button onClick={revokeAllOtherSessions}>
        Logout from all other devices
      </Button>
    </div>
  )
}
```

---

**5. Enhanced Logging & Monitoring**

**Database Model:**

```prisma
model security_logs {
  id              String   @id @default(cuid())
  user_id         String?
  event_type      String   // 'login_success', 'login_failed', 'mfa_enabled', 'password_changed', 'session_revoked', 'suspicious_activity'

  // Context
  ip_address      String
  user_agent      String?
  location        String?

  // Details
  details         Json?    // Additional event-specific data

  // Risk assessment
  risk_level      String   @default('low') // low, medium, high, critical
  flagged         Boolean  @default(false)

  created_at      DateTime @default(now())

  user            users?   @relation(fields: [user_id], references: [id], onDelete: SetNull)

  @@index([user_id, created_at])
  @@index([event_type, created_at])
  @@index([risk_level, flagged])
}
```

**Logging Helper:**

```typescript
// lib/security-logger.ts

export async function logSecurityEvent({
  userId,
  eventType,
  ipAddress,
  userAgent,
  details,
  riskLevel = 'low'
}: {
  userId?: string
  eventType: string
  ipAddress: string
  userAgent?: string
  details?: any
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
}) {
  const log = await prisma.security_logs.create({
    data: {
      user_id: userId,
      event_type: eventType,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: details ? JSON.stringify(details) : null,
      risk_level: riskLevel,
      flagged: riskLevel === 'high' || riskLevel === 'critical'
    }
  })

  // Alert on critical events
  if (riskLevel === 'critical') {
    await sendAlertToAdmins(log)
  }

  return log
}

// Usage:
await logSecurityEvent({
  userId: user.id,
  eventType: 'login_success',
  ipAddress: request.ip,
  userAgent: request.headers.get('user-agent'),
  details: { method: 'credentials' },
  riskLevel: 'low'
})

// For failed login:
await logSecurityEvent({
  eventType: 'login_failed',
  ipAddress: request.ip,
  details: { email, reason: 'invalid_password', attempts: 3 },
  riskLevel: attempts > 3 ? 'high' : 'medium'
})
```

---

#### Free Tier Compatibility Matrix

| Feature | Free Option | Cost | Upgrade Option | Cost | When to Upgrade |
|---------|-------------|------|----------------|------|-----------------|
| **JWT + Refresh Tokens** | ✅ Code only | $0 | N/A | N/A | Never needed |
| **Basic Rate Limiting** | ✅ In-memory Map | $0 | Upstash Redis | $0 (10K req/day) | > 10K requests/day |
| **MFA/2FA (TOTP)** | ✅ QR Codes | $0 | SMS via Twilio | $0.0079/msg | User preference |
| **Session Management** | ✅ PostgreSQL | $0 | N/A | N/A | Never needed |
| **Logging** | ✅ Vercel Logs | $0 | Sentry | $26/mo | Need error tracking |
| **Device Fingerprinting** | ✅ User-agent parsing | $0 | FingerprintJS | $200/mo | High-security needs |

**Free Tier Recommendations:**
- ✅ **Implement Now:** JWT + Refresh tokens, basic rate limiting, TOTP MFA, session management
- ⏳ **Defer:** Advanced rate limiting (until traffic > 10K/day)
- ❌ **Skip:** Paid monitoring (use Vercel logs initially)

**Monthly Costs (Estimates):**
- **Small deployment (< 1,000 users):** $0/month
- **Medium deployment (1,000-10,000 users):** $0-10/month (if using Upstash Pro)
- **Large deployment (> 10,000 users):** $10-50/month (Upstash + optional Sentry)

---

#### Implementation Priority

**Phase 1: Immediate (Week 1-2) - CRITICAL**
1. Short-lived JWT + refresh tokens
2. Basic in-memory rate limiting
3. Enhanced security logging
4. Session management UI

**Phase 2: Short-term (Week 3-4) - HIGH**
5. TOTP MFA/2FA with QR codes
6. Device session tracking
7. Anomaly detection alerts

**Phase 3: Medium-term (Week 5+) - NICE TO HAVE**
8. Advanced rate limiting (Upstash Redis)
9. Geographic anomaly detection
10. Security analytics dashboard

---

#### Testing Checklist

**JWT & Refresh Tokens:**
- [ ] Access token expires after 15 minutes
- [ ] Refresh token successfully rotates
- [ ] Revoked refresh tokens can't be used
- [ ] Logout from all devices works
- [ ] Password change revokes all tokens

**Rate Limiting:**
- [ ] 5 failed login attempts triggers 15-min lockout
- [ ] Rate limit resets after window expires
- [ ] Different IPs have separate limits
- [ ] Rate limit headers returned (X-RateLimit-*)

**MFA/2FA:**
- [ ] QR code generates correctly
- [ ] TOTP codes validate properly
- [ ] Backup codes work
- [ ] MFA can be disabled with password
- [ ] Login flow requires MFA when enabled

**Session Management:**
- [ ] Sessions list shows all active devices
- [ ] Current session marked correctly
- [ ] Revoke session works
- [ ] Device info captured accurately

**Logging:**
- [ ] All login attempts logged
- [ ] Failed attempts trigger alerts at threshold
- [ ] Security events stored in database
- [ ] Critical events flagged

---

#### Security Benefits Summary

**Before (Current State):**
- ❌ JWT valid for 30 days
- ❌ Unlimited brute force attempts
- ❌ No MFA/2FA
- ❌ Can't revoke sessions
- ❌ Basic error logging
- **Security Score: 6.5/10**

**After (Implemented):**
- ✅ JWT valid for 15 minutes
- ✅ Rate limiting (5 attempts / 15 min)
- ✅ Optional MFA/2FA
- ✅ Full session management
- ✅ Comprehensive security logging
- **Security Score: 9/10**

**Risk Reduction:**
- 🔒 Stolen JWT window: 30 days → 15 minutes **(97% reduction)**
- 🔒 Brute force attacks: Unlimited → 5 attempts **(99.9% reduction)**
- 🔒 Account takeover risk: High → Low **(75% reduction)**

---

## 📋 Recommended Implementation Order

### Immediate (Start with these 4):
1. **Playground Persistence API** (2 weeks)
   - Highest ROI - UI already built
   - Unlocks entire playground system
   - No dependencies

2. **Authentication & Security Enhancements** (2-3 weeks) 🔴 **SECURITY CRITICAL**
   - Fixes critical vulnerabilities
   - JWT + refresh tokens + rate limiting
   - 100% free tier compatible
   - Prevents account takeovers

3. **Student Dashboard & Enrollment** (3 weeks)
   - Core platform functionality
   - Foundation for other features
   - High educational value

4. **Discussion System** (2 weeks)
   - Increases engagement immediately
   - Low complexity
   - High value

### Short-term (Next 3):
4. **Notification System** (1.5 weeks)
   - Supports discussions
   - Foundation for other features

5. **Quiz System** (3 weeks)
   - Essential educational feature
   - Enables assessments

6. **Analytics Dashboard** (1.5 weeks)
   - Faculty insights
   - Measure success

### Medium-term:
7. Assignment Submission
8. Video Integration
9. Certificate Generation
10. Advanced Search

### Long-term:
11. Collaborative Editing
12. Learning Paths
13. Content Versioning
14. AI Recommendations
15. AI-Powered Q&A with RAG
16. More Templates
17. Gamification

### Future Considerations:
18. Mobile App
19. Internationalization
20. Content Import/Export
21. Accessibility Enhancements

---

## 🛠 Technical Considerations

### Stack Compatibility
All proposed features are compatible with:
- ✅ Next.js 15 + React 19
- ✅ PostgreSQL + Prisma ORM
- ✅ Vercel serverless deployment
- ✅ Current authentication system (NextAuth v5)

### Third-Party Services Needed

**Already Integrated:**
- Resend (email)
- Supabase (database)
- Vercel (hosting)

**New Integrations:**
- **Real-time:** Pusher, Supabase Realtime, or Ably
- **File Storage:** Vercel Blob Storage or AWS S3
- **Video Hosting:** Mux (if self-hosting videos)
- **PDF Generation:** @react-pdf/renderer or Puppeteer
- **Analytics:** Recharts or Chart.js (client-side)
- **Search:** Elasticsearch (optional, for advanced search)
- **AI/ML:** OpenAI API (for recommendations)

### Database Migration Strategy
- All new schemas are additive (no breaking changes)
- Use Prisma migrations: `npx prisma migrate dev`
- Production: `npx prisma migrate deploy`
- Each feature can be deployed independently
- No data loss during migrations

### Performance Considerations
- Use database indexes on all foreign keys and frequently queried fields
- Implement pagination for all list endpoints
- Cache analytics queries (Redis or Vercel KV)
- Optimize images (Next.js Image component)
- Use Edge Functions for read-heavy operations
- Implement rate limiting on write operations

### Security Best Practices
- Role-based access control (RBAC) for all endpoints
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- XSS protection (sanitize user input)
- CSRF tokens for forms
- File upload restrictions (type, size)
- Rate limiting on API routes
- Secure file storage with signed URLs

---

## 📊 Effort Estimation Summary

| Phase | Features | Total Effort | Timeline |
|-------|----------|-------------|----------|
| **Phase 1** | 7 features | 15.5 weeks | 6-8 weeks (parallel dev) |
| **Phase 2** | 6 features | 12.5 weeks | 4-6 weeks (parallel dev) |
| **Phase 3** | 9 features | 25.5 weeks | 6-8 weeks (parallel dev) |
| **TOTAL** | 22 features | 53.5 weeks | **16-22 weeks (4-6 months)** |

*Note: Timeline assumes 2-3 developers working in parallel. Security enhancements (Feature #22, 2-3 weeks) added to Phase 1 as critical priority.*

---

## 🎯 Success Metrics

### For Faculty:
- Time to create course: < 2 hours
- Student engagement increase: > 40%
- Content reuse rate: > 60%
- Faculty satisfaction: > 4.5/5

### For Students:
- Course completion rate: > 70%
- Average session time: > 15 minutes
- Return rate: > 80% weekly
- Student satisfaction: > 4.5/5

### For Platform:
- Uptime: > 99.9%
- Page load time: < 2 seconds
- API response time: < 200ms
- Error rate: < 0.1%

---

## 📝 Next Steps

1. **Review & Prioritize:** Stakeholder review of all proposals
2. **Budget Approval:** Estimate costs for third-party services
3. **Team Assignment:** Assign developers to Phase 1 features
4. **Sprint Planning:** Break Phase 1 into 2-week sprints
5. **Design Phase:** Create wireframes/mockups for new features
6. **Development Kickoff:** Start with Playground Persistence API

---

**Document Author:** AI Analysis (Claude Code)
**Last Updated:** January 2025
**Version:** 1.2
**Status:** Awaiting Review & Approval

**Changelog:**
- v1.2: Added Feature #22 - Authentication & Security Enhancements (JWT refresh tokens, rate limiting, MFA/2FA, session management, security logging). Updated implementation order to prioritize security as #2. Added free tier compatibility matrix.
- v1.1: Added Feature #15 - AI-Powered Q&A with RAG (Retrieval Augmented Generation)
- v1.0: Initial document with 20 features
