const { drizzle } = require('drizzle-orm/libsql');
const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function initDb() {
  try {
    console.log('Initializing database...');
    const hashedPassword = await bcrypt.hash('password', 10);
    console.log('Database connection successful');
  } catch (error) {
    console.log('Error:', error.message);
  }
}

initDb();