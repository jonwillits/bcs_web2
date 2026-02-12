-- Rename quest map columns to course map
ALTER TABLE "modules" RENAME COLUMN "quest_map_position_x" TO "course_map_position_x";
ALTER TABLE "modules" RENAME COLUMN "quest_map_position_y" TO "course_map_position_y";

-- Rename curriculum map columns to program map
ALTER TABLE "courses" RENAME COLUMN "curriculum_position_x" TO "program_position_x";
ALTER TABLE "courses" RENAME COLUMN "curriculum_position_y" TO "program_position_y";
