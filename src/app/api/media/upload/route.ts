import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { uploadFile, validateFile } from '@/lib/storage-simple';
import { prisma } from '@/lib/db';

// Use Node.js runtime for file uploads (not Edge)
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for file uploads

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only faculty can upload files
    if (session.user.role !== 'faculty') {
      return NextResponse.json({ error: 'Forbidden - Faculty access required' }, { status: 403 });
    }

    // Parse formData with error handling for large files
    let formData;
    try {
      formData = await request.formData();
    } catch (formDataError) {
      console.error('FormData parsing error:', formDataError);
      return NextResponse.json(
        { error: 'File too large or invalid request. Maximum file size is 50MB.' },
        { status: 413 }
      );
    }
    const file = formData.get('file') as File;
    const moduleId = formData.get('moduleId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file before upload
    const config = {
      maxFileSize: parseInt(process.env.NEXT_PUBLIC_UPLOAD_MAX_SIZE || '52428800'),
      allowedTypes: process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'audio/mp3', 'audio/wav',
        'application/pdf', 'text/plain'
      ],
      uploadDir: './uploads',
      useCloudStorage: false
    };

    const validation = validateFile(file, config);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    try {
      // Upload file to storage
      const uploadResult = await uploadFile(file);

      // Save file metadata to database
      const mediaFile = await prisma.media_files.create({
        data: {
          id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          filename: uploadResult.path,
          original_name: file.name,
          file_size: BigInt(file.size),
          mime_type: file.type,
          storage_path: uploadResult.url, // Store full Supabase public URL, not relative path
          uploaded_by: session.user.id,
        },
      });

      // Link to module if moduleId provided
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
          url: uploadResult.url,
          filename: mediaFile.filename,
          originalName: mediaFile.original_name,
          mimeType: mediaFile.mime_type,
          fileSize: Number(mediaFile.file_size),
        },
      });

    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', details: uploadError instanceof Error ? uploadError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Media upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve media files for a user or module
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause: any = {
      uploaded_by: session.user.id,
    };

    // If moduleId provided, get media for that specific module
    if (moduleId) {
      const moduleMedia = await prisma.module_media.findMany({
        where: { module_id: moduleId },
        include: {
          media_files: true,
        },
        take: limit,
        skip: offset,
        orderBy: { created_at: 'desc' },
      });

      const mediaFiles = moduleMedia.map(mm => ({
        id: mm.media_files.id,
        url: mm.media_files.storage_path.startsWith('http')
          ? mm.media_files.storage_path
          : `/uploads/${mm.media_files.filename}`,
        filename: mm.media_files.filename,
        originalName: mm.media_files.original_name,
        mimeType: mm.media_files.mime_type,
        fileSize: Number(mm.media_files.file_size),
        createdAt: mm.media_files.created_at,
      }));

      return NextResponse.json({
        media: mediaFiles,
        total: moduleMedia.length,
      });
    }

    // Get all media files for the user
    const mediaFiles = await prisma.media_files.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });

    const transformedMedia = mediaFiles.map(file => ({
      id: file.id,
      url: file.storage_path.startsWith('http')
        ? file.storage_path
        : `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.original_name,
      mimeType: file.mime_type,
      fileSize: Number(file.file_size),
      createdAt: file.created_at,
    }));

    return NextResponse.json({
      media: transformedMedia,
      total: mediaFiles.length,
    });

  } catch (error) {
    console.error('Media fetch API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}