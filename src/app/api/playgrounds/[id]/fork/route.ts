import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/playgrounds/[id]/fork
 * Create a copy of a playground for the current user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only faculty and admin can create playgrounds
    if (session.user.role !== 'faculty' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only faculty members can fork playgrounds' },
        { status: 403 }
      );
    }

    // Get the source playground
    const source = await withDatabaseRetry(async () => {
      return prisma.playgrounds.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          source_code: true,
          requirements: true,
          app_type: true,
          template_id: true,
          created_by: true,
          is_public: true,
        },
      });
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Playground not found' },
        { status: 404 }
      );
    }

    // Check if user can access the source
    const isAdmin = session.user.role === 'admin';
    const isOwner = source.created_by === session.user.id;

    // Can only fork public playgrounds or your own
    if (!source.is_public && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot fork private playgrounds' },
        { status: 403 }
      );
    }

    // Create the forked playground
    const forkedPlayground = await withDatabaseRetry(async () => {
      // Generate unique title
      let forkTitle = `${source.title} (Fork)`;

      // Check if this title already exists for this user and add number if needed
      const existingForks = await prisma.playgrounds.count({
        where: {
          created_by: session.user.id,
          title: { startsWith: source.title },
        },
      });

      if (existingForks > 0) {
        forkTitle = `${source.title} (Fork ${existingForks + 1})`;
      }

      const newPlayground = await prisma.playgrounds.create({
        data: {
          title: forkTitle,
          description: source.description,
          category: source.category,
          source_code: source.source_code,
          requirements: source.requirements,
          app_type: source.app_type,
          template_id: source.template_id,
          created_by: session.user.id,
          forked_from: source.id,
          is_public: false, // Forks start as private
          is_featured: false,
          is_protected: false,
          version: 1,
          view_count: 0,
          fork_count: 0,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
            },
          },
        },
      });

      // Increment fork_count on source playground
      await prisma.playgrounds.update({
        where: { id: source.id },
        data: { fork_count: { increment: 1 } },
      });

      // Create initial version for the fork
      await prisma.playground_versions.create({
        data: {
          playground_id: newPlayground.id,
          version: 1,
          title: newPlayground.title,
          description: source.description || '',
          source_code: source.source_code || '',
          requirements: source.requirements || [],
          created_by: session.user.id,
          change_note: `Forked from "${source.title}"`,
          save_type: 'fork_source',
        },
      });

      return newPlayground;
    });

    return NextResponse.json({
      success: true,
      playground: forkedPlayground,
      message: `Successfully forked "${source.title}"`,
    });
  } catch (error) {
    console.error('Failed to fork playground:', error);
    return NextResponse.json(
      { error: 'Failed to fork playground' },
      { status: 500 }
    );
  }
}
