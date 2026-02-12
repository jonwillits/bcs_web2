# BCS E-Textbook Platform

**Interactive Brain & Cognitive Sciences Learning Platform**

A modern e-textbook platform for Brain and Cognitive Sciences education. Built with Next.js 15, React 19, and PostgreSQL.

**Production**: [brainandcognitivescience.com](https://www.brainandcognitivescience.com/)
**Development**: [bcs-web2.vercel.app](https://bcs-web2.vercel.app/)

---

## Features

### For Faculty
- **Rich Content Creation** - Tiptap rich text editor with multimedia support
- **Modular Course Design** - Build courses from reusable, hierarchical learning modules
- **Course Structure Visualization** - React Flow graph editor for course relationships
- **Interactive Playgrounds** - Build React-based interactive simulations with Sandpack
- **Collaboration** - Co-author courses and modules with other faculty, with activity feed
- **Analytics** - Course enrollment, progress, and engagement statistics
- **Curriculum Map Editor** - Visual course prerequisite and relationship mapping
- **Quest Map Editor** - Gamified learning path design with XP, difficulty levels, and prerequisites
- **Learning Path Curation** - Create multi-course learning sequences

### For Students
- **Course Enrollment & Progress** - Track progress through courses and modules
- **Gamification** - Earn XP, unlock achievements, maintain streaks, and level up
- **Interactive Playgrounds** - Explore featured simulations and fork them
- **TensorFlow Playground** - Train neural networks with real-time visualization
- **Learning Dashboard** - View enrolled courses, recent activity, and progress
- **Course Map** - Visual overview of module prerequisites and learning paths
- **Full-Text Search** - Search across courses, modules, and playgrounds

### For Admins
- **User Management** - View, edit, suspend, and manage all user accounts
- **Faculty Approval** - Review and approve/decline faculty upgrade requests
- **Content Moderation** - Moderate courses and modules across the platform
- **Audit Logs** - Track all administrative actions
- **Platform Analytics** - Usage statistics and engagement metrics

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5 (App Router) + React 19.1
- **Styling**: Tailwind CSS 3.4 + Custom Neural Design System
- **Components**: Radix UI + shadcn/ui
- **Rich Text**: Tiptap Editor
- **Visualizations**: React Flow (graphs), Recharts (charts)
- **Playgrounds**: Sandpack (in-browser React/JS bundler)
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query (React Query)

### Backend
- **API**: Next.js API Routes (serverless)
- **Database**: PostgreSQL (Supabase) with Prisma ORM 6.14
- **Authentication**: NextAuth.js v5
- **Email**: Resend (verification & password reset)
- **File Storage**: Supabase Storage
- **Security**: Row Level Security on all tables

### Development
- **Language**: TypeScript 5.8 (strict mode)
- **Linting**: ESLint 9 + typescript-eslint
- **Build**: Turbopack (dev), Next.js (prod)
- **Deployment**: Vercel (auto-deploy on push to `main`)

---

## Quick Start

### Prerequisites
- Node.js >= 18.17
- PostgreSQL 12+
- npm >= 8.0

### Installation

```bash
git clone https://github.com/RITIKHARIANI/bcs_web2.git
cd bcs-etextbook-redesigned
npm install
```

### Environment Variables

Create a `.env` file with:

```bash
DATABASE_URL="postgresql://..."       # Transaction pooler (port 6543)
DIRECT_URL="postgresql://..."         # Session pooler (port 5432, for migrations)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"        # openssl rand -base64 32
EMAIL_PROVIDER="console"             # "console" for dev, "resend" for prod
RESEND_API_KEY="re_..."              # Required for email sending
EMAIL_FROM="onboarding@resend.dev"
EMAIL_FROM_NAME="BCS E-Textbook"
```

### Database Setup

```bash
npm run db:generate       # Generate Prisma Client
npm run db:migrate:dev    # Create and apply migrations
npm run seed:achievements # Seed achievement definitions
npm run seed:playgrounds  # Seed playground templates
```

### Development Server

```bash
npm run dev    # Start with Turbopack at http://localhost:3000
```

---

## Project Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # ~65 API endpoints
│   │   ├── achievements/         # Achievement listing & user achievements
│   │   ├── admin/                # User mgmt, faculty requests, audit, analytics, content moderation
│   │   ├── auth/                 # Register, login, verify-email, forgot/reset-password
│   │   ├── courses/              # CRUD, enrollment, collaborators, by-slug, quest-map
│   │   ├── curriculum/           # Curriculum map data
│   │   ├── dashboard/            # Dashboard statistics
│   │   ├── faculty/              # Analytics, student lists, layout endpoints
│   │   ├── media/                # File upload/download (Supabase storage)
│   │   ├── modules/              # CRUD, clone, collaborators, resources
│   │   ├── paths/                # Learning path CRUD
│   │   ├── playgrounds/          # CRUD, fork, versioning, revert
│   │   ├── profile/              # User profile GET/PUT
│   │   ├── progress/             # Module completion, course progress, streaks
│   │   ├── public/               # Public course data, network visualization
│   │   ├── search/               # Full-text search
│   │   └── visualization/        # Course structure data
│   ├── admin/                    # Admin pages (dashboard, users, content, audit, analytics)
│   ├── auth/                     # Auth pages (login, register, verify, reset, pending)
│   ├── courses/[slug]/           # Course viewer + module viewer + course map
│   ├── curriculum/               # Curriculum map
│   ├── faculty/                  # Faculty pages (courses, modules, paths, editors, profile)
│   ├── student/                  # Student profile & progress
│   ├── playgrounds/              # Playground gallery, viewer, builder, TensorFlow playground
│   ├── modules/                  # Module browsing & standalone viewer
│   ├── paths/                    # Learning paths
│   ├── search/                   # Search results
│   ├── learning/                 # Learning dashboard
│   └── guide/                    # User guide
│
├── components/                   # ~120 React components
│   ├── ui/                       # 25+ Radix/shadcn primitives
│   ├── admin/                    # Admin dashboard components
│   ├── auth/                     # Auth forms (unified registration w/ role-specific fields)
│   ├── collaboration/            # Activity feed, collaborator panel
│   ├── curriculum/               # Curriculum map views
│   ├── editor/                   # Tiptap rich text editor
│   ├── faculty/                  # Faculty dashboard, forms, analytics
│   ├── layout/                   # App layout, responsive wrappers
│   ├── learning/                 # Learning dashboard components
│   ├── modules/                  # Module tree sidebar, navigation
│   ├── progress/                 # Progress tracking UI
│   ├── public/                   # Course catalog, course viewer, instructor sections
│   ├── quest-map/                # Quest map visualization
│   ├── react-playground/         # Sandpack builder, viewer, version history
│   ├── search/                   # Search results UI
│   ├── tensorflow-playground/    # Neural network playground (controls, visualization)
│   └── visualization/            # React Flow graph viewers/editors
│
├── hooks/                        # Custom hooks (floating panel, media query, responsive)
├── lib/                          # Utilities & services
│   ├── achievements/             # Achievement definitions & checker
│   ├── admin/                    # Audit logging
│   ├── auth/                     # NextAuth v5 config, password utils
│   ├── collaboration/            # Activity tracking, permissions
│   ├── constants/                # Academic interests, faculty titles, majors
│   ├── modules/                  # Hierarchy & tree utils
│   ├── react-playground/         # Sandpack config
│   ├── tensorflow-playground/    # Neural network engine
│   ├── db.ts                     # Prisma singleton
│   ├── email.ts                  # Email service (Resend)
│   ├── retry.ts                  # DB retry for serverless
│   ├── search.ts                 # Full-text search
│   ├── storage.ts                # Supabase file storage
│   └── utils.ts                  # General utilities
├── types/                        # TypeScript definitions
└── middleware.ts                  # Role-based route protection
```

### Database Schema (22 Models)

| Category | Models |
|---|---|
| **Core Content** | `users`, `courses`, `modules`, `course_modules`, `module_media`, `media_files` |
| **Playgrounds** | `playgrounds`, `playground_templates`, `playground_versions` |
| **Collaboration** | `course_collaborators`, `module_collaborators`, `collaboration_activity` |
| **Tracking** | `course_tracking`, `module_progress`, `learning_sessions` |
| **Gamification** | `achievements`, `user_achievements`, `user_gamification_stats` |
| **Admin/Auth** | `sessions`, `faculty_requests`, `admin_audit_logs` |
| **Curriculum** | `learning_paths` |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build (includes Prisma generation) |
| `npm run lint` | Run ESLint |
| `npm run db:migrate:dev` | Create and apply database migration |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run seed:achievements` | Seed achievement definitions |
| `npm run seed:playgrounds` | Seed playground templates (hash-based upsert) |
| `npm run vercel:build` | Full Vercel build (generate + migrate + seed + build) |

---

## Deployment

Deployed on **Vercel** with automatic deploys from the `main` branch.

### Build Process
1. `prisma generate` - Generate Prisma Client
2. `prisma migrate deploy` - Apply pending migrations
3. `seed:achievements` - Seed achievements
4. `seed:playgrounds` - Seed playground templates (hash-based, preserves UI edits)
5. `next build` - Build Next.js

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL (transaction pooler, port 6543)
- `DIRECT_URL` - PostgreSQL (session pooler, port 5432, for migrations)
- `NEXTAUTH_URL` - Canonical URL
- `NEXTAUTH_SECRET` - Secure random string
- `EMAIL_PROVIDER` - `resend` for production
- `RESEND_API_KEY` - From [resend.com](https://resend.com)
- `EMAIL_FROM` - Verified sender email
- `EMAIL_FROM_NAME` - Display name

---

## Documentation

All documentation is in the [`/docs`](./docs/) directory:

| File | Description |
|---|---|
| [DATABASE_MIGRATION_GUIDE.md](./docs/DATABASE_MIGRATION_GUIDE.md) | Database migration workflow |
| [DEV_PROD_WORKFLOW.md](./docs/DEV_PROD_WORKFLOW.md) | Development and production workflow |
| [EMAIL_SETUP_GUIDE.md](./docs/EMAIL_SETUP_GUIDE.md) | Resend email configuration |
| [FEATURE_PROPOSALS.md](./docs/FEATURE_PROPOSALS.md) | Feature ideas and proposals |
| [MANUAL_TESTING_GUIDE.md](./docs/MANUAL_TESTING_GUIDE.md) | Manual testing procedures |
| [TESTING_CHECKLIST.md](./docs/TESTING_CHECKLIST.md) | Comprehensive testing checklist |
| [UNIVERSITY_OF_ILLINOIS_BRANDING.md](./docs/UNIVERSITY_OF_ILLINOIS_BRANDING.md) | Design guidelines |
| [USER_GUIDE.md](./docs/USER_GUIDE.md) | Platform user guide (also at `/guide`) |

---

## Project Statistics

```
Database Models:    22
API Endpoints:     ~65
Page Routes:       ~45
React Components:  ~120
Prisma Migrations: 13
```

---

**Version**: 2.0.0 | **Last Updated**: February 2025

**Repository**: [github.com/RITIKHARIANI/bcs_web2](https://github.com/RITIKHARIANI/bcs_web2)
