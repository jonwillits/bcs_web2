-- Quiz V2: Drop V1 tables and create clean schema

-- Drop V1 quiz tables (order matters for foreign keys)
DROP TABLE IF EXISTS "quiz_attempt_answers" CASCADE;
DROP TABLE IF EXISTS "quiz_attempts" CASCADE;
DROP TABLE IF EXISTS "quiz_question_options" CASCADE;
DROP TABLE IF EXISTS "quiz_questions" CASCADE;
DROP TABLE IF EXISTS "quizzes" CASCADE;

-- Add unlock_condition to modules
ALTER TABLE "modules" ADD COLUMN "unlock_condition" TEXT NOT NULL DEFAULT 'completion';

-- Create Question Banks
CREATE TABLE "question_banks" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Question Bank',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

-- Create Question Sets
CREATE TABLE "question_sets" (
    "id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_sets_pkey" PRIMARY KEY ("id")
);

-- Create Bank Questions
CREATE TABLE "bank_questions" (
    "id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 1,
    "shuffle_answers" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "cloned_from" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_questions_pkey" PRIMARY KEY ("id")
);

-- Create Bank Question Options
CREATE TABLE "bank_question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "bank_question_options_pkey" PRIMARY KEY ("id")
);

-- Create Question Set Memberships
CREATE TABLE "question_set_memberships" (
    "id" TEXT NOT NULL,
    "set_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_set_memberships_pkey" PRIMARY KEY ("id")
);

-- Create Quizzes V2
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quiz_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "xp_reward" INTEGER NOT NULL DEFAULT 50,
    "randomize_blocks" BOOLEAN NOT NULL DEFAULT false,
    "time_limit_minutes" INTEGER,
    "max_attempts" INTEGER NOT NULL DEFAULT 0,
    "pass_threshold" INTEGER NOT NULL DEFAULT 70,
    "scoring_procedure" TEXT NOT NULL DEFAULT 'best',
    "scoring_drop_count" INTEGER NOT NULL DEFAULT 0,
    "feedback_timing" TEXT NOT NULL DEFAULT 'after_quiz',
    "feedback_depth" TEXT NOT NULL DEFAULT 'full',
    "mastery_threshold" INTEGER NOT NULL DEFAULT 80,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- Create Quiz Blocks
CREATE TABLE "quiz_blocks" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "set_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "show_title" BOOLEAN NOT NULL DEFAULT false,
    "questions_to_pull" INTEGER NOT NULL,
    "randomize_within" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_blocks_pkey" PRIMARY KEY ("id")
);

-- Create Quiz Attempts V2
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT,
    "quiz_type" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "score" DOUBLE PRECISION,
    "raw_score" DOUBLE PRECISION,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "points_possible" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "time_spent_seconds" INTEGER,
    "xp_awarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- Create Quiz Question Instances
CREATE TABLE "quiz_question_instances" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_version" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sort_order" INTEGER NOT NULL,
    "question_text_snapshot" TEXT NOT NULL,
    "options_snapshot" JSONB NOT NULL,

    CONSTRAINT "quiz_question_instances_pkey" PRIMARY KEY ("id")
);

-- Create Quiz Attempt Answers V2
CREATE TABLE "quiz_attempt_answers" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_instance_id" TEXT NOT NULL,
    "block_id" TEXT,
    "selected_option_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_correct" BOOLEAN,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "response_time_ms" INTEGER,

    CONSTRAINT "quiz_attempt_answers_pkey" PRIMARY KEY ("id")
);

-- Create Quiz Response Events
CREATE TABLE "quiz_response_events" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "quiz_type" TEXT NOT NULL,
    "block_id" TEXT,
    "question_id" TEXT NOT NULL,
    "question_version" INTEGER NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response" JSONB NOT NULL,
    "is_correct" BOOLEAN,
    "response_time_ms" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "quiz_response_events_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "question_banks_module_id_key" ON "question_banks"("module_id");
CREATE UNIQUE INDEX "question_set_memberships_set_id_question_id_key" ON "question_set_memberships"("set_id", "question_id");
CREATE UNIQUE INDEX "quizzes_module_id_quiz_type_key" ON "quizzes"("module_id", "quiz_type");
CREATE UNIQUE INDEX "quiz_attempts_quiz_id_user_id_attempt_number_key" ON "quiz_attempts"("quiz_id", "user_id", "attempt_number");
CREATE UNIQUE INDEX "quiz_question_instances_attempt_id_question_id_key" ON "quiz_question_instances"("attempt_id", "question_id");
CREATE UNIQUE INDEX "quiz_attempt_answers_attempt_id_question_id_key" ON "quiz_attempt_answers"("attempt_id", "question_id");

-- Indexes
CREATE INDEX "question_banks_module_id_idx" ON "question_banks"("module_id");
CREATE INDEX "question_sets_bank_id_idx" ON "question_sets"("bank_id");
CREATE INDEX "bank_questions_bank_id_idx" ON "bank_questions"("bank_id");
CREATE INDEX "bank_question_options_question_id_idx" ON "bank_question_options"("question_id");
CREATE INDEX "question_set_memberships_set_id_idx" ON "question_set_memberships"("set_id");
CREATE INDEX "question_set_memberships_question_id_idx" ON "question_set_memberships"("question_id");
CREATE INDEX "quizzes_module_id_idx" ON "quizzes"("module_id");
CREATE INDEX "quiz_blocks_quiz_id_idx" ON "quiz_blocks"("quiz_id");
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "quiz_attempts"("quiz_id");
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts"("user_id");
CREATE INDEX "quiz_attempts_user_id_quiz_id_idx" ON "quiz_attempts"("user_id", "quiz_id");
CREATE INDEX "quiz_question_instances_attempt_id_idx" ON "quiz_question_instances"("attempt_id");
CREATE INDEX "quiz_attempt_answers_attempt_id_idx" ON "quiz_attempt_answers"("attempt_id");
CREATE INDEX "quiz_response_events_quiz_id_idx" ON "quiz_response_events"("quiz_id");
CREATE INDEX "quiz_response_events_question_id_idx" ON "quiz_response_events"("question_id");
CREATE INDEX "quiz_response_events_user_id_idx" ON "quiz_response_events"("user_id");
CREATE INDEX "quiz_response_events_module_id_idx" ON "quiz_response_events"("module_id");

-- Foreign keys
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "question_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_questions" ADD CONSTRAINT "bank_questions_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "question_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_question_options" ADD CONSTRAINT "bank_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "bank_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_set_memberships" ADD CONSTRAINT "question_set_memberships_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_set_memberships" ADD CONSTRAINT "question_set_memberships_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "bank_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_blocks" ADD CONSTRAINT "quiz_blocks_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_blocks" ADD CONSTRAINT "quiz_blocks_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_question_instances" ADD CONSTRAINT "quiz_question_instances_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS on new tables
ALTER TABLE "question_banks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "question_sets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_question_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "question_set_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quizzes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quiz_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quiz_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quiz_question_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quiz_attempt_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quiz_response_events" ENABLE ROW LEVEL SECURITY;
