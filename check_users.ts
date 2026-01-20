
import { db } from './src/db';
import { users } from './src/db/schema';

async function main() {
  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users in the database.`);
  allUsers.forEach(u => console.log(`- ${u.username} (${u.role})`));
}

main().catch(console.error);
