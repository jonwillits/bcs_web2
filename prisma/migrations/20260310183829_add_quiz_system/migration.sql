-- CreateTable
CREATE TABLE "public"."quizzes" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "time_limit_minutes" INTEGER,
    "max_attempts" INTEGER NOT NULL DEFAULT 0,
    "pass_threshold" INTEGER NOT NULL DEFAULT 70,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "shuffle_options" BOOLEAN NOT NULL DEFAULT false,
    "show_correct_answers" TEXT NOT NULL DEFAULT 'after_submission',
    "require_pass_to_complete" BOOLEAN NOT NULL DEFAULT false,
    "xp_reward" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quiz_questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "explanation" TEXT,
    "sort_order" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "short_answer_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "case_sensitive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quiz_question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "quiz_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quiz_attempts" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT,
    "attempt_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "score" DOUBLE PRECISION,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "points_possible" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "time_spent_seconds" INTEGER,
    "xp_awarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quiz_attempt_answers" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "text_answer" TEXT,
    "is_correct" BOOLEAN,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "graded_by" TEXT,
    "graded_at" TIMESTAMP(3),
    "grading_note" TEXT,

    CONSTRAINT "quiz_attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_module_id_key" ON "public"."quizzes"("module_id");

-- CreateIndex
CREATE INDEX "quizzes_module_id_idx" ON "public"."quizzes"("module_id");

-- CreateIndex
CREATE INDEX "quiz_questions_quiz_id_idx" ON "public"."quiz_questions"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_quiz_id_sort_order_key" ON "public"."quiz_questions"("quiz_id", "sort_order");

-- CreateIndex
CREATE INDEX "quiz_question_options_question_id_idx" ON "public"."quiz_question_options"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_question_options_question_id_sort_order_key" ON "public"."quiz_question_options"("question_id", "sort_order");

-- CreateIndex
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "public"."quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "public"."quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_quiz_id_idx" ON "public"."quiz_attempts"("user_id", "quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_quiz_id_user_id_attempt_number_key" ON "public"."quiz_attempts"("quiz_id", "user_id", "attempt_number");

-- CreateIndex
CREATE INDEX "quiz_attempt_answers_attempt_id_idx" ON "public"."quiz_attempt_answers"("attempt_id");

-- CreateIndex
CREATE INDEX "quiz_attempt_answers_question_id_idx" ON "public"."quiz_attempt_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempt_answers_attempt_id_question_id_key" ON "public"."quiz_attempt_answers"("attempt_id", "question_id");

-- AddForeignKey
ALTER TABLE "public"."quizzes" ADD CONSTRAINT "quizzes_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_question_options" ADD CONSTRAINT "quiz_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
