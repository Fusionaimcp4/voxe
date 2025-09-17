import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Get credentials from environment variables
    const validUsername = process.env.PAGE_AUTH_USER;
    const validPassword = process.env.PAGE_AUTH_PASS;

    // Check if environment variables are set
    if (!validUsername || !validPassword) {
      console.error('Admin credentials not configured in environment variables');
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    // Validate credentials
    if (username === validUsername && password === validPassword) {
      return NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
