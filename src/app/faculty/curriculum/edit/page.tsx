import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { CurriculumMapEditor } from '@/components/faculty/CurriculumMapEditor';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Edit Curriculum Map | Faculty Dashboard',
  description: 'Edit curriculum map layout and course prerequisites'
};

export default async function CurriculumEditPage() {
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
          <h1 className="text-3xl font-bold text-slate-900">Curriculum Map Editor</h1>
          <p className="text-slate-600 mt-2">
            Organize your curriculum by positioning courses and setting prerequisites.
          </p>
        </div>

        <CurriculumMapEditor />
      </div>
    </>
  );
}
