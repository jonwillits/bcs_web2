import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { z } from 'zod';

// Schema for module update
const moduleUpdateSchema = z.object({
  id: z.string(),
  prerequisite_module_ids: z.array(z.string()),
  quest_map_position_x: z.number().min(0).max(100),
  quest_map_position_y: z.number().min(0).max(100),
});

const updateLayoutSchema = z.object({
  modules: z.array(moduleUpdateSchema),
});

/**
 * GET - Fetch all modules with quest map data for layout editor
 */
export async function GET() {
  try {
    const session = await auth();
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all published modules (faculty can edit all published modules' positions)
    const modules = await prisma.modules.findMany({
      where: {
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        prerequisite_module_ids: true,
        quest_map_position_x: true,
        quest_map_position_y: true,
        xp_reward: true,
        difficulty_level: true,
        quest_type: true,
        status: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching quest map modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update quest map layout (positions and prerequisites)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateLayoutSchema.parse(body);

    // Update each module's position and prerequisites in a transaction
    await prisma.$transaction(
      validated.modules.map(module =>
        prisma.modules.update({
          where: { id: module.id },
          data: {
            prerequisite_module_ids: module.prerequisite_module_ids,
            quest_map_position_x: module.quest_map_position_x,
            quest_map_position_y: module.quest_map_position_y,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating quest map layout:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update quest map layout' },
      { status: 500 }
    );
  }
}
