import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { dbConnect } from '@/lib/dbConnect';
import PatronModel from '@/models/PatronModel';
import UserModel from '@/models/UserModel';
import { verifyAuth } from '@/lib/auth';
import { canManagePatronStatus } from '@/lib/permissions';

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

// 🔄 PATCH patron status (activate/deactivate)
export async function PATCH(req, { params }) {
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
    const body = await req.json();
    const { action } = body;

    if (!barcode) {
      return NextResponse.json(
        { status: false, message: 'Missing patron barcode' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        {
          status: false,
          message: 'Invalid action. Use "activate" or "deactivate"',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Check if user has permission for the action
    if (!canManagePatronStatus(auth.user.role, action)) {
      const actionText = action === 'activate' ? 'reactivate' : 'deactivate';
      return NextResponse.json(
        {
          status: false,
          message: `Access denied. You don't have permission to ${actionText} patrons.`,
        },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    // Find patron
    const patron = await PatronModel.findOne({ barcode });

    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // Update patron status
    const newStatus = action === 'activate';
    const updatedPatron = await PatronModel.findOneAndUpdate(
      { barcode },
      {
        active: newStatus,
        [`${action}dAt`]: new Date(),
        [`${action}dBy`]: auth.user.name || auth.user.email,
      },
      { new: true }
    ).select('-__v');

    return NextResponse.json(
      {
        status: true,
        message: `Patron ${action}d successfully`,
        data: {
          barcode: updatedPatron.barcode,
          name: `${updatedPatron.firstname} ${updatedPatron.surname}`,
          active: updatedPatron.active,
          [`${action}dAt`]: updatedPatron[`${action}dAt`],
        },
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Error updating patron status:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to update patron status',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// 🗑️ DELETE patron by barcode (Admin only)
export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode }
      );
    }

    // Check if user is admin
    if (auth.user.role !== 'admin') {
      return NextResponse.json(
        {
          status: false,
          message: 'Access denied. Only administrators can delete patrons.',
        },
        { status: StatusCodes.FORBIDDEN }
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

    // Check if patron exists
    const patron = await PatronModel.findOne({ barcode });

    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // Check if patron has active checkouts
    if (patron.hasBorrowedBook) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Cannot delete patron with active book checkouts. Please return all books first.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Soft delete by marking as is18: true (following existing pattern)
    const deletedPatron = await PatronModel.findOneAndUpdate(
      { barcode },
      {
        is18: true,
        active: false,
        deletedAt: new Date(),
        deletedBy: auth.user.name || auth.user.email,
      },
      { new: true }
    );

    return NextResponse.json(
      {
        status: true,
        message: 'Patron deleted successfully',
        data: {
          barcode: deletedPatron.barcode,
          name: `${deletedPatron.firstname} ${deletedPatron.surname}`,
          deletedAt: deletedPatron.deletedAt,
        },
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Error deleting patron:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to delete patron',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
