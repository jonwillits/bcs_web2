import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { hasFacultyAccess } from '@/lib/auth/utils'
import { encrypt } from '@/lib/canvas/encryption'
import { validateCanvasToken } from '@/lib/canvas/client'
import { z } from 'zod'

const tokenSchema = z.object({
  token: z.string().min(1, 'Token is required').max(500),
})

// PUT /api/faculty/canvas-token — Save or update Canvas API token
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = tokenSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.errors.map(e => e.message) },
        { status: 400 }
      )
    }

    const { token } = parsed.data

    // Validate the token against Canvas API before saving
    const baseUrl = process.env.CANVAS_BASE_URL
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Canvas is not configured on this platform. Contact an administrator.' },
        { status: 500 }
      )
    }

    const validation = await validateCanvasToken({
      baseUrl: baseUrl.replace(/\/+$/, ''),
      token,
    })

    if (!validation.ok) {
      if (validation.error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Canvas API token. Please check that your token is correct and not expired.' },
          { status: 400 }
        )
      }
      // Non-auth Canvas errors — don't block the save (Canvas might be temporarily down)
      console.warn('Canvas token validation returned non-auth error:', validation.error)
    }

    // Encrypt and store
    const encrypted = encrypt(token)
    const now = new Date()

    await withDatabaseRetry(() =>
      prisma.users.update({
        where: { id: session.user.id },
        data: {
          canvas_api_token_encrypted: encrypted,
          canvas_token_updated_at: now,
        },
      })
    )

    return NextResponse.json({ success: true, updatedAt: now.toISOString() })
  } catch (error) {
    console.error('Error saving Canvas token:', error)
    const message = error instanceof Error && error.message.includes('CANVAS_TOKEN_ENCRYPTION_KEY')
      ? 'Canvas token encryption is not configured. Contact an administrator.'
      : 'Failed to save Canvas token'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/faculty/canvas-token — Remove Canvas API token
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await withDatabaseRetry(() =>
      prisma.users.update({
        where: { id: session.user.id },
        data: {
          canvas_api_token_encrypted: null,
          canvas_token_updated_at: null,
        },
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing Canvas token:', error)
    return NextResponse.json({ error: 'Failed to remove Canvas token' }, { status: 500 })
  }
}
