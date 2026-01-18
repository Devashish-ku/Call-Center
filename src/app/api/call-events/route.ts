import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { callLogs, phoneEndpoints, contacts } from '@/db/schema';
import { broadcastCallLog, broadcastContact } from '@/lib/eventBus';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
// Twilio posts application/x-www-form-urlencoded payloads; parse with URLSearchParams

// Map Twilio CallStatus to our app statuses
function mapStatus(callStatus?: string): string {
  switch (callStatus) {
    case 'completed':
      return 'connected';
    case 'no-answer':
      return 'not_answered';
    case 'busy':
    case 'failed':
    case 'canceled':
      return 'not_connected';
    default:
      return 'connected';
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const employeeIdParam = url.searchParams.get('employeeId');

    // Verify Twilio signature
    const twilioSignature = req.headers.get('x-twilio-signature');
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    if (!authToken) {
      return NextResponse.json(
        { error: 'Twilio auth token not configured' },
        { status: 500 }
      );
    }

    // Twilio sends application/x-www-form-urlencoded by default
    const raw = await req.text();
    const usp = new URLSearchParams(raw);
    const data = Object.fromEntries(usp.entries()) as Record<string, string>;

    if (!twilioSignature) {
      return NextResponse.json({ error: 'Missing Twilio signature' }, { status: 403 });
    }

    // Compute expected signature: URL + sorted POST param values (no keys), HMAC-SHA1 with authToken
    const paramsSorted = Array.from(usp.keys()).sort();
    const signatureBase = url.origin + url.pathname + (url.search || '') + paramsSorted.map((k) => data[k] || '').join('');
    const expected = crypto.createHmac('sha1', authToken).update(signatureBase).digest('base64');
    if (twilioSignature !== expected) {
      return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 403 });
    }

    const callSid = data['CallSid'];
    const callStatus = data['CallStatus'];
    const callDurationStr = data['CallDuration'];
    const fromNumber = data['From'] || null;
    const toNumber = data['To'] || null;

    const now = new Date();
    const callDate = now.toISOString().slice(0, 10);
    const callTime = now.toTimeString().slice(0, 8);

    let employeeId: number | undefined;
    const employeeIdRaw = data['employee_id'] || employeeIdParam || '';
    const parsedEmployeeId = parseInt(employeeIdRaw);
    if (parsedEmployeeId && !Number.isNaN(parsedEmployeeId)) {
      employeeId = parsedEmployeeId;
    } else {
      // Fallback: resolve employee by phone endpoint mapping
      if (toNumber) {
        const match = await db
          .select()
          .from(phoneEndpoints)
          .where(eq(phoneEndpoints.endpoint, toNumber));
        if (match.length > 0) employeeId = match[0].employeeId as number;
      }
      if (!employeeId && fromNumber) {
        const match = await db
          .select()
          .from(phoneEndpoints)
          .where(eq(phoneEndpoints.endpoint, fromNumber));
        if (match.length > 0) employeeId = match[0].employeeId as number;
      }
    }
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Unable to resolve employeeId from request or phone endpoints' },
        { status: 400 }
      );
    }

    const status = mapStatus(callStatus);
    const duration = callDurationStr ? parseInt(callDurationStr) : null;

    // Idempotent upsert by providerCallId (CallSid)
    const existing = callSid
      ? await db
          .select()
          .from(callLogs)
          .where(eq(callLogs.providerCallId as any, callSid))
      : [];

    if (existing.length > 0) {
      const [updated] = await db
        .update(callLogs)
        .set({
          status,
          duration,
          customerPhone: fromNumber,
          notes: toNumber ? `To: ${toNumber} | SID: ${callSid || ''}` : `SID: ${callSid || ''}`,
          fromNumber,
          toNumber,
        })
        .where(eq(callLogs.id, existing[0].id))
        .returning();
      broadcastCallLog(updated);
    } else {
      const [inserted] = await db
        .insert(callLogs)
        .values({
          employeeId,
          callDate,
          callTime,
          status,
          duration,
          customerPhone: fromNumber,
          notes: toNumber ? `To: ${toNumber} | SID: ${callSid || ''}` : `SID: ${callSid || ''}`,
          providerCallId: callSid || null,
          fromNumber,
          toNumber,
          createdAt: now.toISOString(),
        })
        .returning();
      broadcastCallLog(inserted);
    }

    const targetNumber = toNumber || fromNumber || null;
    if (targetNumber) {
      const normalized = targetNumber.replace(/[^\d+]/g, '');
      const contactRows = await db
        .select()
        .from(contacts)
        .where(eq(contacts.phoneNumber, normalized));
      if (contactRows.length > 0) {
        const mappedStatus = status === 'connected' ? 'COMPLETED' : status === 'not_answered' ? 'MISSED' : 'MISSED';
        const [updatedContact] = await db
          .update(contacts)
          .set({
            assignedEmployeeId: employeeId,
            callStatus: mappedStatus,
            callTime: now.toISOString(),
            callDurationSec: duration,
          })
          .where(eq(contacts.id, contactRows[0].id as number))
          .returning();
        broadcastContact({
          id: updatedContact.id as number,
          name: updatedContact.name as string,
          phoneNumber: updatedContact.phoneNumber as string,
          assignedEmployeeId: updatedContact.assignedEmployeeId as number | null,
          callStatus: updatedContact.callStatus as string | null,
          callTime: updatedContact.callTime as string | null,
          callDurationSec: updatedContact.callDurationSec as number | null,
        });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
