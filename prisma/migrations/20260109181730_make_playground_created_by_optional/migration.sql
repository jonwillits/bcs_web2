-- DropForeignKey
ALTER TABLE "public"."playgrounds" DROP CONSTRAINT "playgrounds_created_by_fkey";

-- AlterTable
ALTER TABLE "public"."playgrounds" ALTER COLUMN "created_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."playgrounds" ADD CONSTRAINT "playgrounds_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
