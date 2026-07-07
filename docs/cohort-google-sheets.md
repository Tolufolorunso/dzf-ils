# Cohort Google Sheets Sync

## What changed

- `CohortModel` now stores `schoolClass`, `receivedCertificate`, and `isRemoved`.
- `/cohorts` can add class/certificate data, edit existing student data, remove students, and manually trigger a Google Sheets sync.
- `/api/cohorts` syncs Google Sheets after cohort create, student add, student edit, student move, cohort rename, and student removal.
- `src/lib/googleSheets.js` rewrites one sheet per active cohort type. Each tab is named from `CohortGroup.cohortType`.
- Each sheet uses these columns: `Barcode`, `First Name`, `Surname`, `Middle Name`, `Class`, `Certificate Received`, `Cohort Type`, `Active`, `Removed`, `Attendance Percentage`, `Date Added`.
- Student names are title-cased in the spreadsheet export.
- `Attendance Percentage` is calculated per cohort tab as each student's attended classes divided by the highest attendance-record count found for any student in that cohort.
- Students are de-duplicated per sheet by `barcode` before writing.
- Removed students remain in the spreadsheet and are colored red.

## Required environment variables

Add these values to `.env`:

```env
GOOGLE_PROJECT_ID=
GOOGLE_PRIVATE_KEY=
GOOGLE_CLIENT_EMAIL=
GOOGLE_SHEET_ID=
```

Share the Google spreadsheet with `GOOGLE_CLIENT_EMAIL` as an editor.

## How sync works

- MongoDB is the source of truth.
- The app rewrites the cohort tabs from MongoDB data after every cohort/student mutation.
- Use the `Sync Google Sheets` button on `/cohorts` when you want to force a full spreadsheet refresh.
- If Google credentials are missing or invalid, the app still saves MongoDB data and returns/logs a sync warning.

## How to clear the spreadsheet and reload proper app data

1. Open the spreadsheet from `GOOGLE_SHEET_ID`.
2. For each cohort tab, select all cells and delete the content.
3. Do not delete the spreadsheet itself; the app needs the same spreadsheet ID.
4. Go to `/cohorts`.
5. Click `Sync Google Sheets`.
6. The app recreates/rewrites cohort tabs from MongoDB, restores headers, removes duplicate barcodes within each tab, and recolors removed students red.

If the spreadsheet has old tabs with names that are no longer cohort types, delete those tabs manually in Google Sheets.

## Suggested commit message

```text
feat(cohorts): sync cohort students with Google Sheets
```
