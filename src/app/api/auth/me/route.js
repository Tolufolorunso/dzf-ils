import { verifyAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.status) {
      return NextResponse.json(
        { status: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: true,
      message: 'User is authenticated',
      data: {
        user: authResult.user,
        role: authResult.role,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { status: false, message: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
