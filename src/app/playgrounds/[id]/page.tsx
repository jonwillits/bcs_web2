/**
 * Unified Playground Page
 *
 * Single route for all playgrounds (featured + community).
 * All playgrounds are stored in the database.
 * Featured templates are seeded on deployment via scripts/seed-playgrounds.ts
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { arrayToDependencies } from '@/lib/react-playground/sandpack-config';
import { ArrowLeft } from 'lucide-react';
import UnifiedPlaygroundViewer from '@/components/react-playground/UnifiedPlaygroundViewer';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Database fetch function
async function getPlaygroundFromDB(id: string) {
  try {
    const playground = await prisma.playgrounds.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            university: true,
          },
        },
      },
    });

    // Increment view count if found (async, don't block)
    if (playground) {
      prisma.playgrounds
        .update({
          where: { id },
          data: { view_count: { increment: 1 } },
        })
        .catch((err) => console.error('Failed to increment view count:', err));
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

  const isAdmin = session?.user?.role === 'admin';
  const userId = session?.user?.id;

  // Load playground from database
  const playground = await getPlaygroundFromDB(id);

  if (!playground) {
    notFound();
  }

  const isOwner = userId === playground.created_by;

  // Check access permissions for private playgrounds
  if (!playground.is_public && !isOwner && !isAdmin) {
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

  // Edit permission: owner OR admin (not all faculty!)
  const canEdit = isOwner || isAdmin;

  // Fork permission: faculty/admin who is NOT the owner, viewing a public playground
  const isFacultyOrAdmin = session?.user?.role === 'faculty' || session?.user?.role === 'admin';
  const canFork = isFacultyOrAdmin && !isOwner && playground.is_public;

  // Version history: owner or admin can view
  const canViewHistory = isOwner || isAdmin;

  return (
    <UnifiedPlaygroundViewer
      title={playground.title}
      sourceCode={playground.source_code || ''}
      dependencies={arrayToDependencies(playground.requirements || [])}
      playgroundId={playground.id}
      description={playground.description || undefined}
      author={
        playground.author
          ? {
              name: playground.author.name,
              avatar: playground.author.avatar_url || undefined,
              university: playground.author.university || undefined,
            }
          : undefined
      }
      stats={{
        viewCount: playground.view_count,
        createdAt: playground.created_at,
      }}
      category={playground.category}
      requirementsList={playground.requirements || undefined}
      canEdit={canEdit}
      editUrl={`/playgrounds/builder?edit=${id}`}
      canFork={canFork}
      canViewHistory={canViewHistory}
      isFeatured={playground.is_featured}
      isProtected={playground.is_protected}
    />
  );
}

// Generate dynamic metadata
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  try {
    const playground = await prisma.playgrounds.findUnique({
      where: { id },
      select: { title: true, description: true },
    });

    if (playground) {
      return {
        title: `${playground.title} | Playground`,
        description: playground.description || 'Interactive educational playground',
      };
    }
  } catch {
    // Ignore errors
  }

  return {
    title: 'Playground - BCS E-Textbook',
    description: 'Interactive educational playground',
  };
}
