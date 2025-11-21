import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasFacultyAccess } from "@/lib/auth/utils";
import { ModuleViewer } from "@/components/faculty/module-viewer";

export default async function ModuleViewPage({
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

  return <ModuleViewer moduleId={id} />;
}
