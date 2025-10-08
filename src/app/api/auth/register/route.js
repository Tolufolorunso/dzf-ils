import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/dbConnect';
import UserModel from '@/models/UserModel';
import { delay } from '@/lib/utils';

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    let { username, password, name, role } = body;

    role = role || 'librarian';

    if (!username || !password || !name) {
      return NextResponse.json(
        { status: false, message: 'Missing required fields' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const validRoles = [
      'admin',
      'asst_admin',
      'ima',
      'librarian',
      'ict',
      'facility',
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { status: false, message: `Invalid role: ${role}` },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Check if username already exists
    const existingUser = await UserModel.findOne({
      username: username.toLowerCase(),
    });

    if (existingUser) {
      await delay(); // slight delay before returning
      return NextResponse.json(
        { status: false, message: 'Username already exists' },
        { status: StatusCodes.CONFLICT }
      );
    }

    // Restrict duplicate special roles
    if (role === 'admin') {
      const adminExists = await UserModel.findOne({ role: 'admin' });
      if (adminExists) {
        await delay();
        return NextResponse.json(
          { status: false, message: 'An admin account already exists' },
          { status: StatusCodes.FORBIDDEN }
        );
      }
    }

    if (role === 'ima') {
      const imaExists = await UserModel.findOne({ role: 'ima' });
      if (imaExists) {
        await delay();
        return NextResponse.json(
          { status: false, message: 'An IMA account already exists' },
          { status: StatusCodes.FORBIDDEN }
        );
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new UserModel({
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      name,
      role,
    });

    await newUser.save();

    return NextResponse.json(
      { status: true, message: 'Registration successful' },
      { status: StatusCodes.CREATED }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // 🎯 Handle Mongoose validation or duplicate key errors gracefully
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return NextResponse.json(
        { status: false, message: `Validation failed: ${message}` },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    if (error.code === 11000) {
      // Duplicate key error (unique index)
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json(
        { status: false, message: `Duplicate field: ${field}` },
        { status: StatusCodes.CONFLICT }
      );
    }

    // Fallback error for unexpected issues
    return NextResponse.json(
      { status: false, message: error.message || 'Unexpected error occurred' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
