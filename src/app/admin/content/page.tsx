import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/utils';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ContentModerationView } from '@/components/admin/ContentModerationView';

export const metadata = {
  title: 'Content Management | Admin Dashboard',
  description: 'Manage and moderate all courses and modules across the platform',
};

export default async function AdminContentPage() {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content');
  }

  // Check admin role
  if (!isAdmin(session)) {
    redirect('/');
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-neural-primary mb-2">
            Content Management
          </h2>
          <p className="text-muted-foreground">
            View and moderate all courses and modules across the platform
          </p>
        </div>

        <ContentModerationView />
      </div>
    </AdminLayout>
  );
}
