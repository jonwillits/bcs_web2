import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/playgrounds/[id]
 * Get a single playground by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    const playground = await withDatabaseRetry(async () => {
      return prisma.playgrounds.findUnique({
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
              description: true,
              category: true,
            },
          },
        },
      });
    });

    if (!playground) {
      return NextResponse.json(
        { error: 'Playground not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const isAdmin = session?.user?.role === 'admin';
    const isOwner = playground.created_by === session?.user?.id;

    if (!playground.is_public && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Increment view count (async, don't wait)
    prisma.playgrounds
      .update({
        where: { id },
        data: { view_count: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to increment view count:', err));

    return NextResponse.json(playground);
  } catch (error) {
    console.error('Failed to fetch playground:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playground' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/playgrounds/[id]
 * Update a playground (with version history)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch current playground content for versioning
    const existing = await withDatabaseRetry(async () => {
      return prisma.playgrounds.findUnique({
        where: { id },
        select: {
          created_by: true,
          is_protected: true,
          title: true,
          description: true,
          source_code: true,
          requirements: true,
        },
      });
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Playground not found' },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === 'admin';
    const isOwner = existing.created_by === session.user.id;

    // Only owner or admin can edit
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      source_code,
      sourceCode,
      requirements,
      is_public,
      app_type,
      change_note, // Optional note about what changed
    } = body;

    // Create version snapshot BEFORE updating (if source_code is being changed)
    const newSourceCode = source_code || sourceCode;
    if (newSourceCode && existing.source_code) {
      await withDatabaseRetry(async () => {
        // Get current max version number
        const latestVersion = await prisma.playground_versions.findFirst({
          where: { playground_id: id },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        const nextVersion = (latestVersion?.version || 0) + 1;

        // Create version snapshot
        await prisma.playground_versions.create({
          data: {
            playground_id: id,
            version: nextVersion,
            title: existing.title,
            description: existing.description || '',
            source_code: existing.source_code,
            requirements: existing.requirements || [],
            created_by: session.user.id,
            change_note: change_note || null,
            save_type: 'manual',
          },
        });

        // Cleanup: keep only last 10 versions
        const allVersions = await prisma.playground_versions.findMany({
          where: { playground_id: id },
          orderBy: { version: 'desc' },
          select: { id: true, version: true, save_type: true },
        });

        // Find versions to delete (older than 10th, excluding fork_source)
        const versionsToKeep = allVersions
          .filter((v) => v.save_type !== 'fork_source')
          .slice(0, 10)
          .map((v) => v.id);

        const versionsToDelete = allVersions
          .filter((v) => !versionsToKeep.includes(v.id) && v.save_type !== 'fork_source')
          .map((v) => v.id);

        if (versionsToDelete.length > 0) {
          await prisma.playground_versions.deleteMany({
            where: { id: { in: versionsToDelete } },
          });
        }
      });
    }

    // Update playground
    const playground = await withDatabaseRetry(async () => {
      return prisma.playgrounds.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(category && { category }),
          ...(newSourceCode && { source_code: newSourceCode }),
          ...(requirements && { requirements }),
          ...(is_public !== undefined && { is_public }),
          ...(app_type && { app_type }),
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
    });

    return NextResponse.json(playground);
  } catch (error) {
    console.error('Failed to update playground:', error);
    return NextResponse.json(
      { error: 'Failed to update playground' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/playgrounds/[id]
 * Delete a playground
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check ownership and permissions
    const existing = await withDatabaseRetry(async () => {
      return prisma.playgrounds.findUnique({
        where: { id },
        select: { created_by: true, is_protected: true },
      });
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Playground not found' },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === 'admin';
    const isOwner = existing.created_by === session.user.id;

    // Only owner or admin can delete
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Protected playgrounds cannot be deleted (even by admin, use unprotect first)
    if (existing.is_protected) {
      return NextResponse.json(
        { error: 'Cannot delete protected playground. Remove protection first.' },
        { status: 403 }
      );
    }

    // Delete playground
    await withDatabaseRetry(async () => {
      return prisma.playgrounds.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete playground:', error);
    return NextResponse.json(
      { error: 'Failed to delete playground' },
      { status: 500 }
    );
  }
}
