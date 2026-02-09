import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/playgrounds/[id]/versions
 * Get version history for a playground
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    // Check if playground exists and user has access
    const playground = await withDatabaseRetry(async () => {
      return prisma.playgrounds.findUnique({
        where: { id },
        select: {
          id: true,
          created_by: true,
          is_public: true,
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

    // Only owner or admin can view version history
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Only the owner or admin can view version history.' },
        { status: 403 }
      );
    }

    // Get URL params for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const includeCode = url.searchParams.get('includeCode') === 'true';

    const skip = (page - 1) * limit;

    // Get versions
    const [versions, totalCount] = await withDatabaseRetry(async () => {
      return Promise.all([
        prisma.playground_versions.findMany({
          where: { playground_id: id },
          orderBy: { version: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            version: true,
            title: true,
            description: includeCode,
            source_code: includeCode,
            requirements: includeCode,
            created_by: true,
            created_at: true,
            change_note: true,
            save_type: true,
            author: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        }),
        prisma.playground_versions.count({
          where: { playground_id: id },
        }),
      ]);
    });

    return NextResponse.json({
      versions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch playground versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    );
  }
}
