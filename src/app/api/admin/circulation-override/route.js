import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Patron from '@/models/PatronModel';
import Catalog from '@/models/CatalogingModel';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request) {
  try {
    await dbConnect();

    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message, logout: true },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    if (!['admin', 'asst_admin', 'ict'].includes(auth.user.role)) {
      return NextResponse.json(
        {
          status: false,
          message: 'Only admin, assistant admin, or ICT can run circulation overrides.',
        },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    const body = await request.json();
    const patronBarcode = cleanText(body.patronBarcode);
    const itemBarcode = cleanText(body.itemBarcode);

    if (!patronBarcode || !itemBarcode) {
      return NextResponse.json(
        {
          status: false,
          message: 'Patron barcode and item barcode are required.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const [patron, catalogItem] = await Promise.all([
      Patron.findOne({ barcode: patronBarcode }),
      Catalog.findOne({ barcode: itemBarcode }),
    ]);

    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    if (!catalogItem) {
      return NextResponse.json(
        { status: false, message: 'Catalog item not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    const nextHasBorrowedBook = !patron.hasBorrowedBook;

    patron.hasBorrowedBook = nextHasBorrowedBook;
    catalogItem.isCheckedOut = nextHasBorrowedBook;

    const lastCheckout = catalogItem.patronsCheckedOutHistory?.at(-1);
    if (lastCheckout) {
      if (nextHasBorrowedBook && lastCheckout.returnedAt) {
        lastCheckout.returnedAt = null;
        const patronHistoryIndex = patron.itemsCheckedOutHistory.findIndex(
          (item) => item.itemBarcode === itemBarcode && item.returnedAt
        );
        if (patronHistoryIndex !== -1) {
          patron.itemsCheckedOutHistory[patronHistoryIndex].returnedAt = undefined;
        }
      }

      if (!nextHasBorrowedBook && !lastCheckout.returnedAt) {
        lastCheckout.returnedAt = new Date();
        const patronHistoryIndex = patron.itemsCheckedOutHistory.findIndex(
          (item) => item.itemBarcode === itemBarcode && !item.returnedAt
        );
        if (patronHistoryIndex !== -1) {
          patron.itemsCheckedOutHistory[patronHistoryIndex].returnedAt = new Date();
        }
      }
    }

    if (!catalogItem.lastBorrowedBy) {
      catalogItem.lastBorrowedBy = {};
    }
    catalogItem.lastBorrowedBy.patronId = patron._id;
    catalogItem.lastBorrowedBy.patronBarcode = patron.barcode;
    catalogItem.lastBorrowedBy.patronName =
      `${patron.surname}, ${patron.firstname}`.trim();
    catalogItem.lastBorrowedBy.returnedAt = nextHasBorrowedBook
      ? null
      : new Date();

    if (!patron.lastBorrowedItem) {
      patron.lastBorrowedItem = {};
    }
    patron.lastBorrowedItem.itemId = catalogItem._id;
    patron.lastBorrowedItem.itemTitle = catalogItem.title?.mainTitle || '';
    patron.lastBorrowedItem.itemSubTitle = catalogItem.title?.subtitle || '';
    patron.lastBorrowedItem.itemBarcode = catalogItem.barcode;
    patron.lastBorrowedItem.returnedAt = nextHasBorrowedBook
      ? null
      : new Date();

    await Promise.all([patron.save(), catalogItem.save()]);

    return NextResponse.json(
      {
        status: true,
        message: nextHasBorrowedBook
          ? 'Override complete: patron and item now marked as checked out.'
          : 'Override complete: patron and item now marked as checked in.',
        data: {
          patronBarcode: patron.barcode,
          itemBarcode: catalogItem.barcode,
          hasBorrowedBook: patron.hasBorrowedBook,
          isCheckedOut: catalogItem.isCheckedOut,
        },
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Circulation override error:', error);

    return NextResponse.json(
      {
        status: false,
        message: 'Failed to run circulation override.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
