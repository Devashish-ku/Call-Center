
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Checking for admin user...');
  const admin = await db.query.users.findFirst({
    where: eq(users.username, 'admin')
  });

  if (admin) {
    console.log('Admin user exists.');
    // Optional: Update password to ensure it's known
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'admin'));
    console.log('Admin password reset to: admin123');
  } else {
    console.log('Admin user not found. Creating...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      name: 'System Admin',
      email: 'admin@example.com'
    });
    console.log('Admin user created with password: admin123');
  }
}

main().catch(console.error);
