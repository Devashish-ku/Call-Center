import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { callLogs, users } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

const VALID_STATUSES = ['connected', 'not_answered', 'not_connected'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single call log by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const callLog = await db
        .select()
        .from(callLogs)
        .where(eq(callLogs.id, parseInt(id)))
        .limit(1);

      if (callLog.length === 0) {
        return NextResponse.json(
          { error: 'Call log not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(callLog[0], { status: 200 });
    }

    // List call logs with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const callDate = searchParams.get('callDate');
    const search = searchParams.get('search');

    // Build where conditions
    const conditions = [];

    if (employeeId) {
      const empId = parseInt(employeeId);
      if (!isNaN(empId)) {
        conditions.push(eq(callLogs.employeeId, empId));
      }
    }

    if (status) {
      if (VALID_STATUSES.includes(status as any)) {
        conditions.push(eq(callLogs.status, status));
      }
    }

    if (callDate) {
      conditions.push(eq(callLogs.callDate, callDate));
    }

    if (search) {
      conditions.push(like(callLogs.customerPhone, `%${search}%`));
    }

    let query = db.select().from(callLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const results = await query
      .orderBy(desc(callLogs.callDate))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, callDate, callTime, status, duration, customerPhone, notes } = body;

    // Validate required fields
    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!callDate) {
      return NextResponse.json(
        { error: 'callDate is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!callTime) {
      return NextResponse.json(
        { error: 'callTime is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'status is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate employeeId exists
    const employee = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(employeeId)))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json(
        { error: 'Invalid employee ID', code: 'INVALID_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedCustomerPhone = customerPhone ? customerPhone.trim() : null;
    const sanitizedNotes = notes ? notes.trim() : null;

    // Basic phone number validation if provided
    if (sanitizedCustomerPhone && sanitizedCustomerPhone.length > 0) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(sanitizedCustomerPhone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format', code: 'INVALID_PHONE_FORMAT' },
          { status: 400 }
        );
      }
    }

    // Create call log
    const newCallLog = await db
      .insert(callLogs)
      .values({
        employeeId: parseInt(employeeId),
        callDate,
        callTime,
        status,
        duration: duration ? parseInt(duration) : null,
        customerPhone: sanitizedCustomerPhone,
        notes: sanitizedNotes,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newCallLog[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if call log exists
    const existingCallLog = await db
      .select()
      .from(callLogs)
      .where(eq(callLogs.id, parseInt(id)))
      .limit(1);

    if (existingCallLog.length === 0) {
      return NextResponse.json(
        { error: 'Call log not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { employeeId, callDate, callTime, status, duration, customerPhone, notes } = body;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate employeeId if provided
    if (employeeId) {
      const employee = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(employeeId)))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json(
          { error: 'Invalid employee ID', code: 'INVALID_EMPLOYEE_ID' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updates: any = {};

    if (employeeId !== undefined) updates.employeeId = parseInt(employeeId);
    if (callDate !== undefined) updates.callDate = callDate;
    if (callTime !== undefined) updates.callTime = callTime;
    if (status !== undefined) updates.status = status;
    if (duration !== undefined) updates.duration = duration ? parseInt(duration) : null;
    
    if (customerPhone !== undefined) {
      const sanitizedPhone = customerPhone ? customerPhone.trim() : null;
      if (sanitizedPhone && sanitizedPhone.length > 0) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(sanitizedPhone)) {
          return NextResponse.json(
            { error: 'Invalid phone number format', code: 'INVALID_PHONE_FORMAT' },
            { status: 400 }
          );
        }
      }
      updates.customerPhone = sanitizedPhone;
    }
    
    if (notes !== undefined) updates.notes = notes ? notes.trim() : null;

    // Update call log
    const updated = await db
      .update(callLogs)
      .set(updates)
      .where(eq(callLogs.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if call log exists
    const existingCallLog = await db
      .select()
      .from(callLogs)
      .where(eq(callLogs.id, parseInt(id)))
      .limit(1);

    if (existingCallLog.length === 0) {
      return NextResponse.json(
        { error: 'Call log not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete call log
    await db
      .delete(callLogs)
      .where(eq(callLogs.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { message: 'Call log deleted successfully', id: parseInt(id) },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}