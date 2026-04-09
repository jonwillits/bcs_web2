-- CreateTable
CREATE TABLE "public"."course_groups" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canvas_course_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_group_memberships" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_by" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_groups_course_id_idx" ON "public"."course_groups"("course_id");

-- CreateIndex
CREATE INDEX "course_groups_canvas_course_id_idx" ON "public"."course_groups"("canvas_course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_groups_course_id_name_key" ON "public"."course_groups"("course_id", "name");

-- CreateIndex
CREATE INDEX "course_group_memberships_user_id_idx" ON "public"."course_group_memberships"("user_id");

-- CreateIndex
CREATE INDEX "course_group_memberships_group_id_idx" ON "public"."course_group_memberships"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_group_memberships_group_id_user_id_key" ON "public"."course_group_memberships"("group_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."course_groups" ADD CONSTRAINT "course_groups_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_groups" ADD CONSTRAINT "course_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_group_memberships" ADD CONSTRAINT "course_group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_group_memberships" ADD CONSTRAINT "course_group_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_group_memberships" ADD CONSTRAINT "course_group_memberships_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
