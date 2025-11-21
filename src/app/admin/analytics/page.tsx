import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { isAdmin } from '@/lib/auth/utils';
import AdminAnalyticsDashboard from '@/components/admin/AdminAnalyticsDashboard';
import { AdminLayout } from '@/components/admin/admin-layout';

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/analytics');
  }

  if (!isAdmin(session)) {
    redirect('/');
  }

  return (
    <AdminLayout>
      <AdminAnalyticsDashboard />
    </AdminLayout>
  );
}
