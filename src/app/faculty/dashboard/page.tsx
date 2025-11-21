import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasFacultyAccess } from "@/lib/auth/utils";
import { FacultyDashboard } from "@/components/faculty/dashboard";
import { AuthenticatedLayout } from "@/components/layouts/app-layout";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (!hasFacultyAccess(session)) {
    redirect("/");
  }

  return (
    <AuthenticatedLayout>
      <FacultyDashboard user={session.user} />
    </AuthenticatedLayout>
  );
}
