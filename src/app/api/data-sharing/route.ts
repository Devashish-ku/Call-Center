import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dataSharing, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_SHARED_DATA_TYPES = ['call_logs', 'reports', 'announcement', 'file'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(dataSharing)
        .where(eq(dataSharing.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Data sharing record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const adminId = searchParams.get('adminId');
    const employeeId = searchParams.get('employeeId');
    const sharedDataType = searchParams.get('sharedDataType');
    const isReadParam = searchParams.get('isRead');

    // Build query conditions
    const conditions: any[] = [];

    if (adminId) {
      if (isNaN(parseInt(adminId))) {
        return NextResponse.json(
          { error: 'Invalid adminId parameter', code: 'INVALID_ADMIN_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(dataSharing.adminId, parseInt(adminId)));
    }

    if (employeeId) {
      if (isNaN(parseInt(employeeId))) {
        return NextResponse.json(
          { error: 'Invalid employeeId parameter', code: 'INVALID_EMPLOYEE_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(dataSharing.employeeId, parseInt(employeeId)));
    }

    if (sharedDataType) {
      if (!VALID_SHARED_DATA_TYPES.includes(sharedDataType as any)) {
        return NextResponse.json(
          {
            error: `Invalid sharedDataType. Must be one of: ${VALID_SHARED_DATA_TYPES.join(', ')}`,
            code: 'INVALID_SHARED_DATA_TYPE',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(dataSharing.sharedDataType, sharedDataType));
    }

    if (isReadParam !== null) {
      const isReadValue = isReadParam === 'true';
      conditions.push(eq(dataSharing.isRead, isReadValue));
    }

    let query = db.select().from(dataSharing);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(dataSharing.createdAt))
      .limit(limit)
      .offset(offset);

    // Calculate unread count for metadata
    let unreadCountQuery = db
      .select()
      .from(dataSharing)
      .where(eq(dataSharing.isRead, false));

    if (employeeId) {
      unreadCountQuery = unreadCountQuery.where(
        and(
          eq(dataSharing.isRead, false),
          eq(dataSharing.employeeId, parseInt(employeeId))
        )
      ) as any;
    }

    const unreadRecords = await unreadCountQuery;
    const unreadCount = unreadRecords.length;

    const response = NextResponse.json(results, { status: 200 });
    response.headers.set('X-Unread-Count', unreadCount.toString());
    response.headers.set('X-Total-Count', results.length.toString());
    response.headers.set('X-Limit', limit.toString());
    response.headers.set('X-Offset', offset.toString());

    return response;
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, employeeId, sharedDataType, sharedData, message, isRead } = body;

    // Validate required fields
    if (!adminId) {
      return NextResponse.json(
        { error: 'adminId is required', code: 'MISSING_ADMIN_ID' },
        { status: 400 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId is required', code: 'MISSING_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    if (!sharedDataType) {
      return NextResponse.json(
        { error: 'sharedDataType is required', code: 'MISSING_SHARED_DATA_TYPE' },
        { status: 400 }
      );
    }

    // Validate sharedDataType
    if (!VALID_SHARED_DATA_TYPES.includes(sharedDataType as any)) {
      return NextResponse.json(
        {
          error: `Invalid sharedDataType. Must be one of: ${VALID_SHARED_DATA_TYPES.join(', ')}`,
          code: 'INVALID_SHARED_DATA_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate adminId exists and is admin
    const admin = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(adminId)))
      .limit(1);

    if (admin.length === 0) {
      return NextResponse.json(
        { error: 'Invalid admin ID', code: 'INVALID_ADMIN_ID' },
        { status: 400 }
      );
    }

    if (admin[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid admin ID', code: 'INVALID_ADMIN_ID' },
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

    // Validate sharedData is valid JSON if provided
    if (sharedData !== undefined && sharedData !== null) {
      if (typeof sharedData !== 'object') {
        return NextResponse.json(
          { error: 'sharedData must be a valid JSON object', code: 'INVALID_SHARED_DATA' },
          { status: 400 }
        );
      }
    }

    // Create new data sharing record
    const newRecord = await db
      .insert(dataSharing)
      .values({
        adminId: parseInt(adminId),
        employeeId: parseInt(employeeId),
        sharedDataType: sharedDataType.trim(),
        sharedData: sharedData || null,
        message: message ? message.trim() : null,
        isRead: isRead ?? false,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
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

    const body = await request.json();
    const { sharedDataType, sharedData, message, isRead } = body;

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(dataSharing)
      .where(eq(dataSharing.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Data sharing record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate sharedDataType if provided
    if (sharedDataType && !VALID_SHARED_DATA_TYPES.includes(sharedDataType as any)) {
      return NextResponse.json(
        {
          error: `Invalid sharedDataType. Must be one of: ${VALID_SHARED_DATA_TYPES.join(', ')}`,
          code: 'INVALID_SHARED_DATA_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate sharedData is valid JSON if provided
    if (sharedData !== undefined && sharedData !== null) {
      if (typeof sharedData !== 'object') {
        return NextResponse.json(
          { error: 'sharedData must be a valid JSON object', code: 'INVALID_SHARED_DATA' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updates: any = {};

    if (sharedDataType !== undefined) {
      updates.sharedDataType = sharedDataType.trim();
    }

    if (sharedData !== undefined) {
      updates.sharedData = sharedData;
    }

    if (message !== undefined) {
      updates.message = message ? message.trim() : null;
    }

    if (isRead !== undefined) {
      updates.isRead = isRead;
    }

    // Update record
    const updated = await db
      .update(dataSharing)
      .set(updates)
      .where(eq(dataSharing.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
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

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(dataSharing)
      .where(eq(dataSharing.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Data sharing record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete record
    const deleted = await db
      .delete(dataSharing)
      .where(eq(dataSharing.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Data sharing record deleted successfully',
        id: deleted[0].id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}