/**
 * SPORT NUTRITION CLASSROOM — Assignment Management
 * Implements DOC-02/DOC-05/DOC-06/DOC-08 approved MVP requirements.
 * All assignment operations are scoped to an authorized CourseOffering.
 */

function amDate_(value,key){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)){
    throw apiError_('VALIDATION_ERROR',key+' must use YYYY-MM-DDTHH:mm.');
  }
  var d=new Date(value);
  if(isNaN(d.getTime()))throw apiError_('VALIDATION_ERROR',key+' is invalid.');
  return d;
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
      var id=Utilities.getUuid(),now=new Date();
      cmSheet_('Assignments').appendRow([
        id,oid,title,description,instructions,maxScore,deadline,config.SubmissionType,
        config.MinGroupMembers,config.MaxGroupMembers,'DRAFT','', '',now,now,actor.userId
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
  var expected=['AssignmentID','OfferingID','Title','Description','Instructions','MaxScore','Deadline','SubmissionType','MinGroupMembers','MaxGroupMembers','Status','OpenedAt','ClosedAt','CreatedAt','UpdatedAt','CreatedByUserID'];
  var sh=ss.getSheetByName('Assignments'),actual=sh?sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0]:[];
  var ok=Boolean(sh)&&actual.length===expected.length&&expected.every(function(h,i){return actual[i]===h;});
  var result={success:ok,mode:'READ_ONLY_ASSIGNMENT_SCHEMA_PREFLIGHT',database:'TEST',sheetExists:Boolean(sh),headersMatch:ok,rowCount:sh?Math.max(0,sh.getLastRow()-1):null,expectedColumns:expected.length,actualColumns:actual.length,writesExpected:0};
  console.log(JSON.stringify(result,null,2));return result;
}
