import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { arrayToDependencies } from '@/lib/react-playground/sandpack-config';
import { CATEGORY_LABELS } from '@/types/react-playground';
import { Eye, ArrowLeft, Edit, Package, Calendar } from 'lucide-react';
import PlaygroundViewerClient from '@/components/react-playground/PlaygroundViewerClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Playground - BCS E-Textbook',
  description: 'Interactive educational playground',
};

async function getPlayground(id: string) {
  try {
    const playground = await prisma.playgrounds.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            university: true,
            speciality: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Increment view count
    if (playground) {
      await prisma.playgrounds.update({
        where: { id },
        data: { view_count: { increment: 1 } },
      });
    }

    return playground;
  } catch (error) {
    console.error('Failed to fetch playground:', error);
    return null;
  }
}

export default async function PlaygroundPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const playground = await getPlayground(id);

  if (!playground) {
    notFound();
  }

  // Check access permissions
  if (!playground.is_public && playground.created_by !== session?.user?.id) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">This playground is private.</p>
          <Link
            href="/playgrounds"
            className="inline-flex items-center gap-2 text-neural-primary hover:text-neural-primary/80 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Public Playgrounds
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === playground.created_by;
  const isFaculty =
    session?.user?.role === 'faculty' || session?.user?.role === 'admin';

  // Convert requirements array to dependencies object for Sandpack
  const dependencies = arrayToDependencies(playground.requirements || []);

  // Get category label
  const categoryLabel =
    CATEGORY_LABELS[playground.category as keyof typeof CATEGORY_LABELS] ||
    playground.category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/playgrounds"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Playgrounds
            </Link>
            {(isOwner || isFaculty) && (
              <Link
                href={`/playgrounds/builder?edit=${id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-neural-primary text-white rounded-lg hover:bg-neural-primary/90 transition-colors text-sm font-medium"
              >
                <Edit className="h-4 w-4" />
                Edit Playground
              </Link>
            )}
          </div>

          {/* Title and Description */}
          <h1 className="text-3xl font-bold text-white mb-2">{playground.title}</h1>
          {playground.description && (
            <p className="text-lg text-gray-400 mb-4">{playground.description}</p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Author */}
            <div className="flex items-center gap-2">
              {playground.author.avatar_url ? (
                <Image
                  src={playground.author.avatar_url}
                  alt={playground.author.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-300">
                    {playground.author.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">{playground.author.name}</p>
                {playground.author.university && (
                  <p className="text-xs text-gray-500">{playground.author.university}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <span className="px-3 py-1 bg-neural-primary/20 text-neural-primary rounded-full text-sm font-medium">
              {categoryLabel}
            </span>

            {/* Dependencies */}
            {playground.requirements && playground.requirements.length > 0 && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <div className="flex flex-wrap gap-1">
                  {playground.requirements.slice(0, 4).map((req) => (
                    <span
                      key={req}
                      className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs font-mono"
                    >
                      {req}
                    </span>
                  ))}
                  {playground.requirements.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-800 text-gray-500 rounded text-xs">
                      +{playground.requirements.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 ml-auto">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {playground.view_count} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(playground.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full-width Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="bg-[#0a0a0f] rounded-lg border border-gray-800 p-12 text-center flex items-center justify-center" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
              <div>
                <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading playground...</p>
              </div>
            </div>
          }
        >
          <div className="rounded-lg border border-gray-800 overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
            <PlaygroundViewerClient
              code={playground.source_code || ''}
              dependencies={dependencies}
              showConsole={true}
              className="h-full"
            />
          </div>
        </Suspense>

        {/* Additional Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Template Info */}
          {playground.template && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Based on Template</h3>
              <p className="text-gray-400">
                <span className="font-medium text-gray-300">{playground.template.name}</span>{' '}
                - {playground.template.category.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {/* Author Info */}
          {playground.author.speciality && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">About the Author</h3>
              <p className="text-gray-400">{playground.author.speciality}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
