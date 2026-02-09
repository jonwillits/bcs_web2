-- Drop the stale index left over from the student_id -> user_id rename.
-- The rename migration used DROP CONSTRAINT which didn't remove the index
-- because it was originally created as CREATE UNIQUE INDEX, not a constraint.
DROP INDEX IF EXISTS "course_tracking_course_id_student_id_key";
