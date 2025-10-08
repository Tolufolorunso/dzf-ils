import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { v2 as cloudinary } from 'cloudinary';
import { dbConnect } from '@/lib/dbConnect';
import PatronModel from '@/models/PatronModel';

// ☁️ Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📸 Upload patron photo
export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode }
      );
    }

    await dbConnect();

    const { barcode, photoData } = await req.json();

    if (!barcode || !photoData) {
      return NextResponse.json(
        { status: false, message: 'Missing barcode or image data.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const patron = await PatronModel.findOne({ barcode }).select(
      'firstname surname patronType barcode image_url'
    );

    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // Upload image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(photoData, {
      folder: 'library_patrons',
      public_id: `${patron.patronType}_${patron.firstname}_${patron.barcode}`,
      overwrite: true,
      invalidate: true,
    });

    // Update patron record
    patron.image_url = {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
    await patron.save();

    return NextResponse.json(
      {
        status: true,
        message: 'Image uploaded successfully.',
        data: {
          barcode: patron.barcode,
          name: `${patron.firstname} ${patron.surname}`,
          imageUrl: uploadResult.secure_url,
        },
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { status: false, message: 'Image upload failed.' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
