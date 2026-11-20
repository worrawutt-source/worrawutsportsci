/**
 * SPORT NUTRITION CLASSROOM — Assignment Management
 * Implements DOC-02/DOC-05/DOC-06/DOC-08 approved MVP requirements.
 * All assignment operations are scoped to an authorized CourseOffering.
 */

function amDate_(value,key){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw apiError_('VALIDATION_ERROR',key+' must use YYYY-MM-DDTHH:mm in Asia/Bangkok local time.');
  var d=new Date(value+':00+07:00');
  if(isNaN(d.getTime())||Utilities.formatDate(d,'Asia/Bangkok',"yyyy-MM-dd'T'HH:mm")!==value)throw apiError_('VALIDATION_ERROR',key+' is invalid.');
  return d;
}
function amEnabled_(v){return v===true||String(v).toLowerCase()==='true'||String(v)==='1';}
function amScheduleConfig_(p,current){
  var oe=p.autoOpenEnabled===undefined?(current?amEnabled_(current.AutoOpenEnabled):false):amEnabled_(p.autoOpenEnabled);
  var ce=p.autoCloseEnabled===undefined?(current?amEnabled_(current.AutoCloseEnabled):false):amEnabled_(p.autoCloseEnabled);
  var ov=p.scheduledOpenAt===undefined?(current?current.ScheduledOpenAt:''):p.scheduledOpenAt;
  var cv=p.scheduledCloseAt===undefined?(current?current.ScheduledCloseAt:''):p.scheduledCloseAt;
  var oa=oe?amDate_(ov,'scheduledOpenAt'):'',ca=ce?amDate_(cv,'scheduledCloseAt'):'';
  if(oe&&ce&&ca<=oa)throw apiError_('VALIDATION_ERROR','Scheduled close must be later than scheduled open.');
  var oc=!current||oe!==amEnabled_(current.AutoOpenEnabled)||(oe&&new Date(current.ScheduledOpenAt).getTime()!==oa.getTime());
  var cc=!current||ce!==amEnabled_(current.AutoCloseEnabled)||(ce&&new Date(current.ScheduledCloseAt).getTime()!==ca.getTime());
  return {AutoOpenEnabled:oe,ScheduledOpenAt:oa,AutoOpenProcessedAt:oc?'':(current?current.AutoOpenProcessedAt||'':''),AutoCloseEnabled:ce,ScheduledCloseAt:ca,AutoCloseProcessedAt:cc?'':(current?current.AutoCloseProcessedAt||'':'')};
}

function amSubmissionConfig_(submissionType,maxGroupMembers){
  var type=String(submissionType||'').trim().toUpperCase();
  if(type!=='INDIVIDUAL'&&type!=='GROUP')throw apiError_('VALIDATION_ERROR','SubmissionType must be INDIVIDUAL or GROUP.');
  if(type==='INDIVIDUAL'){
    if(maxGroupMembers!==undefined&&maxGroupMembers!==null&&String(maxGroupMembers).trim()!==''){
      throw apiError_('VALIDATION_ERROR','MaxGroupMembers is only valid for GROUP assignments.');
    }
    return {SubmissionType:'INDIVIDUAL',MinGroupMembers:'',MaxGroupMembers:''};
  }
  var max='';
  if(maxGroupMembers!==undefined&&maxGroupMembers!==null&&String(maxGroupMembers).trim()!==''){
    max=Number(maxGroupMembers);
    if(!Number.isInteger(max)||max<2||max>500)throw apiError_('VALIDATION_ERROR','MaxGroupMembers must be an integer of at least 2, or empty for unlimited.');
  }
  return {SubmissionType:'GROUP',MinGroupMembers:2,MaxGroupMembers:max};
}

function amGet_(id){return cmGet_('Assignments','AssignmentID',id);}
function amCanManage_(actor,assignment){
  var offering=cmGet_('CourseOfferings','OfferingID',assignment.OfferingID);
  if(!offering)throw apiError_('NOT_FOUND','Course offering not found.');
  if(!cmCanOffering_(actor,offering))throw apiError_('FORBIDDEN','Cannot manage assignments for this offering.');
  return offering;
}
function amHasSubmissions_(assignmentId){
  var ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss&&ss.getSheetByName('Submissions');
  if(!sh||sh.getLastRow()<2)return false;
  return rowsAsObjects_(sh).some(function(r){return String(r.AssignmentID)===String(assignmentId);});
}
function amPublic_(a){
  return {
    AssignmentID:String(a.AssignmentID),OfferingID:String(a.OfferingID),
    Title:String(a.Title||''),Description:String(a.Description||''),
    Instructions:String(a.Instructions||''),MaxScore:Number(a.MaxScore),
    Deadline:a.Deadline,SubmissionType:String(a.SubmissionType),
    MinGroupMembers:a.MinGroupMembers===''?'':Number(a.MinGroupMembers),
    MaxGroupMembers:a.MaxGroupMembers===''?'':Number(a.MaxGroupMembers),
    Status:String(a.Status),OpenedAt:a.OpenedAt||'',ClosedAt:a.ClosedAt||'',
    AutoOpenEnabled:amEnabled_(a.AutoOpenEnabled),ScheduledOpenAt:a.ScheduledOpenAt||'',AutoOpenProcessedAt:a.AutoOpenProcessedAt||'',
    AutoCloseEnabled:amEnabled_(a.AutoCloseEnabled),ScheduledCloseAt:a.ScheduledCloseAt||'',AutoCloseProcessedAt:a.AutoCloseProcessedAt||'',
    CreatedAt:a.CreatedAt,UpdatedAt:a.UpdatedAt,CreatedByUserID:String(a.CreatedByUserID)
  };
}

function handleAssignmentManagementAction_(action,actor,p,requestId){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    if(action==='assignment.list'){
      var offeringId=String(p.offeringId||'').trim();
      var rows=cmRows_('Assignments').filter(function(a){
        if(offeringId&&String(a.OfferingID)!==offeringId)return false;
        return true;
      });
      return rows.filter(function(a){
        var linkedOffering=cmGet_('CourseOfferings','OfferingID',a.OfferingID);
        return Boolean(linkedOffering)&&cmCanOffering_(actor,linkedOffering);
      }).sort(function(a,b){return new Date(b.CreatedAt)-new Date(a.CreatedAt);})
        .map(amPublic_);
    }
    if(action==='assignment.get'){
      var found=amGet_(cmText_(p.assignmentId,100,'assignmentId',true));
      if(!found)throw apiError_('NOT_FOUND','Assignment not found.');
      amCanManage_(actor,found);return amPublic_(found);
    }
    if(action==='assignment.create'){
      var oid=cmText_(p.offeringId,100,'offeringId',true);
      var offering=cmGet_('CourseOfferings','OfferingID',oid);
      if(!offering||String(offering.Status).toUpperCase()!=='ACTIVE')throw apiError_('NOT_FOUND','Active course offering not found.');
      if(!cmCanOffering_(actor,offering))throw apiError_('FORBIDDEN','Cannot create assignment for this offering.');
      var title=cmText_(p.title,200,'title',true);
      var description=cmText_(p.description,5000,'description',false);
      var instructions=cmText_(p.instructions,10000,'instructions',false);
      var maxScore=Number(p.maxScore);
      if(!isFinite(maxScore)||maxScore<=0||maxScore>100000)throw apiError_('VALIDATION_ERROR','MaxScore must be greater than zero.');
      var deadline=amDate_(p.deadline,'deadline');
      var config=amSubmissionConfig_(p.submissionType,p.maxGroupMembers);
      var schedule=amScheduleConfig_(p,null);
      var id=Utilities.getUuid(),now=new Date();
      cmSheet_('Assignments').appendRow([
        id,oid,title,description,instructions,maxScore,deadline,config.SubmissionType,
        config.MinGroupMembers,config.MaxGroupMembers,'DRAFT','', '',now,now,actor.userId,
        schedule.AutoOpenEnabled,schedule.ScheduledOpenAt,schedule.AutoOpenProcessedAt,
        schedule.AutoCloseEnabled,schedule.ScheduledCloseAt,schedule.AutoCloseProcessedAt
      ]);
      appendAudit_(actor.userId,'ASSIGNMENT_CREATED','Assignment',id,{
        offeringId:oid,submissionType:config.SubmissionType,maxGroupMembers:config.MaxGroupMembers
      },requestId);
      return amPublic_(amGet_(id));
    }
    if(action==='assignment.update'){
      var aid=cmText_(p.assignmentId,100,'assignmentId',true),current=amGet_(aid);
      if(!current)throw apiError_('NOT_FOUND','Assignment not found.');
      amCanManage_(actor,current);
      var sh=cmSheet_('Assignments'),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
      var updates={};
      if(p.title!==undefined)updates.Title=cmText_(p.title,200,'title',true);
      if(p.description!==undefined)updates.Description=cmText_(p.description,5000,'description',false);
      if(p.instructions!==undefined)updates.Instructions=cmText_(p.instructions,10000,'instructions',false);
      if(p.maxScore!==undefined){var score=Number(p.maxScore);if(!isFinite(score)||score<=0||score>100000)throw apiError_('VALIDATION_ERROR','MaxScore must be greater than zero.');updates.MaxScore=score;}
      if(p.deadline!==undefined)updates.Deadline=amDate_(p.deadline,'deadline');
      if(p.maxGroupMembers!==undefined){
        if(String(current.SubmissionType)!=='GROUP')throw apiError_('VALIDATION_ERROR','Only GROUP assignments have MaxGroupMembers.');
        if(amHasSubmissions_(aid))throw apiError_('CONFLICT','Group size rules cannot change after the first submission.');
        updates.MaxGroupMembers=amSubmissionConfig_('GROUP',p.maxGroupMembers).MaxGroupMembers;
      }
      if(p.autoOpenEnabled!==undefined||p.scheduledOpenAt!==undefined||p.autoCloseEnabled!==undefined||p.scheduledCloseAt!==undefined){
        var scheduleUpdate=amScheduleConfig_(p,current);Object.keys(scheduleUpdate).forEach(function(k){updates[k]=scheduleUpdate[k];});
      }
      Object.keys(updates).forEach(function(k){sh.getRange(current._row,headers.indexOf(k)+1).setValue(updates[k]);});
      sh.getRange(current._row,headers.indexOf('UpdatedAt')+1).setValue(new Date());
      appendAudit_(actor.userId,'ASSIGNMENT_UPDATED','Assignment',aid,{fields:Object.keys(updates)},requestId);
      return amPublic_(amGet_(aid));
    }
    if(action==='assignment.open'||action==='assignment.close'){
      var targetId=cmText_(p.assignmentId,100,'assignmentId',true),target=amGet_(targetId);
      if(!target)throw apiError_('NOT_FOUND','Assignment not found.');
      amCanManage_(actor,target);
      var next=action==='assignment.open'?'OPEN':'CLOSED';
      if(action==='assignment.open'&&String(target.Status)==='OPEN')throw apiError_('CONFLICT','Assignment is already open.');
      if(action==='assignment.close'&&String(target.Status)!=='OPEN')throw apiError_('CONFLICT','Only an OPEN assignment can be closed.');
      var sheet=cmSheet_('Assignments'),head=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0],now2=new Date();
      sheet.getRange(target._row,head.indexOf('Status')+1).setValue(next);
      sheet.getRange(target._row,head.indexOf('UpdatedAt')+1).setValue(now2);
      sheet.getRange(target._row,head.indexOf(action==='assignment.open'?'OpenedAt':'ClosedAt')+1).setValue(now2);
      if(action==='assignment.open')sheet.getRange(target._row,head.indexOf('ClosedAt')+1).setValue('');
      appendAudit_(actor.userId,action==='assignment.open'?'ASSIGNMENT_OPENED':'ASSIGNMENT_CLOSED','Assignment',targetId,{status:next},requestId);
      return amPublic_(amGet_(targetId));
    }
    throw apiError_('NOT_IMPLEMENTED','Assignment action is not implemented.');
  }finally{lock.releaseLock();}
}

/** Pure validation tests: no spreadsheet reads or writes. */
function testAssignmentSubmissionConfigUnit(){
  var cases=[];
  function run(name,fn,expected){var actual;try{actual=fn();cases.push({test:name,result:expected==='THROW'?'FAIL':JSON.stringify(actual)===JSON.stringify(expected)?'PASS':'FAIL',actual:actual||null});}catch(e){cases.push({test:name,result:expected==='THROW'?'PASS':'FAIL',errorCode:e&&e.apiCode||'ERROR'});}}
  run('Individual assignment has no group limits',function(){return amSubmissionConfig_('INDIVIDUAL');},{SubmissionType:'INDIVIDUAL',MinGroupMembers:'',MaxGroupMembers:''});
  run('Group assignment enforces minimum of two',function(){return amSubmissionConfig_('GROUP',2);},{SubmissionType:'GROUP',MinGroupMembers:2,MaxGroupMembers:2});
  run('Group assignment can be unlimited',function(){return amSubmissionConfig_('GROUP','');},{SubmissionType:'GROUP',MinGroupMembers:2,MaxGroupMembers:''});
  run('Group maximum can be instructor configured',function(){return amSubmissionConfig_('GROUP',5);},{SubmissionType:'GROUP',MinGroupMembers:2,MaxGroupMembers:5});
  run('Group maximum below two is rejected',function(){return amSubmissionConfig_('GROUP',1);},'THROW');
  run('Fractional group maximum is rejected',function(){return amSubmissionConfig_('GROUP',2.5);},'THROW');
  run('Negative group maximum is rejected',function(){return amSubmissionConfig_('GROUP',-1);},'THROW');
  run('Individual cannot receive group maximum',function(){return amSubmissionConfig_('INDIVIDUAL',4);},'THROW');
  run('Unknown submission type is rejected',function(){return amSubmissionConfig_('PAIR',2);},'THROW');
  run('Missing submission type is rejected',function(){return amSubmissionConfig_('',null);},'THROW');
  var passed=cases.filter(function(x){return x.result==='PASS';}).length;
  var out={success:passed===cases.length,mode:'PURE_UNIT_ASSIGNMENT_SUBMISSION_CONFIG',database:'NONE',passed:passed,failed:cases.length-passed,total:cases.length,writesExpected:0,cases:cases};
  console.log(JSON.stringify(out,null,2));return out;
}


/** Read-only schema preflight for the TEST spreadsheet. */
function testAssignmentManagementSchemaPreflight(){
  var TEST_SPREADSHEET_ID='1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk';
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss||ss.getId()!==TEST_SPREADSHEET_ID)throw new Error('SAFETY_STOP: TEST spreadsheet only.');
  var expected=['AssignmentID','OfferingID','Title','Description','Instructions','MaxScore','Deadline','SubmissionType','MinGroupMembers','MaxGroupMembers','Status','OpenedAt','ClosedAt','CreatedAt','UpdatedAt','CreatedByUserID','AutoOpenEnabled','ScheduledOpenAt','AutoOpenProcessedAt','AutoCloseEnabled','ScheduledCloseAt','AutoCloseProcessedAt'];
  var sh=ss.getSheetByName('Assignments'),actual=sh?sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0]:[];
  var ok=Boolean(sh)&&actual.length===expected.length&&expected.every(function(h,i){return actual[i]===h;});
  var result={success:ok,mode:'READ_ONLY_ASSIGNMENT_SCHEMA_PREFLIGHT',database:'TEST',sheetExists:Boolean(sh),headersMatch:ok,rowCount:sh?Math.max(0,sh.getLastRow()-1):null,expectedColumns:expected.length,actualColumns:actual.length,writesExpected:0};
  console.log(JSON.stringify(result,null,2));return result;
}

/** Process due schedule events once. Trigger is installed only in the TEST-bound project. */
function runAssignmentScheduler(){
  var TEST_ID='1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',ss=SpreadsheetApp.openById(TEST_ID);
  if(!ss||ss.getId()!==TEST_ID)throw new Error('SAFETY_STOP: Assignment scheduler is TEST-only.');
  var configured=PropertiesService.getScriptProperties().getProperty('SNC_ASSIGNMENT_SCHEDULER_SPREADSHEET_ID');
  if(configured!==TEST_ID)throw new Error('SAFETY_STOP: TEST scheduler has not been explicitly configured.');
  return amProcessDueSchedules_(new Date(),ss);
}
function amEnsureScheduleAudit_(requestId,action,assignmentId,details){
  var exists=cmRows_('AuditLogs').some(function(r){return String(r.RequestID)===String(requestId);});
  if(!exists)appendAudit_('SYSTEM',action,'Assignment',assignmentId,details,requestId);
}
function amProcessDueSchedules_(now,ss){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    var sh=ss.getSheetByName('Assignments');
    if(!sh||sh.getLastRow()<2)return {success:true,processed:0,opened:0,closed:0,skipped:0};
    var rows=rowsAsObjects_(sh),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],ix={};
    headers.forEach(function(h,i){ix[h]=i+1;});
    var out={success:true,processed:0,opened:0,closed:0,skipped:0};
    rows.forEach(function(a){
      var id=String(a.AssignmentID||''),status=String(a.Status||'').toUpperCase();if(!id)return;
      var od=amEnabled_(a.AutoOpenEnabled)&&!a.AutoOpenProcessedAt&&a.ScheduledOpenAt&&new Date(a.ScheduledOpenAt)<=now;
      var cd=amEnabled_(a.AutoCloseEnabled)&&!a.AutoCloseProcessedAt&&a.ScheduledCloseAt&&new Date(a.ScheduledCloseAt)<=now;
      if(od){
        var t=new Date(now);
        if(status!=='OPEN'){
          var openRequestId='SCHED-OPEN-'+id;
          amEnsureScheduleAudit_(openRequestId,'ASSIGNMENT_AUTO_OPENED',id,{status:'OPEN',scheduledAt:new Date(a.ScheduledOpenAt).toISOString()});
          sh.getRange(a._row,ix.Status).setValue('OPEN');sh.getRange(a._row,ix.OpenedAt).setValue(t);
          sh.getRange(a._row,ix.ClosedAt).setValue('');sh.getRange(a._row,ix.UpdatedAt).setValue(t);out.opened++;
        }else out.skipped++;
        sh.getRange(a._row,ix.AutoOpenProcessedAt).setValue(t);out.processed++;status='OPEN';
      }
      if(cd){
        var tc=new Date(now);
        if(status!=='CLOSED'){
          var closeRequestId='SCHED-CLOSE-'+id;
          amEnsureScheduleAudit_(closeRequestId,'ASSIGNMENT_AUTO_CLOSED',id,{status:'CLOSED',scheduledAt:new Date(a.ScheduledCloseAt).toISOString()});
          sh.getRange(a._row,ix.Status).setValue('CLOSED');sh.getRange(a._row,ix.ClosedAt).setValue(tc);sh.getRange(a._row,ix.UpdatedAt).setValue(tc);out.closed++;
        }else out.skipped++;
        sh.getRange(a._row,ix.AutoCloseProcessedAt).setValue(tc);out.processed++;
      }
    });
    return out;
  }finally{lock.releaseLock();}
}
function installAssignmentSchedulerTrigger(){
  var TEST_ID='1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss||ss.getId()!==TEST_ID)throw new Error('SAFETY_STOP: TEST spreadsheet only.');
  var props=PropertiesService.getScriptProperties(),configured=props.getProperty('SNC_ASSIGNMENT_SCHEDULER_SPREADSHEET_ID');
  if(configured&&configured!==TEST_ID)throw new Error('SAFETY_STOP: scheduler spreadsheet property mismatch.');
  props.setProperty('SNC_ASSIGNMENT_SCHEDULER_SPREADSHEET_ID',TEST_ID);
  ScriptApp.getProjectTriggers().forEach(function(t){if(t.getHandlerFunction()==='runAssignmentScheduler')ScriptApp.deleteTrigger(t);});
  var trigger=ScriptApp.newTrigger('runAssignmentScheduler').timeBased().everyMinutes(1).create();
  return {success:true,environment:'TEST',intervalMinutes:1,triggerId:trigger.getUniqueId()};
}

function testAssignmentSchedulerLogicUnit(){
  var cases=[],now=new Date('2026-11-20T00:00:00Z');
  function check(n,fn,e){var a=fn();cases.push({test:n,result:a===e?'PASS':'FAIL',actual:a});}
  function due(enabled,processed,at){return amEnabled_(enabled)&&!processed&&Boolean(at)&&new Date(at)<=now;}
  check('Disabled schedule never runs',function(){return due(false,'','2026-11-19T00:00:00Z');},false);
  check('Enabled past schedule runs',function(){return due(true,'','2026-11-19T00:00:00Z');},true);
  check('Future schedule waits',function(){return due(true,'','2026-11-21T00:00:00Z');},false);
  check('Processed schedule cannot run twice',function(){return due(true,'2026-11-19T01:00:00Z','2026-11-19T00:00:00Z');},false);
  check('Boolean TRUE string supported',function(){return amEnabled_('TRUE');},true);
  check('False remains disabled',function(){return amEnabled_(false);},false);
  check('Missing enabled schedule rejected',function(){try{amScheduleConfig_({autoOpenEnabled:true,scheduledOpenAt:''},null);return false;}catch(e){return e.apiCode==='VALIDATION_ERROR';}},true);
  check('Asia/Bangkok local date-time converts to the correct instant',function(){return amDate_('2026-02-21T02:03','test').toISOString();},'2026-02-20T19:03:00.000Z');
  check('Invalid calendar date is rejected',function(){try{amDate_('2026-02-30T02:03','test');return false;}catch(e){return e.apiCode==='VALIDATION_ERROR';}},true);
  check('Close not later than open rejected',function(){try{amScheduleConfig_({autoOpenEnabled:true,scheduledOpenAt:'2026-11-20T10:00',autoCloseEnabled:true,scheduledCloseAt:'2026-11-20T10:00'},null);return false;}catch(e){return e.apiCode==='VALIDATION_ERROR';}},true);
  check('Disabled stale timestamp cleared',function(){return amScheduleConfig_({autoOpenEnabled:false,scheduledOpenAt:''},null).ScheduledOpenAt;},'');
  check('Changing an already processed schedule rearms only that event',function(){var x=amScheduleConfig_({autoOpenEnabled:true,scheduledOpenAt:'2026-11-20T11:00'}, {AutoOpenEnabled:true,ScheduledOpenAt:new Date('2026-11-20T03:00:00Z'),AutoOpenProcessedAt:new Date('2026-11-20T03:01:00Z'),AutoCloseEnabled:false,ScheduledCloseAt:'',AutoCloseProcessedAt:''});return x.AutoOpenProcessedAt;},'');
  check('Unchanged processed schedule remains processed',function(){var x=amScheduleConfig_({autoOpenEnabled:true,scheduledOpenAt:'2026-11-20T10:00'}, {AutoOpenEnabled:true,ScheduledOpenAt:new Date('2026-11-20T03:00:00Z'),AutoOpenProcessedAt:new Date('2026-11-20T03:01:00Z'),AutoCloseEnabled:false,ScheduledCloseAt:'',AutoCloseProcessedAt:''});return Boolean(x.AutoOpenProcessedAt);},true);
  var passed=cases.filter(function(x){return x.result==='PASS';}).length;
  var out={success:passed===cases.length,mode:'PURE_UNIT_ASSIGNMENT_SCHEDULER',database:'NONE',passed:passed,failed:cases.length-passed,total:cases.length,writesExpected:0,cases:cases};console.log(JSON.stringify(out,null,2));return out;
}

/**
 * TEST-only deployed integration test. Creates three persistent marked fixtures.
 * Tests real Sheets writes, scheduler idempotency, AuditLogs and manual transitions.
 * No existing row is edited or deleted.
 */
function testAssignmentSchedulerIntegration(){
  var TEST_ID='1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss||ss.getId()!==TEST_ID)throw new Error('SAFETY_STOP: TEST spreadsheet only.');
  var assignments=ss.getSheetByName('Assignments'),audit=ss.getSheetByName('AuditLogs');
  if(!assignments||!audit)throw new Error('Required TEST sheets are missing.');
  var instructor=cmRows_('CourseInstructors').filter(function(x){return String(x.Status).toUpperCase()==='ACTIVE';})[0];
  if(!instructor)throw new Error('BLOCKED: No active TEST instructor assignment is available.');
  var offering=cmGet_('CourseOfferings','OfferingID',instructor.OfferingID);
  if(!offering||String(offering.Status).toUpperCase()!=='ACTIVE')throw new Error('BLOCKED: No active TEST offering is available.');
  var actor={userId:String(instructor.InstructorUserID),roles:[{role:'INSTRUCTOR',scopeType:'OFFERING',scopeId:'*'}]};
  var now=new Date(),past=new Date(now.getTime()-120000),tag='[SCHED-TEST] '+Utilities.getUuid();
  function addFixture(title,status,autoOpen,openAt,autoClose,closeAt){
    var id=Utilities.getUuid();
    assignments.appendRow([id,offering.OfferingID,tag+' '+title,'TEST fixture','TEST only',100,new Date(now.getTime()+86400000),'INDIVIDUAL','','',status,status==='OPEN'?now:'',status==='CLOSED'?now:'',now,now,actor.userId,autoOpen,openAt||'', '',autoClose,closeAt||'', '']);
    return id;
  }
  var openId=addFixture('AUTO-OPEN','DRAFT',true,past,false,'');
  var closeId=addFixture('AUTO-CLOSE','OPEN',false,'',true,past);
  var manualId=addFixture('MANUAL','DRAFT',false,'',false,'');
  var first=amProcessDueSchedules_(now,ss);
  var auditAfterFirst=cmRows_('AuditLogs').filter(function(x){return (String(x.EntityID)===openId&&x.Action==='ASSIGNMENT_AUTO_OPENED')||(String(x.EntityID)===closeId&&x.Action==='ASSIGNMENT_AUTO_CLOSED');}).length;
  var second=amProcessDueSchedules_(new Date(now.getTime()+60000),ss);
  var auditAfterSecond=cmRows_('AuditLogs').filter(function(x){return (String(x.EntityID)===openId&&x.Action==='ASSIGNMENT_AUTO_OPENED')||(String(x.EntityID)===closeId&&x.Action==='ASSIGNMENT_AUTO_CLOSED');}).length;
  var manualOpen=handleAssignmentManagementAction_('assignment.open',actor,{assignmentId:manualId},'SCHED-MANUAL-OPEN-'+manualId);
  var manualClose=handleAssignmentManagementAction_('assignment.close',actor,{assignmentId:manualId},'SCHED-MANUAL-CLOSE-'+manualId);
  var finalOpen=amGet_(openId),finalClose=amGet_(closeId),finalManual=amGet_(manualId);
  var cases=[
    {test:'Due scheduled opening changes DRAFT to OPEN',result:finalOpen.Status==='OPEN'&&Boolean(finalOpen.AutoOpenProcessedAt)?'PASS':'FAIL'},
    {test:'Due scheduled closing changes OPEN to CLOSED',result:finalClose.Status==='CLOSED'&&Boolean(finalClose.AutoCloseProcessedAt)?'PASS':'FAIL'},
    {test:'Second scheduler invocation does not add duplicate audit events',result:auditAfterFirst===2&&auditAfterSecond===2?'PASS':'FAIL',auditAfterFirst:auditAfterFirst,auditAfterSecond:auditAfterSecond},
    {test:'Manual Open/Close works when both schedules are disabled',result:manualOpen.Status==='OPEN'&&manualClose.Status==='CLOSED'&&finalManual.Status==='CLOSED'?'PASS':'FAIL'}
  ];
  var passed=cases.filter(function(x){return x.result==='PASS';}).length;
  var out={success:passed===cases.length,mode:'DEPLOYED_TEST_ASSIGNMENT_SCHEDULER_INTEGRATION',database:'TEST',passed:passed,failed:cases.length-passed,total:cases.length,firstRun:first,secondRun:second,fixturesCreated:3,fixturesPersistent:true,cleanupPerformed:false,cases:cases};
  console.log(JSON.stringify(out,null,2));return out;
}

/** Create two persistent TEST records for verification by the actual one-minute time trigger. */
function createAssignmentSchedulerTriggerFixtures(){
  var TEST_ID='1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss||ss.getId()!==TEST_ID)throw new Error('SAFETY_STOP: TEST spreadsheet only.');
  var instructors=cmRows_('CourseInstructors').filter(function(x){return String(x.Status).toUpperCase()==='ACTIVE';});
  if(!instructors.length)throw new Error('BLOCKED: No active TEST instructor assignment.');
  var assignmentSheet=ss.getSheetByName('Assignments'),instructor=instructors[0],offering=cmGet_('CourseOfferings','OfferingID',instructor.OfferingID);
  if(!assignmentSheet||!offering||String(offering.Status).toUpperCase()!=='ACTIVE')throw new Error('BLOCKED: No active TEST offering.');
  var future=new Date(Math.ceil(Date.now()/60000)*60000+120000),local=Utilities.formatDate(future,'Asia/Bangkok',"yyyy-MM-dd'T'HH:mm"),now=new Date(),tag='[SCHED-TRIGGER-E2E] '+Utilities.getUuid();
  var openId=Utilities.getUuid(),closeId=Utilities.getUuid();
  assignmentSheet.appendRow([openId,offering.OfferingID,tag+' AUTO-OPEN','TEST trigger fixture','TEST only',100,new Date(now.getTime()+86400000),'INDIVIDUAL','','','DRAFT','','',now,now,instructor.InstructorUserID,true,future,'',false,'','']);
  assignmentSheet.appendRow([closeId,offering.OfferingID,tag+' AUTO-CLOSE','TEST trigger fixture','TEST only',100,new Date(now.getTime()+86400000),'INDIVIDUAL','','','OPEN',now,'',now,now,instructor.InstructorUserID,false,'','',true,future,'']);
  PropertiesService.getScriptProperties().setProperty('SNC_SCHEDULER_TRIGGER_TEST_TAG',tag);
  return {success:true,database:'TEST',tag:tag,scheduledLocalTime:local,openAssignmentId:openId,closeAssignmentId:closeId,waitAtLeastMinutes:3,fixturesPersistent:true,cleanupPerformed:false};
}
/** Read-only verification of fixtures after the real time-driven trigger has had time to run. */
function verifyAssignmentSchedulerTriggerFixtures(){
  var TEST_ID='1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss||ss.getId()!==TEST_ID)throw new Error('SAFETY_STOP: TEST spreadsheet only.');
  var tag=PropertiesService.getScriptProperties().getProperty('SNC_SCHEDULER_TRIGGER_TEST_TAG');
  if(!tag)throw new Error('No scheduler trigger test tag. Run createAssignmentSchedulerTriggerFixtures() first.');
  var rows=cmRows_('Assignments').filter(function(a){return String(a.Title||'').indexOf(tag)===0;});
  var audits=cmRows_('AuditLogs'),cases=[];
  rows.forEach(function(a){
    var open=String(a.Title).indexOf('AUTO-OPEN')>=0,action=open?'ASSIGNMENT_AUTO_OPENED':'ASSIGNMENT_AUTO_CLOSED',requestId=(open?'SCHED-OPEN-':'SCHED-CLOSE-')+a.AssignmentID;
    var matches=audits.filter(function(x){return String(x.RequestID)===requestId&&String(x.Action)===action;});
    cases.push({test:open?'Trigger auto-open fixture':'Trigger auto-close fixture',result:(a.Status===(open?'OPEN':'CLOSED')&&Boolean(open?a.AutoOpenProcessedAt:a.AutoCloseProcessedAt)&&matches.length===1)?'PASS':'FAIL',status:a.Status,auditCount:matches.length});
  });
  var passed=cases.filter(function(x){return x.result==='PASS';}).length;
  return {success:rows.length===2&&passed===2,mode:'REAL_TIME_TRIGGER_TEST_READ_ONLY',database:'TEST',fixturesFound:rows.length,passed:passed,failed:cases.length-passed,total:cases.length,cases:cases,writesExpected:0};
}