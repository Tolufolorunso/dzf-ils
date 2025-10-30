import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Attendance from '@/models/AttendanceModel';
import Patron from '@/models/PatronModel';
import MonthlyActivity from '@/models/MonthlyActivityModel';

// Mark attendance
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    const body = await request.json();
    const {
      patronBarcode,
      classType = 'literacy',
      className,
      classDate,
      points = 5,
      notes = '',
    } = body;

    if (!patronBarcode || !className || !classDate) {
      return NextResponse.json(
        {
          status: false,
          message: 'Patron barcode, class name, and class date are required.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Find patron
    const patron = await Patron.findOne({
      barcode: patronBarcode,
      is18: { $ne: true },
    });
    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // Check if patron is active
    if (!patron.active) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Patron is inactive. Please contact the ICT department to reactivate your account before marking attendance.',
          code: 'PATRON_INACTIVE',
        },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    // Check if attendance already marked for this class
    const existingAttendance = await Attendance.findOne({
      patronBarcode,
      className,
      classDate: new Date(classDate),
    });

    if (existingAttendance) {
      return NextResponse.json(
        { status: false, message: 'Attendance already marked for this class.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Create attendance record
    const attendance = await Attendance.create({
      patronId: patron._id,
      patronBarcode,
      patronName: `${patron.firstname} ${patron.surname}`,
      classType,
      className,
      classDate: new Date(classDate),
      markedBy: auth.user.name || auth.user.email,
      points,
      notes,
    });

    // Update patron points
    await Patron.findByIdAndUpdate(patron._id, {
      $inc: { points: points },
    });

    // Update monthly activity
    const date = new Date(classDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    await MonthlyActivity.findOneAndUpdate(
      { patronId: patron._id, year, month },
      {
        $inc: {
          classesAttended: 1,
          pointsFromAttendance: points,
          totalPoints: points,
        },
        $set: {
          patronBarcode,
          patronName: `${patron.firstname} ${patron.surname}`,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        status: true,
        message: 'Attendance marked successfully.',
        data: {
          attendanceId: attendance._id,
          patronName: attendance.patronName,
          className: attendance.className,
          points: attendance.points,
        },
      },
      { status: StatusCodes.CREATED }
    );
  } catch (error) {
    console.error('Attendance marking error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to mark attendance.',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// Get attendance records
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const patronBarcode = searchParams.get('patronBarcode');
    const classType = searchParams.get('classType');

    let query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.classDate = { $gte: startDate, $lt: endDate };
    }

    if (patronBarcode) {
      query.patronBarcode = patronBarcode;
    }

    if (classType) {
      query.classType = classType;
    }

    const attendanceRecords = await Attendance.find(query)
      .sort({ classDate: -1, attendanceTime: -1 })
      .limit(100);

    return NextResponse.json(
      {
        status: true,
        message: 'Attendance records fetched successfully.',
        data: attendanceRecords,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch attendance records.',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
