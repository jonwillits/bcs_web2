import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'

/**
 * GET /api/users
 * Search and list users (faculty search for collaboration)
 *
 * Query parameters:
 * - role: Filter by user role (default: all)
 * - search: Search by name or email (min 2 chars)
 * - limit: Max results (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'faculty') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || undefined
    const search = searchParams.get('search') || ''
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      100
    )

    // Build search conditions
    const where: any = {}

    // Filter by role if specified
    if (role) {
      where.role = role
    }

    // Search by name or email
    if (search && search.length >= 2) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch users
    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        role: true,
        university: true,
        speciality: true,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      users,
      count: users.length,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
