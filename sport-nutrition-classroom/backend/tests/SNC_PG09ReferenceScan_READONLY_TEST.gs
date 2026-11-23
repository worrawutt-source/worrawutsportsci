/**
 * SPORT NUTRITION CLASSROOM — PG-09 Reference Scan (READ ONLY)
 * Version 1.0.0 | Exact-ID dependency scan for Cleanup Preview v1.1.
 *
 * Scans every used cell in every sheet of the exact TEST Spreadsheet for
 * exact allowlisted IDs, including tokenized composite references such as
 * STAGED:<userId>:<assignmentId> and <assignmentId>|<groupId>.
 *
 * No Spreadsheet/Properties/Drive/trigger/LINE writes; no handlers; no deletion.
 */
var SNC_PG09_CONFIG_TEST = Object.freeze({
  VERSION:'1.0.0',
  TEST_SPREADSHEET_ID:'1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',
  ENVIRONMENT_PROPERTY:'SNC_ITR_ENVIRONMENT',
  SPREADSHEET_PROPERTY:'SNC_ITR_TEST_SPREADSHEET_ID',
  OFFERING_ID:'807e157d-436b-4f27-acfb-bc084a625637',
  ASSIGNMENT_IDS:[
    'b018a6df-5ae3-4304-8573-6d0a90890534',
    'e405c32f-852a-4493-a2c1-2b83c8838296',
    'e98a8ff4-0c65-47b4-baee-bcfb81924de5',
    '3c140d03-2cc6-4378-b054-97254aefcf4b'
  ],
  GROUP_IDS:[
    '6590bfca-b632-4051-a26b-319af25f382d',
    '31597565-51c6-4684-89b1-d75da8ddf870',
    'b5b6896b-4d80-49c9-87e5-b179a2d6eb46'
  ],
  GROUP_MEMBER_IDS:[
    'dc5afafa-27e2-407d-bd43-337c7bc3e14f',
    '61c8b2a1-f130-463d-9045-c18d34e453c1',
    'd6575a39-4164-4441-afeb-0887183f211a',
    '67a6977d-4ba0-4ad1-a0ae-940cd735404c',
    '6ea007f2-1763-403a-98db-1e4ba0878003',
    '9bf0497f-3410-44b0-97e1-4d4f91fd0be6',
    '92d06156-ee86-410f-9b3a-8aaf78151e80'
  ]
});

function SNC_PG09ReferenceScan_READONLY_TEST(){
  var c=SNC_PG09_CONFIG_TEST;
  var out={
    runner:'SNC_PG09ReferenceScan_READONLY_TEST',
    version:c.VERSION,
    evidenceLevel:'READ_ONLY_ALL_SHEET_EXACT_ID_REFERENCE_SCAN',
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
    Logger.log('SNC_PG09_REFERENCE_SCAN='+JSON.stringify(out));
    return out;
  }
  function unique(arr){
    return arr.length===arr.filter(function(v,i){return arr.indexOf(v)===i;}).length;
  }
  function sameSet(actual,expected){
    return actual.length===expected.length&&unique(actual)&&unique(expected)&&
      expected.every(function(x){return actual.indexOf(x)>=0;})&&
      actual.every(function(x){return expected.indexOf(x)>=0;});
  }
  try{
    var props=PropertiesService.getScriptProperties();
    var env=String(props.getProperty(c.ENVIRONMENT_PROPERTY)||'').trim().toUpperCase();
    var configured=String(props.getProperty(c.SPREADSHEET_PROPERTY)||'').trim();
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var envOk=env==='TEST'&&configured===c.TEST_SPREADSHEET_ID&&
      Boolean(ss)&&ss.getId()===c.TEST_SPREADSHEET_ID;
    check('ENV-01',envOk,'Exact TEST Script Properties and active Spreadsheet identity.');
    if(!envOk)return finish();

    // Cross-check the literal preview allowlist against the persisted manifests.
    var core=SNC_GetSyntheticFixtureManifest_TEST();
    var ext=SNC_GetAssignmentGroupManifest_TEST();
    var a=ext&&ext.success?ext.assignmentGroup:null;
    var manifestOk=core&&core.status==='CORE_FIXTURE_CREATED'&&
      String(core.offeringId)===c.OFFERING_ID&&a&&a.assignments&&a.groups&&
      a.continuation&&a.continuation.status==='COMPLETE_WITH_HISTORICAL_FAILURE';
    check('MANIFEST-01',Boolean(manifestOk),'Core and Assignment/Group manifests resolve with the expected offering and completed continuation state.');
    if(!manifestOk)return finish();

    var manifestAssignments=Object.keys(a.assignments).map(function(k){return String(a.assignments[k]);});
    var manifestGroups=Object.keys(a.groups).map(function(k){return String(a.groups[k].groupId);});
    var manifestMembers=[];
    Object.keys(a.groups).forEach(function(k){
      manifestMembers=manifestMembers.concat((a.groups[k].memberIds||[]).map(String));
    });
    var allowlistOk=sameSet(manifestAssignments,c.ASSIGNMENT_IDS)&&
      sameSet(manifestGroups,c.GROUP_IDS)&&sameSet(manifestMembers,c.GROUP_MEMBER_IDS);
    check('ALLOWLIST-01',allowlistOk,'Literal 4/3/7 allowlist exactly matches persisted Assignment/Group manifest IDs.');
    if(!allowlistOk)return finish();

    var idTypes={};
    c.ASSIGNMENT_IDS.forEach(function(id){idTypes[id]='AssignmentID';});
    c.GROUP_IDS.forEach(function(id){idTypes[id]='GroupID';});
    c.GROUP_MEMBER_IDS.forEach(function(id){idTypes[id]='GroupMemberID';});
    var targetSheets={
      Assignments:{pk:'AssignmentID',ids:c.ASSIGNMENT_IDS},
      Groups:{pk:'GroupID',ids:c.GROUP_IDS},
      GroupMembers:{pk:'GroupMemberID',ids:c.GROUP_MEMBER_IDS}
    };
    var sheets=ss.getSheets(),sheetInventory=[],hits=[],candidateRowKeys={};
    var unreadable=[];
    sheets.forEach(function(sh){
      var name=sh.getName(),range=sh.getDataRange(),values=range.getDisplayValues();
      if(!values||!values.length){
        sheetInventory.push({sheet:name,headerCount:0,dataRows:0});
        return;
      }
      var headers=values[0].map(function(h){return String(h||'').trim();});
      sheetInventory.push({sheet:name,headerCount:headers.length,dataRows:Math.max(0,values.length-1)});
      if(!headers.length||headers.every(function(h){return !h;})){
        unreadable.push(name);
        return;
      }
      for(var ri=1;ri<values.length;ri++){
        var row=values[ri],rowMatches={};
        for(var ci=0;ci<row.length;ci++){
          var raw=String(row[ci]===null||row[ci]===undefined?'':row[ci]).trim();
          if(!raw)continue;
          var tokens=[raw].concat(raw.split(/[|:;,\s]+/).filter(Boolean));
          var matched=[];
          tokens.forEach(function(token){
            if(idTypes[token]&&matched.indexOf(token)<0)matched.push(token);
          });
          if(matched.length)rowMatches[headers[ci]||('COL_'+(ci+1))]=matched;
        }
        var rowIds=[];
        Object.keys(rowMatches).forEach(function(h){
          rowMatches[h].forEach(function(id){if(rowIds.indexOf(id)<0)rowIds.push(id);});
        });
        if(!rowIds.length)continue;
        var primaryValue=headers.indexOf(targetSheets[name]&&targetSheets[name].pk)>=0?
          String(row[headers.indexOf(targetSheets[name].pk)]||''):'';
        var expectedTargetRow=Boolean(targetSheets[name]&&targetSheets[name].ids.indexOf(primaryValue)>=0);
        var audit=name==='AuditLogs';
        var item={
          sheet:name,
          rowNumber:ri+1,
          matchedIds:rowIds,
          matchedTypes:rowIds.map(function(id){return idTypes[id];}),
          matchedColumns:rowMatches,
          classification:audit?'PRESERVE_AUDITLOG':(expectedTargetRow?'ALLOWLIST_TARGET_ROW':'UNEXPECTED_REFERENCE')
        };
        hits.push(item);
        if(expectedTargetRow)candidateRowKeys[name+'#'+primaryValue]=true;
      }
    });
    check('SCHEMA-COVERAGE-01',sheets.length>0&&unreadable.length===0,
      unreadable.length===0?'All current Spreadsheet tabs were enumerated and readable by the scan.':
      'One or more tabs had no readable header row: '+unreadable.join(', '));

    var unexpected=hits.filter(function(h){return h.classification==='UNEXPECTED_REFERENCE';});
    var auditHits=hits.filter(function(h){return h.classification==='PRESERVE_AUDITLOG';});
    var targetHitCounts={Assignments:0,Groups:0,GroupMembers:0};
    hits.forEach(function(h){if(h.classification==='ALLOWLIST_TARGET_ROW')targetHitCounts[h.sheet]++;});
    var targetCountsOk=targetHitCounts.Assignments===4&&targetHitCounts.Groups===3&&targetHitCounts.GroupMembers===7;
    check('TARGET-ROWS-01',targetCountsOk,
      targetCountsOk?'All 14 allowlisted primary IDs are present in their expected target sheets.':
      'Expected 4/3/7 allowlisted target rows; found '+JSON.stringify(targetHitCounts)+'.');
    check('NO-DEPENDENCY-01',unexpected.length===0,
      unexpected.length===0?'No exact allowlisted ID token was found outside the 14 target rows and preserved AuditLogs.':
      'Unexpected references found in '+unexpected.length+' row(s); review every reported match before any cleanup.');

    var bySheet={};
    hits.forEach(function(h){
      if(!bySheet[h.sheet])bySheet[h.sheet]={matchedRows:0,allowlistRows:0,auditRows:0,unexpectedRows:0};
      bySheet[h.sheet].matchedRows++;
      if(h.classification==='ALLOWLIST_TARGET_ROW')bySheet[h.sheet].allowlistRows++;
      if(h.classification==='PRESERVE_AUDITLOG')bySheet[h.sheet].auditRows++;
      if(h.classification==='UNEXPECTED_REFERENCE')bySheet[h.sheet].unexpectedRows++;
    });
    out.inventory={
      offeringId:c.OFFERING_ID,
      allowlistCounts:{assignments:c.ASSIGNMENT_IDS.length,groups:c.GROUP_IDS.length,groupMembers:c.GROUP_MEMBER_IDS.length,total:14},
      spreadsheetSheetCount:sheets.length,
      sheets:sheetInventory,
      targetRowCounts:targetHitCounts,
      referenceRowsBySheet:bySheet,
      unexpectedReferenceCount:unexpected.length,
      unexpectedReferences:unexpected,
      auditLogMatches:auditHits,
      auditDisposition:'PRESERVE_ALL',
      cleanupAuthorized:false
    };
  }catch(e){
    out.checks.push({id:'SCAN-ERROR',status:'BLOCKED',detail:String(e&&e.message||e).slice(0,240)});
  }
  return finish();
}
