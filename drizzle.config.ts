
// import { defineConfig } from 'drizzle-kit';
// import type { Config } from 'drizzle-kit';

// const dbConfig: Config = defineConfig({
//   schema: './src/db/schema.ts',
//   out: './drizzle',
//   dialect: 'sqlite',
//   dbCredentials: {
//     url: process.env.TURSO_CONNECTION_URL || 'file:local.db',
//   },
// });

// export default dbConfig;


import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    // We combine the URL and Token with a "?authToken=" connector
    url: 'libsql://call-center-devashish.aws-ap-northeast-1.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjkwMDI3NzcsImlkIjoiMWUwYTc0MjUtODdkZi00YmJjLTkyZmMtMjg3NWYxM2ZlOGExIiwicmlkIjoiYzZmMGY0YTQtYWVhOS00MDE3LWFkMzItZTNjZmNjNmZiM2Q3In0.bm62JJEf-b5cZDCKhCPzBRar1sZooY6_b9vVQC68Tggh_8EXa9R1GiIcbSIYBNCqmKfw4kTu-arga09OkpJvCQ'
  },
});