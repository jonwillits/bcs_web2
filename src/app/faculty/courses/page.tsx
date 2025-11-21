import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasFacultyAccess } from "@/lib/auth/utils";
import { CourseLibrary } from "@/components/faculty/course-library";
import { AuthenticatedLayout } from "@/components/layouts/app-layout";

export default async function CoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (!hasFacultyAccess(session)) {
    redirect("/");
  }

  return (
    <AuthenticatedLayout>
      <CourseLibrary />
    </AuthenticatedLayout>
  );
}
