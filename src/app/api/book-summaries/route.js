import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import BookSummary from '@/models/BookSummaryModel';
import Patron from '@/models/PatronModel';
import Cataloging from '@/models/CatalogingModel';
import MonthlyActivity from '@/models/MonthlyActivityModel';

// Submit book summary (public - no authentication required)
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { patronBarcode, bookBarcode, summary, rating } = body;

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
        (checkout) => checkout.barcode === patronBarcode && !checkout.returnedAt
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

    // Check if summary already exists for this book by this patron
    const existingSummary = await BookSummary.findOne({
      patronBarcode,
      bookBarcode,
    });

    if (existingSummary) {
      const statusMessage =
        existingSummary.status === 'pending'
          ? 'Your summary is currently being reviewed by staff.'
          : existingSummary.status === 'approved'
          ? `Your summary was approved and you earned ${existingSummary.points} points.`
          : 'Your summary was reviewed by staff.';

      return NextResponse.json(
        {
          status: false,
          message: `You have already submitted a summary for "${book.title.mainTitle}". ${statusMessage} Each student can only submit one summary per book.`,
          existingSummary: {
            submissionDate: existingSummary.submissionDate,
            status: existingSummary.status,
            points: existingSummary.points,
            rating: existingSummary.rating,
          },
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Create book summary
    let bookSummary;
    try {
      bookSummary = await BookSummary.create({
        patronId: patron._id,
        patronBarcode,
        patronName: `${patron.firstname} ${patron.surname}`,
        bookId: book._id,
        bookTitle: book.title.mainTitle,
        bookBarcode,
        summary,
        rating,
        status: 'pending',
      });
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

    // Update monthly activity
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    await MonthlyActivity.findOneAndUpdate(
      { patronId: patron._id, year, month },
      {
        $inc: { summariesSubmitted: 1 },
        $set: {
          patronBarcode,
          patronName: `${patron.firstname} ${patron.surname}`,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        status: true,
        message:
          'Book summary submitted successfully. It will be reviewed by staff.',
        data: {
          summaryId: bookSummary._id,
          bookTitle: bookSummary.bookTitle,
          status: bookSummary.status,
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
