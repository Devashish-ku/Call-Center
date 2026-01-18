
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@/db/schema';
import path from 'path';

// Use local SQLite database
const dbPath = path.join(process.cwd(), 'local.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

export type Database = typeof db;
