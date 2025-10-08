import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { dbConnect } from '@/lib/dbConnect';
import PatronModel from '@/models/PatronModel';
import UserModel from '@/models/UserModel';

// 🔐 Auth helper
async function verifyAuth(req) {
  try {
    await dbConnect();

    // Check for cookie or Bearer token
    const cookieToken = cookies().get('ils_token')?.value;

    console.log(cookieToken);

    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    const token = cookieToken || bearerToken;
    if (!token) {
      return {
        status: false,
        message: 'Unauthorized: No token provided',
        statusCode: StatusCodes.UNAUTHORIZED,
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded._id).select('-password');

    if (!user) {
      return {
        status: false,
        message: 'User not found',
        statusCode: StatusCodes.UNAUTHORIZED,
      };
    }

    if (!['admin', 'asst_admin', 'librarian'].includes(user.role)) {
      return {
        status: false,
        message: 'Forbidden: Insufficient permissions',
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    return { status: true, user };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      status: false,
      message: 'Invalid or expired token',
      statusCode: StatusCodes.UNAUTHORIZED,
    };
  }
}

// 🧾 GET one patron by barcode
export async function GET(req, { params }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode }
      );
    }

    await dbConnect();

    const { barcode } = params;

    if (!barcode) {
      return NextResponse.json(
        { status: false, message: 'Missing patron barcode' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const patron = await PatronModel.findOne({ barcode }).select('-__v');

    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    return NextResponse.json(
      {
        status: true,
        data: patron,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Error fetching patron details:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to retrieve patron details',
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
