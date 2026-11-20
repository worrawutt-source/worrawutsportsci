/**
 * SPORT NUTRITION CLASSROOM — Student Import & Enrollment
 * DOC-02/DOC-05/DOC-06/DOC-08 aligned implementation.
 * Import payload rows: [{studentId, firstName, lastName, email}]
 * Import is scoped to one CourseOffering per job.
 */
function emSheet_(name){
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if(!sh)throw apiError_('DATABASE_NOT_READY',name+' table is unavailable.');
  return sh;
}
function emRows_(name){return rowsAsObjects_(emSheet_(name));}
function emRole_(a,role){return (a.roles||[]).some(function(r){return r.role===role;});}
function emCanOffering_(a,offering){
  return cmCanOffering_(a,offering);
}
function emCanImport_(a,offering){
  // DOC-06 permits Admin/Coordinator and Instructor only when separately granted.
  // Current schema has no per-instructor import grant, so Instructor is denied by default.
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
function emPrepareImport_(a,p){
  var offeringId=cmText_(p.offeringId,100,'offeringId',true);
  var offering=cmGet_('CourseOfferings','OfferingID',offeringId);
  if(!offering||String(offering.Status).toUpperCase()!=='ACTIVE')throw apiError_('NOT_FOUND','Active CourseOffering not found.');
  if(!emCanOffering_(a,offering)||!emCanImport_(a,offering))throw apiError_('FORBIDDEN','You cannot import students into this offering.');
  if(!Array.isArray(p.rows)||p.rows.length<1||p.rows.length>500)throw apiError_('VALIDATION_ERROR','rows must contain 1 to 500 records.');
  var users=emRows_('Users'),enrollments=emRows_('Enrollments');
  var ids={},emails={},seenIds={},seenEmails={};
  users.forEach(function(u){ids[String(u.StudentID)]=u;emails[String(u.Email).toLowerCase()]=u;});
  var activeEnrollments={};
  enrollments.forEach(function(e){if(String(e.OfferingID)===offeringId&&String(e.Status).toUpperCase()==='ACTIVE')activeEnrollments[String(e.UserID)]=true;});
  var prepared=p.rows.map(emNormalizeRow_),valid=0,errors=[];
  prepared.forEach(function(r){
    if(r.errors.length){r.errors.forEach(function(code){errors.push({rowNumber:r.rowNumber,studentId:r.studentId,errorCode:code});});return;}
    if(seenIds[r.studentId])r.errors.push('DUPLICATE_STUDENT_ID_IN_FILE');
    if(seenEmails[r.email])r.errors.push('DUPLICATE_EMAIL_IN_FILE');
    seenIds[r.studentId]=true;seenEmails[r.email]=true;
    var byId=ids[r.studentId],byEmail=emails[r.email];
    if(byId&&String(byId.Email).toLowerCase()!==r.email)r.errors.push('STUDENT_ID_EMAIL_CONFLICT');
    if(byEmail&&String(byEmail.StudentID)!==r.studentId)r.errors.push('EMAIL_STUDENT_ID_CONFLICT');
    if(byId&&String(byId.Status).toUpperCase()!=='ACTIVE')r.errors.push('USER_INACTIVE');
    if(byId&&activeEnrollments[String(byId.UserID)])r.errors.push('ALREADY_ENROLLED');
    if(r.errors.length)r.errors.forEach(function(code){errors.push({rowNumber:r.rowNumber,studentId:r.studentId,errorCode:code});});
    else{r.existingUser=byId||null;valid++;}
  });
  return {offering:offering,rows:prepared,validCount:valid,errorCount:errors.length,errors:errors,totalRows:prepared.length};
}
function handleEnrollmentManagementAction_(action,a,p,requestId){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    if(action==='import.preview'){
      var preview=emPrepareImport_(a,p);
      return {offeringId:String(preview.offering.OfferingID),totalRows:preview.totalRows,validCount:preview.validCount,errorCount:preview.errorCount,errors:preview.errors.slice(0,200),writesPerformed:0};
    }
    if(action==='import.execute'){
      var prepared=emPrepareImport_(a,p);
      if(prepared.errorCount)throw apiError_('IMPORT_VALIDATION_FAILED','Import contains invalid rows. Run preview and correct all errors before execute.');
      // Re-read and revalidate under lock immediately before writes.
      var usersSh=emSheet_('Users'),enrollSh=emSheet_('Enrollments');
      var currentUsers=emRows_('Users'),currentEnrollments=emRows_('Enrollments');
      var now=new Date(),jobId=Utilities.getUuid(),jobSh=emSheet_('ImportJobs');
      jobSh.appendRow([jobId,String(prepared.offering.OfferingID),cmText_(p.fileName||'','255','fileName',false),'PROCESSING',prepared.totalRows,0,0,a.userId,now,'']);
      var userHeaders=usersSh.getRange(1,1,1,usersSh.getLastColumn()).getDisplayValues()[0];
      var enrollmentHeaders=enrollSh.getRange(1,1,1,enrollSh.getLastColumn()).getDisplayValues()[0];
      var newUsers=[],newEnrollments=[],errors=[],success=0;
      prepared.rows.forEach(function(r){
        var byId=currentUsers.filter(function(u){return String(u.StudentID)===r.studentId;})[0];
        var byEmail=currentUsers.filter(function(u){return String(u.Email).toLowerCase()===r.email;})[0];
        if((byId&&String(byId.Email).toLowerCase()!==r.email)||(byEmail&&String(byEmail.StudentID)!==r.studentId)){
          errors.push({rowNumber:r.rowNumber,studentId:r.studentId,errorCode:'IDENTITY_CONFLICT'});return;
        }
        var user=byId||byEmail;
        if(!user){
          var uid='USR_'+Utilities.getUuid();
          user={UserID:uid,StudentID:r.studentId,FirstName:r.firstName,LastName:r.lastName,Email:r.email,Status:'ACTIVE'};
          newUsers.push([uid,r.studentId,r.firstName,r.lastName,r.email,'ACTIVE',now,now]);
          currentUsers.push(user);
        }
        if(currentEnrollments.some(function(e){return String(e.OfferingID)===String(prepared.offering.OfferingID)&&String(e.UserID)===String(user.UserID)&&String(e.Status).toUpperCase()==='ACTIVE';})){
          errors.push({rowNumber:r.rowNumber,studentId:r.studentId,errorCode:'ALREADY_ENROLLED'});return;
        }
        var eid=Utilities.getUuid();
        newEnrollments.push([eid,String(prepared.offering.OfferingID),String(user.UserID),'ACTIVE',now,now,now]);
        currentEnrollments.push({OfferingID:String(prepared.offering.OfferingID),UserID:String(user.UserID),Status:'ACTIVE'});
        success++;
      });
      if(newUsers.length)usersSh.getRange(usersSh.getLastRow()+1,1,newUsers.length,userHeaders.length).setValues(newUsers);
      if(newEnrollments.length)enrollSh.getRange(enrollSh.getLastRow()+1,1,newEnrollments.length,enrollmentHeaders.length).setValues(newEnrollments);
      var errorSh=emSheet_('ImportErrors');
      errors.forEach(function(e){errorSh.appendRow([Utilities.getUuid(),jobId,e.rowNumber,e.studentId,e.errorCode,e.errorCode,new Date()]);});
      var jobHeaders=jobSh.getRange(1,1,1,jobSh.getLastColumn()).getDisplayValues()[0],jobRow=jobSh.getLastRow();
      jobSh.getRange(jobRow,jobHeaders.indexOf('Status')+1).setValue(errors.length?'COMPLETED_WITH_ERRORS':'COMPLETED');
      jobSh.getRange(jobRow,jobHeaders.indexOf('SuccessCount')+1).setValue(success);
      jobSh.getRange(jobRow,jobHeaders.indexOf('ErrorCount')+1).setValue(errors.length);
      jobSh.getRange(jobRow,jobHeaders.indexOf('CompletedAt')+1).setValue(new Date());
      appendAudit_(a.userId,'STUDENT_IMPORT_EXECUTED','ImportJob',jobId,{offeringId:String(prepared.offering.OfferingID),totalRows:prepared.totalRows,successCount:success,errorCount:errors.length},requestId);
      return {importJobId:jobId,status:errors.length?'COMPLETED_WITH_ERRORS':'COMPLETED',totalRows:prepared.totalRows,successCount:success,errorCount:errors.length,errors:errors};
    }
    if(action==='import.result'){
      var jobId=cmText_(p.importJobId,100,'importJobId',true),job=cmGet_('ImportJobs','ImportJobID',jobId);
      if(!job)throw apiError_('NOT_FOUND','Import job not found.');
      var off=cmGet_('CourseOfferings','OfferingID',job.OfferingID);
      if(!off||!emCanOffering_(a,off)||(!emCanImport_(a,off)&&!emRole_(a,'INSTRUCTOR')))throw apiError_('FORBIDDEN','Cannot view this import job.');
      return {job:job,errors:emRows_('ImportErrors').filter(function(e){return String(e.ImportJobID)===jobId;})};
    }
    if(action==='enrollment.list'){
      var offeringId=cmText_(p.offeringId,100,'offeringId',false);
      var all=emRows_('Enrollments');
      if(offeringId){
        var off2=cmGet_('CourseOfferings','OfferingID',offeringId);
        if(!off2)throw apiError_('NOT_FOUND','Offering not found.');
        if(!emCanOffering_(a,off2)&&!emRows_('Enrollments').some(function(e){return String(e.OfferingID)===offeringId&&String(e.UserID)===a.userId;}))throw apiError_('FORBIDDEN','Cannot view this offering roster.');
        return all.filter(function(e){return String(e.OfferingID)===offeringId&&String(e.Status).toUpperCase()==='ACTIVE';}).map(function(e){var u=cmGet_('Users','UserID',e.UserID);return {enrollment:e,student:u?{userId:u.UserID,studentId:u.StudentID,firstName:u.FirstName,lastName:u.LastName,email:u.Email}:null};});
      }
      return all.filter(function(e){return String(e.UserID)===a.userId&&String(e.Status).toUpperCase()==='ACTIVE';});
    }
    if(action==='enrollment.update'){
      var eid=cmText_(p.enrollmentId,100,'enrollmentId',true),en=cmGet_('Enrollments','EnrollmentID',eid);
      if(!en)throw apiError_('NOT_FOUND','Enrollment not found.');
      var off3=cmGet_('CourseOfferings','OfferingID',en.OfferingID);
      if(!off3||!emCanOffering_(a,off3)||!emCanImport_(a,off3))throw apiError_('FORBIDDEN','Cannot update this enrollment.');
      var status=cmText_(p.status,20,'status',true).toUpperCase();
      if(['ACTIVE','INACTIVE'].indexOf(status)<0)throw apiError_('VALIDATION_ERROR','status must be ACTIVE or INACTIVE.');
      var sh=emSheet_('Enrollments'),heads=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
      sh.getRange(en._row,heads.indexOf('Status')+1).setValue(status);
      sh.getRange(en._row,heads.indexOf('UpdatedAt')+1).setValue(new Date());
      appendAudit_(a.userId,'ENROLLMENT_UPDATED','Enrollment',eid,{status:status},requestId);
      return cmGet_('Enrollments','EnrollmentID',eid);
    }
    throw apiError_('NOT_IMPLEMENTED','Enrollment action is not implemented.');
  }finally{lock.releaseLock();}
}

/** Pure validation tests; no Spreadsheet reads/writes. */
function testEnrollmentImportLogicUnit(){
  var cases=[
    {name:'valid row',row:{studentId:'67000000001',firstName:'A',lastName:'B',email:'a@example.com'},pass:true},
    {name:'missing StudentID',row:{studentId:'',firstName:'A',lastName:'B',email:'a@example.com'},pass:false,code:'INVALID_STUDENT_ID'},
    {name:'missing first name',row:{studentId:'67000000001',firstName:'',lastName:'B',email:'a@example.com'},pass:false,code:'INVALID_FIRST_NAME'},
    {name:'missing last name',row:{studentId:'67000000001',firstName:'A',lastName:'',email:'a@example.com'},pass:false,code:'INVALID_LAST_NAME'},
    {name:'invalid email',row:{studentId:'67000000001',firstName:'A',lastName:'B',email:'bad'},pass:false,code:'INVALID_EMAIL'},
    {name:'email normalized',row:{studentId:'67000000001',firstName:'A',lastName:'B',email:' A@EXAMPLE.COM '},pass:true,email:'a@example.com'}
  ];
  var results=cases.map(function(c,i){
    var r=emNormalizeRow_(c.row,i),ok=c.pass?r.errors.length===0:(r.errors.indexOf(c.code)>=0);
    if(c.email)ok=ok&&r.email===c.email;
    return {name:c.name,pass:ok,errors:r.errors};
  });
  var passed=results.filter(function(x){return x.pass;}).length;
  var out={success:passed===cases.length,mode:'PURE_UNIT_ENROLLMENT_IMPORT',passed:passed,failed:cases.length-passed,total:cases.length,writesExpected:0,results:results};
  console.log(JSON.stringify(out));return out;
}

/** Read-only schema preflight for TEST/authorized environment. */
function testEnrollmentSchemaPreflight(){
  var expected={
    Enrollments:['EnrollmentID','OfferingID','UserID','Status','EnrolledAt','CreatedAt','UpdatedAt'],
    ImportJobs:['ImportJobID','OfferingID','FileName','Status','TotalRows','SuccessCount','ErrorCount','CreatedByUserID','CreatedAt','CompletedAt'],
    ImportErrors:['ImportErrorID','ImportJobID','RowNumber','StudentID','ErrorCode','ErrorMessage','CreatedAt']
  };
  var ss=SpreadsheetApp.getActiveSpreadsheet(),out={success:true,database:ss?ss.getName():null,checks:[]};
  Object.keys(expected).forEach(function(name){
    var sh=ss&&ss.getSheetByName(name),actual=sh?sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0]:[];
    var pass=Boolean(sh)&&actual.length===expected[name].length&&expected[name].every(function(h,i){return actual[i]===h;});
    out.checks.push({sheet:name,pass:pass,expectedColumns:expected[name].length,actualColumns:actual.length});
    if(!pass)out.success=false;
  });
  console.log(JSON.stringify(out));return out;
}
