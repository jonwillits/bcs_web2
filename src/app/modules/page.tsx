import { ModuleCatalog } from "@/components/public/module-catalog";
import { PublicLayout } from "@/components/layouts/app-layout";
import { auth } from "@/lib/auth/config";

export const metadata = {
  title: "Module Catalog - BCS Interactive Platform",
  description: "Explore individual learning modules in Brain and Cognitive Sciences. Interactive educational content created by expert faculty.",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ModulesPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialSearch = typeof params.search === 'string' ? params.search : '';
  const session = await auth();

  return (
    <PublicLayout>
      <ModuleCatalog initialSearch={initialSearch} session={session} />
    </PublicLayout>
  );
}
