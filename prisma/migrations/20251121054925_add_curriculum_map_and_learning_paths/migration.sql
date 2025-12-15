-- Add curriculum map fields to courses table
ALTER TABLE "courses" ADD COLUMN "prerequisite_course_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "courses" ADD COLUMN "curriculum_position_x" DOUBLE PRECISION DEFAULT 50;
ALTER TABLE "courses" ADD COLUMN "curriculum_position_y" DOUBLE PRECISION DEFAULT 50;

-- Create learning_paths table
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "course_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on slug
CREATE UNIQUE INDEX "learning_paths_slug_key" ON "learning_paths"("slug");

-- Create indexes for performance
CREATE INDEX "learning_paths_created_by_idx" ON "learning_paths"("created_by");
CREATE INDEX "learning_paths_is_featured_idx" ON "learning_paths"("is_featured");

-- Add foreign key constraint to users
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
