type CallLogEvent = {
  id?: number;
  employeeId: number;
  callDate: string;
  callTime: string;
  status: string;
  duration: number | null;
  customerPhone: string | null;
  notes: string | null;
  createdAt: string;
};

type Subscriber = {
  writer: WritableStreamDefaultWriter<Uint8Array>;
  employeeId?: number;
  keepalive?: NodeJS.Timeout;
};

const globalAny = globalThis as any;

if (!globalAny.__callLogSubscribers) {
  globalAny.__callLogSubscribers = new Set<Subscriber>();
}

const subscribers: Set<Subscriber> = globalAny.__callLogSubscribers;

export function addSubscriber(sub: Subscriber) {
  subscribers.add(sub);
}

export function removeSubscriber(sub: Subscriber) {
  subscribers.delete(sub);
  if (sub.keepalive) clearInterval(sub.keepalive);
  try {
    sub.writer.close();
  } catch {}
}

function encodeSSE(data: unknown) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return new TextEncoder().encode(`data: ${payload}\n\n`);
}

export function broadcastCallLog(event: CallLogEvent) {
  for (const sub of subscribers) {
    if (sub.employeeId && sub.employeeId !== event.employeeId) continue;
    try {
      sub.writer.write(encodeSSE(event));
    } catch {
      // Drop broken subscriber
      subscribers.delete(sub);
    }
  }
}

export type { CallLogEvent };
type ContactEvent = {
  id?: number;
  name: string;
  phoneNumber: string;
  assignedEmployeeId?: number | null;
  callStatus?: string | null;
  callTime?: string | null;
  callDurationSec?: number | null;
};

if (!(globalThis as any).__contactSubscribers) {
  (globalThis as any).__contactSubscribers = new Set<Subscriber>();
}

const contactSubscribers: Set<Subscriber> = (globalThis as any).__contactSubscribers;

export function addContactSubscriber(sub: Subscriber) {
  contactSubscribers.add(sub);
}

export function removeContactSubscriber(sub: Subscriber) {
  contactSubscribers.delete(sub);
  if (sub.keepalive) clearInterval(sub.keepalive);
  try {
    sub.writer.close();
  } catch {}
}

export function broadcastContact(event: ContactEvent) {
  for (const sub of contactSubscribers) {
    if (sub.employeeId && sub.employeeId !== (event.assignedEmployeeId || undefined)) continue;
    try {
      sub.writer.write(encodeSSE(event));
    } catch {
      contactSubscribers.delete(sub);
    }
  }
}

export type { ContactEvent };

