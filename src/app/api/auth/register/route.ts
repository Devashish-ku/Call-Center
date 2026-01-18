import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRATION = '24h';
const MAX_EMPLOYEES = 20;
const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role, createdBy } = body;

    // Validate required fields
    if (!username || !password || !role) {
      return NextResponse.json(
        { 
          error: 'Username, password, and role are required',
          code: 'MISSING_FIELDS' 
        },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'employee'].includes(role)) {
      return NextResponse.json(
        { 
          error: 'Invalid role. Must be admin or employee',
          code: 'INVALID_ROLE' 
        },
        { status: 400 }
      );
    }

    // Trim inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return NextResponse.json(
        { 
          error: 'Username and password cannot be empty',
          code: 'EMPTY_FIELDS' 
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (trimmedPassword.length < 6) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 6 characters',
          code: 'WEAK_PASSWORD' 
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, trimmedUsername))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { 
          error: 'Username already exists',
          code: 'USERNAME_EXISTS' 
        },
        { status: 409 }
      );
    }

    // If registering as employee, check if max limit reached
    if (role === 'employee') {
      const [employeeCount] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, 'employee'));

      if (employeeCount.count >= MAX_EMPLOYEES) {
        return NextResponse.json(
          { 
            error: `Maximum of ${MAX_EMPLOYEES} employees allowed`,
            code: 'MAX_EMPLOYEES_REACHED' 
          },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(trimmedPassword, SALT_ROUNDS);

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        username: trimmedUsername,
        password: hashedPassword,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Generate JWT token
    const tokenPayload = {
      userId: newUser[0].id,
      username: newUser[0].username,
      role: newUser[0].role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION
    });

    // Return success response
    return NextResponse.json(
      {
        token,
        user: {
          id: newUser[0].id,
          username: newUser[0].username,
          role: newUser[0].role,
          isActive: newUser[0].isActive
        },
        message: 'Registration successful'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
