import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { callLogs } from '@/db/schema';
import { eq, like, and } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  employeeId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());

  const validatedQuery = schema.safeParse(query);

  if (!validatedQuery.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { employeeId, status, search } = validatedQuery.data;

  try {
    // Build where conditions
    const conditions = [];

    if (employeeId) {
      const empId = parseInt(employeeId);
      if (!isNaN(empId)) {
        conditions.push(eq(callLogs.employeeId, empId));
      }
    }

    if (status) {
      conditions.push(eq(callLogs.status, status));
    }

    if (search) {
      conditions.push(like(callLogs.customerPhone, `%${search}%`));
    }

    let query = db.select().from(callLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;

    const csvHeader = 'id,employeeId,callDate,callTime,status,duration,customerPhone,notes\n';
    const csvBody = results
      .map(
        (log) =>
          `${log.id},${log.employeeId},${log.callDate},${log.callTime},${log.status},${log.duration},${log.customerPhone},${log.notes}`
      )
      .join('\n');

    const csv = csvHeader + csvBody;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="call-logs.csv"',
      },
    });
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json({ error: 'Error fetching call logs' }, { status: 500 });
  }
}
