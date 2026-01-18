import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const sid = (body.sid || '').toString()

    const accountSid = process.env.TWILIO_ACCOUNT_SID || ''
    const authToken = process.env.TWILIO_AUTH_TOKEN || ''

    if (!sid) {
      return NextResponse.json({ error: 'sid is required' }, { status: 400 })
    }
    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Missing Twilio configuration' }, { status: 500 })
    }

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${sid}.json`
    const params = new URLSearchParams({ Status: 'completed' })
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      return NextResponse.json({ error: 'Twilio API error', details: data }, { status: resp.status })
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}