import { NextRequest } from 'next/server';
import { addSubscriber, removeSubscriber } from '@/lib/eventBus';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeIdParam = searchParams.get('employeeId');
  const employeeId = employeeIdParam ? parseInt(employeeIdParam) : undefined;

  const ts = new TransformStream();
  const writer = ts.writable.getWriter();

  // initial comment to establish stream
  await writer.write(new TextEncoder().encode(': connected\n\n'));

  const sub = { writer, employeeId } as any;
  addSubscriber(sub);

  // keepalive ping every 15 seconds
  sub.keepalive = setInterval(() => {
    try {
      writer.write(new TextEncoder().encode(': ping\n\n'));
    } catch {
      removeSubscriber(sub);
    }
  }, 15000);

  // auto-remove on client abort
  req.signal.addEventListener('abort', () => {
    removeSubscriber(sub);
  });

  return new Response(ts.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

