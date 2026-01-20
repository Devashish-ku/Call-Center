import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // Safety check for production environment
    if (process.env.NODE_ENV === 'production' && !process.env.TURSO_CONNECTION_URL) {
      console.error('Registration failed: TURSO_CONNECTION_URL is missing in production');
      return NextResponse.json(
        { error: 'Database configuration missing (TURSO_CONNECTION_URL)' },
        { status: 500 }
      );
    }

    const { username, password, name, email, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await db.insert(users).values({
      username,
      password: hashedPassword,
      name,
      email,
      role: role || 'employee',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error detailed:', error);
    if (error instanceof Error) {
        console.error('Stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
