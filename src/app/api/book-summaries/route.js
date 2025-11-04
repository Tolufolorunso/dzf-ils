import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import BookSummary from '@/models/BookSummaryModel';
import Patron from '@/models/PatronModel';
import Cataloging from '@/models/CatalogingModel';
import MonthlyActivity from '@/models/MonthlyActivityModel';

// Submit book summary (public - no authentication required) or Create summary (staff)
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      patronBarcode,
      bookBarcode,
      summary,
      rating,
      points,
      isStaffCreated,
    } = body;

    let auth = null;

    // Check if this is a staff-created summary
    if (isStaffCreated) {
      // Verify authentication for staff creation
      auth = await verifyAuth(request);
      if (!auth.status) {
        return NextResponse.json(
          { status: false, message: auth.message },
          { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
        );
      }

      // Validate required fields for staff creation
      if (!patronBarcode || !bookBarcode || !rating || !points) {
        return NextResponse.json(
          { status: false, message: 'All fields are required.' },
          { status: StatusCodes.BAD_REQUEST }
        );
      }

      if (points < 1 || points > 20) {
        return NextResponse.json(
          {
            status: false,
            message: 'Staff bonus points must be between 1 and 20.',
          },
          { status: StatusCodes.BAD_REQUEST }
        );
      }
    } else {
      // Original validation for student submissions
      if (!patronBarcode || !bookBarcode || !summary || !rating) {
        return NextResponse.json(
          { status: false, message: 'All fields are required.' },
          { status: StatusCodes.BAD_REQUEST }
        );
      }

      if (summary.length < 100) {
        return NextResponse.json(
          {
            status: false,
            message: 'Summary must be at least 100 characters long.',
          },
          { status: StatusCodes.BAD_REQUEST }
        );
      }
    }

    // Find patron and book
    const patron = await Patron.findOne({
      barcode: patronBarcode,
      is18: { $ne: true },
    });
    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    const book = await Cataloging.findOne({ barcode: bookBarcode });
    if (!book) {
      return NextResponse.json(
        { status: false, message: 'Book not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // Check monthly limits for student submissions
    if (!isStaffCreated) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Check monthly summary limit (4 per month)
      const monthlySummaryCount = await BookSummary.countDocuments({
        patronBarcode,
        submissionDate: {
          $gte: new Date(year, month - 1, 1),
          $lt: new Date(year, month, 1),
        },
      });

      if (monthlySummaryCount >= 4) {
        return NextResponse.json(
          {
            status: false,
            message: `You have reached the monthly limit of 4 book summaries. You have submitted ${monthlySummaryCount} summaries this month. Please wait until next month to submit more summaries.`,
          },
          { status: StatusCodes.BAD_REQUEST }
        );
      }
    }

    // Only check borrowing history for student submissions
    if (!isStaffCreated) {
      // Check if patron has actually borrowed and returned this book
      const hasCheckedOutBook = patron.itemsCheckedOutHistory.some(
        (item) => item.itemBarcode === bookBarcode
      );

      if (!hasCheckedOutBook) {
        return NextResponse.json(
          {
            status: false,
            message:
              'You can only submit summaries for books you have borrowed from the library.',
          },
          { status: StatusCodes.BAD_REQUEST }
        );
      }

      // Check if the book is currently checked out (not returned yet)
      if (book.isCheckedOut) {
        const currentCheckout = book.patronsCheckedOutHistory?.find(
          (checkout) =>
            checkout.barcode === patronBarcode && !checkout.returnedAt
        );

        if (currentCheckout) {
          return NextResponse.json(
            {
              status: false,
              message:
                'Please return the book first before submitting a summary.',
            },
            { status: StatusCodes.BAD_REQUEST }
          );
        }
      }
    }

    // Check if summary already exists for this book (only one summary per book allowed)
    const existingSummary = await BookSummary.findOne({
      bookBarcode,
    });

    if (existingSummary) {
      const isOwnSummary = existingSummary.patronBarcode === patronBarcode;
      const statusMessage = isOwnSummary
        ? existingSummary.status === 'pending'
          ? 'Your summary is currently being reviewed by staff.'
          : existingSummary.status === 'approved'
          ? `Your summary was approved and you earned ${existingSummary.points} points.`
          : 'Your summary was reviewed by staff.'
        : `A summary for this book has already been submitted by ${existingSummary.patronName}.`;

      return NextResponse.json(
        {
          status: false,
          message: `A summary for "${book.title.mainTitle}" already exists. ${statusMessage} Only one summary per book is allowed in the system.`,
          existingSummary: {
            submissionDate: existingSummary.submissionDate,
            status: existingSummary.status,
            points: existingSummary.points,
            rating: existingSummary.rating,
            patronName: existingSummary.patronName,
          },
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Create book summary
    let bookSummary;
    try {
      const summaryData = {
        patronId: patron._id,
        patronBarcode,
        patronName: `${patron.firstname} ${patron.surname}`,
        bookId: book._id,
        bookTitle: book.title.mainTitle,
        bookBarcode,
        rating,
      };

      if (isStaffCreated) {
        // Staff-created summary - approved immediately with points
        summaryData.summary =
          "This book summary record was created by library staff to acknowledge the patron's reading activity and award points for their engagement with library materials. The patron has successfully completed reading this book and demonstrated their commitment to literacy and learning.";
        summaryData.status = 'approved';
        summaryData.points = 25 + points; // 25 base points + staff bonus (1-20)
        summaryData.reviewedBy =
          auth?.user?.name || auth?.user?.email || 'Staff';
        summaryData.reviewDate = new Date();
      } else {
        // Student submission - gets 25 points automatically, pending review for bonus
        summaryData.summary = summary;
        summaryData.status = 'pending';
        summaryData.points = 25; // Automatic 25 points for submission
      }

      bookSummary = await BookSummary.create(summaryData);
    } catch (dbError) {
      // Handle duplicate key error (unique constraint violation)
      if (
        dbError.code === 11000 &&
        dbError.keyPattern?.patronBarcode &&
        dbError.keyPattern?.bookBarcode
      ) {
        return NextResponse.json(
          {
            status: false,
            message: `You have already submitted a summary for "${book.title.mainTitle}". Each student can only submit one summary per book, regardless of how many times you borrow it.`,
          },
          { status: StatusCodes.BAD_REQUEST }
        );
      }
      throw dbError; // Re-throw if it's a different error
    }

    // Update monthly activity and patron points
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Award points for all summaries (25 base + any staff bonus)
    const totalPoints = isStaffCreated ? 25 + points : 25;

    await Patron.findByIdAndUpdate(patron._id, {
      $inc: { points: totalPoints },
    });

    if (isStaffCreated) {
      await MonthlyActivity.findOneAndUpdate(
        { patronId: patron._id, year, month },
        {
          $inc: {
            summariesApproved: 1,
            totalPoints: totalPoints,
          },
          $set: {
            patronBarcode,
            patronName: `${patron.firstname} ${patron.surname}`,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
    } else {
      await MonthlyActivity.findOneAndUpdate(
        { patronId: patron._id, year, month },
        {
          $inc: {
            summariesSubmitted: 1,
            totalPoints: totalPoints,
          },
          $set: {
            patronBarcode,
            patronName: `${patron.firstname} ${patron.surname}`,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    const message = isStaffCreated
      ? `Book summary created successfully. ${
          25 + points
        } points (25 base + ${points} bonus) have been awarded to the patron.`
      : 'Book summary submitted successfully. You have earned 25 points! Staff will review for potential bonus points.';

    return NextResponse.json(
      {
        status: true,
        message,
        data: {
          summaryId: bookSummary._id,
          bookTitle: bookSummary.bookTitle,
          status: bookSummary.status,
          points: bookSummary.points || 0,
        },
      },
      { status: StatusCodes.CREATED }
    );
  } catch (error) {
    console.error('Book summary submission error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to submit book summary.',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// Get book summaries
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const patronBarcode = searchParams.get('patronBarcode');

    let query = {};

    if (status) {
      query.status = status;
    }

    if (patronBarcode) {
      query.patronBarcode = patronBarcode;
    }

    const summaries = await BookSummary.find(query)
      .sort({ submissionDate: -1 })
      .limit(100);

    return NextResponse.json(
      {
        status: true,
        message: 'Book summaries fetched successfully.',
        data: summaries,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Book summaries fetch error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch book summaries.',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
