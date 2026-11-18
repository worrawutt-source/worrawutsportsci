/**
 * SPORT NUTRITION CLASSROOM — Course & Semester Management
 * Physical field mapping for DOC-05/DOC-06 v1.3 logical entities.
 */
function cmSheet_(n){var s=SpreadsheetApp.getActiveSpreadsheet(),h=s&&s.getSheetByName(n);if(!h)throw apiError_('DATABASE_NOT_READY','Course management schema is not initialized.');return h;}
function cmRows_(n){return rowsAsObjects_(cmSheet_(n));}
function cmText_(v,max,key,required){var s=typeof v==='string'?v.trim():'';if((required&&!s)||s.length>max)throw apiError_('VALIDATION_ERROR',key+' is required or too long.');return s;}
function cmDate_(v,key){if(typeof v!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v))throw apiError_('VALIDATION_ERROR',key+' must use YYYY-MM-DD.');var d=new Date(v+'T00:00:00Z');if(isNaN(d.getTime())||d.toISOString().slice(0,10)!==v)throw apiError_('VALIDATION_ERROR',key+' is invalid.');return d;}
function cmGet_(table,key,id){return cmRows_(table).filter(function(r){return String(r[key])===String(id);})[0]||null;}
function getEffectiveRolesForUser_(uid){
 var ss=SpreadsheetApp.getActiveSpreadsheet(),out=[],sh=ss&&ss.getSheetByName('UserRoles');
 if(sh&&sh.getLastRow()>1)out=rowsAsObjects_(sh).filter(function(r){return String(r.UserID)===String(uid)&&String(r.Status).toUpperCase()==='ACTIVE';}).map(function(r){return {role:String(r.Role),scopeType:String(r.ScopeType),scopeId:String(r.ScopeID||'')};});
 var ci=ss&&ss.getSheetByName('CourseInstructors');
 if(ci&&ci.getLastRow()>1&&rowsAsObjects_(ci).some(function(r){return String(r.InstructorUserID)===String(uid)&&String(r.Status).toUpperCase()==='ACTIVE';}))out.push({role:'INSTRUCTOR',scopeType:'OFFERING',scopeId:'*'});
 if(!out.some(function(r){return ['SYSTEM_ADMIN','COURSE_COORDINATOR','INSTRUCTOR'].indexOf(r.role)>=0;}))out.push({role:'STUDENT',scopeType:'SELF',scopeId:String(uid)});
 return out;
}
function getPrimaryRoleForUser_(uid){var a=getEffectiveRolesForUser_(uid),p=['SYSTEM_ADMIN','COURSE_COORDINATOR','INSTRUCTOR','STUDENT'];for(var i=0;i<p.length;i++)if(a.some(function(r){return r.role===p[i];}))return p[i];return 'STUDENT';}
function cmActor_(identity){var l=findLineAccountBySubject_(identity.sub);if(!l)throw apiError_('LINKING_REQUIRED','Link your student account first.');return {userId:String(l.user.UserID),roles:getEffectiveRolesForUser_(l.user.UserID)};}
function cmSystem_(a,role){return a.roles.some(function(r){return r.role===role&&(r.scopeType==='SYSTEM'||r.scopeType==='ALL');});}
function cmCanCourse_(a,id){return cmSystem_(a,'SYSTEM_ADMIN')||a.roles.some(function(r){return r.role==='COURSE_COORDINATOR'&&(r.scopeType==='SYSTEM'||(r.scopeType==='COURSE'&&String(r.scopeId)===String(id)));});}
function cmCanSemester_(a,id){return cmSystem_(a,'SYSTEM_ADMIN')||a.roles.some(function(r){return r.role==='COURSE_COORDINATOR'&&(r.scopeType==='SYSTEM'||(r.scopeType==='SEMESTER'&&String(r.scopeId)===String(id)));});}
function cmCanOffering_(a,o){return cmCanCourse_(a,o.CourseID)||cmCanSemester_(a,o.SemesterID)||cmRows_('CourseInstructors').some(function(r){return String(r.OfferingID)===String(o.OfferingID)&&String(r.InstructorUserID)===a.userId&&String(r.Status).toUpperCase()==='ACTIVE';});}
function cmNeedSystem_(a){if(!cmSystem_(a,'SYSTEM_ADMIN')&&!cmSystem_(a,'COURSE_COORDINATOR'))throw apiError_('FORBIDDEN','Insufficient permission.');}
function handleCourseManagementAction_(action,identity,p,requestId){
 var a=cmActor_(identity),lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  if(action==='course.list'){cmNeedSystem_(a);return cmRows_('Courses').filter(function(x){return x.Status!=='DELETED';});}
  if(action==='course.create'){
   cmNeedSystem_(a);var code=cmText_(p.courseCode,40,'courseCode',true).toUpperCase(),name=cmText_(p.courseName,200,'courseName',true);
   if(cmRows_('Courses').some(function(x){return String(x.CourseCode).toUpperCase()===code;}))throw apiError_('DUPLICATE','Course code already exists.');
   var id=Utilities.getUuid(),now=new Date();cmSheet_('Courses').appendRow([id,code,name,cmText_(p.description,2000,'description',false),'ACTIVE',now,now,a.userId]);
   appendAudit_(a.userId,'COURSE_CREATED','Course',id,{courseCode:code},requestId);return cmGet_('Courses','CourseID',id);
  }
  if(action==='course.update'){
   var id=cmText_(p.courseId,100,'courseId',true),r=cmGet_('Courses','CourseID',id);if(!r)throw apiError_('NOT_FOUND','Course not found.');if(!cmCanCourse_(a,id))throw apiError_('FORBIDDEN','Cannot manage this course.');
   var sh=cmSheet_('Courses'),h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
   if(p.courseName!==undefined)sh.getRange(r._row,h.indexOf('CourseName')+1).setValue(cmText_(p.courseName,200,'courseName',true));
   if(p.description!==undefined)sh.getRange(r._row,h.indexOf('Description')+1).setValue(cmText_(p.description,2000,'description',false));
   if(p.status!==undefined){var st=cmText_(p.status,20,'status',true).toUpperCase();if(['ACTIVE','INACTIVE'].indexOf(st)<0)throw apiError_('VALIDATION_ERROR','Invalid status.');sh.getRange(r._row,h.indexOf('Status')+1).setValue(st);}
   sh.getRange(r._row,h.indexOf('UpdatedAt')+1).setValue(new Date());appendAudit_(a.userId,'COURSE_UPDATED','Course',id,{updated:true},requestId);return cmGet_('Courses','CourseID',id);
  }
  if(action==='semester.list'){cmNeedSystem_(a);return cmRows_('Semesters').filter(function(x){return x.Status!=='DELETED';});}
  if(action==='semester.create'){
   cmNeedSystem_(a);var y=Number(p.academicYear),term=cmText_(p.term,20,'term',true),sd=cmDate_(p.startDate,'startDate'),ed=cmDate_(p.endDate,'endDate');
   if(!Number.isInteger(y)||y<2500||y>2700||ed<sd)throw apiError_('VALIDATION_ERROR','Invalid academic year or date range.');
   if(cmRows_('Semesters').some(function(x){return Number(x.AcademicYear)===y&&String(x.Term)===term;}))throw apiError_('DUPLICATE','Semester already exists.');
   var sid=Utilities.getUuid(),n=new Date();cmSheet_('Semesters').appendRow([sid,y,term,sd,ed,'ACTIVE',n,n,a.userId]);appendAudit_(a.userId,'SEMESTER_CREATED','Semester',sid,{academicYear:y,term:term},requestId);return cmGet_('Semesters','SemesterID',sid);
  }
  if(action==='semester.update'){
   var sid=cmText_(p.semesterId,100,'semesterId',true),sem=cmGet_('Semesters','SemesterID',sid);if(!sem)throw apiError_('NOT_FOUND','Semester not found.');if(!cmCanSemester_(a,sid))throw apiError_('FORBIDDEN','Cannot manage this semester.');
   var s=cmSheet_('Semesters'),hh=s.getRange(1,1,1,s.getLastColumn()).getDisplayValues()[0],start=p.startDate!==undefined?cmDate_(p.startDate,'startDate'):new Date(sem.StartDate),end=p.endDate!==undefined?cmDate_(p.endDate,'endDate'):new Date(sem.EndDate);
   if(end<start)throw apiError_('VALIDATION_ERROR','endDate must not be earlier than startDate.');
   if(p.startDate!==undefined)s.getRange(sem._row,hh.indexOf('StartDate')+1).setValue(start);if(p.endDate!==undefined)s.getRange(sem._row,hh.indexOf('EndDate')+1).setValue(end);
   if(p.status!==undefined){var ss=cmText_(p.status,20,'status',true).toUpperCase();if(['ACTIVE','INACTIVE'].indexOf(ss)<0)throw apiError_('VALIDATION_ERROR','Invalid status.');s.getRange(sem._row,hh.indexOf('Status')+1).setValue(ss);}
   s.getRange(sem._row,hh.indexOf('UpdatedAt')+1).setValue(new Date());appendAudit_(a.userId,'SEMESTER_UPDATED','Semester',sid,{updated:true},requestId);return cmGet_('Semesters','SemesterID',sid);
  }
  if(action==='offering.list')return cmRows_('CourseOfferings').filter(function(o){return o.Status!=='DELETED'&&cmCanOffering_(a,o);}).map(function(o){return {offering:o,course:cmGet_('Courses','CourseID',o.CourseID),semester:cmGet_('Semesters','SemesterID',o.SemesterID)};});
  if(action==='offering.create'){
   var cid=cmText_(p.courseId,100,'courseId',true),sid2=cmText_(p.semesterId,100,'semesterId',true),c=cmGet_('Courses','CourseID',cid),sem2=cmGet_('Semesters','SemesterID',sid2);
   if(!c||!sem2)throw apiError_('NOT_FOUND','Course or semester not found.');if(!cmCanCourse_(a,cid)||!cmCanSemester_(a,sid2))throw apiError_('FORBIDDEN','Cannot create offering for this course/semester.');
   var sec=cmText_(p.section,30,'section',false);if(cmRows_('CourseOfferings').some(function(o){return o.CourseID===cid&&o.SemesterID===sid2&&o.Section===sec&&o.Status!=='DELETED';}))throw apiError_('DUPLICATE','Offering already exists.');
   var oid=Utilities.getUuid(),now2=new Date();cmSheet_('CourseOfferings').appendRow([oid,cid,sid2,sec,'ACTIVE',now2,now2,a.userId]);appendAudit_(a.userId,'OFFERING_CREATED','CourseOffering',oid,{courseId:cid,semesterId:sid2,section:sec},requestId);return cmGet_('CourseOfferings','OfferingID',oid);
  }
  if(action==='offering.update'){
   var oid2=cmText_(p.offeringId,100,'offeringId',true),o=cmGet_('CourseOfferings','OfferingID',oid2);if(!o)throw apiError_('NOT_FOUND','Offering not found.');if(!cmCanCourse_(a,o.CourseID)||!cmCanSemester_(a,o.SemesterID))throw apiError_('FORBIDDEN','Cannot manage this offering.');
   var os=cmSheet_('CourseOfferings'),oh=os.getRange(1,1,1,os.getLastColumn()).getDisplayValues()[0];if(p.section!==undefined)os.getRange(o._row,oh.indexOf('Section')+1).setValue(cmText_(p.section,30,'section',false));
   if(p.status!==undefined){var ost=cmText_(p.status,20,'status',true).toUpperCase();if(['ACTIVE','INACTIVE'].indexOf(ost)<0)throw apiError_('VALIDATION_ERROR','Invalid status.');os.getRange(o._row,oh.indexOf('Status')+1).setValue(ost);}
   os.getRange(o._row,oh.indexOf('UpdatedAt')+1).setValue(new Date());appendAudit_(a.userId,'OFFERING_UPDATED','CourseOffering',oid2,{updated:true},requestId);return cmGet_('CourseOfferings','OfferingID',oid2);
  }
  if(action==='instructor.assign'){
   var oid3=cmText_(p.offeringId,100,'offeringId',true),stu=normalizeStudentId_(p.studentId),off=cmGet_('CourseOfferings','OfferingID',oid3),u=cmRows_('Users').filter(function(x){return String(x.StudentID)===stu&&x.Status==='ACTIVE';})[0];
   if(!off||!u)throw apiError_('NOT_FOUND','Offering or user not found.');if(!cmCanCourse_(a,off.CourseID)||!cmCanSemester_(a,off.SemesterID))throw apiError_('FORBIDDEN','Cannot assign instructor to this offering.');
   if(cmRows_('CourseInstructors').some(function(x){return x.OfferingID===oid3&&String(x.InstructorUserID)===String(u.UserID)&&x.Status==='ACTIVE';}))throw apiError_('DUPLICATE','Instructor already assigned.');
   var ci=Utilities.getUuid(),tn=new Date();cmSheet_('CourseInstructors').appendRow([ci,oid3,u.UserID,a.userId,'ACTIVE',tn,tn]);appendAudit_(a.userId,'INSTRUCTOR_ASSIGNED','CourseOffering',oid3,{instructorUserId:String(u.UserID)},requestId);return {courseInstructorId:ci,offeringId:oid3,studentId:stu,status:'ACTIVE'};
  }
  if(action==='instructor.unassign'){
   var ciid=cmText_(p.courseInstructorId,100,'courseInstructorId',true),as=cmGet_('CourseInstructors','CourseInstructorID',ciid);if(!as)throw apiError_('NOT_FOUND','Instructor assignment not found.');var ao=cmGet_('CourseOfferings','OfferingID',as.OfferingID);
   if(!ao||!cmCanCourse_(a,ao.CourseID)||!cmCanSemester_(a,ao.SemesterID))throw apiError_('FORBIDDEN','Cannot remove this instructor.');
   var cs=cmSheet_('CourseInstructors'),ch=cs.getRange(1,1,1,cs.getLastColumn()).getDisplayValues()[0];cs.getRange(as._row,ch.indexOf('Status')+1).setValue('INACTIVE');cs.getRange(as._row,ch.indexOf('UpdatedAt')+1).setValue(new Date());appendAudit_(a.userId,'INSTRUCTOR_UNASSIGNED','CourseOffering',as.OfferingID,{instructorUserId:String(as.InstructorUserID)},requestId);return {courseInstructorId:ciid,status:'INACTIVE'};
  }
  throw apiError_('NOT_IMPLEMENTED','Course management action is not implemented.');
 }finally{lock.releaseLock();}
}
/** Set SNC_INITIAL_ADMIN_STUDENT_ID in Script Properties, run once manually, then remove the property. */
function bootstrapInitialAdminRole(){
 var props=PropertiesService.getScriptProperties(),sid=props.getProperty('SNC_INITIAL_ADMIN_STUDENT_ID');if(!sid)throw new Error('Set SNC_INITIAL_ADMIN_STUDENT_ID first.');
 sid=normalizeStudentId_(sid);var u=cmRows_('Users').filter(function(x){return String(x.StudentID)===sid&&x.Status==='ACTIVE';})[0];if(!u)throw new Error('Active user not found.');
 if(cmRows_('UserRoles').some(function(x){return String(x.UserID)===String(u.UserID)&&x.Role==='SYSTEM_ADMIN'&&x.ScopeType==='SYSTEM'&&x.Status==='ACTIVE';}))return {success:true,alreadyAssigned:true};
 var now=new Date();cmSheet_('UserRoles').appendRow([Utilities.getUuid(),u.UserID,'SYSTEM_ADMIN','SYSTEM','*','ACTIVE',now,now,'SYSTEM_BOOTSTRAP']);appendAudit_('SYSTEM_BOOTSTRAP','SYSTEM_ADMIN_BOOTSTRAPPED','User',u.UserID,{role:'SYSTEM_ADMIN'},Utilities.getUuid());return {success:true,assigned:true};
}
function testCourseManagementPreflight(){
 var ex={UserRoles:['UserRoleID','UserID','Role','ScopeType','ScopeID','Status','CreatedAt','UpdatedAt','CreatedByUserID'],Courses:['CourseID','CourseCode','CourseName','Description','Status','CreatedAt','UpdatedAt','CreatedByUserID'],Semesters:['SemesterID','AcademicYear','Term','StartDate','EndDate','Status','CreatedAt','UpdatedAt','CreatedByUserID'],CourseOfferings:['OfferingID','CourseID','SemesterID','Section','Status','CreatedAt','UpdatedAt','CreatedByUserID'],CourseInstructors:['CourseInstructorID','OfferingID','InstructorUserID','AssignedByUserID','Status','CreatedAt','UpdatedAt']};
 var ss=SpreadsheetApp.getActiveSpreadsheet(),out={success:true,checks:{}};Object.keys(ex).forEach(function(n){var sh=ss&&ss.getSheetByName(n);if(!sh){out.checks[n]='MISSING';out.success=false;return;}var a=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],ok=a.length===ex[n].length&&ex[n].every(function(h,i){return a[i]===h;});out.checks[n]=ok?'PASS':'FAIL';if(!ok)out.success=false;});console.log(JSON.stringify(out,null,2));return out;
}
