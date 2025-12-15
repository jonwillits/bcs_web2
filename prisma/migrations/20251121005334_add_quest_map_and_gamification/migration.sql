-- AlterTable
ALTER TABLE "public"."module_progress" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "started_at" TIMESTAMP(3),
ADD COLUMN     "xp_earned" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."modules" ADD COLUMN     "difficulty_level" TEXT NOT NULL DEFAULT 'beginner',
ADD COLUMN     "estimated_minutes" INTEGER,
ADD COLUMN     "prerequisite_module_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "quest_map_position_x" DOUBLE PRECISION DEFAULT 50,
ADD COLUMN     "quest_map_position_y" DOUBLE PRECISION DEFAULT 50,
ADD COLUMN     "quest_type" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "xp_reward" INTEGER NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "public"."achievements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "badge_color" TEXT NOT NULL DEFAULT 'gray',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_gamification_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_date" TIMESTAMP(3),
    "total_time_minutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_gamification_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."learning_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "minutes_studied" INTEGER NOT NULL DEFAULT 0,
    "modules_viewed" INTEGER NOT NULL DEFAULT 0,
    "modules_completed" INTEGER NOT NULL DEFAULT 0,
    "courses_accessed" INTEGER NOT NULL DEFAULT 0,
    "first_activity" TIMESTAMP(3),
    "last_activity" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "achievements_category_idx" ON "public"."achievements"("category");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "public"."user_achievements"("user_id");

-- CreateIndex
CREATE INDEX "user_achievements_earned_at_idx" ON "public"."user_achievements"("earned_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "public"."user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_gamification_stats_user_id_key" ON "public"."user_gamification_stats"("user_id");

-- CreateIndex
CREATE INDEX "user_gamification_stats_total_xp_idx" ON "public"."user_gamification_stats"("total_xp");

-- CreateIndex
CREATE INDEX "user_gamification_stats_level_idx" ON "public"."user_gamification_stats"("level");

-- CreateIndex
CREATE INDEX "learning_sessions_user_id_idx" ON "public"."learning_sessions"("user_id");

-- CreateIndex
CREATE INDEX "learning_sessions_date_idx" ON "public"."learning_sessions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "learning_sessions_user_id_date_key" ON "public"."learning_sessions"("user_id", "date");

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_gamification_stats" ADD CONSTRAINT "user_gamification_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
