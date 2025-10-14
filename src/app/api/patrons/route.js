import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import Patron from '@/models/PatronModel';
import { verifyAuth } from '@/lib/auth';
import { delay } from '@/lib/utils';

// Generate unique barcode
function generateBarcode(count) {
  const year = new Date().getFullYear();
  return `${year}${String(count + 1).padStart(4, '0')}`;
}

// Calculate expiry date
function calculateExpiryDate(years = 2) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return date;
}

// ✅ Create Patron
export async function POST(request) {
  try {
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

    await dbConnect();

    const body = await request.json();
    const {
      firstname,
      surname,
      middlename,
      email,
      phoneNumber,
      gender,
      patronType = 'student',
      street,
      city,
      state,
      country,
      employerName,
      schoolAdress,
      headOfSchool,
      schoolEmail,
      schoolPhoneNumber,
      currentClass,
      schoolName,
      otherSchool,
      parentName,
      parentAddress,
      parentPhoneNumber,
      relationshipToPatron,
      parentEmail,
      messagePreferences = ['email'],
    } = body;

    if (!firstname || !surname) {
      return NextResponse.json(
        { status: false, message: 'Firstname and surname are required.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Step 4: Derive values
    const finalSchoolName = schoolName === 'others' ? otherSchool : schoolName;
    const expiryDate =
      patronType === 'staff' ? calculateExpiryDate(5) : calculateExpiryDate(2);

    // Step 5: Build patron object
    let patronData = {
      firstname,
      surname,
      middlename,
      email,
      phoneNumber,
      gender,
      patronType,
      address: { street, city, state, country },
      messagePreferences: Array.isArray(messagePreferences)
        ? messagePreferences
        : messagePreferences.split(',').map((x) => x.trim()),
      patronExpiryDate: expiryDate,
      registeredBy: auth.user.name || auth.user.email || 'Admin',
    };

    if (patronType === 'student') {
      patronData.studentSchoolInfo = {
        schoolName: finalSchoolName,
        schoolAdress,
        headOfSchool,
        currentClass,
        schoolEmail,
        schoolPhoneNumber,
      };
      patronData.parentInfo = {
        parentName,
        parentAddress,
        parentPhoneNumber,
        relationshipToPatron,
        parentEmail,
      };
    } else if (patronType === 'teacher' || patronType === 'staff') {
      patronData.employerInfo = {
        employerName,
        schoolName: finalSchoolName,
        schoolAdress,
        headOfSchool,
        schoolEmail,
        schoolPhoneNumber,
      };
    }

    // Step 6: Barcode
    const count = await Patron.countDocuments();
    patronData.barcode = generateBarcode(count);

    // Step 7: Save to DB
    const newPatron = await Patron.create(patronData);
    // await delay(300);

    return NextResponse.json(
      {
        status: true,
        message: 'Patron created successfully.',
        data: {
          barcode: newPatron.barcode,
          name: `${newPatron.firstname} ${newPatron.surname}`,
          type: newPatron.patronType,
        },
      },
      { status: StatusCodes.CREATED }
    );
  } catch (error) {
    console.error('Patron creation error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to create patron.',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// ✅ Fetch all patrons
export async function GET(req) {
  try {
    // const auth = await verifyAuth(req)

    // if (!auth.status) {
    //   return NextResponse.json(
    //     { status: false, message: auth.message },
    //     { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
    //   )
    // }

    // ✅ Fetch patrons excluding those marked as is18 = true
    const patrons = await Patron.find({ is18: { $ne: true } })
      .select('surname barcode patronType points image_url')
      .lean();

    return NextResponse.json(
      {
        status: true,
        message: 'Patron list fetched successfully.',
        data: patrons,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Error fetching patrons:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch patrons.',
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// edit a patron
export async function PATCH(req) {
  try {
    const auth = await verifyAuth(req);

    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();
    const patronData = await req.json();
    const { patronId, ...updateFields } = patronData;

    if (!patronId) {
      return NextResponse.json(
        { status: false, message: 'Missing patron ID.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // 🧩 Only allow updatable fields (avoid accidental overwrite)
    const allowedFields = [
      'firstname',
      'surname',
      'middlename',
      'email',
      'phoneNumber',
      'gender',
      'street',
      'city',
      'state',
      'country',
      'schoolName',
      'currentClass',
      'parentName',
      'parentPhoneNumber',
      'parentEmail',
      'relationshipToPatron',
      'messagePreferences',
      'currentClass',
    ];

    const filteredUpdates = Object.keys(updateFields)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateFields[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { status: false, message: 'No valid fields to update.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const updatedPatron = await Patron.findByIdAndUpdate(
      patronId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedPatron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: 'Patron updated successfully.',
        data: updatedPatron,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Error updating patron:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to update patron.',
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
