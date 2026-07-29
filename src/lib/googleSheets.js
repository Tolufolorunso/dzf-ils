import { google } from 'googleapis';

const SHEET_COLUMNS = [
  { key: 'barcode', label: 'Barcode' },
  { key: 'firstname', label: 'First Name' },
  { key: 'surname', label: 'Surname' },
  { key: 'middlename', label: 'Computer Assigned Id' },
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
    receivedCertificate: student?.receivedCertificate ? 'Yes' : 'No',
    cohortType: student?.cohortType || 'unassigned',
    active: student?.active !== false ? 'Yes' : 'No',
    isRemoved: Boolean(student?.isRemoved || student?.active === false) ? 'Yes' : 'No',
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
  const cohortLookup = new Map();

  // Enforce ONLY the 7 official cohort types (cohort-1 through cohort-7)
  DEFAULT_COHORT_TYPES.forEach((cohortType) => {
    const sheetTitle = sanitizeSheetTitle(cohortType);
    const existingGroup = (cohortGroups || []).find(
      (g) => normalizeCohortType(g?.cohortType) === cohortType || g?.cohortType === cohortType
    );

    const groupData = {
      groupInfo: {
        cohortType,
        displayName: existingGroup?.displayName || cohortType,
        description: existingGroup?.description || '',
        active: existingGroup?.active !== false,
      },
      studentsMap: new Map(),
    };

    grouped.set(sheetTitle, groupData);

    cohortLookup.set(sheetTitle, sheetTitle);
    cohortLookup.set(cohortType.toLowerCase(), sheetTitle);
    const noSpace = cohortType.toLowerCase().replace(/[\s_-]+/g, '');
    cohortLookup.set(noSpace, sheetTitle);
  });

  // Map known legacy aliases
  Object.entries(LEGACY_COHORT_ALIASES).forEach(([alias, canonical]) => {
    const sheetTitle = sanitizeSheetTitle(canonical);
    if (grouped.has(sheetTitle)) {
      cohortLookup.set(alias.toLowerCase(), sheetTitle);
    }
  });

  // Populate students into their corresponding cohort (1 to 7)
  students.forEach((student) => {
    const rawCohort = cleanText(student?.cohortType);
    if (!rawCohort) return;

    const barcodeKey = String(student?.barcode || '').trim().toLowerCase();
    if (!barcodeKey) return;

    const normStudent = normalizeCohortType(rawCohort);
    const studentLower = rawCohort.toLowerCase();
    const studentNoSpace = studentLower.replace(/[\s_-]+/g, '');

    const targetSheetTitle =
      cohortLookup.get(sanitizeSheetTitle(normStudent)) ||
      cohortLookup.get(normStudent) ||
      cohortLookup.get(studentLower) ||
      cohortLookup.get(studentNoSpace) ||
      sanitizeSheetTitle(normStudent || 'cohort-1');

    if (grouped.has(targetSheetTitle)) {
      grouped.get(targetSheetTitle).studentsMap.set(barcodeKey, student);
    }
  });

  return grouped;
}

async function getSpreadsheetMetadata(sheetsClient) {
  const response = await sheetsClient.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    fields: 'sheets(properties(sheetId,title),charts(chartId))',
  });

  return response.data.sheets || [];
}

async function ensureSheets(sheetsClient, sheetTitles) {
  const metadata = await getSpreadsheetMetadata(sheetsClient);
  const sheetMap = new Map();
  const existingChartsMap = new Map();

  metadata.forEach((sheet) => {
    const title = sheet.properties.title;
    const sheetId = sheet.properties.sheetId;
    sheetMap.set(title, sheetId);
    const chartIds = (sheet.charts || []).map((chart) => chart.chartId);
    existingChartsMap.set(sheetId, chartIds);
  });

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

  const refreshedSheetMap = new Map();
  const refreshedChartsMap = new Map();

  refreshedMetadata.forEach((sheet) => {
    const title = sheet.properties.title;
    const sheetId = sheet.properties.sheetId;
    refreshedSheetMap.set(title, sheetId);
    const chartIds = (sheet.charts || []).map((chart) => chart.chartId);
    refreshedChartsMap.set(sheetId, chartIds);
  });

  return {
    sheetMap: refreshedSheetMap,
    existingChartsMap: refreshedChartsMap,
  };
}

function getTotalClassesForCohort(students) {
  return students.reduce((highestTotal, student) => {
    return Math.max(highestTotal, countAttendanceEntries(student?.attendance));
  }, 0);
}

function calculateCohortStats(students = [], totalClasses = 0) {
  const totalStudents = students.length;
  const activeStudents = students.filter(
    (student) => student?.active !== false && !student?.isRemoved
  ).length;
  const certifiedStudents = students.filter(
    (student) => Boolean(student?.receivedCertificate)
  ).length;
  const removedStudents = students.filter(
    (student) => Boolean(student?.isRemoved || student?.active === false)
  ).length;

  let totalPctSum = 0;
  students.forEach((student) => {
    if (totalClasses > 0) {
      const attended = countAttendedClasses(student?.attendance);
      totalPctSum += (attended / totalClasses) * 100;
    }
  });

  const avgAttendance = totalStudents > 0 && totalClasses > 0
    ? Math.round(totalPctSum / totalStudents)
    : 0;

  return {
    totalStudents,
    activeStudents,
    certifiedStudents,
    removedStudents,
    avgAttendance,
  };
}

async function writeSheetValues(sheetsClient, sheetTitle, groupInfo, students) {
  const totalClasses = getTotalClassesForCohort(students);
  const stats = calculateCohortStats(students, totalClasses);
  const statusLabel = groupInfo?.active !== false
    ? 'Active (Training Ongoing)'
    : 'Inactive (Training Ended)';

  const values = [
    ['COHORT NAME:', groupInfo?.displayName || sheetTitle],
    ['DESCRIPTION:', groupInfo?.description || 'No description provided.'],
    ['TRAINING STATUS:', statusLabel],
    [],
    ['COHORT STATISTICS'],
    ['Metric', 'Value'],
    ['Total Students', stats.totalStudents],
    ['Active Students', stats.activeStudents],
    ['Certificates Awarded', stats.certifiedStudents],
    ['Removed Students', stats.removedStudents],
    ['Average Attendance Rate', `${stats.avgAttendance}%`],
    [],
    ['STUDENT DIRECTORY'],
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

function buildFormatRequests(sheetId, groupInfo, students, existingChartIds = []) {
  const requests = [];

  // Delete old charts if re-syncing to prevent duplication
  existingChartIds.forEach((chartId) => {
    requests.push({
      deleteChart: {
        chartId,
      },
    });
  });

  // Base background and text format reset
  requests.push({
    repeatCell: {
      range: {
        sheetId,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 1, green: 1, blue: 1 },
          textFormat: {
            foregroundColor: { red: 0, green: 0, blue: 0 },
            bold: false,
          },
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat)',
    },
  });

  // Row 0: Cohort Title (Bold, larger font, light blue background)
  requests.push({
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
            fontSize: 12,
            foregroundColor: { red: 0.09, green: 0.2, blue: 0.3 },
          },
          backgroundColor: { red: 0.85, green: 0.91, blue: 0.97 },
        },
      },
      fields: 'userEnteredFormat(textFormat,backgroundColor)',
    },
  });

  // Row 1 & 2: Description & Status Header Labels
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 1,
        endRowIndex: 3,
        startColumnIndex: 0,
        endColumnIndex: 1,
      },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true },
        },
      },
      fields: 'userEnteredFormat.textFormat.bold',
    },
  });

  // Row 4: Cohort Statistics Section Header
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 4,
        endRowIndex: 5,
        startColumnIndex: 0,
        endColumnIndex: 2,
      },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true, fontSize: 11 },
          backgroundColor: { red: 0.91, green: 0.93, blue: 0.96 },
        },
      },
      fields: 'userEnteredFormat(textFormat,backgroundColor)',
    },
  });

  // Row 5: Stats Table Headers (Metric / Value)
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 5,
        endRowIndex: 6,
        startColumnIndex: 0,
        endColumnIndex: 2,
      },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true },
          backgroundColor: { red: 0.8, green: 0.85, blue: 0.9 },
        },
      },
      fields: 'userEnteredFormat(textFormat,backgroundColor)',
    },
  });

  // Row 12: Student Directory Section Header
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 12,
        endRowIndex: 13,
      },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true, fontSize: 11 },
          backgroundColor: { red: 0.91, green: 0.93, blue: 0.96 },
        },
      },
      fields: 'userEnteredFormat(textFormat,backgroundColor)',
    },
  });

  // Row 13: Student Directory Header Columns
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 13,
        endRowIndex: 14,
      },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true },
          backgroundColor: { red: 0.85, green: 0.91, blue: 0.97 },
        },
      },
      fields: 'userEnteredFormat(textFormat,backgroundColor)',
    },
  });

  // Auto resize columns
  requests.push({
    autoResizeDimensions: {
      dimensions: {
        sheetId,
        dimension: 'COLUMNS',
        startIndex: 0,
        endIndex: SHEET_COLUMNS.length,
      },
    },
  });

  // Conditional row formatting for students starting at row 14
  students.forEach((student, index) => {
    const rowIndex = index + 14;
    const normalized = normalizeStudent(student);

    if (normalized.isRemoved === 'Yes') {
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: REMOVED_ROW_COLOR,
            },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      });
    } else if (normalized.receivedCertificate === 'Yes') {
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
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

  // Position chart to the RIGHT in Column N (columnIndex 13) at Row 1 (rowIndex 0)
  // This ensures the chart floats completely outside the student data table (Columns A-K)
  requests.push({
    addChart: {
      chart: {
        spec: {
          title: `${groupInfo?.displayName || 'Cohort'} Statistics`,
          basicChart: {
            chartType: 'COLUMN',
            legendPosition: 'NO_LEGEND',
            axis: [
              {
                position: 'BOTTOM_AXIS',
                title: 'Metric',
              },
              {
                position: 'LEFT_AXIS',
                title: 'Count',
              },
            ],
            domains: [
              {
                domain: {
                  sourceRange: {
                    sources: [
                      {
                        sheetId,
                        startRowIndex: 5,
                        endRowIndex: 10,
                        startColumnIndex: 0,
                        endColumnIndex: 1,
                      },
                    ],
                  },
                },
              },
            ],
            series: [
              {
                series: {
                  sourceRange: {
                    sources: [
                      {
                        sheetId,
                        startRowIndex: 5,
                        endRowIndex: 10,
                        startColumnIndex: 1,
                        endColumnIndex: 2,
                      },
                    ],
                  },
                },
                targetAxis: 'LEFT_AXIS',
              },
            ],
          },
        },
        position: {
          overlayPosition: {
            anchorCell: {
              sheetId,
              rowIndex: 0,     // Row 1
              columnIndex: 13, // Column N (clean whitespace to the right)
            },
            widthPixels: 550,
            heightPixels: 300,
          },
        },
      },
    },
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

  // Clear ALL values across ALL sheets in the spreadsheet first
  try {
    const existingMetadata = await getSpreadsheetMetadata(sheetsClient);
    for (const sheet of existingMetadata) {
      const title = sheet.properties.title;
      try {
        await sheetsClient.spreadsheets.values.clear({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: `'${escapeSheetName(title)}'`,
        });
      } catch (e) {
        console.warn(`Clearing values warning for ${title}:`, e.message);
      }
    }
  } catch (err) {
    console.warn('Metadata fetch warning during pre-clear:', err.message);
  }

  const groupedData = groupStudentsByCohort(students, cohortGroups);
  const sheetTitles = Array.from(groupedData.keys()).sort((left, right) =>
    left.localeCompare(right),
  );
  const { sheetMap, existingChartsMap } = await ensureSheets(
    sheetsClient,
    sheetTitles
  );

  for (const sheetTitle of sheetTitles) {
    const item = groupedData.get(sheetTitle);
    const groupInfo = item.groupInfo;
    const uniqueStudents = Array.from(item.studentsMap.values()).sort(
      (left, right) =>
        `${left.surname || ''} ${left.firstname || ''}`.localeCompare(
          `${right.surname || ''} ${right.firstname || ''}`,
        ),
    );

    await writeSheetValues(sheetsClient, sheetTitle, groupInfo, uniqueStudents);

    const sheetId = sheetMap.get(sheetTitle);
    if (sheetId !== undefined) {
      const existingCharts = existingChartsMap.get(sheetId) || [];
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: buildFormatRequests(
            sheetId,
            groupInfo,
            uniqueStudents,
            existingCharts
          ),
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

