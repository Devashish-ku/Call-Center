import { NextRequest, NextResponse } from 'next/server';

// Initiates an outbound call via Twilio REST API and wires status callbacks
// Query/body params: to (E.164 phone), employeeId (number)
export async function POST(req: NextRequest) {
  try {
    const baseUrl = process.env.PUBLIC_BASE_URL || '';
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    const callerId = process.env.TWILIO_CALLER_ID || '';

    if (!accountSid || !authToken || !callerId) {
      return NextResponse.json(
        { error: 'Missing Twilio configuration. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_CALLER_ID, and PUBLIC_BASE_URL.' },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const toParam = url.searchParams.get('to');
    const employeeIdParam = url.searchParams.get('employeeId');

    const body = await req.clone().json().catch(() => ({} as any));
    const to = (toParam || body.to || '').toString();
    const employeeIdRaw = (employeeIdParam || body.employeeId || '').toString();
    const employeeId = parseInt(employeeIdRaw);

    if (!to) {
      return NextResponse.json({ error: 'Missing required parameter: to' }, { status: 400 });
    }
    if (!/^\+91\d{10}$/.test(to)) {
      return NextResponse.json({ error: 'Only Indian numbers allowed (+91XXXXXXXXXX)' }, { status: 400 });
    }
    if (!employeeId || Number.isNaN(employeeId)) {
      return NextResponse.json({ error: 'Missing or invalid employeeId' }, { status: 400 });
    }

    // StatusCallback must be publicly accessible (use ngrok/localtunnel during dev)
    const statusCallback = `${baseUrl}/api/call-events?employeeId=${employeeId}`;

    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const params = new URLSearchParams({
      From: callerId,
      To: to,
      // Minimal TwiML; adjust as needed (play message, gather input, etc.)
      Twiml: '<Response></Response>',
      StatusCallback: statusCallback,
      StatusCallbackMethod: 'POST',
      StatusCallbackEvent: 'queued ringing in-progress completed no-answer busy failed',
    });

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const resp = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json({ error: 'Twilio API error', details: data }, { status: resp.status });
    }

    // Reply with call SID so the client can display a toast or track progress
    return NextResponse.json({ ok: true, sid: data.sid }, { status: 200 });
  } catch (err) {
    console.error('Dial error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

