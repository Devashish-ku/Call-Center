import { NextResponse } from 'next/server';
import { db } from '@/db';
import { contacts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    
    let result;
    if (employeeId) {
      result = await db.select().from(contacts).where(eq(contacts.assignedEmployeeId, parseInt(employeeId)));
    } else {
      result = await db.select().from(contacts);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phoneNumber, assignedEmployeeId, sourceFileId } = body;

    if (!name || !phoneNumber) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
    }

    // Check if contact already exists
    const existingContact = await db.query.contacts.findFirst({
      where: eq(contacts.phoneNumber, phoneNumber)
    });

    if (existingContact) {
      return NextResponse.json({ error: 'Contact with this phone number already exists' }, { status: 409 });
    }

    // Insert new contact
    const [newContact] = await db.insert(contacts).values({
      name,
      phoneNumber,
      assignedEmployeeId: assignedEmployeeId ? parseInt(assignedEmployeeId) : null,
      sourceFileId: sourceFileId ? parseInt(sourceFileId) : null,
      createdAt: new Date().toISOString(),
      callStatus: 'pending' // Default status
    }).returning();

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}
