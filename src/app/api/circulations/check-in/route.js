import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import Patron from '@/models/PatronModel';
import Catalog from '@/models/CatalogingModel';
import MonthlyActivity from '@/models/MonthlyActivityModel';
import { delay } from '@/lib/utils';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    await delay(200);

    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        {
          status: false,
          message: auth.message,
          logout: true,
        },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    const { patronBarcode, itemBarcode } = await request.json();

    if (!patronBarcode || !itemBarcode) {
      return NextResponse.json(
        {
          status: false,
          message: 'Patron barcode and item barcode are required',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const point = 15;

    const [patron, catalogItem] = await Promise.all([
      Patron.findOne({ barcode: patronBarcode }),
      Catalog.findOne({ barcode: itemBarcode }),
    ]);

    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    if (!catalogItem) {
      return NextResponse.json(
        { status: false, message: 'Item not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    const lastCheckout = catalogItem.patronsCheckedOutHistory?.at(-1);
    const hasUnreturnedHistory =
      lastCheckout?.barcode === patron.barcode && !lastCheckout?.returnedAt;

    if (!catalogItem.isCheckedOut && hasUnreturnedHistory) {
      catalogItem.isCheckedOut = true;
    }

    if (!catalogItem.isCheckedOut) {
      return NextResponse.json(
        { status: false, message: 'Item is not checked out' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    catalogItem.isCheckedOut = false;

    if (lastCheckout && !lastCheckout.returnedAt) {
      lastCheckout.returnedAt = new Date();
    }
    if (catalogItem.lastBorrowedBy && !catalogItem.lastBorrowedBy.returnedAt) {
      catalogItem.lastBorrowedBy.returnedAt = new Date();
    }

    await catalogItem.save();

    // Update patron's history with returnedAt
    const patronHistoryIndex = patron.itemsCheckedOutHistory.findIndex(
      (item) => item.itemBarcode === itemBarcode && !item.returnedAt
    );
    if (patronHistoryIndex !== -1) {
      patron.itemsCheckedOutHistory[patronHistoryIndex].returnedAt = new Date();
    }

    patron.hasBorrowedBook = false;
    const borrowedHistoryIndex = [...(patron.itemsCheckedOutHistory || [])]
      .reverse()
      .findIndex(
        (entry) => entry.itemBarcode === catalogItem.barcode && !entry.returnedAt
      );
    if (borrowedHistoryIndex !== -1) {
      const actualIndex =
        patron.itemsCheckedOutHistory.length - 1 - borrowedHistoryIndex;
      patron.itemsCheckedOutHistory[actualIndex].returnedAt = new Date();
    }
    if (
      patron.lastBorrowedItem?.itemBarcode === catalogItem.barcode &&
      !patron.lastBorrowedItem?.returnedAt
    ) {
      patron.lastBorrowedItem.returnedAt = new Date();
    }

    if (point && Number(point) > 0) {
      patron.points = (patron.points || 0) + Number(point);
    }

    patron.event.push({
      eventTitle: 'Book Check-in',
      points: Number(point) || 0,
      eventDate: new Date(),
    });

    await patron.save();

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    await MonthlyActivity.findOneAndUpdate(
      { patronId: patron._id, year, month },
      {
        $inc: {
          booksReturned: 1,
          pointsFromBooks: Number(point) || 0,
          totalPoints: Number(point) || 0,
        },
        $set: {
          patronBarcode: patron.barcode,
          patronName: `${patron.firstname} ${patron.surname}`,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        status: true,
        message: 'Check-in successful',
        data: {
          patron: `${patron.surname}, ${patron.firstname}`,
          item: catalogItem.title.mainTitle,
          pointsAwarded: Number(point) || 0,
        },
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Something went wrong during check-in',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
