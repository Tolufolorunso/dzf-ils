import { google } from 'googleapis';

const SHEET_COLUMNS = [
  { key: 'barcode', label: 'Barcode' },
  { key: 'firstname', label: 'First Name' },
  { key: 'surname', label: 'Surname' },
  { key: 'middlename', label: 'Middle Name' },
  { key: 'schoolClass', label: 'Class' },
  { key: 'receivedCertificate', label: 'Certificate Received' },
  { key: 'cohortType', label: 'Cohort Type' },
  { key: 'active', label: 'Active' },
  { key: 'isRemoved', label: 'Removed' },
  { key: 'attendancePercentage', label: 'Attendance Percentage' },
  { key: 'createdAt', label: 'Date Added' },
];

const SHEET_HEADERS = SHEET_COLUMNS.map((column) => column.label);

const REMOVED_ROW_COLOR = {
  red: 1,
  green: 0.82,
  blue: 0.82,
};

const CERTIFIED_ROW_COLOR = {
  red: 0.18,
  green: 0.49,
  blue: 0.20,
};

const WHITE_TEXT_COLOR = {
  red: 1.0,
  green: 1.0,
  blue: 1.0,
};

function getAuth() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = rawKey
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');

  return new google.auth.GoogleAuth({
    credentials: {
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: privateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetsClient() {
  return google.sheets({
    version: 'v4',
    auth: getAuth(),
  });
}

function isSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_PROJECT_ID &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_SHEET_ID,
  );
}

function escapeSheetName(sheetName) {
  return String(sheetName).replace(/'/g, "''");
}

function sanitizeSheetTitle(value) {
  const title = String(value || 'unassigned')
    .replace(/[\\/?*[\]:]/g, '-')
    .trim()
    .slice(0, 100);

  return title || 'unassigned';
}

function serializeDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toTitleCase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function countAttendedClasses(attendance = []) {
  if (!Array.isArray(attendance)) {
    return 0;
  }

  return attendance.filter((entry) => entry?.attended).length;
}

function countAttendanceEntries(attendance = []) {
  return Array.isArray(attendance) ? attendance.length : 0;
}

function formatAttendancePercentage(student, totalClasses) {
  if (!totalClasses) {
    return '0%';
  }

  const attendedClasses = countAttendedClasses(student?.attendance);
  const percentage = Math.round((attendedClasses / totalClasses) * 100);

  return `${percentage}%`;
}

function normalizeStudent(student, totalClasses = 0) {
  return {
    barcode: student?.barcode || '',
    firstname: toTitleCase(student?.firstname),
    surname: toTitleCase(student?.surname),
    middlename: toTitleCase(student?.middlename),
    schoolClass: student?.schoolClass || '',
    receivedCertificate: Boolean(student?.receivedCertificate),
    cohortType: student?.cohortType || 'unassigned',
    active: student?.active !== false,
    isRemoved: Boolean(student?.isRemoved || student?.active === false),
    attendancePercentage: formatAttendancePercentage(student, totalClasses),
    createdAt: serializeDate(student?.createdAt),
  };
}

function studentToRow(student, totalClasses) {
  const normalized = normalizeStudent(student, totalClasses);
  return SHEET_COLUMNS.map((column) => normalized[column.key]);
}

function groupStudentsByCohort(students = [], cohortGroups = []) {
  const grouped = new Map();

  cohortGroups.forEach((group) => {
    const sheetTitle = sanitizeSheetTitle(group?.cohortType);
    if (sheetTitle) {
      grouped.set(sheetTitle, new Map());
    }
  });

  students.forEach((student) => {
    const normalized = normalizeStudent(student);
    const sheetTitle = sanitizeSheetTitle(normalized.cohortType);
    if (!grouped.has(sheetTitle)) {
      grouped.set(sheetTitle, new Map());
    }

    const barcodeKey = String(normalized.barcode).toLowerCase();
    if (!barcodeKey) {
      return;
    }

    grouped.get(sheetTitle).set(barcodeKey, student);
  });

  return grouped;
}

async function getSpreadsheetMetadata(sheetsClient) {
  const response = await sheetsClient.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    fields: 'sheets(properties(sheetId,title))',
  });

  return response.data.sheets || [];
}

async function ensureSheets(sheetsClient, sheetTitles) {
  const metadata = await getSpreadsheetMetadata(sheetsClient);
  const sheetMap = new Map(
    metadata.map((sheet) => [sheet.properties.title, sheet.properties.sheetId]),
  );

  const addRequests = sheetTitles
    .filter((title) => !sheetMap.has(title))
    .map((title) => ({
      addSheet: {
        properties: {
          title,
        },
      },
    }));

  if (addRequests.length > 0) {
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: addRequests,
      },
    });
  }

  const refreshedMetadata = addRequests.length
    ? await getSpreadsheetMetadata(sheetsClient)
    : metadata;

  return new Map(
    refreshedMetadata.map((sheet) => [
      sheet.properties.title,
      sheet.properties.sheetId,
    ]),
  );
}

function getTotalClassesForCohort(students) {
  return students.reduce((highestTotal, student) => {
    return Math.max(highestTotal, countAttendanceEntries(student?.attendance));
  }, 0);
}

async function writeSheetValues(sheetsClient, sheetTitle, students) {
  const totalClasses = getTotalClassesForCohort(students);
  const values = [
    SHEET_HEADERS,
    ...students.map((student) => studentToRow(student, totalClasses)),
  ];

  await sheetsClient.spreadsheets.values.clear({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `'${escapeSheetName(sheetTitle)}'`,
  });

  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `'${escapeSheetName(sheetTitle)}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });
}

function buildFormatRequests(sheetId, students) {
  const requests = [
    {
      repeatCell: {
        range: {
          sheetId,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: {
              red: 1,
              green: 1,
              blue: 1,
            },
            textFormat: {
              foregroundColor: {
                red: 0,
                green: 0,
                blue: 0,
              },
              bold: false,
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true,
            },
            backgroundColor: {
              red: 0.9,
              green: 0.93,
              blue: 0.96,
            },
          },
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor)',
      },
    },
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: SHEET_COLUMNS.length,
        },
      },
    },
  ];

  students.forEach((student, index) => {
    const normalized = normalizeStudent(student);
    if (normalized.isRemoved) {
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: index + 1,
            endRowIndex: index + 2,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: REMOVED_ROW_COLOR,
            },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });
    } else if (normalized.receivedCertificate) {
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: index + 1,
            endRowIndex: index + 2,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: CERTIFIED_ROW_COLOR,
              textFormat: {
                foregroundColor: WHITE_TEXT_COLOR,
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat.foregroundColor)',
        },
      });
    }
  });

  return requests;
}

export async function syncCohortsToSpreadsheet(students = [], cohortGroups = []) {
  if (!isSheetsConfigured()) {
    return {
      skipped: true,
      message: 'Google Sheets credentials are not configured.',
    };
  }

  const sheetsClient = getSheetsClient();
  const groupedStudents = groupStudentsByCohort(students, cohortGroups);
  const sheetTitles = Array.from(groupedStudents.keys()).sort((left, right) =>
    left.localeCompare(right),
  );
  const sheetIds = await ensureSheets(sheetsClient, sheetTitles);

  for (const sheetTitle of sheetTitles) {
    const uniqueStudents = Array.from(groupedStudents.get(sheetTitle).values())
      .sort((left, right) =>
        `${left.surname || ''} ${left.firstname || ''}`.localeCompare(
          `${right.surname || ''} ${right.firstname || ''}`,
        ),
      );

    await writeSheetValues(sheetsClient, sheetTitle, uniqueStudents);

    const sheetId = sheetIds.get(sheetTitle);
    if (sheetId !== undefined) {
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: buildFormatRequests(sheetId, uniqueStudents),
        },
      });
    }
  }

  return {
    skipped: false,
    sheetCount: sheetTitles.length,
    studentCount: students.length,
  };
}

export { SHEET_HEADERS };
