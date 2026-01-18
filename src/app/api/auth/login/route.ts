import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRATION = '24h';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { 
          error: 'Username and password are required',
          code: 'MISSING_CREDENTIALS' 
        },
        { status: 400 }
      );
    }

    // Trim and validate inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return NextResponse.json(
        { 
          error: 'Username and password cannot be empty',
          code: 'EMPTY_CREDENTIALS' 
        },
        { status: 400 }
      );
    }

    // Query user by username
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.username, trimmedUsername))
      .limit(1);

    // Check if user exists
    if (userResults.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS' 
        },
        { status: 401 }
      );
    }

    const user = userResults[0];

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS' 
        },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (!user.isActive) {
      return NextResponse.json(
        { 
          error: 'Account is inactive',
          code: 'ACCOUNT_INACTIVE' 
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION
    });

    // Return success response with token and user data (excluding password)
    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          isActive: user.isActive
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}