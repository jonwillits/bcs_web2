import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { isAdmin } from '@/lib/auth/utils';
import AdminAuditLogs from '@/components/admin/AdminAuditLogs';
import { AdminLayout } from '@/components/admin/admin-layout';

export default async function AdminAuditLogsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/audit-logs');
  }

  if (!isAdmin(session)) {
    redirect('/');
  }

  return (
    <AdminLayout>
      <AdminAuditLogs />
    </AdminLayout>
  );
}
