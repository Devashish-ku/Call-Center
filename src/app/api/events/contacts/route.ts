import { NextRequest } from 'next/server'
import { addContactSubscriber, removeContactSubscriber } from '@/lib/eventBus'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const employeeIdParam = searchParams.get('employeeId')
  const employeeId = employeeIdParam ? parseInt(employeeIdParam) : undefined

  const ts = new TransformStream()
  const writer = ts.writable.getWriter()
  await writer.write(new TextEncoder().encode(': connected\n\n'))

  const sub = { writer, employeeId } as any
  addContactSubscriber(sub)
  sub.keepalive = setInterval(() => {
    try {
      writer.write(new TextEncoder().encode(': ping\n\n'))
    } catch {
      removeContactSubscriber(sub)
    }
  }, 15000)

  req.signal.addEventListener('abort', () => {
    removeContactSubscriber(sub)
  })

  return new Response(ts.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}