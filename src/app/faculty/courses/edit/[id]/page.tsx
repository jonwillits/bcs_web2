import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { hasFacultyAccess } from "@/lib/auth/utils";
import { EditCourseForm } from "@/components/faculty/edit-course-form";
import { AuthenticatedLayout } from "@/components/layouts/app-layout";
import { prisma } from "@/lib/db";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (!hasFacultyAccess(session)) {
    redirect("/");
  }

  const { id } = await params;

  // Check if user is authorized to edit this course
  const course = await prisma.courses.findUnique({
    where: { id },
    select: {
      id: true,
      author_id: true,
      collaborators: {
        where: { user_id: session.user.id },
        select: { id: true },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // User must be either the author or a collaborator
  const isAuthor = course.author_id === session.user.id;
  const isCollaborator = course.collaborators.length > 0;

  if (!isAuthor && !isCollaborator) {
    redirect("/faculty/dashboard?error=unauthorized");
  }

  return (
    <AuthenticatedLayout>
      <EditCourseForm courseId={id} />
    </AuthenticatedLayout>
  );
}
