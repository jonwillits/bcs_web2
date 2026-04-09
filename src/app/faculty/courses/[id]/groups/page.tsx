import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { AuthenticatedLayout } from '@/components/layouts/app-layout';
import { CourseGroupsManager } from '@/components/faculty/CourseGroupsManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseGroupsPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (!hasFacultyAccess(session)) {
    redirect('/');
  }

  return (
    <AuthenticatedLayout>
      <CourseGroupsManager courseId={id} />
    </AuthenticatedLayout>
  );
}
