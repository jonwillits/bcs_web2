import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { LearningPathForm } from '@/components/faculty/LearningPathForm';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Create Learning Path | Faculty Dashboard',
  description: 'Create a new curated learning path'
};

export default async function CreateLearningPathPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Check if user is faculty or admin
  const userRole = session.user.role;
  if (userRole !== 'faculty' && userRole !== 'admin') {
    redirect('/');
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Create Learning Path</h1>
          <p className="text-slate-600 mt-2">
            Design a curated path through your curriculum to guide students toward specific learning goals
          </p>
        </div>

        <LearningPathForm />
      </div>
    </>
  );
}
