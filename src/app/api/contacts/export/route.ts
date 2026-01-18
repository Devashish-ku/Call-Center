import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { contacts, files } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fileIdParam = searchParams.get('fileId')
    const fileId = fileIdParam ? parseInt(fileIdParam) : undefined

    let rows
    if (fileId && !Number.isNaN(fileId)) {
      const f = await db.select().from(files).where(eq(files.id, fileId)).limit(1)
      if (f.length === 0) return NextResponse.json({ error: 'File not found' }, { status: 404 })
      rows = await db.select().from(contacts).where(eq(contacts.sourceFileId, fileId))
    } else {
      rows = await db.select().from(contacts)
    }

    const header = 'Name,Phone Number,Assigned Employee,Call Status,Call Time,Call Duration\n'
    const body = rows
      .map((r: any) => {
        const assigned = r.assignedEmployeeId ?? ''
        const status = r.callStatus ?? ''
        const time = r.callTime ?? ''
        const dur = r.callDurationSec ?? ''
        return `${r.name},${r.phoneNumber},${assigned},${status},${time},${dur}`
      })
      .join('\n')
    const csv = header + body

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="contacts.csv"',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}