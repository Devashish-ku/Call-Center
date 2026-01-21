import { NextResponse } from 'next/server';
import { db } from '@/db';
import { files } from '@/db/schema';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!uploadedBy) {
      return NextResponse.json(
        { error: 'Uploader ID is required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newFilename = `${timestamp}-${safeFilename}`;
    
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore error if directory exists
    }

    const filePath = path.join(uploadDir, newFilename);
    const relativePath = `/uploads/${newFilename}`;

    await writeFile(filePath, buffer);

    // Save to database
    const [insertedFile] = await db.insert(files).values({
      filename: newFilename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedBy: parseInt(uploadedBy),
      filePath: relativePath,
      description: description || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(insertedFile);

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
