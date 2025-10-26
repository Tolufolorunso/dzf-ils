import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import BookSummary from '@/models/BookSummaryModel';
import Patron from '@/models/PatronModel';
import MonthlyActivity from '@/models/MonthlyActivityModel';

// Review book summary (approve/reject)
export async function PATCH(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { status, points = 0, feedback = '' } = body;

    if (!id) {
      return NextResponse.json(
        { status: false, message: 'Summary ID is required.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        {
          status: false,
          message: 'Status must be either "approved" or "rejected".',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Find the book summary
    const summary = await BookSummary.findById(id).populate('bookId');
    if (!summary) {
      return NextResponse.json(
        { status: false, message: 'Book summary not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    if (summary.status !== 'pending') {
      return NextResponse.json(
        { status: false, message: 'This summary has already been reviewed.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Verify the book has been checked in (not currently checked out)
    if (summary.bookId && summary.bookId.isCheckedOut) {
      const currentCheckout = summary.bookId.patronsCheckedOutHistory?.find(
        (checkout) =>
          checkout.barcode === summary.patronBarcode && !checkout.returnedAt
      );

      if (currentCheckout) {
        return NextResponse.json(
          {
            status: false,
            message:
              'Cannot review summary - the book is still checked out. Please ensure the book has been returned first.',
          },
          { status: StatusCodes.BAD_REQUEST }
        );
      }
    }

    // Update the summary
    const updatedSummary = await BookSummary.findByIdAndUpdate(
      id,
      {
        status,
        points: status === 'approved' ? points : 0,
        feedback,
        reviewedBy: auth.user.name || auth.user.email,
        reviewDate: new Date(),
      },
      { new: true }
    );

    // If approved, award points to patron and update monthly activity
    if (status === 'approved' && points > 0) {
      // Update patron points
      await Patron.findByIdAndUpdate(summary.patronId, {
        $inc: { points: points },
      });

      // Update monthly activity
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      await MonthlyActivity.findOneAndUpdate(
        { patronId: summary.patronId, year, month },
        {
          $inc: {
            summariesApproved: 1,
            pointsFromSummaries: points,
            totalPoints: points,
          },
          $set: {
            patronBarcode: summary.patronBarcode,
            patronName: summary.patronName,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: `Book summary ${status} successfully.`,
        data: {
          summaryId: updatedSummary._id,
          status: updatedSummary.status,
          points: updatedSummary.points,
          patronName: updatedSummary.patronName,
        },
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Book summary review error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to review book summary.',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
