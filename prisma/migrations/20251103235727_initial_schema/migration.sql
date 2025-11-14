-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."course_modules" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "custom_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "author_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."module_media" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "media_file_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."modules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "description" TEXT,
    "author_id" TEXT NOT NULL,
    "parent_module_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "module_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'faculty',
    "about" TEXT,
    "speciality" TEXT,
    "interested_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "university" TEXT,
    "avatar_url" TEXT,
    "google_scholar_url" TEXT,
    "personal_website_url" TEXT,
    "linkedin_url" TEXT,
    "twitter_url" TEXT,
    "github_url" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "email_verification_token" TEXT,
    "email_verification_token_expires" TIMESTAMP(3),
    "last_verification_email_sent_at" TIMESTAMP(3),
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."playground_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "thumbnail" TEXT,
    "app_type" TEXT NOT NULL DEFAULT 'shinylive',
    "source_code" TEXT,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "default_controls" JSONB,
    "default_visualization" JSONB,
    "code_template" TEXT,
    "python_libraries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "js_libraries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "author_id" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "tags" TEXT[],
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playground_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."playgrounds" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "organization_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "share_url" TEXT NOT NULL,
    "app_type" TEXT NOT NULL DEFAULT 'shinylive',
    "source_code" TEXT,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "template_id" TEXT,
    "controls" JSONB,
    "visualization" JSONB,
    "code_config" JSONB,
    "published_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "fork_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_collaborators" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_by" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edit_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "course_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."module_collaborators" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_by" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edit_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "module_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collaboration_activity" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaboration_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_modules_course_id_idx" ON "public"."course_modules"("course_id");

-- CreateIndex
CREATE INDEX "course_modules_module_id_idx" ON "public"."course_modules"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_course_id_module_id_key" ON "public"."course_modules"("course_id", "module_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_course_id_sort_order_key" ON "public"."course_modules"("course_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "public"."courses"("slug");

-- CreateIndex
CREATE INDEX "courses_author_id_idx" ON "public"."courses"("author_id");

-- CreateIndex
CREATE INDEX "courses_slug_idx" ON "public"."courses"("slug");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "public"."courses"("status");

-- CreateIndex
CREATE INDEX "media_files_mime_type_idx" ON "public"."media_files"("mime_type");

-- CreateIndex
CREATE INDEX "media_files_uploaded_by_idx" ON "public"."media_files"("uploaded_by");

-- CreateIndex
CREATE INDEX "module_media_media_file_id_idx" ON "public"."module_media"("media_file_id");

-- CreateIndex
CREATE INDEX "module_media_module_id_idx" ON "public"."module_media"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "module_media_module_id_media_file_id_key" ON "public"."module_media"("module_id", "media_file_id");

-- CreateIndex
CREATE INDEX "modules_author_id_idx" ON "public"."modules"("author_id");

-- CreateIndex
CREATE INDEX "modules_parent_module_id_idx" ON "public"."modules"("parent_module_id");

-- CreateIndex
CREATE INDEX "modules_status_idx" ON "public"."modules"("status");

-- CreateIndex
CREATE INDEX "modules_tags_idx" ON "public"."modules"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "modules_parent_module_id_sort_order_key" ON "public"."modules"("parent_module_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verification_token_key" ON "public"."users"("email_verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "public"."users"("password_reset_token");

-- CreateIndex
CREATE INDEX "playground_templates_category_idx" ON "public"."playground_templates"("category");

-- CreateIndex
CREATE INDEX "playground_templates_author_id_idx" ON "public"."playground_templates"("author_id");

-- CreateIndex
CREATE INDEX "playground_templates_is_public_idx" ON "public"."playground_templates"("is_public");

-- CreateIndex
CREATE INDEX "playground_templates_app_type_idx" ON "public"."playground_templates"("app_type");

-- CreateIndex
CREATE UNIQUE INDEX "playgrounds_share_url_key" ON "public"."playgrounds"("share_url");

-- CreateIndex
CREATE INDEX "playgrounds_created_by_idx" ON "public"."playgrounds"("created_by");

-- CreateIndex
CREATE INDEX "playgrounds_template_id_idx" ON "public"."playgrounds"("template_id");

-- CreateIndex
CREATE INDEX "playgrounds_category_idx" ON "public"."playgrounds"("category");

-- CreateIndex
CREATE INDEX "playgrounds_is_public_idx" ON "public"."playgrounds"("is_public");

-- CreateIndex
CREATE INDEX "playgrounds_share_url_idx" ON "public"."playgrounds"("share_url");

-- CreateIndex
CREATE INDEX "playgrounds_app_type_idx" ON "public"."playgrounds"("app_type");

-- CreateIndex
CREATE INDEX "course_collaborators_course_id_idx" ON "public"."course_collaborators"("course_id");

-- CreateIndex
CREATE INDEX "course_collaborators_user_id_idx" ON "public"."course_collaborators"("user_id");

-- CreateIndex
CREATE INDEX "course_collaborators_added_by_idx" ON "public"."course_collaborators"("added_by");

-- CreateIndex
CREATE UNIQUE INDEX "course_collaborators_course_id_user_id_key" ON "public"."course_collaborators"("course_id", "user_id");

-- CreateIndex
CREATE INDEX "module_collaborators_module_id_idx" ON "public"."module_collaborators"("module_id");

-- CreateIndex
CREATE INDEX "module_collaborators_user_id_idx" ON "public"."module_collaborators"("user_id");

-- CreateIndex
CREATE INDEX "module_collaborators_added_by_idx" ON "public"."module_collaborators"("added_by");

-- CreateIndex
CREATE UNIQUE INDEX "module_collaborators_module_id_user_id_key" ON "public"."module_collaborators"("module_id", "user_id");

-- CreateIndex
CREATE INDEX "collaboration_activity_entity_type_entity_id_created_at_idx" ON "public"."collaboration_activity"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "collaboration_activity_user_id_created_at_idx" ON "public"."collaboration_activity"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "collaboration_activity_action_idx" ON "public"."collaboration_activity"("action");

-- CreateIndex
CREATE INDEX "collaboration_activity_created_at_idx" ON "public"."collaboration_activity"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "public"."course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_modules" ADD CONSTRAINT "course_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_files" ADD CONSTRAINT "media_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_media" ADD CONSTRAINT "module_media_media_file_id_fkey" FOREIGN KEY ("media_file_id") REFERENCES "public"."media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_media" ADD CONSTRAINT "module_media_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modules" ADD CONSTRAINT "modules_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modules" ADD CONSTRAINT "modules_parent_module_id_fkey" FOREIGN KEY ("parent_module_id") REFERENCES "public"."modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playground_templates" ADD CONSTRAINT "playground_templates_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playgrounds" ADD CONSTRAINT "playgrounds_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playgrounds" ADD CONSTRAINT "playgrounds_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."playground_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_collaborators" ADD CONSTRAINT "course_collaborators_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_collaborators" ADD CONSTRAINT "course_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_collaborators" ADD CONSTRAINT "course_collaborators_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_collaborators" ADD CONSTRAINT "module_collaborators_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_collaborators" ADD CONSTRAINT "module_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."module_collaborators" ADD CONSTRAINT "module_collaborators_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_activity" ADD CONSTRAINT "collaboration_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

