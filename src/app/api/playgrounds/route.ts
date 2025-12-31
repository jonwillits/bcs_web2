import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

/**
 * GET /api/playgrounds
 * Get all playgrounds (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category');
    const isPublic = searchParams.get('public');
    const createdBy = searchParams.get('createdBy');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isPublic !== null) {
      where.is_public = isPublic === 'true';
    }

    if (createdBy) {
      where.created_by = createdBy;
    }

    // Only show public playgrounds unless user is authenticated
    if (!session?.user) {
      where.is_public = true;
    }

    // Fetch playgrounds with pagination
    const [playgrounds, totalCount] = await withDatabaseRetry(async () => {
      return Promise.all([
        prisma.playgrounds.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            created_at: 'desc',
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
            template: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        }),
        prisma.playgrounds.count({ where }),
      ]);
    });

    return NextResponse.json({
      playgrounds,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch playgrounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playgrounds' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/playgrounds
 * Create a new playground
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      source_code,
      sourceCode, // Support both snake_case and camelCase
      requirements,
      template_id,
      is_public,
      app_type, // 'sandpack' (React/JS) or 'shinylive' (Python)
    } = body;

    // Validation
    if (!title || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category' },
        { status: 400 }
      );
    }

    const code = source_code || sourceCode;
    if (!code) {
      return NextResponse.json(
        { error: 'Source code is required' },
        { status: 400 }
      );
    }

    // Create playground
    const playground = await withDatabaseRetry(async () => {
      return prisma.playgrounds.create({
        data: {
          title,
          description: description || '',
          category,
          app_type: app_type || 'sandpack', // Default to sandpack (React/JS)
          source_code: code,
          requirements: requirements || [],
          template_id: template_id || null,
          created_by: session.user.id,
          is_public: is_public || false,
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

    return NextResponse.json(playground, { status: 201 });
  } catch (error) {
    console.error('Failed to create playground:', error);
    return NextResponse.json(
      { error: 'Failed to create playground' },
      { status: 500 }
    );
  }
}
