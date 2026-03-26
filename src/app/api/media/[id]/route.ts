import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { hasFacultyAccess } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { supabase, MEDIA_BUCKET } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasFacultyAccess(session)) {
      return NextResponse.json(
        { error: 'Forbidden - Faculty access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    const mediaFile = await withDatabaseRetry(() =>
      prisma.media_files.findUnique({ where: { id } })
    )

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 })
    }

    if (mediaFile.uploaded_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own files' },
        { status: 403 }
      )
    }

    // Derive storage path: upload route stores full path in filename,
    // confirm route stores just the filename without prefix
    const storagePath = mediaFile.filename.startsWith('uploads/')
      ? mediaFile.filename
      : `uploads/${mediaFile.filename}`

    // Best-effort delete from Supabase Storage
    try {
      await supabase.storage.from(MEDIA_BUCKET).remove([storagePath])
    } catch (storageError) {
      console.warn('Storage delete failed (best-effort):', storageError)
    }

    // Delete DB record — cascades to module_media junction
    await withDatabaseRetry(() =>
      prisma.media_files.delete({ where: { id } })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Media delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
