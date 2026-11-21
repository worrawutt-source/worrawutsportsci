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
  VERSION: '1.5.0',
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
    Assignments: ['AssignmentID','OfferingID','Title','Description','Instructions','MaxScore','Deadline','SubmissionType','MinGroupMembers','MaxGroupMembers','Status','OpenedAt','ClosedAt','CreatedAt','UpdatedAt','CreatedByUserID','AutoOpenEnabled','ScheduledOpenAt','AutoOpenProcessedAt','AutoCloseEnabled','ScheduledCloseAt','AutoCloseProcessedAt'],
    Enrollments: ['EnrollmentID','OfferingID','UserID','Status','EnrolledAt','CreatedAt','UpdatedAt'],
    ImportJobs: ['ImportJobID','OfferingID','FileName','Status','TotalRows','SuccessCount','ErrorCount','CreatedByUserID','CreatedAt','CompletedAt'],
    ImportErrors: ['ImportErrorID','ImportJobID','RowNumber','StudentID','ErrorCode','ErrorMessage','CreatedAt'],
    Groups: ['GroupID','OfferingID','GroupName','CreatedByUserID','MembershipLockedAt','Status','CreatedAt','UpdatedAt'],
    GroupMembers: ['GroupMemberID','GroupID','UserID','MemberRole','JoinedAt','LeftAt','Status'],
    Submissions: ['SubmissionID','AssignmentID','SubmissionType','StudentUserID','GroupID','SubmittedByUserID','SubmittedAt','SubmissionStatus','RevisionNumber','PreviousSubmissionID','CreatedAt'],
    SubmissionFiles: ['SubmissionFileID','SubmissionID','FileName','MimeType','FileSize','DriveFileID','DriveUrl','UploadedByUserID','CreatedAt'],
    Grades: ['GradeID','SubmissionID','Score','Feedback','GradedByUserID','GradedAt','UpdatedAt'],
    GradeHistory: ['GradeHistoryID','GradeID','OldScore','NewScore','OldFeedback','NewFeedback','ChangedByUserID','ChangeReason','ChangedAt'],
    GradeReviewRequests: ['ReviewRequestID','GradeID','StudentUserID','RequestText','Status','InstructorResponse','ReviewedByUserID','CreatedAt','UpdatedAt'],
    NotificationLogs: ['NotificationID','UserID','EventType','RelatedEntityType','RelatedEntityID','Message','Status','SentAt','ErrorCode','CreatedAt'],
    IdempotencyKeys: ['IdempotencyKey','UserID','Action','RequestHash','ResponseJson','CreatedAt','ExpiresAt']
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

      // Additive Assignment scheduling migration. Preserve all existing rows and values.
      if (tableName === 'Assignments' && lastColumn === 16) {
        var scheduleHeaders = headers.slice(16);
        sheet.getRange(1, 17, 1, scheduleHeaders.length).setValues([scheduleHeaders]);
        if (lastRow > 1) {
          var defaults = [];
          for (var assignmentRow = 2; assignmentRow <= lastRow; assignmentRow++) {
            defaults.push([false, '', '', false, '', '']);
          }
          sheet.getRange(2, 17, defaults.length, 6).setValues(defaults);
        }
        lastColumn = sheet.getLastColumn();
        report.push('Added six Assignment scheduling columns; existing assignments preserved with automation disabled');
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
