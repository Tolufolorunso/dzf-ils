import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { revalidatePath } from 'next/cache';
import { dbConnect } from '@/lib/dbConnect';
import Catalog from '@/models/CatalogingModel';
import { verifyAuth } from '@/lib/auth';

const currentYear = new Date().getFullYear();

const clean = (value) => {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value;
};

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(clean)
      .filter(Boolean);
  }

  return [];
};

// GET single catalog item by barcode
export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { barcode: encodedBarcode } = await params;

    if (!encodedBarcode) {
      return NextResponse.json(
        { status: false, message: 'Missing barcode' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const barcode = decodeURIComponent(encodedBarcode);
    const catalogItem = await Catalog.findOne({ barcode }).select('-__v');

    if (!catalogItem) {
      return NextResponse.json(
        { status: false, message: 'Catalog item not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    return NextResponse.json(
      {
        status: true,
        data: catalogItem,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Error fetching catalog item:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to retrieve catalog item',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// PATCH update catalog item
export async function PATCH(req, { params }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    const { barcode: encodedBarcode } = await params;
    let body;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          status: false,
          message: 'Invalid request body. Please send valid JSON.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    if (!encodedBarcode) {
      return NextResponse.json(
        { status: false, message: 'Missing barcode' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const barcode = decodeURIComponent(encodedBarcode);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        {
          status: false,
          message: 'Invalid request body. Please send a catalog object.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Extract and validate fields
    const {
      title,
      subtitle,
      mainAuthor,
      additionalAuthors,
      publisher,
      place,
      year,
      ISBN,
      classification,
      controlNumber,
      indexTermGenre,
      informationSummary,
      language,
      physicalDescription,
      holdingsInformation,
      library,
    } = body;

    const normalized = {
      title: clean(title),
      subtitle: clean(subtitle),
      mainAuthor: clean(mainAuthor),
      additionalAuthors,
      publisher: clean(publisher),
      place: clean(place),
      year: clean(year),
      ISBN: clean(ISBN),
      classification: clean(classification),
      controlNumber: clean(controlNumber),
      indexTermGenre,
      informationSummary: clean(informationSummary),
      language: clean(language),
      physicalDescription: clean(physicalDescription),
      holdingsInformation: clean(holdingsInformation),
      library: clean(library),
    };

    const requiredFields = {
      title: normalized.title,
      mainAuthor: normalized.mainAuthor,
      publisher: normalized.publisher,
      place: normalized.place,
      year: normalized.year,
      classification: normalized.classification,
      controlNumber: normalized.controlNumber,
      language: normalized.language,
      library: normalized.library,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          status: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const parsedYear = Number(normalized.year);
    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1000 ||
      parsedYear > currentYear + 1
    ) {
      return NextResponse.json(
        {
          status: false,
          message: `Year must be a valid number between 1000 and ${
            currentYear + 1
          }`,
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const parsedHoldings =
      normalized.holdingsInformation === ''
        ? 0
        : Number(normalized.holdingsInformation);

    if (!Number.isInteger(parsedHoldings) || parsedHoldings < 0) {
      return NextResponse.json(
        {
          status: false,
          message: 'Holdings information must be zero or more',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const compactIsbn = normalized.ISBN
      ? String(normalized.ISBN).replace(/[-\s]/g, '')
      : '';
    if (compactIsbn && !/^(?:\d{9}[\dXx]|\d{13})$/.test(compactIsbn)) {
      return NextResponse.json(
        {
          status: false,
          message: 'ISBN must be 10 or 13 digits, or left blank',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const duplicateControlNumber = await Catalog.findOne({
      barcode: { $ne: barcode },
      controlNumber: normalized.controlNumber,
    });

    if (duplicateControlNumber) {
      return NextResponse.json(
        {
          status: false,
          message: 'Control Number already exists',
        },
        { status: StatusCodes.CONFLICT }
      );
    }

    // Build update object
    const updateData = {
      ISBN: normalized.ISBN || '',
      classification: normalized.classification,
      controlNumber: normalized.controlNumber,
      informationSummary: normalized.informationSummary || '',
      language: normalized.language,
      physicalDescription: normalized.physicalDescription || '',
      holdingsInformation: parsedHoldings,
      library: normalized.library,
      'title.mainTitle': normalized.title,
      'title.subtitle': normalized.subtitle || '',
      'author.mainAuthor': normalized.mainAuthor,
      'author.additionalAuthors': normalizeList(normalized.additionalAuthors),
      'publicationInfo.publisher': normalized.publisher,
      'publicationInfo.place': normalized.place,
      'publicationInfo.year': parsedYear,
      indexTermGenre: normalizeList(normalized.indexTermGenre),
    };

    const updatedItem = await Catalog.findOneAndUpdate(
      { barcode },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedItem) {
      return NextResponse.json(
        { status: false, message: 'Catalog item not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    revalidatePath('/catalog');
    revalidatePath(`/catalog/${encodeURIComponent(updatedItem.barcode)}`);

    return NextResponse.json(
      {
        status: true,
        message: 'Catalog item updated successfully',
        data: updatedItem,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Error updating catalog item:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to update catalog item',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// DELETE catalog item
export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    const { barcode: encodedBarcode } = await params;

    if (!encodedBarcode) {
      return NextResponse.json(
        { status: false, message: 'Missing barcode' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const barcode = decodeURIComponent(encodedBarcode);
    // Check if item is currently checked out
    const catalogItem = await Catalog.findOne({ barcode });

    if (!catalogItem) {
      return NextResponse.json(
        { status: false, message: 'Catalog item not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    if (catalogItem.isCheckedOut) {
      return NextResponse.json(
        {
          status: false,
          message: 'Cannot delete item that is currently checked out',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    await Catalog.findOneAndDelete({ barcode });

    return NextResponse.json(
      {
        status: true,
        message: 'Catalog item deleted successfully',
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Error deleting catalog item:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to delete catalog item',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
