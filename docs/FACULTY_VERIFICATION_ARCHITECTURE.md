# Faculty Verification & Content Moderation Architecture

**Document Version:** 1.0
**Date:** January 2025
**Status:** Architecture Recommendation
**Author:** Development Team (Senior Architect Analysis)

---

## Executive Summary

This document provides a critical architectural analysis of faculty verification and content moderation strategies for the BCS E-Textbook Platform. It evaluates the proposed ADMIN approval system, identifies critical flaws, and recommends a hybrid solution combining tiered permissions with domain whitelisting for optimal security, user experience, and scalability.

**Key Recommendation:** Implement content moderation (not user gating) with a tiered permission system and institutional email domain whitelisting.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Proposed Solution Analysis](#proposed-solution-analysis)
3. [Critical Issues Identified](#critical-issues-identified)
4. [Alternative Solutions](#alternative-solutions)
5. [Recommended Architecture](#recommended-architecture)
6. [Implementation Specification](#implementation-specification)
7. [Integration with Student System](#integration-with-student-system)
8. [Migration Path](#migration-path)

---

## Problem Statement

### Current System State

**What Works:**
- ✅ Faculty can register and create content
- ✅ Email verification required before login
- ✅ Content has public/private visibility controls
- ✅ Modules have draft/published status

**The Gap:**
- ❌ Anyone can register as faculty and publish content
- ❌ No mechanism to prevent spam or low-quality content from appearing publicly
- ❌ No administrative oversight of who becomes faculty
- ❌ Default visibility is public, meaning unvetted content can be published immediately

### Business Requirements

1. **Content Quality Control:** Prevent spam, low-quality, or inappropriate content from appearing on the platform
2. **Faculty Vetting:** Ensure only legitimate educators can create and publish educational content
3. **Institutional Trust:** Maintain platform credibility for university partnerships
4. **User Experience:** Don't create friction for legitimate faculty during registration/onboarding
5. **Scalability:** Solution must scale to hundreds of faculty without creating bottlenecks

---

## Proposed Solution Analysis

### Original Proposal: ADMIN User Approval

**Proposed Flow:**
```
Faculty Registration
  ↓
Email Verification (existing)
  ↓
User Login Allowed
  ↓
ADMIN Approval Required ← NEW STEP
  ↓
Faculty Can Create Content
```

**Implementation Details:**
- Create ADMIN role shared between development team and client
- Every faculty registration triggers approval request to ADMIN
- Faculty cannot create content until ADMIN manually approves their account
- ADMIN credentials restricted to 2-3 people

---

## Critical Issues Identified

### Issue #1: ADMIN Becomes a Bottleneck

**Problem:** Every single faculty registration requires manual ADMIN intervention.

**Impact Analysis:**
- Faculty registers on Friday evening → Must wait until Monday for approval
- 10 faculty register during conference → ADMIN must process 10 requests manually
- ADMIN on vacation → Registration flow completely blocked

**Real-World Scenario:**
```
Week 1: 5 faculty register
Week 2: 12 faculty register (conference season)
Week 3: ADMIN on vacation, 8 faculty stuck pending
Week 4: 15 faculty register (semester start)

Total ADMIN workload: 40 manual approvals in 4 weeks
Average wait time per faculty: 24-72 hours
```

**Verdict:** Does not scale beyond pilot phase.

---

### Issue #2: Poor User Experience

**Problem:** Faculty complete registration but cannot use the platform.

**Confusion Points:**
1. Faculty verifies email ✅ → "You're all set!" message
2. Faculty logs in ✅ → Sees faculty dashboard
3. Faculty tries to create module ❌ → "Pending admin approval"
4. Faculty waits... hours? days? No indication of timeline
5. Faculty loses interest or uses competitor platform

**Psychological Impact:**
- Frustration: "I completed registration, why can't I start?"
- Uncertainty: "How long do I wait? Is my account broken?"
- Abandonment: 50-70% of users don't return after initial rejection

**Verdict:** Creates significant onboarding friction for legitimate users.

---

### Issue #3: Unclear Approval Criteria

**Problem:** What is ADMIN actually approving?

**Questions Without Answers:**
- Is ADMIN verifying the person is a real educator?
- Is ADMIN checking their credentials/CV?
- Is ADMIN validating their institutional affiliation?
- Is ADMIN just clicking "approve" on everyone?

**Practical Reality:**
Without defined criteria, ADMIN will likely:
- Approve everyone who "looks legitimate" (subjective)
- Approve based on email domain (@illinois.edu = auto-yes)
- Struggle with edge cases (visiting professors, independent educators, international faculty)

**Verdict:** Approval process is arbitrary without clear standards.

---

### Issue #4: Doesn't Prevent Spam Content

**Problem:** Once approved, faculty can still create spam/low-quality content.

**Attack Scenario:**
```
1. Bad actor registers with legitimate-looking details
2. ADMIN approves (no way to verify credentials remotely)
3. Bad actor creates 50 spam modules in one day
4. All 50 modules published immediately
5. Platform credibility damaged
```

**Root Cause:** This approach gates the **person**, not the **content**.

**Verdict:** Solves the wrong problem. We need content moderation, not user moderation.

---

### Issue #5: Scalability Concerns

**Workload Analysis:**

| Scenario | Faculty Registrations | ADMIN Hours/Week | Wait Time | Verdict |
|----------|---------------------|-----------------|-----------|---------|
| Pilot (Month 1) | 10 total | 1 hour | 1-2 days | ✅ Manageable |
| Growth (Month 6) | 50 total | 3 hours | 2-4 days | ⚠️ Friction |
| Scale (Year 1) | 200 total | 10 hours | 5-7 days | ❌ Bottleneck |
| Institutional (Year 2) | 500+ total | 25+ hours | 7-14 days | ❌ Broken |

**Conclusion:** Linear scaling of ADMIN workload is unsustainable.

---

## Alternative Solutions

### Solution 1: Content Moderation (Not User Moderation)

**Concept:** Gate what gets published, not who registers.

**Architecture:**
```
Faculty Registration
  ↓
Email Verification
  ↓
Login Immediately ✅
  ↓
Create Content Immediately ✅
  ↓
Content Defaults to DRAFT
  ↓
Faculty Publishes → Enters Moderation Queue
  ↓
ADMIN Reviews Content (Not User)
  ↓
Content Approved → Goes Public
```

**Advantages:**
- ✅ No registration bottleneck - faculty start working immediately
- ✅ ADMIN reviews actual content (the real concern)
- ✅ Better scalability - review 10 modules vs 100 user accounts
- ✅ Content quality directly assessed
- ✅ Faculty can prepare content while awaiting review

**Implementation:**
```prisma
// Existing schema already supports this!
model modules {
  status String @default("draft")  // Already exists

  // Add moderation fields
  moderation_status String @default("pending")  // "pending" | "approved" | "rejected"
  moderated_by String?  // admin user_id
  moderated_at DateTime?
  moderation_notes String?  // Reason for rejection
}
```

**ADMIN Workflow:**
1. ADMIN sees "Pending Moderation" queue in dashboard
2. ADMIN reviews module content, quality, appropriateness
3. ADMIN approves or rejects with feedback
4. Approved content goes public, rejected content stays draft

**Verdict:** ⭐⭐⭐⭐⭐ Solves the actual problem, scales well, good UX.

---

### Solution 2: Tiered Permissions System

**Concept:** Progressive trust model based on verification level.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Unverified Faculty (New Registrations)             │
├─────────────────────────────────────────────────────────────┤
│ - Email verified: ✅                                        │
│ - Can create content: ✅                                    │
│ - Content defaults to: DRAFT                                │
│ - Can publish: ❌ (Must request ADMIN review)               │
└─────────────────────────────────────────────────────────────┘
                        ↓
        ADMIN Approval OR Auto-Verification
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Tier 2: Verified Faculty                                    │
├─────────────────────────────────────────────────────────────┤
│ - Institutional email (@illinois.edu): ✅                   │
│ - Can create content: ✅                                    │
│ - Content defaults to: DRAFT                                │
│ - Can publish: ✅ (Goes to moderation queue)                │
└─────────────────────────────────────────────────────────────┘
                        ↓
          5+ Approved Publications
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Tier 3: Trusted Faculty (Earned Reputation)                │
├─────────────────────────────────────────────────────────────┤
│ - Track record: 5+ approved modules                         │
│ - Can create content: ✅                                    │
│ - Content defaults to: PUBLISHED ✅                         │
│ - No review needed (unless flagged)                         │
└─────────────────────────────────────────────────────────────┘
```

**Advantages:**
- ✅ Institutional faculty (@illinois.edu) get automatic verification
- ✅ External faculty can register but need verification
- ✅ Trust increases over time (reduces ADMIN workload)
- ✅ Bad actors identified and demoted quickly
- ✅ Reputation system incentivizes quality

**Implementation:**
```prisma
model users {
  // Existing fields...
  role String @default("faculty")

  // NEW: Tiered verification
  verification_tier String @default("unverified")  // "unverified" | "verified" | "trusted"
  verified_by String?  // admin user_id who approved
  verified_at DateTime?
  verification_notes String?  // Why approved/rejected

  // Institutional affiliation
  email_domain String?  // Extracted from email
  is_institutional_email Boolean @default(false)  // Auto-detected @illinois.edu

  // Reputation tracking
  published_modules_count Int @default(0)
  approved_modules_count Int @default(0)
}
```

**Auto-Verification Logic:**
```typescript
// During registration
const emailDomain = email.split('@')[1]
const isInstitutional = emailDomain === 'illinois.edu' // Or check whitelist

if (isInstitutional) {
  verification_tier = 'verified'
  is_institutional_email = true
} else {
  verification_tier = 'unverified'
  // Must request ADMIN approval to publish
}
```

**Verdict:** ⭐⭐⭐⭐⭐ Optimal solution for university platform. Combines automation with oversight.

---

### Solution 3: Domain Whitelisting

**Concept:** Auto-approve specific institutional email domains.

**Architecture:**
```prisma
model email_domain_whitelist {
  id String @id @default(cuid())
  domain String @unique  // "illinois.edu", "mit.edu", etc.
  institution_name String  // "University of Illinois"
  auto_approve Boolean @default(true)
  added_by String  // admin user_id
  added_at DateTime @default(now())
}
```

**Registration Logic:**
```typescript
const emailDomain = email.split('@')[1]

// Check if domain is whitelisted
const whitelistedDomain = await prisma.email_domain_whitelist.findUnique({
  where: { domain: emailDomain }
})

if (whitelistedDomain && whitelistedDomain.auto_approve) {
  user.verification_tier = 'verified'
  user.can_publish = true
} else {
  user.verification_tier = 'unverified'
  user.can_publish = false  // Must request ADMIN approval
}
```

**Advantages:**
- ✅ University faculty get instant access (no waiting)
- ✅ External faculty can still register (pending review)
- ✅ Scales to multiple institutions (just add domains)
- ✅ Aligns with academic platform identity

**Verdict:** ⭐⭐⭐⭐⭐ Perfect complement to tiered permissions.

---

### Solution 4: Invitation-Only System

**Concept:** Only ADMIN or existing faculty can invite new faculty.

**Pros:**
- ✅ Complete control over who joins
- ✅ No spam registrations
- ✅ Pre-approval via invitation

**Cons:**
- ❌ Limits organic growth
- ❌ ADMIN must manually invite everyone
- ❌ Poor for open educational platforms

**Verdict:** ⭐⭐ Too restrictive for a platform aiming for growth.

---

## Recommended Architecture

### Hybrid Solution: Tiered Permissions + Domain Whitelisting + Content Moderation

**Why This Combination:**
1. **Domain Whitelisting** → Eliminates bottleneck for institutional faculty
2. **Tiered Permissions** → Progressive trust for external faculty
3. **Content Moderation** → Quality control on actual content

**Complete Flow:**

#### Phase 1: Faculty Registration
```typescript
Faculty submits: name, email, password
  ↓
Email verification sent (existing)
  ↓
Email verified → Extract domain
  ↓
Check domain whitelist:

  IF domain = "illinois.edu":
    verification_tier = "verified"
    can_publish = true
    Welcome email: "You're verified! Start creating."

  ELSE:
    verification_tier = "unverified"
    can_publish = false
    Welcome email: "Account created. To publish content, request verification."
```

#### Phase 2: Content Creation
```typescript
All faculty (verified or unverified):
  ↓
Can login immediately ✅
  ↓
Can create modules/courses ✅
  ↓
Content defaults to DRAFT status
  ↓
Faculty clicks "Publish":

  IF verification_tier = "unverified":
    → Error: "Request verification to publish content"
    → Show button: "Request Verification"

  IF verification_tier = "verified":
    → Module status = "published"
    → Module moderation_status = "pending"
    → Module enters moderation queue
    → Notify faculty: "Published! Under review."

  IF verification_tier = "trusted":
    → Module status = "published"
    → Module moderation_status = "approved"
    → Module goes live immediately
    → No review needed (unless flagged)
```

#### Phase 3: ADMIN Moderation Dashboard
```typescript
ADMIN Dashboard Shows:

1. Verification Requests (Unverified Faculty)
   - List of faculty pending verification
   - Shows: name, email, registration date, sample content
   - Actions: Approve, Reject (with reason)

2. Content Moderation Queue (Pending Published Content)
   - List of published modules awaiting approval
   - Shows: title, author, publish date, preview
   - Actions: Approve, Reject, Flag for revision

3. Flagged Content (User Reports)
   - Modules reported by users
   - Shows: report reason, module, reporter
   - Actions: Review, Take down, Dismiss

4. Faculty Management
   - Promote verified → trusted (after 5 approved modules)
   - Demote trusted → verified (if quality drops)
   - Ban users (spam/abuse)
```

#### Phase 4: Reputation System
```typescript
// Automatic promotion to "trusted" tier
ON module_approval:
  user.approved_modules_count++

  IF user.approved_modules_count >= 5:
    user.verification_tier = "trusted"
    notify_user("Congratulations! You're now a trusted faculty member.")

// Automatic demotion if content gets rejected
ON module_rejection:
  user.rejected_modules_count++

  IF user.rejected_modules_count >= 3:
    user.verification_tier = "verified"  // Demote from trusted
    notify_user("Your content requires review again.")
```

---

## Implementation Specification

### Database Schema Changes

```prisma
// ========================================
// 1. USERS TABLE - Add Verification Fields
// ========================================
model users {
  // Existing fields...
  id              String    @id
  email           String    @unique
  password_hash   String
  name            String
  role            String    @default("faculty")  // "student" | "faculty" | "admin"
  email_verified  Boolean   @default(false)

  // ========================================
  // NEW: Tiered Verification System
  // ========================================
  verification_tier String @default("unverified")  // "unverified" | "verified" | "trusted"
  verified_by       String?  // admin user_id who approved
  verified_at       DateTime?
  verification_notes String? @db.Text  // Reason for approval/rejection
  verification_requested_at DateTime?  // When user requested verification

  // ========================================
  // NEW: Institutional Email Detection
  // ========================================
  email_domain            String?  // Extracted from email (e.g., "illinois.edu")
  is_institutional_email  Boolean @default(false)  // Auto-detected from whitelist

  // ========================================
  // NEW: Reputation Tracking
  // ========================================
  published_modules_count Int @default(0)
  approved_modules_count  Int @default(0)
  rejected_modules_count  Int @default(0)

  // Existing relations...
  modules modules[]
  courses courses[]
}

// ========================================
// 2. MODULES TABLE - Add Moderation Fields
// ========================================
model modules {
  // Existing fields...
  id          String @id
  title       String
  content     String @db.Text
  status      String @default("draft")  // "draft" | "published"
  visibility  String @default("public")  // "public" | "private"

  // ========================================
  // NEW: Content Moderation System
  // ========================================
  moderation_status String @default("pending")  // "pending" | "approved" | "rejected"
  moderated_by      String?  // admin user_id who reviewed
  moderated_at      DateTime?
  moderation_notes  String? @db.Text  // Feedback/reason for rejection

  // ========================================
  // NEW: User Reporting System
  // ========================================
  flagged_count     Int @default(0)  // Number of user reports
  flagged_at        DateTime?
  flagged_by        String[]  // Array of user_ids who flagged
  flag_reasons      String[]  // Array of report reasons

  // Existing relations...
  author_id String
  author    users @relation(fields: [author_id], references: [id])
}

// ========================================
// 3. NEW TABLE: Email Domain Whitelist
// ========================================
model email_domain_whitelist {
  id               String   @id @default(cuid())
  domain           String   @unique  // "illinois.edu", "mit.edu", etc.
  institution_name String   // "University of Illinois at Urbana-Champaign"
  auto_approve     Boolean  @default(true)  // Auto-verify users from this domain
  added_by         String   // admin user_id who added this domain
  added_at         DateTime @default(now())
  updated_at       DateTime @updatedAt

  @@index([domain])
}

// ========================================
// 4. NEW TABLE: Verification Requests
// ========================================
model verification_requests {
  id              String   @id @default(cuid())
  user_id         String
  user            users    @relation(fields: [user_id], references: [id])
  requested_at    DateTime @default(now())
  status          String   @default("pending")  // "pending" | "approved" | "rejected"

  // Admin review
  reviewed_by     String?  // admin user_id
  reviewed_at     DateTime?
  review_notes    String?  @db.Text

  // Supporting information
  justification   String?  @db.Text  // Why user wants verification
  institution     String?  // Self-reported institution
  credentials_url String?  // Link to CV/website/profile

  @@index([user_id])
  @@index([status])
}

// ========================================
// 5. NEW TABLE: Content Moderation Log
// ========================================
model moderation_log {
  id          String   @id @default(cuid())
  module_id   String?
  course_id   String?
  action      String   // "approved" | "rejected" | "flagged" | "unflagged"
  moderated_by String  // admin user_id
  moderated_at DateTime @default(now())
  notes       String?  @db.Text
  previous_status String?
  new_status  String?

  @@index([module_id])
  @@index([course_id])
  @@index([moderated_by])
  @@index([moderated_at])
}
```

### API Endpoints Required

#### 1. Faculty Verification Endpoints
```typescript
// POST /api/faculty/request-verification
// Request verification for unverified faculty
{
  justification: string
  institution: string
  credentials_url?: string
}

// POST /api/admin/faculty/verify
// ADMIN approves/rejects verification request
{
  user_id: string
  action: "approve" | "reject"
  notes?: string
}

// GET /api/admin/faculty/pending-verification
// List all pending verification requests
```

#### 2. Content Moderation Endpoints
```typescript
// GET /api/admin/moderation/queue
// Get all content pending moderation
{
  type?: "module" | "course"
  page: number
  limit: number
}

// POST /api/admin/moderation/review
// Approve/reject specific content
{
  content_id: string
  content_type: "module" | "course"
  action: "approve" | "reject"
  notes?: string
}

// POST /api/modules/[id]/flag
// Users can report inappropriate content
{
  reason: string
}
```

#### 3. Domain Whitelist Endpoints
```typescript
// POST /api/admin/domains/whitelist
// Add domain to whitelist
{
  domain: string
  institution_name: string
  auto_approve: boolean
}

// GET /api/admin/domains/whitelist
// List all whitelisted domains
```

### Frontend Components Required

#### 1. Faculty Dashboard Enhancements
```typescript
// Show verification status banner for unverified faculty
<VerificationStatusBanner
  tier={user.verification_tier}
  onRequestVerification={() => openVerificationModal()}
/>

// Disable "Publish" button for unverified faculty
<PublishButton
  disabled={user.verification_tier === "unverified"}
  tooltip="Request verification to publish content"
/>
```

#### 2. ADMIN Dashboard
```typescript
// New ADMIN dashboard tabs
<AdminDashboard>
  <Tab name="Verification Requests">
    <VerificationRequestQueue />
  </Tab>
  <Tab name="Content Moderation">
    <ModerationQueue />
  </Tab>
  <Tab name="Faculty Management">
    <FacultyList />
  </Tab>
  <Tab name="Domain Whitelist">
    <DomainWhitelistManager />
  </Tab>
</AdminDashboard>
```

#### 3. Verification Request Modal
```typescript
<VerificationRequestModal>
  <TextArea
    label="Why do you need verification?"
    placeholder="Explain your background and teaching credentials..."
  />
  <Input
    label="Institution/Affiliation"
    placeholder="University of Illinois"
  />
  <Input
    label="Credentials URL (optional)"
    placeholder="Link to your CV, profile, or website"
  />
  <Button>Submit Request</Button>
</VerificationRequestModal>
```

---

## Integration with Student System

### User Role Differentiation

From the student system proposal, we need three distinct user roles:

```typescript
type UserRole = 'student' | 'faculty' | 'admin'

// Role-specific permissions
const PERMISSIONS = {
  student: {
    canCreateContent: false,
    canEnroll: true,
    canTrackProgress: true,
    needsVerification: false  // Students never need verification
  },

  faculty: {
    canCreateContent: true,
    canEnroll: false,  // Faculty don't enroll in courses
    canTrackProgress: false,
    needsVerification: true,  // Faculty need verification to publish
    hasVerificationTiers: true
  },

  admin: {
    canCreateContent: true,
    canEnroll: false,
    canTrackProgress: false,
    canModerateContent: true,
    canApproveFaculty: true,
    canManageDomains: true
  }
}
```

### Registration Flow Separation

```typescript
// Route: /auth/register/faculty
<FacultyRegistrationForm>
  <Input name="name" />
  <Input name="email" />
  <Input name="password" />
  <Input name="institution" />
  <Button>Register as Faculty</Button>
</FacultyRegistrationForm>

// Route: /auth/register/student
<StudentRegistrationForm>
  <Input name="name" />
  <Input name="email" />
  <Input name="password" />
  <Input name="major" />
  <Input name="graduation_year" />
  <Button>Register as Student</Button>
</StudentRegistrationForm>
```

### Verification Logic by Role

```typescript
// During registration
async function createUser(data: RegistrationData) {
  const emailDomain = data.email.split('@')[1]

  if (data.role === 'faculty') {
    // Check domain whitelist
    const isWhitelisted = await checkDomainWhitelist(emailDomain)

    return prisma.users.create({
      data: {
        ...data,
        verification_tier: isWhitelisted ? 'verified' : 'unverified',
        is_institutional_email: isWhitelisted
      }
    })
  }

  if (data.role === 'student') {
    // Students don't need verification
    return prisma.users.create({
      data: {
        ...data,
        verification_tier: 'verified',  // Auto-verified
        is_institutional_email: false   // Not applicable
      }
    })
  }
}
```

### Content Visibility Rules

```typescript
// GET /api/modules (public endpoint)
async function getPublicModules() {
  return prisma.modules.findMany({
    where: {
      status: 'published',
      moderation_status: 'approved',  // Only show approved content
      visibility: 'public'
    }
  })
}

// GET /api/modules (faculty endpoint)
async function getFacultyModules(userId: string) {
  return prisma.modules.findMany({
    where: {
      author_id: userId  // Faculty see all their own content
    }
  })
}

// GET /api/modules (student endpoint)
async function getStudentModules() {
  // Students see same as public users
  return getPublicModules()
}
```

---

## Migration Path

### Phase 1: Database Migration (Week 1)

```sql
-- Add verification fields to users table
ALTER TABLE users
ADD COLUMN verification_tier VARCHAR(20) DEFAULT 'unverified',
ADD COLUMN verified_by VARCHAR(255),
ADD COLUMN verified_at TIMESTAMP,
ADD COLUMN verification_notes TEXT,
ADD COLUMN email_domain VARCHAR(255),
ADD COLUMN is_institutional_email BOOLEAN DEFAULT false,
ADD COLUMN published_modules_count INT DEFAULT 0,
ADD COLUMN approved_modules_count INT DEFAULT 0,
ADD COLUMN rejected_modules_count INT DEFAULT 0;

-- Add moderation fields to modules table
ALTER TABLE modules
ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN moderated_by VARCHAR(255),
ADD COLUMN moderated_at TIMESTAMP,
ADD COLUMN moderation_notes TEXT,
ADD COLUMN flagged_count INT DEFAULT 0,
ADD COLUMN flagged_at TIMESTAMP,
ADD COLUMN flagged_by TEXT[],
ADD COLUMN flag_reasons TEXT[];

-- Create email_domain_whitelist table
CREATE TABLE email_domain_whitelist (
  id VARCHAR(255) PRIMARY KEY,
  domain VARCHAR(255) UNIQUE NOT NULL,
  institution_name VARCHAR(255) NOT NULL,
  auto_approve BOOLEAN DEFAULT true,
  added_by VARCHAR(255) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create verification_requests table
CREATE TABLE verification_requests (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  justification TEXT,
  institution VARCHAR(255),
  credentials_url VARCHAR(500)
);

-- Create moderation_log table
CREATE TABLE moderation_log (
  id VARCHAR(255) PRIMARY KEY,
  module_id VARCHAR(255),
  course_id VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  moderated_by VARCHAR(255) NOT NULL,
  moderated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  previous_status VARCHAR(50),
  new_status VARCHAR(50)
);

-- Seed initial domain whitelist
INSERT INTO email_domain_whitelist (id, domain, institution_name, added_by)
VALUES
  (gen_random_uuid(), 'illinois.edu', 'University of Illinois at Urbana-Champaign', 'system'),
  (gen_random_uuid(), 'uillinois.edu', 'University of Illinois System', 'system');
```

### Phase 2: Backfill Existing Users (Week 1)

```typescript
// Script: backfill-user-verification.ts
async function backfillExistingUsers() {
  const allUsers = await prisma.users.findMany()

  for (const user of allUsers) {
    const emailDomain = user.email.split('@')[1]
    const isInstitutional = emailDomain === 'illinois.edu' || emailDomain === 'uillinois.edu'

    await prisma.users.update({
      where: { id: user.id },
      data: {
        email_domain: emailDomain,
        is_institutional_email: isInstitutional,
        verification_tier: isInstitutional ? 'verified' : 'unverified'
      }
    })
  }

  console.log(`Backfilled ${allUsers.length} users`)
}
```

### Phase 3: Backfill Existing Content (Week 1)

```typescript
// Script: backfill-module-moderation.ts
async function backfillExistingModules() {
  // All existing published modules auto-approved (grandfather clause)
  const publishedModules = await prisma.modules.findMany({
    where: { status: 'published' }
  })

  for (const module of publishedModules) {
    await prisma.modules.update({
      where: { id: module.id },
      data: {
        moderation_status: 'approved',  // Auto-approve existing content
        moderated_at: new Date(),
        moderation_notes: 'Auto-approved (existing content)'
      }
    })
  }

  console.log(`Backfilled ${publishedModules.length} published modules`)
}
```

### Phase 4: Frontend Implementation (Week 2)

1. **Update Registration Flow**
   - Add role selection: Faculty vs Student
   - Extract email domain during registration
   - Auto-detect institutional emails

2. **Add Verification Request UI**
   - Banner for unverified faculty
   - Verification request modal
   - Status indicators

3. **Build ADMIN Dashboard**
   - Verification requests queue
   - Content moderation queue
   - Domain whitelist management

### Phase 5: API Endpoints (Week 2)

1. Verification request endpoint
2. ADMIN approval endpoints
3. Moderation queue endpoints
4. Content flagging endpoint

### Phase 6: Testing & Rollout (Week 3)

1. Test with 5-10 pilot faculty
2. Test ADMIN workflows
3. Test student registration (separate flow)
4. Full production rollout

---

## Success Metrics

### Week 1 (Pilot)
- ✅ 10 Illinois faculty auto-verified
- ✅ 5 external faculty request verification
- ✅ ADMIN processes 5 verification requests
- ✅ 3 modules go through moderation queue

### Month 1
- ✅ 50+ faculty registered (80% auto-verified via domain)
- ✅ 20% verification requests processed within 24 hours
- ✅ 100% of published content moderated
- ✅ 0 spam content appearing publicly

### Month 3
- ✅ 200+ faculty registered
- ✅ 10+ faculty reach "trusted" tier
- ✅ ADMIN moderation load reduced by 40% (due to trusted faculty)
- ✅ < 5% rejection rate on verified faculty content

---

## Security Considerations

### 1. ADMIN Account Security
- Use strong passwords (32+ characters)
- Enable 2FA (future enhancement)
- Limit ADMIN accounts to 2-3 people
- Log all ADMIN actions (moderation_log table)

### 2. Prevent Privilege Escalation
```typescript
// NEVER allow users to self-promote
if (user.role !== 'admin') {
  throw new Error('Unauthorized')
}

// NEVER trust client-side verification tier
const user = await prisma.users.findUnique({ where: { id: userId }})
if (user.verification_tier !== 'trusted') {
  // Require moderation
}
```

### 3. Content Flagging Rate Limiting
```typescript
// Prevent abuse of content flagging system
async function flagContent(userId: string, moduleId: string, reason: string) {
  // Check if user already flagged this content
  const module = await prisma.modules.findUnique({ where: { id: moduleId }})
  if (module.flagged_by.includes(userId)) {
    throw new Error('You have already flagged this content')
  }

  // Limit flags per user per day (10 max)
  const todayFlagsCount = await prisma.moderation_log.count({
    where: {
      moderated_by: userId,
      action: 'flagged',
      moderated_at: { gte: startOfDay(new Date()) }
    }
  })

  if (todayFlagsCount >= 10) {
    throw new Error('Daily flag limit reached')
  }

  // Proceed with flagging
}
```

---

## Future Enhancements

### Phase 2 Features (Post-MVP)
1. **Email Notifications**
   - Notify faculty when verification approved/rejected
   - Notify faculty when content is moderated
   - Notify ADMIN when new verification requests

2. **Reputation Dashboard**
   - Faculty can see their approval rating
   - Badges for trusted faculty
   - Leaderboard of top contributors

3. **Automated Quality Checks**
   - Detect plagiarism (Copyscape API)
   - Spell check / grammar check
   - Minimum content length enforcement

4. **Community Moderation**
   - Trusted faculty can help moderate (peer review)
   - Upvote/downvote system for quality
   - User-generated content reports

---

## Conclusion

The proposed ADMIN approval system solves a real problem (content quality control) but creates significant bottlenecks, poor UX, and scalability issues. The recommended hybrid solution combines:

1. **Content moderation** (gate what gets published, not who registers)
2. **Tiered permissions** (progressive trust model)
3. **Domain whitelisting** (auto-verify institutional faculty)

This architecture provides:
- ✅ Spam prevention
- ✅ Excellent UX for legitimate faculty
- ✅ Scalability to thousands of users
- ✅ Integration with student system
- ✅ Reduced ADMIN burden over time

**Recommendation:** Implement hybrid solution with 3-week timeline.

---

**Document Status:** Ready for Implementation
**Next Steps:** Client approval → Week 1 database migration
**Questions:** Contact development team

---

**Version History:**
- v1.0 (January 2025): Initial architecture document
