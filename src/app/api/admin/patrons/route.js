import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Patron from '@/models/PatronModel';
import Catalog from '@/models/CatalogingModel';

const ADMIN_ROLES = ['admin', 'asst_admin', 'ict'];

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function canManage(role) {
  return ADMIN_ROLES.includes(role);
}

function setIfString(target, key, value, { lowercase = false } = {}) {
  if (typeof value === 'string') {
    const next = cleanText(value);
    target[key] = lowercase ? next.toLowerCase() : next;
  }
}

export async function GET(request) {
  try {
    await dbConnect();

    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message, logout: true },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED },
      );
    }

    if (!canManage(auth.user.role)) {
      return NextResponse.json(
        { status: false, message: 'Access denied.' },
        { status: StatusCodes.FORBIDDEN },
      );
    }

    const { searchParams } = new URL(request.url);
    const barcode = cleanText(searchParams.get('barcode'));
    const search = cleanText(searchParams.get('search')).toLowerCase();

    if (barcode) {
      const patron = await Patron.findOne({ barcode }).lean();
      if (!patron) {
        return NextResponse.json(
          { status: false, message: 'Patron not found.' },
          { status: StatusCodes.NOT_FOUND },
        );
      }

      const activeCheckout = await Catalog.findOne({
        isCheckedOut: true,
        patronsCheckedOutHistory: {
          $elemMatch: { barcode, returnedAt: { $in: [null, undefined] } },
        },
      })
        .select('barcode title patronsCheckedOutHistory')
        .lean();

      return NextResponse.json(
        { status: true, data: { ...patron, activeCheckout } },
        { status: StatusCodes.OK },
      );
    }

    const patrons = await Patron.find({ is18: { $ne: true } })
      .select('firstname surname barcode patronType active hasBorrowedBook points lastBorrowedItem')
      .sort({ updatedAt: -1 })
      .lean();

    const filtered = search
      ? patrons.filter((patron) =>
          [patron.firstname, patron.surname, patron.barcode]
            .filter(Boolean)
            .some((entry) => entry.toLowerCase().includes(search)),
        )
      : patrons;

    return NextResponse.json({ status: true, data: filtered }, { status: StatusCodes.OK });
  } catch (error) {
    console.error('Admin patron GET error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch admin patron data.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();

    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message, logout: true },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED },
      );
    }

    if (!canManage(auth.user.role)) {
      return NextResponse.json(
        { status: false, message: 'Access denied.' },
        { status: StatusCodes.FORBIDDEN },
      );
    }

    const body = await request.json();
    const barcode = cleanText(body.barcode);
    if (!barcode) {
      return NextResponse.json(
        { status: false, message: 'Patron barcode is required.' },
        { status: StatusCodes.BAD_REQUEST },
      );
    }

    const patron = await Patron.findOne({ barcode });
    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found.' },
        { status: StatusCodes.NOT_FOUND },
      );
    }

    setIfString(patron, 'firstname', body.firstname);
    setIfString(patron, 'surname', body.surname);
    setIfString(patron, 'middlename', body.middlename);
    setIfString(patron, 'email', body.email, { lowercase: true });
    setIfString(patron, 'phoneNumber', body.phoneNumber);
    setIfString(patron, 'barcode', body.newBarcode || body.barcode);
    setIfString(patron, 'library', body.library);
    setIfString(patron, 'registeredBy', body.registeredBy);

    if (['male', 'female'].includes(body.gender)) patron.gender = body.gender;
    if (['student', 'teacher', 'staff', 'guest'].includes(body.patronType)) patron.patronType = body.patronType;
    if (typeof body.active === 'boolean') patron.active = body.active;
    if (typeof body.hasBorrowedBook === 'boolean') patron.hasBorrowedBook = body.hasBorrowedBook;
    if (typeof body.isPatronExpiry === 'boolean') patron.isPatronExpiry = body.isPatronExpiry;
    if (typeof body.is18 === 'boolean') patron.is18 = body.is18;
    if (typeof body.points === 'number' && Number.isFinite(body.points)) patron.points = body.points;

    if (body.dateOfBirth) patron.dateOfBirth = new Date(body.dateOfBirth);
    if (body.patronExpiryDate) patron.patronExpiryDate = new Date(body.patronExpiryDate);

    patron.address = patron.address || {};
    setIfString(patron.address, 'street', body.address?.street);
    setIfString(patron.address, 'city', body.address?.city);
    setIfString(patron.address, 'state', body.address?.state);
    setIfString(patron.address, 'country', body.address?.country);

    patron.studentSchoolInfo = patron.studentSchoolInfo || {};
    setIfString(patron.studentSchoolInfo, 'schoolName', body.studentSchoolInfo?.schoolName);
    setIfString(patron.studentSchoolInfo, 'schoolAdress', body.studentSchoolInfo?.schoolAdress);
    setIfString(patron.studentSchoolInfo, 'headOfSchool', body.studentSchoolInfo?.headOfSchool);
    setIfString(patron.studentSchoolInfo, 'currentClass', body.studentSchoolInfo?.currentClass);
    setIfString(patron.studentSchoolInfo, 'schoolEmail', body.studentSchoolInfo?.schoolEmail);
    setIfString(patron.studentSchoolInfo, 'schoolPhoneNumber', body.studentSchoolInfo?.schoolPhoneNumber);

    patron.parentInfo = patron.parentInfo || {};
    setIfString(patron.parentInfo, 'parentName', body.parentInfo?.parentName);
    setIfString(patron.parentInfo, 'parentAddress', body.parentInfo?.parentAddress);
    setIfString(patron.parentInfo, 'parentPhoneNumber', body.parentInfo?.parentPhoneNumber);
    setIfString(patron.parentInfo, 'relationshipToPatron', body.parentInfo?.relationshipToPatron);
    setIfString(patron.parentInfo, 'parentEmail', body.parentInfo?.parentEmail, { lowercase: true });

    patron.employerInfo = patron.employerInfo || {};
    setIfString(patron.employerInfo, 'employerName', body.employerInfo?.employerName);
    setIfString(patron.employerInfo, 'schoolName', body.employerInfo?.schoolName);
    setIfString(patron.employerInfo, 'schoolAdress', body.employerInfo?.schoolAdress);
    setIfString(patron.employerInfo, 'headOfSchool', body.employerInfo?.headOfSchool);
    setIfString(patron.employerInfo, 'schoolEmail', body.employerInfo?.schoolEmail, { lowercase: true });
    setIfString(patron.employerInfo, 'schoolPhoneNumber', body.employerInfo?.schoolPhoneNumber);

    if (Array.isArray(body.messagePreferences)) {
      patron.messagePreferences = body.messagePreferences.map((entry) => cleanText(entry)).filter(Boolean);
    } else if (typeof body.messagePreferences === 'string') {
      patron.messagePreferences = body.messagePreferences.split(',').map((entry) => cleanText(entry)).filter(Boolean);
    }

    await patron.save();

    if (typeof body.hasBorrowedBook === 'boolean' && body.itemBarcode) {
      const catalog = await Catalog.findOne({ barcode: cleanText(body.itemBarcode) });
      if (catalog) {
        catalog.isCheckedOut = body.hasBorrowedBook;
        await catalog.save();
      }
    }

    return NextResponse.json(
      { status: true, message: 'Patron record updated successfully.', data: patron },
      { status: StatusCodes.OK },
    );
  } catch (error) {
    console.error('Admin patron PATCH error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to update patron.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
    );
  }
}
