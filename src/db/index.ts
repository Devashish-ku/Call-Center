
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

// Use Turso for production, local SQLite for development
const url = process.env.TURSO_CONNECTION_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
