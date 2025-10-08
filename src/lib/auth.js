import { cookies } from 'next/headers';
import { dbConnect } from '@/lib/dbConnect';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import UserModel from '@/models/UserModel';

export async function verifyAuth(req) {
  try {
    await dbConnect();

    // Try cookie first, then Bearer token (for mobile)
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('ils_token');

    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return {
        status: false,
        message: 'No authentication token found.',
        statusCode: StatusCodes.UNAUTHORIZED,
      };
    }

    // Verify and get user
    const decoded = jwt.verify(token?.value, process.env.JWT_SECRET);

    const user = await UserModel.findById(decoded.id).select('-password');
    if (!user) {
      return {
        status: false,
        message: 'User not found.',
        statusCode: StatusCodes.UNAUTHORIZED,
      };
    }

    // Check permissions
    if (
      !['admin', 'asst_admin', 'ima', 'librarian', 'ict', 'facility'].includes(
        user.role
      )
    ) {
      return {
        status: false,
        message: 'Access denied — insufficient permission.',
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    return { status: true, user };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      status: false,
      message: 'Invalid or expired token.',
      statusCode: StatusCodes.UNAUTHORIZED,
    };
  }
}
