import { NextResponse } from 'next/server';
import { db } from '@/db';
import { callLogs } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const logs = await db.select().from(callLogs).orderBy(desc(callLogs.createdAt));
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
