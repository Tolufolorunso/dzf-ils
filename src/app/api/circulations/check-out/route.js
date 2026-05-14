import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { cookies } from 'next/headers';
import { dbConnect } from '@/lib/dbConnect';
import Patron from '@/models/PatronModel';
import Catalog from '@/models/CatalogingModel';
import MonthlyActivity from '@/models/MonthlyActivityModel';
import { delay } from '@/lib/utils';
import { verifyAuth } from '@/lib/auth';

// POST /api/checkout
export async function POST(request) {
  try {
    await dbConnect();

    const authResult = await verifyAuth(request);

    if (!authResult.status) {
      await delay(300);
      return NextResponse.json(
        {
          status: false,
          message: authResult.message,
          logout: true,
        },
        { status: authResult.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const {
      patronBarcode: rawPatronBarcode,
      itemBarcode: rawItemBarcode,
      eventTitle,
      dueDay = 2,
    } = body;
    const patronBarcode = String(rawPatronBarcode || '').trim();
    const itemBarcode = String(rawItemBarcode || '').trim();

    if (!patronBarcode || !itemBarcode) {
      return NextResponse.json(
        { status: false, message: 'All fields are required' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // 🧭 Fetch patron and catalog item in parallel
    const [patron, catalog] = await Promise.all([
      Patron.findOne({ barcode: patronBarcode }),
      Catalog.findOne({ barcode: itemBarcode }),
    ]);

    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // Check if patron is active
    if (!patron.active) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Patron is inactive. Please contact the ICT department to reactivate your account before borrowing books.',
          code: 'PATRON_INACTIVE',
        },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    if (!catalog) {
      return NextResponse.json(
        { status: false, message: 'Item not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // 🚫 Validate patron eligibility
    if (!patron.image_url || !patron.image_url.public_id) {
      return NextResponse.json(
        {
          status: false,
          message:
            'You must upload a passport photograph before borrowing books',
        },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    // Check monthly borrowing limit (4 books per month)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthlyActivity = await MonthlyActivity.findOne({
      patronId: patron._id,
      year,
      month,
    });

    if (monthlyActivity && monthlyActivity.booksCheckedOut >= 4) {
      return NextResponse.json(
        {
          status: false,
          message: `You have reached the monthly limit of 4 book borrowings. You have borrowed ${monthlyActivity.booksCheckedOut} books this month. Please wait until next month to borrow more books.`,
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const hasActiveCheckout = await Catalog.exists({
      isCheckedOut: true,
      patronsCheckedOutHistory: {
        $elemMatch: {
          barcode: patron.barcode,
          returnedAt: null,
        },
      },
    });

    // Self-heal stale patron flag when no active loan exists for this patron.
    if (patron.hasBorrowedBook && !hasActiveCheckout) {
      patron.hasBorrowedBook = false;
      await patron.save();
    }

    if (patron.hasBorrowedBook) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only one item can be borrowed at a time. Please return your current book first.',
        },
        { status: StatusCodes.CONFLICT }
      );
    }

    // 🚫 Item availability check
    const activeCatalogLoan = [...(catalog.patronsCheckedOutHistory || [])]
      .reverse()
      .find((entry) => !entry.returnedAt);

    // Self-heal stale catalog flag when no active checkout exists in history.
    if (catalog.isCheckedOut && !activeCatalogLoan) {
      catalog.isCheckedOut = false;
      await catalog.save();
    }

    if (catalog.isCheckedOut || activeCatalogLoan) {
      return NextResponse.json(
        { status: false, message: 'Item is already checked out' },
        { status: StatusCodes.CONFLICT }
      );
    }

    // 🗓 Calculate dates properly
    const currentDate = new Date();
    const dueDate = new Date(currentDate);
    dueDate.setDate(currentDate.getDate() + Number(dueDay));

    // 📘 Update catalog checkout info
    catalog.patronsCheckedOutHistory.push({
      checkedOutBy: patron._id,
      checkedOutAt: currentDate,
      dueDate,
      fullname: `${patron.surname}, ${patron.firstname} ${
        patron.middlename || ''
      }`.trim(),
      contactNumber:
        patron.phoneNumber ||
        patron.parentInfo?.parentPhoneNumber ||
        'No Phone Number',
      barcode: patron.barcode,
    });
    catalog.lastBorrowedBy = {
      patronId: patron._id,
      patronBarcode: patron.barcode,
      patronName: `${patron.surname}, ${patron.firstname} ${
        patron.middlename || ''
      }`.trim(),
      checkedOutAt: currentDate,
      dueDate,
      returnedAt: null,
    };
    catalog.isCheckedOut = true;
    await catalog.save();

    // Record each checkout transaction, including repeat borrows of same item.
    patron.itemsCheckedOutHistory.push({
      itemId: catalog._id,
      checkoutDate: currentDate,
      dueDate,
      returnedAt: null,
      itemTitle: catalog.title.mainTitle,
      itemSubTitle: catalog.title.subtitle,
      itemBarcode: catalog.barcode,
      eventTitle,
      event: true,
    });

    patron.lastBorrowedItem = {
      itemId: catalog._id,
      itemTitle: catalog.title.mainTitle,
      itemSubTitle: catalog.title.subtitle,
      itemBarcode: catalog.barcode,
      checkoutDate: currentDate,
      dueDate,
      returnedAt: null,
    };

    patron.hasBorrowedBook = true;
    await patron.save();

    // 📊 Update monthly activity and award points
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const checkoutPoints = 10; // Fixed 10 points for borrowing books

    // Award points to patron
    await Patron.findByIdAndUpdate(patron._id, {
      $inc: { points: checkoutPoints },
    });

    await MonthlyActivity.findOneAndUpdate(
      { patronId: patron._id, year: currentYear, month: currentMonth },
      {
        $inc: {
          booksCheckedOut: 1,
          totalPoints: checkoutPoints,
        },
        $set: {
          patronBarcode: patron.barcode,
          patronName: `${patron.firstname} ${patron.surname}`,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    // ✅ Return response
    return NextResponse.json(
      {
        status: true,
        message: 'Checkout successful 🎉',
        checkedOut: {
          title: catalog.title.mainTitle,
          itemBarcode: catalog.barcode,
          dueDate: dueDate.toDateString(),
          patronName: `${patron.surname}, ${patron.firstname} ${
            patron.middlename || ''
          }`.trim(),
          patronBarcode: patron.barcode,
          patronImage: patron.image_url?.secure_url,
        },
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Something went wrong during checkout',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
