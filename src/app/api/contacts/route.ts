import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { contacts, users, files } from '@/db/schema'
import { and, eq, like, desc } from 'drizzle-orm'
import fs from 'node:fs/promises'
import path from 'node:path'

function normalizePhone(v: string) {
  return v.replace(/[^\d+]/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100)
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const assignedEmployeeId = searchParams.get('assignedEmployeeId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const conditions: any[] = []
    if (assignedEmployeeId && !Number.isNaN(parseInt(assignedEmployeeId))) {
      conditions.push(eq(contacts.assignedEmployeeId, parseInt(assignedEmployeeId)))
    }
    if (status) conditions.push(eq(contacts.callStatus, status))
    if (search) conditions.push(like(contacts.phoneNumber, `%${search}%`))

    let query = db.select().from(contacts)
    if (conditions.length > 0) query = query.where(and(...conditions)) as any

    const rows = await query.orderBy(desc(contacts.createdAt)).limit(limit).offset(offset)
    return NextResponse.json(rows, { status: 200 })
  } catch (error: any) {
    console.error('Contacts GET error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileIdParam = searchParams.get('fileId')
    const body = await request.json().catch(() => ({}))
    const mapping = body?.mapping || {}

    if (!fileIdParam || Number.isNaN(parseInt(fileIdParam))) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    const fileId = parseInt(fileIdParam)
    const fileRows = await db.select().from(files).where(eq(files.id, fileId))
    if (fileRows.length === 0) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const filePath = fileRows[0].filePath
    const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)
    const buf = await fs.readFile(absolute)
    const text = buf.toString('utf8')

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 })

    const header = lines[0].split(',').map((h) => h.trim())
    const lower = header.map((h) => h.toLowerCase())
    const idx = (name: string) => {
      const found = lower.findIndex((h) => h === name.toLowerCase())
      if (found >= 0) return found
      const mapName = mapping[name]
      if (mapName) {
        const m = mapName.toLowerCase()
        const mi = lower.findIndex((h) => h === m)
        if (mi >= 0) return mi
      }
      return -1
    }
    const findSyn = (candidates: string[]) => {
      const i = lower.findIndex((h) => candidates.some((s) => h.includes(s)))
      return i
    }

    let nameIdx = idx('Name')
    let phoneIdx = idx('Phone Number')
    const assignedIdx = idx('Assigned Employee')
    const statusIdx = idx('Call Status')
    const timeIdx = idx('Call Time')
    const durationIdx = idx('Call Duration')

    if (nameIdx < 0) nameIdx = findSyn(['name', 'candidate name', 'customer name', 'contact name'])
    if (phoneIdx < 0) phoneIdx = findSyn(['phone number', 'phone no', 'contact no', 'contact', 'mobile', 'phone'])

    if (nameIdx < 0 || phoneIdx < 0) {
      return NextResponse.json({ error: 'CSV must include Name and Phone Number columns' }, { status: 400 })
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      const name = (cols[nameIdx] || '').trim()
      const phone = normalizePhone((cols[phoneIdx] || '').trim())
      if (!name || !phone) continue

      let assignedEmployeeId: number | null = null
      if (assignedIdx >= 0) {
        const assigned = (cols[assignedIdx] || '').trim()
        if (assigned) {
          const idNum = parseInt(assigned)
          if (!Number.isNaN(idNum)) {
            assignedEmployeeId = idNum
          } else {
            const user = await db.select().from(users).where(eq(users.username, assigned))
            if (user.length > 0) assignedEmployeeId = user[0].id as number
          }
        }
      }

      const callStatus = statusIdx >= 0 ? (cols[statusIdx] || '').trim() || null : null
      const callTime = timeIdx >= 0 ? (cols[timeIdx] || '').trim() || null : null
      const callDurationSec = durationIdx >= 0 ? parseInt((cols[durationIdx] || '').trim()) || null : null

      const existing = await db.select().from(contacts).where(eq(contacts.phoneNumber, phone))
      if (existing.length > 0) {
        await db
          .update(contacts)
          .set({ name, assignedEmployeeId, callStatus, callTime, callDurationSec, sourceFileId: fileId })
          .where(eq(contacts.id, existing[0].id as number))
      } else {
        await db
          .insert(contacts)
          .values({
            name,
            phoneNumber: phone,
            assignedEmployeeId,
            callStatus,
            callTime,
            callDurationSec,
            sourceFileId: fileId,
            createdAt: new Date().toISOString(),
          })
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    console.error('Contacts POST error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}
