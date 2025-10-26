import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import Patron from '@/models/PatronModel';
import Catalog from '@/models/CatalogingModel';
import MonthlyActivity from '@/models/MonthlyActivityModel';
import { delay } from '@/lib/utils';

export async function POST(request) {
  try {
    await dbConnect();
    await delay(200); // ⏳ Optional small delay for UX

    const { patronBarcode, itemBarcode, point } = await request.json();

    if (!patronBarcode || !itemBarcode || point === undefined) {
      return NextResponse.json(
        { status: false, message: 'All fields are required' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // 🧭 Fetch patron and catalog item concurrently
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

    // 🚫 Check if the item is currently checked out
    if (!catalogItem.isCheckedOut) {
      return NextResponse.json(
        { status: false, message: 'Item is not checked out' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // 🗓 Mark item as returned
    catalogItem.isCheckedOut = false;

    // Update latest checkout record’s return date (if needed)
    const lastCheckout = catalogItem.patronsCheckedOutHistory?.at(-1);
    if (lastCheckout && !lastCheckout.returnedAt) {
      lastCheckout.returnedAt = new Date();
    }

    await catalogItem.save();

    // 🧾 Update patron’s borrowing state
    patron.hasBorrowedBook = false;

    // Add a return record or update points
    if (point && Number(point) > 0) {
      patron.points = (patron.points || 0) + Number(point);
    }

    // Optional: track event record for reading competition or reward
    patron.event.push({
      eventTitle: 'Book Check-in',
      points: Number(point) || 0,
      eventDate: new Date(),
    });

    await patron.save();

    // 📊 Update monthly activity for book return
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
        message: 'Check-in successful ✅',
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
