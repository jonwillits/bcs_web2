import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';
import { hasFacultyAccess } from '@/lib/auth/utils'

export const runtime = 'nodejs';

/**
 * Generate a signed upload URL for direct client-to-Supabase uploads
 * This bypasses Vercel's size limits and improves performance
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Forbidden - Faculty access required' }, { status: 403 });
    }

    const body = await request.json();
    const { filename, contentType, fileSize } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, contentType' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max for now, can be increased)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json(
        { error: `File size ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds maximum ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate content type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm',
      'audio/mp3', 'audio/mpeg', 'audio/wav',
      'application/pdf',
      'text/plain'
    ];

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `File type ${contentType} is not allowed` },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExt = filename.split('.').pop();
    const uniqueFilename = `${timestamp}_${randomStr}.${fileExt}`;
    const filePath = `uploads/${uniqueFilename}`;

    // Create signed upload URL (valid for 5 minutes)
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    // Return signed URL and file metadata
    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      filePath,
      uniqueFilename,
    });

  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
