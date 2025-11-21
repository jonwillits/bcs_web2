# 🔄 Development & Production Workflow Guide

## Overview

This guide documents the complete development and production workflow for the BCS E-Textbook Platform using a **fork-based GitHub workflow** with separate personal (development) and university (production) accounts across all services.

**Last Updated:** January 2025
**Status:** Active

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Configuration](#service-configuration)
3. [GitHub Fork Workflow](#github-fork-workflow)
4. [Environment Variables](#environment-variables)
5. [Daily Development Workflow](#daily-development-workflow)
6. [Domain Migration](#domain-migration)
7. [Database Management](#database-management)
8. [Vercel Deployment](#vercel-deployment)
9. [Email Configuration](#email-configuration)
10. [Access Control](#access-control)
11. [Troubleshooting](#troubleshooting)
12. [Cost Breakdown](#cost-breakdown)

---

## 🏗️ Architecture Overview

### Fork-Based Development Model

```
┌─────────────────────────────────────────────────────────────┐
│              DEVELOPMENT/TESTING ENVIRONMENT                 │
├─────────────────────────────────────────────────────────────┤
│ URL:       https://bcs-web2.vercel.app                     │
│ GitHub:    Your fork (RITIKHARIANI/bcs_web2)               │
│ Vercel:    Personal account → bcs-web2.vercel.app          │
│ Database:  Supabase dev/test (via DATABASE_URL env var)     │
│ MCP:       'supabase' (for Claude debugging only)           │
│ Resend:    Personal account → Dev email                     │
│ Testing:   ALL testing done on Vercel (NOT locally)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Git Push → Your Fork
                              ↓
                  Create PR → Professor's Repo
                              ↓
                    Professor Reviews & Merges
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION ENVIRONMENT                     │
├─────────────────────────────────────────────────────────────┤
│ URL:       https://www.brainandcognitivescience.com        │
│ GitHub:    Professor's repo (University org)                │
│ Vercel:    University account → brainandcognitivescience.com│
│ Database:  Supabase production (via DATABASE_URL env var)   │
│ MCP:       'supabasePROD' (for Claude debugging only)       │
│ Resend:    University account → Production email            │
│ Users:     Real users, published courses, live data         │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Two Environments**: Development/testing (bcs-web2.vercel.app) and Production (brainandcognitivescience.com)
2. **No Local Development**: All testing done on Vercel deployment, NOT locally
3. **Fork Model**: Work on your fork → test on dev → PR to professor's repo → deploys to production
4. **Automatic Deployments**:
   - Push to fork → auto-deploy to bcs-web2.vercel.app (development)
   - Merge to professor's repo → auto-deploy to brainandcognitivescience.com (production)
5. **Database Connections**:
   - Websites connect via `DATABASE_URL` environment variable (set in Vercel)
   - MCP servers (`supabase` and `supabasePROD`) are for Claude-assisted debugging only

---

## 🔧 Service Configuration

### Development/Testing (Your Personal Accounts)

| Service | Account | Resource | Connection Method |
|---------|---------|----------|-------------------|
| **GitHub** | Your personal | Your fork | `RITIKHARIANI/bcs_web2` |
| **Vercel** | Personal | Project | `bcs-web2.vercel.app` |
| **Supabase** | Personal | Dev/test database | `DATABASE_URL` env var in Vercel |
| **MCP** | Personal | Debug access | `supabase` MCP server (for Claude) |
| **Resend** | Personal | Dev email | Personal API key |
| **Testing** | Vercel-based | No local dev | All testing on deployed site |

### Production (University Accounts)

| Service | Account | Resource | Connection Method |
|---------|---------|----------|-------------------|
| **GitHub** | University org | Main repository | Professor's repo |
| **Vercel** | University | Project | `brainandcognitivescience.com` |
| **Supabase** | University | Production database | `DATABASE_URL` env var in Vercel |
| **MCP** | University | Debug access | `supabasePROD` MCP server (for Claude) |
| **Resend** | University | Production email | University API key |
| **Domain** | University | GoDaddy | `brainandcognitivescience.com` |

---

## 🔀 GitHub Fork Workflow

### Repository Structure

```
Professor's Repository (Production Source)
├── main branch (protected, production-ready code)
└── Watchers: Your fork

Your Fork (Development)
├── main branch (sync with upstream)
└── Your working branches
```

### Initial Setup (One-Time)

```bash
# Clone your fork
git clone https://github.com/RITIKHARIANI/bcs_web2.git
cd bcs_web2

# Add upstream (professor's repo)
git remote add upstream https://github.com/[UNIVERSITY]/bcs-etextbook-redesigned.git

# Verify remotes
git remote -v
# origin    https://github.com/RITIKHARIANI/bcs_web2.git (your fork)
# upstream  https://github.com/[UNIVERSITY]/bcs-etextbook-redesigned.git (professor's repo)
```

### Keeping Your Fork in Sync

```bash
# Fetch latest from professor's repo
git fetch upstream

# Merge into your main branch
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

---

## 📝 Environment Variables

### Development Variables (Your Personal Vercel)

**Set in:** Vercel → Your Project → Settings → Environment Variables

```bash
# Database (Your Personal Supabase - Port 6543 for serverless)
DATABASE_URL="postgresql://postgres.[YOUR_ID]:[YOUR_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Authentication (Development URLs)
NEXTAUTH_URL="https://bcs-web2.vercel.app"
NEXTAUTH_SECRET="[your-dev-secret-32-chars]"

# Email (Your Personal Resend)
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_[your_personal_dev_api_key]"
EMAIL_FROM="noreply@[your-dev-domain].com"
EMAIL_FROM_NAME="BCS E-Textbook (DEV)"

# Environment
NODE_ENV="development"

# Feature Flags (Can test experimental features)
NEXT_PUBLIC_ENABLE_RICH_TEXT_EDITOR=true
NEXT_PUBLIC_ENABLE_GRAPH_VISUALIZATION=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false  # Disable analytics in dev
```

### Production Variables (University Vercel)

**Set in:** Vercel → University Project → Settings → Environment Variables

```bash
# Database (University Supabase - Port 6543 for serverless)
DATABASE_URL="postgresql://postgres.[UNIV_ID]:[UNIV_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Authentication (Production URLs)
NEXTAUTH_URL="https://brainandcognitivescience.org"
NEXTAUTH_SECRET="[university-prod-secret-32-chars]"

# Email (University Resend)
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_[university_production_api_key]"
EMAIL_FROM="noreply@brainandcognitivescience.org"
EMAIL_FROM_NAME="BCS E-Textbook"

# Environment
NODE_ENV="production"

# Feature Flags (Production-ready features only)
NEXT_PUBLIC_ENABLE_RICH_TEXT_EDITOR=true
NEXT_PUBLIC_ENABLE_GRAPH_VISUALIZATION=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true  # Enable analytics in prod
```

### Local Development Variables (Rarely Used)

**File:** `.env.local` (gitignored, only if running locally)

```bash
# Database (Use port 5432 for local development - session pooler)
DATABASE_URL="postgresql://postgres.[YOUR_ID]:[YOUR_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-dev-secret-key"

# Email (Console mode - logs to terminal, no real emails)
EMAIL_PROVIDER="console"
EMAIL_FROM_NAME="BCS E-Textbook (LOCAL)"

# Environment
NODE_ENV="development"

# Feature Flags
NEXT_PUBLIC_ENABLE_RICH_TEXT_EDITOR=true
NEXT_PUBLIC_ENABLE_GRAPH_VISUALIZATION=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

**Important Notes:**
- **Testing is done on Vercel** (bcs-web2.vercel.app), NOT locally
- **Port 6543**: Use for Vercel (serverless) - transaction pooler
- **Port 5432**: Use for local dev (if running locally) - session pooler
- See `/.env.development.example` and `/.env.production.example` for templates

---

## 🚀 Daily Development Workflow

### Step 1: Local Development

```bash
# Make sure you're on main and synced
git checkout main
git pull origin main

# Create feature branch (optional but recommended)
git checkout -b feature/add-new-feature

# Make your changes
# Edit code, test locally

# Test locally
npm run dev
# Visit: http://localhost:3000
```

### Step 2: Commit and Push to Your Fork

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add new feature: user profile avatars"

# Push to your fork
git push origin feature/add-new-feature
# Or if working directly on main:
git push origin main
```

**Result:** Your personal Vercel automatically deploys to `bcs-web2.vercel.app`

### Step 3: Test on Dev Deployment

```bash
# Visit your dev deployment
open https://bcs-web2.vercel.app

# Test your changes:
# - Functionality works
# - No console errors
# - UI looks correct
# - Test with dev database (safe to break things)
```

### Step 4: Create Pull Request to Production

**When ready for production:**

```bash
# Via GitHub CLI (if installed)
gh pr create --repo [UNIVERSITY]/bcs-etextbook-redesigned --base main --head RITIKHARIANI:feature/add-new-feature --title "Add user profile avatars" --body "Description of changes..."

# Or via GitHub Web UI:
# 1. Go to professor's repository on GitHub
# 2. Click "Pull requests" → "New pull request"
# 3. Click "compare across forks"
# 4. Base repository: [UNIVERSITY]/bcs-etextbook-redesigned, base: main
# 5. Head repository: RITIKHARIANI/bcs_web2, compare: feature/add-new-feature
# 6. Click "Create pull request"
# 7. Fill in title and description
# 8. Click "Create pull request"
```

### Step 5: Professor Reviews and Merges

**Professor's workflow:**
1. Receives notification of your PR
2. Reviews code changes
3. Tests functionality (Vercel creates preview deployment for PR)
4. Approves or requests changes
5. Merges PR when approved

**Result:** University Vercel automatically deploys to `brainandcognitivescience.org`

### Step 6: Sync Your Fork (After Merge)

```bash
# Fetch latest from upstream (professor's repo)
git fetch upstream

# Switch to main
git checkout main

# Merge upstream changes
git merge upstream/main

# Push to your fork to keep it in sync
git push origin main

# Delete feature branch (if used)
git branch -d feature/add-new-feature
git push origin --delete feature/add-new-feature
```

---

## 🌐 Domain Migration

### Current State (January 2025)

- **Domain:** `brainandcognitivescience.org` and `.com`
- **Registered with:** GoDaddy (university account)
- **Currently pointing to:** Your personal Vercel account
- **Nameservers:** Vercel nameservers (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`)

### Migration Plan: Move Domain to University Vercel

#### Phase 1: Preparation

**University Vercel Setup:**
1. University creates or logs into Vercel account
2. Imports project from professor's GitHub repository
3. Configures environment variables (production values)
4. Verifies deployment works at temporary URL

#### Phase 2: Remove Domain from Personal Vercel

**In your personal Vercel account:**
1. Go to: Project → Settings → Domains
2. Remove these domains:
   - `brainandcognitivescience.org`
   - `www.brainandcognitivescience.org`
   - `brainandcognitivescience.com`
   - `www.brainandcognitivescience.com`

**Expected downtime:** 5-30 minutes

#### Phase 3: Add Domain to University Vercel

**In university Vercel account:**
1. Go to: Project → Settings → Domains
2. Add domains (one at a time):
   - `brainandcognitivescience.org`
   - `www.brainandcognitivescience.org`
   - `brainandcognitivescience.com`
   - `www.brainandcognitivescience.com`

**Verification:**
- Nameservers already point to Vercel ✅
- Should show "Valid Configuration" within minutes
- SSL certificates issued automatically

#### Phase 4: Reconfigure DNS Records

**Resend DNS records need to be re-added:**

1. In university Vercel: Domains → `brainandcognitivescience.org` → Edit
2. Add 3 Resend DNS records:
   - TXT: `@` → `resend-domain-verify=...`
   - MX: `@` → `feedback-smtp.us-east-1.amazonses.com` (Priority: 10)
   - TXT: `resend._domainkey` → `k=rsa; p=...`

**Get these values from:** University Resend account → Domains → `brainandcognitivescience.org`

#### Phase 5: Testing

**After migration:**
1. Visit: `https://brainandcognitivescience.org` → Should load production site
2. Test: Registration and email verification
3. Test: Login and authentication
4. Test: All major features

**Your dev site:**
- Continues to work at: `https://bcs-web2.vercel.app`
- Completely unaffected by production domain migration

---

## 🗄️ Database Management

### Database Separation

**Development Database (Your Supabase):**
- **Purpose**: Testing, development, can be reset
- **Data**: Fake users, test courses, experimental data
- **Website Connection**: Via `DATABASE_URL` environment variable in your Vercel project
- **Claude Access**: Via `supabase` MCP server for debugging/inspection

**Production Database (University Supabase):**
- **Purpose**: Real user data, stable production environment
- **Data**: Real users, real courses, published content
- **Website Connection**: Via `DATABASE_URL` environment variable in university Vercel project
- **Claude Access**: Via `supabasePROD` MCP server for debugging/inspection (use carefully)

### Schema Synchronization

**⚠️ IMPORTANT: Complete migration guide at [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md)**

**Correct Process (Updated Nov 2025):**

1. **Make schema changes and create migration in ONE step:**
   ```bash
   # Edit prisma/schema.prisma locally

   # Create migration (generates SQL + applies to dev DB)
   npx prisma migrate dev --name add_user_avatar_field

   # This creates: prisma/migrations/[timestamp]_add_user_avatar_field/
   # AND applies it to your development database

   # Test locally
   npm run dev
   ```

2. **Commit migration file:**
   ```bash
   # Commit both schema and migration
   git add prisma/schema.prisma prisma/migrations
   git commit -m "Add user avatar field migration"
   git push origin main
   ```

3. **Production deployment applies migration automatically:**
   ```bash
   # Vercel runs during deployment:
   npm run vercel:build
   # which runs: prisma generate && prisma migrate deploy && next build

   # Migration applies to production database automatically
   ```

**❌ NEVER use `npx prisma db push` - it causes migration drift!**
**✅ ALWAYS use `npx prisma migrate dev` - keeps everything in sync**

### Database Backup

**Production (University's responsibility):**
- Supabase automatic daily backups
- Download backups: Supabase Dashboard → Database → Backups

**Development (Optional):**
```bash
# Manual backup
npx prisma db pull  # Pull schema
npx supabase db dump > backup.sql  # If using Supabase CLI
```

---

## 🚢 Vercel Deployment

### Personal Vercel Configuration

**Project Name:** `bcs-web2` (or similar)

**Git Integration:**
- Repository: `RITIKHARIANI/bcs_web2` (your fork)
- Production Branch: `main`
- Auto-deploy: ✅ Enabled for `main` branch
- Preview deployments: ✅ Enabled for all branches

**Domains:**
- Default: `bcs-web2.vercel.app`
- Custom: None (personal dev doesn't need custom domain)

**Build Settings:**
- Framework: Next.js (auto-detected)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### University Vercel Configuration

**Project Name:** `bcs-etextbook` (or university naming)

**Git Integration:**
- Repository: `[UNIVERSITY]/bcs-etextbook-redesigned` (professor's repo)
- Production Branch: `main`
- Auto-deploy: ✅ Enabled for `main` branch only
- Preview deployments: ❌ Disabled (or enabled only for staging branch if needed)

**Domains:**
- Default: `bcs-etextbook-[random].vercel.app`
- Custom: `brainandcognitivescience.org`, `www`, `.com`, `www.com`

**Build Settings:**
- Framework: Next.js
- Build Command: `npm run vercel:build` (includes migrations)
- Output Directory: `.next`
- Install Command: `npm run vercel:install` (uses --legacy-peer-deps)

### Deployment Triggers

**Development:**
```
Push to your fork → Personal Vercel deploys → bcs-web2.vercel.app updated
```

**Production:**
```
PR merged to professor's repo → University Vercel deploys → brainandcognitivescience.org updated
```

---

## 📧 Email Configuration

### Development Email (Your Personal Resend)

**Setup:**
1. Create Resend account with personal email
2. Add custom domain (e.g., `dev.yourdomain.com`) OR use `onboarding@resend.dev`
3. Generate API key: `re_[personal_key]`
4. Add to your Vercel env vars

**DNS (if using custom domain):**
- Add DNS records in your personal Vercel → Domains → Your domain → DNS
- 3 records: TXT (verification), MX (routing), TXT (DKIM)

**Testing:**
- All emails from dev deployment go to personal Resend
- Can send to any email address
- View in personal Resend dashboard

### Production Email (University Resend)

**Setup:**
1. University creates Resend account
2. Add domain: `brainandcognitivescience.org`
3. Get 3 DNS records from Resend
4. Add to university Vercel → Domains → DNS
5. Generate API key for production
6. Add to university Vercel env vars

**DNS Records:**
- Managed in university Vercel (since using Vercel nameservers)
- 3 records required for Resend to work

**Monitoring:**
- University admin monitors Resend dashboard
- Email delivery logs and analytics
- Bounce/spam monitoring

### Email Flow

**Development:**
```
User registers on bcs-web2.vercel.app
  ↓
Next.js sends email via Resend API (personal key)
  ↓
Email sent from noreply@[your-dev-domain]
  ↓
Tracked in personal Resend dashboard
```

**Production:**
```
User registers on brainandcognitivescience.org
  ↓
Next.js sends email via Resend API (university key)
  ↓
Email sent from noreply@brainandcognitivescience.org
  ↓
Tracked in university Resend dashboard
```

---

## 🔐 Access Control & Permissions

### GitHub Access

**Your Access:**
- Full control over your fork (`RITIKHARIANI/bcs_web2`)
- Can create PRs to professor's repository
- Can view professor's repository (if public or granted access)

**Professor's Access:**
- Full control over main repository
- Reviews and merges your PRs
- Manages branch protection (if any)

### Vercel Access

**Personal Vercel:**
- Owner: You
- Full control over your project
- Can view logs, redeploy, manage domains

**University Vercel:**
- Owner: University/Professor
- Your access: Member or Developer role (view logs, redeploy)
- Cannot delete project or change critical settings

### Supabase Access

**Development Supabase:**
- **Owner**: You
- **Website Access**: Via `DATABASE_URL` in Vercel (automatic)
- **Claude Access**: Via `supabase` MCP server (for debugging/inspection)
- **Permissions**: Full access - can reset, modify schema, view data

**Production Supabase:**
- **Owner**: University
- **Website Access**: Via `DATABASE_URL` in university Vercel (automatic)
- **Claude Access**: Via `supabasePROD` MCP server (for debugging/inspection)
- **Permissions**: Use MCP carefully - contains real user data

### Resend Access

**Personal Resend:**
- Owner: You
- Full access to dev email account
- API keys managed by you

**University Resend:**
- Owner: University
- Your access: Usually none (API key in Vercel env vars only)
- University manages domains and API keys

### Domain (GoDaddy)

**University controls:**
- Domain registration
- Nameservers (currently set to Vercel)
- Domain renewal

**You don't need access** because:
- DNS managed via Vercel (Vercel nameservers)
- All DNS changes in Vercel dashboard

---

## 🆘 Troubleshooting & Emergency Procedures

### Production Site Down

**Diagnosis:**
```bash
# Check Vercel deployment status
# Go to: University Vercel → Deployments → Check latest status

# Check domain resolution
nslookup brainandcognitivescience.org
# Should return Vercel IPs

# Check SSL
curl -I https://brainandcognitivescience.org
# Should return 200 OK
```

**Quick Fixes:**
1. **Check Vercel deployment logs** for build errors
2. **Redeploy** from Vercel dashboard (Deployments → ... → Redeploy)
3. **Rollback** to previous working deployment
4. **Check environment variables** are set correctly

### Database Connection Issues

**Diagnosis:**
```bash
# Test connection (local)
npx prisma db pull

# Check environment variable
echo $DATABASE_URL
# Should show correct format with port 6543
```

**Fixes:**
1. Verify `DATABASE_URL` in Vercel env vars
2. Check Supabase project status
3. Verify port is 6543 (not 5432) for serverless
4. Check connection pooling settings

### Email Not Sending

**Diagnosis:**
1. Check Resend dashboard for errors
2. Verify `EMAIL_FROM` matches verified domain
3. Check `RESEND_API_KEY` is correct
4. Review Vercel deployment logs

**Fixes:**
1. Verify domain in Resend dashboard
2. Check DNS records in Vercel
3. Regenerate API key if needed
4. Test with Resend API playground

### Dev Site Broken After Merge

**If your fork breaks after syncing:**
```bash
# Check what changed
git log upstream/main --oneline -10

# If migration needed
npx prisma generate
npx prisma db push

# If dependencies changed
npm install

# Rebuild
npm run build
```

### Hotfix for Production (Emergency)

**If critical bug in production:**

1. **Fix in your fork:**
   ```bash
   git checkout -b hotfix/critical-bug
   # Make fix
   git commit -m "HOTFIX: Fix critical authentication bug"
   git push origin hotfix/critical-bug
   ```

2. **Create urgent PR:**
   ```bash
   gh pr create --repo [UNIVERSITY]/bcs-etextbook-redesigned --base main --head RITIKHARIANI:hotfix/critical-bug --title "HOTFIX: Critical authentication bug" --body "Emergency fix for production issue. Approved by [professor name]."
   ```

3. **Request immediate review** (email/Slack professor)

4. **After merge** → University Vercel auto-deploys in ~2-3 minutes

---

## 💰 Cost Breakdown

### Development Costs (Your Personal Accounts)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Hobby (Free) | $0/month | 100GB bandwidth, unlimited deployments |
| **Supabase** | Free | $0/month | 500MB database, 50K rows |
| **Resend** | Free | $0/month | 3,000 emails/month (100/day) |
| **GitHub** | Free | $0/month | Unlimited public repositories |
| **Total** | | **$0/month** | All free tiers sufficient for dev |

### Production Costs (University Accounts)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Pro (Recommended) | $20/month | Better for teams, analytics |
| **Vercel** | Free (Alternative) | $0/month | Works but limited features |
| **Supabase** | Pro | $25/month | 8GB database, daily backups |
| **Supabase** | Free (Alternative) | $0/month | 500MB, sufficient initially |
| **Resend** | Pro | $20/month | 50K emails/month |
| **Resend** | Free (Alternative) | $0/month | 3K emails/month |
| **GoDaddy** | Domain | ~$15/year | Domain renewal |
| **Total (Free Tier)** | | **~$15/year** | Just domain cost |
| **Total (Paid Tier)** | | **~$65/month** | Recommended for production |

**Recommendations:**
- Start with free tiers for production
- Upgrade to paid when:
  - Supabase: Database > 500MB
  - Resend: Emails > 3K/month
  - Vercel: Need team features or analytics

---

## 📋 Quick Reference

### Common Commands

```bash
# Sync fork with upstream
git fetch upstream && git merge upstream/main

# Deploy to dev (your fork)
git push origin main  # Auto-deploys to bcs-web2.vercel.app

# Create PR for production
gh pr create --repo [UNIVERSITY]/bcs-etextbook-redesigned

# Database migration
npx prisma migrate dev --name description

# View Prisma Studio
npx prisma studio
```

### Important URLs

**Development:**
- Site: https://bcs-web2.vercel.app
- Vercel: https://vercel.com/[your-username]/bcs-web2
- Supabase: https://supabase.com/dashboard/project/[your-project-id]
- Resend: https://resend.com/emails

**Production:**
- Site: https://brainandcognitivescience.org
- Vercel: https://vercel.com/[university]/bcs-etextbook
- Supabase: https://supabase.com/dashboard/project/[univ-project-id]
- Resend: https://resend.com/emails

---

## 📞 Support & Communication

### When to Contact Professor

- Before major architectural changes
- When ready to deploy to production (PR)
- If production issues arise
- For access to university accounts

### Documentation

- **This Guide**: Dev/prod workflow
- **CLAUDE.md**: Project overview and commands
- **TECHNICAL_DOCUMENTATION.md**: Architecture details
- **EMAIL_SETUP_GUIDE.md**: Email configuration
- **TESTING_CHECKLIST.md**: Testing procedures

---

## ✅ Setup Checklist

### Initial Setup (One-Time)

- [ ] Fork professor's repository
- [ ] Set up personal Vercel with your fork
- [ ] Create personal Supabase project
- [ ] Create personal Resend account
- [ ] Configure all environment variables
- [ ] Test dev deployment at bcs-web2.vercel.app
- [ ] Verify you can create PRs to upstream

### Before Each Production Deploy

- [ ] Test thoroughly on dev deployment
- [ ] Run tests and linting
- [ ] Check database migrations are included
- [ ] Verify no secrets in commits
- [ ] Create clear PR description
- [ ] Tag professor for review

### After Production Deploy

- [ ] Verify production site works
- [ ] Test authentication flow
- [ ] Verify emails sending correctly
- [ ] Check database migrations applied
- [ ] Monitor for errors in first hour
- [ ] Sync your fork with upstream

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Maintained By**: Development Team
**Next Review**: March 2025
