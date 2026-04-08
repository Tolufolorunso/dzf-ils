import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Cohort from '@/models/CohortModel';
import CohortGroup from '@/models/CohortGroupModel';
import {
  DEFAULT_COHORT_TYPES,
  cleanText,
  isDefaultCohortType,
  normalizeCohortType,
} from '@/lib/cohort-utils';

const ALLOWED_COHORT_ROLES = ['ict', 'admin', 'asst_admin', 'ima'];

function getStaffName(user) {
  return user?.name?.trim() || user?.username?.trim() || 'Staff';
}

function hasCohortAccess(user) {
  return ALLOWED_COHORT_ROLES.includes(user?.role);
}

function getCohortTypeValue(value) {
  return cleanText(value);
}

function buildFullName(student) {
  return `${student.surname}, ${student.firstname} ${student.middlename || ''}`.trim();
}

function getLastAttendanceDate(attendance = []) {
  if (!Array.isArray(attendance) || attendance.length === 0) {
    return null;
  }

  return attendance.reduce((latest, entry) => {
    const entryTime = entry?.date ? new Date(entry.date).getTime() : 0;
    const latestTime = latest ? new Date(latest).getTime() : 0;
    return entryTime > latestTime ? entry.date : latest;
  }, null);
}

async function ensureDefaultCohortGroups(staffName = 'System') {
  await Promise.all(
    DEFAULT_COHORT_TYPES.map((cohortType, index) =>
      CohortGroup.findOneAndUpdate(
        { cohortType },
        {
          $setOnInsert: {
            displayName: cohortType,
            description: '',
            createdBy: staffName,
            order: index + 1,
          },
          $set: {
            active: true,
            updatedBy: staffName,
          },
        },
        { upsert: true, new: true }
      )
    )
  );
}

async function prepareCohortData(staffName = 'System') {
  await ensureDefaultCohortGroups(staffName);
}

async function cohortTypeExists(cohortType) {
  const rawCohortType = getCohortTypeValue(cohortType);

  if (!rawCohortType) {
    return false;
  }

  const [group, student] = await Promise.all([
    CohortGroup.findOne({ cohortType: rawCohortType, active: true }).lean(),
    Cohort.findOne({
      cohortType: rawCohortType,
      active: { $ne: false },
    }).lean(),
  ]);

  return Boolean(group || student);
}

async function buildCohortPayload(selectedCohortType = 'all') {
  const selectedType =
    selectedCohortType === 'all' ? 'all' : getCohortTypeValue(selectedCohortType) || 'all';

  const [groups, activeStudents, totalStudents] = await Promise.all([
    CohortGroup.find({ active: true })
      .sort({ order: 1, cohortType: 1 })
      .lean(),
    Cohort.find({ active: { $ne: false } })
      .sort({ cohortType: 1, surname: 1, firstname: 1 })
      .lean(),
    Cohort.countDocuments({ active: { $ne: false } }),
  ]);

  const cohortCountMap = new Map();
  let totalAttendanceEntries = 0;

  activeStudents.forEach((student) => {
    const cohortType = getCohortTypeValue(student.cohortType) || 'unassigned';
    cohortCountMap.set(cohortType, (cohortCountMap.get(cohortType) || 0) + 1);
    totalAttendanceEntries += Array.isArray(student.attendance)
      ? student.attendance.length
      : 0;
  });

  const groupMap = new Map(
    groups.map((group) => [getCohortTypeValue(group.cohortType), group])
  );

  cohortCountMap.forEach((studentCount, cohortType) => {
    if (!groupMap.has(cohortType)) {
      groupMap.set(cohortType, {
        cohortType,
        displayName: cohortType,
        description: '',
        order: 100,
        active: true,
      });
    }
  });

  const filters = Array.from(groupMap.values())
    .filter((group) => getCohortTypeValue(group.cohortType))
    .sort((left, right) => {
      return (
        Number(left.order || 100) - Number(right.order || 100) ||
        getCohortTypeValue(left.cohortType).localeCompare(
          getCohortTypeValue(right.cohortType)
        )
      );
    })
    .map((group) => {
      const cohortType = getCohortTypeValue(group.cohortType);
      return {
        cohortType,
        displayName: group.displayName || cohortType,
        description: group.description || '',
        studentCount: cohortCountMap.get(cohortType) || 0,
        isDefault: isDefaultCohortType(cohortType),
        normalizedSuggestion: normalizeCohortType(cohortType),
      };
    });

  const selectedStudents =
    selectedType === 'all'
      ? activeStudents
      : activeStudents.filter(
          (student) => getCohortTypeValue(student.cohortType) === selectedType
        );

  const students = selectedStudents.map((student) => ({
    id: student._id.toString(),
    barcode: student.barcode,
    firstname: student.firstname,
    surname: student.surname,
    middlename: student.middlename || '',
    fullName: buildFullName(student),
    cohortType: getCohortTypeValue(student.cohortType),
    normalizedSuggestion: normalizeCohortType(student.cohortType),
    attendanceCount: Array.isArray(student.attendance)
      ? student.attendance.length
      : 0,
    lastAttendanceDate: getLastAttendanceDate(student.attendance),
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  }));

  const breakdown = filters.map((filter) => ({
    cohortType: filter.cohortType,
    displayName: filter.displayName,
    description: filter.description,
    studentCount: filter.studentCount,
    isDefault: filter.isDefault,
    normalizedSuggestion: filter.normalizedSuggestion,
  }));

  const largestCohort = breakdown.reduce(
    (largest, current) =>
      !largest || current.studentCount > largest.studentCount ? current : largest,
    null
  );

  return {
    filters: {
      selectedCohortType: selectedType,
      options: [
        {
          cohortType: 'all',
          displayName: 'All Cohorts',
          description: 'View every cohort member',
          studentCount: totalStudents,
          isDefault: false,
        },
        ...breakdown,
      ],
    },
    students,
    cohorts: breakdown,
    allCohortTypes: breakdown.map((item) => ({
      cohortType: item.cohortType,
      normalizedSuggestion: item.normalizedSuggestion,
    })),
    stats: {
      totalStudents,
      displayedStudents: students.length,
      totalCohorts: breakdown.length,
      cohortsWithStudents: breakdown.filter((item) => item.studentCount > 0).length,
      emptyCohorts: breakdown.filter((item) => item.studentCount === 0).length,
      totalAttendanceEntries,
      largestCohort,
    },
  };
}

async function handleCreateCohort(body, user) {
  const cohortType = getCohortTypeValue(body.cohortType);
  const description = cleanText(body.description);
  const staffName = getStaffName(user);

  if (!cohortType) {
    return NextResponse.json(
      { status: false, message: 'Cohort type is required.' },
      { status: StatusCodes.BAD_REQUEST }
    );
  }

  const existingGroup = await CohortGroup.findOne({ cohortType });

  if (existingGroup?.active) {
    return NextResponse.json(
      { status: false, message: 'That cohort already exists.' },
      { status: StatusCodes.CONFLICT }
    );
  }

  if (existingGroup) {
    existingGroup.active = true;
    existingGroup.description = description || existingGroup.description;
    existingGroup.displayName = cohortType;
    existingGroup.updatedBy = staffName;
    await existingGroup.save();

    return NextResponse.json(
      {
        status: true,
        message: 'Cohort restored successfully.',
        data: {
          cohortType: existingGroup.cohortType,
          displayName: existingGroup.displayName,
        },
      },
      { status: StatusCodes.OK }
    );
  }

  const group = await CohortGroup.create({
    cohortType,
    displayName: cohortType,
    description,
    createdBy: staffName,
    updatedBy: staffName,
    order: DEFAULT_COHORT_TYPES.includes(cohortType)
      ? DEFAULT_COHORT_TYPES.indexOf(cohortType) + 1
      : 100,
  });

  return NextResponse.json(
    {
      status: true,
      message: 'Cohort created successfully.',
      data: {
        cohortType: group.cohortType,
        displayName: group.displayName,
      },
    },
    { status: StatusCodes.CREATED }
  );
}

async function handleAddStudent(body) {
  const barcode = cleanText(body.barcode);
  const firstname = cleanText(body.firstname);
  const surname = cleanText(body.surname);
  const middlename = cleanText(body.middlename);
  const cohortType = getCohortTypeValue(body.cohortType);

  if (!barcode || !firstname || !surname || !cohortType) {
    return NextResponse.json(
      {
        status: false,
        message: 'Barcode, firstname, surname, and cohort type are required.',
      },
      { status: StatusCodes.BAD_REQUEST }
    );
  }

  const exists = await cohortTypeExists(cohortType);

  if (!exists) {
    return NextResponse.json(
      {
        status: false,
        message: 'Create the cohort first before adding students to it.',
      },
      { status: StatusCodes.BAD_REQUEST }
    );
  }

  const existingStudent = await Cohort.findOne({ barcode });

  if (existingStudent?.active) {
    return NextResponse.json(
      {
        status: false,
        message: 'A cohort student with that barcode already exists.',
      },
      { status: StatusCodes.CONFLICT }
    );
  }

  if (existingStudent) {
    existingStudent.firstname = firstname;
    existingStudent.surname = surname;
    existingStudent.middlename = middlename;
    existingStudent.cohortType = cohortType;
    existingStudent.active = true;
    existingStudent.removedAt = null;
    await existingStudent.save();

    return NextResponse.json(
      {
        status: true,
        message: 'Student restored and added to cohort successfully.',
        data: {
          barcode: existingStudent.barcode,
          fullName: buildFullName(existingStudent),
          cohortType: existingStudent.cohortType,
        },
      },
      { status: StatusCodes.OK }
    );
  }

  const student = await Cohort.create({
    barcode,
    firstname,
    surname,
    middlename,
    cohortType,
    active: true,
  });

  return NextResponse.json(
    {
      status: true,
      message: 'Student added to cohort successfully.',
      data: {
        barcode: student.barcode,
        fullName: buildFullName(student),
        cohortType: student.cohortType,
      },
    },
    { status: StatusCodes.CREATED }
  );
}

async function handleMoveStudent(body) {
  const barcode = cleanText(body.barcode);
  const cohortType = getCohortTypeValue(body.cohortType);

  if (!barcode || !cohortType) {
    return NextResponse.json(
      {
        status: false,
        message: 'Student barcode and target cohort are required.',
      },
      { status: StatusCodes.BAD_REQUEST }
    );
  }

  const exists = await cohortTypeExists(cohortType);
  if (!exists) {
    return NextResponse.json(
      { status: false, message: 'Target cohort does not exist.' },
      { status: StatusCodes.BAD_REQUEST }
    );
  }

  const student = await Cohort.findOne({ barcode, active: { $ne: false } });

  if (!student) {
    return NextResponse.json(
      { status: false, message: 'Active cohort student not found.' },
      { status: StatusCodes.NOT_FOUND }
    );
  }

  student.cohortType = cohortType;
  await student.save();

  return NextResponse.json(
    {
      status: true,
      message: 'Student cohort updated successfully.',
      data: {
        barcode: student.barcode,
        fullName: buildFullName(student),
        cohortType: student.cohortType,
      },
    },
    { status: StatusCodes.OK }
  );
}

async function handleRenameCohort(body, user) {
  const currentCohortType = getCohortTypeValue(body.currentCohortType);
  const newCohortType = getCohortTypeValue(body.newCohortType);
  const description = cleanText(body.description);
  const staffName = getStaffName(user);

  if (!currentCohortType || !newCohortType) {
    return NextResponse.json(
      {
        status: false,
        message: 'Current cohort type and new cohort type are required.',
      },
      { status: StatusCodes.BAD_REQUEST }
    );
  }

  const [currentGroup, targetGroup, affectedStudents] = await Promise.all([
    CohortGroup.collection.findOne({ cohortType: currentCohortType }),
    currentCohortType === newCohortType
      ? CohortGroup.collection.findOne({ cohortType: currentCohortType })
      : CohortGroup.collection.findOne({ cohortType: newCohortType }),
    Cohort.collection.countDocuments({ cohortType: currentCohortType }),
  ]);

  if (!currentGroup && affectedStudents === 0) {
    return NextResponse.json(
      { status: false, message: 'Current cohort type was not found.' },
      { status: StatusCodes.NOT_FOUND }
    );
  }

  if (currentCohortType !== newCohortType) {
    await Cohort.collection.updateMany(
      { cohortType: currentCohortType },
      { $set: { cohortType: newCohortType } }
    );
  }

  if (currentGroup) {
    if (
      targetGroup &&
      currentGroup._id.toString() !== targetGroup._id.toString()
    ) {
      await CohortGroup.collection.updateOne(
        { _id: targetGroup._id },
        {
          $set: {
            description: description || targetGroup.description || '',
            updatedBy: staffName,
            active: true,
            updatedAt: new Date(),
          },
        }
      );
      await CohortGroup.collection.deleteOne({ _id: currentGroup._id });
    } else {
      await CohortGroup.collection.updateOne(
        { _id: currentGroup._id },
        {
          $set: {
            cohortType: newCohortType,
            displayName: newCohortType,
            description: description || currentGroup.description || '',
            updatedBy: staffName,
            active: true,
            updatedAt: new Date(),
          },
        }
      );
    }
  } else if (!targetGroup) {
    await CohortGroup.collection.insertOne({
      cohortType: newCohortType,
      displayName: newCohortType,
      description,
      createdBy: staffName,
      updatedBy: staffName,
      active: true,
      order: DEFAULT_COHORT_TYPES.includes(newCohortType)
        ? DEFAULT_COHORT_TYPES.indexOf(newCohortType) + 1
        : 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return NextResponse.json(
    {
      status: true,
      message: 'Cohort type renamed successfully.',
      data: {
        previousCohortType: currentCohortType,
        cohortType: newCohortType,
        affectedStudents,
      },
    },
    { status: StatusCodes.OK }
  );
}

async function handleRemoveStudent(body) {
  const barcode = cleanText(body.barcode);

  if (!barcode) {
    return NextResponse.json(
      { status: false, message: 'Student barcode is required.' },
      { status: StatusCodes.BAD_REQUEST }
    );
  }

  const student = await Cohort.findOne({ barcode, active: { $ne: false } });

  if (!student) {
    return NextResponse.json(
      { status: false, message: 'Active cohort student not found.' },
      { status: StatusCodes.NOT_FOUND }
    );
  }

  student.active = false;
  student.removedAt = new Date();
  await student.save();

  return NextResponse.json(
    {
      status: true,
      message: 'Student removed from cohort successfully.',
      data: {
        barcode: student.barcode,
        fullName: buildFullName(student),
      },
    },
    { status: StatusCodes.OK }
  );
}

export async function GET(request) {
  try {
    await dbConnect();

    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message, logout: true },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    if (!hasCohortAccess(auth.user)) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only ICT, admin, assistant admin, and IMA staff can view cohorts.',
        },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    await prepareCohortData(getStaffName(auth.user));

    const { searchParams } = new URL(request.url);
    const cohortType = searchParams.get('cohortType') || 'all';
    const data = await buildCohortPayload(cohortType);

    return NextResponse.json(
      {
        status: true,
        message: 'Cohort data fetched successfully.',
        data,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Cohort fetch error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch cohort data.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message, logout: true },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    if (!hasCohortAccess(auth.user)) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only ICT, admin, assistant admin, and IMA staff can manage cohorts.',
        },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    await prepareCohortData(getStaffName(auth.user));

    const body = await request.json();
    const action = cleanText(body.action).toLowerCase();

    if (action === 'createcohort') {
      return handleCreateCohort(body, auth.user);
    }

    if (action === 'addstudent') {
      return handleAddStudent(body);
    }

    return NextResponse.json(
      {
        status: false,
        message: 'Invalid action. Use createcohort or addstudent.',
      },
      { status: StatusCodes.BAD_REQUEST }
    );
  } catch (error) {
    console.error('Cohort create error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to process cohort request.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
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
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    if (!hasCohortAccess(auth.user)) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only ICT, admin, assistant admin, and IMA staff can manage cohorts.',
        },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    await prepareCohortData(getStaffName(auth.user));

    const body = await request.json();
    const action = cleanText(body.action).toLowerCase();

    if (action === 'movestudent') {
      return handleMoveStudent(body);
    }

    if (action === 'renamecohort') {
      return handleRenameCohort(body, auth.user);
    }

    return NextResponse.json(
      {
        status: false,
        message: 'Invalid action. Use movestudent or renamecohort.',
      },
      { status: StatusCodes.BAD_REQUEST }
    );
  } catch (error) {
    console.error('Cohort update error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to update cohort data.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();

    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message, logout: true },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    if (!hasCohortAccess(auth.user)) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only ICT, admin, assistant admin, and IMA staff can manage cohorts.',
        },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    await prepareCohortData(getStaffName(auth.user));

    const body = await request.json();
    return handleRemoveStudent(body);
  } catch (error) {
    console.error('Cohort delete error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to remove student from cohort.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
