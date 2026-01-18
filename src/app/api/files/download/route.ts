import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { files, downloadLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const inline = searchParams.get('inline') === '1' || searchParams.get('inline') === 'true';

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get file metadata from database
    const file = await db
      .select()
      .from(files)
      .where(eq(files.id, parseInt(fileId)))
      .limit(1);

    if (file.length === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const fileRecord = file[0];

    // Check if file exists on disk
    if (!existsSync(fileRecord.filePath)) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      );
    }

    // Log the download
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    await db.insert(downloadLogs).values({
      userId: parseInt(userId),
      downloadType: 'file',
      resourceId: fileRecord.id,
      resourceName: fileRecord.originalName,
      ipAddress,
      userAgent,
      downloadedAt: new Date().toISOString(),
    });

    // Read and return the file
    const fileBuffer = await readFile(fileRecord.filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileRecord.mimeType,
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${fileRecord.originalName}"`,
        'Content-Length': fileRecord.size.toString(),
      },
    });
  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
