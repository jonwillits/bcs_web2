-- Enable Row Level Security on all public tables.
-- The app uses Prisma (postgres role) which bypasses RLS,
-- but this blocks unauthorized access via Supabase's PostgREST API.
-- No policies are added, so PostgREST access is fully denied.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_tracking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "module_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "module_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playgrounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playground_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playground_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_collaborators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "module_collaborators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collaboration_activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "faculty_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_gamification_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_paths" ENABLE ROW LEVEL SECURITY;
-- Note: _prisma_migrations is managed by Prisma and excluded here.
-- It can be secured manually via Supabase dashboard if needed.
