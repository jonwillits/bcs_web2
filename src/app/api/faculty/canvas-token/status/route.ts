import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { hasFacultyAccess } from '@/lib/auth/utils'

// GET /api/faculty/canvas-token/status — Check if token is configured (never returns the token)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await withDatabaseRetry(() =>
      prisma.users.findUnique({
        where: { id: session.user.id },
        select: {
          canvas_api_token_encrypted: true,
          canvas_token_updated_at: true,
        },
      })
    )

    return NextResponse.json({
      configured: !!user?.canvas_api_token_encrypted,
      updatedAt: user?.canvas_token_updated_at?.toISOString() ?? null,
    })
  } catch (error) {
    console.error('Error checking Canvas token status:', error)
    return NextResponse.json({ error: 'Failed to check token status' }, { status: 500 })
  }
}
