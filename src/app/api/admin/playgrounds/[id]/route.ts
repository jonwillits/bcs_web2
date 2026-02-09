/**
 * Admin Playground Management API
 *
 * PUT /api/admin/playgrounds/[id] - Update featured/protected status
 * DELETE /api/admin/playgrounds/[id] - Force delete (even protected)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/playgrounds/[id]
 * Update featured/protected status of a playground
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { is_featured, is_protected } = body;

    // Check if playground exists
    const existing = await withDatabaseRetry(async () => {
      return prisma.playgrounds.findUnique({
        where: { id },
        select: { id: true, is_featured: true, is_protected: true },
      });
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Playground not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: {
      is_featured?: boolean;
      is_protected?: boolean;
      featured_at?: Date | null;
      featured_by?: string | null;
    } = {};

    if (is_featured !== undefined) {
      updateData.is_featured = is_featured;
      if (is_featured && !existing.is_featured) {
        // Being featured for the first time
        updateData.featured_at = new Date();
        updateData.featured_by = session.user.id;
      } else if (!is_featured) {
        // Being unfeatured
        updateData.featured_at = null;
        updateData.featured_by = null;
      }
    }

    if (is_protected !== undefined) {
      updateData.is_protected = is_protected;
    }

    // Update playground
    const playground = await withDatabaseRetry(async () => {
      return prisma.playgrounds.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          title: true,
          is_featured: true,
          is_protected: true,
          featured_at: true,
          featured_by: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      playground,
    });
  } catch (error) {
    console.error('Failed to update playground:', error);
    return NextResponse.json(
      { error: 'Failed to update playground' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/playgrounds/[id]
 * Force delete a playground (bypasses is_protected check)
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if playground exists
    const existing = await withDatabaseRetry(async () => {
      return prisma.playgrounds.findUnique({
        where: { id },
        select: { id: true, title: true, is_protected: true },
      });
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Playground not found' },
        { status: 404 }
      );
    }

    // Force delete (admin only, bypasses protection)
    await withDatabaseRetry(async () => {
      return prisma.playgrounds.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Deleted playground: ${existing.title}`,
      wasProtected: existing.is_protected,
    });
  } catch (error) {
    console.error('Failed to delete playground:', error);
    return NextResponse.json(
      { error: 'Failed to delete playground' },
      { status: 500 }
    );
  }
}
