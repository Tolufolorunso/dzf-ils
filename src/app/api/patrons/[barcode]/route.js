import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { dbConnect } from '@/lib/dbConnect';
import PatronModel from '@/models/PatronModel';
import UserModel from '@/models/UserModel';
import { verifyAuth } from '@/lib/auth';

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

    const { barcode } = await params;

    if (!barcode) {
      return NextResponse.json(
        { status: false, message: 'Missing patron barcode' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const patron = await PatronModel.findOne({ barcode }).select('-__v');
    console.log('patron', patron);
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
