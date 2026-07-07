import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import Cohort from '@/models/CohortModel';
import Patron from '@/models/PatronModel';

export async function GET(request) {
  try {
    await dbConnect();

    // 1. Total number of students from all cohorts (active and non-removed)
    const totalCohortStudents = await Cohort.countDocuments({
      active: { $ne: false },
      isRemoved: { $ne: true },
    });

    // 2. Total number of students registered (patrons of type student)
    const totalStudentsRegistered = await Patron.countDocuments({
      patronType: 'student',
    });

    // 3. Total number of Teachers
    const totalTeachers = await Patron.countDocuments({
      patronType: 'teacher',
    });

    // 4. Total number of teacher's schools (unique non-empty schools)
    const teacherSchools = await Patron.distinct('employerInfo.schoolName', {
      patronType: 'teacher',
      'employerInfo.schoolName': { $ne: null, $exists: true },
    });
    const uniqueTeacherSchools = Array.from(
      new Set(
        teacherSchools
          .map((school) => school?.trim())
          .filter(Boolean)
      )
    );
    const totalTeachersSchools = uniqueTeacherSchools.length;

    // 5. Total number of patron's schools (unique schools across all student and teacher/employer patrons)
    // First: schools of student patrons
    const studentSchools = await Patron.distinct('studentSchoolInfo.schoolName', {
      patronType: 'student',
      'studentSchoolInfo.schoolName': { $ne: null, $exists: true },
    });
    
    // Second: schools of teachers/staff (employerInfo.schoolName)
    const employerSchools = await Patron.distinct('employerInfo.schoolName', {
      'employerInfo.schoolName': { $ne: null, $exists: true },
    });

    const uniqueStudentSchools = studentSchools
      .map((school) => school?.trim())
      .filter(Boolean);

    const uniqueEmployerSchools = employerSchools
      .map((school) => school?.trim())
      .filter(Boolean);

    const allSchoolsSet = new Set([...uniqueStudentSchools, ...uniqueEmployerSchools]);
    const totalPatronsSchools = allSchoolsSet.size;

    // Return the response with CORS headers
    return NextResponse.json(
      {
        status: true,
        data: {
          totalCohortStudents,
          totalStudentsRegistered,
          totalTeachers,
          totalTeachersSchools,
          totalPatronsSchools,
        },
      },
      {
        status: StatusCodes.OK,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch statistics.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: StatusCodes.NO_CONTENT,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
