import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import MonthlyActivity from '@/models/MonthlyActivityModel';
import Patron from '@/models/PatronModel';

// Get monthly analytics and leaderboard
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
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const month =
      parseInt(searchParams.get('month')) || new Date().getMonth() + 1;

    // Get monthly activities for the specified month
    const monthlyActivities = await MonthlyActivity.find({ year, month })
      .sort({ activityScore: -1, totalPoints: -1 })
      .limit(100);

    // Calculate activity scores and update ranks
    for (let i = 0; i < monthlyActivities.length; i++) {
      const activity = monthlyActivities[i];

      // Calculate activity score based on various factors
      const activityScore =
        activity.booksCheckedOut * 10 +
        activity.booksReturned * 15 +
        activity.classesAttended * 20 +
        activity.summariesApproved * 25 +
        activity.totalPoints * 1;

      // Update the activity record with new score and rank
      await MonthlyActivity.findByIdAndUpdate(activity._id, {
        activityScore,
        rank: i + 1,
      });

      monthlyActivities[i].activityScore = activityScore;
      monthlyActivities[i].rank = i + 1;
    }

    // Get top performers
    const topPerformers = monthlyActivities.slice(0, 10);

    // Get inactive patrons (no activity this month)
    const allPatrons = await Patron.find({
      is18: { $ne: true },
      active: true,
    }).select('firstname surname barcode patronType');

    const activePatronIds = monthlyActivities.map((activity) =>
      activity.patronId.toString()
    );
    const inactivePatrons = allPatrons.filter(
      (patron) => !activePatronIds.includes(patron._id.toString())
    );

    // Get monthly statistics
    const stats = {
      totalActivePatrons: monthlyActivities.length,
      totalInactivePatrons: inactivePatrons.length,
      totalBooksCheckedOut: monthlyActivities.reduce(
        (sum, a) => sum + a.booksCheckedOut,
        0
      ),
      totalClassesAttended: monthlyActivities.reduce(
        (sum, a) => sum + a.classesAttended,
        0
      ),
      totalSummariesSubmitted: monthlyActivities.reduce(
        (sum, a) => sum + a.summariesSubmitted,
        0
      ),
      totalPointsAwarded: monthlyActivities.reduce(
        (sum, a) => sum + a.totalPoints,
        0
      ),
      averageActivityScore:
        monthlyActivities.length > 0
          ? monthlyActivities.reduce((sum, a) => sum + a.activityScore, 0) /
            monthlyActivities.length
          : 0,
    };

    return NextResponse.json(
      {
        status: true,
        message: 'Monthly analytics fetched successfully.',
        data: {
          year,
          month,
          stats,
          leaderboard: topPerformers,
          inactivePatrons: inactivePatrons.slice(0, 20), // Limit to 20
          allActivities: monthlyActivities,
        },
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Monthly analytics error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch monthly analytics.',
        error: error.message,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
