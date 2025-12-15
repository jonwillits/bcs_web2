import { Suspense } from 'react';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { QuestMapEditor } from '@/components/faculty/QuestMapEditor';
import { AuthenticatedLayout } from '@/components/layouts/app-layout';
import { Loader2, Map } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Quest Map Editor | Faculty Dashboard',
  description: 'Edit the quest map layout for published modules',
};

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Loader2 className="h-8 w-8 animate-spin text-neural-primary" />
    </div>
  );
}

export default async function QuestMapPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (!hasFacultyAccess(session)) {
    redirect('/');
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-neural-primary to-synapse-primary rounded-lg">
              <Map className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                Quest Map Editor
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Organize and visualize your module learning paths
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-4 md:mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex gap-3">
              <Map className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-blue-900 space-y-1">
                <p className="font-medium">Quest Map Layout</p>
                <p className="text-blue-800">
                  Drag modules to position them on the quest map. Connect modules by setting prerequisites in the sidebar.
                  Use auto-layout to automatically organize modules based on their dependencies.
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-800 mt-2">
                  <li><strong>Beginner</strong> modules are shown in green</li>
                  <li><strong>Intermediate</strong> modules are shown in blue</li>
                  <li><strong>Advanced</strong> modules are shown in orange</li>
                  <li><strong>Boss</strong> modules are shown in red/purple</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Suspense fallback={<LoadingState />}>
          <QuestMapEditor />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}
