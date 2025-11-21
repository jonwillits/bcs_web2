import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { AuthenticatedLayout } from '@/components/layouts/app-layout';
import CourseAnalyticsDashboard from '@/components/faculty/analytics/CourseAnalyticsDashboard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseAnalyticsPage({ params }: PageProps) {
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
      <Suspense fallback={<div className="text-muted-foreground">Loading analytics...</div>}>
        <CourseAnalyticsDashboard courseId={id} />
      </Suspense>
    </AuthenticatedLayout>
  );
}
