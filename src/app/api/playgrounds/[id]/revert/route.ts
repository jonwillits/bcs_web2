import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/playgrounds/[id]/revert
 * Revert playground to a previous version
 * Creates a new version with content from the specified old version
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

    const body = await request.json();
    const { version } = body;

    if (typeof version !== 'number') {
      return NextResponse.json(
        { error: 'Version number is required' },
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
          title: true,
          description: true,
          source_code: true,
          requirements: true,
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
    const isAdmin = session.user.role === 'admin';
    const isOwner = playground.created_by === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Only the owner or admin can revert versions.' },
        { status: 403 }
      );
    }

    // Get the version to revert to
    const targetVersion = await withDatabaseRetry(async () => {
      return prisma.playground_versions.findUnique({
        where: {
          playground_id_version: {
            playground_id: id,
            version: version,
          },
        },
      });
    });

    if (!targetVersion) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Create a new version snapshot of CURRENT state before reverting
    await withDatabaseRetry(async () => {
      const latestVersion = await prisma.playground_versions.findFirst({
        where: { playground_id: id },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      // Snapshot current state
      await prisma.playground_versions.create({
        data: {
          playground_id: id,
          version: nextVersion,
          title: playground.title,
          description: playground.description || '',
          source_code: playground.source_code || '',
          requirements: playground.requirements || [],
          created_by: session.user.id,
          change_note: `Before revert to version ${version}`,
          save_type: 'auto',
        },
      });
    });

    // Update playground with content from target version
    const updatedPlayground = await withDatabaseRetry(async () => {
      return prisma.playgrounds.update({
        where: { id },
        data: {
          title: targetVersion.title,
          description: targetVersion.description,
          source_code: targetVersion.source_code,
          requirements: targetVersion.requirements,
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

    // Create another version snapshot of the reverted state
    await withDatabaseRetry(async () => {
      const latestVersion = await prisma.playground_versions.findFirst({
        where: { playground_id: id },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      await prisma.playground_versions.create({
        data: {
          playground_id: id,
          version: nextVersion,
          title: targetVersion.title,
          description: targetVersion.description,
          source_code: targetVersion.source_code,
          requirements: targetVersion.requirements,
          created_by: session.user.id,
          change_note: `Reverted to version ${version}`,
          save_type: 'manual',
        },
      });

      // Cleanup old versions (keep last 10)
      const allVersions = await prisma.playground_versions.findMany({
        where: { playground_id: id },
        orderBy: { version: 'desc' },
        select: { id: true, save_type: true },
      });

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

    return NextResponse.json({
      success: true,
      playground: updatedPlayground,
      message: `Successfully reverted to version ${version}`,
    });
  } catch (error) {
    console.error('Failed to revert playground:', error);
    return NextResponse.json(
      { error: 'Failed to revert playground' },
      { status: 500 }
    );
  }
}
