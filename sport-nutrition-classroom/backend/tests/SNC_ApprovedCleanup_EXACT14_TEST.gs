/**
 * SPORT NUTRITION CLASSROOM — CONTROLLED SYNTHETIC FIXTURE CLEANUP
 * Version 1.0.0 | Preview v1.2 | Exact 14-row allowlist only
 *
 * Owner-authorized TEST cleanup. This file is intentionally separate from
 * all read-only diagnostics. It deletes only exact primary IDs below.
 *
 * SAFETY:
 * - TEST Spreadsheet identity and TEST Script Properties are mandatory.
 * - Requires exact execution phrase at invocation.
 * - Re-runs final read-only dry-run immediately before first mutation.
 * - Uses ScriptLock; no application handlers, Drive, LINE, UrlFetch or triggers.
 * - Deletes child GroupMembers, then Groups, then Assignments.
 * - No cascade, predicates, prefix-based selection, range clears or broad deletes.
 * - Snapshots all non-target rows in the three target sheets and the complete
 *   AuditLogs data grid; verifies preservation after deletion.
 * - Stops on first discrepancy. No automatic rollback or retry.
 *
 * IMPORTANT: GAS execution must be initiated by the owner in the TEST project.
 */
var SNC_CLEANUP_CONFIG_TEST = Object.freeze({
  VERSION: '1.0.0',
  PREVIEW: 'SNC_SYNTHETIC_FIXTURE_CLEANUP_PREVIEW_v1.2',
  TEST_SPREADSHEET_ID: '1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',
  ENVIRONMENT_PROPERTY: 'SNC_ITR_ENVIRONMENT',
  SPREADSHEET_PROPERTY: 'SNC_ITR_TEST_SPREADSHEET_ID',
  EXECUTION_PHRASE: 'EXECUTE SNC CLEANUP EXACT 14 ROWS TEST 2026-11-23',
  OFFERING_ID: '807e157d-436b-4f27-acfb-bc084a625637',
  BACKUP_RECOVERY_OWNER_CONFIRMED: true,
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

/**
 * Persistent destructive entry point. Do not run from a non-TEST project.
 * Example: SNC_ExecuteApprovedCleanup_TEST('EXECUTE SNC CLEANUP EXACT 14 ROWS TEST 2026-11-23')
 */
function SNC_ExecuteApprovedCleanup_TEST(confirmationPhrase) {
  var c = SNC_CLEANUP_CONFIG_TEST;
  var out = {
    runner:'SNC_ExecuteApprovedCleanup_TEST',
    version:c.VERSION,
    preview:c.PREVIEW,
    evidenceLevel:'OWNER_AUTHORIZED_TEST_DATA_CLEANUP',
    mode:'CONTROLLED_EXACT_ID_DELETE',
    status:'BLOCKED',
    deleted:{GroupMembers:[],Groups:[],Assignments:[]},
    preserved:{AuditLogs:null,nonTargetRows:null},
    cleanupAuthorized:false,
    deletionPerformed:false
  };
  function log(){Logger.log('SNC_APPROVED_CLEANUP='+JSON.stringify(out));}
  function stop(code,detail){out.status='ABORTED_'+code;out.stopReason=detail;log();return out;}
  function norm(v){return String(v===undefined||v===null?'':v).trim();}
  function dataGrid(sh){
    var lastRow=sh.getLastRow(),lastCol=sh.getLastColumn();
    if(!lastRow||!lastCol)throw new Error('Unreadable or empty sheet: '+sh.getName());
    return sh.getRange(1,1,lastRow,lastCol).getValues();
  }
  function keyIndex(grid,key,sheetName){
    var h=grid[0].map(function(x){return norm(x);}),i=h.indexOf(key);
    if(i<0)throw new Error('Missing primary-key column '+key+' in '+sheetName);
    return i;
  }
  function rowsMatching(grid,index,id){
    var found=[];
    for(var r=1;r<grid.length;r++)if(norm(grid[r][index])===id)found.push(r+1);
    return found;
  }
  function stable(v){return JSON.stringify(v,function(k,x){return x instanceof Date?x.toISOString():x;});}
  function snapshotNonTargets(grid,index,targetIds){
    var set={};targetIds.forEach(function(id){set[id]=true;});
    return grid.filter(function(row,i){return i===0||!set[norm(row[index])];});
  }
  function removeExact(sheetName,pk,records,targetIds,baseline){
    var sh=ss.getSheetByName(sheetName),grid=dataGrid(sh),idx=keyIndex(grid,pk,sheetName);
    // Resolve every ID exactly once before this table is mutated.
    var resolved=records.map(function(rec){
      var rows=rowsMatching(grid,idx,rec.id);
      if(rows.length!==1)throw new Error(sheetName+' exact ID resolution is '+rows.length+' for '+rec.id);
      return {id:rec.id,row:rows[0]};
    });
    resolved.sort(function(a,b){return b.row-a.row;});
    resolved.forEach(function(item){
      // Re-read and re-resolve immediately before each individual row deletion.
      var current=dataGrid(sh),currentIdx=keyIndex(current,pk,sheetName),matches=rowsMatching(current,currentIdx,item.id);
      if(matches.length!==1)throw new Error('Pre-delete exact ID mismatch '+sheetName+' '+item.id);
      sh.deleteRow(matches[0]);
      var after=dataGrid(sh),afterIdx=keyIndex(after,pk,sheetName);
      if(rowsMatching(after,afterIdx,item.id).length!==0)throw new Error('Post-delete ID still present '+sheetName+' '+item.id);
      out.deleted[sheetName].push(item.id);
      log();
    });
    var afterGrid=dataGrid(sh),afterIdx=keyIndex(afterGrid,pk,sheetName);
    var remaining=targetIds.filter(function(id){return rowsMatching(afterGrid,afterIdx,id).length!==0;});
    if(remaining.length)throw new Error('Target IDs remain in '+sheetName+': '+remaining.join(','));
    var preserved=snapshotNonTargets(afterGrid,afterIdx,targetIds);
    if(stable(preserved)!==stable(baseline))throw new Error('Non-target rows changed in '+sheetName);
    return true;
  }

  if(confirmationPhrase!==c.EXECUTION_PHRASE)
    return stop('CONFIRMATION_REQUIRED','Exact execution phrase did not match.');
  if(!c.BACKUP_RECOVERY_OWNER_CONFIRMED)
    return stop('PG12_BACKUP_NOT_CONFIRMED','Owner backup/recovery confirmation is absent.');
  var lock=LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var props=PropertiesService.getScriptProperties();
    var env=norm(props.getProperty(c.ENVIRONMENT_PROPERTY)).toUpperCase();
    var configured=norm(props.getProperty(c.SPREADSHEET_PROPERTY));
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    if(env!=='TEST'||configured!==c.TEST_SPREADSHEET_ID||!ss||ss.getId()!==c.TEST_SPREADSHEET_ID)
      return stop('ENVIRONMENT_GUARD','TEST properties and active Spreadsheet must match the exact approved TEST ID.');

    // Final full read-only dry-run is executed immediately before any mutation.
    if(typeof SNC_FinalCleanupDryRun_READONLY_TEST!=='function')
      return stop('DRYRUN_MISSING','Final dry-run function is not available in this GAS project.');
    var dry=SNC_FinalCleanupDryRun_READONLY_TEST();
    if(!dry||dry.status!=='PASS'||!dry.checks||dry.checks.some(function(x){return x.status!=='PASS';}))
      return stop('FINAL_DRYRUN_FAILED','Fresh final dry-run did not return PASS on every check.');

    // Recheck the owner-approved immutable allowlist against the preview configuration.
    var idsA=c.ASSIGNMENTS.map(function(x){return x.id;}),idsG=c.GROUPS.map(function(x){return x.id;}),idsM=c.MEMBERS.map(function(x){return x.id;});
    if(idsA.length!==4||idsG.length!==3||idsM.length!==7||
       idsA.concat(idsG,idsM).length!==14)
      return stop('ALLOWLIST_SHAPE','Allowlist must remain exactly 4/3/7 = 14 unique IDs.');
    var all=idsA.concat(idsG,idsM);
    if(all.some(function(id,i){return all.indexOf(id)!==i;}))
      return stop('ALLOWLIST_DUPLICATE','Duplicate exact ID in allowlist.');

    // Snapshot target tables and the entire AuditLogs data grid before mutation.
    var assignmentsSheet=ss.getSheetByName('Assignments'),groupsSheet=ss.getSheetByName('Groups'),
        membersSheet=ss.getSheetByName('GroupMembers'),auditSheet=ss.getSheetByName('AuditLogs');
    if(!assignmentsSheet||!groupsSheet||!membersSheet||!auditSheet)
      return stop('REQUIRED_SHEET_MISSING','One or more required sheets are unavailable.');
    var aGrid=dataGrid(assignmentsSheet),gGrid=dataGrid(groupsSheet),mGrid=dataGrid(membersSheet),auditBefore=dataGrid(auditSheet);
    var aIdx=keyIndex(aGrid,'AssignmentID','Assignments'),gIdx=keyIndex(gGrid,'GroupID','Groups'),mIdx=keyIndex(mGrid,'GroupMemberID','GroupMembers');
    var baseA=snapshotNonTargets(aGrid,aIdx,idsA),baseG=snapshotNonTargets(gGrid,gIdx,idsG),baseM=snapshotNonTargets(mGrid,mIdx,idsM);
    if(idsA.some(function(id){return rowsMatching(aGrid,aIdx,id).length!==1;})||
       idsG.some(function(id){return rowsMatching(gGrid,gIdx,id).length!==1;})||
       idsM.some(function(id){return rowsMatching(mGrid,mIdx,id).length!==1;}))
      return stop('EXACT_ROW_RESOLUTION','All 14 exact IDs must resolve exactly once before mutation.');

    out.cleanupAuthorized=true;
    out.status='IN_PROGRESS';
    out.startedAt=new Date().toISOString();
    log();

    // Child-to-parent order. Stop on first exception; never broaden or retry.
    removeExact('GroupMembers','GroupMemberID',c.MEMBERS,idsM,baseM);
    removeExact('Groups','GroupID',c.GROUPS,idsG,baseG);
    removeExact('Assignments','AssignmentID',c.ASSIGNMENTS,idsA,baseA);

    // Verify complete AuditLogs grid is byte-for-byte equivalent at value level.
    var auditAfter=dataGrid(auditSheet);
    if(stable(auditBefore)!==stable(auditAfter))
      throw new Error('AuditLogs data grid changed; preservation verification failed.');
    out.preserved.AuditLogs={rows:auditAfter.length-1,fullGridUnchanged:true};
    out.preserved.nonTargetRows={Assignments:true,Groups:true,GroupMembers:true};
    out.deletionPerformed=true;
    out.status='COMPLETE';
    out.completedAt=new Date().toISOString();
    out.summary={deletedGroupMembers:out.deleted.GroupMembers.length,deletedGroups:out.deleted.Groups.length,
      deletedAssignments:out.deleted.Assignments.length,totalDeleted:14,auditLogsPreserved:true,
      coreFixturePreserved:true,nonTargetRowsPreserved:true};
    log();
    return out;
  } catch(e) {
    out.status=out.deleted.GroupMembers.length||out.deleted.Groups.length||out.deleted.Assignments.length?'PARTIAL_STOP':'ABORTED_ERROR';
    out.stopReason=String(e&&e.message||e).slice(0,500);
    out.deletionPerformed=out.deleted.GroupMembers.length+out.deleted.Groups.length+out.deleted.Assignments.length>0;
    log();
    return out;
  } finally {
    try{lock.releaseLock();}catch(ignore){}
  }
}
