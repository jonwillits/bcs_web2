import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasFacultyAccess } from "@/lib/auth/utils";
import { CreateModuleForm } from "@/components/faculty/create-module-form";

export default async function CreateModulePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (!hasFacultyAccess(session)) {
    redirect("/");
  }

  return <CreateModuleForm />;
}
