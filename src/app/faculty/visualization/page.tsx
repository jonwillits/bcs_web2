import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasFacultyAccess } from "@/lib/auth/utils";
import { NetworkVisualization } from "@/components/faculty/network-visualization";
import { IntegratedGraphSystem } from "@/components/visualization/integrated-graph-system";
import { AuthenticatedLayout } from "@/components/layouts/app-layout";

export const metadata = {
  title: "Content Structure Visualization - BCS Faculty",
  description: "Interactive network visualization of your courses and module relationships",
};

export default async function VisualizationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (!hasFacultyAccess(session)) {
    redirect("/");
  }

  return (
    <AuthenticatedLayout showFooter={false}>
      <div className="flex-1 h-[calc(100vh-4rem)]">
        {/* Interactive Faculty Visualization Tool - Full Page */}
        <IntegratedGraphSystem
          mode="faculty"
          className="h-full"
        />
      </div>
    </AuthenticatedLayout>
  );
}
