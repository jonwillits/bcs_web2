import { auth } from '@/lib/auth/config';
import { ProgramMapAuthenticated } from '@/components/program-map/ProgramMapAuthenticated';
import { ProgramMapPublic } from '@/components/program-map/ProgramMapPublic';
import { Header } from '@/components/Header';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Program Map | BCS E-Textbook',
  description: 'Explore the complete program and course relationships'
};

export default async function ProgramMapPage() {
  const session = await auth();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">
        {session?.user?.id ? (
          <ProgramMapAuthenticated userId={session.user.id} />
        ) : (
          <ProgramMapPublic />
        )}
      </div>
    </div>
  );
}
