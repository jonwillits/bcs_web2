-- AlterTable
ALTER TABLE "public"."playgrounds" ADD COLUMN     "featured_at" TIMESTAMP(3),
ADD COLUMN     "featured_by" TEXT,
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_protected" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "playgrounds_is_featured_idx" ON "public"."playgrounds"("is_featured");
