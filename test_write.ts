
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Testing database write...');
  const testEmail = 'test_write_' + Date.now() + '@example.com';
  
  try {
    await db.insert(users).values({
      username: 'test_write_' + Date.now(),
      password: 'hashed_password',
      name: 'Test Write',
      email: testEmail,
      role: 'employee',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    console.log('Write successful!');
    
    // Cleanup
    await db.delete(users).where(eq(users.email, testEmail));
    console.log('Cleanup successful!');
  } catch (err) {
    console.error('Write failed:', err);
    process.exit(1);
  }
}

main();
