import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * Confirm successful upload and save metadata to database
 * Called after client successfully uploads directly to Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'faculty') {
      return NextResponse.json({ error: 'Forbidden - Faculty access required' }, { status: 403 });
    }

    const body = await request.json();
    const { filePath, originalName, fileSize, mimeType, moduleId } = body;

    if (!filePath || !originalName || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the file exists in Supabase Storage
    const { data: fileExists, error: checkError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list('uploads', {
        limit: 1,
        search: filePath.split('/').pop()
      });

    if (checkError || !fileExists || fileExists.length === 0) {
      console.error('File verification failed:', checkError);
      return NextResponse.json(
        { error: 'File not found in storage. Upload may have failed.' },
        { status: 404 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(filePath);

    // Save metadata to database
    const mediaFile = await prisma.media_files.create({
      data: {
        id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        filename: filePath.split('/').pop() || filePath,
        original_name: originalName,
        file_size: BigInt(fileSize),
        mime_type: mimeType,
        storage_path: filePath,
        uploaded_by: session.user.id,
      },
    });

    // Link to module if provided
    if (moduleId) {
      await prisma.module_media.create({
        data: {
          id: `mm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          module_id: moduleId,
          media_file_id: mediaFile.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      media: {
        id: mediaFile.id,
        url: publicUrl,
        filename: mediaFile.filename,
        originalName: mediaFile.original_name,
        mimeType: mediaFile.mime_type,
        fileSize: Number(mediaFile.file_size),
      },
    });

  } catch (error) {
    console.error('Media confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to save file metadata' },
      { status: 500 }
    );
  }
}
