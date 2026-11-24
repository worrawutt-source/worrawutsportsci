/**
 * SPORT NUTRITION CLASSROOM — WP-SUB-1 Submission Handler Integration
 * Version: 0.1.0
 * Branch: development
 *
 * Persistent TEST-only handler integration. Uses only the six existing Core
 * Fixture users/offering/enrollments. Creates synthetic Groups and Assignments
 * through business handlers. No direct fixture writes, Drive upload, LINE,
 * UrlFetch, triggers, deployment, migration, or cleanup.
 *
 * Add this file to the existing TEST GAS project only after source sync.
 */
var SNC_SUB_INT_VERSION_ = '0.1.0';
var SNC_SUB_INT_MANIFEST_KEY_ = 'SNC_SUBMISSION_INTEGRATION_MANIFEST_TEST';
var SNC_SUB_INT_PREFIX_ = 'SNC_TST_20261124_SUB_';
var SNC_SUB_INT_CONFIRM_ = 'RUN SNC SUBMISSION INTEGRATION WP-SUB-1 2026-11-24';
var SNC_SUB_INT_SPREADSHEET_ID_ = '1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk';
var SNC_SUB_INT_SOURCE_ = {
  SubmissionManagement:'ef4b86678e8c1feeea425ba578501846129a229c',
  FileManagement:'86cd29160dd00207c9a575ce801da09e643911cb',
  GroupManagement:'9dc280d88bcee8e346d028082cae725fe2d88ee8',
  AssignmentManagement:'460c7a0eb244fa5a85239d0e2f531404d58601d8',
  Code:'7c9928f7ae269287d1537dec6256dce13783d26d'
};

function snsiProps_(){ return PropertiesService.getScriptProperties(); }
function snsiReadManifest_(){
  var raw=snsiProps_().getProperty(SNC_SUB_INT_MANIFEST_KEY_);
  if(!raw)return null;
  try{return JSON.parse(raw);}catch(e){throw new Error('SUBMISSION_MANIFEST_CORRUPT: do not rerun.');}
}
function snsiSave_(m){
  m.updatedAt=new Date().toISOString();
  snsiProps_().setProperty(SNC_SUB_INT_MANIFEST_KEY_,JSON.stringify(m));
}
function snsiAssertTest_(){
  var p=snsiProps_(),ss=SpreadsheetApp.getActiveSpreadsheet();
  if(p.getProperty('SNC_ITR_ENVIRONMENT')!=='TEST' ||
     p.getProperty('SNC_ITR_TEST_SPREADSHEET_ID')!==SNC_SUB_INT_SPREADSHEET_ID_ ||
     !ss || ss.getId()!==SNC_SUB_INT_SPREADSHEET_ID_)
    throw new Error('SAFETY_STOP: exact TEST environment mismatch.');
}
function snsiActor_(uid){
  return {userId:String(uid),roles:getEffectiveRolesForUser_(String(uid))};
}
function snsiAdmin_(){
  var rows=cmRows_('UserRoles').filter(function(r){
    return String(r.Role)==='SYSTEM_ADMIN' && String(r.ScopeType)==='SYSTEM' &&
      String(r.Status).toUpperCase()==='ACTIVE';
  });
  for(var i=0;i<rows.length;i++){
    var u=cmGet_('Users','UserID',rows[i].UserID);
    if(u && String(u.Status).toUpperCase()==='ACTIVE'){
      var a=snsiActor_(u.UserID);
      if(cmSystem_(a,'SYSTEM_ADMIN'))return a;
    }
  }
  throw new Error('ACTIVE_SYSTEM_ADMIN_NOT_FOUND');
}
function snsiCore_(){
  var raw=snsiProps_().getProperty('SNC_SYNTHETIC_FIXTURE_MANIFEST_TEST');
  if(!raw)throw new Error('CORE_FIXTURE_MANIFEST_MISSING');
  var m=JSON.parse(raw);
  if(!m.offeringId || !Array.isArray(m.userIds) || m.userIds.length!==6 ||
     !Array.isArray(m.enrollmentIds) || m.enrollmentIds.length!==6)
    throw new Error('CORE_FIXTURE_MANIFEST_INVALID');
  return m;
}
function snsiReq_(tag){return SNC_SUB_INT_PREFIX_+tag+'_'+Utilities.getUuid();}
function snsiCall_(handler,action,actor,payload,tag){
  return handler(action,actor,payload||{},snsiReq_(tag||action));
}
function snsiExpectError_(fn,code){
  try{fn();return {pass:false,actual:'SUCCESS',expected:code};}
  catch(e){return {pass:String(e.apiCode||'ERROR')===code,actual:String(e.apiCode||'ERROR'),expected:code};}
}
function snsiRows_(name){return cmRows_(name);}
function snsiIds_(name,key){
  return snsiRows_(name).map(function(r){return String(r[key]||'');}).filter(Boolean).sort();
}
function snsiDelta_(before,after){
  var b={};before.forEach(function(x){b[x]=true;});
  return after.filter(function(x){return !b[x];});
}
function snsiCase_(m,id,fn){
  if(m.cases.some(function(c){return c.id===id;}))throw new Error('CASE_ALREADY_RECORDED_'+id);
  var rec={id:id,status:'NOT RUN',startedAt:new Date().toISOString()};
  try{
    var r=fn();
    rec.status=r && r.pass===false?'FAIL':'PASS';
    if(r && r.detail!==undefined)rec.detail=r.detail;
    if(r && r.actual!==undefined)rec.actual=r.actual;
    if(r && r.expected!==undefined)rec.expected=r.expected;
  }catch(e){
    rec.status='FAIL';rec.errorCode=String(e.apiCode||'ERROR');
    rec.errorMessage=String(e.message||e).slice(0,240);
    m.stopReason='CASE_FAILED_'+id;
  }
  rec.finishedAt=new Date().toISOString();
  m.cases.push(rec);snsiSave_(m);
  if(rec.status!=='PASS')throw new Error('STOP_AFTER_'+id+'_'+rec.status);
  return rec;
}
function snsiOpenAssignment_(admin,offeringId,title,type,max,deadline,tag,onCreated){
  var a=snsiCall_(handleAssignmentManagementAction_,'assignment.create',admin,{
    offeringId:offeringId,title:title,description:'Synthetic WP-SUB-1 integration fixture',
    instructions:'Synthetic test only',maxScore:100,deadline:deadline,
    submissionType:type,maxGroupMembers:max
  },tag+'_CREATE');
  var id=String(a.AssignmentID);
  var opened=snsiCall_(handleAssignmentManagementAction_,'assignment.open',admin,{assignmentId:id},tag+'_OPEN');
  if(String(opened.Status)!=='OPEN')throw new Error('ASSIGNMENT_OPEN_FAILED_'+tag);
  return id;
}
function snsiFutureDeadline_(offsetMinutes){
  return Utilities.formatDate(new Date(Date.now()+offsetMinutes*60000),'Asia/Bangkok',"yyyy-MM-dd'T'HH:mm");
}
function snsiPastDeadline_(){
  return Utilities.formatDate(new Date(Date.now()-86400000),'Asia/Bangkok',"yyyy-MM-dd'T'HH:mm");
}
function snsiGroup_(offeringId,creator,members,name,tag,onCreated){
  var g=snsiCall_(handleGroupManagementAction_,'group.create',creator,{offeringId:offeringId,groupName:name},tag+'_CREATE');
  var gid=String(g.groupId);
  members.forEach(function(uid,i){
    snsiCall_(handleGroupManagementAction_,'group.join',snsiActor_(uid),{groupId:gid},tag+'_JOIN_'+i);
  });
  return gid;
}
function snsiFindSubmission_(assignmentId,studentId,groupId){
  return snsiRows_('Submissions').filter(function(s){
    return String(s.AssignmentID)===String(assignmentId) &&
      String(s.StudentUserID||'')===String(studentId||'') &&
      String(s.GroupID||'')===String(groupId||'');
  }).sort(function(a,b){return Number(a.RevisionNumber)-Number(b.RevisionNumber);});
}
function snsiAuditFor_(ids){
  var set={};ids.forEach(function(x){set[String(x)]=true;});
  return snsiRows_('AuditLogs').filter(function(a){
    return String(a.EntityType)==='Submission' && set[String(a.EntityID)];
  });
}
function snsiStubBegin_(){
  var original=notifySubmissionReceived_,calls=[];
  notifySubmissionReceived_=function(a,s){
    calls.push({assignmentId:String(a.AssignmentID),submissionId:String(s.SubmissionID)});
  };
  return {original:original,calls:calls};
}
function snsiStubRestore_(stub){
  notifySubmissionReceived_=stub.original;
  if(notifySubmissionReceived_!==stub.original)throw new Error('NOTIFICATION_HOOK_RESTORE_FAILED');
}
function snsiPreflightForRunner_(){
  snsiAssertTest_();
  if(typeof SNC_SubmissionIntegrationPreflight_READONLY_TEST!=='function')
    throw new Error('WP_SUB_0_PREFLIGHT_FUNCTION_MISSING');
  var p=SNC_SubmissionIntegrationPreflight_READONLY_TEST();
  if(!p || p.status!=='READY')throw new Error('WP_SUB_0_PREFLIGHT_NOT_READY');
  if(snsiReadManifest_())throw new Error('SUBMISSION_MANIFEST_ALREADY_EXISTS_STOP_AND_RECONCILE');
  var core=snsiCore_(),users=core.userIds.map(function(id){return cmGet_('Users','UserID',id);});
  if(users.some(function(u){return !u||String(u.Status).toUpperCase()!=='ACTIVE';}))
    throw new Error('CORE_USERS_NOT_ACTIVE');
  return {core:core,admin:snsiAdmin_()};
}

/** Read-only source/data gate. Does not create or mutate records. */
function SNC_SubmissionIntegrationRunnerPreflight_TEST(){
  var out={runner:'SNC_SubmissionIntegrationRunnerPreflight_TEST',version:SNC_SUB_INT_VERSION_,
    mode:'READ_ONLY_WP_SUB_1_RUNNER_PREFLIGHT',writesExpected:0,externalCallsExpected:0,
    status:'BLOCKED',checks:[]};
  function add(id,ok,detail){out.checks.push({id:id,status:ok?'PASS':'BLOCKED',detail:detail});}
  try{
    snsiAssertTest_();
    add('ENV-01',true,'Exact TEST Script Properties and active Spreadsheet match.');
    var core=snsiCore_();
    add('CORE-01',core.userIds.length===6 && core.enrollmentIds.length===6,'Existing Core Fixture contains six users and enrollments.');
    var prior=snsiReadManifest_();
    add('MANIFEST-01',!prior,'No prior Submission Integration manifest exists.');
    add('HANDLERS-01',typeof handleSubmissionManagementAction_==='function' &&
      typeof handleAssignmentManagementAction_==='function' &&
      typeof handleGroupManagementAction_==='function' &&
      typeof appendAudit_==='function' && typeof notifySubmissionReceived_==='function',
      'Required handlers and notification hook are loaded.');
    var admin=snsiAdmin_();
    add('ACTOR-01',Boolean(admin),'Existing active SYSTEM_ADMIN actor resolves.');
    add('BASELINE-01',snsiRows_('Submissions').length===0 &&
      snsiRows_('Groups').length===0 && snsiRows_('GroupMembers').length===0,
      'No prior Submission/Group/GroupMember rows exist after approved cleanup.');
    add('PREFIX-01',!snsiRows_('Assignments').some(function(r){return String(r.Title||'').indexOf(SNC_SUB_INT_PREFIX_)===0;}) &&
      !snsiRows_('Groups').some(function(r){return String(r.GroupName||'').indexOf(SNC_SUB_INT_PREFIX_)===0;}),
      'Reserved prefix is unused.');
  }catch(e){out.checks.push({id:'PREFLIGHT-ERROR',status:'BLOCKED',detail:String(e.message||e).slice(0,240)});}
  var blocked=out.checks.filter(function(x){return x.status!=='PASS';}).length;
  out.status=blocked===0?'READY':'BLOCKED';out.summary={pass:out.checks.length-blocked,blocked:blocked,total:out.checks.length};
  console.log('SNC_SUBMISSION_RUNNER_PREFLIGHT='+JSON.stringify(out));return out;
}

/**
 * Persistent WP-SUB-1 entry. Run exactly once after adding this file to TEST GAS.
 * If interrupted or not COMPLETE, do not rerun; share the complete execution log.
 */
function SNC_RunSubmissionIntegration_CONFIRMED_TEST(confirmationPhrase){
  if(confirmationPhrase!==SNC_SUB_INT_CONFIRM_)
    return {status:'ABORTED_CONFIRMATION_REQUIRED',writesExpected:0,deletionPerformed:false};
  var lock=LockService.getDocumentLock();
  if(!lock)throw new Error('DOCUMENT_LOCK_UNAVAILABLE');
  lock.waitLock(30000);
  var manifest=null,stub=null;
  try{
    var ready=snsiPreflightForRunner_();
    var core=ready.core,admin=ready.admin,u=core.userIds.map(function(id){return snsiActor_(id);});
    var before={
      Assignments:snsiIds_('Assignments','AssignmentID'),
      Groups:snsiIds_('Groups','GroupID'),
      GroupMembers:snsiIds_('GroupMembers','GroupMemberID'),
      Submissions:snsiIds_('Submissions','SubmissionID'),
      SubmissionFiles:snsiIds_('SubmissionFiles','SubmissionFileID'),
      IdempotencyKeys:snsiIds_('IdempotencyKeys','IdempotencyKey'),
      AuditLogs:snsiIds_('AuditLogs','AuditID')
    };
    manifest={runner:'SNC_RunSubmissionIntegration_CONFIRMED_TEST',version:SNC_SUB_INT_VERSION_,
      status:'IN_PROGRESS',evidenceLevel:'HANDLER_LEVEL_INTEGRATION',createdAt:new Date().toISOString(),
      source:SNC_SUB_INT_SOURCE_,offeringId:String(core.offeringId),userIds:core.userIds.map(String),
      baseline:before,fixtures:{groups:{},assignments:{}},created:{Groups:[],GroupMembers:[],
      Assignments:[],Submissions:[],SubmissionFiles:[],IdempotencyKeys:[],AuditLogs:[]},
      cases:[],notificationStub:{installed:false,restored:false,calls:[]},
      externalCallsExpected:0,cleanupStatus:'NOT AUTHORIZED',stopReason:null};
    snsiSave_(manifest);

    // Synthetic groups: Alpha(2), Beta(3), Solo(1), through business handlers only.
    var alpha=snsiGroup_(core.offeringId,u[0], [core.userIds[1]],SNC_SUB_INT_PREFIX_+'Alpha','ALPHA',function(id){manifest.fixtures.groups.Alpha=id;snsiSave_(manifest);});
    manifest.fixtures.groups.Alpha=alpha;snsiSave_(manifest);
    var beta=snsiGroup_(core.offeringId,u[2],[core.userIds[3],core.userIds[4]],SNC_SUB_INT_PREFIX_+'Beta','BETA',function(id){manifest.fixtures.groups.Beta=id;snsiSave_(manifest);});
    manifest.fixtures.groups.Beta=beta;snsiSave_(manifest);
    var solo=snsiGroup_(core.offeringId,u[5],[],SNC_SUB_INT_PREFIX_+'Solo','SOLO',function(id){manifest.fixtures.groups.Solo=id;snsiSave_(manifest);});
    manifest.fixtures.groups.Solo=solo;snsiSave_(manifest);

    // Assignments: Individual, Group max 3, max 2, unlimited, CLOSED and LATE.
    var future=snsiFutureDeadline_(120);
    manifest.fixtures.assignments.Individual=snsiOpenAssignment_(admin,core.offeringId,SNC_SUB_INT_PREFIX_+'Individual','INDIVIDUAL',null,future,'IND',function(id){manifest.fixtures.assignments.Individual=id;snsiSave_(manifest);});
    manifest.fixtures.assignments.GroupMax3=snsiOpenAssignment_(admin,core.offeringId,SNC_SUB_INT_PREFIX_+'GroupMax3','GROUP',3,future,'G3',function(id){manifest.fixtures.assignments.GroupMax3=id;snsiSave_(manifest);});
    manifest.fixtures.assignments.GroupMax2=snsiOpenAssignment_(admin,core.offeringId,SNC_SUB_INT_PREFIX_+'GroupMax2','GROUP',2,future,'G2',function(id){manifest.fixtures.assignments.GroupMax2=id;snsiSave_(manifest);});
    manifest.fixtures.assignments.GroupUnlimited=snsiOpenAssignment_(admin,core.offeringId,SNC_SUB_INT_PREFIX_+'GroupUnlimited','GROUP','',future,'G0',function(id){manifest.fixtures.assignments.GroupUnlimited=id;snsiSave_(manifest);});
    manifest.fixtures.assignments.GroupClosed=snsiOpenAssignment_(admin,core.offeringId,SNC_SUB_INT_PREFIX_+'GroupClosed','GROUP',3,future,'GC',function(id){manifest.fixtures.assignments.GroupClosed=id;snsiSave_(manifest);});
    snsiCall_(handleAssignmentManagementAction_,'assignment.close',admin,{assignmentId:manifest.fixtures.assignments.GroupClosed},'GC_CLOSE');
    manifest.fixtures.assignments.IndividualLate=snsiOpenAssignment_(admin,core.offeringId,SNC_SUB_INT_PREFIX_+'IndividualLate','INDIVIDUAL',null,snsiPastDeadline_(),'LATE',function(id){manifest.fixtures.assignments.IndividualLate=id;snsiSave_(manifest);});
    snsiSave_(manifest);

    stub=snsiStubBegin_();manifest.notificationStub.installed=true;snsiSave_(manifest);

    // SUB-04: one-person Group must fail minimum of two.
    snsiCase_(manifest,'SUB-04',function(){
      var r=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',u[5],
        {assignmentId:manifest.fixtures.assignments.GroupMax3,groupId:solo},'SUB04');},'GROUP_MIN_MEMBERS_NOT_MET');
      return {pass:r.pass,actual:r.actual,expected:r.expected};
    });
    // SUB-01: Individual submission by a student with no active group.
    snsiCall_(handleGroupManagementAction_,'group.leave',u[5],{groupId:solo},'SOLO_LEAVE');
    snsiCase_(manifest,'SUB-01',function(){
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.create',u[5],
        {assignmentId:manifest.fixtures.assignments.Individual},'SUB01');
      var s=r.submission;
      manifest.created.Submissions.push(String(s.SubmissionID));snsiSave_(manifest);
      return {pass:s.SubmissionType==='INDIVIDUAL'&&String(s.StudentUserID)===String(core.userIds[5])&&
        String(s.SubmittedByUserID)===String(core.userIds[5])&&!s.GroupID,detail:'Individual target fields verified.'};
    });
    // SUB-02: Individual submission remains independent for a group member.
    snsiCase_(manifest,'SUB-02',function(){
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.create',u[1],
        {assignmentId:manifest.fixtures.assignments.Individual},'SUB02');
      manifest.created.Submissions.push(String(r.submission.SubmissionID));snsiSave_(manifest);
      return {pass:r.submission.SubmissionType==='INDIVIDUAL'&&String(r.submission.StudentUserID)===String(core.userIds[1])};
    });
    // SUB-03: non-enrolled synthetic actor is rejected without business rows.
    snsiCase_(manifest,'SUB-03',function(){
      var n=snsiRows_('Submissions').length;
      var r=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',
        {userId:'SNC_NON_ENROLLED_TEST',roles:[{role:'STUDENT',scopeType:'SELF',scopeId:'SNC_NON_ENROLLED_TEST'}]},
        {assignmentId:manifest.fixtures.assignments.Individual},'SUB03');},'ENROLLMENT_REQUIRED');
      return {pass:r.pass&&snsiRows_('Submissions').length===n,actual:r.actual,expected:r.expected};
    });
    // SUB-07: Beta has three members and must exceed max=2.
    snsiCase_(manifest,'SUB-07',function(){
      var n=snsiRows_('Submissions').length;
      var r=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',u[2],
        {assignmentId:manifest.fixtures.assignments.GroupMax2,groupId:beta},'SUB07');},'GROUP_MAX_MEMBERS_EXCEEDED');
      return {pass:r.pass&&snsiRows_('Submissions').length===n,actual:r.actual,expected:r.expected};
    });
    // SUB-09: ordinary Alpha member cannot submit for group.
    snsiCase_(manifest,'SUB-09',function(){
      var n=snsiRows_('Submissions').length;
      var r=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',u[1],
        {assignmentId:manifest.fixtures.assignments.GroupMax3,groupId:alpha},'SUB09');},'FORBIDDEN');
      return {pass:r.pass&&snsiRows_('Submissions').length===n,actual:r.actual,expected:r.expected};
    });
    // SUB-10: non-member cannot submit for an existing group.
    snsiCase_(manifest,'SUB-10',function(){
      var r=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',u[5],
        {assignmentId:manifest.fixtures.assignments.GroupMax3,groupId:alpha},'SUB10');},'GROUP_MEMBERSHIP_REQUIRED');
      return {pass:r.pass,actual:r.actual,expected:r.expected};
    });
    // SUB-05: Alpha boundary (2) succeeds and locks only Alpha.
    snsiCase_(manifest,'SUB-05',function(){
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.create',u[0],
        {assignmentId:manifest.fixtures.assignments.GroupMax3,groupId:alpha},'SUB05');
      manifest.created.Submissions.push(String(r.submission.SubmissionID));snsiSave_(manifest);
      var g=gmGet_('Groups','GroupID',alpha);
      return {pass:Number(r.submission.RevisionNumber)===1&&Boolean(g.MembershipLockedAt),detail:'Two-member Alpha submitted and locked.'};
    });
    // SUB-11: locked Alpha rejects join, leave and representative changes.
    snsiCase_(manifest,'SUB-11',function(){
      var a=snsiExpectError_(function(){snsiCall_(handleGroupManagementAction_,'group.join',u[5],{groupId:alpha},'SUB11J');},'GROUP_MEMBERSHIP_LOCKED');
      var b=snsiExpectError_(function(){snsiCall_(handleGroupManagementAction_,'group.leave',u[1],{groupId:alpha},'SUB11L');},'GROUP_MEMBERSHIP_LOCKED');
      var c=snsiExpectError_(function(){snsiCall_(handleGroupManagementAction_,'group.selectRepresentative',u[0],
        {groupId:alpha,userId:core.userIds[1]},'SUB11R');},'GROUP_MEMBERSHIP_LOCKED');
      return {pass:a.pass&&b.pass&&c.pass,detail:'All three membership mutations rejected.'};
    });
    // SUB-12: Beta remains mutable while Alpha is locked; temporary join/leave.
    snsiCase_(manifest,'SUB-12',function(){
      snsiCall_(handleGroupManagementAction_,'group.join',u[5],{groupId:beta},'SUB12J');
      snsiCall_(handleGroupManagementAction_,'group.leave',u[5],{groupId:beta},'SUB12L');
      return {pass:Boolean(gmGet_('Groups','GroupID',beta))&&!gmIsLocked_(gmGet_('Groups','GroupID',beta)),
        detail:'Unlocked Beta accepted join and leave while Alpha remained locked.'};
    });
    // SUB-06: Beta at max=3 boundary succeeds and locks Beta.
    snsiCase_(manifest,'SUB-06',function(){
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.create',u[2],
        {assignmentId:manifest.fixtures.assignments.GroupMax3,groupId:beta},'SUB06');
      manifest.created.Submissions.push(String(r.submission.SubmissionID));snsiSave_(manifest);
      return {pass:Number(r.submission.RevisionNumber)===1&&Boolean(gmGet_('Groups','GroupID',beta).MembershipLockedAt)};
    });
    // SUB-08: blank maximum accepts the same valid 3-member group.
    snsiCase_(manifest,'SUB-08',function(){
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.create',u[2],
        {assignmentId:manifest.fixtures.assignments.GroupUnlimited,groupId:beta},'SUB08');
      manifest.created.Submissions.push(String(r.submission.SubmissionID));snsiSave_(manifest);
      return {pass:Number(r.submission.RevisionNumber)===1};
    });
    // SUB-13: Individual remains allowed after the member's group has locked.
    snsiCase_(manifest,'SUB-13',function(){
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.create',u[4],
        {assignmentId:manifest.fixtures.assignments.Individual},'SUB13');
      manifest.created.Submissions.push(String(r.submission.SubmissionID));snsiSave_(manifest);
      return {pass:r.submission.SubmissionType==='INDIVIDUAL'&&String(r.submission.StudentUserID)===String(core.userIds[4])};
    });
    // SUB-14: new requestId for existing Individual target is DUPLICATE.
    snsiCase_(manifest,'SUB-14',function(){
      var n=snsiRows_('Submissions').length;
      var r=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',u[5],
        {assignmentId:manifest.fixtures.assignments.Individual},'SUB14');},'DUPLICATE');
      return {pass:r.pass&&snsiRows_('Submissions').length===n,actual:r.actual,expected:r.expected};
    });
    // SUB-15: Individual revision creates immutable linked revision.
    snsiCase_(manifest,'SUB-15',function(){
      var first=snsiFindSubmission_(manifest.fixtures.assignments.Individual,core.userIds[5],'')[0];
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.revise',u[5],
        {assignmentId:manifest.fixtures.assignments.Individual,driveUrls:['https://drive.google.com/file/d/SNC_SYNTHETIC_URL_ONLY']},'SUB15');
      var all=snsiFindSubmission_(manifest.fixtures.assignments.Individual,core.userIds[5],'');
      manifest.created.Submissions.push(String(r.submission.SubmissionID));snsiSave_(manifest);
      var file=snsiRows_('SubmissionFiles').filter(function(f){return String(f.SubmissionID)===String(r.submission.SubmissionID);})[0];
      manifest.created.SubmissionFiles.push(String(file.SubmissionFileID));snsiSave_(manifest);
      return {pass:all.length===2&&Number(all[1].RevisionNumber)===2&&
        String(all[1].PreviousSubmissionID)===String(first.SubmissionID)&&
        String(first.SubmissionID)!==String(all[1].SubmissionID)&&
        Boolean(file)&&String(file.DriveUrl)==='https://drive.google.com/file/d/SNC_SYNTHETIC_URL_ONLY'};
    });
    // SUB-16: Group revision by leader preserves lock and revision chain.
    snsiCase_(manifest,'SUB-16',function(){
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.revise',u[2],
        {assignmentId:manifest.fixtures.assignments.GroupMax3,groupId:beta},'SUB16');
      manifest.created.Submissions.push(String(r.submission.SubmissionID));snsiSave_(manifest);
      var all=snsiFindSubmission_(manifest.fixtures.assignments.GroupMax3,'',beta);
      return {pass:all.length===2&&Number(r.submission.RevisionNumber)===2&&
        String(r.submission.PreviousSubmissionID)===String(all[0].SubmissionID)&&
        Boolean(gmGet_('Groups','GroupID',beta).MembershipLockedAt)};
    });
    // SUB-17: identical request replay returns exact stored response, no new rows.
    snsiCase_(manifest,'SUB-17',function(){
      var payload={assignmentId:manifest.fixtures.assignments.Individual,driveUrls:[]},rid=snsiReq_('SUB17_REPLAY');
      var beforeN=snsiRows_('Submissions').length,beforeA=snsiRows_('AuditLogs').length;
      var first=handleSubmissionManagementAction_('submission.create',u[2],payload,rid);
      manifest.created.Submissions.push(String(first.submission.SubmissionID));snsiSave_(manifest);
      var second=handleSubmissionManagementAction_('submission.create',u[3],payload,rid);
      return {pass:JSON.stringify(first)===JSON.stringify(second)&&
        snsiRows_('Submissions').length===beforeN+1&&snsiRows_('AuditLogs').length===beforeA+1};
    });
    // SUB-18: same key with changed payload returns CONFLICT without mutation.
    snsiCase_(manifest,'SUB-18',function(){
      var payload={assignmentId:manifest.fixtures.assignments.Individual,driveUrls:[]},rid=snsiReq_('SUB18_CONFLICT');
      handleSubmissionManagementAction_('submission.create',u[3],payload,rid);
      var n=snsiRows_('Submissions').length;
      var r=snsiExpectError_(function(){handleSubmissionManagementAction_('submission.create',u[3],
        {assignmentId:manifest.fixtures.assignments.Individual,driveUrls:['https://docs.google.com/document/d/CHANGED']},rid);},'CONFLICT');
      return {pass:r.pass&&snsiRows_('Submissions').length===n,actual:r.actual,expected:r.expected};
    });
    // SUB-19: deadline in the past does not close the assignment; result is LATE.
    snsiCase_(manifest,'SUB-19',function(){
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.create',u[5],
        {assignmentId:manifest.fixtures.assignments.IndividualLate},'SUB19');
      manifest.created.Submissions.push(String(r.submission.SubmissionID));snsiSave_(manifest);
      var a=cmGet_('Assignments','AssignmentID',manifest.fixtures.assignments.IndividualLate);
      return {pass:String(a.Status)==='OPEN'&&String(r.submission.SubmissionStatus)==='LATE'};
    });
    // SUB-20: CLOSED Assignment rejects submission.
    snsiCase_(manifest,'SUB-20',function(){
      var r=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',u[0],
        {assignmentId:manifest.fixtures.assignments.GroupClosed,groupId:alpha},'SUB20');},'ASSIGNMENT_CLOSED');
      return {pass:r.pass,actual:r.actual,expected:r.expected};
    });
    // SUB-21/22: URL validation, including unsupported host and >10 references.
    snsiCase_(manifest,'SUB-21',function(){
      var r=snsiCall_(handleSubmissionManagementAction_,'submission.create',u[3],
        {assignmentId:manifest.fixtures.assignments.IndividualLate,driveUrls:['https://docs.google.com/document/d/VALID']},'SUB21');
      manifest.created.Submissions.push(String(r.submission.SubmissionID));snsiSave_(manifest);
      var f=snsiRows_('SubmissionFiles').filter(function(x){return String(x.SubmissionID)===String(r.submission.SubmissionID);})[0];
      manifest.created.SubmissionFiles.push(String(f.SubmissionFileID));snsiSave_(manifest);
      return {pass:Boolean(f)&&String(f.DriveUrl)==='https://docs.google.com/document/d/VALID'};
    });
    snsiCase_(manifest,'SUB-22',function(){
      var bad=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',u[1],
        {assignmentId:manifest.fixtures.assignments.IndividualLate,driveUrls:['http://drive.google.com/not-https']},'SUB22A');},'FILE_INVALID');
      var many=new Array(11).fill('https://drive.google.com/file/d/SYNTHETIC');
      var tooMany=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',u[1],
        {assignmentId:manifest.fixtures.assignments.IndividualLate,driveUrls:many},'SUB22B');},'VALIDATION_ERROR');
      return {pass:bad.pass&&tooMany.pass,detail:'Invalid URL and attachment count rejected.'};
    });
    // SUB-25: controlled in-memory Audit append failure; exact compensating rollback.
    snsiCase_(manifest,'SUB-25',function(){
      var beforeS=snsiIds_('Submissions','SubmissionID'),beforeF=snsiIds_('SubmissionFiles','SubmissionFileID');
      var beforeLock=String(gmGet_('Groups','GroupID',alpha).MembershipLockedAt||'');
      var originalAppend=appendAudit_,restored=false,errCode='';
      try{
        appendAudit_=function(actorId,action,entityType,entityId,details,requestId){
          if(String(entityType)==='Submission'&&String(action)==='SUBMISSION_CREATED')
            throw apiError_('INJECTED_AUDIT_FAILURE','Controlled test failure.');
          return originalAppend(actorId,action,entityType,entityId,details,requestId);
        };
        var r=snsiExpectError_(function(){snsiCall_(handleSubmissionManagementAction_,'submission.create',u[0],
          {assignmentId:manifest.fixtures.assignments.IndividualLate},'SUB25');},'SUBMISSION_WRITE_FAILED');
        errCode=r.actual;
      }finally{
        appendAudit_=originalAppend;restored=appendAudit_===originalAppend;
      }
      var afterS=snsiIds_('Submissions','SubmissionID'),afterF=snsiIds_('SubmissionFiles','SubmissionFileID');
      var afterLock=String(gmGet_('Groups','GroupID',alpha).MembershipLockedAt||'');
      return {pass:restored&&errCode==='SUBMISSION_WRITE_FAILED'&&JSON.stringify(beforeS)===JSON.stringify(afterS)&&
        JSON.stringify(beforeF)===JSON.stringify(afterF)&&beforeLock===afterLock,
        detail:'Injected Audit append failure returned SUBMISSION_WRITE_FAILED; Submission/SubmissionFiles and Group lock match pre-state; append dependency restored.'};
    });

        // Notification stub and final evidence.
    manifest.notificationStub.calls=stub.calls.slice();snsiStubRestore_(stub);stub=null;
    manifest.notificationStub.restored=true;snsiSave_(manifest);
    var createdAudit=snsiAuditFor_(manifest.created.Submissions);
    var current={
      Assignments:snsiIds_('Assignments','AssignmentID'),Groups:snsiIds_('Groups','GroupID'),
      GroupMembers:snsiIds_('GroupMembers','GroupMemberID'),Submissions:snsiIds_('Submissions','SubmissionID'),
      SubmissionFiles:snsiIds_('SubmissionFiles','SubmissionFileID'),
      IdempotencyKeys:snsiIds_('IdempotencyKeys','IdempotencyKey'),AuditLogs:snsiIds_('AuditLogs','AuditID')
    };
    Object.keys(current).forEach(function(k){manifest.created[k]=snsiDelta_(before[k],current[k]);});
    var caseFailures=manifest.cases.filter(function(c){return c.status!=='PASS';});
    manifest.reconciliation={currentCounts:{
      Groups:snsiRows_('Groups').length,GroupMembers:snsiRows_('GroupMembers').length,
      Submissions:snsiRows_('Submissions').length,SubmissionFiles:snsiRows_('SubmissionFiles').length,
      IdempotencyKeys:snsiRows_('IdempotencyKeys').length,AuditLogs:snsiRows_('AuditLogs').length
    },submissionAuditRows:createdAudit.length,notificationStubCalls:manifest.notificationStub.calls.length,
      notificationStubRestored:manifest.notificationStub.restored,externalCallsExpected:0};
    manifest.status=caseFailures.length?'COMPLETE_WITH_FAILURES':'COMPLETE_WITH_REVIEW_ITEMS';
    manifest.stopReason=null;snsiSave_(manifest);
    var out={runner:manifest.runner,version:SNC_SUB_INT_VERSION_,status:manifest.status,
      evidenceLevel:'HANDLER_LEVEL_INTEGRATION',caseCount:manifest.cases.length,
      pass:manifest.cases.filter(function(c){return c.status==='PASS';}).length,
      fail:caseFailures.length,createdCounts:Object.keys(manifest.created).reduce(function(o,k){o[k]=manifest.created[k].length;return o;},{}),
      notificationStubRestored:manifest.notificationStub.restored,notificationStubCalls:manifest.notificationStub.calls.length,
      externalCallsExpected:0,cleanupStatus:'NOT AUTHORIZED'};
    console.log('SNC_SUBMISSION_INTEGRATION='+JSON.stringify(out));
    return out;
  }catch(e){
    if(manifest){
      manifest.status='STOPPED_REQUIRES_RECONCILIATION';
      manifest.stopReason=String(e.message||e).slice(0,300);
      try{
        if(stub){manifest.notificationStub.calls=stub.calls.slice();snsiStubRestore_(stub);manifest.notificationStub.restored=true;}
      }catch(restoreError){manifest.notificationStub.restoreError=String(restoreError.message||restoreError);}
      try{
        var after={
          Groups:snsiIds_('Groups','GroupID'),GroupMembers:snsiIds_('GroupMembers','GroupMemberID'),
          Assignments:snsiIds_('Assignments','AssignmentID'),Submissions:snsiIds_('Submissions','SubmissionID'),
          SubmissionFiles:snsiIds_('SubmissionFiles','SubmissionFileID'),
          IdempotencyKeys:snsiIds_('IdempotencyKeys','IdempotencyKey'),AuditLogs:snsiIds_('AuditLogs','AuditID')
        };
        Object.keys(after).forEach(function(k){manifest.created[k]=snsiDelta_(manifest.baseline[k]||[],after[k]);});
        snsiSave_(manifest);
      }catch(reconcileError){manifest.reconciliationError=String(reconcileError.message||reconcileError);}
      console.error('SNC_SUBMISSION_INTEGRATION_STOP='+JSON.stringify({status:manifest.status,
        caseCount:manifest.cases.length,stopReason:manifest.stopReason,notificationStubRestored:manifest.notificationStub.restored}));
    }
    throw e;
  }finally{lock.releaseLock();}
}

/** Read-only manifest summary; does not expose raw synthetic IDs. */
function SNC_SubmissionIntegrationManifestSummary_READONLY_TEST(){
  snsiAssertTest_();
  var m=snsiReadManifest_();
  if(!m)return {status:'NO_MANIFEST',writesExpected:0,externalCallsExpected:0};
  var out={status:m.status,version:m.version,caseCount:m.cases.length,
    pass:m.cases.filter(function(c){return c.status==='PASS';}).length,
    fail:m.cases.filter(function(c){return c.status==='FAIL';}).length,
    stopReason:m.stopReason,notificationStubRestored:m.notificationStub.restored,
    notificationStubCalls:(m.notificationStub.calls||[]).length,cleanupStatus:m.cleanupStatus,
    createdCounts:{}};
  Object.keys(m.created||{}).forEach(function(k){out.createdCounts[k]=(m.created[k]||[]).length;});
  out.writesExpected=0;out.externalCallsExpected=0;
  console.log('SNC_SUBMISSION_MANIFEST_SUMMARY='+JSON.stringify(out));return out;
}
