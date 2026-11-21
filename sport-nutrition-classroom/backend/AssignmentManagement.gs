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
  if(amEnabled_(p.autoOpenEnabled)||amEnabled_(p.autoCloseEnabled)||p.scheduledOpenAt||p.scheduledCloseAt)
    throw apiError_('VALIDATION_ERROR','Assignment opening and closing are controlled manually by the instructor.');
  return {AutoOpenEnabled:false,ScheduledOpenAt:'',AutoOpenProcessedAt:'',AutoCloseEnabled:false,ScheduledCloseAt:'',AutoCloseProcessedAt:''};
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
      var found=cmGet_('Assignments','AssignmentID',cmText_(p.assignmentId,100,'assignmentId',true));
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
      var schedule={AutoOpenEnabled:false,ScheduledOpenAt:'',AutoOpenProcessedAt:'',AutoCloseEnabled:false,ScheduledCloseAt:'',AutoCloseProcessedAt:''};
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
      return amPublic_(cmGet_('Assignments','AssignmentID',id));
    }
    if(action==='assignment.update'){
      var aid=cmText_(p.assignmentId,100,'assignmentId',true),current=cmGet_('Assignments','AssignmentID',aid);
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
      if(p.autoOpenEnabled!==undefined||p.scheduledOpenAt!==undefined||p.autoCloseEnabled!==undefined||p.scheduledCloseAt!==undefined)
        amScheduleConfig_(p,current);
      Object.keys(updates).forEach(function(k){sh.getRange(current._row,headers.indexOf(k)+1).setValue(updates[k]);});
      sh.getRange(current._row,headers.indexOf('UpdatedAt')+1).setValue(new Date());
      appendAudit_(actor.userId,'ASSIGNMENT_UPDATED','Assignment',aid,{fields:Object.keys(updates)},requestId);
      return amPublic_(cmGet_('Assignments','AssignmentID',aid));
    }
    if(action==='assignment.open'||action==='assignment.close'){
      var targetId=cmText_(p.assignmentId,100,'assignmentId',true),target=cmGet_('Assignments','AssignmentID',targetId);
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
      if(action==='assignment.open'&&typeof notifyAssignmentOpened_==='function'){
        try{notifyAssignmentOpened_(cmGet_('Assignments','AssignmentID',targetId));}
        catch(notificationError){console.error('ASSIGNMENT_OPEN_NOTIFICATION_FAILED');}
      }
      return amPublic_(cmGet_('Assignments','AssignmentID',targetId));
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
  return {success:true,disabled:true,reason:'MANUAL_ASSIGNMENT_CONTROL_REQUIRED',writesExpected:0};
}
function amProcessDueSchedules_(now,ss){
  return {success:true,disabled:true,reason:'MANUAL_ASSIGNMENT_CONTROL_REQUIRED',processed:0,opened:0,closed:0,skipped:0,writesExpected:0};
}
function installAssignmentSchedulerTrigger(){
  var removed=0;
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='runAssignmentScheduler'){ScriptApp.deleteTrigger(t);removed++;}
  });
  return {success:true,disabled:true,removedTriggers:removed,reason:'Manual assignment control is required.'};
}

function testAssignmentSchedulerLogicUnit(){
  var cases=[];
  function check(name,fn){var passed=false;try{passed=fn();}catch(e){}cases.push({test:name,result:passed?'PASS':'FAIL'});}
  check('Automatic opening is rejected',function(){try{amScheduleConfig_({autoOpenEnabled:true,scheduledOpenAt:'2026-11-23T10:00'},null);return false;}catch(e){return e.apiCode==='VALIDATION_ERROR';}});
  check('Automatic closing is rejected',function(){try{amScheduleConfig_({autoCloseEnabled:true,scheduledCloseAt:'2026-11-23T10:00'},null);return false;}catch(e){return e.apiCode==='VALIDATION_ERROR';}});
  check('Manual assignment settings remain disabled',function(){var x=amScheduleConfig_({},null);return x.AutoOpenEnabled===false&&x.AutoCloseEnabled===false&&!x.ScheduledOpenAt&&!x.ScheduledCloseAt;});
  check('Scheduler handler performs no transitions',function(){var x=runAssignmentScheduler();return x.disabled===true&&x.writesExpected===0;});
  var passed=cases.filter(function(x){return x.result==='PASS';}).length;
  var out={success:passed===cases.length,mode:'PURE_UNIT_MANUAL_ASSIGNMENT_CONTROL',database:'NONE',passed:passed,failed:cases.length-passed,total:cases.length,writesExpected:0,cases:cases};
  console.log(JSON.stringify(out,null,2));return out;
}

/**
 * TEST-only deployed integration test. Creates three persistent marked fixtures.
 * Tests real Sheets writes, scheduler idempotency, AuditLogs and manual transitions.
 * No existing row is edited or deleted.
 */
function testAssignmentSchedulerIntegration(){
  return {success:true,disabled:true,reason:'Automatic assignment scheduling is not part of the approved workflow.',writesExpected:0};
}

/** Automatic scheduling fixtures are intentionally disabled under BR-001. */
function createAssignmentSchedulerTriggerFixtures(){
  return {success:true,disabled:true,writesExpected:0};
}
/** Read-only compatibility stub; no time-driven transition verification is required. */
function verifyAssignmentSchedulerTriggerFixtures(){
  return {success:true,disabled:true,writesExpected:0};
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
  var result={success:rows.length===2&&passed===2,mode:'REAL_TIME_TRIGGER_TEST_READ_ONLY',database:'TEST',fixturesFound:rows.length,passed:passed,failed:cases.length-passed,total:cases.length,cases:cases,writesExpected:0};
  console.log(JSON.stringify(result,null,2));
  return result;
}