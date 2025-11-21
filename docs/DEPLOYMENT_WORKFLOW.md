# 🚀 Complete Deployment Workflow & CI/CD Pipeline

**Last Updated:** November 18, 2025
**Status:** ✅ Fixed and Validated

---

## 📊 Overview: Full Development → Production Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ LOCAL DEVELOPMENT (Your Machine)                                │
├─────────────────────────────────────────────────────────────────┤
│ 1. Edit code + prisma/schema.prisma                            │
│ 2. Run: npx prisma migrate dev --name feature_name             │
│    ├─ Generates: prisma/migrations/[timestamp]_feature/        │
│    ├─ Applies migration to: YOUR Supabase (dev database)       │
│    └─ Updates: @prisma/client                                  │
│ 3. Run: npm run dev (test locally)                             │
│ 4. Commit: git add . && git commit -m "..."                    │
│ 5. Push: git push origin main                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ VERCEL DEPLOYMENT (Your bcs-web2.vercel.app)                   │
├─────────────────────────────────────────────────────────────────┤
│ Trigger: Push to your fork (main branch)                       │
│                                                                 │
│ PHASE 1: INSTALL                                               │
│ ├─ Command: npm run vercel:install                             │
│ └─ Runs: npm install --legacy-peer-deps                        │
│                                                                 │
│ PHASE 2: BUILD (Sequential - order matters!)                   │
│ ├─ Command: npm run vercel:build                               │
│ ├─ Step 1: prisma generate                                     │
│ │   └─ Generates Prisma Client from schema.prisma              │
│ ├─ Step 2: prisma migrate deploy ← CRITICAL!                   │
│ │   ├─ Reads: prisma/migrations/ directory                     │
│ │   ├─ Checks: _prisma_migrations table in database            │
│ │   ├─ Applies: Any unapplied migrations                       │
│ │   └─ Updates: Database schema to match code                  │
│ └─ Step 3: next build                                          │
│     ├─ Builds Next.js application                              │
│     └─ Creates optimized production bundle                     │
│                                                                 │
│ PHASE 3: DEPLOY                                                │
│ ├─ If build succeeds: Deploy to bcs-web2.vercel.app           │
│ └─ If build fails: Deployment aborted, previous version stays  │
│                                                                 │
│ Environment Variables Used:                                     │
│ └─ DATABASE_URL → YOUR Supabase (port 6543 for serverless)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PRODUCTION (Optional - When Ready)                             │
├─────────────────────────────────────────────────────────────────┤
│ 1. Create PR to professor's repository                         │
│ 2. Professor reviews code + migration SQL                      │
│ 3. Professor merges PR                                          │
│ 4. University Vercel deploys (same pipeline as above)          │
│    └─ DATABASE_URL → University Supabase                       │
│ 5. Lives at: brainandcognitivescience.org                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Critical Configuration Files

### **1. vercel.json** (Deployment Configuration)

```json
{
  "buildCommand": "npm run vercel:build",  // ← MUST use this
  "installCommand": "npm run vercel:install",
  "framework": "nextjs"
}
```

**Why these commands matter:**

| Command | What It Does | Why Critical |
|---------|--------------|--------------|
| `vercel:install` | Installs dependencies with `--legacy-peer-deps` | Resolves peer dependency conflicts |
| `vercel:build` | Runs migrations THEN builds | Ensures DB schema matches code |

### **2. package.json** (Build Scripts)

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel:build": "prisma generate && prisma migrate deploy && next build",
    "vercel:install": "npm install --legacy-peer-deps"
  }
}
```

**Key Difference:**
- ❌ `npm run build` - Does NOT apply migrations (breaks deployment)
- ✅ `npm run vercel:build` - Applies migrations (correct CI/CD)

---

## 📋 Migration Pipeline Deep Dive

### **Step-by-Step: What `prisma migrate deploy` Does**

```
1. Connects to database using DATABASE_URL
         ↓
2. Checks if _prisma_migrations table exists
   ├─ No? Creates it (first deployment)
   └─ Yes? Proceeds
         ↓
3. Reads all migration files from prisma/migrations/
   Example:
   ├─ 20251118211250_baseline_complete_schema/migration.sql
   └─ (future migrations will appear here)
         ↓
4. Queries _prisma_migrations table
   SELECT * FROM _prisma_migrations ORDER BY finished_at;
         ↓
5. Compares migrations on disk vs in database
   ├─ Migration already applied? Skip
   └─ Migration not applied? Queue for execution
         ↓
6. Executes queued migrations SEQUENTIALLY
   For each migration:
   ├─ BEGIN TRANSACTION
   ├─ Execute SQL from migration.sql
   ├─ INSERT INTO _prisma_migrations (...)
   └─ COMMIT TRANSACTION
         ↓
7. If ANY migration fails:
   ├─ ROLLBACK TRANSACTION
   ├─ Exit with error code
   └─ Vercel build fails (deployment aborted)
         ↓
8. If ALL migrations succeed:
   └─ Return success (build continues to next step)
```

---

## 🛡️ Safety Mechanisms

### **1. Transactional Migrations**
Each migration runs in a transaction:
```sql
BEGIN;
  -- Migration SQL here
  CREATE TABLE course_tracking (...);
  ALTER TABLE courses ADD COLUMN tracking_count;
COMMIT;
```
**Result:** Either entire migration succeeds, or nothing changes.

### **2. Build Failure on Migration Error**
```
Migration fails
    ↓
Build exits with non-zero code
    ↓
Vercel aborts deployment
    ↓
Previous working version stays live
    ↓
You get notification of failed build
```

### **3. Idempotent Deployments**
Running deployment multiple times is safe:
- Already-applied migrations are skipped
- Only new migrations execute
- Database state is deterministic

### **4. Environment Isolation**
```
Development Deployment (bcs-web2.vercel.app)
├─ DATABASE_URL → Your Supabase
└─ Migrations apply to: Development database

Production Deployment (brainandcognitivescience.org)
├─ DATABASE_URL → University Supabase
└─ Migrations apply to: Production database
```

**You cannot accidentally apply migrations to production** because:
1. Different Vercel projects
2. Different environment variables
3. Different database credentials
4. Requires PR merge to trigger

---

## 📊 Migration Tracking Table

Every migration is recorded in `_prisma_migrations`:

```sql
SELECT * FROM _prisma_migrations;
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | VARCHAR | Migration identifier (timestamp_name) |
| `checksum` | VARCHAR | SHA256 of migration.sql (detects tampering) |
| `finished_at` | TIMESTAMP | When migration completed |
| `migration_name` | VARCHAR | Human-readable name |
| `logs` | TEXT | Execution logs |
| `rolled_back_at` | TIMESTAMP | If migration was rolled back |
| `started_at` | TIMESTAMP | When migration started |
| `applied_steps_count` | INT | Number of steps executed |

---

## 🔍 Verifying Deployments

### **Check if Migrations Applied (Vercel Dashboard)**

1. Go to: Vercel → Deployments → [Your Latest Deployment]
2. Click: "View Build Logs"
3. Search for: `prisma migrate deploy`
4. Expected output:
   ```
   Running prisma migrate deploy
   Prisma schema loaded from prisma/schema.prisma
   Datasource "db": PostgreSQL database "postgres", schema "public"

   1 migration found in prisma/migrations

   Applying migration `20251118211250_baseline_complete_schema`

   The following migration(s) have been applied:

   migrations/
     └─ 20251118211250_baseline_complete_schema/
       └─ migration.sql

   All migrations have been successfully applied.
   ```

### **Check if Migrations Applied (Database)**

```bash
# Using Supabase MCP or SQL Editor:
SELECT id, migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
ORDER BY finished_at DESC;
```

Expected result:
```
| id | migration_name | finished_at | applied_steps_count |
|----|----------------|-------------|---------------------|
| 20251118211250_baseline_complete_schema | baseline_complete_schema | 2025-11-18 21:13:00 | 1 |
```

### **Check if Tables Exist**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'course_tracking';
```

Expected: `course_tracking` appears in results.

---

## 🚨 Troubleshooting Failed Deployments

### **Symptom: Build Fails with Migration Error**

**Check Vercel Build Logs:**
```
Error: P3009

migrate found failed migration in the target database, new migrations will not be applied. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20251118211250_baseline_complete_schema
```

**Cause:** Previous migration failed mid-execution

**Fix:**
```bash
# Mark migration as rolled back:
npx prisma migrate resolve --rolled-back 20251118211250_baseline_complete_schema

# Re-deploy (Vercel will retry)
```

### **Symptom: Build Succeeds but Runtime Errors**

**Error in browser console:**
```
PrismaClientKnownRequestError:
Invalid `prisma.course_tracking.create()` invocation:
Table 'public.course_tracking' does not exist
```

**Cause:** Migration didn't apply (old `npm run build` was used)

**Fix:** Ensure `vercel.json` uses `npm run vercel:build` (already fixed)

### **Symptom: Database Connection Timeout**

**Vercel logs show:**
```
Error: P1001: Can't reach database server at `...`
Connection timeout
```

**Possible Causes:**
1. Database is paused (Supabase free tier)
2. Wrong DATABASE_URL in Vercel env vars
3. IP allowlist blocks Vercel

**Fix:**
1. Wake up database: Visit Supabase dashboard
2. Verify DATABASE_URL: Check Vercel → Settings → Environment Variables
3. Check allowlist: Supabase → Database → Settings → Connection pooling

---

## 📊 Complete Environment Variable Matrix

| Environment | DATABASE_URL | Deploys To | Applies Migrations To |
|-------------|--------------|------------|----------------------|
| **Local Dev** | `.env` file → Your Supabase (port 5432) | localhost:3000 | Your dev database |
| **Your Vercel** | Vercel env vars → Your Supabase (port 6543) | bcs-web2.vercel.app | Your dev database |
| **University Vercel** | Vercel env vars → University Supabase (6543) | brainandcognitivescience.org | Production database |

**Port Difference Explained:**
- **5432** - Session pooler (for local dev, maintains persistent connection)
- **6543** - Transaction pooler (for serverless, short-lived connections)

---

## ✅ Deployment Checklist

Before pushing code with schema changes:

- [ ] Ran `npx prisma migrate dev --name descriptive_name` locally
- [ ] Migration file created in `prisma/migrations/[timestamp]_descriptive_name/`
- [ ] Reviewed generated SQL in `migration.sql`
- [ ] Tested migration on local database
- [ ] Verified application works with new schema (`npm run dev`)
- [ ] Committed both `schema.prisma` AND `prisma/migrations/` folder
- [ ] Pushed to GitHub
- [ ] Monitored Vercel deployment logs
- [ ] Verified migration applied successfully in build logs
- [ ] Tested live deployment (bcs-web2.vercel.app)
- [ ] Checked database has new tables/columns

---

## 🎯 Best Practices

### **DO:**
- ✅ Always use `npx prisma migrate dev` for schema changes
- ✅ Review generated migration SQL before committing
- ✅ Test migrations locally before deploying
- ✅ Commit migration files to Git
- ✅ Use descriptive migration names
- ✅ Monitor Vercel build logs after deployment
- ✅ Keep `vercel.json` using `npm run vercel:build`

### **DON'T:**
- ❌ Never use `npx prisma db push` (creates drift)
- ❌ Never edit migration files after creation
- ❌ Never delete migrations that were already deployed
- ❌ Never run `prisma migrate reset` on production
- ❌ Never change `buildCommand` in vercel.json back to `npm run build`
- ❌ Never skip testing migrations locally

---

## 🔄 Rollback Strategy (Emergency)

If a migration breaks production:

### **Option 1: Revert Migration (Preferred)**
```bash
# Create new migration that undoes changes
npx prisma migrate dev --name revert_feature_x

# Edit migration.sql to reverse changes:
# DROP TABLE course_tracking;
# ALTER TABLE courses DROP COLUMN tracking_count;

# Commit and deploy
git add prisma/migrations && git commit -m "Revert feature X" && git push
```

### **Option 2: Hotfix with New Migration**
```bash
# Create migration that fixes the issue
npx prisma migrate dev --name hotfix_feature_x

# Deploy immediately
git add prisma/migrations && git commit -m "Hotfix: feature X" && git push
```

### **Option 3: Rollback Deployment (Last Resort)**
```
Vercel Dashboard → Deployments → [Working Deployment] → "Promote to Production"
```
**Note:** This doesn't undo database migrations, only code changes.

---

## 📞 Support & References

**Documentation:**
- [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) - Migration workflow
- [DEV_PROD_WORKFLOW.md](./DEV_PROD_WORKFLOW.md) - Complete dev/prod process
- [Prisma Migrate Deploy](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production#production-and-testing-environments)

**Vercel Build Logs:**
- https://vercel.com/[your-username]/bcs-web2/deployments

**Database Access:**
- Supabase Dashboard: https://supabase.com/dashboard
- Prisma Studio: `npm run db:studio`

---

**Status:** ✅ CI/CD Pipeline is now correctly configured with migration support
**Last Verified:** November 18, 2025
