# 🗄️ Database Migration Guide - Production Safety Protocol

**Last Updated:** November 18, 2025
**Status:** ✅ Active - Enforced Workflow

---

## 🚨 CRITICAL: Two Separate Databases

### Development Database (YOUR Supabase)
```
URL: postgresql://postgres.[YOUR_ID]:***@aws-1-us-east-1.pooler.supabase.com:5432/postgres
Project: Your personal Supabase project
Purpose: Development, testing, safe to reset/destroy
Data: Test users, test courses (expendable)
```

### Production Database (UNIVERSITY Supabase)
```
URL: postgresql://postgres.[UNIVERSITY_ID]:***@aws-1-us-east-1.pooler.supabase.com:5432/postgres
Project: University Supabase project
Purpose: Real user data, stable, NEVER RESET
Data: Real users, real courses (CRITICAL)
```

---

## ✅ Verified Safe - Database Isolation

### How Your Development Environment is Protected:

**1. Local Development (.env file)**
```bash
# Your .env or .env.local
DATABASE_URL="postgresql://...[YOUR_SUPABASE]...5432/postgres"

# This ONLY affects:
- npm run dev (local testing)
- npx prisma migrate dev (development migrations)
- npx prisma studio (database viewer)
- npx prisma db push (NEVER USE THIS ANYMORE)
```

**2. Your Vercel Deployment (bcs-web2.vercel.app)**
```bash
# Vercel → Project Settings → Environment Variables
DATABASE_URL="postgresql://...[YOUR_SUPABASE]...6543/postgres"  # Port 6543 for serverless

# This ONLY affects:
- Your personal Vercel deployments
- Your development testing
- Your fork's automatic deploys
```

**3. University Vercel (Production - brainandcognitivescience.org)**
```bash
# University Vercel → Project Settings → Environment Variables
DATABASE_URL="postgresql://...[UNIVERSITY_SUPABASE]...6543/postgres"

# This affects:
- Production site (when PRs are merged)
- Real user data
- University's deployment
```

---

## 🔒 How Production is Protected From Your Changes

### The Safety Mechanism:

```
┌─────────────────────────────────────────────────────────┐
│ YOU develop locally                                      │
├─────────────────────────────────────────────────────────┤
│ DATABASE_URL → Your Supabase (from .env)                │
│ Commands: prisma migrate dev, npm run dev               │
│ Result: Changes ONLY to your database                   │
└─────────────────────────────────────────────────────────┘
                          ↓
                  git commit + push
                          ↓
┌─────────────────────────────────────────────────────────┐
│ YOUR Vercel deploys (bcs-web2.vercel.app)              │
├─────────────────────────────────────────────────────────┤
│ DATABASE_URL → Your Supabase (from Vercel env vars)     │
│ Vercel runs: prisma migrate deploy                      │
│ Result: Applies migrations to YOUR database             │
└─────────────────────────────────────────────────────────┘
                          ↓
              Create PR to professor's repo
                          ↓
              Professor reviews and merges
                          ↓
┌─────────────────────────────────────────────────────────┐
│ UNIVERSITY Vercel deploys (brainandcognitivescience.org)│
├─────────────────────────────────────────────────────────┤
│ DATABASE_URL → University Supabase (from their env)     │
│ Vercel runs: prisma migrate deploy                      │
│ Result: Applies migrations to PRODUCTION database       │
└─────────────────────────────────────────────────────────┘
```

**Key Point:** You have **ZERO** access to university's Vercel environment variables, so you **CANNOT** accidentally affect their database.

---

## 📋 The NEW Correct Workflow (Post-Fix)

### ✅ ALWAYS Do This:

#### **1. Make Schema Changes**
```bash
# Edit prisma/schema.prisma
# Example: Add new field to users table

model users {
  id    String @id
  name  String
  bio   String?  // ← NEW FIELD
}
```

#### **2. Create Migration**
```bash
npx prisma migrate dev --name add_user_bio_field

# What happens:
# 1. Prisma generates migration SQL file
# 2. Creates: prisma/migrations/[timestamp]_add_user_bio_field/migration.sql
# 3. Applies migration to YOUR dev database
# 4. Updates Prisma Client
```

#### **3. Test Locally**
```bash
npm run dev
# Test that changes work correctly
# Check database with: npx prisma studio
```

#### **4. Commit Migration File**
```bash
git add prisma/schema.prisma
git add prisma/migrations/[timestamp]_add_user_bio_field
git commit -m "Add bio field to users table"
git push origin main
```

#### **5. Verify Dev Deployment**
```bash
# Vercel auto-deploys to: bcs-web2.vercel.app
# Check Vercel logs to confirm migration applied successfully
# Test on live dev site
```

#### **6. Create PR for Production**
```bash
# Via GitHub UI or:
gh pr create --repo [UNIVERSITY]/bcs-etextbook-redesigned \
  --base main \
  --head RITIKHARIANI:main \
  --title "Add user bio field" \
  --body "Migration: add_user_bio_field - adds optional bio field to users"
```

#### **7. Professor Merges → Production Deployment**
```bash
# University Vercel automatically:
# 1. Runs: prisma generate
# 2. Runs: prisma migrate deploy ← Applies YOUR migration to production DB
# 3. Runs: next build
# 4. Deploys to: brainandcognitivescience.org
```

---

## ❌ NEVER Do This Anymore:

### Forbidden Commands (Lead to Drift):

```bash
# ❌ NEVER USE THIS
npx prisma db push

# Why: Bypasses migration files, creates drift
# Use instead: npx prisma migrate dev
```

```bash
# ❌ NEVER USE THIS (without explicit consent)
npx prisma migrate reset

# Why: Deletes all data, should only be used to fix drift
# When to use: Only when explicitly fixing migration issues
```

```bash
# ❌ NEVER MANUALLY EDIT MIGRATION FILES
# After creating migration with `migrate dev`, DON'T modify the SQL

# Why: Breaks migration checksums
# If you need to change it: Delete migration, fix schema, recreate migration
```

---

## 🔧 How We Fixed The Drift (What Just Happened)

### The Problem:
```
❌ Migrations in database: November migrations that don't exist locally
❌ Migrations in repo: Different migrations that database doesn't know about
❌ Result: Prisma can't reconcile → deployments fail
```

### The Fix (Executed Nov 18, 2025):
```bash
# Step 1: Removed all migration files
rm -rf prisma/migrations && mkdir prisma/migrations

# Step 2: Reset database (deleted all data - safe because development DB)
npx prisma migrate reset --force

# Step 3: Created clean baseline migration
npx prisma migrate dev --name baseline_complete_schema

# Result: ✅ Single migration (20251118211250_baseline_complete_schema)
#         ✅ Database and code in perfect sync
#         ✅ Clean slate for future migrations
```

---

## 📊 Migration Checklist

Before committing a migration, verify:

- [ ] Migration file created in `prisma/migrations/[timestamp]_[name]/`
- [ ] Migration SQL looks correct (review the generated SQL)
- [ ] Migration applied successfully to dev database
- [ ] Prisma Client regenerated (`@prisma/client` updated)
- [ ] Local testing confirms changes work
- [ ] Migration file committed to git
- [ ] Dev deployment successful (check Vercel logs)

---

## 🆘 Troubleshooting

### "Drift detected" Error

**Cause:** Schema doesn't match migration history

**Fix:**
```bash
# Option 1: If you made schema changes without migration
npx prisma migrate dev --name describe_your_changes

# Option 2: If migrations are broken (DEVELOPMENT ONLY)
npx prisma migrate reset --force
npx prisma migrate dev --name baseline_reset
```

### "Migration already applied" Error

**Cause:** Trying to apply migration that's already in database

**Fix:**
```bash
# Mark migration as applied without running it:
npx prisma migrate resolve --applied [migration_name]
```

### Vercel Deployment Fails on Migration

**Check Vercel Logs:**
```
Vercel → Deployments → [Failed Deployment] → View Build Logs

Look for:
- "prisma migrate deploy" output
- SQL errors
- Connection timeouts
```

**Common Fixes:**
- Verify `DATABASE_URL` in Vercel environment variables
- Check database is accessible (not paused/locked)
- Ensure migration SQL is valid

---

## 🎯 Best Practices Summary

### Development Workflow:
1. ✅ Edit `schema.prisma`
2. ✅ Run `npx prisma migrate dev --name descriptive_name`
3. ✅ Test locally with `npm run dev`
4. ✅ Commit migration files
5. ✅ Push to your fork
6. ✅ Verify dev deployment works

### Production Workflow:
1. ✅ Create PR from your fork
2. ✅ Professor reviews migration SQL
3. ✅ Professor merges PR
4. ✅ University Vercel auto-deploys
5. ✅ `prisma migrate deploy` runs automatically
6. ✅ Production database updated safely

### Safety Rules:
- ✅ **ALWAYS** use `prisma migrate dev` for schema changes
- ✅ **NEVER** use `prisma db push` (creates drift)
- ✅ **NEVER** edit migration files manually
- ✅ **NEVER** run destructive commands on production
- ✅ **ALWAYS** commit migration files
- ✅ **ALWAYS** test migrations on dev first

---

## 🔍 How to Verify Your Database Connection

```bash
# Check which database you're connected to:
npx prisma studio

# Browser opens showing your database
# URL in browser: http://localhost:5555
# Check the data - should be YOUR test data, not production

# Alternative: Check connection directly
echo $DATABASE_URL | grep -o '@[^:]*'
# Should show: @aws-1-us-east-1.pooler.supabase.com (YOUR Supabase)
```

---

## 📞 Emergency Contacts

**If you accidentally affect production:**
1. Immediately notify professor
2. Check university Vercel deployment logs
3. Production has automatic daily backups (Supabase)
4. Backups can be restored from Supabase dashboard

**Prevention:**
- You don't have access to university Vercel environment variables
- You don't have credentials to university Supabase
- Your local .env only affects your development environment
- Migrations only apply to production when PR is merged and professor deploys

---

**Status:** ✅ Database migration system is now fixed and production-safe.
**Next Migration:** Will be `20251118XXXXXX_[descriptive_name]` when you make next schema change.
