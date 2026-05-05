-- CreateTable
CREATE TABLE "public"."canvas_assignment_mappings" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "canvas_course_id" TEXT NOT NULL,
    "canvas_assignment_id" INTEGER NOT NULL,
    "canvas_assignment_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canvas_assignment_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."canvas_sync_logs" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "canvas_course_id" TEXT NOT NULL,
    "synced_by" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "quizzes_synced" INTEGER NOT NULL DEFAULT 0,
    "students_synced" INTEGER NOT NULL DEFAULT 0,
    "students_skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "canvas_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "canvas_assignment_mappings_course_id_idx" ON "public"."canvas_assignment_mappings"("course_id");

-- CreateIndex
CREATE INDEX "canvas_assignment_mappings_canvas_course_id_idx" ON "public"."canvas_assignment_mappings"("canvas_course_id");

-- CreateIndex
CREATE UNIQUE INDEX "canvas_assignment_mappings_quiz_id_canvas_course_id_key" ON "public"."canvas_assignment_mappings"("quiz_id", "canvas_course_id");

-- CreateIndex
CREATE INDEX "canvas_sync_logs_course_id_idx" ON "public"."canvas_sync_logs"("course_id");

-- CreateIndex
CREATE INDEX "canvas_sync_logs_synced_by_idx" ON "public"."canvas_sync_logs"("synced_by");

-- AddForeignKey
ALTER TABLE "public"."canvas_assignment_mappings" ADD CONSTRAINT "canvas_assignment_mappings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."canvas_sync_logs" ADD CONSTRAINT "canvas_sync_logs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."canvas_sync_logs" ADD CONSTRAINT "canvas_sync_logs_synced_by_fkey" FOREIGN KEY ("synced_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
