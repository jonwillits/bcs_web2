-- AlterTable
ALTER TABLE "public"."module_progress" ALTER COLUMN "course_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "learning_paths_slug_idx" ON "public"."learning_paths"("slug");

-- CreateIndex
CREATE INDEX "module_progress_user_id_module_id_idx" ON "public"."module_progress"("user_id", "module_id");
