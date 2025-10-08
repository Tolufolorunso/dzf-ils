import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const response = NextResponse.json(
      { status: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear the HTTP-only cookie
    response.cookies.set('ils_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { status: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
