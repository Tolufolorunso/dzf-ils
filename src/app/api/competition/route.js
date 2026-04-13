import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Competition from '@/models/competition';
import Patron from '@/models/PatronModel';
import Library from '@/models/Library';

const COMPETITION_TYPE = 'reading';
const ALLOWED_COMPETITION_ROLES = ['admin', 'asst_admin', 'ict', 'librarian'];
const LEADERBOARD_LIMIT = 75;
const CATEGORY_ORDER = [
  { key: 'senior_secondary', label: 'Senior Secondary' },
  { key: 'junior_secondary', label: 'Junior Secondary' },
  { key: 'primary', label: 'Primary' },
];

function getStaffName(user) {
  return user?.name?.trim() || user?.username?.trim() || 'Library Staff';
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getBookTitleKey(value) {
  return slugify(value);
}

function getRecordBookKey(record) {
  return (
    cleanText(record?.bookTitleKey) ||
    getBookTitleKey(record?.bookTitle || record?.bookBarcode || '')
  );
}

function getRecordBookTitle(record) {
  return (
    cleanText(record?.bookTitle) ||
    cleanText(record?.bookBarcode) ||
    'Untitled Book'
  );
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
  }

  return false;
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function hasCompetitionAccess(user) {
  return ALLOWED_COMPETITION_ROLES.includes(user?.role);
}

function formatPatronName(patron) {
  return `${patron.surname}, ${patron.firstname} ${patron.middlename || ''}`.trim();
}

function normalizeClassValue(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, '');
}

function getClassInfo(value) {
  const rawValue = cleanText(value);
  const normalized = normalizeClassValue(value);

  if (/^(ss|sss)[123]$/.test(normalized)) {
    return {
      currentClass: `SS${normalized.slice(-1)}`,
      categoryKey: 'senior_secondary',
      categoryLabel: 'Senior Secondary',
    };
  }

  if (/^(js|jss)[123]$/.test(normalized)) {
    return {
      currentClass: `JSS${normalized.slice(-1)}`,
      categoryKey: 'junior_secondary',
      categoryLabel: 'Junior Secondary',
    };
  }

  if (/^(primary|pri|p)[1-6]$/.test(normalized)) {
    return {
      currentClass: `Primary ${normalized.slice(-1)}`,
      categoryKey: 'primary',
      categoryLabel: 'Primary',
    };
  }

  if (/^(primary|pri)$/.test(normalized)) {
    return {
      currentClass: 'Primary',
      categoryKey: 'primary',
      categoryLabel: 'Primary',
    };
  }

  return {
    currentClass: rawValue,
    categoryKey: 'uncategorized',
    categoryLabel: 'Uncategorized',
  };
}

async function getSessionMeta() {
  const currentYear = new Date().getFullYear();
  const fallbackTitle = `Reading Competition ${currentYear}`;

  let title = fallbackTitle;
  let source = 'default';

  try {
    const library = await Library.findOne({
      'competitionDetails.isActive': true,
    })
      .select('competitionDetails')
      .lean();

    const configuredTitle = cleanText(library?.competitionDetails?.title);

    if (configuredTitle) {
      title = configuredTitle;
      source = 'library';
    }
  } catch (error) {
    console.error('Competition session lookup error:', error);
  }

  return {
    title,
    sessionKey: slugify(title) || `reading-competition-${currentYear}`,
    source,
  };
}

function rankLeaderboard(entries) {
  const sorted = [...entries].sort((left, right) => {
    return (
      right.averageGrade - left.averageGrade ||
      right.booksRead - left.booksRead ||
      right.teacherVerifiedCount - left.teacherVerifiedCount ||
      right.latestCheckinTime - left.latestCheckinTime ||
      left.patronName.localeCompare(right.patronName)
    );
  });

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

async function buildCompetitionData() {
  const session = await getSessionMeta();

  const records = await Competition.find({
    competitionType: COMPETITION_TYPE,
    sessionKey: session.sessionKey,
  })
    .sort({ checkoutDate: -1 })
    .lean();

  const activeCheckouts = [];
  const recentCheckins = [];
  const participantMap = new Map();

  let totalGrade = 0;
  let gradedCount = 0;
  let booksRead = 0;
  let verifiedSummaries = 0;

  records.forEach((record) => {
    const patronKey = record.patronBarcode;

    if (!participantMap.has(patronKey)) {
      participantMap.set(patronKey, {
        patronId: record.patronId?.toString?.() || '',
        patronBarcode: record.patronBarcode,
        patronName: record.patronName,
        booksRead: 0,
        booksLogged: 0,
        totalGrade: 0,
        gradedCount: 0,
        averageGrade: 0,
        teacherVerifiedCount: 0,
        activeLoans: 0,
        currentClass: '',
        categoryKey: 'uncategorized',
        categoryLabel: 'Uncategorized',
        latestCheckinTime: 0,
        latestCheckinDate: null,
      });
    }

    const participant = participantMap.get(patronKey);
    participant.booksLogged += 1;

    if (record.status === 'checked_out') {
      participant.activeLoans += 1;
      activeCheckouts.push({
        id: record._id.toString(),
        patronBarcode: record.patronBarcode,
        patronName: record.patronName,
        bookTitle: getRecordBookTitle(record),
        checkoutDate: record.checkoutDate,
        checkedOutBy: record.checkedOutBy || 'Library Staff',
      });
      return;
    }

    participant.booksRead += 1;
    booksRead += 1;

    if (typeof record.grade === 'number') {
      participant.totalGrade += record.grade;
      participant.gradedCount += 1;
      totalGrade += record.grade;
      gradedCount += 1;
    }

    if (record.teacherVerified) {
      participant.teacherVerifiedCount += 1;
      verifiedSummaries += 1;
    }

    const checkinTime = record.checkinDate
      ? new Date(record.checkinDate).getTime()
      : 0;
    if (checkinTime > participant.latestCheckinTime) {
      participant.latestCheckinTime = checkinTime;
      participant.latestCheckinDate = record.checkinDate;
    }

    recentCheckins.push({
      id: record._id.toString(),
      patronBarcode: record.patronBarcode,
      patronName: record.patronName,
      bookTitle: getRecordBookTitle(record),
      checkinDate: record.checkinDate,
      grade: record.grade,
      teacherVerified: record.teacherVerified,
      gradedBy: record.gradedBy || 'Library Staff',
      feedback: record.feedback || '',
      summary: record.summary || '',
    });
  });

  const patronBarcodes = Array.from(participantMap.keys());
  const patrons = patronBarcodes.length
    ? await Patron.find({ barcode: { $in: patronBarcodes } })
        .select('barcode studentSchoolInfo.currentClass')
        .lean()
    : [];

  const patronClassMap = new Map(
    patrons.map((patron) => [
      patron.barcode,
      getClassInfo(patron.studentSchoolInfo?.currentClass),
    ]),
  );

  participantMap.forEach((participant, barcode) => {
    const classInfo = patronClassMap.get(barcode) || getClassInfo('');
    participant.currentClass = classInfo.currentClass;
    participant.categoryKey = classInfo.categoryKey;
    participant.categoryLabel = classInfo.categoryLabel;
  });

  activeCheckouts.forEach((record) => {
    const classInfo =
      patronClassMap.get(record.patronBarcode) || getClassInfo('');
    record.currentClass = classInfo.currentClass;
    record.categoryLabel = classInfo.categoryLabel;
  });

  recentCheckins.forEach((record) => {
    const classInfo =
      patronClassMap.get(record.patronBarcode) || getClassInfo('');
    record.currentClass = classInfo.currentClass;
    record.categoryLabel = classInfo.categoryLabel;
  });

  const leaderboardEntries = Array.from(participantMap.values()).map(
    (participant) => ({
      ...participant,
      averageGrade: participant.gradedCount
        ? roundToOneDecimal(participant.totalGrade / participant.gradedCount)
        : 0,
    }),
  );

  const rankedLeaderboard = rankLeaderboard(leaderboardEntries);
  const topLeaderboard = rankedLeaderboard.slice(0, LEADERBOARD_LIMIT);

  const categoryWinners = CATEGORY_ORDER.map((category) => ({
    categoryKey: category.key,
    categoryLabel: category.label,
    winner:
      rankedLeaderboard.find((entry) => entry.categoryKey === category.key) ||
      null,
  }));

  const categoryLeaderboards = CATEGORY_ORDER.map((category) => {
    const entries = topLeaderboard
      .filter((entry) => entry.categoryKey === category.key)
      .map((entry, index) => ({
        ...entry,
        categoryRank: index + 1,
      }));

    return {
      categoryKey: category.key,
      categoryLabel: category.label,
      entries,
    };
  });

  const uncategorizedEntries = topLeaderboard
    .filter((entry) => entry.categoryKey === 'uncategorized')
    .map((entry, index) => ({
      ...entry,
      categoryRank: index + 1,
    }));

  return {
    session,
    stats: {
      totalParticipants: participantMap.size,
      totalBooksLogged: records.length,
      totalBooksRead: booksRead,
      activeCheckouts: activeCheckouts.length,
      gradedSummaries: gradedCount,
      verifiedSummaries,
      averageGrade: gradedCount
        ? roundToOneDecimal(totalGrade / gradedCount)
        : 0,
      leaderboardCount: topLeaderboard.length,
    },
    leaderboard: topLeaderboard,
    categoryWinners,
    categoryLeaderboards,
    uncategorizedLeaderboard: uncategorizedEntries,
    activeCheckouts: activeCheckouts.slice(0, 10),
    recentCheckins: recentCheckins
      .sort(
        (left, right) =>
          new Date(right.checkinDate || 0).getTime() -
          new Date(left.checkinDate || 0).getTime(),
      )
      .slice(0, 10),
  };
}

async function handleCheckout(body, user) {
  const patronBarcode = cleanText(body.patronBarcode);
  const bookTitle = cleanText(body.bookTitle);
  const bookTitleKey = getBookTitleKey(bookTitle);
  const staffName = getStaffName(user);

  if (!patronBarcode || !bookTitleKey) {
    return NextResponse.json(
      {
        status: false,
        message: 'Patron barcode and book name are required.',
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const session = await getSessionMeta();

  const [patron, patronRecords] = await Promise.all([
    Patron.findOne({ barcode: patronBarcode }),
    Competition.find({
      competitionType: COMPETITION_TYPE,
      sessionKey: session.sessionKey,
      patronBarcode,
    })
      .select('bookTitle bookTitleKey bookBarcode status')
      .lean(),
  ]);

  if (!patron) {
    return NextResponse.json(
      { status: false, message: 'Patron not found.' },
      { status: StatusCodes.NOT_FOUND },
    );
  }

  // if (!patron.active) {
  //   return NextResponse.json(
  //     {
  //       status: false,
  //       message: 'This patron is inactive and cannot participate right now.',
  //     },
  //     { status: StatusCodes.FORBIDDEN },
  //   );
  // }

  const existingRecord = patronRecords.find(
    (record) => getRecordBookKey(record) === bookTitleKey,
  );

  if (existingRecord) {
    return NextResponse.json(
      {
        status: false,
        message:
          'This patron has already borrowed this book during the current competition session and cannot borrow it again.',
      },
      { status: StatusCodes.CONFLICT },
    );
  }

  const activeLoan = patronRecords.find((record) => record.status === 'checked_out');

  if (activeLoan) {
    return NextResponse.json(
      {
        status: false,
        message:
          `This patron already has "${getRecordBookTitle(activeLoan)}" checked out. Please check it in before another competition checkout.`,
      },
      { status: StatusCodes.CONFLICT },
    );
  }

  const checkoutDate = new Date();

  try {
    await Competition.create({
      competitionType: COMPETITION_TYPE,
      title: session.title,
      sessionKey: session.sessionKey,
      patronId: patron._id,
      patronBarcode: patron.barcode,
      patronName: formatPatronName(patron),
      bookTitle,
      bookTitleKey,
      checkoutDate,
      checkedOutBy: staffName,
      status: 'checked_out',
      library: patron.library || 'AAoJ',
    });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          status: false,
          message:
            'This book has already been logged for the patron in the active competition.',
        },
        { status: StatusCodes.CONFLICT },
      );
    }

    throw error;
  }

  return NextResponse.json(
    {
      status: true,
      message: 'Competition checkout recorded successfully.',
      data: {
        patronName: formatPatronName(patron),
        patronBarcode: patron.barcode,
        bookTitle,
      },
    },
    { status: StatusCodes.CREATED },
  );
}

async function handleUpdateClass(body) {
  const patronBarcode = cleanText(body.patronBarcode);
  const currentClassInput = cleanText(body.currentClass);

  if (!patronBarcode || !currentClassInput) {
    return NextResponse.json(
      {
        status: false,
        message: 'Patron barcode and current class are required.',
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const classInfo = getClassInfo(currentClassInput);

  if (classInfo.categoryKey === 'uncategorized') {
    return NextResponse.json(
      {
        status: false,
        message:
          'Current class must match Primary 1-6, JSS1-3, or SS1-3 for competition ranking.',
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const patron = await Patron.findOne({ barcode: patronBarcode });

  if (!patron) {
    return NextResponse.json(
      { status: false, message: 'Patron not found.' },
      { status: StatusCodes.NOT_FOUND },
    );
  }

  if (!patron.studentSchoolInfo) {
    patron.studentSchoolInfo = {};
  }

  patron.studentSchoolInfo.currentClass = classInfo.currentClass;
  await patron.save();

  return NextResponse.json(
    {
      status: true,
      message: 'Patron current class updated successfully.',
      data: {
        patronBarcode: patron.barcode,
        patronName: formatPatronName(patron),
        currentClass: classInfo.currentClass,
        categoryKey: classInfo.categoryKey,
        categoryLabel: classInfo.categoryLabel,
      },
    },
    { status: StatusCodes.OK },
  );
}

async function handleCheckin(body, user) {
  const patronBarcode = cleanText(body.patronBarcode);
  const bookTitle = cleanText(body.bookTitle);
  const bookTitleKey = getBookTitleKey(bookTitle);
  const summary = cleanText(body.summary);
  const feedback = cleanText(body.feedback);
  const teacherVerified = toBoolean(body.teacherVerified);
  const grade = Number(body.grade);
  const staffName = getStaffName(user);

  if (!patronBarcode || !bookTitleKey) {
    return NextResponse.json(
      {
        status: false,
        message: 'Patron barcode and book name are required.',
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
    return NextResponse.json(
      {
        status: false,
        message: 'Grade must be a number between 0 and 100.',
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  const session = await getSessionMeta();

  const [patron, patronRecords] = await Promise.all([
    Patron.findOne({ barcode: patronBarcode }),
    Competition.find({
      competitionType: COMPETITION_TYPE,
      sessionKey: session.sessionKey,
      patronBarcode,
    }).sort({ checkoutDate: -1 }),
  ]);

  const activeRecord = patronRecords.find(
    (record) =>
      record.status === 'checked_out' &&
      getRecordBookKey(record) === bookTitleKey,
  );
  const completedRecord = patronRecords.find(
    (record) =>
      record.status === 'checked_in' &&
      getRecordBookKey(record) === bookTitleKey,
  );

  if (!patron) {
    return NextResponse.json(
      { status: false, message: 'Patron not found.' },
      { status: StatusCodes.NOT_FOUND },
    );
  }

  if (completedRecord && !activeRecord) {
    return NextResponse.json(
      {
        status: false,
        message:
          'This competition reading has already been checked in and graded for the current session.',
      },
      { status: StatusCodes.CONFLICT },
    );
  }

  if (!activeRecord) {
    return NextResponse.json(
      {
        status: false,
        message:
          'No active competition checkout was found for this patron and book title.',
      },
      { status: StatusCodes.NOT_FOUND },
    );
  }

  const checkinDate = new Date();
  activeRecord.status = 'checked_in';
  activeRecord.checkinDate = checkinDate;
  activeRecord.bookTitle = activeRecord.bookTitle || bookTitle;
  activeRecord.bookTitleKey =
    activeRecord.bookTitleKey || getBookTitleKey(activeRecord.bookTitle);
  activeRecord.summary = summary;
  activeRecord.grade = grade;
  activeRecord.feedback = feedback;
  activeRecord.teacherVerified = teacherVerified;
  activeRecord.teacherVerifiedBy = teacherVerified ? staffName : '';
  activeRecord.gradedBy = staffName;

  await activeRecord.save();

  return NextResponse.json(
    {
      status: true,
      message: 'Competition check-in recorded and graded successfully.',
      data: {
        patronName: formatPatronName(patron),
        patronBarcode: patron.barcode,
        bookTitle: activeRecord.bookTitle,
        grade,
        teacherVerified,
      },
    },
    { status: StatusCodes.OK },
  );
}

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isPublicRequest = ['1', 'true', 'yes', 'live'].includes(
      cleanText(searchParams.get('public')).toLowerCase(),
    );

    if (!isPublicRequest) {
      const auth = await verifyAuth(request);
      if (!auth.status) {
        return NextResponse.json(
          { status: false, message: auth.message, logout: true },
          { status: auth.statusCode || StatusCodes.UNAUTHORIZED },
        );
      }

      if (!hasCompetitionAccess(auth.user)) {
        return NextResponse.json(
          {
            status: false,
            message:
              'Only library staff can view or manage reading competition records.',
          },
          { status: StatusCodes.FORBIDDEN },
        );
      }
    }

    const data = await buildCompetitionData();

    return NextResponse.json(
      {
        status: true,
        message: isPublicRequest
          ? 'Public competition data fetched successfully.'
          : 'Competition data fetched successfully.',
        data,
      },
      { status: StatusCodes.OK },
    );
  } catch (error) {
    console.error('Competition fetch error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch competition data.',
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

    if (!hasCompetitionAccess(auth.user)) {
      return NextResponse.json(
        {
          status: false,
          message:
            'Only library staff can record competition checkouts and check-ins.',
        },
        { status: StatusCodes.FORBIDDEN },
      );
    }

    const body = await request.json();
    const action = cleanText(body.action).toLowerCase();

    if (action === 'checkout') {
      return handleCheckout(body, auth.user);
    }

    if (action === 'checkin') {
      return handleCheckin(body, auth.user);
    }

    if (action === 'updateclass') {
      return handleUpdateClass(body);
    }

    return NextResponse.json(
      {
        status: false,
        message:
          'Invalid competition action. Use checkout, checkin, or updateclass.',
      },
      { status: StatusCodes.BAD_REQUEST },
    );
  } catch (error) {
    console.error('Competition action error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to process competition request.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
    );
  }
}
