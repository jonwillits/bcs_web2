import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { isAdmin } from '@/lib/auth/utils';
import AdminUsersManagement from '@/components/admin/AdminUsersManagement';
import { AdminLayout } from '@/components/admin/admin-layout';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/users');
  }

  if (!isAdmin(session)) {
    redirect('/');
  }

  return (
    <AdminLayout>
      <AdminUsersManagement />
    </AdminLayout>
  );
}
