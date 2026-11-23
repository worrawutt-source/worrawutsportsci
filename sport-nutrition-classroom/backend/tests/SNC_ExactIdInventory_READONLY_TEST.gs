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
  var out={
    runner:'SNC_ExactIdInventory_READONLY_TEST',
    version:SNC_EID_CONFIG_TEST.VERSION,
    evidenceLevel:'READ_ONLY_EXACT_PRIMARY_ID_AND_DEPENDENCY_INVENTORY',
    mode:'READ_ONLY',
    writesExpected:0,
    externalCallsExpected:0,
    status:'BLOCKED',
    checks:[],
    inventory:null
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
    Logger.log('SNC_EXACT_ID_INVENTORY='+JSON.stringify(out));
    return out;
  }
  try {
    var props=PropertiesService.getScriptProperties();
    var env=String(props.getProperty(SNC_EID_CONFIG_TEST.ENVIRONMENT_PROPERTY)||'').trim().toUpperCase();
    var configured=String(props.getProperty(SNC_EID_CONFIG_TEST.SPREADSHEET_PROPERTY)||'').trim();
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var envOk=env==='TEST'&&configured===SNC_EID_CONFIG_TEST.TEST_SPREADSHEET_ID&&
      Boolean(ss)&&ss.getId()===SNC_EID_CONFIG_TEST.TEST_SPREADSHEET_ID;
    check('ENV-01',envOk,'Exact approved TEST environment and active Spreadsheet identity.');
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
      manifestOk?'Core, Assignment/Group and completed continuation manifests resolve.':
      'Required manifests or expected completed continuation state are missing/inconsistent.');
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
      idsOk?'Current post-baseline primary IDs exactly match the manifest: 4 Assignments, 3 Groups, 7 GroupMembers.':
      'Current post-baseline primary IDs do not exactly match the manifest; cleanup candidate list must not be used.');

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
      }:{primaryKey:id,recordStatus:'MISSING_OR_DUPLICATE'};
    });
    var groupRecords=expectedGroups.map(function(id){
      var r=exactlyOne(groupRows,'GroupID',id);
      return r?{
        primaryKey:String(r.GroupID),
        offeringId:String(r.OfferingID||''),
        groupName:String(r.GroupName||''),
        status:String(r.Status||''),
        membershipLocked:Boolean(r.MembershipLockedAt)
      }:{primaryKey:id,recordStatus:'MISSING_OR_DUPLICATE'};
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
      }:{primaryKey:id,recordStatus:'MISSING_OR_DUPLICATE'};
    });
    var rowResolution=assignmentRecords.every(function(r){return !r.recordStatus;})&&
      groupRecords.every(function(r){return !r.recordStatus;})&&
      memberRecords.every(function(r){return !r.recordStatus;});
    check('ROW-RESOLUTION-01',rowResolution,
      rowResolution?'Every manifest primary ID resolves to exactly one current row.':
      'One or more manifest IDs resolve to zero or multiple rows.');

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
    check('RELATIONSHIPS-01',groupMembersLinked&&assignmentOfferingOk&&groupOfferingOk,
      groupMembersLinked&&assignmentOfferingOk&&groupOfferingOk?
      'All Assignment/Group rows point to the fixture Offering and all GroupMembers point to manifest Groups.':
      'A fixture relationship does not match the manifests.');

    var foreignSubmissions=submissionRows.filter(function(r){
      return expectedAssignments.indexOf(String(r.AssignmentID))>=0||
        expectedGroupIdSet.indexOf(String(r.GroupID))>=0;
    }).map(function(r){
      return {submissionId:String(r.SubmissionID||''),assignmentId:String(r.AssignmentID||''),groupId:String(r.GroupID||'')};
    });
    check('SUBMISSION-DEPENDENCY-01',foreignSubmissions.length===0,
      foreignSubmissions.length===0?'No Submission row references the candidate Assignments or Groups.':
      'Submission references exist; do not remove any referenced Assignment/Group.');

    var prefixOk=assignmentRecords.every(function(r){return String(r.title||'').indexOf(SNC_EID_CONFIG_TEST.PREFIX)===0;})&&
      groupRecords.every(function(r){return String(r.groupName||'').indexOf(SNC_EID_CONFIG_TEST.PREFIX)===0;});
    check('SYNTHETIC-IDENTITY-01',prefixOk,
      prefixOk?'All candidate Assignment titles and Group names carry the reserved synthetic prefix.':
      'One or more candidate rows do not carry the expected synthetic prefix.');

    var memberGroupSummary={};
    memberRecords.forEach(function(r){
      if(!r.recordStatus){
        if(!memberGroupSummary[r.groupId])memberGroupSummary[r.groupId]=[];
        memberGroupSummary[r.groupId].push(r.primaryKey);
      }
    });
    var auditIds=(sncAGR_ids_TEST_(ss).AuditLogs||[]).map(String);
    var auditDelta=auditIds.filter(function(id){return (base.AuditLogs||[]).map(String).indexOf(id)<0;});
    var expectedAuditCount=19;
    check('AUDIT-PRESERVATION-01',auditDelta.length===expectedAuditCount,
      auditDelta.length===expectedAuditCount?
      '19 post-baseline AuditLog IDs remain present; inventory does not propose deleting them.':
      'Post-baseline AuditLog count differs from the reconciled value 19; review before cleanup.');

    out.inventory={
      offeringId:String(core.offeringId),
      assignmentCount:assignmentRecords.length,
      assignments:assignmentRecords,
      groupCount:groupRecords.length,
      groups:groupRecords,
      groupMemberCount:memberRecords.length,
      groupMembers:memberRecords,
      groupMemberIdsByGroup:memberGroupSummary,
      submissionReferences:foreignSubmissions,
      auditLogPreservation:{currentCount:auditIds.length,postBaselineCount:auditDelta.length,disposition:'PRESERVE_ALL'},
      coreFixtureDisposition:'NOT_INCLUDED_IN_THIS_INVENTORY'
    };
  } catch(e) {
    out.checks.push({id:'INVENTORY-ERROR',status:'BLOCKED',detail:String(e&&e.message||e).slice(0,240)});
  }
  return finish();
}
