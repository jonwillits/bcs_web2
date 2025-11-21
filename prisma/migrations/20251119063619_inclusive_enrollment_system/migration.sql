-- InclusiveEnrollmentSystem: Rename student_id to user_id to allow all users to enroll
-- This allows faculty and admin to enroll in courses as learners, not just students

-- Step 1: Drop existing constraints and indexes that reference student_id
DROP INDEX IF EXISTS "course_tracking_student_id_started_at_idx";
ALTER TABLE "course_tracking" DROP CONSTRAINT IF EXISTS "course_tracking_student_id_fkey";
ALTER TABLE "course_tracking" DROP CONSTRAINT IF EXISTS "course_tracking_course_id_student_id_key";

-- Step 2: Rename the column
ALTER TABLE "course_tracking" RENAME COLUMN "student_id" TO "user_id";

-- Step 3: Recreate unique constraint with new column name
ALTER TABLE "course_tracking" ADD CONSTRAINT "course_tracking_course_id_user_id_key" UNIQUE ("course_id", "user_id");

-- Step 4: Recreate foreign key with new column name
ALTER TABLE "course_tracking" ADD CONSTRAINT "course_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Recreate indexes with new column name
CREATE INDEX "course_tracking_user_id_started_at_idx" ON "course_tracking"("user_id", "started_at" DESC);

-- Note: course_tracking_course_id_started_at_idx already exists and doesn't need recreation
