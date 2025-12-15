import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

export async function GET(request: NextRequest) {
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

    // Fetch all modules with author info and course count
    const modules = await withDatabaseRetry(async () => {
      return await prisma.modules.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          difficulty_level: true,
          quest_type: true,
          updated_at: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course_modules: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          updated_at: 'desc',
        },
      });
    });

    // Format response
    const formattedModules = modules.map(module => ({
      id: module.id,
      title: module.title,
      slug: module.slug,
      author: {
        name: module.users.name || 'Unknown',
        email: module.users.email || '',
      },
      status: module.status,
      courseCount: module.course_modules.length,
      difficultyLevel: module.difficulty_level || 'beginner',
      questType: module.quest_type || 'standard',
      updatedAt: module.updated_at.toISOString(),
    }));

    return NextResponse.json({ modules: formattedModules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}
