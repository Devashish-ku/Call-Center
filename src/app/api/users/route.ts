import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, and, or, ne } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Helper function to exclude password from user object
function excludePassword(user: any) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(excludePassword(user[0]), { status: 200 });
    }

    // List users with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    let query = db.select().from(users);

    // Build conditions array
    const conditions = [];

    if (search) {
      conditions.push(like(users.username, `%${search}%`));
    }

    if (role) {
      conditions.push(eq(users.role, role));
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    // Remove password from all user objects
    const usersWithoutPassword = results.map(excludePassword);

    return NextResponse.json(usersWithoutPassword, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role, isActive } = body;

    // Validate required fields
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required', code: 'MISSING_USERNAME' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'admin' && role !== 'employee') {
      return NextResponse.json(
        {
          error: "Role must be either 'admin' or 'employee'",
          code: 'INVALID_ROLE',
        },
        { status: 400 }
      );
    }

    // Sanitize username
    const sanitizedUsername = username.trim();

    // Check if username already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, sanitizedUsername))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists', code: 'USERNAME_EXISTS' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        username: sanitizedUsername,
        password: hashedPassword,
        role,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(excludePassword(newUser[0]), { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { username, password, role, isActive } = body;

    // Validate role if provided
    if (role && role !== 'admin' && role !== 'employee') {
      return NextResponse.json(
        {
          error: "Role must be either 'admin' or 'employee'",
          code: 'INVALID_ROLE',
        },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {};

    // Check username uniqueness if provided
    if (username) {
      const sanitizedUsername = username.trim();

      const duplicateUser = await db
        .select()
        .from(users)
        .where(
          and(eq(users.username, sanitizedUsername), ne(users.id, userId))
        )
        .limit(1);

      if (duplicateUser.length > 0) {
        return NextResponse.json(
          { error: 'Username already exists', code: 'USERNAME_EXISTS' },
          { status: 409 }
        );
      }

      updates.username = sanitizedUsername;
    }

    // Hash password if provided
    if (password) {
      updates.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (role) {
      updates.role = role;
    }

    if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(excludePassword(updatedUser[0]), { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user
    const deleted = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        id: deleted[0].id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}