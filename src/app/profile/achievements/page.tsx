import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { PublicLayout } from '@/components/layouts/app-layout';
import { AchievementsView } from '@/components/achievements/AchievementsView';

export const metadata = {
  title: 'My Achievements | BCS E-Textbook',
  description: 'View your earned achievements and track your learning progress'
};

export default async function AchievementsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?redirect=/profile/achievements');
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <AchievementsView userId={session.user.id} />
      </div>
    </PublicLayout>
  );
}
