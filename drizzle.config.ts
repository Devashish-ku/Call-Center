
import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';

const dbConfig: Config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './local.db',
  },
});

export default dbConfig;