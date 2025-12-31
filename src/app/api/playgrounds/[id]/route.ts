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
    if (!playground.is_public && playground.created_by !== session?.user?.id) {
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
 * Update a playground
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

    // Check ownership
    const existing = await withDatabaseRetry(async () => {
      return prisma.playgrounds.findUnique({
        where: { id },
        select: { created_by: true },
      });
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Playground not found' },
        { status: 404 }
      );
    }

    if (existing.created_by !== session.user.id) {
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
      app_type, // 'sandpack' (React/JS) or 'shinylive' (Python)
    } = body;

    // Update playground
    const playground = await withDatabaseRetry(async () => {
      return prisma.playgrounds.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(category && { category }),
          ...(( source_code || sourceCode) && { source_code: source_code || sourceCode }),
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

    // Check ownership
    const existing = await withDatabaseRetry(async () => {
      return prisma.playgrounds.findUnique({
        where: { id },
        select: { created_by: true },
      });
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Playground not found' },
        { status: 404 }
      );
    }

    if (existing.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
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
