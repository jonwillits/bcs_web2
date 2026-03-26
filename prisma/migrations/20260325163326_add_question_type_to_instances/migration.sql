-- AlterTable
ALTER TABLE "public"."quiz_question_instances" ADD COLUMN     "question_type" TEXT NOT NULL DEFAULT 'multiple_choice';
