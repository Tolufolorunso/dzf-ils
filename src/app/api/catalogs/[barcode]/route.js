import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import Catalog from '@/models/CatalogingModel';
import { verifyAuth } from '@/lib/auth';

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
    const body = await req.json();

    if (!encodedBarcode) {
      return NextResponse.json(
        { status: false, message: 'Missing barcode' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const barcode = decodeURIComponent(encodedBarcode);

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
      indexTermGenre,
      informationSummary,
      language,
      physicalDescription,
      holdingsInformation,
      library,
    } = body;

    // Build update object
    const updateData = {};

    if (title) updateData['title.mainTitle'] = title.trim();
    if (subtitle !== undefined) updateData['title.subtitle'] = subtitle.trim();
    if (mainAuthor) updateData['author.mainAuthor'] = mainAuthor.trim();
    if (additionalAuthors !== undefined) {
      updateData['author.additionalAuthors'] = Array.isArray(additionalAuthors)
        ? additionalAuthors
        : additionalAuthors
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean);
    }
    if (publisher) updateData['publicationInfo.publisher'] = publisher.trim();
    if (place) updateData['publicationInfo.place'] = place.trim();
    if (year) updateData['publicationInfo.year'] = parseInt(year);
    if (ISBN !== undefined) updateData.ISBN = ISBN.trim();
    if (classification) updateData.classification = classification.trim();
    if (indexTermGenre !== undefined) {
      updateData.indexTermGenre = Array.isArray(indexTermGenre)
        ? indexTermGenre
        : indexTermGenre
            .split(',')
            .map((term) => term.trim())
            .filter(Boolean);
    }
    if (informationSummary !== undefined)
      updateData.informationSummary = informationSummary.trim();
    if (language) updateData.language = language.trim();
    if (physicalDescription !== undefined)
      updateData.physicalDescription = physicalDescription.trim();
    if (holdingsInformation !== undefined)
      updateData.holdingsInformation = parseInt(holdingsInformation) || 0;
    if (library) updateData.library = library.trim();

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
