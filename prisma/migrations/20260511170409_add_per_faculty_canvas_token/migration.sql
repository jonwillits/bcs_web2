-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "canvas_api_token_encrypted" TEXT,
ADD COLUMN     "canvas_token_updated_at" TIMESTAMP(3);
