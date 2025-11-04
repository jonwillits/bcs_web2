import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { EditCourseForm } from "@/components/faculty/edit-course-form";
import { AuthenticatedLayout } from "@/components/layouts/app-layout";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "faculty") {
    redirect("/");
  }

  const { id } = await params;

  return (
    <AuthenticatedLayout>
      <EditCourseForm courseId={id} />
    </AuthenticatedLayout>
  );
}
