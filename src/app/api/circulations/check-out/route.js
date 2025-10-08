import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { cookies } from 'next/headers';
import { dbConnect } from '@/lib/dbConnect';
import Patron from '@/models/PatronModel';
import Catalog from '@/models/CatalogingModel';
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
    const { patronBarcode, itemBarcode, eventTitle, dueDay = 2 } = body;

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

    if (!catalog) {
      return NextResponse.json(
        { status: false, message: 'Item not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // 🚫 Validate patron eligibility
    if (patron.image_url && !patron.image_url.public_id) {
      return NextResponse.json(
        { status: false, message: 'You must upload a passport photograph' },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    if (patron.hasBorrowedBook) {
      return NextResponse.json(
        { status: false, message: 'Only one item can be borrowed at a time' },
        { status: StatusCodes.CONFLICT }
      );
    }

    // 🚫 Item availability check
    if (catalog.isCheckedOut) {
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
    catalog.isCheckedOut = true;
    await catalog.save();

    // 📗 Update patron checkout info (prevent duplicate records)
    const hasBorrowedBefore = patron.itemsCheckedOutHistory.some(
      (item) => item.itemBarcode === catalog.barcode
    );

    if (!hasBorrowedBefore) {
      patron.itemsCheckedOutHistory.push({
        itemId: catalog._id,
        checkoutDate: currentDate,
        dueDate,
        itemTitle: catalog.title.mainTitle,
        itemSubTitle: catalog.title.subtitle,
        itemBarcode: catalog.barcode,
        eventTitle,
        event: true,
      });
    }

    patron.hasBorrowedBook = true;
    await patron.save();

    // ✅ Return response
    return NextResponse.json(
      {
        status: true,
        message: 'Checkout successful 🎉',
        checkedOut: {
          title: catalog.title.mainTitle,
          itemBarcode: catalog.barcode,
          dueDate: dueDate.toDateString(),
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
