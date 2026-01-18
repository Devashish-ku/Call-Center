import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { files, downloadLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif'
];

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single file
      const file = await db
        .select()
        .from(files)
        .where(eq(files.id, parseInt(id)))
        .limit(1);

      if (file.length === 0) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(file[0]);
    }

    // Get all files
    const allFiles = await db
      .select()
      .from(files)
      .where(eq(files.isActive, true))
      .orderBy(desc(files.createdAt));

    return NextResponse.json(allFiles);
  } catch (error) {
    console.error('Files GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    const uploadedBy = formData.get('uploadedBy') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!uploadedBy) {
      return NextResponse.json(
        { error: 'uploadedBy is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
    const filePath = join(UPLOAD_DIR, filename);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file metadata to database
    const newFile = await db.insert(files).values({
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedBy: parseInt(uploadedBy),
      filePath: filePath,
      description: description || null,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newFile[0], { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive
    await db
      .update(files)
      .set({ isActive: false })
      .where(eq(files.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}