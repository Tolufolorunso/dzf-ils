import { verifyAuth } from '@/lib/auth';
import { dbConnect } from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import Patron from '@/models/PatronModel';
import Cataloging from '@/models/CatalogingModel';

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.status) {
      return NextResponse.json(
        { status: false, message: 'Not authenticated' },
        { status: StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    // Get current date for overdue calculations
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // 1. Total Borrowed (items currently checked out)
    const totalBorrowed = await Cataloging.countDocuments({
      isCheckedOut: true,
    });

    // 2. Total Overdues (items with due date past current date)
    // We need to check the latest checkout entry in the array
    const overdueItems = await Cataloging.aggregate([
      { $match: { isCheckedOut: true } },
      {
        $addFields: {
          latestCheckout: { $arrayElemAt: ['$checkedOutHistory', -1] },
        },
      },
      {
        $match: {
          'latestCheckout.dueDate': { $exists: true, $lt: currentDate },
        },
      },
    ]);
    const totalOverdues = overdueItems.length;

    // 3. Overdue Over a Month (items overdue for more than 30 days)
    const overdueOverMonth = await Cataloging.aggregate([
      { $match: { isCheckedOut: true } },
      {
        $addFields: {
          latestCheckout: { $arrayElemAt: ['$checkedOutHistory', -1] },
        },
      },
      {
        $match: {
          'latestCheckout.dueDate': { $exists: true, $lt: oneMonthAgo },
        },
      },
    ]);
    const overdueOverMonthCount = overdueOverMonth.length;

    // Debug info - let's see what we have in the database
    const sampleCheckedOutItems = await Cataloging.find({ isCheckedOut: true })
      .limit(3)
      .select('title.mainTitle checkedOutHistory isCheckedOut');

    console.log(
      'Debug - Sample checked out items:',
      JSON.stringify(sampleCheckedOutItems, null, 2)
    );
    console.log('Debug - Current date:', currentDate);
    console.log('Debug - One month ago:', oneMonthAgo);
    console.log('Debug - Total borrowed:', totalBorrowed);
    console.log('Debug - Total overdues:', totalOverdues);
    console.log('Debug - Overdue over month:', overdueOverMonthCount);

    // 4. Total Students (with gender breakdown)
    const studentStats = await Patron.aggregate([
      { $match: { patronType: 'student', is18: { $ne: true } } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalStudents = await Patron.countDocuments({
      patronType: 'student',
      is18: { $ne: true },
    });

    const maleStudents = studentStats.find((s) => s._id === 'male')?.count || 0;
    const femaleStudents =
      studentStats.find((s) => s._id === 'female')?.count || 0;

    // 5. Total Staff
    const totalStaff = await Patron.countDocuments({
      patronType: 'staff',
      is18: { $ne: true },
    });

    // 6. Total Guests
    const totalGuests = await Patron.countDocuments({
      patronType: 'guest',
      is18: { $ne: true },
    });

    // 7. Total Teachers
    const totalTeachers = await Patron.countDocuments({
      patronType: 'teacher',
      is18: { $ne: true },
    });

    // 8. Active patrons (active: true)
    const activePatrons = await Patron.countDocuments({
      active: true,
      is18: { $ne: true },
    });

    // Prepare response data
    const dashboardStats = {
      circulation: {
        totalBorrowed,
        totalOverdues,
        overdueOverMonth: overdueOverMonthCount,
      },
      patrons: {
        totalStudents: {
          total: totalStudents,
          male: maleStudents,
          female: femaleStudents,
        },
        totalStaff,
        totalGuests,
        totalTeachers,
        activePatrons,
      },
      summary: {
        totalPatrons: totalStudents + totalStaff + totalGuests + totalTeachers,
        totalItems: await Cataloging.countDocuments(),
        totalBorrowed,
        activePatrons,
      },
    };

    return NextResponse.json(
      {
        status: true,
        message: 'Dashboard statistics fetched successfully',
        data: dashboardStats,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
