/**
 * SPORT NUTRITION CLASSROOM
 * POST-CLEANUP VERIFICATION — READ ONLY
 * Version 1.0.0 | Preview v1.2 | Exact 14-row cleanup
 *
 * Run ONLY SNC_PostCleanupVerification_READONLY_TEST().
 * This utility does not mutate Sheets/Properties, call handlers, or access
 * Drive, LINE, UrlFetch, triggers, deployments, or cleanup functions.
 * It verifies the persisted post-cleanup state; it never repairs or retries.
 */
var SNC_POST_CLEANUP_VERIFY_CONFIG_TEST = Object.freeze({
  VERSION: '1.0.0',
  TEST_SPREADSHEET_ID: '1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',
  ENVIRONMENT_PROPERTY: 'SNC_ITR_ENVIRONMENT',
  SPREADSHEET_PROPERTY: 'SNC_ITR_TEST_SPREADSHEET_ID',
  OFFERING_ID: '807e157d-436b-4f27-acfb-bc084a625637',
  ASSIGNMENTS: [
    'b018a6df-5ae3-4304-8573-6d0a90890534',
    'e405c32f-852a-4493-a2c1-2b83c8838296',
    'e98a8ff4-0c65-47b4-baee-bcfb81924de5',
    '3c140d03-2cc6-4378-b054-97254aefcf4b'
  ],
  GROUPS: [
    '6590bfca-b632-4051-a26b-319af25f382d',
    '31597565-51c6-4684-89b1-d75da8ddf870',
    'b5b6896b-4d80-49c9-87e5-b179a2d6eb46'
  ],
  MEMBERS: [
    'dc5afafa-27e2-407d-bd43-337c7bc3e14f',
    '61c8b2a1-f130-463d-9045-c18d34e453c1',
    'd6575a39-4164-4441-afeb-0887183f211a',
    '67a6977d-4ba0-4ad1-a0ae-940cd735404c',
    '6ea007f2-1763-403a-98db-1e4ba0878003',
    '9bf0497f-3410-44b0-97e1-4d4f91fd0be6',
    '92d06156-ee86-410f-9b3a-8aaf78151e80'
  ],
  EXPECTED_AUDIT_EVENTS: {
    'ASSIGNMENT_CREATED|Assignment':4,
    'ASSIGNMENT_UPDATED|Assignment':2,
    'ASSIGNMENT_OPENED|Assignment':2,
    'ASSIGNMENT_CLOSED|Assignment':2,
    'GROUP_CREATED|Group':3,
    'GROUP_MEMBER_JOINED|Group':4,
    'GROUP_REPRESENTATIVE_SELECTED|Group':1,
    'GROUP_MEMBER_LEFT|Group':1
  }
});

function SNC_PostCleanupVerification_READONLY_TEST() {
  var c=SNC_POST_CLEANUP_VERIFY_CONFIG_TEST;
  var out={
    runner:'SNC_PostCleanupVerification_READONLY_TEST',
    version:c.VERSION,
    preview:'SNC_SYNTHETIC_FIXTURE_CLEANUP_PREVIEW_v1.2',
    evidenceLevel:'READ_ONLY_POST_CLEANUP_STATE_VERIFICATION',
    mode:'READ_ONLY',
    writesExpected:0,
    externalCallsExpected:0,
    cleanupAuthorized:false,
    deletionPerformed:false,
    status:'BLOCKED',
    checks:[],
    counts:null,
    limitations:[
      'This verifier confirms the current state and exact-ID absence. It cannot independently reconstruct historical non-target row contents without a pre-cleanup full-row snapshot; the cleanup execution log is the evidence for its in-run preservation checks.',
      'This verifier does not test backup restoration, Web App end-to-end behavior, or Submission integration.'
    ]
  };
  function norm(v){return String(v===undefined||v===null?'':v).trim();}
  function check(id,ok,detail){out.checks.push({id:id,status:ok?'PASS':'BLOCKED',detail:detail});}
  function finish(){
    out.status=out.checks.length&&out.checks.every(function(x){return x.status==='PASS';})?'PASS':'REQUIRES_REVIEW';
    out.summary={
      pass:out.checks.filter(function(x){return x.status==='PASS';}).length,
      blocked:out.checks.filter(function(x){return x.status!=='PASS';}).length
    };
    out.cleanupAuthorized=false;
    out.deletionPerformed=false;
    Logger.log('SNC_POST_CLEANUP_VERIFICATION='+JSON.stringify(out));
    return out;
  }
  function readSheet(ss,name){
    var sh=ss.getSheetByName(name);
    if(!sh)throw new Error('Missing sheet: '+name);
    var values=sh.getDataRange().getDisplayValues();
    if(!values||!values.length||!values[0].length)throw new Error('Unreadable sheet: '+name);
    var headers=values[0].map(norm);
    if(headers.some(function(h){return !h;}))throw new Error('Blank header in '+name);
    var rows=[];
    for(var r=1;r<values.length;r++){
      if(!values[r].some(function(v){return norm(v)!=='';}))continue;
      var obj={};
      headers.forEach(function(h,i){obj[h]=norm(values[r][i]);});
      rows.push(obj);
    }
    return {sheet:sh,headers:headers,rows:rows,values:values};
  }
  function uniqueIds(rows,key){
    return rows.map(function(r){return norm(r[key]);}).filter(Boolean);
  }
  function allUnique(ids){return ids.length===ids.filter(function(x,i){return ids.indexOf(x)===i;}).length;}
  function hasAny(ids,candidates){return candidates.some(function(id){return ids.indexOf(id)>=0;});}
  try{
    var props=PropertiesService.getScriptProperties();
    var env=norm(props.getProperty(c.ENVIRONMENT_PROPERTY)).toUpperCase();
    var configured=norm(props.getProperty(c.SPREADSHEET_PROPERTY));
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var envOk=env==='TEST'&&configured===c.TEST_SPREADSHEET_ID&&ss&&ss.getId()===c.TEST_SPREADSHEET_ID;
    check('POST-01-TEST-IDENTITY',!!envOk,'TEST property, configured Spreadsheet ID and active Spreadsheet must match the approved TEST target.');
    if(!envOk)return finish();

    var requiredSheets=[
      'Users','Groups','GroupMembers','Submissions','SubmissionFiles','Grades',
      'GradeHistory','GradeReviewRequests','NotificationLogs','IdempotencyKeys',
      'StudentImport','LINEAccounts','EmailOTPChallenges','AuditLogs','Enrollments',
      'ImportJobs','ImportErrors','Assignments','UserRoles','Courses','Semesters',
      'CourseOfferings','CourseInstructors'
    ];
    var data={};
    requiredSheets.forEach(function(name){data[name]=readSheet(ss,name);});
    check('POST-02-SHEET-COVERAGE',requiredSheets.every(function(name){return Boolean(data[name]&&data[name].headers.length);}),
      'All 23 expected TEST tabs are readable with nonblank headers.');
    
    var targets=c.ASSIGNMENTS.concat(c.GROUPS,c.MEMBERS);
    var nonAuditMatches=[];
    requiredSheets.filter(function(n){return n!=='AuditLogs';}).forEach(function(name){
      var grid=data[name].values;
      grid.forEach(function(row,ri){
        row.forEach(function(cell,ci){
          var value=norm(cell);
          targets.forEach(function(id){
            if(value===id||value.indexOf(id)>=0)
              nonAuditMatches.push({sheet:name,row:ri+1,column:ci+1,id:id});
          });
        });
      });
    });
    check('POST-03-EXACT-ID-ABSENCE',nonAuditMatches.length===0,
      nonAuditMatches.length===0?'All 14 approved IDs are absent from every non-AuditLogs tab.':
      'One or more approved IDs remain outside AuditLogs: '+JSON.stringify(nonAuditMatches.slice(0,10)));

    var assignmentIds=uniqueIds(data.Assignments.rows,'AssignmentID');
    var groupIds=uniqueIds(data.Groups.rows,'GroupID');
    var memberIds=uniqueIds(data.GroupMembers.rows,'GroupMemberID');
    var exactCounts=assignmentIds.filter(function(id){return c.ASSIGNMENTS.indexOf(id)>=0;}).length===0&&
      groupIds.filter(function(id){return c.GROUPS.indexOf(id)>=0;}).length===0&&
      memberIds.filter(function(id){return c.MEMBERS.indexOf(id)>=0;}).length===0;
    check('POST-04-TARGET-TABLES',exactCounts&&groupIds.length===0&&memberIds.length===0,
      'No allowlisted Assignment/Group/GroupMember IDs remain; Groups and GroupMembers have no remaining rows.');
    
    var core=SNC_GetSyntheticFixtureManifest_TEST();
    var ext=SNC_GetAssignmentGroupManifest_TEST();
    var a=ext&&ext.success?ext.assignmentGroup:null;
    var continuation=a&&a.continuation;
    var manifestOk=core&&core.status==='CORE_FIXTURE_CREATED'&&Array.isArray(core.userIds)&&
      core.userIds.length===6&&String(core.offeringId)===c.OFFERING_ID&&a&&a.assignments&&a.groups&&
      continuation&&continuation.status==='COMPLETE_WITH_HISTORICAL_FAILURE';
    check('POST-05-MANIFEST-PRESERVATION',!!manifestOk,
      'Core fixture and Assignment/Group manifests remain available; historical continuation marker remains intact.');
    if(!manifestOk)return finish();

    var userIds=uniqueIds(data.Users.rows,'UserID');
    var enrollmentUsers=uniqueIds(data.Enrollments.rows,'UserID');
    var coreUsersOk=core.userIds.every(function(id){return userIds.indexOf(String(id))>=0;})&&
      core.userIds.every(function(id){return enrollmentUsers.indexOf(String(id))>=0;});
    var offeringRows=data.CourseOfferings.rows.filter(function(r){return norm(r.OfferingID)===c.OFFERING_ID;});
    check('POST-06-CORE-FIXTURE-PRESERVED',coreUsersOk&&offeringRows.length===1,
      'All six synthetic Users and Enrollments plus the exact CourseOffering remain present.');

    var audit=data.AuditLogs;
    var auditHeaders=['AuditID','ActorUserID','Action','EntityType','EntityID','DetailsJson','CreatedAt','RequestID'];
    var schemaOk=audit.headers.length===auditHeaders.length&&auditHeaders.every(function(h,i){return audit.headers[i]===h;});
    check('POST-07-AUDIT-SCHEMA',schemaOk,'AuditLogs retains the expected eight-column schema.');
    if(!schemaOk)return finish();

    var auditIds=uniqueIds(audit.rows,'AuditID');
    var baseline=(a.preBatchIds&&a.preBatchIds.AuditLogs||[]).map(String);
    var newRows=audit.rows.filter(function(r){return baseline.indexOf(norm(r.AuditID))<0;});
    var newIds=uniqueIds(newRows,'AuditID');
    var duplicates=auditIds.filter(function(id,i){return auditIds.indexOf(id)!==i;});
    var eventCounts={};
    newRows.forEach(function(r){
      var key=norm(r.Action)+'|'+norm(r.EntityType);
      eventCounts[key]=(eventCounts[key]||0)+1;
    });
    var expectedKeys=Object.keys(c.EXPECTED_AUDIT_EVENTS);
    var eventOk=newRows.length===19&&newIds.length===19&&duplicates.length===0&&baseline.length===49&&
      baseline.every(function(id){return auditIds.indexOf(id)>=0;})&&
      expectedKeys.every(function(k){return (eventCounts[k]||0)===c.EXPECTED_AUDIT_EVENTS[k];})&&
      Object.keys(eventCounts).every(function(k){return Object.prototype.hasOwnProperty.call(c.EXPECTED_AUDIT_EVENTS,k);});
    var assignmentManifestIds=Object.keys(a.assignments).map(function(k){return String(a.assignments[k]);});
    var groupManifestIds=['alpha','beta','solo'].map(function(k){return String(a.groups[k]&&a.groups[k].groupId||'');});
    var auditLinksOk=newRows.every(function(r){
      return norm(r.EntityType)==='Assignment'
        ? assignmentManifestIds.indexOf(norm(r.EntityID))>=0
        : norm(r.EntityType)==='Group'&&groupManifestIds.indexOf(norm(r.EntityID))>=0;
    });
    check('POST-08-AUDIT-PRESERVATION',auditIds.length===68&&eventOk&&auditLinksOk,
      'AuditLogs has 68 unique rows: all 49 baseline IDs and 19 post-baseline events remain; event matrix and entity links reconcile.');
    
    var expectedCoreIds=core.userIds.map(String);
    var allExpectedGroupIds=groupManifestIds;
    out.counts={
      tabsScanned:requiredSheets.length,
      assignmentsRemaining:assignmentIds.length,
      groupsRemaining:groupIds.length,
      groupMembersRemaining:memberIds.length,
      submissionsRows:data.Submissions.rows.length,
      auditLogsRows:audit.rows.length,
      auditLogsUniqueIds:auditIds.length,
      auditBaselineIds:baseline.length,
      auditPostBaselineIds:newIds.length,
      coreUsersPreserved:expectedCoreIds.filter(function(id){return userIds.indexOf(id)>=0;}).length,
      coreEnrollmentsPreserved:expectedCoreIds.filter(function(id){return enrollmentUsers.indexOf(id)>=0;}).length,
      courseOfferingMatches:offeringRows.length
    };
    out.historicalASG13=(a.cases||[]).some(function(x){return String(x.id)==='ASG-13'&&x.status==='FAIL';})?'FAIL_PRESERVED':'REQUIRES_REVIEW';
    out.continuationStatus=continuation.status;
    out.cleanupStatus='OWNER_LOG_REPORTED_COMPLETE';
    out.note='Current-state verification only. Refer to cleanup Execution Log for in-run non-target-row and full AuditLogs-grid preservation checks.';
  }catch(e){
    out.checks.push({id:'POST-CLEANUP-ERROR',status:'BLOCKED',detail:String(e&&e.message||e).slice(0,300)});
  }
  return finish();
}
