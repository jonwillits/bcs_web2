import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

interface RouteParams {
  params: Promise<{ id: string; version: string }>;
}

/**
 * GET /api/playgrounds/[id]/versions/[version]
 * Get a specific version snapshot with full content
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, version: versionStr } = await params;
    const versionNum = parseInt(versionStr, 10);
    const session = await auth();

    if (isNaN(versionNum)) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      );
    }

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

    // Only owner or admin can view version details
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Only the owner or admin can view version details.' },
        { status: 403 }
      );
    }

    // Get specific version
    const versionData = await withDatabaseRetry(async () => {
      return prisma.playground_versions.findUnique({
        where: {
          playground_id_version: {
            playground_id: id,
            version: versionNum,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      });
    });

    if (!versionData) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(versionData);
  } catch (error) {
    console.error('Failed to fetch playground version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}
