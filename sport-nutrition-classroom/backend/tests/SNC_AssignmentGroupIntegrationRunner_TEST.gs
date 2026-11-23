/**
 * SPORT NUTRITION CLASSROOM — Assignment & Group Integration Runner (TEST)
 * Version 0.1.0 | HANDLER_LEVEL_INTEGRATION (not deployed API/LINE E2E)
 * Uses the existing core fixture only. No core entities, LINE, Drive, triggers,
 * submissions, cleanup, or direct application-row writes are created/performed.
 * Run read-only preflight first. Stop-on-error; never rerun a stopped batch.
 */
var SNC_AGR_CONFIG_TEST = Object.freeze({
  VERSION:'0.1.0',
  MANIFEST_PROPERTY:'SNC_SYNTHETIC_FIXTURE_MANIFEST_TEST',
  ENVIRONMENT_PROPERTY:'SNC_ITR_ENVIRONMENT',
  SPREADSHEET_PROPERTY:'SNC_ITR_TEST_SPREADSHEET_ID',
  TEST_SPREADSHEET_ID:'1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',
  CONFIRMATION:'RUN SNC ASSIGNMENT GROUP TESTS 2026-11-23',
  PREFIX:'SNC_TST_20261122_',
  DEADLINE:'2027-03-01T23:59',
  HEADERS:{
    Assignments:['AssignmentID','OfferingID','Title','Description','Instructions','MaxScore','Deadline','SubmissionType','MinGroupMembers','MaxGroupMembers','Status','OpenedAt','ClosedAt','CreatedAt','UpdatedAt','CreatedByUserID','AutoOpenEnabled','ScheduledOpenAt','AutoOpenProcessedAt','AutoCloseEnabled','ScheduledCloseAt','AutoCloseProcessedAt'],
    Groups:['GroupID','OfferingID','GroupName','CreatedByUserID','MembershipLockedAt','Status','CreatedAt','UpdatedAt'],
    GroupMembers:['GroupMemberID','GroupID','UserID','MemberRole','JoinedAt','LeftAt','Status']
  }
});

/** Read-only readiness check. */
function SNC_AssignmentGroupPreflight_TEST(){
  var r={runner:'SNC_AssignmentGroupIntegrationRunner_TEST',version:SNC_AGR_CONFIG_TEST.VERSION,mode:'READ_ONLY_ASSIGNMENT_GROUP_PREFLIGHT',evidenceLevel:'READ_ONLY_TEST_DATA_INSPECTION',writesExpected:0,externalCallsExpected:0,status:'BLOCKED',checks:[]};
  function check(id,ok,detail){r.checks.push({id:id,status:ok?'PASS':'BLOCKED',detail:detail});}
  try{
    var env=sncAGR_env_TEST_();check('ENV-01',env.ok,env.reason||'Exact TEST spreadsheet identity verified.');
    if(!env.ok)return sncAGR_finishPreflight_TEST_(r);
    var ss=SpreadsheetApp.getActiveSpreadsheet(),raw=PropertiesService.getScriptProperties().getProperty(SNC_AGR_CONFIG_TEST.MANIFEST_PROPERTY);
    var m=raw?JSON.parse(raw):null;
    var core=Boolean(m&&m.status==='CORE_FIXTURE_CREATED'&&m.offeringId&&m.userIds&&m.userIds.length===6&&m.enrollmentIds&&m.enrollmentIds.length===6);
    check('CORE-MANIFEST-01',core,core?'Existing core fixture manifest is present.':'Core fixture manifest missing/incomplete or not CORE_FIXTURE_CREATED.');
    if(!core)return sncAGR_finishPreflight_TEST_(r);
    var o=sncAGR_one_TEST_(ss,'CourseOfferings','OfferingID',m.offeringId);
    check('OFFERING-01',Boolean(o&&String(o.Status).toUpperCase()==='ACTIVE'),'Existing synthetic CourseOffering must exist exactly once and be active.');
    var users=sncAGR_rows_TEST_(ss,'Users'),ens=sncAGR_rows_TEST_(ss,'Enrollments');
    var uok=m.userIds.every(function(id){return users.filter(function(x){return String(x.UserID)===String(id)&&String(x.Status).toUpperCase()==='ACTIVE';}).length===1;});
    var eok=m.enrollmentIds.every(function(id){return ens.filter(function(x){return String(x.EnrollmentID)===String(id)&&String(x.OfferingID)===String(m.offeringId)&&String(x.Status).toUpperCase()==='ACTIVE';}).length===1;});
    check('STUDENTS-01',uok,'All six manifest users resolve to exactly one active User row.');
    check('ENROLLMENTS-01',eok,'All six manifest enrollments resolve to exactly one active enrollment in the fixture offering.');
    var schema=true,why=[];
    Object.keys(SNC_AGR_CONFIG_TEST.HEADERS).forEach(function(n){
      var sh=ss.getSheetByName(n);
      if(!sh){schema=false;why.push(n+':missing');return;}
      var h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],x=SNC_AGR_CONFIG_TEST.HEADERS[n];
      if(h.length!==x.length||!x.every(function(v,i){return h[i]===v;})){schema=false;why.push(n+':header_mismatch');}
    });
    var ah=ss.getSheetByName('AuditLogs');
    if(!ah){schema=false;why.push('AuditLogs:missing');}
    else {var auditHeaders=ah.getRange(1,1,1,ah.getLastColumn()).getDisplayValues()[0];if(!auditHeaders.some(function(x){return x==='AuditID'||x==='AuditLogID';})){schema=false;why.push('AuditLogs:primary_key_missing');}}
    check('SCHEMA-01',schema,schema?'Assignment, Group, GroupMember and AuditLog schemas verified.':why.join(','));
    check('MANIFEST-EXT-01',!m.assignmentGroup,!m.assignmentGroup?'No prior Assignment/Group extension exists.':'Assignment/Group extension already exists; do not rerun.');
    var collision=['Assignments','Groups','GroupMembers'].some(function(n){return sncAGR_rows_TEST_(ss,n).some(function(row){return Object.keys(row).some(function(k){return String(row[k]||'').indexOf(SNC_AGR_CONFIG_TEST.PREFIX)===0;});});});
    check('PREFIX-COLLISION-01',!collision,collision?'Reserved synthetic prefix already appears in downstream tables.':'No reserved-prefix downstream rows found.');
    var actor=sncAGR_admin_TEST_(ss);
    check('ACTOR-01',Boolean(actor),'Exactly one active existing SYSTEM_ADMIN actor is available; ID is not logged.');
    var ids=sncAGR_ids_TEST_(ss);
    r.baselineCounts={Assignments:ids.Assignments.length,Groups:ids.Groups.length,GroupMembers:ids.GroupMembers.length,AuditLogs:ids.AuditLogs.length};
    r.offeringIdSuffix=String(m.offeringId).slice(-6);r.studentCount=6;
  }catch(e){r.checks.push({id:'PREFLIGHT-ERROR',status:'BLOCKED',detail:String(e&&e.message||e).slice(0,200)});}
  return sncAGR_finishPreflight_TEST_(r);
}
function sncAGR_finishPreflight_TEST_(r){
  r.status=r.checks.length&&r.checks.every(function(x){return x.status==='PASS';})?'READY':'BLOCKED';
  r.summary={pass:r.checks.filter(function(x){return x.status==='PASS';}).length,blocked:r.checks.filter(function(x){return x.status!=='PASS';}).length};
  Logger.log('SNC_ASSIGNMENT_GROUP_PREFLIGHT='+JSON.stringify(r));return r;
}
function SNC_RunAssignmentGroupIntegration_CONFIRMED_TEST(){
  return SNC_RunAssignmentGroupIntegration_TEST('RUN SNC ASSIGNMENT GROUP TESTS 2026-11-23');
}

/** Persistent TEST-only batch. Requires exact confirmation phrase. */
function SNC_RunAssignmentGroupIntegration_TEST(confirmation){
  if(String(confirmation||'')!==SNC_AGR_CONFIG_TEST.CONFIRMATION)throw new Error('SAFETY_STOP: exact confirmation phrase required.');
  var lock=LockService.getDocumentLock();if(!lock)throw new Error('SAFETY_STOP: document lock unavailable.');
  lock.waitLock(30000);
  var ss=SpreadsheetApp.getActiveSpreadsheet(),m=null,notifyOriginal=null,notifyStubActive=false;
  try{
    var pf=SNC_AssignmentGroupPreflight_TEST();if(pf.status!=='READY')throw new Error('SAFETY_STOP: preflight is not READY.');
    var props=PropertiesService.getScriptProperties();m=JSON.parse(props.getProperty(SNC_AGR_CONFIG_TEST.MANIFEST_PROPERTY));
    var admin=sncAGR_admin_TEST_(ss),actors=m.userIds.map(function(uid){return {userId:String(uid),roles:[{role:'STUDENT',scopeType:'SELF',scopeId:String(uid)}]};});
    var baseline=sncAGR_ids_TEST_(ss);
    m.assignmentGroup={runnerVersion:SNC_AGR_CONFIG_TEST.VERSION,evidenceLevel:'HANDLER_LEVEL_INTEGRATION',startedAt:new Date().toISOString(),status:'IN_PROGRESS',notificationStubbed:false,externalCallsExpected:0,preBatchIds:baseline,assignments:{},groups:{},cases:[],cleanupStatus:'NOT STARTED'};
    sncAGR_save_TEST_(m);
    function save(){sncAGR_save_TEST_(m);}
    function caseRecord(id,expected,actual,detail){m.assignmentGroup.cases.push({id:id,status:expected===actual?'PASS':'FAIL',expected:expected,actual:actual,detail:detail||''});save();}
    function run(id,fn,expectedCode){
      try{var v=fn();if(expectedCode){caseRecord(id,expectedCode,'SUCCESS','Unexpected success.');return {ok:false,value:v};}caseRecord(id,'SUCCESS','SUCCESS','Handler completed.');return {ok:true,value:v};}
      catch(e){var code=String(e&&e.apiCode||'UNCLASSIFIED_ERROR');caseRecord(id,expectedCode||'SUCCESS',code,String(e&&e.message||e).slice(0,160));if(!expectedCode)throw e;return {ok:code===expectedCode,errorCode:code};}
    }
    function must(v,msg){if(!v)throw new Error('ASSERTION_FAILED: '+msg);}
    function capture(names,caseId){
      var now=sncAGR_ids_TEST_(ss),out={};
      names.forEach(function(n){out[n]=now[n].filter(function(id){return (baseline[n]||[]).indexOf(id)<0;});});
      m.assignmentGroup.lastWriteCapture={caseId:caseId,at:new Date().toISOString(),newIds:out};save();return out;
    }
    function rememberAssignment(key,id,caseId){
      if(!id)throw new Error('RECONCILIATION_REQUIRED: missing AssignmentID '+caseId);
      capture(['Assignments','AuditLogs'],caseId);m.assignmentGroup.assignments[key]=String(id);save();
    }
    function ap(type,max,title){
      var p={offeringId:m.offeringId,title:title,description:'Synthetic integration test only.',instructions:'Do not use for teaching.',maxScore:10,deadline:SNC_AGR_CONFIG_TEST.DEADLINE,submissionType:type};
      if(max!==undefined)p.maxGroupMembers=max;return p;
    }
    // Assignment create: save generated IDs immediately after each successful handler call.
    var x=run('ASG-01',function(){return handleAssignmentManagementAction_('assignment.create',admin,ap('INDIVIDUAL',undefined,SNC_AGR_CONFIG_TEST.PREFIX+'ASG_IND'),Utilities.getUuid());});
    must(x.ok&&x.value.Status==='DRAFT'&&x.value.MinGroupMembers===''&&x.value.MaxGroupMembers==='','Individual assignment fields mismatch.');
    rememberAssignment('individual',x.value.AssignmentID,'ASG-01');
    x=run('ASG-02',function(){return handleAssignmentManagementAction_('assignment.create',admin,ap('GROUP',3,SNC_AGR_CONFIG_TEST.PREFIX+'ASG_GRP3'),Utilities.getUuid());});
    must(x.ok&&Number(x.value.MinGroupMembers)===2&&Number(x.value.MaxGroupMembers)===3,'Group max 3 mismatch.');
    rememberAssignment('groupMax3',x.value.AssignmentID,'ASG-02');
    x=run('ASG-03',function(){return handleAssignmentManagementAction_('assignment.create',admin,ap('GROUP',2,SNC_AGR_CONFIG_TEST.PREFIX+'ASG_GRP2'),Utilities.getUuid());});
    must(x.ok&&Number(x.value.MinGroupMembers)===2&&Number(x.value.MaxGroupMembers)===2,'Group max 2 mismatch.');
    rememberAssignment('groupMax2',x.value.AssignmentID,'ASG-03');
    x=run('ASG-04',function(){return handleAssignmentManagementAction_('assignment.create',admin,ap('GROUP',undefined,SNC_AGR_CONFIG_TEST.PREFIX+'ASG_GRPN'),Utilities.getUuid());});
    must(x.ok&&Number(x.value.MinGroupMembers)===2&&x.value.MaxGroupMembers==='','Unlimited group max mismatch.');
    rememberAssignment('groupNoMax',x.value.AssignmentID,'ASG-04');

    var beforeBad=sncAGR_ids_TEST_(ss).Assignments;
    run('ASG-05A',function(){return handleAssignmentManagementAction_('assignment.create',admin,ap('GROUP',1,SNC_AGR_CONFIG_TEST.PREFIX+'BAD1'),Utilities.getUuid());},'VALIDATION_ERROR');
    run('ASG-05B',function(){return handleAssignmentManagementAction_('assignment.create',admin,ap('GROUP',2.5,SNC_AGR_CONFIG_TEST.PREFIX+'BAD2'),Utilities.getUuid());},'VALIDATION_ERROR');
    run('ASG-05C',function(){return handleAssignmentManagementAction_('assignment.create',admin,ap('PAIR',undefined,SNC_AGR_CONFIG_TEST.PREFIX+'BAD3'),Utilities.getUuid());},'VALIDATION_ERROR');
    run('ASG-06',function(){return handleAssignmentManagementAction_('assignment.create',admin,ap('INDIVIDUAL',2,SNC_AGR_CONFIG_TEST.PREFIX+'BAD4'),Utilities.getUuid());},'VALIDATION_ERROR');
    must(JSON.stringify(beforeBad)===JSON.stringify(sncAGR_ids_TEST_(ss).Assignments),'Invalid assignment requests wrote rows.');

    x=run('ASG-07A',function(){return handleAssignmentManagementAction_('assignment.list',admin,{offeringId:m.offeringId},Utilities.getUuid());});
    must(x.ok&&x.value.some(function(a){return String(a.AssignmentID)===m.assignmentGroup.assignments.individual;}),'Admin list omitted assignment.');
    run('ASG-07B',function(){return handleAssignmentManagementAction_('assignment.get',actors[5],{assignmentId:m.assignmentGroup.assignments.individual},Utilities.getUuid());},'FORBIDDEN');
    x=run('ASG-07C',function(){return handleAssignmentManagementAction_('assignment.list',actors[5],{offeringId:m.offeringId},Utilities.getUuid());});
    must(x.ok&&x.value.length===0,'Student assignment list should not expose managed records.');
    x=run('ASG-08',function(){return handleAssignmentManagementAction_('assignment.update',admin,{assignmentId:m.assignmentGroup.assignments.groupMax3,title:SNC_AGR_CONFIG_TEST.PREFIX+'ASG_GRP3_UPDATED',description:'Updated synthetic description',maxScore:20,deadline:SNC_AGR_CONFIG_TEST.DEADLINE},Utilities.getUuid());});
    must(x.ok&&x.value.Title===SNC_AGR_CONFIG_TEST.PREFIX+'ASG_GRP3_UPDATED'&&Number(x.value.MaxScore)===20,'Assignment update mismatch.');
    run('ASG-09',function(){return handleAssignmentManagementAction_('assignment.update',admin,{assignmentId:m.assignmentGroup.assignments.individual,maxGroupMembers:4},Utilities.getUuid());},'VALIDATION_ERROR');

    // Replace notifier in memory; token absence is not treated as sufficient protection.
    notifyOriginal=notifyAssignmentOpened_;var notifyCalls=0;
    notifyAssignmentOpened_=function(){notifyCalls++;return {stubbed:true};};notifyStubActive=true;
    m.assignmentGroup.notificationStubbed=true;save();
    try{
      x=run('ASG-11A',function(){return handleAssignmentManagementAction_('assignment.open',admin,{assignmentId:m.assignmentGroup.assignments.individual},Utilities.getUuid());});
      must(x.ok&&x.value.Status==='OPEN','Manual open failed.');
      x=run('ASG-11B',function(){return handleAssignmentManagementAction_('assignment.close',admin,{assignmentId:m.assignmentGroup.assignments.individual},Utilities.getUuid());});
      must(x.ok&&x.value.Status==='CLOSED','Manual close failed.');
      run('ASG-12A',function(){return handleAssignmentManagementAction_('assignment.close',admin,{assignmentId:m.assignmentGroup.assignments.individual},Utilities.getUuid());},'CONFLICT');
      x=run('ASG-12B',function(){return handleAssignmentManagementAction_('assignment.open',admin,{assignmentId:m.assignmentGroup.assignments.individual},Utilities.getUuid());});
      must(x.ok&&x.value.Status==='OPEN','Reopen failed.');
      x=run('ASG-12C',function(){return handleAssignmentManagementAction_('assignment.close',admin,{assignmentId:m.assignmentGroup.assignments.individual},Utilities.getUuid());});
      must(x.ok&&x.value.Status==='CLOSED','Second close failed.');
      caseRecord('ASG-NOTIFY-STUB','2_STUB_CALLS',String(notifyCalls)+'_STUB_CALLS','Notification callback replaced in memory; no outbound calls expected.');
    }finally{
      notifyAssignmentOpened_=notifyOriginal;notifyStubActive=false;notifyOriginal=null;
      m.assignmentGroup.notificationStubbed=false;m.assignmentGroup.notificationStubRestored=true;save();
    }
    // Known requirement-gap detector. If current handler accepts this no-content-change update,
    // it will still update UpdatedAt/AuditLog and be recorded as FAIL.
    run('ASG-13',function(){return handleAssignmentManagementAction_('assignment.update',admin,{assignmentId:m.assignmentGroup.assignments.individual,title:SNC_AGR_CONFIG_TEST.PREFIX+'ASG_IND'},Utilities.getUuid());},'CONFLICT');

    function groupCreate(caseId,key,actor,name){
      var g=run(caseId,function(){return handleGroupManagementAction_('group.create',actor,{offeringId:m.offeringId,groupName:name},Utilities.getUuid());});
      must(g.ok&&g.value.groupId,'Group create returned no groupId.');
      var d=capture(['Groups','GroupMembers','AuditLogs'],caseId);
      var members=sncAGR_rows_TEST_(ss,'GroupMembers').filter(function(v){return String(v.GroupID)===String(g.value.groupId)&&String(v.Status).toUpperCase()==='ACTIVE';});
      m.assignmentGroup.groups[key]={groupId:String(g.value.groupId),memberIds:members.map(function(v){return String(v.GroupMemberID);})};
      m.assignmentGroup.lastWriteCapture.newIds=d;save();return g.value;
    }
    function groupJoin(caseId,actor,gid){
      var v=run(caseId,function(){return handleGroupManagementAction_('group.join',actor,{groupId:gid},Utilities.getUuid());});
      must(v.ok,'Group join failed.');
      var d=capture(['Groups','GroupMembers','AuditLogs'],caseId);
      var rows=sncAGR_rows_TEST_(ss,'GroupMembers').filter(function(q){return String(q.GroupID)===String(gid)&&String(q.UserID)===String(actor.userId)&&String(q.Status).toUpperCase()==='ACTIVE';});
      must(rows.length===1,'Joined user must have exactly one active membership.');
      Object.keys(m.assignmentGroup.groups).forEach(function(k){if(m.assignmentGroup.groups[k].groupId===String(gid)&&m.assignmentGroup.groups[k].memberIds.indexOf(String(rows[0].GroupMemberID))<0)m.assignmentGroup.groups[k].memberIds.push(String(rows[0].GroupMemberID));});
      m.assignmentGroup.lastWriteCapture.newIds=d;save();return v.value;
    }
    var alpha=groupCreate('GRP-01','alpha',actors[0],SNC_AGR_CONFIG_TEST.PREFIX+'GRP_ALPHA');
    groupJoin('GRP-02',actors[1],alpha.groupId);
    var beta=groupCreate('GRP-03','beta',actors[2],SNC_AGR_CONFIG_TEST.PREFIX+'GRP_BETA');
    groupJoin('GRP-04A',actors[3],beta.groupId);groupJoin('GRP-04B',actors[4],beta.groupId);
    var solo=groupCreate('GRP-05','solo',actors[5],SNC_AGR_CONFIG_TEST.PREFIX+'GRP_SOLO');

    var beforeJoinReject=sncAGR_ids_TEST_(ss).GroupMembers;
    run('GRP-06A',function(){return handleGroupManagementAction_('group.join',actors[0],{groupId:beta.groupId},Utilities.getUuid());},'CONFLICT');
    run('GRP-06B',function(){return handleGroupManagementAction_('group.join',actors[5],{groupId:alpha.groupId},Utilities.getUuid());},'CONFLICT');
    must(JSON.stringify(beforeJoinReject)===JSON.stringify(sncAGR_ids_TEST_(ss).GroupMembers),'Rejected join created membership rows.');
    run('GRP-07',function(){return handleGroupManagementAction_('group.create',{userId:'SNC_TST_NONENROLLED',roles:[{role:'STUDENT',scopeType:'SELF',scopeId:'SNC_TST_NONENROLLED'}]},{offeringId:m.offeringId,groupName:'SHOULD_NOT_EXIST'},Utilities.getUuid());},'ENROLLMENT_REQUIRED');

    x=run('GRP-08A',function(){return handleGroupManagementAction_('group.list',actors[0],{offeringId:m.offeringId},Utilities.getUuid());});
    must(x.ok&&x.value.length===1&&String(x.value[0].groupId)===String(alpha.groupId),'Student A should see only Alpha.');
    x=run('GRP-08B',function(){return handleGroupManagementAction_('group.list',actors[5],{offeringId:m.offeringId},Utilities.getUuid());});
    must(x.ok&&x.value.length===1&&String(x.value[0].groupId)===String(solo.groupId),'Student F should see only Solo.');
    x=run('GRP-08C',function(){return handleGroupManagementAction_('group.list',admin,{offeringId:m.offeringId},Utilities.getUuid());});
    must(x.ok&&x.value.length===3,'SYSTEM_ADMIN should see all three groups.');

    x=run('GRP-09',function(){return handleGroupManagementAction_('group.selectRepresentative',actors[0],{groupId:alpha.groupId,userId:actors[1].userId},Utilities.getUuid());});
    must(x.ok&&x.value.members.some(function(v){return v.userId===actors[1].userId&&v.memberRole==='LEADER';}),'B was not selected as representative.');
    run('GRP-10A',function(){return handleGroupManagementAction_('group.selectRepresentative',actors[0],{groupId:alpha.groupId,userId:actors[0].userId},Utilities.getUuid());},'FORBIDDEN');
    run('GRP-10B',function(){return handleGroupManagementAction_('group.selectRepresentative',actors[5],{groupId:alpha.groupId,userId:actors[0].userId},Utilities.getUuid());},'FORBIDDEN');
    x=run('GRP-11',function(){return handleGroupManagementAction_('group.leave',actors[0],{groupId:alpha.groupId},Utilities.getUuid());});
    must(x.ok&&x.value.left===true,'A leave failed.');
    var active=sncAGR_rows_TEST_(ss,'GroupMembers').filter(function(v){return String(v.GroupID)===String(alpha.groupId)&&String(v.Status).toUpperCase()==='ACTIVE';});
    must(active.length===1&&String(active[0].UserID)===String(actors[1].userId)&&String(active[0].MemberRole)==='LEADER','B was not retained/promoted as leader.');
    groupJoin('GRP-12',actors[0],alpha.groupId);

    // Reconciliation compares exact generated PKs against the pre-batch baseline and manifest.
    var after=sncAGR_ids_TEST_(ss),delta={};
    Object.keys(after).forEach(function(n){delta[n]=after[n].filter(function(id){return (baseline[n]||[]).indexOf(id)<0;});});
    m.assignmentGroup.postBatchIds=after;m.assignmentGroup.postBatchNewIds=delta;
    var expectedA=Object.keys(m.assignmentGroup.assignments).map(function(k){return m.assignmentGroup.assignments[k];});
    var expectedG=Object.keys(m.assignmentGroup.groups).map(function(k){return m.assignmentGroup.groups[k].groupId;});
    var expectedM=[];Object.keys(m.assignmentGroup.groups).forEach(function(k){expectedM=expectedM.concat(m.assignmentGroup.groups[k].memberIds);});
    var recon={
      assignments:delta.Assignments.length===expectedA.length&&expectedA.every(function(id){return delta.Assignments.indexOf(id)>=0;}),
      groups:delta.Groups.length===expectedG.length&&expectedG.every(function(id){return delta.Groups.indexOf(id)>=0;}),
      groupMembers:delta.GroupMembers.length===expectedM.length&&expectedM.every(function(id){return delta.GroupMembers.indexOf(id)>=0;})
    };
    m.assignmentGroup.reconciliation=recon;m.assignmentGroup.completedAt=new Date().toISOString();
    var caseFailures=m.assignmentGroup.cases.some(function(v){return v.status==='FAIL';});
    m.assignmentGroup.status=!Object.keys(recon).every(function(k){return recon[k];})?'COMPLETE_WITH_RECONCILIATION_FAILURE':(caseFailures?'COMPLETE_WITH_FAILURES':'COMPLETE');
    m.assignmentGroup.notificationStubbed=false;save();
    var summary={status:m.assignmentGroup.status,evidenceLevel:m.assignmentGroup.evidenceLevel,caseCount:m.assignmentGroup.cases.length,pass:m.assignmentGroup.cases.filter(function(c){return c.status==='PASS';}).length,fail:m.assignmentGroup.cases.filter(function(c){return c.status==='FAIL';}).length,assignmentCount:expectedA.length,groupCount:expectedG.length,groupMemberCount:expectedM.length,reconciliation:recon,notificationStubRestored:Boolean(m.assignmentGroup.notificationStubRestored),cleanupStatus:m.assignmentGroup.cleanupStatus};
    Logger.log('SNC_ASSIGNMENT_GROUP_RESULT='+JSON.stringify(summary));return {summary:summary,manifest:m};
  }catch(e){
    if(m){
      try{
        var raw=PropertiesService.getScriptProperties().getProperty(SNC_AGR_CONFIG_TEST.MANIFEST_PROPERTY);if(raw)m=JSON.parse(raw);
        var ids=sncAGR_ids_TEST_(ss),base=m.assignmentGroup&&m.assignmentGroup.preBatchIds||{},delta={};
        Object.keys(ids).forEach(function(n){delta[n]=ids[n].filter(function(id){return (base[n]||[]).indexOf(id)<0;});});
        m.assignmentGroup=m.assignmentGroup||{};m.assignmentGroup.status='STOPPED_REQUIRES_RECONCILIATION';m.assignmentGroup.stoppedAt=new Date().toISOString();m.assignmentGroup.stopReason=String(e&&e.message||e).slice(0,220);m.assignmentGroup.postFailureNewIds=delta;m.assignmentGroup.notificationStubbed=Boolean(notifyStubActive);sncAGR_save_TEST_(m);
      }catch(ignore){}
    }
    Logger.log('SNC_ASSIGNMENT_GROUP_STOPPED='+JSON.stringify({status:'STOPPED_REQUIRES_RECONCILIATION',reason:String(e&&e.message||e).slice(0,220),manifestSaved:Boolean(m)}));throw e;
  }finally{
    if(notifyStubActive){
      try{notifyAssignmentOpened_=notifyOriginal;notifyStubActive=false;
        if(m&&m.assignmentGroup){m.assignmentGroup.notificationStubbed=false;m.assignmentGroup.notificationStubRestored=true;sncAGR_save_TEST_(m);}
      }catch(restoreError){console.error('ASSIGNMENT_NOTIFICATION_STUB_RESTORE_FAILED');}
    }
    lock.releaseLock();
  }
}

/** Read-only manifest retrieval; keep synthetic IDs private. */
function SNC_GetAssignmentGroupManifest_TEST(){
  var e=sncAGR_env_TEST_();if(!e.ok)throw new Error('SAFETY_STOP: '+e.reason);
  var raw=PropertiesService.getScriptProperties().getProperty(SNC_AGR_CONFIG_TEST.MANIFEST_PROPERTY);
  if(!raw)return {success:false,status:'NO_MANIFEST'};
  var m=JSON.parse(raw);return {success:true,coreStatus:m.status,assignmentGroup:m.assignmentGroup||null};
}
function sncAGR_env_TEST_(){
  var p=PropertiesService.getScriptProperties(),env=String(p.getProperty(SNC_AGR_CONFIG_TEST.ENVIRONMENT_PROPERTY)||'').trim().toUpperCase(),expected=String(p.getProperty(SNC_AGR_CONFIG_TEST.SPREADSHEET_PROPERTY)||'').trim(),ss=SpreadsheetApp.getActiveSpreadsheet();
  if(env!=='TEST')return {ok:false,reason:'Environment property is not TEST.'};
  if(expected!==SNC_AGR_CONFIG_TEST.TEST_SPREADSHEET_ID)return {ok:false,reason:'Configured spreadsheet ID does not match approved TEST ID.'};
  if(!ss||ss.getId()!==expected)return {ok:false,reason:'Active spreadsheet does not match approved TEST ID.'};
  return {ok:true};
}
function sncAGR_rows_TEST_(ss,n){var sh=ss.getSheetByName(n);if(!sh)throw new Error('SCHEMA_BLOCKED: missing '+n);return sh.getLastRow()<2?[]:rowsAsObjects_(sh);}
function sncAGR_one_TEST_(ss,n,k,id){var a=sncAGR_rows_TEST_(ss,n).filter(function(r){return String(r[k])===String(id);});return a.length===1?a[0]:null;}
function sncAGR_admin_TEST_(ss){
  var roles=sncAGR_rows_TEST_(ss,'UserRoles'),users=sncAGR_rows_TEST_(ss,'Users'),matches=roles.filter(function(r){return String(r.Role)==='SYSTEM_ADMIN'&&String(r.ScopeType)==='SYSTEM'&&String(r.ScopeID)==='*'&&String(r.Status).toUpperCase()==='ACTIVE';}).filter(function(r){return users.some(function(u){return String(u.UserID)===String(r.UserID)&&String(u.Status).toUpperCase()==='ACTIVE';});});
  var ids={};matches.forEach(function(r){ids[String(r.UserID)]=true;});var keys=Object.keys(ids);if(keys.length!==1)throw new Error('ACTOR_BLOCKED: exactly one active SYSTEM_ADMIN actor required.');
  return {userId:keys[0],roles:[{role:'SYSTEM_ADMIN',scopeType:'SYSTEM',scopeId:'*'}]};
}
function sncAGR_ids_TEST_(ss){
  var names={Assignments:'AssignmentID',Groups:'GroupID',GroupMembers:'GroupMemberID',AuditLogs:null},out={};
  Object.keys(names).forEach(function(n){
    var rows=sncAGR_rows_TEST_(ss,n),key=names[n];
    if(!key){var sh=ss.getSheetByName(n),h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];key=h.indexOf('AuditID')>=0?'AuditID':(h.indexOf('AuditLogID')>=0?'AuditLogID':'');}
    if(!key)throw new Error('SCHEMA_BLOCKED: AuditLogs primary key not found.');
    out[n]=rows.map(function(r){return String(r[key]||'');}).filter(Boolean);
  });return out;
}
function sncAGR_save_TEST_(m){PropertiesService.getScriptProperties().setProperty(SNC_AGR_CONFIG_TEST.MANIFEST_PROPERTY,JSON.stringify(m));}
function SNC_LogAssignmentGroupManifestSummary_TEST() {
  var r = SNC_GetAssignmentGroupManifest_TEST();

  if (!r.success) {
    Logger.log('SNC_MANIFEST_SUMMARY=' + JSON.stringify(r));
    return;
  }

  var a = r.assignmentGroup;

  if (!a) {
    Logger.log('SNC_MANIFEST_SUMMARY=' + JSON.stringify({
      success: true,
      coreStatus: r.coreStatus,
      assignmentGroup: null
    }));
    return;
  }

  var cases = Array.isArray(a.cases) ? a.cases : [];
  var delta = a.postFailureNewIds || {};

  var summary = {
    success: true,
    coreStatus: r.coreStatus,
    status: a.status || null,
    stopReason: a.stopReason || null,
    caseCount: cases.length,
    pass: cases.filter(function(x) {
      return x.status === 'PASS';
    }).length,
    fail: cases.filter(function(x) {
      return x.status === 'FAIL';
    }).length,
    notRun: cases.filter(function(x) {
      return x.status === 'NOT_RUN';
    }).length,
    postFailureNewIdCounts: {
      Assignments: (delta.Assignments || []).length,
      Groups: (delta.Groups || []).length,
      GroupMembers: (delta.GroupMembers || []).length,
      AuditLogs: (delta.AuditLogs || []).length
    },
    notificationStubbed: a.notificationStubbed,
    notificationStubRestored: a.notificationStubRestored
  };

  Logger.log('SNC_MANIFEST_SUMMARY=' + JSON.stringify(summary));
}
function SNC_LogAssignmentGroupFailureDetail_TEST() {
  var r = SNC_GetAssignmentGroupManifest_TEST();
  var a = r.assignmentGroup;

  if (!a) {
    Logger.log('FAILURE_DETAIL=' + JSON.stringify(r));
    return;
  }

  Logger.log('SNC_FAILURE_DETAIL=' + JSON.stringify({
    status: a.status,
    stopReason: a.stopReason || null,
    caseResults: (a.cases || []).map(function(c) {
      return {
        id: c.id,
        status: c.status,
        expected: c.expected,
        actual: c.actual,
        detail: c.detail
      };
    }),
    assignmentManifestCount: Object.keys(a.assignments || {}).length,
    groupManifestCount: Object.keys(a.groups || {}).length,
    lastWriteCapture: a.lastWriteCapture ? {
      caseId: a.lastWriteCapture.caseId,
      newIdCounts: Object.keys(a.lastWriteCapture.newIds || {}).reduce(function(o, k) {
        o[k] = (a.lastWriteCapture.newIds[k] || []).length;
        return o;
      }, {})
    } : null,
    hasPostFailureIds: Boolean(a.postFailureNewIds),
    hasPostBatchIds: Boolean(a.postBatchIds),
    reconciliation: a.reconciliation || null
  }));
}
function SNC_ReconcileAssignmentGroup_READONLY_TEST() {
  var r = SNC_GetAssignmentGroupManifest_TEST();
  if (!r.success || !r.assignmentGroup) {
    Logger.log('RECONCILIATION=' + JSON.stringify({
      success: false,
      reason: 'Manifest unavailable'
    }));
    return;
  }

  var a = r.assignmentGroup;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var actual = sncAGR_ids_TEST_(ss);
  var base = a.preBatchIds || {};

  var delta = {};
  Object.keys(actual).forEach(function(k) {
    delta[k] = actual[k].filter(function(id) {
      return (base[k] || []).indexOf(id) < 0;
    });
  });

  var expectedAssignments = Object.keys(a.assignments || {})
    .map(function(k) { return a.assignments[k]; });

  var expectedGroups = Object.keys(a.groups || {})
    .map(function(k) { return a.groups[k].groupId; });

  var expectedMembers = [];
  Object.keys(a.groups || {}).forEach(function(k) {
    expectedMembers = expectedMembers.concat(a.groups[k].memberIds || []);
  });

  function compare(actualIds, expectedIds) {
    return {
      actualCount: actualIds.length,
      manifestCount: expectedIds.length,
      allManifestIdsExist: expectedIds.every(function(id) {
        return actualIds.indexOf(id) >= 0;
      }),
      unexpectedCount: actualIds.filter(function(id) {
        return expectedIds.indexOf(id) < 0;
      }).length
    };
  }

  Logger.log('SNC_READONLY_RECONCILIATION=' + JSON.stringify({
    manifestStatus: a.status,
    caseCount: (a.cases || []).length,
    actualNewRows: {
      Assignments: compare(delta.Assignments || [], expectedAssignments),
      Groups: compare(delta.Groups || [], expectedGroups),
      GroupMembers: compare(delta.GroupMembers || [], expectedMembers),
      AuditLogs: (delta.AuditLogs || []).length
    },
    lastWriteCaptureCase: a.lastWriteCapture
      ? a.lastWriteCapture.caseId : null,
    postFailureIdsPresent: Boolean(a.postFailureNewIds),
    postBatchIdsPresent: Boolean(a.postBatchIds)
  }));
}
