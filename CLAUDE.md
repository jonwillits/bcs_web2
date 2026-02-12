# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev              # Start dev server with Turbopack (rarely used - testing done on Vercel)
npm run build            # Build for production (includes Prisma generation)
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database Operations
```bash
npm run db:studio        # Open Prisma Studio (visual DB editor)
npm run db:migrate:dev   # Create and apply migration (ALWAYS USE THIS)
npm run db:generate      # Generate Prisma Client
```

**Note:** Development and testing is done on Vercel deployment at https://bcs-web2.vercel.app, NOT locally.

**CRITICAL:**
- ALWAYS use `db:migrate:dev` - Creates migration files and keeps sync
- NEVER use `db:push` - Causes migration drift and deployment failures
- See [DATABASE_MIGRATION_GUIDE.md](./docs/DATABASE_MIGRATION_GUIDE.md) for complete workflow

### Seeding
```bash
npm run seed:achievements   # Seed achievement definitions
npm run seed:playgrounds    # Seed playground templates (hash-based upsert)
```

### Vercel Deployment
```bash
npm run vercel:build     # Build command for Vercel (generate + migrate + seed + build)
npm run vercel:install   # Install with legacy peer deps (required)
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router) + React 19
- **Database**: PostgreSQL (Supabase) with Prisma ORM 6.14
- **Auth**: NextAuth v5 (uses `auth()` not `getServerSession()`)
- **Email**: Resend (email verification & password reset)
- **Storage**: Supabase (file uploads)
- **Styling**: Tailwind CSS 3.4 + Custom Neural Design System
- **Rich Text**: Tiptap Editor
- **Visualizations**: React Flow (graph), Recharts (charts)
- **Playgrounds**: Sandpack (in-browser React bundler)
- **Deployment**: Vercel (serverless)

### Key Architectural Patterns

#### 1. Data Model: Modular Content System
The platform uses a **reusable module architecture**:

- **Modules** are standalone learning units (can be nested hierarchically via `parent_module_id`)
- **Courses** are collections of modules linked via `course_modules` junction table
- Modules can be shared across multiple courses
- Media files are stored separately and linked via `module_media` junction table
- Course-module junction supports customization (custom_notes, custom_context, custom_objectives)

**Critical Relations**:
```
courses -> course_modules -> modules
modules -> module_media -> media_files
modules -> modules (self-referential for parent/child)
users -> courses (author_id)
users -> modules (author_id)
users -> playgrounds (created_by)
courses -> course_collaborators -> users
modules -> module_collaborators -> users
users -> course_tracking (enrollment)
users -> module_progress (completion)
```

#### 2. NextAuth v5 Pattern
Always use the `auth()` export from `/src/lib/auth/config.ts`:

```typescript
import { auth } from '@/lib/auth/config'

// Server Components / API Routes
const session = await auth()

// Access user data
const userId = session?.user?.id
const userRole = session?.user?.role
```

**Never** import `getServerSession` from `next-auth` - it's deprecated.

#### 3. Next.js 15 Dynamic Routes
All dynamic route params are now Promises:

```typescript
interface PageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string }>
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  // use slug
}
```

#### 4. Image Optimization
Always use Next.js `Image` component, never `<img>`:

```typescript
import Image from 'next/image'

<Image
  src={avatarUrl}
  alt={name}
  width={128}
  height={128}
  className="..."
/>
```

#### 5. Role-Based Access Control
Middleware (`src/middleware.ts`) enforces route protection:
- `/admin/*` - Admin only
- `/faculty/*` - Faculty or Admin
- `/student/*` - Students only
- Unauthenticated users redirected to login
- Pending faculty redirected to approval page

User roles: `student`, `faculty`, `pending_faculty`, `admin`

### Directory Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API Routes (~65 endpoints)
│   │   ├── achievements/         # Achievement listing & user achievements
│   │   ├── admin/                # User management, faculty requests, audit logs, analytics, content moderation
│   │   ├── auth/                 # Authentication (login, register, verify-email, reset-password)
│   │   ├── courses/              # Course CRUD, enrollment, collaborators, by-slug, course-map
│   │   ├── program/              # Program map data
│   │   ├── dashboard/            # Dashboard statistics
│   │   ├── faculty/              # Faculty analytics, student lists, program/course-map layout
│   │   ├── health/               # Health check
│   │   ├── media/                # File upload/download (Supabase storage)
│   │   ├── modules/              # Module CRUD, clone, collaborators, resources
│   │   ├── paths/                # Learning path CRUD
│   │   ├── playgrounds/          # Playground CRUD, fork, versioning, revert
│   │   ├── profile/              # User profile (GET/PUT)
│   │   ├── progress/             # Module completion, course progress, streaks
│   │   ├── public/               # Public course data, network visualization
│   │   ├── search/               # Full-text search
│   │   ├── users/                # User operations
│   │   └── visualization/        # Course structure visualization data
│   ├── admin/                    # Admin dashboard, users, faculty-requests, content, audit-logs, analytics
│   ├── auth/                     # Auth pages (login, register, verify-email, forgot/reset-password, pending-approval)
│   ├── courses/[slug]/           # Public course viewer
│   │   ├── [moduleSlug]/         # Module viewer within course
│   │   └── map/                  # Course structure map
│   ├── program/map/              # Global program map
│   ├── faculty/                  # Faculty dashboard
│   │   ├── courses/              # Course management (create, edit, analytics)
│   │   ├── modules/              # Module management (create, edit)
│   │   ├── paths/                # Learning path management
│   │   ├── program/              # Program map editor
│   │   ├── course-map/           # Course map editor
│   │   ├── visualization/        # Graph editor
│   │   └── profile/              # Faculty profile
│   ├── student/                  # Student profile & progress
│   ├── playgrounds/              # Interactive playgrounds
│   │   ├── [id]/                 # Unified viewer (featured + community)
│   │   ├── builder/              # Builder interface (React/Sandpack)
│   │   └── tensorflow/           # TensorFlow neural network playground
│   ├── modules/                  # Module browsing & standalone viewer
│   ├── network/                  # Network visualization
│   ├── paths/                    # Learning paths browser
│   ├── profile/                  # User profiles & achievements
│   ├── search/                   # Search results
│   ├── progress/                 # Progress dashboard
│   ├── learning/                 # Learning dashboard
│   └── guide/                    # User guide (renders USER_GUIDE.md)
│
├── components/                   # React components (~120 files)
│   ├── ui/                       # Radix UI primitives + shadcn (25+ components)
│   ├── accessibility/            # Skip navigation
│   ├── achievements/             # Achievement badges, cards, toasts, gallery
│   ├── admin/                    # Admin layout, analytics, audit logs, user management, content moderation
│   ├── auth/                     # Login, register (unified w/ student/faculty fields), verify, reset forms
│   ├── collaboration/            # Activity feed, collaborator panel, faculty search
│   ├── program-map/              # Program map (authenticated + public)
│   ├── editor/                   # Tiptap rich text editor
│   ├── error/                    # Error boundary
│   ├── faculty/                  # Dashboard, course/module forms, analytics, learning paths, editors
│   ├── layout/                   # App layout, header, responsive layouts, media sidebar
│   ├── learning/                 # Learning dashboard, course cards, activity timeline
│   ├── modules/                  # Module tree sidebar, navigation cards, breadcrumbs
│   ├── navigation/               # Quest breadcrumbs
│   ├── profile/                  # Profile view
│   ├── progress/                 # Progress bar, cards, mark-complete button
│   ├── providers/                # React providers (Auth, Query, Theme)
│   ├── public/                   # Course catalog, course viewer, module catalog, instructor sections
│   ├── course-map/               # Course map (authenticated + public)
│   ├── react-playground/         # Builder, viewer, preview, info drawer, version history, dependencies
│   ├── search/                   # Search result cards, universal search results
│   ├── student/                  # Student profile, start course button
│   ├── tensorflow-playground/    # Neural network playground (controls, visualization, context)
│   └── visualization/            # React Flow graph viewers/editors
│
├── hooks/                        # Custom React hooks
│   ├── useFloatingPanel.ts       # Floating panel positioning
│   ├── useMediaQuery.ts          # Responsive media queries
│   └── useResponsiveLayout.ts    # Responsive layout management
│
├── lib/                          # Core utilities and services
│   ├── achievements/             # Achievement definitions & checker
│   ├── admin/                    # Admin audit logging
│   ├── auth/                     # NextAuth v5 config, password utils
│   ├── collaboration/            # Activity tracking, permissions
│   ├── constants/                # Academic interests, faculty titles, majors
│   ├── modules/                  # Hierarchy helpers, tree utils
│   ├── react-playground/         # Sandpack configuration
│   ├── tensorflow-playground/    # Neural network engine (datasets, activations, training, loss)
│   ├── db.ts                     # Prisma client singleton
│   ├── email.ts                  # Email sending (Resend)
│   ├── retry.ts                  # Database retry logic for serverless
│   ├── search.ts                 # Full-text search
│   ├── storage.ts                # Supabase file storage
│   ├── supabase.ts               # Supabase client
│   ├── utils.ts                  # General utilities (cn, formatting)
│   ├── program-layout.ts         # Program map layout calculations
│   └── course-map-layout.ts      # Course map layout calculations
│
├── types/                        # TypeScript type definitions
│   ├── auth.ts                   # Authentication types
│   ├── collaboration.ts          # Collaboration types
│   └── react-playground.ts       # Playground types
│
└── middleware.ts                  # NextAuth middleware (role-based route protection)
```

### Database Schema (22 Models)

**Core Content**: `users`, `courses`, `modules`, `course_modules`, `module_media`, `media_files`
**Playgrounds**: `playgrounds`, `playground_templates`, `playground_versions`
**Collaboration**: `course_collaborators`, `module_collaborators`, `collaboration_activity`
**Tracking**: `course_tracking`, `module_progress`, `learning_sessions`
**Gamification**: `achievements`, `user_achievements`, `user_gamification_stats`
**Admin/Auth**: `sessions`, `faculty_requests`, `admin_audit_logs`
**Learning Paths**: `learning_paths`

### Custom Design System

The platform uses a **neural-inspired design system** defined in `tailwind.config.ts`:

- **Colors**: `neural-primary`, `synapse-primary`, `cognition-teal`, `cognition-orange`, `cognition-green`
- **Animations**: `neural-pulse`, `synaptic-flow`, `cognitive-glow`
- **Shadows**: `neural`, `synaptic`, `cognitive`, `floating`
- **Gradients**: `gradient-neural`, `gradient-synaptic`, `gradient-cognitive`
- **Buttons**: Custom `NeuralButton` component with gradient variants

## Important Implementation Details

### Pagination Implementation
API routes support pagination via query parameters:

```typescript
// API: /api/courses?page=1&limit=20
const page = parseInt(searchParams.get('page') || '1', 10)
const limit = parseInt(searchParams.get('limit') || '20', 10)
const skip = (page - 1) * limit

const [items, totalCount] = await Promise.all([
  prisma.model.findMany({ skip, take: limit }),
  prisma.model.count()
])

return { items, pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) }}
```

### Interactive Playgrounds
The playground system uses React and Sandpack for interactive code demos:
- **Sandpack**: CodeSandbox's in-browser bundler for React/JS
- **Unified Viewer**: Single route for all playgrounds (featured + community)
- **Database-backed**: Templates seeded to database with `is_featured` flag
- **Version History**: Full version tracking with revert capability
- **Forking**: Community users can fork featured or public playgrounds
- **Hash-based Seeding**: Templates use SHA-256 hashing to detect seed file changes vs. UI edits

Key files:
- `/src/lib/react-playground/sandpack-config.ts` - Sandpack configuration
- `/src/components/react-playground/UnifiedPlaygroundViewer.tsx` - Viewer
- `/src/components/react-playground/ReactPlaygroundBuilder.tsx` - Builder
- `/scripts/seed-playgrounds.ts` - Template seeding with hash-based upsert

### TensorFlow Playground
A full neural network training environment at `/playgrounds/tensorflow`:
- Multiple datasets (Circle, XOR, Gaussian, Spiral)
- Custom network architecture editing (add/remove layers and neurons)
- Real-time loss visualization with Recharts
- Decision boundary rendering
- Neuron activation and output heatmaps
- Configurable learning rate, activation functions, regularization

Key files:
- `/src/components/tensorflow-playground/TensorFlowPlayground.tsx` - Main component
- `/src/lib/tensorflow-playground/` - Neural network engine (network, trainer, activations, loss, datasets)

### Collaboration System
Faculty can co-author courses and modules:
- Invite collaborators via faculty search
- Activity feed tracking all changes
- Permission checks for edit access

Key files:
- `/src/lib/collaboration/permissions.ts` - Permission logic
- `/src/components/collaboration/` - UI components

### Gamification / Course Map
Courses support gamified learning:
- Modules have XP rewards, difficulty levels, quest types
- Prerequisite chains between modules
- Visual course map with position coordinates
- Achievements with badge tiers (gray, bronze, silver, gold)
- User XP, levels, and streaks

### React Hook Dependencies
When modifying playground components, ensure proper dependency arrays:

```typescript
// Callbacks passed as props should be in dependencies
useEffect(() => {
  onParameterChange?.(params)
}, [params, onParameterChange])

// For mount-only effects, use eslint-disable
useEffect(() => {
  // mount only
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

### Database Retry Pattern
API routes use retry logic for serverless/edge environments:

```typescript
import { withDatabaseRetry } from '@/lib/retry'

const data = await withDatabaseRetry(async () => {
  return await prisma.model.findMany()
}, { maxAttempts: 3, baseDelayMs: 500 })
```

### Email Configuration (Resend)
The platform uses **Resend** for email verification and password reset:

**Environment Variables**:
```bash
EMAIL_PROVIDER="resend"              # Use "console" for dev, "resend" for prod
RESEND_API_KEY="re_your_api_key"    # Get from https://resend.com
EMAIL_FROM="onboarding@resend.dev"   # Dev: onboarding@resend.dev, Prod: verified domain
EMAIL_FROM_NAME="BCS E-Textbook"     # Display name (can be anything)
```

**Email Functions** (in `/src/lib/email.ts`):
- `sendVerificationEmail(email, name, token)` - Send email verification
- `sendPasswordResetEmail(email, name, token)` - Send password reset

See `/docs/EMAIL_SETUP_GUIDE.md` for detailed setup instructions.

## Common Gotchas

1. **Schema Changes**: ALWAYS use `npm run db:migrate:dev` for ALL schema changes. This creates migration files that work in both dev and production. See [DATABASE_MIGRATION_GUIDE.md](./docs/DATABASE_MIGRATION_GUIDE.md).

2. **NextAuth Session**: User data is in `session.user.id` and `session.user.role`, not `session.userId`.

3. **Prisma Queries**: Use transaction pooler (port 6543) for production, session pooler (port 5432) for development/migrations (`DIRECT_URL`).

4. **Email Configuration**: Must add `RESEND_API_KEY` and verify domain for production. Development can use `onboarding@resend.dev`.

5. **Image Domains**: External images must be added to `remotePatterns` in `next.config.ts`.

6. **Prisma Client**: Generated client is gitignored. Always run `prisma generate` after pulling schema changes.

7. **Playground Seeding**: Templates use hash-based upsert — the seed script only overwrites DB records when the seed file content actually changes. UI edits are preserved between deploys.

8. **Row Level Security**: All public tables have RLS enabled via Supabase. Keep this in mind when querying directly.

## Features & Current Status

### Implemented
1. **User Profiles** - Separate student and faculty profiles with role-specific fields (major, graduation year, research area, academic links)
2. **Pagination** - Course catalog (20/page) and module library (50/page) with smart page controls
3. **Enhanced Course View** - Overview section and instructor display when no module selected
4. **Interactive Playgrounds** - React/Sandpack playgrounds with featured templates, community submissions, forking, and version history
5. **TensorFlow Playground** - Neural network training visualization with multiple datasets and architectures
6. **Email Verification** - User account verification via Resend
7. **Password Reset** - Forgot password functionality via Resend
8. **Collaboration System** - Faculty co-authoring for courses and modules with activity feed
9. **Admin Dashboard** - User management, faculty approval, content moderation, audit logs, analytics
10. **Progress Tracking** - Module completion, course progress, streaks, learning sessions
11. **Gamification** - Achievements, XP, levels, streaks, course map with difficulty levels
12. **Program Map** - Visual course prerequisite and relationship mapping
13. **Learning Paths** - Curated multi-course learning sequences
14. **Full-Text Search** - Search across courses, modules, and playgrounds
15. **Media Management** - File upload/download via Supabase storage
16. **Module Cloning** - Clone modules across courses with lineage tracking
17. **User Guide** - In-app guide rendered from USER_GUIDE.md at `/guide`
18. **Row Level Security** - RLS enabled on all public database tables

### Testing Approach
The project uses manual testing on the Vercel deployment. When adding features:
- Test on Vercel deployment (https://bcs-web2.vercel.app), NOT locally
- Verify mobile responsiveness across devices
- Check authentication flows for student, faculty, and admin users
- Test with PostgreSQL database (not SQLite)

## Deployment

**Production**: https://www.brainandcognitivescience.com/ - Automatically deployed to Vercel on push to `main` branch.

**Environment Variables Required**:
- `DATABASE_URL` - PostgreSQL connection string (port 6543 for serverless)
- `DIRECT_URL` - PostgreSQL session pooler (port 5432, for migrations)
- `NEXTAUTH_URL` - Production URL
- `NEXTAUTH_SECRET` - Random secure string
- `EMAIL_PROVIDER` - Email service (`resend` for production)
- `RESEND_API_KEY` - API key from Resend dashboard
- `EMAIL_FROM` - Verified sender email (e.g., `noreply@yourdomain.com`)
- `EMAIL_FROM_NAME` - Sender display name (e.g., `BCS E-Textbook`)

**Build Process**:
1. Vercel runs `npm run vercel:build`
2. This executes: `prisma generate && prisma migrate deploy && seed:achievements && seed:playgrounds && next build`
3. Deploys to edge network

## Code Style

- **TypeScript**: Strict mode, no implicit `any`
- **Imports**: Use `@/` path alias for absolute imports
- **Components**: Prefer server components, use `"use client"` only when necessary
- **Naming**:
  - Files: `kebab-case.tsx`
  - Components: `PascalCase`
  - Functions: `camelCase`
  - Database: `snake_case`

## Documentation

**All documentation is in `/docs` directory** (not root). Key files:

- `DATABASE_MIGRATION_GUIDE.md` - Database migration workflow
- `DEV_PROD_WORKFLOW.md` - Development and production workflow
- `EMAIL_SETUP_GUIDE.md` - Resend email configuration
- `FEATURE_PROPOSALS.md` - Feature proposals and ideas
- `MANUAL_TESTING_GUIDE.md` - Manual testing procedures
- `TESTING_CHECKLIST.md` - Comprehensive testing checklist
- `UNIVERSITY_OF_ILLINOIS_BRANDING.md` - Design guidelines
- `USER_GUIDE.md` - Platform user guide (rendered at `/guide`)

## Environment Setup

### Development/Testing Environment
- **URL**: https://bcs-web2.vercel.app/
- **Database Connection**: Uses `DATABASE_URL` environment variable (set in your Vercel project settings)
- **Database**: Supabase dev/test database
- **Testing**: ALL testing done on Vercel deployment (NOT locally)

### Production Environment
- **URL**: https://www.brainandcognitivescience.com/
- **Database Connection**: Uses `DATABASE_URL` environment variable (set in university Vercel project settings)
- **Database**: Supabase production database

### MCP Servers (For Claude-Assisted Debugging Only)
- **`supabase` MCP**: Allows Claude to inspect/debug dev/test database
- **`supabasePROD` MCP**: Allows Claude to inspect/debug production database (use carefully)
- **Important**: MCP is NOT how websites connect to databases - websites use `DATABASE_URL` environment variables

### Other Notes
- Use Context7 to check up-to-date docs when needed for implementing new libraries or frameworks
- Whenever database schema changes are made, create migrations and commit them - Vercel applies them automatically
- For faculty user in development environment and testing, use:

email/username: ritikh2@illinois.edu
password: Test234!
