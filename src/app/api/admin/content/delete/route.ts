import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { type, id } = body;

    // Validate input
    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: type, id' },
        { status: 400 }
      );
    }

    if (type !== 'course' && type !== 'module') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "course" or "module"' },
        { status: 400 }
      );
    }

    // Delete with cascading
    await withDatabaseRetry(async () => {
      if (type === 'course') {
        // Delete course and all related data
        // Using transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
          // Delete course_modules (junction table)
          await tx.course_modules.deleteMany({
            where: { course_id: id },
          });

          // Delete course_tracking (student enrollments)
          await tx.course_tracking.deleteMany({
            where: { course_id: id },
          });

          // Delete course_collaborators (if any)
          await tx.course_collaborators.deleteMany({
            where: { course_id: id },
          });

          // Finally delete the course itself
          await tx.courses.delete({
            where: { id },
          });
        });
      } else {
        // Delete module and all related data
        await prisma.$transaction(async (tx) => {
          // Delete from course_modules (removes from all courses using this module)
          await tx.course_modules.deleteMany({
            where: { module_id: id },
          });

          // Delete module_media (junction table)
          await tx.module_media.deleteMany({
            where: { module_id: id },
          });

          // Delete module_progress (student progress)
          await tx.module_progress.deleteMany({
            where: { module_id: id },
          });

          // Delete child modules if this is a parent (hierarchical modules)
          await tx.modules.deleteMany({
            where: { parent_module_id: id },
          });

          // Finally delete the module itself
          await tx.modules.delete({
            where: { id },
          });
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'course' ? 'Course' : 'Module'} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
