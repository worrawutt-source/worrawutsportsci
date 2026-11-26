/**
 * SPORT SCIENCE RESEARCH LAB — Additive database migration
 *
 * Creates the MEETING_SUBMISSIONS sheet for text-based advisor meeting records.
 * Run manually in the TEST Apps Script project only.
 *
 * Safety:
 * - Does not modify setup.gs or the existing SCHEMA declaration in code.gs.
 * - Does not alter MEETING_RECORDS or MEETING_FILES.
 * - Does not clear, overwrite, or migrate existing rows.
 * - If MEETING_SUBMISSIONS already exists, validates its headers and stops.
 * - Does not run automatically from doGet(), APIs, or installable triggers.
 *
 * After the schema is reviewed and approved, the application change must add
 * MEETING_SUBMISSIONS to SCHEMA in code.gs before using generic table helpers.
 */

const MEETING_SUBMISSIONS_HEADERS_ = Object.freeze([
  'SUBMISSION_ID',
  'GROUP_ID',
  'MEETING_NO',
  'MEETING_WEEK',
  'MEETING_DATE',
  'MEETING_TOPIC',
  'PROGRESS_SUMMARY',
  'DISCUSSION_TOPICS',
  'NEXT_ACTIONS',
  'ASSIGNED_TO',
  'DUE_DATE',
  'SUBMITTED_BY',
  'SUBMITTED_AT',
  'STATUS',
  'REVIEWED_BY',
  'REVIEWED_AT',
  'REVIEW_COMMENT',
  'VERSION_NO',
  'PREVIOUS_SUBMISSION_ID'
]);

/**
 * Manually create the text-based meeting submission table in TEST.
 *
 * @return {{ok:boolean,status:string,sheetName:string,message:string}}
 */
function createMeetingSubmissionsTable() {
  const environment = String(getConfigValue_('ENVIRONMENT', '') || '').trim().toUpperCase();
  if (environment !== 'TEST') {
    throw new Error('Migration restricted: ENVIRONMENT must be TEST. No database changes were made.');
  }

  const dbId = PropertiesService.getScriptProperties().getProperty('DB_ID');
  if (!dbId) {
    throw new Error('Missing Script Property DB_ID. No database changes were made.');
  }

  const ss = SpreadsheetApp.openById(dbId);
  const sheetName = 'MEETING_SUBMISSIONS';
  let sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    const lastColumn = sheet.getLastColumn();
    const existingHeaders = lastColumn > 0
      ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(String)
      : [];

    const exactMatch = existingHeaders.length === MEETING_SUBMISSIONS_HEADERS_.length &&
      existingHeaders.every(function(header, index) {
        return header === MEETING_SUBMISSIONS_HEADERS_[index];
      });

    if (!exactMatch) {
      throw new Error(
        'MEETING_SUBMISSIONS already exists but its headers do not exactly match this migration. ' +
        'Stopped without modifying the existing sheet. Review the schema manually.'
      );
    }

    const alreadyExists = {
      ok: true,
      status: 'ALREADY_EXISTS',
      sheetName: sheetName,
      message: 'MEETING_SUBMISSIONS exists with matching headers. No changes were made.'
    };
    console.log(JSON.stringify(alreadyExists));
    return alreadyExists;
  }

  try {
    sheet = ss.insertSheet(sheetName);
  } catch (createError) {
    // If another administrator created it concurrently, validate rather than overwrite.
    sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw createError;

    const concurrentHeaders = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(String)
      : [];
    const concurrentMatch = concurrentHeaders.length === MEETING_SUBMISSIONS_HEADERS_.length &&
      concurrentHeaders.every(function(header, index) {
        return header === MEETING_SUBMISSIONS_HEADERS_[index];
      });
    if (!concurrentMatch) {
      throw new Error('MEETING_SUBMISSIONS was created concurrently with a different schema. No changes were made.');
    }
    return {
      ok: true,
      status: 'ALREADY_EXISTS',
      sheetName: sheetName,
      message: 'MEETING_SUBMISSIONS was created by another request with matching headers.'
    };
  }

  sheet.getRange(1, 1, 1, MEETING_SUBMISSIONS_HEADERS_.length)
    .setValues([MEETING_SUBMISSIONS_HEADERS_]);
  sheet.setFrozenRows(1);
  SpreadsheetApp.flush();

  const result = {
    ok: true,
    status: 'CREATED',
    sheetName: sheetName,
    message: 'MEETING_SUBMISSIONS created in TEST. Existing tables and records were not modified.'
  };
  console.log(JSON.stringify(result));
  return result;
}
