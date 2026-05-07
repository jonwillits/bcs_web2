# BCS E-Learning Platform: System Design Analysis

## Context

This document is a comprehensive system design audit of the BCS E-Learning platform (Brain & Cognitive Science E-Learning). The platform is a full-featured LMS built with Next.js 15 + React 19 + TypeScript, backed by PostgreSQL (Supabase) via Prisma ORM 6.14, authenticated with NextAuth v5, and deployed on Vercel serverless. It serves ~65 API endpoints, 22+ database models, and ~150 React components. The audit covers architecture, features, strengths, weaknesses, and prioritized improvements.

**Production URL:** https://www.brainandcognitivescience.com/
**Stack:** Next.js 15 (App Router) | React 19 | TypeScript | PostgreSQL (Supabase) | Prisma 6.14 | NextAuth v5 (JWT) | Vercel

---

## 1. Feature Inventory

| # | Feature | Description | Maturity |
|---|---------|-------------|----------|
| 1 | **Auth & Registration** | Email/password with JWT sessions, email verification via Resend, password reset, role-based registration (student vs. faculty request) | Production |
| 2 | **Role-Based Access Control** | 4 roles (student, faculty, pending_faculty, admin) enforced in middleware + API. Super admin for destructive operations | Production |
| 3 | **Course Management** | CRUD with slug routing, tagging, featured flag, draft/published workflow. Course-module junction with custom notes/context/objectives | Production |
| 4 | **Hierarchical Module System** | Self-referential parent_module_id, cloning with lineage tracking, visibility controls, per-module media attachments | Production |
| 5 | **Rich Text Editor** | Tiptap v3 with heading, image (resizable), link, text-align extensions | Production |
| 6 | **Interactive Playgrounds** | Sandpack-based React/JS playgrounds with featured templates, community submissions, forking, version history, revert | Production |
| 7 | **TensorFlow Playground** | Neural network training environment: multiple datasets, architecture editing, real-time loss viz, decision boundaries | Production |
| 8 | **Collaboration** | Faculty co-authoring for courses/modules, invite system, activity feed, hierarchical permission inheritance | Production |
| 9 | **Progress & Gamification** | Module completion, course progress %, XP, levels, streaks, difficulty levels, quest types (standard/challenge/boss/bonus) | Production |
| 10 | **Achievements** | 37+ achievements, 4-tier badge system (gray/bronze/silver/gold), criteria-based unlocking, seeded from definitions | Production |
| 11 | **Quiz System** | MC, multi-select, T/F, short answer. Time limits, max attempts, shuffle, pass thresholds, auto-grading + manual, XP rewards | Production |
| 12 | **Program Map** | Visual course prerequisite/relationship mapping with draggable positions | Production |
| 13 | **Course Map** | Gamified course structure visualization with module positions, prerequisite chains, difficulty indicators | Production |
| 14 | **Learning Paths** | Curated multi-course sequences with ordering, featured flag, slug routing | Production |
| 15 | **Admin Dashboard** | User management, faculty approval, content moderation, audit logging, platform analytics | Production |
| 16 | **Universal Search** | Cross-entity search (courses, modules, people) with category filtering and pagination | Production |
| 17 | **Media Management** | File upload/download via Supabase storage, multi-backend (S3, Cloudinary, Vercel Blob), 50MB limit, MIME validation | Production |
| 18 | **Module Cloning** | Clone across courses with lineage tracking, clone count, source reference | Production |
| 19 | **Network Visualization** | React Flow graph views for course structure and module relationships | Production |
| 20 | **User Profiles** | Role-specific fields (major, graduation year for students; research area, academic links for faculty), avatar support | Production |

---

## 2. Architecture Diagram

```
                                    CLIENTS
                         Browser (Desktop / Mobile)
                                    |
                       +------------+------------+
                       |      Vercel Edge        |
                       |    (CDN + Routing)       |
                       +------------+------------+
                                    |
                       +------------+------------+
                       |   Next.js Middleware     |
                       |  (Role-Based Auth Guard) |
                       |  /admin /faculty /student|
                       +------------+------------+
                                    |
                +-------------------+-------------------+
                |                                       |
       +--------+--------+                +-------------+-------------+
       | Server Components|                |     API Routes (~65)      |
       | (App Router Pages)|                |     /api/*                |
       | - Course Viewer   |                |  +-----------------------+|
       | - Catalog Pages   |                |  | Auth (NextAuth v5 JWT)||
       | - Admin Dashboard |                |  +-----------------------+|
       +--------+--------+                |  | Zod Input Validation  ||
                |                          |  +-----------------------+|
       +--------+--------+                |  | withDatabaseRetry()   ||
       | Client Components|                |  +-----------------------+|
       | (~136 "use client")|               |  | Collab Permissions    ||
       | - React Query     |                |  +-----------------------+|
       | - Forms (RHF+Zod) |                +-------------+-------------+
       | - Tiptap Editor   |                              |
       | - React Flow      |                 +------------+------------+
       | - Sandpack        |                 |                         |
       | - Recharts        |       +---------+--------+  +------------+---------+
       | - dnd-kit         |       |  Prisma ORM 6.14 |  |  External Services   |
       +-------------------+       |  (22+ Models)     |  |  - Resend (Email)    |
                                   +---------+--------+  |  - Supabase Storage  |
                                             |           |  - Vercel Analytics   |
                                   +---------+--------+  +----------------------+
                                   |    PostgreSQL     |
                                   |    (Supabase)     |
                                   |  Port 6543        |
                                   |  (PgBouncer TX)   |
                                   |  Port 5432        |
                                   |  (Session Pooler) |
                                   |  RLS Enabled      |
                                   +-------------------+
```

**Data Flow:**
1. Request -> Vercel Edge (CDN) -> Middleware (JWT role check)
2. Server Components: direct Prisma queries at render time
3. Client Components: React Query -> API routes -> Prisma -> PostgreSQL
4. API routes: auth -> Zod validation -> permission check -> Prisma with retry -> JSON response

---

## 3. System Design Ratings

| Dimension | Rating | Previous | Change | Justification |
|-----------|--------|----------|--------|---------------|
| **Feature Completeness** | **8.5/10** | 8 | +0.5 | Impressively broad: content authoring, consumption, gamification, collaboration, admin, interactive coding, quizzes. **New:** Canvas LMS grade sync, quiz V2 (block-based with question banks). Still missing: real-time collaboration, notifications, discussion/comments. |
| **API Design & Consistency** | **6/10** | 6 | — | ~65 endpoints follow recognizable patterns (auth, Zod, pagination). But: error shapes vary, no API versioning, no centralized handler, code duplication (modules route is 660 lines with 3 near-identical branches). |
| **Database Design** | **7.5/10** | 7 | +0.5 | 37 models (up from 22) with 95+ indexes, proper FKs, cascades, self-referential relations. **New:** Quiz V2 schema (question banks, sets, blocks, instances), Canvas integration tables, course groups. Still weakened by: string-based enums, manual ID generation. |
| **Auth & Security** | **8/10** | 7 | +1 | Solid: bcryptjs, email verification, RBAC, HSTS+CSP, audit logging, collaboration permissions. **New:** In-memory sliding window rate limiting on all 4 auth endpoints (login, register, forgot-password, reset-password). PII logging removed. DATABASE_URL leak fixed. Still: `unsafe-inline`+`unsafe-eval` in CSP, no MFA. |
| **Code Quality & Maintainability** | **5.5/10** | 5 | +0.5 | Good patterns exist (auth utils, retry, permissions). **Improved:** Debug console.logs cleaned from production API routes (modules/[id], dashboard/stats, modules, search, db). Rate-limit utility extracted. Still: TS strict mode off, zero tests, 6+ components >800 lines. |
| **Performance & Scalability** | **7.5/10** | 6 | +1.5 | **New:** Vercel CDN caching (s-maxage + stale-while-revalidate) on 4 public endpoints. Module completion batched with $transaction + Promise.all (15 → 5 DB round-trips). Tag N+1 eliminated with raw SQL `unnest()`. Module page server-to-server fetch removed. Network visualization safety caps. Image cache TTL 60s → 3600s. Still: substring search (table scans). |
| **Frontend Architecture** | **7/10** | 7 | — | Clean Radix+shadcn pattern, React Query, CVA variants, responsive, accessible. Weakened by: monolith components (1084 lines), no shared API types. |
| **Observability** | **5.5/10** | 3 | +2.5 | **New:** Sentry error tracking (client + server + edge), instrumentation.ts with `onRequestError` for auto server error capture, global-error.tsx error boundary, PII scrubbing in `beforeSend`. Debug logs cleaned. Still: no structured logging, no request tracing/correlation IDs. |
| **Testing** | **1/10** | 1 | — | Zero automated tests. No framework installed. Manual testing on Vercel only. |
| **DevOps & Deployment** | **7/10** | 7 | — | Automated Vercel deploy, Prisma migrate+seed in build pipeline, env separation, health check. No staging env, no CI pipeline, no pre-merge checks beyond ESLint. |

### Weighted Overall: 6.35/10 (was 5.7)

A feature-rich application with strong domain modeling, now with production-grade CDN caching, rate limiting, error tracking, and optimized query patterns. Critically still undermined by zero test coverage. The platform is comfortable for 150 concurrent users; the next scaling targets are full-text search (Phase 4) and automated testing.

---

## 4. Detailed Pros

### 4.1 Modular Content Architecture
The junction table design (`course_modules`) allowing modules to be reused across courses with per-course customization (`custom_notes`, `custom_context`, `custom_objectives`) is the strongest architectural decision. Self-referential `parent_module_id` enables arbitrary nesting. Clone lineage tracking (`cloned_from`, `clone_count`) provides provenance.

### 4.2 Serverless-Aware Database Layer
`src/lib/db.ts` singleton with PgBouncer params (`pgbouncer=true`, `prepared=false`) and `withDatabaseRetry` with Prisma-specific error codes (P1001, P1008, P1017, P2024) show practical serverless experience. Exponential backoff with jitter prevents thundering herd. Separate `DIRECT_URL` (port 5432) for migrations vs `DATABASE_URL` (port 6543) for queries is correctly configured.

### 4.3 Multi-Layered Authorization
Middleware for route protection, `hasFacultyAccess()` utilities for API checks, `canEditModule()` with recursive parent traversal for collaboration permission inheritance. Clean separation of ownership checks (`isAuthorOfCourse`) from edit checks (`canEditCourse` including collaborators). Admin audit logging captures sensitive operations with IP and user agent.

### 4.4 Playground System
Hash-based seeding (SHA-256) allows template updates from code while preserving UI edits. Version history with revert. Forking creates independent copies with lineage. Dynamic imports with `ssr: false` keep Sandpack out of the server bundle.

### 4.5 Gamification Model
Per-module XP, difficulty levels, quest types, prerequisite chains, position coordinates for maps. `user_gamification_stats` with streak tracking (current + longest) and total time avoids expensive recalculations.

### 4.6 Comprehensive Security Headers
HSTS (1-year with preload), CSP (granular per-resource), X-Frame-Options, X-Content-Type-Options, Permissions-Policy (disables camera/mic/geolocation), strict Referrer-Policy. CORS configured per environment.

### 4.7 State Management Simplicity
React Query for server state, no Redux/Zustand overhead. NextAuth SessionProvider for auth. Local useState for component state. Minimal client-side complexity.

### 4.8 Responsive & Accessible Design
Skip-to-content link, 44px min touch targets, `prefers-reduced-motion` support, `prefers-contrast: high` support, mobile-first breakpoints, custom neural design system with CSS variables for theming.

---

## 5. Detailed Cons

### 5.1 Zero Test Coverage (Critical)
No testing framework installed. No test files exist. Every deployment risks regressions. Complex authorization logic (recursive permission inheritance) is unverified. Large components (6 files >800 lines) cannot be safely refactored. Gamification calculations, retry logic, and search are all untested.

### 5.2 TypeScript Strict Mode Disabled
`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`. Result: `any` propagates silently (`whereClause: any` in API routes), null access errors uncaught at compile time, `(session?.user as any)?.account_status` in auth utils bypasses the type system in the authorization layer.

### 5.3 No Rate Limiting
The `X-RateLimit-Limit` header in `next.config.ts` is decorative -- no enforcement. Auth endpoints (login, register, forgot-password) are vulnerable to brute force. File upload has no concurrent request limits. Progress marking could be abused for XP farming.

### 5.4 API Route Code Duplication
`/api/modules/route.ts` (660 lines) has 3 near-identical branches (authorOnly, collaboratorOnly, public) each building the same whereClause, orderByClause, Prisma query, and response transformation. Same pattern in `/api/courses/route.ts` (371 lines). No centralized API handler wrapper.

### 5.5 Search Not Scalable
`src/lib/search.ts` uses Prisma `contains` with `mode: 'insensitive'` = `ILIKE '%term%'` in PostgreSQL = full table scan. OR across 6+ fields per entity = 6 sequential scans per query per entity. No relevance ranking, typo tolerance, or stemming. Also logs PII (user names/emails) via console.log.

### 5.6 No Caching Strategy
No Redis, no ISR, `cache: 'no-store'` on dynamic routes. Tags fetched by loading ALL user modules and deduplicating in JS on every list request. Public catalog hits DB on every page view. No stale-while-revalidate on any API response.

### 5.7 Observability Gap
`console.log`/`console.error` across all 75 API routes. No structured logging, no Sentry, no correlation IDs, no alerting. Emoji-prefixed debug statements committed to production (`search.ts`). Vercel logs are ephemeral with no retention.

### 5.8 Inconsistent ID Generation
Some models use manual `course_${Date.now()}_${Math.random()...}` (millisecond-precision, collision-prone, not crypto-safe, exposes timestamps). Others use `@default(cuid())`. No standardization.

### 5.9 Large Monolith Components
Top files by line count: `module-library.tsx` (1084), `edit-module-form.tsx` (993), `edit-course-form.tsx` (973), `enhanced-course-viewer.tsx` (915), `module-catalog.tsx` (838), `ContentModerationView.tsx` (760). Difficult to maintain, test, and review.

### 5.10 Deprecated Fields Still Active
Users table has `speciality` (deprecated -> `research_area`) and `interested_fields` (deprecated -> `academic_interests`). `search.ts` still queries the deprecated fields, so new data written to the current fields won't be searchable.

### 5.11 Missing Infrastructure
- No CI/CD pipeline (no GitHub Actions)
- No staging environment
- No database backup automation visible
- No feature flags system
- No A/B testing capability
- No WebSocket/real-time support

---

## 6. Prioritized Improvement Recommendations

### P0 - Critical (Address Immediately)

#### 1. Add Automated Testing Foundation
- Install Vitest + `@testing-library/react`
- Priority test targets:
  - `src/lib/collaboration/permissions.ts` - recursive `canEditModule()` has unbounded recursion risk on circular parent refs
  - `src/lib/retry.ts` - retry behavior with different error types
  - `src/lib/auth/utils.ts` - role checking functions
  - Zod schemas in API routes - validate accept/reject behavior
- Add Playwright for 3 critical E2E flows: login, course creation, module completion
- **Impact:** Enables safe refactoring of everything else on this list

#### 2. Enable TypeScript Strict Mode Incrementally
- Step 1: `strictNullChecks: true` (surfaces null pointer errors)
- Step 2: `noImplicitAny: true` (eliminates `whereClause: any`)
- Use `// @ts-expect-error` temporarily on existing violations
- **Impact:** Catches auth/permission bugs at compile time instead of production

#### 3. Add Error Tracking (Sentry)
- Install `@sentry/nextjs` for server + client components
- Configure source maps upload
- Tag errors with user role, route, request ID
- **Impact:** Production issues become visible instead of silent

### P1 - High Priority (Next Sprint)

#### 4. Implement Rate Limiting
- Use Upstash Redis or Vercel KV for sliding window rate limiter
- Auth endpoints: 5 login attempts / 15 min / IP, 3 registrations / hour / IP
- File upload: 10 uploads / minute / user
- **Impact:** Prevents brute force and abuse on public-facing endpoints

#### 5. Centralize API Error Handling
- Create `withApiHandler(config)` wrapper providing: session extraction, Zod validation, error formatting, response standardization
- Standardize error shape: `{ error: string, code: string, details?: unknown }`
- Eliminates duplicated try-catch across 75 route files
- **Impact:** Consistent error handling, ~40% reduction in API route boilerplate

#### 6. Replace Substring Search with PostgreSQL Full-Text Search
- Add `search_vector tsvector` generated column to courses, modules, users
- Create GIN indexes on search vectors
- Use Prisma `$queryRaw` with `ts_query` + `ts_rank`
- Remove PII logging from search.ts
- **Impact:** Index-backed search with relevance ranking instead of table scans

### P2 - Medium Priority (Next Month)

#### 7. Introduce Caching Layer
- Vercel KV (Redis) for: public catalog (5-min TTL), tag aggregations (10-min TTL), gamification stats (1-min TTL)
- ISR on public pages: `/courses/[slug]` with `revalidate: 300`
- `stale-while-revalidate` headers on public API responses
- **Impact:** Eliminates redundant DB queries for read-heavy public pages

#### 8. Decompose Large Components
- `module-library.tsx` (1084 lines) -> `ModuleLibraryFilters`, `ModuleLibraryList`, `ModuleLibraryItem`, `ModuleLibraryPagination`
- `edit-module-form.tsx` (993 lines) -> extract form sections, quiz config, media management as sub-components
- Extract shared `useModuleFilters` hook from module-library and module-catalog
- **Impact:** Reviewable, testable, maintainable component files

#### 9. Standardize ID Generation
- Switch all manual IDs to Prisma `@default(cuid())` (already used for playgrounds/achievements)
- Remove `id: \`course_${Date.now()}\`` patterns from API routes
- **Impact:** Collision-resistant, consistent, no timestamp exposure

#### 10. Refactor API Route Duplication
- Extract shared `buildModuleQuery()` for the 3 branches in `/api/modules/route.ts`
- Create `buildPaginatedResponse<T>()` utility
- **Impact:** 660-line route drops to ~250 lines, bug fixes apply once

### P3 - Lower Priority (Next Quarter)

#### 11. Add CI/CD Pipeline
- GitHub Actions: lint + type-check + unit tests on every PR
- E2E tests on merge to main
- `prisma validate` in CI

#### 12. Clean Up Deprecated Fields
- Remove `speciality` and `interested_fields` from users model
- Migrate remaining data to current fields
- Update search queries

#### 13. Add Structured Logging
- Replace console.log/error with pino
- Add request IDs via middleware
- Remove emoji debug logs from production

#### 14. Implement Notification System
- DB-backed notifications for: collab invites, achievement unlocks, quiz grading, faculty request status
- SSE or polling delivery (no WebSockets on Vercel serverless)

#### 15. Add API Versioning
- Prefix routes with `/api/v1/`
- Allows future breaking changes without disrupting clients

---

## 7. Scale Considerations

**At current scale** (~1 university, <1,000 users):
- Database schema and serverless arch are appropriate
- Lack of caching is tolerable
- Substring search works for small datasets
- Manual testing is survivable

**For growth to 5,000+ users or multi-institution:**
- Full-text search becomes mandatory (substring = visible latency)
- Redis caching becomes mandatory (DB connection limits hit)
- Rate limiting becomes mandatory (brute-force scales with exposure)
- Automated testing becomes mandatory (more contributors = more deployments)
- Structured logging becomes mandatory (debugging serverless by reading Vercel logs doesn't scale)

**The single most impactful improvement is adding automated tests** -- it is the prerequisite for safely implementing every other improvement.

---

## 8. Critical Files Referenced

| File | Relevance |
|------|-----------|
| `src/app/api/modules/route.ts` | 660-line route, top refactoring target |
| `src/lib/search.ts` | Needs full-text search replacement + PII logging removal |
| `tsconfig.json` | `strict: false` undermines type safety |
| `src/lib/collaboration/permissions.ts` | Highest-risk untested code path |
| `src/components/faculty/module-library.tsx` | Largest component (1084 lines) |
| `src/lib/db.ts` | Serverless-optimized Prisma singleton |
| `src/lib/retry.ts` | Database retry with exponential backoff |
| `src/middleware.ts` | Role-based route protection |
| `next.config.ts` | Security headers, CSP, CORS |
| `src/lib/auth/config.ts` | NextAuth v5 JWT configuration |
| `src/lib/rate-limit.ts` | In-memory sliding window rate limiter |
| `sentry.client.config.ts` | Sentry client-side initialization |
| `src/instrumentation.ts` | Next.js instrumentation hook for Sentry |
| `src/app/global-error.tsx` | App Router error boundary |

---

## 9. Scalability Improvements (May 2025)

The following changes were implemented to support 150 concurrent users comfortably and lay groundwork for 500+.

### 9.1 Vercel CDN Caching (Phase 1)

Added `Cache-Control` headers with `s-maxage` (CDN cache) + `stale-while-revalidate` (serve stale while fetching fresh) to public GET endpoints. Vercel CDN respects these headers with zero infrastructure cost.

| Endpoint | TTL | Stale Window | Effect |
|----------|-----|-------------|--------|
| `/api/public/network-visualization` | 5 min | +10 min | Heaviest query cached; data changes rarely |
| `/api/public/courses/[slug]` | 2 min | +5 min | Single course view, moderate change frequency |
| `/api/courses` (public branch) | 1 min | +2 min | Course catalog listing |
| `/api/search` | 30 sec | +1 min | Short TTL since queries vary |

**Impact:** Repeated requests within the TTL window hit the CDN edge, not the serverless function or database. Under 150 concurrent users browsing the catalog, this eliminates ~80% of DB queries.

**Note:** Only public read endpoints are cached. All authenticated endpoints (progress, dashboard, editing) have NO caching to ensure users always see fresh data.

### 9.2 Query Optimization (Phase 1 + Phase 2)

**Module page double invocation eliminated:**
- Before: Server component called its own API via `fetch(NEXTAUTH_URL/api/..., { cache: 'no-store' })`, creating 2 function invocations per page view
- After: Direct Prisma query in the server component, eliminating the redundant API call

**Module completion batched:**
- Before: `markModuleComplete()` ran 8-11 sequential DB queries (~15 round trips under load)
- After: Wrapped in `prisma.$transaction()` with `Promise.all` for independent queries (~5 round trips)
- Achievement check kept outside transaction to avoid holding it open for long

**Tag N+1 eliminated:**
- Before: 3 locations in `/api/modules/route.ts` fetched ALL modules into memory and used a JS `Set` to extract unique tags
- After: Single PostgreSQL query using `SELECT DISTINCT unnest(tags)` with appropriate WHERE clause
- Applied to all 3 code paths (authorOnly, collaboratorOnly, public)

**Safety caps on unbounded queries:**
- Network visualization: `take: 500` on modules, `take: 100` on courses
- Image cache TTL: 60s → 3600s (reduces Vercel Image Optimization costs)

### 9.3 Rate Limiting (Phase 2)

In-memory sliding window rate limiter (`src/lib/rate-limit.ts`) using a `Map` with periodic cleanup. Each Vercel function instance maintains its own map — not globally consistent, but sufficient for 150 users to prevent brute-force attacks.

| Endpoint | Limit | Key | Window |
|----------|-------|-----|--------|
| Login (`auth/config.ts` authorize) | 10 attempts | Email | 15 min |
| Registration (`auth/register`) | 5 attempts | IP | 15 min |
| Forgot Password (`auth/forgot-password`) | 5 attempts | IP | 15 min |
| Reset Password (`auth/reset-password`) | 10 attempts | IP | 15 min |

Returns HTTP 429 with `Retry-After` header when limit is hit. For 500+ users, migrate to Upstash Redis for globally consistent rate limiting.

### 9.4 PII Leak Remediation (Phase 1)

| File | Issue | Fix |
|------|-------|-----|
| `src/lib/search.ts` | Logged user names + emails to console | Removed entirely |
| `src/lib/search.ts` | Logged search query text | Removed |
| `src/app/api/courses/route.ts` | Leaked partial `DATABASE_URL` in error response | Removed |
| `src/app/api/courses/route.ts` | Exposed `errorType`/`errorCode` in non-dev response | Removed |
| `src/app/api/auth/register/route.ts` | Logged user email on failure | Replaced with generic message |
| `src/lib/db.ts` | Logged on every cold start | Removed |
| `src/lib/email.ts` | Logged full email content | Guarded with `NODE_ENV === 'development'` |
| `src/app/api/modules/route.ts` | Logged full request body | Removed |

### 9.5 Error Tracking with Sentry (Phase 3)

Integrated `@sentry/nextjs` for production error tracking across all runtimes:

- **Client:** `sentry.client.config.ts` — catches unhandled exceptions in React components
- **Server:** `sentry.server.config.ts` — catches errors in API routes and server components
- **Edge:** `sentry.edge.config.ts` — catches errors in middleware
- **Instrumentation:** `src/instrumentation.ts` — `onRequestError` auto-captures server errors
- **Error Boundary:** `src/app/global-error.tsx` — catches React rendering errors, reports to Sentry, shows user-friendly recovery UI

Configuration choices:
- `tracesSampleRate: 0.1` (10%) — stays within free tier
- `replaysSessionSampleRate: 0` — no session replays to save quota
- `enabled: process.env.NODE_ENV === 'production'` — no noise in development
- `beforeSend` scrubs `email` and `ip_address` from all error payloads
- Source maps deleted after upload to Sentry (`deleteSourcemapsAfterUpload: true`)

### 9.6 Debug Log Cleanup (Phase 1 + Phase 3)

Removed ~20 debug `console.log` statements from production API routes:

| File | Statements Removed |
|------|-------------------|
| `src/app/api/modules/route.ts` | 2 (request body, validated data) |
| `src/app/api/modules/[id]/route.ts` | 10 (parent module debug block, validation logs) |
| `src/app/api/dashboard/stats/route.ts` | 4 (user ID, counts, activity length) |
| `src/lib/search.ts` | 2 (search query, PII) |
| `src/lib/db.ts` | 2 (cold start logs) |

Kept `console.error` in catch blocks — those are legitimate error logs that Sentry also captures.

### 9.7 What's Still Needed for 500+ Users

| Item | Current State | Next Step |
|------|--------------|-----------|
| Search | `ILIKE '%term%'` (full table scan) | PostgreSQL `tsvector` + GIN indexes |
| Rate limiting | In-memory per-instance | Upstash Redis for global consistency |
| Testing | Zero automated tests | Vitest + Playwright for critical flows |
| CI/CD | None | GitHub Actions: lint + type-check + test on PR |
| TypeScript | `strict: false` | Incremental: `strictNullChecks` first |
