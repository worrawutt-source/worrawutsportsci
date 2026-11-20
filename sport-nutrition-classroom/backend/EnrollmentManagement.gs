/**
 * SPORT NUTRITION CLASSROOM — Student Import & Enrollment
 * DOCS v1.3 / CR-002. TEST-first, offering-scoped implementation.
 * Google Sheets is not a multi-sheet transactional database. Execute uses
 * preflight + ScriptLock + compensating recovery and explicit job states.
 */
function emSheet_(name){
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if(!sh)throw apiError_('DATABASE_NOT_READY',name+' table is unavailable.');
  return sh;
}
function emRows_(name){return rowsAsObjects_(emSheet_(name));}
function emRole_(a,role){return (a.roles||[]).some(function(r){return r.role===role;});}
function emCanOffering_(a,offering){return cmCanOffering_(a,offering);}
function emCanImport_(a,offering){
  return cmSystem_(a,'SYSTEM_ADMIN')||cmSystem_(a,'COURSE_COORDINATOR')||
    (a.roles||[]).some(function(r){return r.role==='COURSE_COORDINATOR'&&
      ((r.scopeType==='COURSE'&&String(r.scopeId)===String(offering.CourseID))||
       (r.scopeType==='SEMESTER'&&String(r.scopeId)===String(offering.SemesterID)));});
}
function emNormalizeRow_(row,index){
  row=row||{};
  var sid=String(row.studentId==null?'':row.studentId).trim();
  var first=String(row.firstName==null?'':row.firstName).trim();
  var last=String(row.lastName==null?'':row.lastName).trim();
  var email=String(row.email==null?'':row.email).trim().toLowerCase();
  var errors=[];
  if(!/^\d{6,20}$/.test(sid))errors.push('INVALID_STUDENT_ID');
  if(!first||first.length>100)errors.push('INVALID_FIRST_NAME');
  if(!last||last.length>100)errors.push('INVALID_LAST_NAME');
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))errors.push('INVALID_EMAIL');
  return {rowNumber:index+1,studentId:sid,firstName:first,lastName:last,email:email,errors:errors};
}
var EM_SCHEMA_={
  Users:['UserID','StudentID','FirstName','LastName','Email','Status','CreatedAt','UpdatedAt'],
  Enrollments:['EnrollmentID','OfferingID','UserID','Status','EnrolledAt','CreatedAt','UpdatedAt'],
  ImportJobs:['ImportJobID','OfferingID','FileName','Status','TotalRows','SuccessCount','ErrorCount','CreatedByUserID','CreatedAt','CompletedAt'],
  ImportErrors:['ImportErrorID','ImportJobID','RowNumber','StudentID','ErrorCode','ErrorMessage','CreatedAt'],
  AuditLogs:['AuditID','ActorUserID','Action','EntityType','EntityID','DetailsJson','CreatedAt','RequestID']
};
function emSchemaPreflight_(){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)throw apiError_('DATABASE_NOT_READY','No active database is available.');
  var checks=[];
  Object.keys(EM_SCHEMA_).forEach(function(name){
    var sh=ss.getSheetByName(name),actual=sh&&sh.getLastColumn()>0?
      sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0]:[];
    var expected=EM_SCHEMA_[name];
    checks.push({sheet:name,pass:Boolean(sh)&&actual.length===expected.length&&
      expected.every(function(h,i){return actual[i]===h;})});
  });
  var failed=checks.filter(function(x){return !x.pass;});
  if(failed.length)throw apiError_('SCHEMA_MISMATCH','Import schema preflight failed: '+failed.map(function(x){return x.sheet;}).join(', '));
  return checks;
}
function emOfferingForImport_(a,p){
  var offeringId=cmText_(p.offeringId,100,'offeringId',true);
  var offering=cmGet_('CourseOfferings','OfferingID',offeringId);
  if(!offering||String(offering.Status).toUpperCase()!=='ACTIVE')throw apiError_('NOT_FOUND','Active CourseOffering not found.');
  if(!emCanOffering_(a,offering)||!emCanImport_(a,offering))throw apiError_('FORBIDDEN','You cannot import students into this offering.');
  return offering;
}
function emValidateRowsAgainstCurrent_(offeringId,rows,users,enrollments){
  var byId={},byEmail={},seenIds={},seenEmails={},activeEnrollments={};
  (users||[]).forEach(function(u){
    var sid=String(u.StudentID==null?'':u.StudentID).trim();
    var email=String(u.Email==null?'':u.Email).trim().toLowerCase();
    if(sid)byId[sid]=u;
    if(email)byEmail[email]=u;
  });
  (enrollments||[]).forEach(function(e){
    if(String(e.OfferingID)===String(offeringId)&&String(e.Status).toUpperCase()==='ACTIVE')
      activeEnrollments[String(e.UserID)]=true;
  });
  var errors=[];
  rows.forEach(function(r){
    r.errors=(r.errors||[]).slice();
    if(!r.errors.length){
      if(seenIds[r.studentId])r.errors.push('DUPLICATE_STUDENT_ID_IN_FILE');
      if(seenEmails[r.email])r.errors.push('DUPLICATE_EMAIL_IN_FILE');
      seenIds[r.studentId]=true;seenEmails[r.email]=true;
      var byStudent=byId[r.studentId],byAddress=byEmail[r.email];
      if(byStudent&&String(byStudent.Email).trim().toLowerCase()!==r.email)r.errors.push('STUDENT_ID_EMAIL_CONFLICT');
      if(byAddress&&String(byAddress.StudentID).trim()!==r.studentId)r.errors.push('EMAIL_STUDENT_ID_CONFLICT');
      var user=byStudent||byAddress;
      if(user&&String(user.Status).toUpperCase()!=='ACTIVE')r.errors.push('USER_INACTIVE');
      if(user&&activeEnrollments[String(user.UserID)])r.errors.push('ALREADY_ENROLLED');
    }
    r.errors.forEach(function(code){errors.push({rowNumber:r.rowNumber,studentId:r.studentId,errorCode:code});});
  });
  return {errors:errors,validCount:rows.length-rows.filter(function(r){return r.errors.length>0;}).length};
}
function emPrepareImport_(a,p){
  var offering=emOfferingForImport_(a,p);
  if(!Array.isArray(p.rows)||p.rows.length<1||p.rows.length>500)throw apiError_('VALIDATION_ERROR','rows must contain 1 to 500 records.');
  var prepared=p.rows.map(emNormalizeRow_);
  var checked=emValidateRowsAgainstCurrent_(String(offering.OfferingID),prepared,emRows_('Users'),emRows_('Enrollments'));
  return {offering:offering,rows:prepared,validCount:checked.validCount,errorCount:checked.errors.length,
    errors:checked.errors,totalRows:prepared.length};
}
function emHeaderMap_(sheet,expected){
  var headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0],map={};
  expected.forEach(function(h){var i=headers.indexOf(h);if(i<0)throw apiError_('SCHEMA_MISMATCH','Missing column '+h);map[h]=i;});
  return map;
}
function emUpdateJob_(jobSheet,jobId,updates){
  var job=cmGet_('ImportJobs','ImportJobID',jobId);
  if(!job)throw new Error('ImportJob row could not be located during recovery.');
  var map=emHeaderMap_(jobSheet,EM_SCHEMA_.ImportJobs);
  Object.keys(updates).forEach(function(k){jobSheet.getRange(job._row,map[k]+1).setValue(updates[k]);});
}
function emAppendErrors_(jobId,items){
  if(!items.length)return;
  var sh=emSheet_('ImportErrors'),map=emHeaderMap_(sh,EM_SCHEMA_.ImportErrors);
  var rows=items.map(function(e){
    var row=new Array(EM_SCHEMA_.ImportErrors.length);
    row[map.ImportErrorID]=Utilities.getUuid();row[map.ImportJobID]=jobId;
    row[map.RowNumber]=e.rowNumber||0;row[map.StudentID]=e.studentId||'';
    row[map.ErrorCode]=e.errorCode;row[map.ErrorMessage]=e.errorMessage||e.errorCode;
    row[map.CreatedAt]=new Date();return row;
  });
  sh.getRange(sh.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows);
}
function emRollbackByIds_(sheetName,keyHeader,ids){
  if(!ids.length)return {removed:0};
  var sh=emSheet_(sheetName),map=emHeaderMap_(sh,[keyHeader]),col=map[keyHeader]+1;
  var values=sh.getLastRow()>1?sh.getRange(2,col,sh.getLastRow()-1,1).getDisplayValues():[];
  var targets=[];
  values.forEach(function(v,i){if(ids.indexOf(String(v[0]))>=0)targets.push(i+2);});
  targets.sort(function(a,b){return b-a;}).forEach(function(row){sh.deleteRow(row);});
  return {removed:targets.length,expected:ids.length};
}
function emRecoverImport_(jobId,createdUserIds,createdEnrollmentIds,primaryError){
  var recoveryErrors=[],removedUsers=0,removedEnrollments=0;
  try{removedEnrollments=emRollbackByIds_('Enrollments','EnrollmentID',createdEnrollmentIds).removed;}
  catch(e){recoveryErrors.push('ENROLLMENT_ROLLBACK_FAILED');}
  try{removedUsers=emRollbackByIds_('Users','UserID',createdUserIds).removed;}
  catch(e){recoveryErrors.push('USER_ROLLBACK_FAILED');}
  var complete=!recoveryErrors.length&&removedUsers===createdUserIds.length&&removedEnrollments===createdEnrollmentIds.length;
  try{
    emAppendErrors_(jobId,[{rowNumber:0,studentId:'',errorCode:'EXECUTION_FAILED',errorMessage:'Import execution failed; '+String(primaryError&&primaryError.message||'unknown').slice(0,180)}]);
    if(!complete)emAppendErrors_(jobId,[{rowNumber:0,studentId:'',errorCode:'RECOVERY_INCOMPLETE',errorMessage:recoveryErrors.join(',')||'Rollback count mismatch; manual reconciliation required.'}]);
    emUpdateJob_(emSheet_('ImportJobs'),jobId,{Status:complete?'FAILED_RECOVERED':'RECOVERY_REQUIRED',
      SuccessCount:0,ErrorCount:1+(complete?0:1),CompletedAt:new Date()});
  }catch(e){recoveryErrors.push('JOB_STATUS_UPDATE_FAILED');}
  return {recovered:complete,removedUsers:removedUsers,removedEnrollments:removedEnrollments,recoveryErrors:recoveryErrors};
}
function handleEnrollmentManagementAction_(action,a,p,requestId){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    if(action==='import.preview'){
      emSchemaPreflight_();
      var preview=emPrepareImport_(a,p);
      return {offeringId:String(preview.offering.OfferingID),totalRows:preview.totalRows,validCount:preview.validCount,
        errorCount:preview.errorCount,errors:preview.errors.slice(0,200),writesPerformed:0};
    }
    if(action==='import.execute'){
      // All structural checks and all identity/enrollment checks occur under the same lock,
      // against fresh sheet contents, before the first write.
      emSchemaPreflight_();
      var offering=emOfferingForImport_(a,p);
      if(!Array.isArray(p.rows)||p.rows.length<1||p.rows.length>500)throw apiError_('VALIDATION_ERROR','rows must contain 1 to 500 records.');
      var rows=p.rows.map(emNormalizeRow_);
      var usersSh=emSheet_('Users'),enrollSh=emSheet_('Enrollments'),jobSh=emSheet_('ImportJobs');
      var currentUsers=emRows_('Users'),currentEnrollments=emRows_('Enrollments');
      var validation=emValidateRowsAgainstCurrent_(String(offering.OfferingID),rows,currentUsers,currentEnrollments);
      if(validation.errors.length)throw apiError_('IMPORT_VALIDATION_FAILED','Current data validation failed. Run preview and correct all errors before execute.');
      var now=new Date(),jobId=Utilities.getUuid(),fileName=cmText_(p.fileName||'','255','fileName',false);
      var jobMap=emHeaderMap_(jobSh,EM_SCHEMA_.ImportJobs);
      var jobRow=new Array(EM_SCHEMA_.ImportJobs.length);
      jobRow[jobMap.ImportJobID]=jobId;jobRow[jobMap.OfferingID]=String(offering.OfferingID);
      jobRow[jobMap.FileName]=fileName;jobRow[jobMap.Status]='PROCESSING';
      jobRow[jobMap.TotalRows]=rows.length;jobRow[jobMap.SuccessCount]=0;jobRow[jobMap.ErrorCount]=0;
      jobRow[jobMap.CreatedByUserID]=a.userId;jobRow[jobMap.CreatedAt]=now;jobRow[jobMap.CompletedAt]='';
      jobSh.getRange(jobSh.getLastRow()+1,1,1,jobRow.length).setValues([jobRow]);
      var createdUserIds=[],createdEnrollmentIds=[],newUsers=[],newEnrollments=[],success=0;
      var usersById={},usersByEmail={};
      currentUsers.forEach(function(u){usersById[String(u.StudentID)]=u;usersByEmail[String(u.Email).toLowerCase()]=u;});
      rows.forEach(function(r){
        var user=usersById[r.studentId]||usersByEmail[r.email];
        if(!user){
          var uid='USR_'+Utilities.getUuid();createdUserIds.push(uid);
          user={UserID:uid,StudentID:r.studentId,FirstName:r.firstName,LastName:r.lastName,Email:r.email,Status:'ACTIVE'};
          newUsers.push([uid,r.studentId,r.firstName,r.lastName,r.email,'ACTIVE',now,now]);
          usersById[r.studentId]=user;usersByEmail[r.email]=user;
        }
        var eid=Utilities.getUuid();createdEnrollmentIds.push(eid);
        newEnrollments.push([eid,String(offering.OfferingID),String(user.UserID),'ACTIVE',now,now,now]);
        success++;
      });
      try{
        if(newUsers.length)usersSh.getRange(usersSh.getLastRow()+1,1,newUsers.length,EM_SCHEMA_.Users.length).setValues(newUsers);
        if(newEnrollments.length)enrollSh.getRange(enrollSh.getLastRow()+1,1,newEnrollments.length,EM_SCHEMA_.Enrollments.length).setValues(newEnrollments);
        emUpdateJob_(jobSh,jobId,{Status:'COMPLETED',SuccessCount:success,ErrorCount:0,CompletedAt:new Date()});
        appendAudit_(a.userId,'STUDENT_IMPORT_EXECUTED','ImportJob',jobId,
          {offeringId:String(offering.OfferingID),totalRows:rows.length,successCount:success,errorCount:0},requestId);
      }catch(writeError){
        var recovery=emRecoverImport_(jobId,createdUserIds,createdEnrollmentIds,writeError);
        throw apiError_(recovery.recovered?'IMPORT_FAILED_RECOVERED':'IMPORT_RECOVERY_REQUIRED',
          recovery.recovered?'Import failed; newly created records were rolled back.':'Import failed and automatic recovery was incomplete. Check ImportJobs status RECOVERY_REQUIRED before retrying.');
      }
      return {importJobId:jobId,status:'COMPLETED',totalRows:rows.length,successCount:success,errorCount:0,errors:[]};
    }
    if(action==='import.result'){
      emSchemaPreflight_();
      var jobId=cmText_(p.importJobId,100,'importJobId',true),job=cmGet_('ImportJobs','ImportJobID',jobId);
      if(!job)throw apiError_('NOT_FOUND','Import job not found.');
      var off=cmGet_('CourseOfferings','OfferingID',job.OfferingID);
      // Import results contain StudentID and row-level validation details.
      // Only the same authorization that permits importing may read them.
      if(!off||!emCanOffering_(a,off)||!emCanImport_(a,off))throw apiError_('FORBIDDEN','Cannot view this import job.');
      return {job:{importJobId:job.ImportJobID,offeringId:job.OfferingID,fileName:job.FileName,status:job.Status,
        totalRows:Number(job.TotalRows)||0,successCount:Number(job.SuccessCount)||0,errorCount:Number(job.ErrorCount)||0,
        createdAt:job.CreatedAt,completedAt:job.CompletedAt},
        errors:emRows_('ImportErrors').filter(function(e){return String(e.ImportJobID)===jobId;}).map(function(e){
          return {rowNumber:e.RowNumber,studentId:e.StudentID,errorCode:e.ErrorCode,errorMessage:e.ErrorMessage};
        })};
    }
    if(action==='enrollment.list'){
      emSchemaPreflight_();
      var offeringId=cmText_(p.offeringId,100,'offeringId',false),all=emRows_('Enrollments');
      if(offeringId){
        var off2=cmGet_('CourseOfferings','OfferingID',offeringId);
        if(!off2)throw apiError_('NOT_FOUND','Offering not found.');
        if(!emCanOffering_(a,off2)&&!all.some(function(e){return String(e.OfferingID)===offeringId&&String(e.UserID)===a.userId;}))
          throw apiError_('FORBIDDEN','Cannot view this offering roster.');
        return all.filter(function(e){return String(e.OfferingID)===offeringId&&String(e.Status).toUpperCase()==='ACTIVE';})
          .map(function(e){var u=cmGet_('Users','UserID',e.UserID);return {enrollment:e,student:u?{
            userId:u.UserID,studentId:u.StudentID,firstName:u.FirstName,lastName:u.LastName,email:u.Email}:null};});
      }
      return all.filter(function(e){return String(e.UserID)===a.userId&&String(e.Status).toUpperCase()==='ACTIVE';});
    }
    if(action==='enrollment.update'){
      emSchemaPreflight_();
      var eid=cmText_(p.enrollmentId,100,'enrollmentId',true),en=cmGet_('Enrollments','EnrollmentID',eid);
      if(!en)throw apiError_('NOT_FOUND','Enrollment not found.');
      var off3=cmGet_('CourseOfferings','OfferingID',en.OfferingID);
      if(!off3||!emCanOffering_(a,off3)||!emCanImport_(a,off3))throw apiError_('FORBIDDEN','Cannot update this enrollment.');
      var status=cmText_(p.status,20,'status',true).toUpperCase();
      if(['ACTIVE','INACTIVE'].indexOf(status)<0)throw apiError_('VALIDATION_ERROR','status must be ACTIVE or INACTIVE.');
      var sh=emSheet_('Enrollments'),heads=emHeaderMap_(sh,EM_SCHEMA_.Enrollments);
      sh.getRange(en._row,heads.Status+1).setValue(status);sh.getRange(en._row,heads.UpdatedAt+1).setValue(new Date());
      appendAudit_(a.userId,'ENROLLMENT_UPDATED','Enrollment',eid,{status:status},requestId);
      return cmGet_('Enrollments','EnrollmentID',eid);
    }
    throw apiError_('NOT_IMPLEMENTED','Enrollment action is not implemented.');
  }finally{lock.releaseLock();}
}
/** Pure unit tests: validation, latest-state conflicts and recovery decisions. */
function testEnrollmentImportLogicUnit(){
  var valid={rowNumber:1,studentId:'67000000001',firstName:'A',lastName:'B',email:'a@example.com',errors:[]};
  var cases=[
    {name:'valid row',row:{studentId:'67000000001',firstName:'A',lastName:'B',email:'a@example.com'},pass:true},
    {name:'missing StudentID',row:{studentId:'',firstName:'A',lastName:'B',email:'a@example.com'},pass:false,code:'INVALID_STUDENT_ID'},
    {name:'missing first name',row:{studentId:'67000000001',firstName:'',lastName:'B',email:'a@example.com'},pass:false,code:'INVALID_FIRST_NAME'},
    {name:'missing last name',row:{studentId:'67000000001',firstName:'A',lastName:'',email:'a@example.com'},pass:false,code:'INVALID_LAST_NAME'},
    {name:'invalid email',row:{studentId:'67000000001',firstName:'A',lastName:'B',email:'bad'},pass:false,code:'INVALID_EMAIL'},
    {name:'email normalized',row:{studentId:'67000000001',firstName:'A',lastName:'B',email:' A@EXAMPLE.COM '},pass:true,email:'a@example.com'}
  ];
  var results=cases.map(function(c,i){var r=emNormalizeRow_(c.row,i),ok=c.pass?r.errors.length===0:r.errors.indexOf(c.code)>=0;
    if(c.email)ok=ok&&r.email===c.email;return {name:c.name,pass:ok,errors:r.errors};});
  var conflictUsers=[{UserID:'U1',StudentID:'67000000001',Email:'old@example.com',Status:'ACTIVE'}];
  var inactiveUsers=[{UserID:'U2',StudentID:'67000000002',Email:'b@example.com',Status:'INACTIVE'}];
  var conflict=emValidateRowsAgainstCurrent_('O1',[valid],conflictUsers,[]);
  var inactive=emValidateRowsAgainstCurrent_('O1',[{rowNumber:1,studentId:'67000000002',email:'b@example.com',errors:[]}],inactiveUsers,[]);
  var duplicate=emValidateRowsAgainstCurrent_('O1',[{rowNumber:1,studentId:valid.studentId,email:valid.email,errors:[]}],[{UserID:'U1',StudentID:valid.studentId,Email:valid.email,Status:'ACTIVE'}],[{OfferingID:'O1',UserID:'U1',Status:'ACTIVE'}]);
  results.push({name:'latest StudentID/Email conflict',pass:conflict.errors[0].errorCode==='STUDENT_ID_EMAIL_CONFLICT'});
  results.push({name:'latest inactive User rejected',pass:inactive.errors[0].errorCode==='USER_INACTIVE'});
  results.push({name:'latest active Enrollment rejected',pass:duplicate.errors[0].errorCode==='ALREADY_ENROLLED'});
  var passed=results.filter(function(x){return x.pass;}).length;
  var out={success:passed===results.length,mode:'PURE_UNIT_ENROLLMENT_IMPORT',passed:passed,failed:results.length-passed,total:results.length,writesExpected:0,results:results};
  console.log(JSON.stringify(out));return out;
}
/** Read-only schema preflight. */
function testEnrollmentSchemaPreflight(){
  var checks=emSchemaPreflight_();
  var out={success:true,database:SpreadsheetApp.getActiveSpreadsheet().getName(),checks:checks};
  console.log(JSON.stringify(out));return out;
}
/**
 * Simulated actor/fixture test plan helper. Pure checks only; does not write
 * student records or require a live LINE token.
 */
function testEnrollmentAuthorizationPredicatesUnit(){
  var offering={CourseID:'C1',SemesterID:'S1'};
  var cases=[
    {name:'system admin may import',actor:{roles:[{role:'SYSTEM_ADMIN',scopeType:'SYSTEM',scopeId:'*'}]},expected:true},
    {name:'course coordinator in scope may import',actor:{roles:[{role:'COURSE_COORDINATOR',scopeType:'COURSE',scopeId:'C1'}]},expected:true},
    {name:'semester coordinator in scope may import',actor:{roles:[{role:'COURSE_COORDINATOR',scopeType:'SEMESTER',scopeId:'S1'}]},expected:true},
    {name:'instructor alone cannot import',actor:{roles:[{role:'INSTRUCTOR',scopeType:'OFFERING',scopeId:'O1'}]},expected:false},
    {name:'coordinator outside scope cannot import',actor:{roles:[{role:'COURSE_COORDINATOR',scopeType:'COURSE',scopeId:'C2'}]},expected:false},
    {name:'student cannot import',actor:{roles:[{role:'STUDENT',scopeType:'USER',scopeId:'U1'}]},expected:false}
  ];
  var results=cases.map(function(c){return {name:c.name,pass:emCanImport_(c.actor,offering)===c.expected};});
  var passed=results.filter(function(x){return x.pass;}).length;
  return {success:passed===results.length,mode:'PURE_UNIT_IMPORT_AUTHORIZATION',passed:passed,failed:results.length-passed,total:results.length,results:results};
}
