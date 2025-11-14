-- AlterTable
ALTER TABLE "public"."course_modules" ADD COLUMN     "custom_context" TEXT,
ADD COLUMN     "custom_notes" TEXT,
ADD COLUMN     "custom_objectives" TEXT;

-- AlterTable
ALTER TABLE "public"."modules" ADD COLUMN     "clone_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cloned_from" TEXT,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'public';

-- CreateIndex
CREATE INDEX "modules_visibility_idx" ON "public"."modules"("visibility");

-- CreateIndex
CREATE INDEX "modules_cloned_from_idx" ON "public"."modules"("cloned_from");

-- CreateIndex
CREATE INDEX "modules_status_visibility_idx" ON "public"."modules"("status", "visibility");

-- AddForeignKey
ALTER TABLE "public"."modules" ADD CONSTRAINT "modules_cloned_from_fkey" FOREIGN KEY ("cloned_from") REFERENCES "public"."modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
