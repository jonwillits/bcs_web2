-- AlterTable
ALTER TABLE "public"."playgrounds" ADD COLUMN     "forked_from" TEXT;

-- CreateTable
CREATE TABLE "public"."playground_versions" (
    "id" TEXT NOT NULL,
    "playground_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source_code" TEXT NOT NULL,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_note" TEXT,
    "save_type" TEXT NOT NULL DEFAULT 'manual',

    CONSTRAINT "playground_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "playground_versions_playground_id_created_at_idx" ON "public"."playground_versions"("playground_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "playground_versions_created_by_idx" ON "public"."playground_versions"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "playground_versions_playground_id_version_key" ON "public"."playground_versions"("playground_id", "version");

-- CreateIndex
CREATE INDEX "playgrounds_forked_from_idx" ON "public"."playgrounds"("forked_from");

-- AddForeignKey
ALTER TABLE "public"."playgrounds" ADD CONSTRAINT "playgrounds_forked_from_fkey" FOREIGN KEY ("forked_from") REFERENCES "public"."playgrounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playground_versions" ADD CONSTRAINT "playground_versions_playground_id_fkey" FOREIGN KEY ("playground_id") REFERENCES "public"."playgrounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playground_versions" ADD CONSTRAINT "playground_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
