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
  IMPORT_HEADERS: ['STUDENT_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL'],
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
/**
 * Validates existing sheets before setup performs its first write.
 * Only documented additive legacy migrations are accepted.
 */
function validateSNCSchemaBeforeMigration_(ss){
  var issues=[];
  Object.keys(SNC_SETUP.TABLES).forEach(function(name){
    var sheet=ss.getSheetByName(name);if(!sheet)return;
    var expected=SNC_SETUP.TABLES[name],lastRow=sheet.getLastRow(),lastCol=sheet.getLastColumn();
    if(lastRow===0&&lastCol===0)return;
    var actual=lastCol?sheet.getRange(1,1,1,lastCol).getDisplayValues()[0].map(function(x){return String(x).trim();}):[];
    if(!actual.length){issues.push(name+': missing header row');return;}
    var legacy=false;
    if(name==='EmailOTPChallenges'&&actual.length===12)legacy=expected.slice(0,12).every(function(h,i){return actual[i]===h;});
    if(name==='Assignments'&&actual.length===16)legacy=expected.slice(0,16).every(function(h,i){return actual[i]===h;});
    var exact=actual.length===expected.length&&expected.every(function(h,i){return actual[i]===h;});
    if(!exact&&!legacy)issues.push(name+': HEADER_MISMATCH expected ['+expected.join('|')+'] found ['+actual.join('|')+']');
  });
  var imp=ss.getSheetByName(SNC_SETUP.IMPORT_SHEET);
  if(imp&&imp.getLastRow()>0){
    var h=imp.getRange(1,1,1,Math.max(1,imp.getLastColumn())).getDisplayValues()[0].map(function(v){return String(v).trim();});
    var canonical=h.length===4&&SNC_SETUP.IMPORT_HEADERS.every(function(v,i){return h[i]===v;});
    var legacy=h.length===3&&['EMAIL','DISPLAY_NAME','STUDENT_ID'].every(function(v,i){return h[i]===v;});
    if(!canonical&&!legacy)issues.push(SNC_SETUP.IMPORT_SHEET+': HEADER_MISMATCH expected canonical ['+SNC_SETUP.IMPORT_HEADERS.join('|')+'] or legacy [EMAIL|DISPLAY_NAME|STUDENT_ID], found ['+h.join('|')+']');
  }
  if(issues.length)throw new Error('SCHEMA_PREFLIGHT_FAILED. No migration writes were made. '+issues.join(' || '));
  return {success:true,mode:'PREFLIGHT',legacyAdditiveMigrations:['EmailOTPChallenges +3 columns','Assignments +6 columns']};
}

function setupAccountLinkingSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No active spreadsheet. Open this script from SportNutritionApp.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    validateSNCSchemaBeforeMigration_(ss);
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
      var importHeaders=importSheet.getRange(1,1,1,importSheet.getLastColumn()).getDisplayValues()[0].map(function(v){return String(v).trim();});
      var canonical=importHeaders.length===4&&SNC_SETUP.IMPORT_HEADERS.every(function(h,i){return importHeaders[i]===h;});
      var legacy=importHeaders.length===3&&['EMAIL','DISPLAY_NAME','STUDENT_ID'].every(function(h,i){return importHeaders[i]===h;});
      if(!canonical&&!legacy)throw new Error('HEADER_MISMATCH in StudentImport. Expected canonical '+SNC_SETUP.IMPORT_HEADERS.join(' | ')+' or supported legacy EMAIL | DISPLAY_NAME | STUDENT_ID.');
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
 * Canonical staging columns: STUDENT_ID | FIRST_NAME | LAST_NAME | EMAIL
 * Legacy EMAIL | DISPLAY_NAME | STUDENT_ID remains readable for existing staging sheets.
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

    var stagingHeaders=source.getRange(1,1,1,source.getLastColumn()).getDisplayValues()[0].map(function(v){return String(v).trim();});
    var canonicalImport=stagingHeaders.length===4&&['STUDENT_ID','FIRST_NAME','LAST_NAME','EMAIL'].every(function(h,i){return stagingHeaders[i]===h;});
    var legacyImport=stagingHeaders.length===3&&['EMAIL','DISPLAY_NAME','STUDENT_ID'].every(function(h,i){return stagingHeaders[i]===h;});
    if(!canonicalImport&&!legacyImport)throw new Error('StudentImport headers do not match canonical or supported legacy format.');
    var rows=source.getRange(2,1,sourceLastRow-1,stagingHeaders.length).getDisplayValues().map(function(values,index){return {values:values,rowNumber:index+2};}).filter(function(item){return item.values.some(function(v){return String(v).trim()!=='';});});

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
    rows.forEach(function(item) {
      var r=item.values,rowNo=item.rowNumber,email,studentId,firstName,lastName;
      if(canonicalImport){
        studentId=String(r[0]||'').trim();firstName=String(r[1]||'').trim();
        lastName=String(r[2]||'').trim();email=String(r[3]||'').trim().toLowerCase();
      }else{
        email=String(r[0]||'').trim().toLowerCase();studentId=String(r[2]||'').trim();
        var display=String(r[1]||'').trim();
        ['นางสาว','นาย','นาง','น.ส.'].some(function(prefix){
          if(display.indexOf(prefix)===0){display=display.slice(prefix.length).trim();return true;}
          return false;
        });
        var parts=display.split(/\\s+/);
        if(parts.length>=2){firstName=parts[0];lastName=parts.slice(1).join(' ');}
      }
      if(!email||!firstName||!lastName||!studentId){errors.push('Row '+rowNo+': missing STUDENT_ID, FIRST_NAME, LAST_NAME, or EMAIL (legacy rows must contain a parseable full name).');return;}
      if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){errors.push('Row '+rowNo+': invalid email format');return;}
      if(!/^\\d+$/.test(studentId)){errors.push('Row '+rowNo+': STUDENT_ID must contain digits only');return;}
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
        'STU_'+studentId, studentId, firstName, lastName,
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
 * Read-only schema inspection. Does not create, rename, format, or modify sheets.
 * Run before setupAccountLinkingSheets() when validating an existing TEST database.
 */
function inspectSNCDatabaseSchema(){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)throw new Error('No active spreadsheet is available.');
  var report={success:true,mode:'READ_ONLY_SCHEMA_INSPECTION',schemaVersion:SNC_SETUP.VERSION,spreadsheetId:ss.getId(),spreadsheetName:ss.getName(),tables:[],missingTables:[],headerMismatches:[],extraColumns:[]};
  Object.keys(SNC_SETUP.TABLES).forEach(function(name){
    var expected=SNC_SETUP.TABLES[name],sheet=ss.getSheetByName(name);
    if(!sheet){
      report.missingTables.push(name);
      report.tables.push({name:name,status:'MISSING',expectedColumns:expected.length,actualColumns:0,rowCount:0});
      return;
    }
    var lastColumn=sheet.getLastColumn(),lastRow=sheet.getLastRow();
    var actual=lastColumn>0?sheet.getRange(1,1,1,lastColumn).getDisplayValues()[0].map(function(x){return String(x).trim();}):[];
    var missing=expected.filter(function(h){return actual.indexOf(h)<0;});
    var unexpected=actual.filter(function(h){return h&&expected.indexOf(h)<0;});
    var orderMatches=actual.length>=expected.length&&expected.every(function(h,i){return actual[i]===h;});
    var status=actual.length===0?'EMPTY':(orderMatches&&unexpected.length===0?'MATCH':'MISMATCH');
    var item={name:name,status:status,expectedColumns:expected.length,actualColumns:actual.length,rowCount:Math.max(0,lastRow-1),missingHeaders:missing,unexpectedHeaders:unexpected,actualHeaders:actual};
    report.tables.push(item);
    if(status==='MISMATCH'||status==='EMPTY')report.headerMismatches.push(item);
    if(unexpected.length)report.extraColumns.push({name:name,headers:unexpected});
  });
  report.success=report.missingTables.length===0&&report.headerMismatches.length===0;
  report.summary={expectedTables:Object.keys(SNC_SETUP.TABLES).length,matched:report.tables.filter(function(x){return x.status==='MATCH';}).length,missing:report.missingTables.length,mismatched:report.headerMismatches.length};
  console.log(JSON.stringify(report,null,2));
  return report;
}
