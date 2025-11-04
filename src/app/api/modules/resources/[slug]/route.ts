import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Fetch module by slug with media files (public endpoint, no auth required)
    const foundModule = await prisma.modules.findFirst({
      where: {
        slug: slug,
        status: 'published', // Only show resources for published modules
      },
      select: {
        id: true,
        title: true,
        slug: true,
        module_media: {
          include: {
            media_files: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    })

    if (!foundModule) {
      return NextResponse.json(
        { error: 'Module not found or not published' },
        { status: 404 }
      )
    }

    // Transform media files to student-friendly format
    const resources = foundModule.module_media.map((mm) => ({
      id: mm.media_files.id,
      name: mm.media_files.original_name,
      filename: mm.media_files.filename,
      size: Number(mm.media_files.file_size),
      mimeType: mm.media_files.mime_type,
      url: mm.media_files.storage_path, // Supabase public URL
      uploadedAt: mm.created_at,
    }))

    return NextResponse.json({
      module: {
        id: foundModule.id,
        title: foundModule.title,
        slug: foundModule.slug,
      },
      resources,
      total: resources.length,
    })
  } catch (error) {
    console.error('Resources API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch module resources' },
      { status: 500 }
    )
  }
}
