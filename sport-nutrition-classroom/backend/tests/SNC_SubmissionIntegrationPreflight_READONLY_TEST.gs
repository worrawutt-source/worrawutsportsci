/**
 * SPORT NUTRITION CLASSROOM — Submission Integration Read-only Preflight
 * Version 1.0.0 | WP-SUB-0
 * No writes, no Drive, no LINE, no UrlFetch, no triggers, no migration, no deployment.
 */
var SNC_SUB_PREFLIGHT_CONFIG_TEST = Object.freeze({
  VERSION:'1.0.0',
  ENVIRONMENT_PROPERTY:'SNC_ITR_ENVIRONMENT',
  SPREADSHEET_PROPERTY:'SNC_ITR_TEST_SPREADSHEET_ID',
  TEST_SPREADSHEET_ID:'1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',
  CORE_MANIFEST_PROPERTY:'SNC_SYNTHETIC_FIXTURE_MANIFEST_TEST',
  SUBMISSION_MANIFEST_PROPERTY:'SNC_SUBMISSION_INTEGRATION_MANIFEST_TEST',
  PREFIX:'SNC_TST_20261124_SUB_',
  EXPECTED_SOURCE:{
    SubmissionManagement:'ef4b86678e8c1feeea425ba578501846129a229c',
    FileManagement:'86cd29160dd00207c9a575ce801da09e643911cb',
    GroupManagement:'9dc280d88bcee8e346d028082cae725fe2d88ee8',
    AssignmentManagement:'460c7a0eb244fa5a85239d0e2f531404d58601d8',
    Code:'7c9928f7ae269287d1537dec6256dce13783d26d'
  },
  HEADERS:{
    Users:['UserID','FirstName','LastName','Email','Status'],
    Enrollments:['EnrollmentID','OfferingID','UserID','Status'],
    CourseOfferings:['OfferingID','CourseID','SemesterID','InstructorUserID','Status'],
    Assignments:['AssignmentID','OfferingID','Title','Description','Instructions','MaxScore','Deadline','SubmissionType','MinGroupMembers','MaxGroupMembers','Status','OpenedAt','ClosedAt','CreatedAt','UpdatedAt','CreatedByUserID','AutoOpenEnabled','ScheduledOpenAt','AutoOpenProcessedAt','AutoCloseEnabled','ScheduledCloseAt','AutoCloseProcessedAt'],
    Groups:['GroupID','OfferingID','GroupName','CreatedByUserID','MembershipLockedAt','Status','CreatedAt','UpdatedAt'],
    GroupMembers:['GroupMemberID','GroupID','UserID','MemberRole','JoinedAt','LeftAt','Status'],
    Submissions:['SubmissionID','AssignmentID','SubmissionType','StudentUserID','GroupID','SubmittedByUserID','SubmittedAt','SubmissionStatus','RevisionNumber','PreviousSubmissionID','CreatedAt'],
    SubmissionFiles:['SubmissionFileID','SubmissionID','FileName','MimeType','FileSize','DriveFileID','DriveUrl','UploadedByUserID','CreatedAt'],
    IdempotencyKeys:['IdempotencyKey','UserID','Action','RequestHash','ResponseJson','CreatedAt','ExpiresAt'],
    AuditLogs:['AuditID','ActorUserID','Action','EntityType','EntityID','DetailsJson','CreatedAt','RequestID']
  }
});

function SNC_SubmissionIntegrationPreflight_READONLY_TEST(){
  var c=SNC_SUB_PREFLIGHT_CONFIG_TEST;
  var r={runner:'SNC_SubmissionIntegrationPreflight_READONLY_TEST',version:c.VERSION,
    mode:'READ_ONLY_SUBMISSION_INTEGRATION_PREFLIGHT',
    evidenceLevel:'READ_ONLY_TEST_ENVIRONMENT_SOURCE_AND_DATA_READINESS',
    writesExpected:0,externalCallsExpected:0,status:'BLOCKED',checks:[]};
  function check(id,ok,detail){r.checks.push({id:id,status:ok?'PASS':'BLOCKED',detail:String(detail||'').slice(0,260)});}
  function headers(name){
    var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    return sh&&sh.getLastColumn()>0?sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0]:[];
  }
  function rows(name){
    var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if(!sh)throw new Error('MISSING_SHEET:'+name);
    var values=sh.getDataRange().getValues();
    if(values.length<2)return [];
    var h=values[0].map(String);
    return values.slice(1).filter(function(row){return row.some(function(v){return v!==''&&v!==null;});})
      .map(function(row){var o={};h.forEach(function(k,i){o[k]=row[i];});return o;});
  }
  function one(name,key,id){return rows(name).filter(function(x){return String(x[key])===String(id);});}
  function finish(){
    var pass=r.checks.filter(function(x){return x.status==='PASS';}).length;
    var blocked=r.checks.filter(function(x){return x.status!=='PASS';}).length;
    r.summary={pass:pass,blocked:blocked,total:r.checks.length};
    r.status=blocked===0?'READY':'BLOCKED';
    Logger.log('SNC_SUBMISSION_PREFLIGHT='+JSON.stringify(r));
    return r;
  }
  try{
    var props=PropertiesService.getScriptProperties();
    var env=props.getProperty(c.ENVIRONMENT_PROPERTY);
    var configured=props.getProperty(c.SPREADSHEET_PROPERTY);
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var envOk=env==='TEST'&&configured===c.TEST_SPREADSHEET_ID&&ss&&ss.getId()===c.TEST_SPREADSHEET_ID;
    check('ENV-01',envOk,'TEST environment property, configured Spreadsheet ID and active Spreadsheet identity must all match exactly.');
    if(!envOk)return finish();

    var coreRaw=props.getProperty(c.CORE_MANIFEST_PROPERTY),core=null;
    try{core=coreRaw?JSON.parse(coreRaw):null;}catch(e){}
    var coreOk=Boolean(core&&core.status==='CORE_FIXTURE_CREATED'&&core.offeringId&&
      Array.isArray(core.userIds)&&core.userIds.length===6&&Array.isArray(core.enrollmentIds)&&core.enrollmentIds.length===6);
    check('CORE-MANIFEST-01',coreOk,'Existing Core Fixture manifest must contain one offering, six users and six enrollments.');
    if(!coreOk)return finish();

    var prior=props.getProperty(c.SUBMISSION_MANIFEST_PROPERTY);
    check('MANIFEST-01',!prior,'No prior Submission Integration manifest may exist. Existing manifest requires reconciliation; never overwrite it.');
    if(prior)return finish();

    var schemaOk=true,schemaIssues=[];
    Object.keys(c.HEADERS).forEach(function(name){
      var actual=headers(name),expected=c.HEADERS[name];
      if(actual.length!==expected.length||!expected.every(function(v,i){return actual[i]===v;})){
        schemaOk=false;schemaIssues.push(name);
      }
    });
    check('SCHEMA-01',schemaOk,schemaOk?'All ten required table headers match the inspected development source.':'Header mismatch or missing sheet: '+schemaIssues.join(', '));

    var oRows=one('CourseOfferings','OfferingID',core.offeringId);
    var offeringOk=oRows.length===1&&String(oRows[0].Status).toUpperCase()==='ACTIVE';
    check('OFFERING-01',offeringOk,'Core CourseOffering exists exactly once and is ACTIVE.');

    var userRows=rows('Users'),enrollmentRows=rows('Enrollments');
    var usersOk=core.userIds.every(function(id){return userRows.filter(function(x){return String(x.UserID)===String(id)&&String(x.Status).toUpperCase()==='ACTIVE';}).length===1;});
    var enrollmentsOk=core.enrollmentIds.every(function(id){return enrollmentRows.filter(function(x){return String(x.EnrollmentID)===String(id)&&String(x.OfferingID)===String(core.offeringId)&&String(x.Status).toUpperCase()==='ACTIVE';}).length===1;});
    check('USERS-01',usersOk,'All six Core Fixture users resolve exactly once and remain ACTIVE.');
    check('ENROLLMENTS-01',enrollmentsOk,'All six Core Fixture enrollments resolve exactly once in the Core Offering and remain ACTIVE.');

    var actorRows=userRows.filter(function(x){return String(x.Status).toUpperCase()==='ACTIVE';});
    var systemAdmin=typeof cmRows_==='function'&&typeof cmSystem_==='function';
    var adminFound=false;
    if(systemAdmin){
      try{
        var roles=rows('UserRoles');
        adminFound=roles.some(function(x){return String(x.Status).toUpperCase()==='ACTIVE'&&String(x.Role).toUpperCase()==='SYSTEM_ADMIN'&&actorRows.some(function(u){return String(u.UserID)===String(x.UserID);});});
      }catch(e){adminFound=false;}
    }
    check('ACTOR-01',adminFound,'An existing active SYSTEM_ADMIN UserRole and matching active User must exist; no synthetic administrator is created.');

    var functionsOk=typeof handleSubmissionManagementAction_==='function'&&
      typeof handleAssignmentManagementAction_==='function'&&
      typeof handleGroupManagementAction_==='function'&&
      typeof appendAudit_==='function'&&
      typeof notifySubmissionReceived_==='function'&&
      typeof smValidateTarget_==='function'&&
      typeof smCreateRevision_==='function';
    check('HANDLERS-01',functionsOk,'Required Submission, Assignment, Group, Audit and notification hook functions must be loaded in this GAS project.');

    var collision=false,collisionSheets=[];
    ['Assignments','Groups','GroupMembers','Submissions','SubmissionFiles','IdempotencyKeys'].forEach(function(name){
      var found=rows(name).some(function(row){return Object.keys(row).some(function(k){return String(row[k]||'').indexOf(c.PREFIX)===0;});});
      if(found){collision=true;collisionSheets.push(name);}
    });
    check('PREFIX-01',!collision,collision?'Reserved Submission test prefix already exists in: '+collisionSheets.join(', '):'Reserved Submission prefix is absent from all downstream tables.');

    var priorSubmissionData=rows('Submissions').filter(function(x){
      return core.userIds.indexOf(String(x.StudentUserID))>=0||core.userIds.indexOf(String(x.SubmittedByUserID))>=0;
    });
    check('SUBMISSION-BASELINE-01',priorSubmissionData.length===0,
      priorSubmissionData.length===0?'No existing Submission row references Core Fixture students.':'Existing Core Fixture Submission rows require reconciliation before starting.');

    var audit=rows('AuditLogs'),auditIds=audit.map(function(x){return String(x.AuditID||'');});
    var auditUnique=auditIds.length===new Set(auditIds).size&&auditIds.every(Boolean);
    check('AUDIT-BASELINE-01',auditUnique,'Existing AuditLogs primary IDs are nonblank and unique; all rows will be preserved.');
    r.baselineCounts={
      Users:userRows.length,Enrollments:enrollmentRows.length,Assignments:rows('Assignments').length,
      Groups:rows('Groups').length,GroupMembers:rows('GroupMembers').length,
      Submissions:rows('Submissions').length,SubmissionFiles:rows('SubmissionFiles').length,
      IdempotencyKeys:rows('IdempotencyKeys').length,AuditLogs:audit.length
    };
    r.coreFixture={studentCount:core.userIds.length,offeringSuffix:String(core.offeringId).slice(-6)};
    r.expectedSource=c.EXPECTED_SOURCE;
    r.sourceSyncNote='Expected GitHub development blob SHAs are reported for owner comparison. Apps Script editor source cannot be independently read by this helper.';
    r.scope='WP-SUB-0 READ-ONLY ONLY. No fixtures or business handlers were invoked.';
  }catch(e){
    r.checks.push({id:'PREFLIGHT-ERROR',status:'BLOCKED',detail:String(e&&e.message||e).slice(0,240)});
  }
  return finish();
}
