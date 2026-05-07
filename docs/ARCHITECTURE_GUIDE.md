# BCS E-Learning Platform Architecture

## System Overview

The BCS E-Learning Platform is a full-featured Learning Management System (LMS) for the Brain & Cognitive Science program. It supports course authoring, interactive content, gamified progress tracking, quizzes, and Canvas LMS integration.

**Stack:** Next.js 15 (App Router) | React 19 | TypeScript | PostgreSQL (Supabase) | Prisma 6.14 | NextAuth v5 | Vercel

---

## High-Level Architecture Diagram

```
                              USERS
              Students / Faculty / Admins
                         |
            ┌────────────┴────────────┐
            │     Vercel Edge CDN     │
            │  ┌───────────────────┐  │
            │  │  Cache-Control    │  │
            │  │  s-maxage + SWR   │  │
            │  │  (public GETs)    │  │
            │  └───────────────────┘  │
            └────────────┬────────────┘
                         │
            ┌────────────┴────────────┐
            │   Next.js Middleware    │
            │  ┌───────────────────┐  │
            │  │ JWT Verification  │  │
            │  │ Role-Based Routes │  │
            │  │ /admin → admin    │  │
            │  │ /faculty → faculty│  │
            │  │ /student → student│  │
            │  └───────────────────┘  │
            └──────┬──────────┬───────┘
                   │          │
        ┌──────────┴──┐  ┌───┴──────────────┐
        │   Server    │  │   API Routes      │
        │  Components │  │   (~95 endpoints) │
        │             │  │                   │
        │ Direct      │  │ ┌───────────────┐ │
        │ Prisma      │  │ │ Auth (JWT)    │ │
        │ Queries     │  │ ├───────────────┤ │
        │             │  │ │ Rate Limiter  │ │
        │ - Catalog   │  │ ├───────────────┤ │
        │ - Course    │  │ │ Zod Validate  │ │
        │   Viewer    │  │ ├───────────────┤ │
        │ - Module    │  │ │ Permission    │ │
        │   Page      │  │ │ Check         │ │
        │             │  │ ├───────────────┤ │
        │             │  │ │ DB Retry      │ │
        │             │  │ │ (backoff +    │ │
        │             │  │ │  jitter)      │ │
        │             │  │ └───────────────┘ │
        └──────┬──────┘  └────────┬──────────┘
               │                  │
        ┌──────┴──────┐  ┌───────┴───────┐
        │   Client    │  │   Prisma ORM  │
        │  Components │  │   (37 Models) │
        │ (~150 files)│  └───────┬───────┘
        │             │          │
        │ React Query │  ┌───────┴───────┐
        │ Tiptap      │  │  PostgreSQL   │
        │ React Flow  │  │  (Supabase)   │
        │ Sandpack    │  │               │
        │ Recharts    │  │ Port 6543     │
        │ dnd-kit     │  │ (PgBouncer TX)│
        └─────────────┘  │               │
                         │ Port 5432     │
                         │ (Migrations)  │
                         │               │
                         │ RLS Enabled   │
                         │ 95+ Indexes   │
                         └───────────────┘

        ┌─────────────────────────────────────┐
        │         External Services           │
        │                                     │
        │  Resend ─── Email (verify, reset)   │
        │  Supabase ─ File Storage (media)    │
        │  Sentry ─── Error Tracking          │
        │  Canvas ─── LMS Grade Sync          │
        │  Vercel ─── Analytics + Hosting     │
        └─────────────────────────────────────┘
```

---

## Request Lifecycle

### Public Page Request (e.g., `/courses/intro-neuroscience`)

```
Browser
  → Vercel CDN (check cache)
    → [CACHE HIT] Return cached response (< 5ms)
    → [CACHE MISS]
      → Next.js Middleware (no auth needed for public routes)
        → Server Component
          → Direct Prisma query (with retry)
            → PostgreSQL
          ← Course data
        ← Rendered HTML + React hydration payload
      ← Response with Cache-Control header
    ← CDN caches for s-maxage duration
  ← User sees page
```

### Authenticated API Request (e.g., `POST /api/progress/module/complete`)

```
Browser (React Query mutation)
  → Vercel Edge
    → Next.js Middleware (verify JWT, check role)
      → API Route Handler
        → auth() — extract session
        → Rate limit check (in-memory)
        → Zod input validation
        → Permission check (enrollment, ownership)
        → prisma.$transaction (batched queries)
          → PostgreSQL
        ← XP, level, achievements, unlocked modules
      ← JSON response (no cache headers)
    ← Response
  ← React Query updates cache, UI re-renders
```

---

## Data Model Overview

### Core Content

```
┌──────────┐     ┌────────────────┐     ┌──────────┐
│  users   │────→│ course_modules │←────│ courses  │
│          │     │ (junction +    │     │          │
│ id       │     │  custom notes) │     │ id       │
│ name     │     └────────┬───────┘     │ title    │
│ email    │              │             │ slug     │
│ role     │     ┌────────┴───────┐     │ status   │
│ password │     │    modules     │     └──────────┘
└──────────┘     │                │
                 │ id             │
                 │ title          │
                 │ content        │
                 │ parent_module_id ──→ (self-ref)
                 │ tags[]         │
                 └────────┬───────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
     ┌────────┴──┐  ┌─────┴────┐  ┌──┴──────────┐
     │module_media│  │ quizzes  │  │question_banks│
     │           │  │          │  │             │
     │→media_files│  │→blocks   │  │→bank_       │
     └───────────┘  │→attempts │  │ questions   │
                    └──────────┘  │→options     │
                                  └─────────────┘
```

### Quiz V2 Architecture

```
question_banks ──→ bank_questions ──→ bank_question_options
                        │
                        ↓
                  question_sets ←── question_set_memberships
                        │
                        ↓
                   quiz_blocks (N questions to pull from set)
                        │
                        ↓
                     quizzes
                        │
                        ↓
                  quiz_attempts
                        │
              ┌─────────┴──────────┐
              │                    │
    quiz_question_instances   quiz_attempt_answers
    (snapshot of question     (student selections
     at attempt time)          per instance)
```

### Gamification & Progress

```
users ──→ course_tracking (enrollment, completion %)
     ──→ module_progress (per-module per-course status)
     ──→ user_gamification_stats (XP, level, streaks)
     ──→ user_achievements (unlocked badges)
     ──→ learning_sessions (daily activity)
```

### Canvas LMS Integration

```
courses ──→ course_groups (student groups with canvas_course_id)
       ──→ canvas_assignment_mappings (quiz → Canvas assignment)
       ──→ canvas_sync_logs (audit trail)

Sync Flow:
  1. Faculty triggers sync for a group
  2. System loads all quizzes + best scores for group members
  3. Creates/reuses Canvas assignments via REST API
  4. Pushes grades per student (matched by email)
  5. Logs result (success/partial/failed)
```

---

## Scalability Architecture

### CDN Caching Layer

Public read endpoints use Vercel CDN caching via `Cache-Control` headers:

```
Client → Vercel CDN Edge → [HIT] → Cached Response (0ms DB)
                         → [MISS] → Serverless Function → DB → Cache + Respond
```

| Endpoint | CDN TTL | Stale Window |
|----------|---------|-------------|
| Network Visualization | 5 min | +10 min |
| Course Detail | 2 min | +5 min |
| Course Catalog | 1 min | +2 min |
| Search Results | 30 sec | +1 min |

Authenticated endpoints (progress, dashboard, editing) are never cached.

### Rate Limiting

```
Request → Extract IP/Email → Check In-Memory Map
  → [ALLOWED] → Continue to handler
  → [BLOCKED] → 429 Too Many Requests + Retry-After header

Per-instance sliding window (sufficient for 150 users)
For 500+ users: migrate to Upstash Redis
```

### Database Query Patterns

**Transaction batching** for module completion:
```
prisma.$transaction(async (tx) => {
  // Query 1: Get module data
  const module = await tx.modules.findUnique(...)

  // Queries 2-4 (parallel): upsert progress + stats + session
  const [progress, stats, session] = await Promise.all([
    tx.module_progress.upsert(...),
    tx.user_gamification_stats.upsert(...),
    tx.learning_sessions.upsert(...),
  ])

  // Queries 5-6 (parallel): course tracking
  const [allProgress, courseModules] = await Promise.all([
    tx.module_progress.findMany(...),
    tx.course_modules.findMany(...),
  ])
})
// Achievement check runs OUTSIDE transaction
```

**Tag extraction** using PostgreSQL `unnest()`:
```sql
SELECT DISTINCT unnest(tags) as tag
FROM modules
WHERE author_id = $1
ORDER BY tag
```
Replaces: loading all modules into memory and deduplicating with JS `Set`.

### Error Tracking

```
Client Error → Sentry Client SDK → Sentry Dashboard
Server Error → instrumentation.ts onRequestError → Sentry Server SDK
React Error  → global-error.tsx → Sentry.captureException → Recovery UI
```

PII scrubbed from all payloads via `beforeSend` (email, IP address removed).

---

## Security Architecture

### Authentication Flow

```
Register → bcrypt hash (12 rounds) → Store user → Send verification email
Login → Rate limit check → Find user → bcrypt compare → Verify email → JWT token
```

- JWT sessions (30-day expiry)
- Email verification required before login
- Faculty registration requires admin approval (`pending_faculty` → `faculty`)

### Authorization Layers

```
Layer 1: Middleware     → Route-level role checks (/admin, /faculty, /student)
Layer 2: API Route      → hasFacultyAccess(session), auth() checks
Layer 3: Permissions    → canEditCourse/Module with collaborator + hierarchy checks
Layer 4: Database       → Supabase RLS on all public tables
```

### Rate Limiting

| Endpoint | Limit | Key | Window |
|----------|-------|-----|--------|
| Login | 10 | Email | 15 min |
| Register | 5 | IP | 15 min |
| Forgot Password | 5 | IP | 15 min |
| Reset Password | 10 | IP | 15 min |

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 15 App Router | Server components for public pages, API routes co-located |
| Database | PostgreSQL (Supabase) | Relational model fits content hierarchy, RLS for security |
| ORM | Prisma 6.14 | Type-safe queries, migration system, serverless-compatible |
| Auth | NextAuth v5 (JWT) | Stateless sessions for serverless, role-based access |
| Hosting | Vercel | Zero-config Next.js hosting, edge CDN, serverless functions |
| Caching | Vercel CDN headers | No infrastructure cost, sufficient for 150 users |
| Rate Limiting | In-memory Map | No Redis needed for 150 users, per-instance protection |
| Error Tracking | Sentry | Industry standard, free tier sufficient, Next.js integration |
| Email | Resend | Simple API, good deliverability, reasonable pricing |
| File Storage | Supabase Storage | Co-located with database, S3-compatible |
| Rich Text | Tiptap | Extensible, React-native, good DX |
| Playgrounds | Sandpack | In-browser bundler, no server needed |
| Visualizations | React Flow + Recharts | Interactive graphs + charts |
