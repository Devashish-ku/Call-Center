import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { callLogs, users, downloadLogs } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type');
    const userId = searchParams.get('userId');
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json';

    if (!exportType) {
      return NextResponse.json(
        { error: 'Export type is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let data: any[] = [];
    let filename = '';
    let resourceName = '';

    switch (exportType) {
      case 'call_logs':
        const conditions: any[] = [];
        
        if (employeeId) {
          conditions.push(eq(callLogs.employeeId, parseInt(employeeId)));
        }
        
        if (startDate) {
          conditions.push(gte(callLogs.callDate, startDate));
        }
        
        if (endDate) {
          conditions.push(lte(callLogs.callDate, endDate));
        }

        const callLogsData = await db
          .select({
            id: callLogs.id,
            employeeId: callLogs.employeeId,
            employeeUsername: users.username,
            callDate: callLogs.callDate,
            callTime: callLogs.callTime,
            status: callLogs.status,
            duration: callLogs.duration,
            customerPhone: callLogs.customerPhone,
            notes: callLogs.notes,
            createdAt: callLogs.createdAt,
          })
          .from(callLogs)
          .leftJoin(users, eq(callLogs.employeeId, users.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(callLogs.createdAt));

        data = callLogsData;
        filename = `call_logs_${new Date().toISOString().split('T')[0]}`;
        resourceName = 'Call Logs Export';
        break;

      case 'employees':
        const employeesData = await db
          .select({
            id: users.id,
            username: users.username,
            role: users.role,
            isActive: users.isActive,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.role, 'employee'))
          .orderBy(desc(users.createdAt));

        data = employeesData;
        filename = `employees_${new Date().toISOString().split('T')[0]}`;
        resourceName = 'Employees Export';
        break;

      case 'download_logs':
        const downloadLogsData = await db
          .select({
            id: downloadLogs.id,
            userId: downloadLogs.userId,
            username: users.username,
            downloadType: downloadLogs.downloadType,
            resourceId: downloadLogs.resourceId,
            resourceName: downloadLogs.resourceName,
            ipAddress: downloadLogs.ipAddress,
            downloadedAt: downloadLogs.downloadedAt,
          })
          .from(downloadLogs)
          .leftJoin(users, eq(downloadLogs.userId, users.id))
          .orderBy(desc(downloadLogs.downloadedAt))
          .limit(1000); // Limit to prevent huge exports

        data = downloadLogsData;
        filename = `download_logs_${new Date().toISOString().split('T')[0]}`;
        resourceName = 'Download Logs Export';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        );
    }

    // Log the export
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    await db.insert(downloadLogs).values({
      userId: parseInt(userId),
      downloadType: 'data_export',
      resourceId: null,
      resourceName,
      ipAddress,
      userAgent,
      downloadedAt: new Date().toISOString(),
    });

    // Return data based on format
    if (format === 'csv') {
      if (data.length === 0) {
        return NextResponse.json(
          { error: 'No data to export' },
          { status: 404 }
        );
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // Default JSON format
    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}