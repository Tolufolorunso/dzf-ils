import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { dbConnect } from '@/lib/dbConnect';
import UserModel from '@/models/UserModel';
import { delay } from '@/lib/utils'; // ⏳ small timing delay helper

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { status: false, message: 'Missing username or password' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();
    const user = await UserModel.findOne({ username: normalizedUsername });

    await delay(); // prevent timing attacks

    if (!user) {
      return NextResponse.json(
        { status: false, message: 'Invalid username or password' },
        { status: StatusCodes.UNAUTHORIZED }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { status: false, message: 'Account is inactive. Contact admin.' },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await delay();
      return NextResponse.json(
        { status: false, message: 'Invalid username or password' },
        { status: StatusCodes.UNAUTHORIZED }
      );
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // 🧁 Set the token in an HTTP-only, secure cookie

    const cookieStore = await cookies();

    cookieStore.set({
      name: 'ils_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day (24 hours)
      // maxAge: 60,
    });

    // exclude password before sending user info
    const { password: _, ...userData } = user.toObject();

    return NextResponse.json(
      {
        status: true,
        message: 'Login successful',
        user: userData,
        token,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      { status: false, message: error.message || 'Internal server error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
