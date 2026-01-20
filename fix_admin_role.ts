
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Fixing admin user role...');
  await db.update(users)
    .set({ role: 'admin' })
    .where(eq(users.username, 'admin'));
  console.log('User "admin" set to role "admin".');
}

main().catch(console.error);
