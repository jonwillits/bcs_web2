-- AlterTable: Add progress tracking fields to course_tracking
ALTER TABLE "course_tracking" ADD COLUMN "completion_pct" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "course_tracking" ADD COLUMN "modules_completed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "course_tracking" ADD COLUMN "modules_total" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: module_progress for tracking module completion
CREATE TABLE "module_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on user_id + module_id + course_id
CREATE UNIQUE INDEX "module_progress_user_id_module_id_course_id_key" ON "module_progress"("user_id", "module_id", "course_id");

-- CreateIndex: Performance indexes
CREATE INDEX "module_progress_user_id_idx" ON "module_progress"("user_id");
CREATE INDEX "module_progress_module_id_idx" ON "module_progress"("module_id");
CREATE INDEX "module_progress_course_id_idx" ON "module_progress"("course_id");
CREATE INDEX "module_progress_status_idx" ON "module_progress"("status");
CREATE INDEX "module_progress_user_id_course_id_idx" ON "module_progress"("user_id", "course_id");

-- AddForeignKey: module_progress -> users
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: module_progress -> modules
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: module_progress -> courses
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
