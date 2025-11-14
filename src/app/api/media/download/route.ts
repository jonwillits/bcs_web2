import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('name');

    if (!fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Missing url or name parameter' },
        { status: 400 }
      );
    }

    // Validate that the URL is from our Supabase storage
    if (!fileUrl.includes('.supabase.co/storage/')) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      );
    }

    // Fetch the file from Supabase Storage
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch file from storage' },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Return file with Content-Disposition header to trigger download
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
