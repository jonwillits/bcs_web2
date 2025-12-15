import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { NeuralButton } from '@/components/ui/neural-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, Star, Map } from 'lucide-react';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Learning Paths | Faculty Dashboard',
  description: 'Manage learning paths'
};

async function getLearningPaths(userId: string) {
  return await withDatabaseRetry(async () => {
    return await prisma.learning_paths.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        course_ids: true,
        is_featured: true,
        sort_order: true,
        created_at: true,
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { is_featured: 'desc' },
        { sort_order: 'asc' },
        { created_at: 'desc' }
      ]
    });
  });
}

export default async function FacultyLearningPathsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Check if user is faculty or admin
  const userRole = session.user.role;
  if (userRole !== 'faculty' && userRole !== 'admin') {
    redirect('/');
  }

  const paths = await getLearningPaths(session.user.id);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Learning Paths</h1>
          <p className="text-slate-600 mt-2">
            Create and manage curated learning paths for students
          </p>
        </div>
        <Link href="/faculty/paths/create">
          <NeuralButton>
            <Plus className="h-4 w-4 mr-2" />
            Create New Path
          </NeuralButton>
        </Link>
      </div>

      {paths.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Map className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              No Learning Paths Yet
            </h2>
            <p className="text-slate-600 mb-6">
              Create your first learning path to guide students through a curated curriculum
            </p>
            <Link href="/faculty/paths/create">
              <NeuralButton>
                <Plus className="h-4 w-4 mr-2" />
                Create Learning Path
              </NeuralButton>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paths.map(path => (
            <Card key={path.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{path.title}</h3>
                      {path.is_featured && (
                        <Badge variant="default" className="bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    {path.description && (
                      <p className="text-slate-600 mb-3">{path.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{path.course_ids.length} courses</span>
                      <span>•</span>
                      <span>Created by {path.creator.name}</span>
                      <span>•</span>
                      <span>{new Date(path.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/paths/${path.slug}`} target="_blank">
                      <NeuralButton variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </NeuralButton>
                    </Link>
                    <Link href={`/faculty/paths/edit/${path.slug}`}>
                      <NeuralButton variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </NeuralButton>
                    </Link>
                    {(path.creator.id === session.user.id || userRole === 'admin') && (
                      <form
                        action={async () => {
                          'use server';
                          await prisma.learning_paths.delete({
                            where: { id: path.id }
                          });
                          redirect('/faculty/paths');
                        }}
                      >
                        <NeuralButton
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </NeuralButton>
                      </form>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
