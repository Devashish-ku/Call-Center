
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


import 'dotenv/config'; 
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    // We combine the URL and Token into one string.
    // This fixes the "authToken" error while keeping your keys safe.
    url: `${process.env.TURSO_CONNECTION_URL}?authToken=${process.env.TURSO_AUTH_TOKEN}`,
  },
});