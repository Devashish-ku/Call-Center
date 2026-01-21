import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dataSharing } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const shares = await db.select().from(dataSharing).orderBy(desc(dataSharing.createdAt));
    return NextResponse.json(shares);
  } catch (error) {
    console.error('Error fetching data sharing records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminId, employeeId, sharedDataType, sharedData, message } = body;

    if (!adminId || !employeeId || !sharedDataType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [newShare] = await db.insert(dataSharing).values({
      adminId,
      employeeId,
      sharedDataType,
      sharedData: JSON.stringify(sharedData),
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newShare, { status: 201 });
  } catch (error) {
    console.error('Error creating data share:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
