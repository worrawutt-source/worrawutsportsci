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
  VERSION: '1.3.0',
  IMPORT_SHEET: 'StudentImport',
  IMPORT_HEADERS: ['EMAIL', 'DISPLAY_NAME', 'STUDENT_ID'],
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
      'RequestID',
      'Purpose',
      'UserID',
      'NewEmail'
    ],
    AuditLogs: [
      'AuditID','ActorUserID','Action','EntityType','EntityID','DetailsJson','CreatedAt','RequestID'
    ],
    UserRoles: ['UserRoleID','UserID','Role','ScopeType','ScopeID','Status','CreatedAt','UpdatedAt','CreatedByUserID'],
    Courses: ['CourseID','CourseCode','CourseName','Description','Status','CreatedAt','UpdatedAt','CreatedByUserID'],
    Semesters: ['SemesterID','AcademicYear','Term','StartDate','EndDate','Status','CreatedAt','UpdatedAt','CreatedByUserID'],
    CourseOfferings: ['OfferingID','CourseID','SemesterID','Section','Status','CreatedAt','UpdatedAt','CreatedByUserID'],
    CourseInstructors: ['CourseInstructorID','OfferingID','InstructorUserID','AssignedByUserID','Status','CreatedAt','UpdatedAt'],
    Assignments: ['AssignmentID','OfferingID','Title','Description','Instructions','MaxScore','Deadline','SubmissionType','MinGroupMembers','MaxGroupMembers','Status','OpenedAt','ClosedAt','CreatedAt','UpdatedAt','CreatedByUserID']
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

    // Create a clearly named staging sheet for importing the supplied Excel/CSV.
    var importSheet = ss.getSheetByName(SNC_SETUP.IMPORT_SHEET);
    if (!importSheet) {
      importSheet = ss.insertSheet(SNC_SETUP.IMPORT_SHEET);
      importSheet.getRange(1, 1, 1, SNC_SETUP.IMPORT_HEADERS.length)
        .setValues([SNC_SETUP.IMPORT_HEADERS]);
      formatSetupHeader_(importSheet, SNC_SETUP.IMPORT_HEADERS.length);
      report.push('Created StudentImport staging sheet');
    } else {
      var importHeaders = importSheet.getRange(1, 1, 1, SNC_SETUP.IMPORT_HEADERS.length).getDisplayValues()[0];
      if (!SNC_SETUP.IMPORT_HEADERS.every(function(h, i) { return String(importHeaders[i]).trim() === h; })) {
        throw new Error('HEADER_MISMATCH in StudentImport. Expected: ' + SNC_SETUP.IMPORT_HEADERS.join(' | '));
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

      // Additive migration for EmailOTPChallenges only. Existing challenge data is retained.
      if (tableName === 'EmailOTPChallenges' && lastColumn === 12) {
        var extraHeaders = headers.slice(12);
        sheet.getRange(1, 13, 1, extraHeaders.length).setValues([extraHeaders]);
        lastColumn = sheet.getLastColumn();
        report.push('Added EmailOTPChallenges purpose/user/email columns (data preserved)');
      }

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


/**
 * Imports rows from StudentImport into Users.
 * Expected staging columns: EMAIL | DISPLAY_NAME | STUDENT_ID
 * Existing users are never overwritten. Exact duplicates are skipped;
 * conflicting duplicate StudentID or Email values stop the import.
 */
function importStudentsFromStaging() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var source = ss && ss.getSheetByName(SNC_SETUP.IMPORT_SHEET);
  var users = ss && ss.getSheetByName('Users');
  if (!source || !users) throw new Error('Required sheets StudentImport and Users were not found.');

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sourceLastRow = source.getLastRow();
    if (sourceLastRow < 2) throw new Error('StudentImport has no student rows.');

    var rows = source.getRange(2, 1, sourceLastRow - 1, 3).getDisplayValues()
      .filter(function(r) { return r.some(function(v) { return String(v).trim() !== ''; }); });

    var userHeaders = users.getRange(1, 1, 1, users.getLastColumn()).getDisplayValues()[0];
    var required = ['UserID','StudentID','FirstName','LastName','Email','Status','CreatedAt','UpdatedAt'];
    if (userHeaders.length !== required.length || !required.every(function(h,i){return userHeaders[i]===h;})) {
      throw new Error('Users header does not match the approved setup schema.');
    }

    var existing = users.getLastRow() > 1
      ? users.getRange(2,1,users.getLastRow()-1,required.length).getDisplayValues() : [];
    var byId = {}, byEmail = {};
    existing.forEach(function(r) {
      var id=String(r[1]).trim(), email=String(r[4]).trim().toLowerCase();
      if (id) byId[id]=r;
      if (email) byEmail[email]=r;
    });

    var seenIds={}, seenEmails={}, additions=[], skipped=0, errors=[];
    rows.forEach(function(r, index) {
      var email=String(r[0]||'').trim().toLowerCase();
      var display=String(r[1]||'').trim();
      var studentId=String(r[2]||'').trim();
      var rowNo=index+2;
      if (!email || !display || !studentId) { errors.push('Row '+rowNo+': missing EMAIL, DISPLAY_NAME, or STUDENT_ID'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors.push('Row '+rowNo+': invalid email format'); return; }
      if (!/^\d+$/.test(studentId)) { errors.push('Row '+rowNo+': STUDENT_ID must contain digits only'); return; }
      var m=display.match(/^(นาย|นางสาว|นาง|น\.ส\.)\s*(.+)$/);
      if (!m) { errors.push('Row '+rowNo+': cannot parse name prefix: '+display); return; }
      var parts=m[2].trim().split(/\s+/);
      if (parts.length < 2) { errors.push('Row '+rowNo+': name must contain first and last name'); return; }
      if (seenIds[studentId] || seenEmails[email]) { errors.push('Row '+rowNo+': duplicate StudentID or Email in import file'); return; }
      seenIds[studentId]=true; seenEmails[email]=true;

      var oldById=byId[studentId], oldByEmail=byEmail[email];
      if (oldById || oldByEmail) {
        if (oldById && oldByEmail && oldById[0]===oldByEmail[0] &&
            String(oldById[4]).trim().toLowerCase()===email) {
          skipped++;
        } else {
          errors.push('Row '+rowNo+': StudentID or Email already belongs to another account');
        }
        return;
      }

      var now=new Date();
      additions.push([
        'STU_'+studentId, studentId, parts[0], parts.slice(1).join(' '),
        email, 'ACTIVE', now, now
      ]);
    });

    if (errors.length) {
      throw new Error('Import cancelled; no rows were written.\n'+errors.join('\n'));
    }
    if (additions.length) {
      users.getRange(users.getLastRow()+1,1,additions.length,required.length).setValues(additions);
    }
    var result={success:true, imported:additions.length, skippedExisting:skipped, totalRows:rows.length};
    console.log(JSON.stringify(result,null,2));
    return result;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Creates and fills the StudentImport staging sheet with the verified
 * initial batch. Does not overwrite an existing staging sheet or its data.
 * After review, run importStudentsFromStaging().
 */
function prepareInitialStudentImport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No active spreadsheet.');

  var sheet = ss.getSheetByName(SNC_SETUP.IMPORT_SHEET);
  if (sheet) {
    throw new Error('StudentImport already exists. Review it; this function will not overwrite it.');
  }

  var rows = [
    ['EMAIL', 'DISPLAY_NAME', 'STUDENT_ID'],
    ['0940270520t@gmail.com', 'นาย ภัสกร ชุนท่าไม้', '67042950106'],
    ['kanidtaa69@gmail.com', 'นางสาว ขณิษฐา บุญมาก', '67042950101'],
    ['tun12344qwe@gmail.com', 'นาย ชิษณุพงศ์ ปาลี', '67042950108'],
    ['pranpreeya2249@gmail.com', 'นางสาว ปราณปริยา บุญแก้ว', '67042950114'],
    ['garfieldmanz8@gmail.com', 'นาย ณัฐภัทร ม่านแก้ว', '67042950109'],
    ['wongsakorn6724@gmail.com', 'นาย วงศกร วันเสาร์', '67042950123'],
    ['nateekan0644@gmail.com', 'นาย นทีกานต์ จันทร์ฤทธิ์', '67042950111'],
    ['sethiyrphngstapla800@gmail.com', 'นาย เสถียรพงษ์ ตาปลา', '67042950128'],
    ['patiwat9937@gmail.com', 'นาย ปฏิวัติ บรรพตาธิ', '67042950136'],
    ['supitchaya4459@gmail.com', 'นางสาว สุพิชญา เสงี่ยมโปร่ง', '67042950137'],
    ['kaewkaworachet19@gmail.com', 'นาย วรเชษฐ์ แก้วก่า', '67042950124'],
    ['banswntx003@gmail.com', 'นาย นิพิฐพันธ์ ตนดี', '67042950112'],
    ['nopparat291148@gmail.com', 'นาย นพรัตน์ นันตะสุคนธ์', '67042950122'],
    ['plaijj06@gmail.com', 'นางสาว มลิตา แก้วอาณา', '67042950135'],
    ['mingpuunpha1649@gmail.com', 'นางสาว ปุณณภา ศรีจันทร์ทับ', '67042950105']
  ];

  sheet = ss.insertSheet(SNC_SETUP.IMPORT_SHEET);
  sheet.getRange(1, 1, rows.length, rows[0].length).setNumberFormat('@');
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  sheet.autoResizeColumns(1, 3);

  var result = {
    success: true,
    stagingSheet: SNC_SETUP.IMPORT_SHEET,
    importedToStaging: rows.length - 1,
    message: 'Review StudentImport, then run importStudentsFromStaging().'
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
