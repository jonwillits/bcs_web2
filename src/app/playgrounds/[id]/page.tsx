import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShinyliveEmbed } from '@/components/playground/ShinyliveEmbed';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/config';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">This playground is private.</p>
          <Link
            href="/playgrounds"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Browse Public Playgrounds
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === playground.created_by;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/playgrounds"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Playgrounds
            </Link>
            {isOwner && (
              <Link
                href={`/playgrounds/builder?edit=${id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Edit Playground
              </Link>
            )}
          </div>

          {/* Title and Description */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{playground.title}</h1>
          {playground.description && (
            <p className="text-lg text-gray-600 mb-4">{playground.description}</p>
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
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {playground.author.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{playground.author.name}</p>
                {playground.author.university && (
                  <p className="text-xs text-gray-500">{playground.author.university}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {playground.category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>

            {/* Requirements */}
            {playground.requirements && playground.requirements.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Requires:</span>
                {playground.requirements.map((req) => (
                  <span
                    key={req}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                  >
                    {req}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 ml-auto">
              <span>👁 {playground.view_count} views</span>
              <span>
                📅 {new Date(playground.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading playground...</p>
            </div>
          }
        >
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ShinyliveEmbed
              sourceCode={playground.source_code || ''}
              requirements={playground.requirements || []}
              title={playground.title}
              height={800}
            />
          </div>
        </Suspense>

        {/* Additional Info */}
        {playground.template && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Based on Template</h3>
            <p className="text-gray-600">
              <span className="font-medium">{playground.template.name}</span> -{' '}
              {playground.template.category.replace(/_/g, ' ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
