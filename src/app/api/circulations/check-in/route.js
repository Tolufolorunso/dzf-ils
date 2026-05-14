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

    const body = await request.json();
    const patronBarcode = String(body.patronBarcode || '').trim();
    const itemBarcode = String(body.itemBarcode || '').trim();

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

    const activeHistoryForItem = [...(catalogItem.patronsCheckedOutHistory || [])]
      .reverse()
      .find((entry) => !entry.returnedAt);
    const activeHistoryForPatron = [...(catalogItem.patronsCheckedOutHistory || [])]
      .reverse()
      .find((entry) => entry.barcode === patron.barcode && !entry.returnedAt);

    if (!catalogItem.isCheckedOut && activeHistoryForItem) {
      catalogItem.isCheckedOut = true;
    }

    if (!catalogItem.isCheckedOut && !activeHistoryForItem) {
      return NextResponse.json(
        { status: false, message: 'Item is not checked out' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    if (!activeHistoryForPatron) {
      if (activeHistoryForItem && activeHistoryForItem.barcode !== patron.barcode) {
        return NextResponse.json(
          {
            status: false,
            message: `This item is currently checked out to another patron (${activeHistoryForItem.barcode}).`,
          },
          { status: StatusCodes.CONFLICT }
        );
      }

      return NextResponse.json(
        {
          status: false,
          message: 'No active checkout record found for this patron and item.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const returnTimestamp = new Date();

    if (!activeHistoryForPatron.returnedAt) {
      activeHistoryForPatron.returnedAt = returnTimestamp;
    }
    if (
      catalogItem.lastBorrowedBy &&
      catalogItem.lastBorrowedBy.patronBarcode === patron.barcode &&
      !catalogItem.lastBorrowedBy.returnedAt
    ) {
      catalogItem.lastBorrowedBy.returnedAt = returnTimestamp;
    }

    catalogItem.isCheckedOut = false;

    await catalogItem.save();

    // Update patron's history with returnedAt
    const patronHistoryIndex = [...(patron.itemsCheckedOutHistory || [])]
      .reverse()
      .findIndex((item) => item.itemBarcode === itemBarcode && !item.returnedAt);
    if (patronHistoryIndex !== -1) {
      const actualIndex = patron.itemsCheckedOutHistory.length - 1 - patronHistoryIndex;
      patron.itemsCheckedOutHistory[actualIndex].returnedAt = returnTimestamp;
    }

    const patronStillHasActiveCheckout = await Catalog.exists({
      isCheckedOut: true,
      patronsCheckedOutHistory: {
        $elemMatch: {
          barcode: patron.barcode,
          returnedAt: null,
        },
      },
    });
    patron.hasBorrowedBook = Boolean(patronStillHasActiveCheckout);

    if (
      patron.lastBorrowedItem?.itemBarcode === catalogItem.barcode &&
      !patron.lastBorrowedItem?.returnedAt
    ) {
      patron.lastBorrowedItem.returnedAt = returnTimestamp;
    }

    if (point && Number(point) > 0) {
      patron.points = (patron.points || 0) + Number(point);
    }

    patron.event.push({
      eventTitle: 'Book Check-in',
      points: Number(point) || 0,
      eventDate: returnTimestamp,
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
