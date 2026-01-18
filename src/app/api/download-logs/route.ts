import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { downloadLogs, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const downloadType = searchParams.get('downloadType');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query conditions
    const conditions: any[] = [];

    if (userId) {
      conditions.push(eq(downloadLogs.userId, parseInt(userId)));
    }

    if (downloadType) {
      conditions.push(eq(downloadLogs.downloadType, downloadType));
    }

    // Get download logs with user information
    const logs = await db
      .select({
        id: downloadLogs.id,
        userId: downloadLogs.userId,
        username: users.username,
        downloadType: downloadLogs.downloadType,
        resourceId: downloadLogs.resourceId,
        resourceName: downloadLogs.resourceName,
        ipAddress: downloadLogs.ipAddress,
        userAgent: downloadLogs.userAgent,
        downloadedAt: downloadLogs.downloadedAt,
      })
      .from(downloadLogs)
      .leftJoin(users, eq(downloadLogs.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(downloadLogs.downloadedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Download logs GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, downloadType, resourceId, resourceName } = body;

    if (!userId || !downloadType || !resourceName) {
      return NextResponse.json(
        { error: 'userId, downloadType, and resourceName are required' },
        { status: 400 }
      );
    }

    // Get IP and user agent from request headers
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    const newLog = await db.insert(downloadLogs).values({
      userId,
      downloadType,
      resourceId: resourceId || null,
      resourceName,
      ipAddress,
      userAgent,
      downloadedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('Download logs POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create download log' },
      { status: 500 }
    );
  }
}