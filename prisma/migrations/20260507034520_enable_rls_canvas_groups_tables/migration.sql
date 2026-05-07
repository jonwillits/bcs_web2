-- Enable Row Level Security on the 4 Canvas/Groups tables added after
-- the initial RLS migration. Same pattern: no policies are added, so
-- PostgREST (anon/authenticated) access is fully denied. Prisma uses
-- the postgres role which bypasses RLS.

ALTER TABLE "course_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_group_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "canvas_assignment_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "canvas_sync_logs" ENABLE ROW LEVEL SECURITY;
