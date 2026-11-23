/**
 * SPORT NUTRITION CLASSROOM
 * FINAL CLEANUP DRY-RUN — READ ONLY
 * Version 1.0.0 | Preview v1.2 | Exact 14-row scope only
 *
 * Run ONLY SNC_FinalCleanupDryRun_READONLY_TEST().
 * No writes, handlers, Drive, triggers, LINE, UrlFetch, cleanup or deletion.
 * A PASS is a point-in-time review result, NOT deletion authorization.
 */
var SNC_FINAL_DRYRUN_CONFIG_TEST = Object.freeze({
  VERSION: '1.0.0',
  TEST_SPREADSHEET_ID: '1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',
  ENVIRONMENT_PROPERTY: 'SNC_ITR_ENVIRONMENT',
  SPREADSHEET_PROPERTY: 'SNC_ITR_TEST_SPREADSHEET_ID',
  OFFERING_ID: '807e157d-436b-4f27-acfb-bc084a625637',
  PREFIX: 'SNC_TST_20261122_',
  ASSIGNMENTS: [
    {id:'b018a6df-5ae3-4304-8573-6d0a90890534',title:'SNC_TST_20261122_ASG_IND',type:'INDIVIDUAL',status:'CLOSED',max:''},
    {id:'e405c32f-852a-4493-a2c1-2b83c8838296',title:'SNC_TST_20261122_ASG_GRP3_UPDATED',type:'GROUP',status:'DRAFT',max:'3'},
    {id:'e98a8ff4-0c65-47b4-baee-bcfb81924de5',title:'SNC_TST_20261122_ASG_GRP2',type:'GROUP',status:'DRAFT',max:'2'},
    {id:'3c140d03-2cc6-4378-b054-97254aefcf4b',title:'SNC_TST_20261122_ASG_GRPN',type:'GROUP',status:'DRAFT',max:''}
  ],
  GROUPS: [
    {id:'6590bfca-b632-4051-a26b-319af25f382d',name:'SNC_TST_20261122_GRP_ALPHA'},
    {id:'31597565-51c6-4684-89b1-d75da8ddf870',name:'SNC_TST_20261122_GRP_BETA'},
    {id:'b5b6896b-4d80-49c9-87e5-b179a2d6eb46',name:'SNC_TST_20261122_GRP_SOLO'}
  ],
  MEMBERS: [
    {id:'dc5afafa-27e2-407d-bd43-337c7bc3e14f',group:'6590bfca-b632-4051-a26b-319af25f382d',user:'USR_34dbfc6a-e893-48c6-960b-f83af2324a4a',role:'MEMBER',status:'LEFT',left:true},
    {id:'61c8b2a1-f130-463d-9045-c18d34e453c1',group:'6590bfca-b632-4051-a26b-319af25f382d',user:'USR_69ddcc23-59fc-40fa-a91d-1b8b2fdb977b',role:'LEADER',status:'ACTIVE',left:false},
    {id:'d6575a39-4164-4441-afeb-0887183f211a',group:'6590bfca-b632-4051-a26b-319af25f382d',user:'USR_34dbfc6a-e893-48c6-960b-f83af2324a4a',role:'MEMBER',status:'ACTIVE',left:false},
    {id:'67a6977d-4ba0-4ad1-a0ae-940cd735404c',group:'31597565-51c6-4684-89b1-d75da8ddf870',user:'USR_fff7b26d-cb3e-479c-b53c-5e5fe203b555',role:'LEADER',status:'ACTIVE',left:false},
    {id:'6ea007f2-1763-403a-98db-1e4ba0878003',group:'31597565-51c6-4684-89b1-d75da8ddf870',user:'USR_5a197484-c631-4874-b04d-65fc623ca5c8',role:'MEMBER',status:'ACTIVE',left:false},
    {id:'9bf0497f-3410-44b0-97e1-4d4f91fd0be6',group:'31597565-51c6-4684-89b1-d75da8ddf870',user:'USR_a3a78e50-d733-4b90-a494-34c496545dc4',role:'MEMBER',status:'ACTIVE',left:false},
    {id:'92d06156-ee86-410f-9b3a-8aaf78151e80',group:'b5b6896b-4d80-49c9-87e5-b179a2d6eb46',user:'USR_428efbae-91ad-44d8-8de4-eb9309445850',role:'LEADER',status:'ACTIVE',left:false}
  ]
});

function SNC_FinalCleanupDryRun_READONLY_TEST() {
  var c=SNC_FINAL_DRYRUN_CONFIG_TEST;
  var out={
    runner:'SNC_FinalCleanupDryRun_READONLY_TEST',
    version:c.VERSION,
    preview:'SNC_SYNTHETIC_FIXTURE_CLEANUP_PREVIEW_v1.2',
    evidenceLevel:'FINAL_READ_ONLY_PRE_CLEANUP_DRY_RUN',
    mode:'READ_ONLY',
    writesExpected:0,
    externalCallsExpected:0,
    cleanupAuthorized:false,
    deletionPerformed:false,
    status:'BLOCKED',
    checks:[],
    inventory:null,
    limitations:[
      'This run captures a fresh point-in-time AuditLogs snapshot and verifies the 49 baseline IDs plus 19 post-baseline IDs. No prior full-row snapshot was stored, so historical cell-by-cell immutability cannot be independently proven by this read-only run.',
      'This utility does not validate backup availability or recovery access (PG-12); the previously approved backup/recovery evidence remains a separate owner-controlled prerequisite.'
    ]
  };
  function check(id,ok,detail){out.checks.push({id:id,status:ok?'PASS':'BLOCKED',detail:detail});}
  function finish(){
    out.status=out.checks.length&&out.checks.every(function(x){return x.status==='PASS';})?'PASS':'REQUIRES_REVIEW';
    out.summary={pass:out.checks.filter(function(x){return x.status==='PASS';}).length,blocked:out.checks.filter(function(x){return x.status!=='PASS';}).length};
    out.cleanupAuthorized=false;
    out.deletionPerformed=false;
    Logger.log('SNC_FINAL_CLEANUP_DRY_RUN='+JSON.stringify(out));
    return out;
  }
  function sameSet(actual,expected){
    return actual.length===expected.length&&actual.every(function(v,i){return actual.indexOf(v)===i;})&&
      expected.every(function(v){return actual.indexOf(v)>=0;});
  }
  function rowsFor(ss,name){
    var sh=ss.getSheetByName(name);
    if(!sh)throw new Error('Missing required sheet: '+name);
    var vals=sh.getDataRange().getDisplayValues();
    if(!vals||!vals.length||!vals[0].length)throw new Error('Unreadable sheet/header: '+name);
    var headers=vals[0].map(function(x){return String(x||'').trim();});
    if(headers.some(function(x){return !x;})||headers.every(function(x){return !x;}))throw new Error('Blank/invalid header in '+name);
    var data=[];
    for(var r=1;r<vals.length;r++){
      var obj={};
      headers.forEach(function(h,i){obj[h]=String(vals[r][i]===undefined?'':vals[r][i]);});
      if(vals[r].some(function(v){return String(v||'').trim()!=='';}))data.push(obj);
    }
    return {sheet:sh,headers:headers,rows:data,values:vals};
  }
  function findUnique(rows,key,id){
    var found=rows.filter(function(r){return String(r[key]||'')===String(id);});
    return found.length===1?found[0]:null;
  }
  function bool(v){return String(v||'').trim().toUpperCase()==='TRUE'||String(v||'').trim()==='1';}
  function norm(v){return String(v===undefined||v===null?'':v).trim();}
  try {
    var props=PropertiesService.getScriptProperties();
    var env=norm(props.getProperty(c.ENVIRONMENT_PROPERTY)).toUpperCase();
    var configured=norm(props.getProperty(c.SPREADSHEET_PROPERTY));
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var envOk=env==='TEST'&&configured===c.TEST_SPREADSHEET_ID&&ss&&ss.getId()===c.TEST_SPREADSHEET_ID;
    check('PG-01-ENV',!!envOk,'TEST property, configured Spreadsheet ID and active Spreadsheet ID must all match the approved TEST target.');
    if(!envOk)return finish();

    var core=SNC_GetSyntheticFixtureManifest_TEST();
    var ext=SNC_GetAssignmentGroupManifest_TEST();
    var a=ext&&ext.success?ext.assignmentGroup:null;
    var manifestOk=core&&core.status==='CORE_FIXTURE_CREATED'&&Array.isArray(core.userIds)&&core.userIds.length===6&&
      String(core.offeringId)===c.OFFERING_ID&&a&&a.status==='IN_PROGRESS'&&a.assignments&&a.groups&&
      a.continuation&&a.continuation.status==='COMPLETE_WITH_HISTORICAL_FAILURE'&&Array.isArray(a.preBatchIds&&a.preBatchIds.AuditLogs);
    check('PG-03-MANIFEST',!!manifestOk,'Core fixture, Assignment/Group manifest and completed continuation marker must resolve.');
    if(!manifestOk)return finish();

    var historical=(a.cases||[]).filter(function(x){return String(x.id)==='ASG-13';});
    var historyOk=historical.length===1&&historical[0].status==='FAIL'&&historical[0].expected==='CONFLICT'&&historical[0].actual==='SUCCESS';
    check('HISTORY-ASG13',historyOk,'Historical ASG-13 failure must remain recorded unchanged.');
    if(!historyOk)return finish();

    var manifestA=Object.keys(a.assignments).map(function(k){return String(a.assignments[k]);});
    var manifestG=Object.keys(a.groups).map(function(k){return String(a.groups[k].groupId);});
    var manifestM=[];
    Object.keys(a.groups).forEach(function(k){manifestM=manifestM.concat((a.groups[k].memberIds||[]).map(String));});
    var cfgA=c.ASSIGNMENTS.map(function(x){return x.id;}),cfgG=c.GROUPS.map(function(x){return x.id;}),cfgM=c.MEMBERS.map(function(x){return x.id;});
    var allowOk=sameSet(manifestA,cfgA)&&sameSet(manifestG,cfgG)&&sameSet(manifestM,cfgM)&&
      cfgA.length===4&&cfgG.length===3&&cfgM.length===7;
    check('PG-04-ALLOWLIST',allowOk,'Manifest-derived IDs must exactly equal the approved 4 Assignment + 3 Group + 7 GroupMember IDs.');
    if(!allowOk)return finish();

    var sheetObjects=ss.getSheets(),sheetNames=sheetObjects.map(function(s){return s.getName();});
    var all={},sheetInventory=[],scanHits=[],unreadable=[];
    sheetObjects.forEach(function(sh){
      var name=sh.getName(),lastRow=sh.getLastRow(),lastCol=sh.getLastColumn();
      if(lastRow<1||lastCol<1){unreadable.push(name);return;}
      var vals=sh.getRange(1,1,lastRow,lastCol).getDisplayValues();
      var headers=vals[0].map(function(x){return norm(x);});
      if(!headers.length||headers.some(function(x){return !x;})){unreadable.push(name);return;}
      var data=[];
      for(var ri=1;ri<vals.length;ri++){
        var o={};headers.forEach(function(h,ci){o[h]=String(vals[ri][ci]===undefined?'':vals[ri][ci]);});
        if(vals[ri].some(function(v){return norm(v)!=='';}))data.push(o);
        var idsFound=[];
        for(var ci=0;ci<vals[ri].length;ci++){
          var raw=norm(vals[ri][ci]);if(!raw)continue;
          var toks=[raw].concat(raw.split(/[|:;,\s]+/).filter(Boolean));
          toks.forEach(function(t){if((cfgA.indexOf(t)>=0||cfgG.indexOf(t)>=0||cfgM.indexOf(t)>=0)&&idsFound.indexOf(t)<0)idsFound.push(t);});
        }
        if(idsFound.length){
          var pkCol=name==='Assignments'?'AssignmentID':name==='Groups'?'GroupID':name==='GroupMembers'?'GroupMemberID':'';
          var pk=pkCol?norm(o[pkCol]):'';
          var target=pk&&(cfgA.indexOf(pk)>=0||cfgG.indexOf(pk)>=0||cfgM.indexOf(pk)>=0)&&
            ((name==='Assignments'&&cfgA.indexOf(pk)>=0)||(name==='Groups'&&cfgG.indexOf(pk)>=0)||(name==='GroupMembers'&&cfgM.indexOf(pk)>=0));
          scanHits.push({sheet:name,row:ri+1,ids:idsFound,classification:name==='AuditLogs'?'PRESERVE_AUDITLOG':(target?'ALLOWLIST_TARGET_ROW':'UNEXPECTED_REFERENCE')});
        }
      }
      all[name]={sheet:sh,headers:headers,rows:data,values:vals};
      sheetInventory.push({sheet:name,rows:data.length,columns:headers.length});
    });
    check('PG-09-SHEET-COVERAGE',sheetObjects.length>=23&&unreadable.length===0,
      unreadable.length===0?'All '+sheetObjects.length+' current tabs have readable used ranges and nonblank headers.':'Unreadable tabs: '+unreadable.join(', '));
    if(unreadable.length)return finish();

    var unexpected=scanHits.filter(function(x){return x.classification==='UNEXPECTED_REFERENCE';});
    var targetHitCounts={Assignments:0,Groups:0,GroupMembers:0};
    scanHits.forEach(function(x){if(x.classification==='ALLOWLIST_TARGET_ROW')targetHitCounts[x.sheet]++;});
    check('PG-09-NO-DEPENDENCIES',unexpected.length===0,'All used cells scanned for exact IDs and tokenized composite references; unexpected reference rows='+unexpected.length+'.');
    check('PG-09-TARGET-ROWS',targetHitCounts.Assignments===4&&targetHitCounts.Groups===3&&targetHitCounts.GroupMembers===7,
      'Expected target rows exactly 4/3/7; observed '+JSON.stringify(targetHitCounts)+'.');

    var ar=all.Assignments,gr=all.Groups,mr=all.GroupMembers;
    if(!ar||!gr||!mr)throw new Error('One or more target sheets unavailable.');
    var assignmentRecords=c.ASSIGNMENTS.map(function(e){var r=findUnique(ar.rows,'AssignmentID',e.id);return {expected:e,actual:r};});
    var groupRecords=c.GROUPS.map(function(e){var r=findUnique(gr.rows,'GroupID',e.id);return {expected:e,actual:r};});
    var memberRecords=c.MEMBERS.map(function(e){var r=findUnique(mr.rows,'GroupMemberID',e.id);return {expected:e,actual:r};});
    var rowUnique=assignmentRecords.every(function(x){return !!x.actual;})&&groupRecords.every(function(x){return !!x.actual;})&&memberRecords.every(function(x){return !!x.actual;});
    check('PG-05-UNIQUE-ROWS',rowUnique,'Every exact allowlisted primary key must resolve to exactly one row; duplicates and missing rows block.');
    if(!rowUnique)return finish();

    var assignmentFieldsOk=assignmentRecords.every(function(x){
      var r=x.actual,e=x.expected;
      return norm(r.OfferingID)===c.OFFERING_ID&&norm(r.Title)===e.title&&norm(r.SubmissionType).toUpperCase()===e.type&&
        norm(r.Status).toUpperCase()===e.status&&norm(r.MaxGroupMembers)===e.max&&e.title.indexOf(c.PREFIX)===0;
    });
    var groupFieldsOk=groupRecords.every(function(x){
      var r=x.actual,e=x.expected;
      return norm(r.OfferingID)===c.OFFERING_ID&&norm(r.GroupName)===e.name&&norm(r.Status).toUpperCase()==='ACTIVE'&&!bool(r.MembershipLockedAt);
    });
    var memberFieldsOk=memberRecords.every(function(x){
      var r=x.actual,e=x.expected;
      return norm(r.GroupID)===e.group&&norm(r.UserID)===e.user&&norm(r.MemberRole).toUpperCase()===e.role&&
        norm(r.Status).toUpperCase()===e.status&&bool(r.LeftAt)===e.left;
    });
    check('PG-06-ROW-IDENTITY',assignmentFieldsOk&&groupFieldsOk&&memberFieldsOk,
      'All candidate titles/names, type/status/limits, OfferingID, GroupID/UserID/role/status/LeftAt must match Preview v1.2 exactly.');

    var groupSet=cfgG;
    var relationshipsOk=memberRecords.every(function(x){return groupSet.indexOf(norm(x.actual.GroupID))>=0;})&&
      groupRecords.every(function(x){return norm(x.actual.OfferingID)===c.OFFERING_ID;})&&
      assignmentRecords.every(function(x){return norm(x.actual.OfferingID)===c.OFFERING_ID;});
    check('PG-07-RELATIONSHIPS',relationshipsOk,'All seven members point to one of the three candidate Groups; all Groups and Assignments point to the approved Offering.');

    var submissions=all.Submissions;
    var submissionsOk=!!submissions&&submissions.rows.every(function(r){return cfgA.indexOf(norm(r.AssignmentID))<0&&cfgG.indexOf(norm(r.GroupID))<0;});
    check('PG-08-SUBMISSIONS',submissionsOk,'Complete Submissions table is readable and contains no candidate AssignmentID or GroupID reference.');

    var baseAudit=(a.preBatchIds.AuditLogs||[]).map(String);
    var audit=all.AuditLogs;
    if(!audit)throw new Error('AuditLogs sheet unavailable.');
    var auditIds=audit.rows.map(function(r){return norm(r.AuditID);}).filter(Boolean);
    var auditDelta=auditIds.filter(function(id){return baseAudit.indexOf(id)<0;});
    var duplicateAuditIds=auditIds.filter(function(id,i){return auditIds.indexOf(id)!==i;});
    var expectedEvents={
      'ASSIGNMENT_CREATED|Assignment':4,'ASSIGNMENT_UPDATED|Assignment':2,'ASSIGNMENT_OPENED|Assignment':2,
      'ASSIGNMENT_CLOSED|Assignment':2,'GROUP_CREATED|Group':3,'GROUP_MEMBER_JOINED|Group':4,
      'GROUP_REPRESENTATIVE_SELECTED|Group':1,'GROUP_MEMBER_LEFT|Group':1
    };
    var eventCounts={};
    audit.rows.filter(function(r){return baseAudit.indexOf(norm(r.AuditID))<0;}).forEach(function(r){
      var k=norm(r.Action)+'|'+norm(r.EntityType);eventCounts[k]=(eventCounts[k]||0)+1;
    });
    var eventsOk=Object.keys(expectedEvents).every(function(k){return (eventCounts[k]||0)===expectedEvents[k];})&&
      Object.keys(eventCounts).every(function(k){return Object.prototype.hasOwnProperty.call(expectedEvents,k);});
    var auditOk=baseAudit.length===49&&auditIds.length===68&&auditDelta.length===19&&duplicateAuditIds.length===0&&
      sameSet(auditIds,baseAudit.concat(auditDelta))&&eventsOk;
    check('PG-10-AUDIT-PRESERVATION',auditOk,
      'Fresh AuditLogs snapshot: baseline IDs='+baseAudit.length+', current unique IDs='+auditIds.length+', post-baseline IDs='+auditDelta.length+', expected event matrix='+eventsOk+'. Preserve all rows; no audit mutation is performed.');

    var baselineIds=a.preBatchIds;
    var baselineOk=baselineIds&&Array.isArray(baselineIds.Assignments)&&Array.isArray(baselineIds.Groups)&&Array.isArray(baselineIds.GroupMembers)&&
      !cfgA.some(function(id){return baselineIds.Assignments.map(String).indexOf(id)>=0;})&&
      !cfgG.some(function(id){return baselineIds.Groups.map(String).indexOf(id)>=0;})&&
      !cfgM.some(function(id){return baselineIds.GroupMembers.map(String).indexOf(id)>=0;});
    check('PG-11-BASELINE-PROTECTION',!!baselineOk,'No approved target ID may overlap the preserved pre-batch primary-key baseline.');

    var auditHits=scanHits.filter(function(x){return x.classification==='PRESERVE_AUDITLOG';});
    var inventory={
      spreadsheetId:ss.getId(),spreadsheetSheetCount:sheetObjects.length,sheets:sheetInventory,
      approvedTargets:{assignments:assignmentRecords.map(function(x){return {id:x.expected.id,rowMatches:1};}),
        groups:groupRecords.map(function(x){return {id:x.expected.id,rowMatches:1};}),
        groupMembers:memberRecords.map(function(x){return {id:x.expected.id,rowMatches:1};})},
      targetRowCounts:targetHitCounts,unexpectedReferenceCount:unexpected.length,unexpectedReferences:unexpected,
      auditLogSnapshot:{totalRows:audit.rows.length,uniqueAuditIds:auditIds.length,baselineIds:baseAudit.length,postBaselineIds:auditDelta.length,
        postBaselineAuditIds:auditDelta,duplicateIds:duplicateAuditIds.length,eventCounts:eventCounts,disposition:'PRESERVE_ALL'},
      submissionsRows:submissions.rows.length,coreFixture:{users:core.userIds.length,offeringId:core.offeringId,disposition:'PRESERVE'},
      cleanupAuthorized:false,deletionPerformed:false
    };
    out.inventory=inventory;
    check('PG-13-SCOPE-LOCK',cfgA.length===4&&cfgG.length===3&&cfgM.length===7,
      'Scope remains exactly the 14 owner-approved IDs in Preview v1.2; no expansion or substitution.');
    check('PG-14-DRY-RUN-REPORT',!!out.inventory&&out.inventory.unexpectedReferenceCount===0,
      'Structured final report generated; no write or delete action is included.');

  } catch(e) {
    out.checks.push({id:'DRYRUN-ERROR',status:'BLOCKED',detail:String(e&&e.message||e).slice(0,300)});
  }
  return finish();
}
