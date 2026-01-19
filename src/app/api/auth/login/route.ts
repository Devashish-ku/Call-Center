import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Mock user data for demo
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
    isActive: true
  }
];

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Simple demo login - username: admin, password: admin123
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { 
          userId: 1, 
          username: 'admin', 
          role: 'admin' 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        user: { id: 1, username: 'admin', role: 'admin', isActive: true },
        token
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}