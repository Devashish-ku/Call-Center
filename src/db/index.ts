
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

// Use Turso for production, local SQLite for development
const url = process.env.TURSO_CONNECTION_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

console.log('Database Config:', {
  url: url.includes('turso') ? '***TURSO***' : url,
  hasAuthToken: !!authToken,
  nodeEnv: process.env.NODE_ENV
});

if (process.env.NODE_ENV === 'production' && !process.env.TURSO_CONNECTION_URL) {
  console.warn('WARNING: Running in production without TURSO_CONNECTION_URL. Falling back to local.db which may be read-only.');
}

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
