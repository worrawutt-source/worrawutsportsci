/**
 * SPORT NUTRITION CLASSROOM — Exact-ID Inventory (READ ONLY)
 * Version 1.0.0 | Owner-side TEST inventory; not a cleanup function.
 *
 * Reads the persisted core + Assignment/Group manifests and current TEST tables.
 * Emits exact synthetic primary IDs and dependency findings for owner review.
 * No Sheets/Properties/Drive/trigger/LINE writes; no handlers; no deletion.
 *
 * Prerequisites: existing SNC_AssignmentGroupIntegrationRunner_TEST.gs helpers
 * and the core/Assignment-Group manifest getter functions remain in the TEST GAS.
 */
var SNC_EID_CONFIG_TEST = Object.freeze({
  VERSION:'1.0.0',
  TEST_SPREADSHEET_ID:'1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',
  ENVIRONMENT_PROPERTY:'SNC_ITR_ENVIRONMENT',
  SPREADSHEET_PROPERTY:'SNC_ITR_TEST_SPREADSHEET_ID',
  PREFIX:'SNC_TST_20261122_'
});

function SNC_ExactIdInventory_READONLY_TEST() {
  // SAFE OUTPUT: exact IDs are compared only in memory and are never placed in
  // Logger output or the returned report. This function is still READ ONLY.
  var out={
    runner:'SNC_ExactIdInventory_READONLY_TEST',
    version:SNC_EID_CONFIG_TEST.VERSION,
    evidenceLevel:'READ_ONLY_EXACT_SET_RECONCILIATION_SANITIZED',
    mode:'READ_ONLY',
    writesExpected:0,
    externalCallsExpected:0,
    status:'BLOCKED',
    checks:[],
    inventorySummary:null
  };
  function check(id,ok,detail){
    out.checks.push({id:id,status:ok?'PASS':'BLOCKED',detail:detail});
  }
  function finish(){
    out.status=out.checks.length&&out.checks.every(function(x){return x.status==='PASS';})?'PASS':'REQUIRES_REVIEW';
    out.summary={
      pass:out.checks.filter(function(x){return x.status==='PASS';}).length,
      blocked:out.checks.filter(function(x){return x.status!=='PASS';}).length
    };
    // Only sanitized counts/status leave this function. No raw IDs or mappings.
    Logger.log('SNC_EXACT_ID_INVENTORY_SANITIZED='+JSON.stringify(out));
    return out;
  }
  try {
    var props=PropertiesService.getScriptProperties();
    var env=String(props.getProperty(SNC_EID_CONFIG_TEST.ENVIRONMENT_PROPERTY)||'').trim().toUpperCase();
    var configured=String(props.getProperty(SNC_EID_CONFIG_TEST.SPREADSHEET_PROPERTY)||'').trim();
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var envOk=env==='TEST'&&configured===SNC_EID_CONFIG_TEST.TEST_SPREADSHEET_ID&&
      Boolean(ss)&&ss.getId()===SNC_EID_CONFIG_TEST.TEST_SPREADSHEET_ID;
    check('ENV-01',envOk,'Exact approved TEST environment and active Spreadsheet identity verified.');
    if(!envOk)return finish();

    var core=SNC_GetSyntheticFixtureManifest_TEST();
    var ext=SNC_GetAssignmentGroupManifest_TEST();
    var a=ext&&ext.success?ext.assignmentGroup:null;
    var manifestOk=core&&core.status==='CORE_FIXTURE_CREATED'&&
      core.offeringId&&Array.isArray(core.userIds)&&core.userIds.length===6&&
      Array.isArray(core.enrollmentIds)&&core.enrollmentIds.length===6&&
      a&&a.preBatchIds&&a.assignments&&a.groups&&
      a.status==='IN_PROGRESS'&&a.continuation&&
      a.continuation.status==='COMPLETE_WITH_HISTORICAL_FAILURE';
    check('MANIFEST-01',Boolean(manifestOk),
      manifestOk?'Core and Assignment/Group manifests resolve with expected continuation state.':
      'Required manifests or expected continuation state are missing/inconsistent.');
    if(!manifestOk)return finish();

    var expectedAssignments=Object.keys(a.assignments).map(function(k){return String(a.assignments[k]);});
    var expectedGroups=Object.keys(a.groups).map(function(k){return String(a.groups[k].groupId);});
    var expectedMembers=[];
    Object.keys(a.groups).forEach(function(k){
      expectedMembers=expectedMembers.concat((a.groups[k].memberIds||[]).map(String));
    });
    var base=a.preBatchIds;
    var currentIds=sncAGR_ids_TEST_(ss);
    var assignmentDelta=currentIds.Assignments.map(String).filter(function(id){return (base.Assignments||[]).map(String).indexOf(id)<0;});
    var groupDelta=currentIds.Groups.map(String).filter(function(id){return (base.Groups||[]).map(String).indexOf(id)<0;});
    var memberDelta=currentIds.GroupMembers.map(String).filter(function(id){return (base.GroupMembers||[]).map(String).indexOf(id)<0;});

    function unique(arr){return arr.length===arr.filter(function(v,i){return arr.indexOf(v)===i;}).length;}
    function sameSet(actual,expected){
      return actual.length===expected.length&&unique(actual)&&unique(expected)&&
        expected.every(function(id){return actual.indexOf(id)>=0;})&&
        actual.every(function(id){return expected.indexOf(id)>=0;});
    }
    var idsOk=sameSet(assignmentDelta,expectedAssignments)&&
      sameSet(groupDelta,expectedGroups)&&sameSet(memberDelta,expectedMembers)&&
      expectedAssignments.length===4&&expectedGroups.length===3&&expectedMembers.length===7;
    check('PRIMARY-IDS-01',idsOk,
      idsOk?'Exact primary-ID sets match manifests (4 Assignments, 3 Groups, 7 GroupMembers); identifiers withheld.':
      'Exact primary-ID set comparison failed; identifiers withheld and no cleanup candidates produced.');

    var assignmentRows=sncAGR_rows_TEST_(ss,'Assignments');
    var groupRows=sncAGR_rows_TEST_(ss,'Groups');
    var memberRows=sncAGR_rows_TEST_(ss,'GroupMembers');
    var submissionRows=sncAGR_rows_TEST_(ss,'Submissions');
    function exactlyOne(rows,key,id){
      var found=rows.filter(function(r){return String(r[key])===String(id);});
      return found.length===1?found[0]:null;
    }
    var assignmentRecords=expectedAssignments.map(function(id){
      var r=exactlyOne(assignmentRows,'AssignmentID',id);
      return r?{
        primaryKey:String(r.AssignmentID),
        offeringId:String(r.OfferingID||''),
        title:String(r.Title||''),
        submissionType:String(r.SubmissionType||''),
        status:String(r.Status||''),
        maxGroupMembers:String(r.MaxGroupMembers||'')
      }:{recordStatus:'MISSING_OR_DUPLICATE'};
    });
    var groupRecords=expectedGroups.map(function(id){
      var r=exactlyOne(groupRows,'GroupID',id);
      return r?{
        primaryKey:String(r.GroupID),
        offeringId:String(r.OfferingID||''),
        groupName:String(r.GroupName||''),
        status:String(r.Status||''),
        membershipLocked:Boolean(r.MembershipLockedAt)
      }:{recordStatus:'MISSING_OR_DUPLICATE'};
    });
    var memberRecords=expectedMembers.map(function(id){
      var r=exactlyOne(memberRows,'GroupMemberID',id);
      return r?{
        primaryKey:String(r.GroupMemberID),
        groupId:String(r.GroupID||''),
        userId:String(r.UserID||''),
        memberRole:String(r.MemberRole||''),
        status:String(r.Status||''),
        leftAt:Boolean(r.LeftAt)
      }:{recordStatus:'MISSING_OR_DUPLICATE'};
    });
    var rowResolution=assignmentRecords.every(function(r){return !r.recordStatus;})&&
      groupRecords.every(function(r){return !r.recordStatus;})&&
      memberRecords.every(function(r){return !r.recordStatus;});
    check('ROW-RESOLUTION-01',rowResolution,
      rowResolution?'All manifest IDs resolve to exactly one row; identifiers withheld.':
      'One or more manifest IDs resolve to zero or multiple rows; identifiers withheld.');

    var expectedGroupIdSet=expectedGroups;
    var groupMembersLinked=memberRecords.every(function(m){
      return !m.recordStatus&&expectedGroupIdSet.indexOf(m.groupId)>=0;
    });
    var assignmentOfferingOk=assignmentRecords.every(function(r){
      return !r.recordStatus&&r.offeringId===String(core.offeringId);
    });
    var groupOfferingOk=groupRecords.every(function(r){
      return !r.recordStatus&&r.offeringId===String(core.offeringId);
    });
    var relationshipOk=groupMembersLinked&&assignmentOfferingOk&&groupOfferingOk;
    check('RELATIONSHIPS-01',relationshipOk,
      relationshipOk?'Assignment/Group offering and GroupMember relationships match manifests; identifiers withheld.':
      'One or more relationships do not match manifests; identifiers withheld.');

    var foreignSubmissions=submissionRows.filter(function(r){
      return expectedAssignments.indexOf(String(r.AssignmentID))>=0||
        expectedGroupIdSet.indexOf(String(r.GroupID))>=0;
    });
    var noSubmissionDependencies=foreignSubmissions.length===0;
    check('SUBMISSION-DEPENDENCY-01',noSubmissionDependencies,
      noSubmissionDependencies?'No Submission row references candidate Assignments or Groups.':
      'Submission dependencies exist; no file disposition or cleanup is permitted.');

    var prefixOk=assignmentRecords.every(function(r){return String(r.title||'').indexOf(SNC_EID_CONFIG_TEST.PREFIX)===0;})&&
      groupRecords.every(function(r){return String(r.groupName||'').indexOf(SNC_EID_CONFIG_TEST.PREFIX)===0;});
    check('SYNTHETIC-IDENTITY-01',prefixOk,
      prefixOk?'Candidate Assignment titles and Group names use reserved synthetic prefix.':
      'Synthetic identity check failed; identifiers withheld.');

    var auditIds=(sncAGR_ids_TEST_(ss).AuditLogs||[]).map(String);
    var auditDelta=auditIds.filter(function(id){return (base.AuditLogs||[]).map(String).indexOf(id)<0;});
    var auditPreserved=auditDelta.length===19;
    check('AUDIT-PRESERVATION-01',auditPreserved,
      auditPreserved?'Expected 19 post-baseline AuditLog IDs remain present; identifiers withheld.':
      'Post-baseline AuditLog count differs from expected 19; review required.');

    out.inventorySummary={
      assignmentCount:assignmentRecords.length,
      groupCount:groupRecords.length,
      groupMemberCount:memberRecords.length,
      exactPrimaryIdSetMatch:idsOk,
      allRowsResolveExactlyOnce:rowResolution,
      relationshipsMatch:relationshipOk,
      submissionDependencyCount:foreignSubmissions.length,
      auditLogCurrentCount:auditIds.length,
      auditLogPostBaselineCount:auditDelta.length,
      auditLogDisposition:'PRESERVE_ALL',
      rawIdentifiersIncluded:false
    };
  } catch(e) {
    // Avoid leaking identifiers through exception text or data-dependent messages.
    out.checks.push({id:'INVENTORY-ERROR',status:'BLOCKED',detail:'Inventory halted; error details withheld to prevent identifier disclosure.'});
  }
  return finish();
}
