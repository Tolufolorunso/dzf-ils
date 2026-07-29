import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Cohort from '@/models/CohortModel';
import CohortGroup from '@/models/CohortGroupModel';
import Patron from '@/models/PatronModel';
import { syncCohortsToSpreadsheet } from '@/lib/googleSheets';
import {
  DEFAULT_COHORT_TYPES,
  cleanText,
  isDefaultCohortType,
  normalizeCohortType,
} from '@/lib/cohort-utils';

const ALLOWED_COHORT_ROLES = ['ict', 'admin', 'asst_admin', 'ima'];
let hasEnsuredCohortIndexes = false;

function getStaffName(user) {
  return user?.name?.trim() || user?.username?.trim() || 'Staff';
}

function hasCohortAccess(user) {
  return ALLOWED_COHORT_ROLES.includes(user?.role);
}

function getCohortTypeValue(value) {
  return cleanText(value);
}

function getBooleanValue(value) {
  return value === true || value === 'true' || value === 'on' || value === 1;
}

function buildFullName(student) {
  return `${student.surname}, ${student.firstname} ${student.middlename || ''}`.trim();
}

function isRemovedStudent(student) {
  return Boolean(student?.isRemoved || student?.active === false);
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
            active: true,
            createdBy: staffName,
            order: index + 1,
          },
          $set: {
            updatedBy: staffName,
          },
        },
        { upsert: true, new: true },
      ),
    ),
  );
}

async function prepareCohortData(staffName = 'System') {
  if (!hasEnsuredCohortIndexes) {
    try {
      await Cohort.collection.dropIndex('barcode_1');
    } catch (error) {
      const ignorableErrors = [
        'index not found',
        'ns not found',
        'IndexNotFound',
      ];
      const message = String(error?.message || '');
      const shouldIgnore = ignorableErrors.some((text) =>
        message.toLowerCase().includes(text.toLowerCase()),
      );
      if (!shouldIgnore) {
        throw error;
      }
    }

    await Cohort.syncIndexes();
    hasEnsuredCohortIndexes = true;
  }

  await ensureDefaultCohortGroups(staffName);
}

async function syncAllCohortsToSheets() {
  try {
    const [students, groups] = await Promise.all([
      Cohort.find({}).sort({ cohortType: 1, surname: 1, firstname: 1 }).lean(),
      CohortGroup.find({}).sort({ order: 1, cohortType: 1 }).lean(),
    ]);

    return await syncCohortsToSpreadsheet(students, groups);
  } catch (error) {
    console.error('Google Sheets cohort sync error:', error);
    return {
      skipped: true,
      error: error.message,
    };
  }
}

async function saveStudentAndSync(student) {
  await student.save();
  return syncAllCohortsToSheets();
}

async function cohortTypeExists(cohortType) {
  const rawCohortType = getCohortTypeValue(cohortType);

  if (!rawCohortType) {
    return false;
  }

  const [group, student] = await Promise.all([
    CohortGroup.findOne({ cohortType: rawCohortType }).lean(),
    Cohort.findOne({
      cohortType: rawCohortType,
      active: { $ne: false },
      isRemoved: { $ne: true },
    }).lean(),
  ]);

  return Boolean(group || student);
}

async function buildCohortPayload(selectedCohortType = 'all') {
  const selectedType =
    selectedCohortType === 'all'
      ? 'all'
      : getCohortTypeValue(selectedCohortType) || 'all';

  const [groups, activeStudents, totalStudents] = await Promise.all([
    CohortGroup.find({}).sort({ order: 1, cohortType: 1 }).lean(),
    Cohort.find({ active: { $ne: false }, isRemoved: { $ne: true } })
      .sort({ cohortType: 1, surname: 1, firstname: 1 })
      .lean(),
    Cohort.countDocuments({ active: { $ne: false }, isRemoved: { $ne: true } }),
  ]);

  let totalAttendanceEntries = 0;
  activeStudents.forEach((student) => {
    totalAttendanceEntries += Array.isArray(student.attendance)
      ? student.attendance.length
      : 0;
  });

  const filters = groups
    .filter((group) => getCohortTypeValue(group.cohortType))
    .sort((left, right) => {
      return (
        Number(left.order || 100) - Number(right.order || 100) ||
        getCohortTypeValue(left.cohortType).localeCompare(
          getCohortTypeValue(right.cohortType),
        )
      );
    })
    .map((group) => {
      const cohortType = getCohortTypeValue(group.cohortType);
      const normGroupType = normalizeCohortType(cohortType) || cohortType.toLowerCase();
      const studentCount = activeStudents.filter((student) => {
        const rawStudentType = getCohortTypeValue(student.cohortType);
        const normStudentType = normalizeCohortType(rawStudentType) || rawStudentType.toLowerCase();
        return normStudentType === normGroupType;
      }).length;

      return {
        cohortType,
        displayName: group.displayName || cohortType,
        description: group.description || '',
        active: group.active !== false,
        studentCount,
        isDefault: isDefaultCohortType(cohortType),
        normalizedSuggestion: normalizeCohortType(cohortType),
      };
    });

  const normSelectedType =
    selectedType !== 'all'
      ? normalizeCohortType(selectedType) || selectedType.toLowerCase()
      : 'all';

  const selectedStudents =
    selectedType === 'all'
      ? activeStudents
      : activeStudents.filter((student) => {
          const rawStudentType = getCohortTypeValue(student.cohortType);
          const normStudentType = normalizeCohortType(rawStudentType) || rawStudentType.toLowerCase();
          return normStudentType === normSelectedType;
        });

  const barcodes = selectedStudents.map((s) => s.barcode).filter(Boolean);
  const patrons = await Patron.find({ barcode: { $in: barcodes } })
    .select('barcode image_url')
    .lean();

  const patronImageMap = new Map(
    patrons.map((p) => [
      p.barcode,
      p.image_url?.secure_url || (typeof p.image_url === 'string' ? p.image_url : ''),
    ])
  );

  const students = selectedStudents.map((student) => ({
    id: student._id.toString(),
    barcode: student.barcode,
    firstname: student.firstname,
    surname: student.surname,
    middlename: student.middlename || '',
    schoolClass: student.schoolClass || '',
    receivedCertificate: Boolean(student.receivedCertificate),
    isRemoved: isRemovedStudent(student),
    fullName: buildFullName(student),
    cohortType: getCohortTypeValue(student.cohortType),
    normalizedSuggestion: normalizeCohortType(student.cohortType),
    attendanceCount: Array.isArray(student.attendance)
      ? student.attendance.length
      : 0,
    lastAttendanceDate: getLastAttendanceDate(student.attendance),
    imageUrl: patronImageMap.get(student.barcode) || '',
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  }));

  const breakdown = filters.map((filter) => ({
    cohortType: filter.cohortType,
    displayName: filter.displayName,
    description: filter.description,
    active: filter.active,
    studentCount: filter.studentCount,
    isDefault: filter.isDefault,
    normalizedSuggestion: filter.normalizedSuggestion,
  }));

  const largestCohort = breakdown.reduce(
    (largest, current) =>
      !largest || current.studentCount > largest.studentCount
        ? current
        : largest,
    null,
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
      cohortsWithStudents: breakdown.filter((item) => item.studentCount > 0)
        .length,
      emptyCohorts: breakdown.filter((item) => item.studentCount === 0).length,
      totalAttendanceEntries,
      largestCohort,
    },
  };
}

async function handleCreateCohort(body, user) {
  const cohortType = getCohortTypeValue(body.cohortType);
  const description = cleanText(body.description);
  const active = body.active !== undefined ? getBooleanValue(body.active) : true;
  const staffName = getStaffName(user);

  if (!cohortType) {
    return NextResponse.json(
      { status: false, message: 'Cohort type is required.' },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const existingGroup = await CohortGroup.findOne({ cohortType });

  if (existingGroup) {
    existingGroup.active = active;
    existingGroup.description = description || existingGroup.description;
    existingGroup.displayName = cohortType;
    existingGroup.updatedBy = staffName;
    await existingGroup.save();
    const sheetsSync = await syncAllCohortsToSheets();

    return NextResponse.json(
      {
        status: true,
        message: 'Cohort updated and restored successfully.',
        data: {
          cohortType: existingGroup.cohortType,
          displayName: existingGroup.displayName,
          description: existingGroup.description,
          active: existingGroup.active,
          sheetsSync,
        },
      },
      { status: StatusCodes.OK },
    );
  }

  const group = await CohortGroup.create({
    cohortType,
    displayName: cohortType,
    description,
    active,
    createdBy: staffName,
    updatedBy: staffName,
    order: DEFAULT_COHORT_TYPES.includes(cohortType)
      ? DEFAULT_COHORT_TYPES.indexOf(cohortType) + 1
      : 100,
  });
  const sheetsSync = await syncAllCohortsToSheets();

  return NextResponse.json(
    {
      status: true,
      message: 'Cohort created successfully.',
      data: {
        cohortType: group.cohortType,
        displayName: group.displayName,
        description: group.description,
        active: group.active,
        sheetsSync,
      },
    },
    { status: StatusCodes.CREATED },
  );
}

async function handleAddStudent(body) {
  const barcode = cleanText(body.barcode);
  const firstname = cleanText(body.firstname);
  const surname = cleanText(body.surname);
  const middlename = cleanText(body.middlename);
  const schoolClass = cleanText(body.schoolClass);
  const receivedCertificate = getBooleanValue(body.receivedCertificate);
  const cohortType = getCohortTypeValue(body.cohortType);

  if (!barcode || !firstname || !surname || !cohortType) {
    return NextResponse.json(
      {
        status: false,
        message: 'Barcode, firstname, surname, and cohort type are required.',
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const existingStudent = await Cohort.findOne({ barcode, cohortType });

  if (existingStudent?.active && !existingStudent?.isRemoved) {
    return NextResponse.json(
      {
        status: false,
        message: 'This patron is already in the selected cohort.',
      },
      { status: StatusCodes.CONFLICT },
    );
  }

  if (existingStudent) {
    existingStudent.firstname = firstname;
    existingStudent.surname = surname;
    existingStudent.middlename = middlename;
    existingStudent.schoolClass = schoolClass;
    existingStudent.receivedCertificate = receivedCertificate;
    existingStudent.cohortType = cohortType;
    existingStudent.active = true;
    existingStudent.isRemoved = false;
    existingStudent.removedAt = null;
    const sheetsSync = await saveStudentAndSync(existingStudent);

    return NextResponse.json(
      {
        status: true,
        message: 'Student restored and added to cohort successfully.',
        data: {
          barcode: existingStudent.barcode,
          fullName: buildFullName(existingStudent),
          cohortType: existingStudent.cohortType,
          sheetsSync,
        },
      },
      { status: StatusCodes.OK },
    );
  }

  const student = await Cohort.create({
    barcode,
    firstname,
    surname,
    middlename,
    schoolClass,
    receivedCertificate,
    cohortType,
    active: true,
    isRemoved: false,
  });

  const sheetsSync = await syncAllCohortsToSheets();

  return NextResponse.json(
    {
      status: true,
      message: 'Student added to cohort successfully.',
      data: {
        barcode: student.barcode,
        fullName: buildFullName(student),
        cohortType: student.cohortType,
        sheetsSync,
      },
    },
    { status: StatusCodes.CREATED },
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
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const exists = await cohortTypeExists(cohortType);
  if (!exists) {
    return NextResponse.json(
      { status: false, message: 'Target cohort does not exist.' },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const student = await Cohort.findOne({
    barcode,
    active: { $ne: false },
    isRemoved: { $ne: true },
  });

  if (!student) {
    return NextResponse.json(
      { status: false, message: 'Active cohort student not found.' },
      { status: StatusCodes.NOT_FOUND },
    );
  }

  const duplicate = await Cohort.findOne({
    _id: { $ne: student._id },
    barcode,
    cohortType,
  });

  if (duplicate) {
    return NextResponse.json(
      {
        status: false,
        message: 'This barcode already exists in the target cohort.',
      },
      { status: StatusCodes.CONFLICT },
    );
  }

  student.cohortType = cohortType;
  const sheetsSync = await saveStudentAndSync(student);

  return NextResponse.json(
    {
      status: true,
      message: 'Student cohort updated successfully.',
      data: {
        barcode: student.barcode,
        fullName: buildFullName(student),
        cohortType: student.cohortType,
        sheetsSync,
      },
    },
    { status: StatusCodes.OK },
  );
}

async function handleUpdateStudent(body) {
  const id = cleanText(body.id);
  const originalBarcode = cleanText(body.originalBarcode);
  const barcode = cleanText(body.barcode);
  const firstname = cleanText(body.firstname);
  const surname = cleanText(body.surname);
  const middlename = cleanText(body.middlename);
  const schoolClass = cleanText(body.schoolClass);
  const receivedCertificate = getBooleanValue(body.receivedCertificate);
  const cohortType = getCohortTypeValue(body.cohortType);

  if (!barcode || !firstname || !surname || !cohortType) {
    return NextResponse.json(
      {
        status: false,
        message: 'Barcode, firstname, surname, and cohort type are required.',
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const student = id
    ? await Cohort.findById(id)
    : await Cohort.findOne({
        barcode: originalBarcode || barcode,
        active: { $ne: false },
        isRemoved: { $ne: true },
      });

  if (!student || isRemovedStudent(student)) {
    return NextResponse.json(
      { status: false, message: 'Active cohort student not found.' },
      { status: StatusCodes.NOT_FOUND },
    );
  }

  const duplicate = await Cohort.findOne({
    _id: { $ne: student._id },
    barcode,
    cohortType,
  });

  if (duplicate) {
    return NextResponse.json(
      {
        status: false,
        message: 'Another student already has this barcode in that cohort.',
      },
      { status: StatusCodes.CONFLICT },
    );
  }

  student.barcode = barcode;
  student.firstname = firstname;
  student.surname = surname;
  student.middlename = middlename;
  student.schoolClass = schoolClass;
  student.receivedCertificate = receivedCertificate;
  student.cohortType = cohortType;
  student.active = true;
  student.isRemoved = false;
  student.removedAt = null;

  const sheetsSync = await saveStudentAndSync(student);

  return NextResponse.json(
    {
      status: true,
      message: 'Student updated successfully.',
      data: {
        barcode: student.barcode,
        fullName: buildFullName(student),
        cohortType: student.cohortType,
        sheetsSync,
      },
    },
    { status: StatusCodes.OK },
  );
}

async function handleUpdateCohort(body, user) {
  const currentCohortType = getCohortTypeValue(body.currentCohortType);
  const rawNewType = getCohortTypeValue(body.newCohortType || body.cohortType || body.currentCohortType);
  const description = body.description !== undefined ? cleanText(body.description) : undefined;
  const active = body.active !== undefined ? getBooleanValue(body.active) : undefined;
  const staffName = getStaffName(user);

  if (!currentCohortType) {
    return NextResponse.json(
      { status: false, message: 'Current cohort type is required.' },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  if (!rawNewType) {
    return NextResponse.json(
      { status: false, message: 'New cohort type cannot be empty.' },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const [currentGroup, targetGroup, affectedStudents] = await Promise.all([
    CohortGroup.collection.findOne({ cohortType: currentCohortType }),
    currentCohortType === rawNewType
      ? CohortGroup.collection.findOne({ cohortType: currentCohortType })
      : CohortGroup.collection.findOne({ cohortType: rawNewType }),
    Cohort.collection.countDocuments({ cohortType: currentCohortType }),
  ]);

  if (!currentGroup && affectedStudents === 0) {
    return NextResponse.json(
      { status: false, message: 'Current cohort type was not found.' },
      { status: StatusCodes.NOT_FOUND },
    );
  }

  if (currentCohortType !== rawNewType) {
    if (
      targetGroup &&
      (!currentGroup || currentGroup._id.toString() !== targetGroup._id.toString())
    ) {
      return NextResponse.json(
        { status: false, message: `A cohort with the name "${rawNewType}" already exists.` },
        { status: StatusCodes.CONFLICT },
      );
    }

    await Cohort.collection.updateMany(
      { cohortType: currentCohortType },
      { $set: { cohortType: rawNewType } },
    );
  }

  if (currentGroup) {
    const updatePayload = {
      cohortType: rawNewType,
      displayName: rawNewType,
      updatedBy: staffName,
      updatedAt: new Date(),
    };
    if (description !== undefined) {
      updatePayload.description = description;
    }
    if (active !== undefined) {
      updatePayload.active = active;
    }

    await CohortGroup.collection.updateOne(
      { _id: currentGroup._id },
      { $set: updatePayload },
    );
  } else {
    await CohortGroup.collection.insertOne({
      cohortType: rawNewType,
      displayName: rawNewType,
      description: description || '',
      active: active !== undefined ? active : true,
      createdBy: staffName,
      updatedBy: staffName,
      order: DEFAULT_COHORT_TYPES.includes(rawNewType)
        ? DEFAULT_COHORT_TYPES.indexOf(rawNewType) + 1
        : 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const sheetsSync = await syncAllCohortsToSheets();

  return NextResponse.json(
    {
      status: true,
      message: 'Cohort updated successfully.',
      data: {
        previousCohortType: currentCohortType,
        cohortType: rawNewType,
        description,
        active,
        affectedStudents,
        sheetsSync,
      },
    },
    { status: StatusCodes.OK },
  );
}

async function handleRenameCohort(body, user) {
  return handleUpdateCohort(body, user);
}

async function handleRemoveStudent(body) {
  const barcode = cleanText(body.barcode);
  const cohortType = getCohortTypeValue(body.cohortType);

  if (!barcode) {
    return NextResponse.json(
      { status: false, message: 'Student barcode is required.' },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const student = await Cohort.findOne({
    barcode,
    ...(cohortType ? { cohortType } : {}),
    active: { $ne: false },
    isRemoved: { $ne: true },
  });

  if (!student) {
    return NextResponse.json(
      { status: false, message: 'Active cohort student not found.' },
      { status: StatusCodes.NOT_FOUND },
    );
  }

  student.active = false;
  student.isRemoved = true;
  student.removedAt = new Date();
  const sheetsSync = await saveStudentAndSync(student);

  return NextResponse.json(
    {
      status: true,
      message: 'Student removed from cohort successfully.',
      data: {
        barcode: student.barcode,
        fullName: buildFullName(student),
        sheetsSync,
      },
    },
    { status: StatusCodes.OK },
  );
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

    if (!hasCohortAccess(auth.user)) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only ICT, admin, assistant admin, and IMA staff can view cohorts.',
        },
        { status: StatusCodes.FORBIDDEN },
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
      { status: StatusCodes.OK },
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
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
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
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED },
      );
    }

    if (!hasCohortAccess(auth.user)) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only ICT, admin, assistant admin, and IMA staff can manage cohorts.',
        },
        { status: StatusCodes.FORBIDDEN },
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
      { status: StatusCodes.BAD_REQUEST },
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

    if (!hasCohortAccess(auth.user)) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only ICT, admin, assistant admin, and IMA staff can manage cohorts.',
        },
        { status: StatusCodes.FORBIDDEN },
      );
    }

    await prepareCohortData(getStaffName(auth.user));

    const body = await request.json();
    const action = cleanText(body.action).toLowerCase();

    if (action === 'movestudent') {
      return handleMoveStudent(body);
    }

    if (action === 'updatecohort' || action === 'renamecohort') {
      return handleUpdateCohort(body, auth.user);
    }

    if (action === 'syncgooglesheets') {
      const sheetsSync = await syncAllCohortsToSheets();
      return NextResponse.json(
        {
          status: true,
          message: sheetsSync.skipped
            ? 'Google Sheets sync skipped. Check server configuration.'
            : 'Google Sheets synced successfully.',
          data: {
            sheetsSync,
          },
        },
        { status: StatusCodes.OK },
      );
    }

    if (action === 'updatestudent') {
      return handleUpdateStudent(body);
    }

    return NextResponse.json(
      {
        status: false,
        message:
          'Invalid action. Use updatecohort, movestudent, renamecohort, syncgooglesheets, or updatestudent.',
      },
      { status: StatusCodes.BAD_REQUEST },
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
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
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
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED },
      );
    }

    if (!hasCohortAccess(auth.user)) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only ICT, admin, assistant admin, and IMA staff can manage cohorts.',
        },
        { status: StatusCodes.FORBIDDEN },
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
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
    );
  }
}
