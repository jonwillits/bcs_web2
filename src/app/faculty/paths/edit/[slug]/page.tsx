import { auth } from '@/lib/auth/config';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { LearningPathForm } from '@/components/faculty/LearningPathForm';
import { Header } from '@/components/Header';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const path = await withDatabaseRetry(async () => {
    return await prisma.learning_paths.findUnique({
      where: { slug },
      select: { title: true }
    });
  });

  return {
    title: path ? `Edit ${path.title} | Faculty Dashboard` : 'Edit Learning Path',
    description: 'Edit learning path details and courses'
  };
}

export default async function EditLearningPathPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Check if user is faculty or admin
  const userRole = session.user.role;
  if (userRole !== 'faculty' && userRole !== 'admin') {
    redirect('/');
  }

  const { slug } = await params;

  const path = await withDatabaseRetry(async () => {
    return await prisma.learning_paths.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        course_ids: true,
        is_featured: true,
        sort_order: true,
        created_by: true
      }
    });
  });

  if (!path) {
    notFound();
  }

  // Check permissions (must be creator or admin)
  if (path.created_by !== session.user.id && userRole !== 'admin') {
    redirect('/faculty/paths');
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Edit Learning Path</h1>
          <p className="text-slate-600 mt-2">
            Update path details, reorder courses, or change prerequisites
          </p>
        </div>

        <LearningPathForm
          initialData={{
            title: path.title,
            slug: path.slug,
            description: path.description,
            course_ids: path.course_ids,
            is_featured: path.is_featured,
            sort_order: path.sort_order
          }}
          isEdit
        />
      </div>
    </>
  );
}
