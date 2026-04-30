import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { revalidatePath } from 'next/cache';
import { dbConnect } from '@/lib/dbConnect';
import Catalog from '@/models/CatalogingModel';

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

const normalizePayload = (body) => {
  const normalized = {
    title: clean(body.title),
    subtitle: clean(body.subtitle),
    mainAuthor: clean(body.mainAuthor || body.author),
    additionalAuthors: body.additionalAuthors,
    publisher: clean(body.publisher),
    place: clean(body.place || body.location),
    year: clean(body.year || body.publicationYear),
    ISBN: clean(body.ISBN || body.isbn),
    barcode: clean(body.barcode || body.itemBarcode),
    classification: clean(body.classification),
    controlNumber: clean(body.controlNumber),
    indexTermGenre: body.indexTermGenre || body.subject || body.keywords,
    informationSummary: clean(body.informationSummary || body.description),
    language: clean(body.language),
    physicalDescription: clean(
      body.physicalDescription ||
        (body.numberOfPages ? `${body.numberOfPages} pages` : '')
    ),
    holdingsInformation: clean(body.holdingsInformation),
    library: clean(body.library || 'AAoJ'),
  };

  if (!normalized.controlNumber && normalized.barcode) {
    normalized.controlNumber = normalized.barcode;
  }

  return normalized;
};

export async function POST(request) {
  try {
    await dbConnect();

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          status: false,
          message: 'Invalid request body. Please send valid JSON.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        {
          status: false,
          message: 'Invalid request body. Please send a catalog object.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    let {
      title,
      subtitle,
      mainAuthor,
      additionalAuthors,
      publisher,
      place,
      year,
      ISBN,
      barcode,
      classification,
      controlNumber,
      indexTermGenre,
      informationSummary,
      language,
      physicalDescription,
      holdingsInformation,
      library,
    } = normalizePayload(body);

    // 🧩 Validate required fields
    const requiredFields = {
      title,
      mainAuthor,
      publisher,
      place,
      year,
      classification,
      controlNumber,
      language,
      barcode,
      library,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          status: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const parsedYear = Number(year);
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
      holdingsInformation === '' || holdingsInformation === undefined
        ? 0
        : Number(holdingsInformation);

    if (!Number.isInteger(parsedHoldings) || parsedHoldings < 0) {
      return NextResponse.json(
        {
          status: false,
          message: 'Holdings information must be zero or more',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const compactIsbn = ISBN ? String(ISBN).replace(/[-\s]/g, '') : '';
    if (compactIsbn && !/^(?:\d{9}[\dXx]|\d{13})$/.test(compactIsbn)) {
      return NextResponse.json(
        {
          status: false,
          message: 'ISBN must be 10 or 13 digits, or left blank',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // 🕵️‍♂️ Check for existing barcode or control number
    const duplicate = await Catalog.findOne({
      $or: [{ controlNumber }, { barcode }],
    });

    if (duplicate) {
      return NextResponse.json(
        {
          status: false,
          message: 'Barcode or Control Number already exists',
        },
        { status: StatusCodes.CONFLICT }
      );
    }

    const catalogData = {
      ISBN: ISBN || '',
      classification,
      informationSummary: informationSummary || '',
      language,
      physicalDescription: physicalDescription || '',
      holdingsInformation: parsedHoldings,
      library,
      barcode,
      controlNumber,
      title: { mainTitle: title, subtitle: subtitle || '' },
      author: {
        mainAuthor,
        additionalAuthors: normalizeList(additionalAuthors),
      },
      publicationInfo: {
        publisher,
        place,
        year: parsedYear,
      },
      indexTermGenre: normalizeList(indexTermGenre),
    };

    // 💾 Create new catalog record
    const newCatalog = await Catalog.create(catalogData);
    revalidatePath('/catalog');

    return NextResponse.json(
      {
        status: true,
        message: 'Book added successfully',
        catalog: {
          title: newCatalog.title.mainTitle,
          controlNumber: newCatalog.controlNumber,
          barcode: newCatalog.barcode,
        },
      },
      { status: StatusCodes.CREATED }
    );
  } catch (error) {
    console.error('Error creating catalog:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to create catalog item',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const requestedPage = parseInt(searchParams.get('page'), 10);
    const requestedLimit = parseInt(searchParams.get('limit'), 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 20;
    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery = {};

    // Filter by title
    if (searchParams.get('title')) {
      filterQuery['title.mainTitle'] = {
        $regex: searchParams.get('title'),
        $options: 'i',
      };
    }

    // Filter by subtitle
    if (searchParams.get('subtitle')) {
      filterQuery['title.subtitle'] = {
        $regex: searchParams.get('subtitle'),
        $options: 'i',
      };
    }

    // Filter by author
    if (searchParams.get('author')) {
      filterQuery['author.mainAuthor'] = {
        $regex: searchParams.get('author'),
        $options: 'i',
      };
    }

    // Filter by classification
    if (searchParams.get('classification')) {
      filterQuery.classification = {
        $regex: searchParams.get('classification'),
        $options: 'i',
      };
    }

    // Filter by control number
    if (searchParams.get('controlNumber')) {
      filterQuery.controlNumber = {
        $regex: searchParams.get('controlNumber'),
        $options: 'i',
      };
    }

    // Filter by barcode
    if (searchParams.get('itemBarcode')) {
      filterQuery.barcode = {
        $regex: searchParams.get('itemBarcode'),
        $options: 'i',
      };
    }

    // Get total count for pagination
    const totalCount = await Catalog.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalCount / limit);

    // 🧠 Retrieve filtered and paginated results
    const catalogs = await Catalog.find(filterQuery)
      .select(
        'barcode author title classification controlNumber isCheckedOut library createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 📦 Format data for frontend
    const formatted = catalogs.map((item) => ({
      barcode: item.barcode,
      title: item.title?.mainTitle || 'N/A',
      subtitle: item.title?.subtitle || '',
      author: item.author?.mainAuthor || 'N/A',
      classification: item.classification,
      controlNumber: item.controlNumber,
      isCheckedOut: item.isCheckedOut,
      library: item.library,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json(
      {
        status: true,
        message: 'Catalog items fetched successfully',
        total: totalCount,
        totalPages,
        currentPage: page,
        catalogs: formatted,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Error fetching catalogs:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch catalog items',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
