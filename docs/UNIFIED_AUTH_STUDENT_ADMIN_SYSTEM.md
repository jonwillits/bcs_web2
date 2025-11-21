# Unified Authentication, Student System & Admin Dashboard

**Document Version:** 2.0
**Date:** January 2025
**Status:** Approved for Implementation
**Estimated Timeline:** 5 weeks
**Based On:** STUDENT_SYSTEM_PROPOSAL.md v1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architectural Improvements](#architectural-improvements)
4. [System Design](#system-design)
5. [Database Schema](#database-schema)
6. [Implementation Plan](#implementation-plan)
7. [Security & Privacy](#security--privacy)
8. [Testing Strategy](#testing-strategy)
9. [Success Metrics](#success-metrics)
10. [Appendices](#appendices)

---

## Executive Summary

### Vision

Transform the BCS E-Textbook Platform from a faculty-only content management system into a **complete educational ecosystem** with three distinct user roles: **Students**, **Faculty**, and **Administrators**.

### Key Improvements Over Original Proposal

| Original Proposal | Enhanced Design |
|-------------------|-----------------|
| Separate student/faculty registration | **Unified registration** with intelligent role routing |
| Faculty auto-approved | **Admin approval workflow** for faculty requests |
| No admin role | **Complete admin dashboard** with superuser access |
| Basic progress tracking | **Enhanced analytics** with audit trails |
| 3-week timeline | **5-week timeline** with admin features |

### Three Core Systems

1. **Unified Authentication System**
   - Single registration entry point
   - Role-based form fields (Student vs Faculty)
   - Faculty approval workflow
   - Email domain validation

2. **Student Learning System** (from original proposal)
   - Course enrollment
   - Progress tracking
   - Learning roadmap visualization
   - Personalized dashboard

3. **Admin Governance System** (new)
   - Faculty approval management
   - User management (suspend, delete, role changes)
   - Content moderation (edit, hide, delete)
   - Platform analytics and monitoring
   - Audit logging for all admin actions

---

## Current State Analysis

### What Currently Exists ✅

**Authentication (NextAuth v5):**
- Email/password authentication
- Email verification system
- Password reset functionality
- Role-based access (`role: 'faculty'` by default)
- JWT sessions with 30-day expiry

**User Profiles:**
- Rich faculty profiles (about, speciality, university, avatar, social links)
- Profile editing page at `/profile/edit`
- Public profile viewing at `/profile/[userId]`

**Faculty Features:**
- Dashboard with personal stats
- Course creation and management (4 pages)
- Module creation and management (4 pages)
- Content collaboration system
- Network visualization of content relationships

**Public Features:**
- Course catalog browsing
- Module viewing
- Network graph visualization
- No login required for viewing

**Infrastructure:**
- Next.js 15 (App Router) + React 19
- PostgreSQL with Prisma ORM
- Vercel deployment (serverless)
- Resend email service
- Tailwind CSS + Custom Neural Design System

### What's Missing ❌

**Student System:**
- No student role implementation
- No course enrollment tables
- No progress tracking
- No student dashboard
- No student-specific pages

**Admin System:**
- No admin role
- No approval workflow
- No admin dashboard
- No audit logging
- No platform-wide analytics

**Registration:**
- Hardcoded to create `role: 'faculty'` only
- No role selection in registration form
- No student-specific fields (major, graduation year)
- No faculty approval process

---

## Architectural Improvements

### 1. Unified Registration Flow

#### Design Philosophy

**Problem with Separate Registration Pages:**
- User confusion: "Which page should I use?"
- Code duplication (two forms with similar validation)
- URL complexity (`/auth/register/student` vs `/auth/register/faculty`)

**Solution: Smart Single-Page Registration**

```
User visits /auth/register
         ↓
   ┌─────────────────┐
   │ Select Your Role│
   ├─────────────────┤
   │ ○ Student       │
   │ ○ Faculty       │
   └─────────────────┘
         ↓
   [Form fields change dynamically]
         ↓
┌──────────────────┬──────────────────┐
│   If Student     │   If Faculty     │
├──────────────────┼──────────────────┤
│ • Name           │ • Name           │
│ • Email          │ • Email          │
│ • Password       │ • Password       │
│ • Major          │ • University     │
│ • Grad Year      │ • Department     │
│ • Interests      │ • Title          │
│                  │ • Research Area  │
│                  │ • Website        │
│                  │ • Statement      │
└──────────────────┴──────────────────┘
         ↓
┌──────────────────┬──────────────────┐
│   If Student     │   If Faculty     │
├──────────────────┼──────────────────┤
│ Account created  │ Pending approval │
│ role: 'student'  │ role: 'pending'  │
│ ✅ Can login     │ ⏳ Awaits admin  │
└──────────────────┴──────────────────┘
```

#### Email Domain Validation (Optional Enhancement)

```typescript
// Show warning, don't block
if (selectedRole === 'faculty' && !email.endsWith('.edu')) {
  warning = "Faculty accounts typically use university email addresses"
}

// Future: Auto-suggest role based on domain
if (email.endsWith('@illinois.edu')) {
  suggestedRole = 'faculty'
}
```

### 2. Faculty Approval Workflow

#### Why Faculty Needs Approval

**Security Concerns:**
- Prevent unauthorized content creation
- Avoid spam/malicious courses
- Maintain platform quality
- Protect institutional reputation

**Solution: Admin Approval Queue**

```
Faculty registers → Creates pending account
         ↓
Admin receives notification
         ↓
Admin reviews:
  - University affiliation
  - Personal website (verify legitimacy)
  - Statement (why they need access)
         ↓
┌────────────┬────────────┐
│  Approve   │   Decline  │
├────────────┼────────────┤
│ role='faculty' │ Send reason│
│ Send welcome   │ Keep as    │
│ email          │ 'pending'  │
└────────────┴────────────┘
         ↓
Faculty can create courses/modules
```

#### Faculty Request Data Model

**Stored in `users` table + `faculty_requests` table:**

```typescript
{
  // Core user data (in users table)
  email: "prof@illinois.edu",
  name: "Dr. Jane Smith",
  role: "pending_faculty", // Will become "faculty" on approval

  // Faculty-specific profile data
  university: "University of Illinois",
  department: "Brain and Cognitive Science",
  title: "Associate Professor",
  research_area: "Computational Neuroscience",
  personal_website: "https://janesmith.edu",

  // Approval tracking (in faculty_requests table)
  request_statement: "I teach BCS 420 and want to create interactive modules...",
  requested_at: "2025-01-15T10:00:00Z",
  reviewed_by: null, // admin_id once reviewed
  reviewed_at: null,
  approval_status: "pending" // pending | approved | declined
}
```

### 3. Admin System Architecture

#### Admin Role Hierarchy

```
┌─────────────────────────────────────┐
│         SUPER ADMIN                 │
│  (First admin, cannot be deleted)   │
│  • All admin powers                 │
│  • Can promote/demote other admins  │
│  • Can delete admin accounts        │
└─────────────────────────────────────┘
              ↓ can create
┌─────────────────────────────────────┐
│         ADMIN                       │
│  (Additional administrators)        │
│  • Approve faculty                  │
│  • Manage users (non-admin)         │
│  • Moderate content                 │
│  • View analytics                   │
│  • Cannot delete super admin        │
└─────────────────────────────────────┘
```

#### Admin Setup: Best Practice Recommendation

**Method: Environment Variable with Database Flag**

**Step 1: Set Environment Variable**
```env
# .env.production
ADMIN_EMAILS="admin@illinois.edu,backup-admin@illinois.edu"
SUPER_ADMIN_EMAIL="admin@illinois.edu"
```

**Step 2: Auto-Promote on Registration**
```typescript
// In /api/auth/register
if (ADMIN_EMAILS.includes(email)) {
  role = 'admin'
  is_super_admin = (email === SUPER_ADMIN_EMAIL)
}
```

**Why This Approach:**
- ✅ Secure: No special URLs or database access needed
- ✅ Flexible: Multiple admins supported
- ✅ Auditable: Clear who the admins are
- ✅ Maintainable: Easy to add/remove via env vars
- ✅ Production-ready: Works in Vercel, supports dev/prod environments

**Alternative for Development:**
```env
# .env.local (development)
ADMIN_EMAILS="dev@example.com"
SUPER_ADMIN_EMAIL="dev@example.com"
```

#### Admin Dashboard: Feature Overview

**15 Core Features:**

1. **Pending Faculty Approvals** 🔔
   - List of pending requests (newest first)
   - View full submitted information
   - Quick approve/decline with reason
   - Email notifications sent automatically

2. **User Management** 👥
   - Search/filter users (by role, status, registration date)
   - View user details + activity summary
   - Change user roles (student ↔ faculty, promote to admin)
   - Suspend accounts (temporary block)
   - Delete accounts (with cascading data deletion)

3. **Content Management** 📚
   - View ALL courses/modules (including drafts, private)
   - Quick actions: Edit, Hide, Unpublish, Delete
   - View content statistics (views, enrollments, completions)
   - Batch operations (e.g., unpublish multiple courses)

4. **Platform Analytics** 📊
   - **User Stats:** Total users by role, new registrations (daily/weekly/monthly)
   - **Content Stats:** Total courses, modules, media files
   - **Engagement:** Total enrollments, active students, completion rates
   - **Growth Charts:** Registration trends, enrollment trends

5. **Audit Logs** 📝
   - All admin actions logged with:
     - Who (admin user)
     - What (action type: approved_faculty, deleted_user, etc.)
     - When (timestamp)
     - Why (reason, if provided)
   - Filter by admin, action type, date range
   - Export to CSV for compliance

6. **Security Monitoring** 🔒
   - Failed login attempts (by user, by IP)
   - Account lockouts (5 failed attempts → 30-min lockout)
   - Suspicious activity alerts (e.g., rapid account creation from same IP)
   - Content flagging system (users can report inappropriate content)

7. **Faculty Analytics** 👨‍🏫
   - Top faculty by course count
   - Most enrolled courses
   - Average course completion rates per faculty

8. **Student Analytics** 👨‍🎓
   - Most active students
   - Average learning time per student
   - Enrollment distribution (which courses are popular)

9. **Content Flags & Reports** 🚩
   - User-submitted reports (inappropriate content, errors)
   - Auto-flagged content (e.g., excessive media, unusual patterns)
   - Review queue with quick actions

10. **Email Management** 📧
    - View recent emails sent (verification, password reset, approval notifications)
    - Email delivery status (Resend integration)
    - Resend failed emails

11. **System Health** 🏥
    - Database size and growth
    - API response times
    - Error logs (500 errors, failed requests)
    - Vercel deployment status

12. **Bulk Operations** ⚙️
    - Bulk approve/decline faculty requests
    - Bulk email users (announcements)
    - Bulk hide/unpublish content

13. **Role Management** 🎭
    - View all admins
    - Add new admin (promote user)
    - Remove admin role (demote to faculty/student)
    - Super admin cannot be demoted

14. **Platform Settings** ⚙️
    - Toggle features (e.g., disable new registrations)
    - Set enrollment caps
    - Configure email templates
    - Maintenance mode toggle

15. **Export & Reporting** 📥
    - Export user data (CSV)
    - Export course/enrollment data (CSV)
    - Generate compliance reports (FERPA, GDPR)
    - Scheduled reports (weekly/monthly stats)

---

## System Design

### User Roles & Permissions

| Feature | Student | Faculty | Pending Faculty | Admin | Super Admin |
|---------|:-------:|:-------:|:---------------:|:-----:|:-----------:|
| **Content Viewing** |
| Browse courses | ✅ | ✅ | ✅ | ✅ | ✅ |
| View modules | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Content Creation** |
| Create courses | ❌ | ✅ | ❌ | ✅ | ✅ |
| Edit own courses | ❌ | ✅ | ❌ | ✅ | ✅ |
| Edit any courses | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete own content | ❌ | ✅ | ❌ | ✅ | ✅ |
| Delete any content | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Student Features** |
| Enroll in courses | ✅ | ✅* | ❌ | ✅ | ✅ |
| Track progress | ✅ | ✅* | ❌ | ✅ | ✅ |
| View learning roadmap | ✅ | ✅* | ❌ | ✅ | ✅ |
| **Faculty Features** |
| View enrollments | ❌ | ✅ | ❌ | ✅ | ✅ |
| View student progress | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Admin Features** |
| Approve faculty | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Promote to admin | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete admins | ❌ | ❌ | ❌ | ❌ | ✅ |

_* Faculty can use student features to test their courses_

### Registration Flow (Detailed)

#### Student Registration

```typescript
// Form fields
{
  role: 'student',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123!',
  major: 'Computer Science',
  graduation_year: 2027,
  academic_interests: ['AI', 'Neuroscience', 'Cognitive Science']
}

// API: POST /api/auth/register
↓
Validation:
  ✓ Email format & uniqueness
  ✓ Password strength (8-128 chars, complexity)
  ✓ Major is valid (from predefined list)
  ✓ Graduation year (current year to current year + 10)
↓
Create user:
  role = 'student'
  email_verified = false
  account_status = 'active'
↓
Send verification email
↓
Response: { success: true, message: "Check email to verify" }
↓
User receives email → Clicks link → Account verified ✅
```

#### Faculty Registration

```typescript
// Form fields
{
  role: 'faculty',
  name: 'Dr. Jane Smith',
  email: 'jane@illinois.edu',
  password: 'SecurePass123!',
  university: 'University of Illinois',
  department: 'Brain and Cognitive Science',
  title: 'Associate Professor',
  research_area: 'Computational Neuroscience',
  personal_website: 'https://janesmith.edu',
  request_statement: 'I teach BCS 420 and want to create interactive modules for my students...'
}

// API: POST /api/auth/register
↓
Validation:
  ✓ Email format & uniqueness
  ✓ Password strength
  ✓ University & department required
  ✓ Title from predefined list
  ✓ Statement minimum 50 characters
↓
Create user:
  role = 'pending_faculty'
  email_verified = false
  account_status = 'pending_approval'
↓
Create faculty_request record:
  user_id = new_user.id
  approval_status = 'pending'
  requested_at = now()
↓
Send email to user: "Your request is pending review"
Send email to admin(s): "New faculty request from Dr. Jane Smith"
↓
Response: { success: true, message: "Request submitted. You'll be notified when reviewed." }
↓
Admin reviews request
  ↓ Approve                       ↓ Decline
  role = 'faculty'                Keep role = 'pending_faculty'
  account_status = 'active'       approval_status = 'declined'
  Send welcome email              Send decline email with reason
  ✅ Can create content           ❌ Cannot create content
```

### Admin Approval Process (Detailed)

**Admin Dashboard → Pending Faculty Approvals:**

```
┌─────────────────────────────────────────────────────┐
│ Pending Faculty Requests (3)                        │
├─────────────────────────────────────────────────────┤
│ Dr. Jane Smith | jane@illinois.edu | 2 days ago    │
│ University of Illinois - Brain & Cognitive Science  │
│ Associate Professor | Computational Neuroscience    │
│ Website: https://janesmith.edu ↗                    │
│ Statement: "I teach BCS 420 and want to create..." │
│ [View Full Profile] [✅ Approve] [❌ Decline]      │
├─────────────────────────────────────────────────────┤
│ Prof. John Doe | john@university.edu | 1 week ago  │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

**Admin clicks "✅ Approve":**

```typescript
// API: PUT /api/admin/faculty-requests/[id]
{
  action: 'approve',
  admin_note: 'Verified credentials on university website'
}
↓
Update user:
  role = 'faculty'
  account_status = 'active'
↓
Update faculty_request:
  approval_status = 'approved'
  reviewed_by = admin_id
  reviewed_at = now()
  admin_note = 'Verified credentials...'
↓
Create audit_log:
  admin_id = current_admin
  action = 'approved_faculty_request'
  target_user_id = faculty_id
  details = { request_id, reason }
↓
Send email to faculty:
  "Congratulations! Your faculty request has been approved.
   You can now create courses and modules."
↓
Response: { success: true }
↓
Faculty can login and access /faculty/dashboard ✅
```

**Admin clicks "❌ Decline":**

```typescript
// Modal prompts for reason
{
  action: 'decline',
  reason: 'Unable to verify university affiliation'
}
↓
Update faculty_request:
  approval_status = 'declined'
  reviewed_by = admin_id
  reviewed_at = now()
  decline_reason = reason
↓
Create audit_log:
  action = 'declined_faculty_request'
  details = { request_id, reason }
↓
Send email to user:
  "Your faculty request has been declined.
   Reason: Unable to verify university affiliation.
   You can resubmit a request or contact support."
↓
User can:
  - Continue using as student account (if wants)
  - Submit new faculty request with better info
  - Contact admin for clarification
```

---

## Database Schema

### New Tables (7 total)

#### 1. `faculty_requests`

Tracks faculty approval requests.

```prisma
model faculty_requests {
  id                 String    @id @default(cuid())
  user_id            String    @unique

  // Request details
  request_statement  String    @db.Text
  requested_at       DateTime  @default(now())

  // Review tracking
  approval_status    String    @default("pending") // pending | approved | declined
  reviewed_by        String?   // admin user_id
  reviewed_at        DateTime?
  admin_note         String?   @db.Text
  decline_reason     String?   @db.Text

  // Relations
  user               users     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  reviewer           users?    @relation("ReviewedRequests", fields: [reviewed_by], references: [id], onDelete: SetNull)

  @@index([approval_status])
  @@index([requested_at(sort: Desc)])
}
```

#### 2. `course_enrollments`

Student enrollment in courses.

```prisma
model course_enrollments {
  id                String    @id @default(cuid())
  course_id         String
  student_id        String

  // Enrollment tracking
  enrolled_at       DateTime  @default(now())
  last_accessed     DateTime?
  unenrolled_at     DateTime?
  status            String    @default("active") // active | completed | dropped | archived

  // Progress metrics
  completion_pct    Float     @default(0) // 0-100
  modules_completed Int       @default(0)
  total_modules     Int       @default(0) // Cached from course
  time_spent_mins   Int       @default(0)

  // Relations
  course            courses   @relation(fields: [course_id], references: [id], onDelete: Cascade)
  student           users     @relation("StudentEnrollments", fields: [student_id], references: [id], onDelete: Cascade)
  module_progress   module_progress[]

  @@unique([course_id, student_id]) // Prevent duplicate enrollments
  @@index([student_id])
  @@index([course_id])
  @@index([status])
}
```

#### 3. `module_progress`

Student progress on individual modules.

```prisma
model module_progress {
  id                String    @id @default(cuid())
  student_id        String
  module_id         String
  enrollment_id     String    // Link to course enrollment

  // Progress tracking
  status            String    @default("not_started") // not_started | in_progress | completed
  started_at        DateTime?
  completed_at      DateTime?
  last_accessed     DateTime?

  // Time tracking
  time_spent_mins   Int       @default(0)
  visit_count       Int       @default(0)

  // Completion data
  scroll_depth_pct  Float     @default(0) // 0-100, how far scrolled
  manually_marked   Boolean   @default(false) // Did user click "Mark Complete"?

  // Relations
  student           users     @relation(fields: [student_id], references: [id], onDelete: Cascade)
  module            modules   @relation(fields: [module_id], references: [id], onDelete: Cascade)
  enrollment        course_enrollments @relation(fields: [enrollment_id], references: [id], onDelete: Cascade)

  @@unique([student_id, module_id, enrollment_id])
  @@index([student_id])
  @@index([module_id])
  @@index([enrollment_id])
  @@index([status])
}
```

#### 4. `learning_sessions`

Daily learning activity for streak tracking.

```prisma
model learning_sessions {
  id                String    @id @default(cuid())
  student_id        String
  date              DateTime  @db.Date // Date only, no time

  // Daily metrics
  minutes_studied   Int       @default(0)
  modules_viewed    Int       @default(0)
  modules_completed Int       @default(0)
  courses_accessed  Int       @default(0)

  // Session tracking
  first_activity    DateTime?
  last_activity     DateTime?

  // Relations
  student           users     @relation(fields: [student_id], references: [id], onDelete: Cascade)

  @@unique([student_id, date]) // One record per student per day
  @@index([student_id, date(sort: Desc)])
  @@index([date(sort: Desc)])
}
```

#### 5. `admin_audit_logs`

Audit trail of all admin actions.

```prisma
model admin_audit_logs {
  id                String    @id @default(cuid())
  admin_id          String

  // Action details
  action            String    // approved_faculty, deleted_user, edited_course, etc.
  target_type       String?   // user | course | module | content_flag
  target_id         String?

  // Metadata
  reason            String?   @db.Text
  details           Json?     // Additional context (old_value, new_value, etc.)
  ip_address        String?
  user_agent        String?

  // Timestamp
  created_at        DateTime  @default(now())

  // Relations
  admin             users     @relation("AdminActions", fields: [admin_id], references: [id], onDelete: Cascade)

  @@index([admin_id])
  @@index([action])
  @@index([created_at(sort: Desc)])
  @@index([target_type, target_id])
}
```

#### 6. `content_flags`

User-reported or auto-flagged content.

```prisma
model content_flags {
  id                String    @id @default(cuid())

  // Content being flagged
  content_type      String    // course | module | comment (future)
  content_id        String

  // Flag details
  reason            String    // inappropriate | error | spam | other
  description       String?   @db.Text
  flagged_by        String?   // user_id (null if auto-flagged)
  flagged_at        DateTime  @default(now())

  // Resolution
  status            String    @default("pending") // pending | reviewed | resolved | dismissed
  reviewed_by       String?   // admin_id
  reviewed_at       DateTime?
  resolution_note   String?   @db.Text
  action_taken      String?   // removed | edited | no_action

  // Relations
  flagger           users?    @relation("FlaggedContent", fields: [flagged_by], references: [id], onDelete: SetNull)
  reviewer          users?    @relation("ReviewedFlags", fields: [reviewed_by], references: [id], onDelete: SetNull)

  @@index([status])
  @@index([content_type, content_id])
  @@index([flagged_at(sort: Desc)])
}
```

#### 7. `platform_analytics`

Daily aggregated platform statistics.

```prisma
model platform_analytics {
  id                String    @id @default(cuid())
  date              DateTime  @db.Date @unique

  // User metrics
  total_users       Int       @default(0)
  total_students    Int       @default(0)
  total_faculty     Int       @default(0)
  total_admins      Int       @default(0)
  new_registrations Int       @default(0)

  // Content metrics
  total_courses     Int       @default(0)
  total_modules     Int       @default(0)
  published_courses Int       @default(0)
  published_modules Int       @default(0)

  // Engagement metrics
  total_enrollments Int       @default(0)
  new_enrollments   Int       @default(0)
  active_students   Int       @default(0) // Students who accessed content today
  total_completions Int       @default(0)

  // Activity metrics
  total_logins      Int       @default(0)
  total_page_views  Int       @default(0)
  avg_session_mins  Float     @default(0)

  // Created automatically by daily cron job
  created_at        DateTime  @default(now())

  @@index([date(sort: Desc)])
}
```

### Modified Tables

#### `users` Table Additions

```prisma
model users {
  // ... existing fields (id, email, password_hash, name, role, etc.)

  // Enhanced role system
  role              String    @default("student") // student | faculty | pending_faculty | admin
  is_super_admin    Boolean   @default(false)
  account_status    String    @default("active") // active | suspended | pending_approval | deleted

  // Student-specific fields
  major             String?
  graduation_year   Int?
  academic_interests String[] @default([])

  // Faculty-specific fields (moved from profile to core)
  title             String?   // Professor, Lecturer, Researcher, etc.
  department        String?
  research_area     String?   // Replaces 'speciality' for clarity
  personal_website  String?

  // Existing faculty fields (keep as is)
  about             String?   @db.Text
  university        String?
  avatar_url        String?
  // ... social links

  // New relations
  course_enrollments     course_enrollments[]   @relation("StudentEnrollments")
  module_progress        module_progress[]
  learning_sessions      learning_sessions[]
  faculty_request        faculty_requests?
  reviewed_requests      faculty_requests[]     @relation("ReviewedRequests")
  admin_actions          admin_audit_logs[]     @relation("AdminActions")
  flagged_content        content_flags[]        @relation("FlaggedContent")
  reviewed_flags         content_flags[]        @relation("ReviewedFlags")

  // ... existing relations (courses, modules, etc.)
}
```

#### `courses` Table Additions

```prisma
model courses {
  // ... existing fields

  // Enrollment settings
  max_enrollments   Int?      // null = unlimited
  enrollment_count  Int       @default(0) // Cached count
  is_enrollable     Boolean   @default(true) // Admin can disable

  // New relations
  enrollments       course_enrollments[]

  // ... existing relations
}
```

#### `modules` Table Additions

```prisma
model modules {
  // ... existing fields

  // Progress tracking
  student_progress  module_progress[]

  // ... existing relations
}
```

---

## Implementation Plan

### Timeline: 5 Weeks

#### Week 1: Unified Auth + Admin Foundation
**Goal:** Unified registration, faculty approval workflow, basic admin dashboard

**Database Migrations:**
- Add `role`, `is_super_admin`, `account_status` to `users`
- Add student fields to `users` (major, graduation_year, academic_interests)
- Add faculty fields to `users` (title, department, research_area, personal_website)
- Create `faculty_requests` table
- Create `admin_audit_logs` table

**API Endpoints (5 new):**
1. `POST /api/auth/register` - Modified to accept role parameter
2. `GET /api/admin/faculty-requests` - List pending requests
3. `PUT /api/admin/faculty-requests/[id]` - Approve/decline request
4. `GET /api/admin/audit-logs` - List admin actions
5. `GET /api/admin/stats` - Platform-wide statistics

**Pages (3 new):**
1. `/auth/register` - Modified with role selection
2. `/admin/dashboard` - Basic admin dashboard
3. `/admin/faculty-requests` - Pending approvals list

**Components (8 new):**
1. `UnifiedRegistrationForm` - Role selection + dynamic fields
2. `StudentRegistrationFields` - Student-specific inputs
3. `FacultyRegistrationFields` - Faculty-specific inputs
4. `AdminLayout` - Admin dashboard layout
5. `FacultyRequestCard` - Display pending request
6. `ApprovalModal` - Approve/decline dialog
7. `AuditLogTable` - Display audit logs
8. `AdminStatsCard` - Platform statistics

**Configuration:**
- Add `ADMIN_EMAILS` to environment variables
- Add `SUPER_ADMIN_EMAIL` to environment variables
- Update middleware to protect `/admin/*` routes

**Testing:**
- ✅ Student registration creates `role: 'student'`
- ✅ Faculty registration creates `role: 'pending_faculty'`
- ✅ Admin can approve/decline faculty requests
- ✅ Audit logs created for admin actions
- ✅ Only admins can access `/admin/*` pages

**Deliverable:** Users can register as student or faculty. Faculty requires admin approval. Basic admin dashboard functional.

---

#### Week 2: Student Features Part 1
**Goal:** Student profile pages, student dashboard shell, navigation

**Database Migrations:**
- (None - using Week 1 additions)

**API Endpoints (2 new):**
1. `GET /api/student/profile` - Get student profile with stats
2. `PUT /api/student/profile` - Update student profile

**Pages (3 new):**
1. `/student/dashboard` - Empty state (no enrollments yet)
2. `/student/profile` - View own profile
3. `/student/profile/edit` - Edit profile (major, grad year, interests)

**Components (6 new):**
1. `StudentLayout` - Student dashboard layout
2. `StudentDashboard` - Dashboard container
3. `EmptyEnrollmentsState` - "No courses enrolled" placeholder
4. `StudentProfileCard` - Display student info
5. `StudentProfileEditForm` - Edit student fields
6. `StudentNav` - Student navigation menu

**UI Updates:**
- Header navigation shows student links for `role: 'student'`
- Profile page adapts fields based on role (student vs faculty)

**Testing:**
- ✅ Students can view dashboard (empty state)
- ✅ Students can edit profile (major, grad year, interests)
- ✅ Navigation shows correct links for student role

**Deliverable:** Students have functional dashboard and profile pages (no enrollments yet).

---

#### Week 3: Enrollment System
**Goal:** Students can enroll in courses, see enrolled courses, unenroll

**Database Migrations:**
- Create `course_enrollments` table
- Add `max_enrollments`, `enrollment_count`, `is_enrollable` to `courses`

**API Endpoints (6 new):**
1. `POST /api/enrollments` - Enroll in course
2. `DELETE /api/enrollments/[id]` - Unenroll from course
3. `GET /api/enrollments/check/[courseId]` - Check enrollment status
4. `GET /api/student/enrollments` - List enrolled courses with progress
5. `GET /api/faculty/enrollments/[courseId]` - View enrollments for faculty's course
6. `PUT /api/courses/[id]/enrollment-settings` - Faculty sets max enrollments

**Pages (2 modified):**
1. `/courses/[slug]` - Add "Enroll" button for students
2. `/student/dashboard` - Show enrolled courses with stats

**Components (8 new):**
1. `EnrollButton` - Enroll/unenroll action button
2. `EnrollmentModal` - Confirm enrollment dialog
3. `EnrolledCourseCard` - Course card with progress (0% for now)
4. `EnrolledCoursesList` - List of enrolled courses
5. `UnenrollButton` - Unenroll action
6. `FacultyEnrollmentList` - Faculty view of students in course
7. `EnrollmentStats` - Enrollment count display
8. `EnrollmentCapBadge` - Show "X/Y enrolled" if cap set

**Faculty Dashboard Updates:**
- Replace `students: 0` placeholder with real enrollment count
- Show "Recent Enrollments" section
- Add "View Enrollments" link to each course card

**Testing:**
- ✅ Students can enroll in published courses
- ✅ Students cannot enroll in unpublished courses
- ✅ Students can unenroll from courses
- ✅ Enrolled courses appear on student dashboard
- ✅ Faculty can see enrollment count
- ✅ Enrollment caps work (if set)

**Deliverable:** Students can enroll in courses and see them on dashboard. Faculty see enrollment counts.

---

#### Week 4: Progress Tracking
**Goal:** Track module completion, time spent, learning streaks, progress visualization

**Database Migrations:**
- Create `module_progress` table
- Create `learning_sessions` table

**API Endpoints (8 new):**
1. `POST /api/progress/start-module` - Mark module as started
2. `POST /api/progress/complete-module` - Mark module as completed
3. `PUT /api/progress/update-time` - Update time spent (heartbeat)
4. `GET /api/progress/student/[userId]` - Get student's overall progress
5. `GET /api/progress/course/[courseId]` - Get progress for a course
6. `GET /api/progress/module/[moduleId]` - Get progress for a module
7. `GET /api/student/streaks` - Get learning streak data
8. `GET /api/faculty/analytics/course/[courseId]` - Course analytics for faculty

**Pages (3 new + 1 modified):**
1. `/student/progress` - Overall progress statistics
2. `/student/roadmap` - Network visualization with progress overlay
3. `/student/streaks` - Learning streak calendar
4. `/courses/[slug]/[moduleSlug]` (modified) - Add progress tracking + "Mark Complete" button

**Components (12 new):**
1. `ModuleProgressTracker` - Tracks time and scroll depth
2. `MarkCompleteButton` - Manual completion button
3. `ProgressBar` - Visual progress indicator (0-100%)
4. `CourseProgressCard` - Course with completion percentage
5. `ProgressStats` - Overall stats (modules completed, time spent, streak)
6. `LearningStreakCalendar` - Heatmap calendar (GitHub-style)
7. `StreakBadge` - "🔥 5-day streak" badge
8. `StudentRoadmapVisualization` - Network graph with progress colors
9. `ProgressLegend` - Legend for roadmap (completed, in-progress, not started)
10. `FacultyCourseAnalytics` - Charts for faculty (completion rate, avg time)
11. `ProgressTimeline` - Student's recent activity timeline
12. `CompletionCertificate` - Certificate when course 100% complete (simple version)

**Progress Tracking Logic:**

```typescript
// Auto-tracking (runs every 5 minutes while on module page)
function trackModuleTime() {
  if (isPageVisible && !isIdle) {
    sendHeartbeat({
      module_id,
      time_increment_mins: 5,
      scroll_depth_pct: getCurrentScrollDepth()
    })
  }
}

// Manual completion
function markComplete() {
  updateProgress({
    module_id,
    status: 'completed',
    completed_at: now(),
    manually_marked: true
  })

  // Update course enrollment completion %
  recalculateCourseProgress(course_id)

  // Update learning session for today
  updateLearningSession({
    date: today(),
    modules_completed: +1
  })
}

// Streak calculation
function calculateStreak(sessions: LearningSession[]) {
  let streak = 0
  let currentDate = today()

  for (const session of sessions.sort(byDateDesc)) {
    if (session.date === currentDate) {
      streak++
      currentDate = previousDay(currentDate)
    } else {
      break
    }
  }

  return streak
}
```

**Faculty Analytics:**
- Course completion rate (% of enrolled students who completed)
- Average time per module
- Drop-off points (which modules students abandon)
- Most/least engaging modules

**Testing:**
- ✅ Time tracking works (increments every 5 minutes)
- ✅ "Mark Complete" updates status to completed
- ✅ Progress bars show correct percentage
- ✅ Learning streak increments daily
- ✅ Roadmap visualization shows progress colors
- ✅ Faculty can see course analytics

**Deliverable:** Students can track progress, see completion percentages, view learning streaks. Faculty see detailed analytics.

---

#### Week 5: Admin Dashboard + Polish
**Goal:** Complete admin dashboard with all 15 features, polish UI, testing

**Database Migrations:**
- Create `content_flags` table
- Create `platform_analytics` table

**API Endpoints (10 new):**
1. `GET /api/admin/users` - List/search users
2. `PUT /api/admin/users/[id]/role` - Change user role
3. `PUT /api/admin/users/[id]/suspend` - Suspend account
4. `DELETE /api/admin/users/[id]` - Delete user + cascade
5. `GET /api/admin/content` - List all content (courses, modules)
6. `DELETE /api/admin/content/[type]/[id]` - Delete content
7. `POST /api/admin/content-flags` - Flag content
8. `GET /api/admin/content-flags` - List flagged content
9. `PUT /api/admin/content-flags/[id]` - Resolve flag
10. `GET /api/admin/analytics` - Platform analytics (daily/weekly/monthly)

**Pages (8 new):**
1. `/admin/users` - User management
2. `/admin/users/[id]` - User details + actions
3. `/admin/content` - Content management
4. `/admin/content-flags` - Flagged content review
5. `/admin/analytics` - Platform analytics dashboard
6. `/admin/audit-logs` - Full audit log viewer
7. `/admin/security` - Security monitoring
8. `/admin/settings` - Platform settings

**Components (15 new):**
1. `UserManagementTable` - Searchable user table
2. `UserDetailsCard` - User info + activity
3. `UserActionMenu` - Change role, suspend, delete
4. `ContentManagementTable` - All courses/modules
5. `ContentActionMenu` - Edit, hide, delete
6. `ContentFlagCard` - Display flagged content
7. `FlagResolutionModal` - Resolve flag dialog
8. `PlatformAnalyticsDashboard` - Charts + stats
9. `UserGrowthChart` - Registration trend line chart
10. `EnrollmentTrendChart` - Enrollment over time
11. `AuditLogViewer` - Filterable audit table
12. `SecurityDashboard` - Failed logins, alerts
13. `AdminSettingsForm` - Platform configuration
14. `DeleteUserModal` - Confirm deletion with cascade warning
15. `BulkActionsToolbar` - Bulk approve/email/delete

**Cron Job Setup:**
- Daily aggregation task (calculates `platform_analytics`)
- Runs at midnight UTC
- Aggregates previous day's data
- Implementation: Vercel Cron Job or manual API route

**Admin Features (Full 15):**

1. ✅ Pending Faculty Approvals (Week 1)
2. ✅ User Management (search, filter, role changes, suspend, delete)
3. ✅ Content Management (view all, edit, hide, delete)
4. ✅ Platform Analytics (user stats, content stats, engagement)
5. ✅ Audit Logs (all admin actions, filterable, exportable)
6. ✅ Security Monitoring (failed logins, suspicious activity)
7. ✅ Faculty Analytics (top faculty, course stats)
8. ✅ Student Analytics (active students, popular courses)
9. ✅ Content Flags & Reports (review queue, quick actions)
10. ✅ Email Management (view sent emails, resend failed)
11. ✅ System Health (database size, API latency, errors)
12. ✅ Bulk Operations (bulk approve, bulk email)
13. ✅ Role Management (view admins, promote, demote)
14. ✅ Platform Settings (feature flags, enrollment caps)
15. ✅ Export & Reporting (CSV exports, compliance reports)

**UI Polish:**
- Consistent design across all new pages
- Responsive design (mobile, tablet, desktop)
- Loading states and skeletons
- Error handling and user feedback
- Accessibility (ARIA labels, keyboard navigation)

**Testing:**
- Unit tests for new utilities
- Integration tests for API endpoints
- E2E tests for critical flows:
  - Student registration → enrollment → progress
  - Faculty registration → approval → course creation
  - Admin approval workflow
- Load testing (100 concurrent enrollments)
- Security testing (authorization checks)

**Documentation:**
- Update `TECHNICAL_DOCUMENTATION.md`
- Create `ADMIN_USER_GUIDE.md`
- Update `FACULTY_USER_GUIDE.md` (enrollment analytics)
- Create `STUDENT_USER_GUIDE.md`

**Deliverable:** Complete admin dashboard with all 15 features. Polished UI. Comprehensive testing. Ready for production deployment.

---

### Post-Launch (Week 6+)

**Monitoring Period:**
- Week 6: Monitor for bugs, performance issues
- Gather user feedback (students, faculty, admin)
- Fix critical issues
- Plan enhancements based on feedback

**Future Enhancements (Not in Initial 5 Weeks):**
- Email notifications (enrollment confirmation, progress reminders)
- Certificates for course completion (PDF generation)
- Leaderboards (top students, gamification)
- Discussion forums (student interaction)
- Mobile app (React Native)
- AI-powered course recommendations
- Plagiarism detection (for assignments)
- Video lectures integration
- Real-time chat (student-faculty)

---

## Security & Privacy

### Authentication Security

**Password Requirements:**
- Minimum 8 characters, maximum 128
- Must contain: uppercase, lowercase, number, special character
- Hashed with bcrypt (10 rounds)
- Never stored in plain text

**Session Security:**
- JWT tokens with 30-day expiry
- HTTP-only cookies (prevents XSS)
- Secure flag in production (HTTPS only)
- CSRF protection via NextAuth

**Email Verification:**
- Required before login
- Token expires after 24 hours
- One token per email (invalidates previous)

**Password Reset:**
- Token expires after 1 hour
- One-time use (invalidates after reset)
- Email confirmation required

### Authorization

**Role-Based Access Control (RBAC):**

```typescript
// Middleware protection
export function middleware(req: NextRequest) {
  const session = await auth()

  // Admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (session?.user?.role !== 'admin') {
      return redirectToLogin()
    }
  }

  // Faculty routes
  if (req.nextUrl.pathname.startsWith('/faculty')) {
    if (session?.user?.role !== 'faculty' && session?.user?.role !== 'admin') {
      return redirectToLogin()
    }
  }

  // Student routes
  if (req.nextUrl.pathname.startsWith('/student')) {
    if (!['student', 'faculty', 'admin'].includes(session?.user?.role)) {
      return redirectToLogin()
    }
  }
}
```

**API Route Protection:**

```typescript
// Example: Enrollment endpoint
export async function POST(req: Request) {
  const session = await auth()

  // Must be logged in
  if (!session?.user) {
    return unauthorized()
  }

  // Only students, faculty, admins can enroll
  if (!['student', 'faculty', 'admin'].includes(session.user.role)) {
    return forbidden('Only students can enroll')
  }

  // Can only enroll yourself (unless admin)
  const { courseId } = await req.json()
  if (session.user.role !== 'admin' && userId !== session.user.id) {
    return forbidden('Cannot enroll other users')
  }

  // ... enrollment logic
}
```

### Data Privacy

**Student Progress Visibility:**

| Viewer | Can See |
|--------|---------|
| Student (self) | Own progress for all courses |
| Faculty (course creator) | Aggregate stats (avg completion, time), NOT individual student names unless student opts in |
| Admin | All progress data (for moderation) |
| Other students | Nothing (progress is private by default) |

**FERPA Compliance (Family Educational Rights and Privacy Act):**
- Student progress is educational record
- Cannot share with third parties without consent
- Students can export their own data
- Admin can delete student data on request

**GDPR Compliance (if applicable):**
- Right to access: Students can export all their data
- Right to deletion: Admin can delete user + all data
- Data minimization: Only collect necessary fields
- Consent: Terms of service during registration

**Data Deletion Cascade:**

```prisma
// When admin deletes a user
DELETE FROM users WHERE id = 'user123'
  ↓ Cascade deletes:
  - course_enrollments (all enrollments)
  - module_progress (all progress records)
  - learning_sessions (all session data)
  - faculty_requests (if pending)
  - admin_audit_logs where admin_id = user (if admin)
  - content_flags where flagged_by = user
  - courses where author_id = user (optional: transfer to admin)
  - modules where author_id = user (optional: transfer to admin)
```

### Content Moderation

**Content Flagging System:**

```typescript
// Any logged-in user can flag content
POST /api/content-flags
{
  content_type: 'course' | 'module',
  content_id: 'course123',
  reason: 'inappropriate' | 'error' | 'spam' | 'other',
  description: 'This course contains...'
}
  ↓
Creates content_flag record
  ↓
Admin receives notification
  ↓
Admin reviews in /admin/content-flags
  ↓
Admin actions:
  - Remove content (delete)
  - Edit content (fix errors)
  - Dismiss flag (no action needed)
  ↓
Audit log created
```

**Auto-Flagging (Future Enhancement):**
- Excessive media size (>100MB per module)
- Duplicate content detection
- Profanity filter (basic keyword matching)
- Suspicious patterns (100 modules created in 1 hour)

### Admin Audit Trail

**All admin actions logged:**

```typescript
// Example: Admin deletes user
admin_audit_logs.create({
  admin_id: currentAdmin.id,
  action: 'deleted_user',
  target_type: 'user',
  target_id: deletedUserId,
  reason: 'Spam account',
  details: {
    user_email: deletedUser.email,
    user_role: deletedUser.role,
    cascade_deleted: {
      courses: 5,
      modules: 23,
      enrollments: 150
    }
  },
  ip_address: req.ip,
  user_agent: req.headers['user-agent']
})
```

**Audit log export (CSV):**
- Admin can export all logs for compliance
- Filtered by date range, action type, admin
- Includes all metadata (IP, user agent, details)

### Security Monitoring

**Failed Login Tracking:**

```typescript
// After 5 failed attempts in 30 minutes
if (failedAttempts >= 5) {
  // Lock account for 30 minutes
  users.update({
    account_status: 'locked',
    locked_until: now() + 30 minutes
  })

  // Send email to user
  sendEmail({
    to: user.email,
    subject: 'Account locked due to failed login attempts',
    body: 'Your account has been locked...'
  })

  // Alert admin
  if (failedAttempts >= 10) {
    sendAdminAlert('Suspicious login activity: 10+ failed attempts')
  }
}
```

**Suspicious Activity Alerts:**
- 10+ failed logins from same IP
- 10+ account creations from same IP in 1 hour
- Admin account login from new IP (optional: require 2FA)
- Content creation rate spike (100+ modules in 1 hour)

---

## Testing Strategy

### Unit Tests

**Coverage Target: 80%+**

**Key Areas:**
1. **Auth utilities** (`/src/lib/auth/utils.ts`)
   - Password validation
   - Email validation
   - Role checking

2. **Progress calculation** (`/src/lib/progress/calculator.ts`)
   - Course completion percentage
   - Streak calculation
   - Time aggregation

3. **Admin actions** (`/src/lib/admin/actions.ts`)
   - User deletion cascade
   - Role changes
   - Approval workflow

**Example Test:**

```typescript
describe('Progress Calculator', () => {
  it('calculates course completion percentage', () => {
    const modules = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'in_progress' },
      { status: 'not_started' }
    ]

    expect(calculateCourseProgress(modules)).toBe(50) // 2/4 = 50%
  })

  it('calculates learning streak', () => {
    const sessions = [
      { date: '2025-01-15' },
      { date: '2025-01-14' },
      { date: '2025-01-13' },
      { date: '2025-01-11' } // Gap
    ]

    expect(calculateStreak(sessions, '2025-01-15')).toBe(3)
  })
})
```

### Integration Tests

**API Route Testing:**

```typescript
describe('POST /api/enrollments', () => {
  it('allows students to enroll in published courses', async () => {
    const student = await createTestUser({ role: 'student' })
    const course = await createTestCourse({ status: 'published' })

    const response = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student.token}` },
      body: JSON.stringify({ courseId: course.id })
    })

    expect(response.status).toBe(201)
    expect(response.json()).toMatchObject({
      enrollmentId: expect.any(String),
      courseId: course.id,
      studentId: student.id
    })
  })

  it('prevents enrollment in unpublished courses', async () => {
    const student = await createTestUser({ role: 'student' })
    const course = await createTestCourse({ status: 'draft' })

    const response = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student.token}` },
      body: JSON.stringify({ courseId: course.id })
    })

    expect(response.status).toBe(403)
  })
})
```

### End-to-End Tests (Playwright)

**Critical User Flows:**

1. **Student Registration → Enrollment → Progress**

```typescript
test('student can register, enroll, and track progress', async ({ page }) => {
  // Register as student
  await page.goto('/auth/register')
  await page.click('input[value="student"]')
  await page.fill('input[name="name"]', 'Test Student')
  await page.fill('input[name="email"]', 'student@test.com')
  await page.fill('input[name="password"]', 'Test1234!')
  await page.fill('input[name="major"]', 'Computer Science')
  await page.selectOption('select[name="graduation_year"]', '2027')
  await page.click('button[type="submit"]')

  // Verify email (simulate)
  await verifyEmailViaAPI('student@test.com')

  // Login
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', 'student@test.com')
  await page.fill('input[name="password"]', 'Test1234!')
  await page.click('button[type="submit"]')

  // Should redirect to student dashboard
  await expect(page).toHaveURL('/student/dashboard')

  // Enroll in course
  await page.goto('/courses/neuroscience-101')
  await page.click('button:has-text("Enroll in Course")')
  await page.click('button:has-text("Confirm")')

  // Verify enrollment
  await expect(page.locator('text=You are enrolled')).toBeVisible()

  // View module
  await page.click('a:has-text("Module 1")')

  // Mark complete
  await page.click('button:has-text("Mark as Complete")')

  // Verify progress
  await page.goto('/student/dashboard')
  await expect(page.locator('text=Neuroscience 101')).toBeVisible()
  await expect(page.locator('text=8%')).toBeVisible() // 1/12 modules
})
```

2. **Faculty Registration → Approval → Course Creation**

```typescript
test('faculty request approval workflow', async ({ page, adminPage }) => {
  // Register as faculty
  await page.goto('/auth/register')
  await page.click('input[value="faculty"]')
  // ... fill form
  await page.click('button[type="submit"]')

  // Should see pending message
  await expect(page.locator('text=Your request is pending')).toBeVisible()

  // Admin logs in
  await adminPage.goto('/auth/login')
  // ... login as admin

  // Go to pending requests
  await adminPage.goto('/admin/faculty-requests')

  // Approve request
  await adminPage.click('button:has-text("Approve")')
  await adminPage.fill('textarea[name="admin_note"]', 'Verified credentials')
  await adminPage.click('button:has-text("Confirm Approval")')

  // Faculty should receive email (check via mock)
  // Faculty can now login
  await page.goto('/auth/login')
  // ... login

  // Should have access to faculty dashboard
  await expect(page).toHaveURL('/faculty/dashboard')
  await expect(page.locator('button:has-text("Create Course")')).toBeVisible()
})
```

3. **Admin Deletes User + Content Cascade**

```typescript
test('admin can delete user with cascade', async ({ page }) => {
  // Setup: Create user with content
  const faculty = await createTestUser({ role: 'faculty' })
  const course = await createTestCourse({ authorId: faculty.id })
  await createTestEnrollments(course.id, 10) // 10 students enrolled

  // Admin login
  await page.goto('/auth/login')
  // ... login as admin

  // Go to user management
  await page.goto('/admin/users')
  await page.fill('input[placeholder="Search users"]', faculty.email)
  await page.click(`tr:has-text("${faculty.email}") button:has-text("Delete")`)

  // Confirm deletion with cascade warning
  await expect(page.locator('text=This will delete:')).toBeVisible()
  await expect(page.locator('text=1 course')).toBeVisible()
  await expect(page.locator('text=10 enrollments')).toBeVisible()

  await page.fill('textarea[name="reason"]', 'Spam account')
  await page.click('button:has-text("Confirm Delete")')

  // Verify deletion
  await expect(page.locator('text=User deleted successfully')).toBeVisible()

  // Verify cascade (via database)
  const userExists = await prisma.users.findUnique({ where: { id: faculty.id }})
  expect(userExists).toBeNull()

  const courseExists = await prisma.courses.findUnique({ where: { id: course.id }})
  expect(courseExists).toBeNull()

  // Verify audit log
  const auditLog = await prisma.admin_audit_logs.findFirst({
    where: { action: 'deleted_user', target_id: faculty.id }
  })
  expect(auditLog).toBeTruthy()
  expect(auditLog.reason).toBe('Spam account')
})
```

### Load Testing

**Scenario: 100 Concurrent Enrollments**

```typescript
import { check } from 'k6'
import http from 'k6/http'

export const options = {
  vus: 100, // 100 virtual users
  duration: '30s'
}

export default function () {
  const payload = JSON.stringify({
    courseId: 'test-course-id'
  })

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TEST_TOKEN}`
    }
  }

  const response = http.post('https://bcs-web.vercel.app/api/enrollments', payload, params)

  check(response, {
    'status is 201 or 409': (r) => r.status === 201 || r.status === 409, // 409 = already enrolled
    'response time < 500ms': (r) => r.timings.duration < 500
  })
}
```

**Expected Results:**
- ✅ 95%+ requests succeed (201 or 409)
- ✅ Average response time < 300ms
- ✅ No database deadlocks
- ✅ No duplicate enrollments (unique constraint prevents)

### Security Testing

**Authorization Bypass Attempts:**

```typescript
describe('Security: Authorization', () => {
  it('prevents students from accessing admin routes', async () => {
    const student = await createTestUser({ role: 'student' })

    const response = await fetch('/admin/users', {
      headers: { Authorization: `Bearer ${student.token}` }
    })

    expect(response.status).toBe(403)
  })

  it('prevents faculty from approving other faculty requests', async () => {
    const faculty = await createTestUser({ role: 'faculty' })
    const pendingRequest = await createFacultyRequest()

    const response = await fetch(`/api/admin/faculty-requests/${pendingRequest.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${faculty.token}` },
      body: JSON.stringify({ action: 'approve' })
    })

    expect(response.status).toBe(403)
  })

  it('prevents users from viewing other users progress', async () => {
    const student1 = await createTestUser({ role: 'student' })
    const student2 = await createTestUser({ role: 'student' })

    const response = await fetch(`/api/progress/student/${student2.id}`, {
      headers: { Authorization: `Bearer ${student1.token}` }
    })

    expect(response.status).toBe(403)
  })
})
```

**SQL Injection Prevention:**

```typescript
// Prisma ORM prevents SQL injection by default (parameterized queries)
// But test edge cases

describe('Security: SQL Injection', () => {
  it('handles malicious input in search', async () => {
    const admin = await createTestUser({ role: 'admin' })

    const response = await fetch('/api/admin/users?search=\'; DROP TABLE users; --', {
      headers: { Authorization: `Bearer ${admin.token}` }
    })

    expect(response.status).toBe(200) // Should not crash

    // Verify tables still exist
    const userCount = await prisma.users.count()
    expect(userCount).toBeGreaterThan(0)
  })
})
```

---

## Success Metrics

### Short-Term (1 Month After Launch)

**User Adoption:**
- 50+ student registrations
- 10+ faculty registrations
- 5+ faculty approved and creating content
- 100+ course enrollments
- 30%+ average course progress per student
- 20+ daily active students

**Platform Health:**
- API response time < 300ms average
- 99%+ uptime
- 0 critical security issues
- < 5% error rate on key endpoints

**Engagement:**
- 60%+ of registered students enroll in at least 1 course
- 40%+ of enrolled students complete at least 1 module
- 20+ minutes average session time
- 3+ day average learning streak

### Medium-Term (3 Months After Launch)

**User Growth:**
- 200+ student registrations
- 30+ faculty members
- 20+ published courses
- 500+ course enrollments
- 1,000+ module completions

**Engagement:**
- 70%+ weekly active students (of enrolled)
- 40%+ course completion rate (industry average: 15%)
- 25+ minutes average session time
- 5+ day average learning streak
- 10+ faculty actively creating content

**Quality:**
- < 1% content flags per 100 modules
- 4.0+/5.0 average course rating (future feature)
- < 2% user account suspensions/deletions
- 95%+ faculty approval rate (few spam requests)

### Long-Term (6 Months After Launch)

**Scale:**
- 500+ students
- 50+ faculty members
- 50+ courses
- 1,000+ enrollments
- 5,000+ module completions

**Retention:**
- 60%+ monthly active students
- 50%+ course completion rate
- 80%+ student retention (return after 1 month)

**Platform Maturity:**
- 0 critical bugs
- < 1% support requests per 100 users
- Full FERPA/GDPR compliance
- Automated analytics reporting
- Mobile-responsive (100% features accessible on mobile)

### Admin Metrics (Continuous)

**Moderation Efficiency:**
- Faculty approval time < 24 hours average
- Content flag resolution time < 48 hours average
- 100% of admin actions audited

**Security:**
- 0 successful unauthorized access attempts
- < 0.1% failed login rate (normal activity)
- 100% of suspicious activity investigated

---

## Appendices

### Appendix A: Registration Form Fields

#### Student Registration Form

```typescript
{
  // Account credentials (required)
  role: 'student',
  name: string,           // Full name
  email: string,          // Email address
  password: string,       // 8-128 chars, complexity requirements

  // Student-specific (required)
  major: string,          // Dropdown: 50+ majors
  graduation_year: number, // Dropdown: current year to current + 10

  // Optional
  academic_interests: string[] // Multi-select tags: AI, Neuroscience, etc.
}
```

**Major Options (50+ majors):**
- Computer Science
- Brain and Cognitive Science
- Psychology
- Neuroscience
- Biology
- Chemistry
- Physics
- Mathematics
- Engineering (various specializations)
- [Full list in `/src/constants/majors.ts`]

**Academic Interests Tags:**
- Artificial Intelligence
- Machine Learning
- Neuroscience
- Cognitive Science
- Computational Biology
- Psychology
- Education
- [Full list in `/src/constants/interests.ts`]

#### Faculty Registration Form

```typescript
{
  // Account credentials (required)
  role: 'faculty',
  name: string,
  email: string,
  password: string,

  // Faculty-specific (required)
  university: string,     // Free text
  department: string,     // Free text
  title: string,          // Dropdown: Professor, Lecturer, etc.
  research_area: string,  // Free text (speciality)

  // Optional
  personal_website: string, // URL validation

  // Approval context (required)
  request_statement: string // Textarea, min 50 chars
}
```

**Title Options:**
- Professor
- Associate Professor
- Assistant Professor
- Lecturer
- Senior Lecturer
- Researcher
- Post-Doctoral Researcher
- Graduate Teaching Assistant
- Adjunct Professor

**Request Statement Prompt:**
"Please tell us why you need faculty access to the BCS E-Textbook Platform. Include information about your teaching responsibilities, the courses you plan to create, and how this platform will benefit your students. (Minimum 50 characters)"

### Appendix B: API Endpoints Summary

#### Authentication Endpoints (5)

1. `POST /api/auth/register` - Register new user (student or faculty)
2. `POST /api/auth/login` - NextAuth handles (via NextAuth config)
3. `POST /api/auth/verify-email` - Verify email address
4. `POST /api/auth/forgot-password` - Request password reset
5. `POST /api/auth/reset-password` - Complete password reset

#### Student Endpoints (10)

6. `GET /api/student/profile` - Get student profile + stats
7. `PUT /api/student/profile` - Update student profile
8. `GET /api/student/enrollments` - List enrolled courses
9. `GET /api/student/progress` - Overall progress stats
10. `GET /api/student/streaks` - Learning streak data
11. `POST /api/enrollments` - Enroll in course
12. `DELETE /api/enrollments/[id]` - Unenroll from course
13. `GET /api/enrollments/check/[courseId]` - Check enrollment status
14. `POST /api/progress/start-module` - Mark module started
15. `POST /api/progress/complete-module` - Mark module completed

#### Faculty Endpoints (5 new + existing)

16. `GET /api/faculty/enrollments/[courseId]` - View course enrollments
17. `GET /api/faculty/analytics/course/[courseId]` - Course analytics
18. `PUT /api/courses/[id]/enrollment-settings` - Set enrollment cap
19. (Existing) `GET /api/dashboard/stats` - Modified to include real enrollment data
20. (Existing) `POST /api/courses`, `GET /api/courses`, etc. - Course CRUD

#### Admin Endpoints (15 new)

21. `GET /api/admin/faculty-requests` - List pending faculty requests
22. `PUT /api/admin/faculty-requests/[id]` - Approve/decline request
23. `GET /api/admin/users` - List/search users
24. `GET /api/admin/users/[id]` - Get user details
25. `PUT /api/admin/users/[id]/role` - Change user role
26. `PUT /api/admin/users/[id]/suspend` - Suspend account
27. `DELETE /api/admin/users/[id]` - Delete user (cascade)
28. `GET /api/admin/content` - List all content
29. `DELETE /api/admin/content/[type]/[id]` - Delete content
30. `GET /api/admin/content-flags` - List flagged content
31. `POST /api/admin/content-flags` - Flag content
32. `PUT /api/admin/content-flags/[id]` - Resolve flag
33. `GET /api/admin/analytics` - Platform analytics
34. `GET /api/admin/audit-logs` - List audit logs
35. `GET /api/admin/stats` - Platform-wide stats

#### Progress Tracking Endpoints (3)

36. `PUT /api/progress/update-time` - Update time spent (heartbeat)
37. `GET /api/progress/student/[userId]` - Get student progress
38. `GET /api/progress/course/[courseId]` - Get course progress

**Total:** 38 API endpoints (15 existing, 23 new)

### Appendix C: File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── register/route.ts                  [MODIFIED]
│   │   ├── enrollments/
│   │   │   ├── route.ts                           [NEW]
│   │   │   └── [id]/route.ts                      [NEW]
│   │   ├── progress/
│   │   │   ├── start-module/route.ts              [NEW]
│   │   │   ├── complete-module/route.ts           [NEW]
│   │   │   ├── update-time/route.ts               [NEW]
│   │   │   └── student/[userId]/route.ts          [NEW]
│   │   ├── student/
│   │   │   ├── profile/route.ts                   [NEW]
│   │   │   ├── enrollments/route.ts               [NEW]
│   │   │   ├── progress/route.ts                  [NEW]
│   │   │   └── streaks/route.ts                   [NEW]
│   │   ├── faculty/
│   │   │   ├── enrollments/[courseId]/route.ts    [NEW]
│   │   │   └── analytics/course/[courseId]/route.ts [NEW]
│   │   └── admin/
│   │       ├── faculty-requests/
│   │       │   ├── route.ts                       [NEW]
│   │       │   └── [id]/route.ts                  [NEW]
│   │       ├── users/
│   │       │   ├── route.ts                       [NEW]
│   │       │   └── [id]/
│   │       │       ├── route.ts                   [NEW]
│   │       │       ├── role/route.ts              [NEW]
│   │       │       └── suspend/route.ts           [NEW]
│   │       ├── content/
│   │       │   ├── route.ts                       [NEW]
│   │       │   └── [type]/[id]/route.ts           [NEW]
│   │       ├── content-flags/
│   │       │   ├── route.ts                       [NEW]
│   │       │   └── [id]/route.ts                  [NEW]
│   │       ├── analytics/route.ts                 [NEW]
│   │       ├── audit-logs/route.ts                [NEW]
│   │       └── stats/route.ts                     [NEW]
│   │
│   ├── auth/
│   │   └── register/page.tsx                      [MODIFIED]
│   │
│   ├── student/
│   │   ├── dashboard/page.tsx                     [NEW]
│   │   ├── profile/
│   │   │   ├── page.tsx                           [NEW]
│   │   │   └── edit/page.tsx                      [NEW]
│   │   ├── progress/page.tsx                      [NEW]
│   │   ├── roadmap/page.tsx                       [NEW]
│   │   └── streaks/page.tsx                       [NEW]
│   │
│   ├── admin/
│   │   ├── dashboard/page.tsx                     [NEW]
│   │   ├── faculty-requests/page.tsx              [NEW]
│   │   ├── users/
│   │   │   ├── page.tsx                           [NEW]
│   │   │   └── [id]/page.tsx                      [NEW]
│   │   ├── content/page.tsx                       [NEW]
│   │   ├── content-flags/page.tsx                 [NEW]
│   │   ├── analytics/page.tsx                     [NEW]
│   │   ├── audit-logs/page.tsx                    [NEW]
│   │   ├── security/page.tsx                      [NEW]
│   │   └── settings/page.tsx                      [NEW]
│   │
│   └── courses/[slug]/
│       ├── page.tsx                               [MODIFIED - Add enroll button]
│       └── [moduleSlug]/page.tsx                  [MODIFIED - Add progress tracking]
│
├── components/
│   ├── auth/
│   │   ├── register-form.tsx                      [MODIFIED]
│   │   ├── unified-registration-form.tsx          [NEW]
│   │   ├── student-registration-fields.tsx        [NEW]
│   │   └── faculty-registration-fields.tsx        [NEW]
│   │
│   ├── student/
│   │   ├── student-layout.tsx                     [NEW]
│   │   ├── student-dashboard.tsx                  [NEW]
│   │   ├── enrolled-course-card.tsx               [NEW]
│   │   ├── empty-enrollments-state.tsx            [NEW]
│   │   ├── progress-bar.tsx                       [NEW]
│   │   ├── progress-stats.tsx                     [NEW]
│   │   ├── learning-streak-calendar.tsx           [NEW]
│   │   ├── streak-badge.tsx                       [NEW]
│   │   ├── roadmap-visualization.tsx              [NEW]
│   │   ├── progress-legend.tsx                    [NEW]
│   │   ├── module-progress-tracker.tsx            [NEW]
│   │   ├── mark-complete-button.tsx               [NEW]
│   │   └── completion-certificate.tsx             [NEW]
│   │
│   ├── admin/
│   │   ├── admin-layout.tsx                       [NEW]
│   │   ├── admin-stats-card.tsx                   [NEW]
│   │   ├── faculty-request-card.tsx               [NEW]
│   │   ├── approval-modal.tsx                     [NEW]
│   │   ├── user-management-table.tsx              [NEW]
│   │   ├── user-details-card.tsx                  [NEW]
│   │   ├── user-action-menu.tsx                   [NEW]
│   │   ├── delete-user-modal.tsx                  [NEW]
│   │   ├── content-management-table.tsx           [NEW]
│   │   ├── content-action-menu.tsx                [NEW]
│   │   ├── content-flag-card.tsx                  [NEW]
│   │   ├── flag-resolution-modal.tsx              [NEW]
│   │   ├── platform-analytics-dashboard.tsx       [NEW]
│   │   ├── user-growth-chart.tsx                  [NEW]
│   │   ├── enrollment-trend-chart.tsx             [NEW]
│   │   ├── audit-log-table.tsx                    [NEW]
│   │   ├── audit-log-viewer.tsx                   [NEW]
│   │   ├── security-dashboard.tsx                 [NEW]
│   │   ├── admin-settings-form.tsx                [NEW]
│   │   └── bulk-actions-toolbar.tsx               [NEW]
│   │
│   ├── enrollment/
│   │   ├── enrollment-button.tsx                  [NEW]
│   │   ├── enrollment-modal.tsx                   [NEW]
│   │   ├── unenroll-button.tsx                    [NEW]
│   │   ├── enrollment-stats.tsx                   [NEW]
│   │   └── enrollment-cap-badge.tsx               [NEW]
│   │
│   └── faculty/
│       ├── enrollment-list.tsx                    [NEW]
│       ├── course-analytics.tsx                   [NEW]
│       └── dashboard.tsx                          [MODIFIED - Add enrollment data]
│
├── lib/
│   ├── auth/
│   │   ├── config.ts                              [MODIFIED - Add admin role check]
│   │   └── utils.ts                               [NEW - Role helpers]
│   │
│   ├── admin/
│   │   ├── actions.ts                             [NEW - Admin action helpers]
│   │   └── audit.ts                               [NEW - Audit logging]
│   │
│   ├── progress/
│   │   ├── calculator.ts                          [NEW - Progress calculations]
│   │   ├── tracker.ts                             [NEW - Time tracking]
│   │   └── streaks.ts                             [NEW - Streak calculations]
│   │
│   └── constants/
│       ├── majors.ts                              [NEW - List of majors]
│       ├── interests.ts                           [NEW - Academic interests]
│       └── faculty-titles.ts                      [NEW - Faculty titles]
│
├── types/
│   ├── auth.ts                                    [MODIFIED - Add student/faculty fields]
│   ├── enrollment.ts                              [NEW]
│   ├── progress.ts                                [NEW]
│   └── admin.ts                                   [NEW]
│
├── middleware.ts                                  [MODIFIED - Add admin route protection]
│
└── prisma/
    ├── schema.prisma                              [MODIFIED - Add 7 tables, modify users/courses/modules]
    └── migrations/
        └── [timestamp]_unified_auth_student_admin/
            └── migration.sql                      [NEW]
```

**Summary:**
- **New Files:** 85
- **Modified Files:** 12
- **Total Changed:** 97 files

### Appendix D: Environment Variables

#### Required Environment Variables

**Development (.env.local):**
```env
# Database (session pooler for local dev)
DATABASE_URL="postgresql://postgres.[PROJECT]:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-dev-secret-key-change-this"

# Email (console mode for dev)
EMAIL_PROVIDER="console"
EMAIL_FROM_NAME="BCS E-Textbook (LOCAL)"

# Admin Setup
ADMIN_EMAILS="dev@example.com"
SUPER_ADMIN_EMAIL="dev@example.com"

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_RICH_TEXT_EDITOR=true
NEXT_PUBLIC_ENABLE_GRAPH_VISUALIZATION=true
NEXT_PUBLIC_ENABLE_PROGRESS_TRACKING=true
```

**Production (.env.production):**
```env
# Database (transaction pooler for serverless)
DATABASE_URL="postgresql://postgres.[PROJECT]:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# NextAuth
NEXTAUTH_URL="https://brainandcognitivescience.org"
NEXTAUTH_SECRET="[GENERATE 32-CHAR RANDOM STRING]"

# Email (Resend for production)
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_[YOUR_PRODUCTION_API_KEY]"
EMAIL_FROM="noreply@brainandcognitivescience.org"
EMAIL_FROM_NAME="BCS E-Textbook"

# Admin Setup
ADMIN_EMAILS="admin@illinois.edu,backup@illinois.edu"
SUPER_ADMIN_EMAIL="admin@illinois.edu"

# Feature Flags
NEXT_PUBLIC_ENABLE_RICH_TEXT_EDITOR=true
NEXT_PUBLIC_ENABLE_GRAPH_VISUALIZATION=true
NEXT_PUBLIC_ENABLE_PROGRESS_TRACKING=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

#### Generating Secrets

**NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
# Example output: dGhpc0lzQVJhbmRvbVN0cmluZ0ZvclRlc3Rpbmc=
```

**Password Hash (for initial admin):**
```bash
npm run hash-password "YourSecurePassword123!"
# Creates bcrypt hash for manual database insert if needed
```

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-10 | Original Team | Initial STUDENT_SYSTEM_PROPOSAL.md |
| 2.0 | 2025-01-15 | Enhanced Team | Added unified auth + admin system. Complete redesign. |

---

**Document Status:** ✅ Approved for Implementation
**Next Steps:** Begin Week 1 implementation (Unified Auth + Admin Foundation)
**Contact:** Development Team

---

**End of Document**
