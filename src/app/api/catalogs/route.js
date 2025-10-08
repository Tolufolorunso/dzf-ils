import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { revalidatePath } from 'next/cache';
import { dbConnect } from '@/lib/dbConnect';
import Catalog from '@/models/CatalogingModel';
import { redirect } from 'next/navigation';

export async function POST(request) {
  try {
    const body = await request.json();

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
    } = body;

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
      .filter(([_, v]) => !v || !v.trim())
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

    // 🧠 Normalize and prepare data
    const parsedIndexTermGenre =
      typeof indexTermGenre === 'string'
        ? indexTermGenre
            .split(',')
            .map((term) => term.trim())
            .filter(Boolean)
        : Array.isArray(indexTermGenre)
        ? indexTermGenre
        : [];

    const catalogData = {
      ISBN: ISBN?.trim() || '',
      classification: classification.trim(),
      informationSummary: informationSummary?.trim() || '',
      language: language.trim(),
      physicalDescription: physicalDescription?.trim() || '',
      holdingsInformation: holdingsInformation?.trim() || '',
      library: library.trim(),
      barcode: barcode.trim(),
      controlNumber: controlNumber.trim(),
      title: { mainTitle: title.trim(), subtitle: subtitle?.trim() || '' },
      author: {
        mainAuthor: mainAuthor.trim(),
        additionalAuthors: additionalAuthors?.trim() || '',
      },
      publicationInfo: {
        publisher: publisher.trim(),
        place: place.trim(),
        year: year.trim(),
      },
      indexTermGenre: parsedIndexTermGenre,
    };

    // 💾 Create new catalog record
    const newCatalog = await Catalog.create(catalogData);
    revalidatePath('/dashboard/catalogs');

    return NextResponse.json(
      {
        status: true,
        message: `Book added successfully ✅`,
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

export async function GET() {
  try {
    await dbConnect();

    // 🧠 Retrieve only useful fields for lightweight response
    const catalogs = await Catalog.find({})
      .select(
        'barcode author title classification controlNumber isCheckedOut library createdAt updatedAt'
      )
      .sort({ createdAt: -1 }); // newest first

    // 📦 Format data for frontend
    const formatted = catalogs.map((item) => ({
      barcode: item.barcode,
      title: item.title.mainTitle,
      subtitle: item.title.subtitle || '',
      author: item.author.mainAuthor,
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
        total: formatted.length,
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
