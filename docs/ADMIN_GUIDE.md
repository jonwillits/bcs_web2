# Admin Guide

This guide covers all administrative features on the BCS E-Learning Platform — user management, faculty approvals, content moderation, analytics, and audit logs.

### Admin Roles

| Role | Description |
|------|-------------|
| **Admin** | Full platform management: user administration, faculty approvals, content moderation, audit logs. Admins also have all faculty capabilities (course/module creation, grade sync, Canvas integration). |
| **Super Admin** | All admin capabilities plus the ability to manage other admin accounts (promote, modify, or delete admins). Only one super admin exists per platform. |

---

## Table of Contents

1. [Admin Dashboard](#1-admin-dashboard)
2. [User Management](#2-user-management)
3. [Faculty Request Review](#3-faculty-request-review)
4. [Content Moderation](#4-content-moderation)
5. [Platform Analytics](#5-platform-analytics)
6. [Audit Logs](#6-audit-logs)
7. [Quick Reference](#7-quick-reference)

---

## 1. Admin Dashboard

Navigate to `/admin/dashboard` for a bird's-eye view of the platform:

- **Statistics Cards** — Six cards showing Total Users, Students, Faculty, Pending Requests, Total Courses, and Total Modules
- **Pending Faculty Requests** — Up to 5 pending requests, each showing the requester's name, email, request date, and a Review button. A "View All" link leads to the full requests page.
- **Recent Registrations** — The last 5 users to join, each showing their name, email, role badge, and registration date

---

## 2. User Management

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

> **Super Admin restrictions:** Only the super admin can modify, promote, or delete other admin accounts. Regular admins can manage students, faculty, and pending faculty but cannot change another admin's role, status, or delete their account. Admins also cannot modify their own account through this interface.

---

## 3. Faculty Request Review

Navigate to `/admin/faculty-requests` to review pending faculty registration requests. Each request card shows:

- Requester's name, email, and email verification status
- Request date
- Expandable details: university, department, title/position, research area, personal website, and the applicant's statement

Admin actions for each request:

- **Approve** — Opens a confirmation dialog explaining the action. Grants the user full faculty access.
- **Decline** — Opens a dialog requiring a decline reason (sent to the applicant).
- An optional admin note field is available for internal record-keeping.

All approval and decline actions are recorded in the audit log.

---

## 4. Content Moderation

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

---

## 5. Platform Analytics

Navigate to `/admin/analytics` for platform-wide metrics:

- **User Analytics** — Total users with breakdown by role (pie chart), active users, suspended users, unverified users
- **Content Analytics** — Total courses and modules with published/draft breakdowns
- **Enrollment Analytics** — Total enrollments, active/completed counts, and completion rate percentage
- **Trends** — User growth over time (line chart)
- **Recent Activity** — Latest user registrations, course creations, and enrollments

---

## 6. Audit Logs

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

## 7. Quick Reference

### Page Directory

| Page | URL | Access |
|------|-----|--------|
| Homepage | `/` | Public |
| Course Catalog | `/courses` | Public |
| Course Viewer | `/courses/[slug]` | Public |
| Module in Course | `/courses/[slug]/[moduleSlug]` | Public |
| Course Map | `/courses/[slug]/map` | Public |
| Module Library | `/modules` | Public |
| Module Viewer | `/modules/[slug]` | Public |
| Playground Gallery | `/playgrounds` | Public |
| Playground Viewer | `/playgrounds/[id]` | Public |
| Playground Builder | `/playgrounds/builder` | Faculty |
| TensorFlow Playground | `/playgrounds/tensorflow` | Public |
| Learning Paths | `/paths` | Public |
| Learning Path Detail | `/paths/[slug]` | Public |
| Network Visualization | `/network` | Public |
| Program Map | `/program/map` | Public |
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
| Program Map Editor | `/faculty/program/edit` | Faculty |
| Course Map Editor | `/faculty/course-map` | Faculty |
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
