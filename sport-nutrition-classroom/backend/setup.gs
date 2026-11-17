/**
 * SPORT NUTRITION CLASSROOM
 * Database setup — Account Linking foundation
 *
 * Run setupAccountLinkingSheets() manually once from the container-bound
 * Apps Script project attached to SportNutritionApp.
 *
 * Safety:
 * - Creates only the account-linking tables required by this phase.
 * - Reuses an empty Sheet1 as Users when possible.
 * - Never clears, deletes, or overwrites existing data.
 * - Stops if an existing table has a different header row.
 */

const SNC_SETUP = Object.freeze({
  VERSION: '1.0.0',
  TABLES: {
    Users: [
      'UserID',
      'StudentID',
      'FirstName',
      'LastName',
      'Email',
      'Status',
      'CreatedAt',
      'UpdatedAt'
    ],
    LINEAccounts: [
      'LINEAccountID',
      'UserID',
      'Provider',
      'ProviderSubject',
      'DisplayName',
      'PictureUrl',
      'Status',
      'LinkedAt',
      'CreatedAt',
      'UpdatedAt'
    ],
    EmailOTPChallenges: [
      'ChallengeID',
      'StudentID',
      'Email',
      'LINEProvider',
      'LINEProviderSubject',
      'OTPHash',
      'ExpiresAt',
      'AttemptCount',
      'MaxAttempts',
      'ConsumedAt',
      'CreatedAt',
      'RequestID'
    ],
    AuditLogs: [
      'AuditID',
      'ActorUserID',
      'Action',
      'EntityType',
      'EntityID',
      'DetailsJson',
      'CreatedAt',
      'RequestID'
    ]
  }
});

/**
 * Creates the minimum database tables for Student Account Linking.
 * Safe to run again: existing matching sheets are retained unchanged.
 */
function setupAccountLinkingSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No active spreadsheet. Open this script from SportNutritionApp.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var report = [];
    var usersSheet = ss.getSheetByName('Users');

    // Reuse the default blank tab rather than leaving an unexplained Sheet1.
    if (!usersSheet) {
      var sheet1 = ss.getSheetByName('Sheet1');
      if (sheet1 && sheetIsCompletelyBlank_(sheet1)) {
        sheet1.setName('Users');
        usersSheet = sheet1;
        report.push('Renamed blank Sheet1 to Users');
      }
    }

    Object.keys(SNC_SETUP.TABLES).forEach(function(tableName) {
      var headers = SNC_SETUP.TABLES[tableName];
      var sheet = ss.getSheetByName(tableName);

      if (!sheet) {
        sheet = ss.insertSheet(tableName);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        formatSetupHeader_(sheet, headers.length);
        report.push('Created ' + tableName);
        return;
      }

      var lastRow = sheet.getLastRow();
      var lastColumn = sheet.getLastColumn();

      if (lastRow === 0 || (lastRow === 1 && lastColumn === 0)) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        formatSetupHeader_(sheet, headers.length);
        report.push('Initialized empty ' + tableName);
        return;
      }

      var actual = sheet.getRange(1, 1, 1, Math.max(lastColumn, headers.length))
        .getDisplayValues()[0]
        .slice(0, headers.length);

      var matches = headers.every(function(header, index) {
        return String(actual[index] || '').trim() === header;
      });

      if (!matches || lastColumn !== headers.length) {
        throw new Error(
          'HEADER_MISMATCH in ' + tableName +
          '. No data was changed. Expected: ' + headers.join(' | ') +
          '. Found: ' + actual.join(' | ')
        );
      }

      formatSetupHeader_(sheet, headers.length);
      report.push('Verified existing ' + tableName + ' (data preserved)');
    });

    PropertiesService.getScriptProperties()
      .setProperty('SNC_ACCOUNT_LINKING_SCHEMA_VERSION', SNC_SETUP.VERSION);

    var result = {
      success: true,
      schemaVersion: SNC_SETUP.VERSION,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      tables: Object.keys(SNC_SETUP.TABLES),
      actions: report
    };

    console.log(JSON.stringify(result, null, 2));
    return result;

  } finally {
    lock.releaseLock();
  }
}

function sheetIsCompletelyBlank_(sheet) {
  return sheet.getLastRow() === 0 ||
    (sheet.getLastRow() === 1 &&
     sheet.getLastColumn() === 0 &&
     sheet.getRange(1, 1).getDisplayValue() === '');
}

function formatSetupHeader_(sheet, columnCount) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight('bold')
    .setWrap(true);
  sheet.autoResizeColumns(1, columnCount);
}
