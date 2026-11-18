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
 if(!out.some(function(r){return r.role==='STUDENT';}))out.push({role:'STUDENT',scopeType:'SELF',scopeId:String(uid)});
 return out;
}
function getPrimaryRoleForUser_(uid){var a=getEffectiveRolesForUser_(uid),p=['SYSTEM_ADMIN','COURSE_COORDINATOR','INSTRUCTOR','STUDENT'];for(var i=0;i<p.length;i++)if(a.some(function(r){return r.role===p[i];}))return p[i];return 'STUDENT';}
function cmActor_(identity){var l=findLineAccountBySubject_(identity.sub);if(!l)throw apiError_('LINKING_REQUIRED','Link your student account first.');return {userId:String(l.user.UserID),roles:getEffectiveRolesForUser_(l.user.UserID)};}
function cmSystem_(a,role){return a.roles.some(function(r){return r.role===role&&(r.scopeType==='SYSTEM'||r.scopeType==='ALL');});}
function cmCanCourse_(a,id){return cmSystem_(a,'SYSTEM_ADMIN')||cmSystem_(a,'COURSE_COORDINATOR')||a.roles.some(function(r){return r.role==='COURSE_COORDINATOR'&&r.scopeType==='COURSE'&&String(r.scopeId)===String(id);});}
function cmCanSemester_(a,id){return cmSystem_(a,'SYSTEM_ADMIN')||cmSystem_(a,'COURSE_COORDINATOR')||a.roles.some(function(r){return r.role==='COURSE_COORDINATOR'&&r.scopeType==='SEMESTER'&&String(r.scopeId)===String(id);});}
function cmCanOffering_(a,o){return cmCanCourse_(a,o.CourseID)||cmCanSemester_(a,o.SemesterID)||cmRows_('CourseInstructors').some(function(r){return String(r.OfferingID)===String(o.OfferingID)&&String(r.InstructorUserID)===a.userId&&String(r.Status).toUpperCase()==='ACTIVE';});}
function cmNeedSystem_(a){if(!cmSystem_(a,'SYSTEM_ADMIN')&&!cmSystem_(a,'COURSE_COORDINATOR'))throw apiError_('FORBIDDEN','Insufficient permission.');}
function cmVisibleCourses_(a,rows){return rows.filter(function(x){return x.Status!=='DELETED'&&cmCanCourse_(a,x.CourseID);});}
function cmVisibleSemesters_(a,rows){return rows.filter(function(x){return x.Status!=='DELETED'&&cmCanSemester_(a,x.SemesterID);});}
function cmVisibleOfferings_(a,rows){return rows.filter(function(o){return o.Status!=='DELETED'&&cmCanOffering_(a,o);});}
function handleCourseManagementAction_(action,identity,p,requestId){
 return handleCourseManagementActionForActor_(action,cmActor_(identity),p,requestId);
}
function handleCourseManagementActionForActor_(action,a,p,requestId){
 var lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  if(action==='course.list'){return cmVisibleCourses_(a,cmRows_('Courses'));}
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
  if(action==='semester.list'){return cmVisibleSemesters_(a,cmRows_('Semesters'));}
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
  if(action==='offering.list')return cmVisibleOfferings_(a,cmRows_('CourseOfferings')).map(function(o){return {offering:o,course:cmGet_('Courses','CourseID',o.CourseID),semester:cmGet_('Semesters','SemesterID',o.SemesterID)};});
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


/**
 * Read-only authorization unit tests. Safe to run in TEST Apps Script.
 * Does not read/write spreadsheet data, create records, or call LINE APIs.
 */
function testCourseManagementAuthorizationLogic(){
 var cases=[],course='COURSE-A',otherCourse='COURSE-B',semester='SEM-1',otherSemester='SEM-2';
 function actor(role,scopeType,scopeId){return {userId:'TEST-USER',roles:[{role:role,scopeType:scopeType,scopeId:scopeId||''}]};}
 function check(name,fn,expected){var passed=false,detail='';try{var actual=fn();passed=actual===expected;detail='actual='+actual;}catch(e){detail='error='+(e&&e.message?e.message:String(e));}cases.push({name:name,result:passed?'PASS':'FAIL',detail:detail});}
 function denied(name,fn){var rejected=false;try{fn();}catch(e){rejected=true;}cases.push({name:name,result:rejected?'PASS':'FAIL',detail:rejected?'request rejected as expected':'request was not rejected'});}
 check('System Admin can manage any course',function(){return cmCanCourse_(actor('SYSTEM_ADMIN','SYSTEM','*'),otherCourse);},true);
 check('System Admin can manage any semester',function(){return cmCanSemester_(actor('SYSTEM_ADMIN','SYSTEM','*'),otherSemester);},true);
 check('System Coordinator can manage any course',function(){return cmCanCourse_(actor('COURSE_COORDINATOR','SYSTEM','*'),otherCourse);},true);
 check('System Coordinator can manage any semester',function(){return cmCanSemester_(actor('COURSE_COORDINATOR','SYSTEM','*'),otherSemester);},true);
 check('Course-scoped Coordinator can manage assigned course',function(){return cmCanCourse_(actor('COURSE_COORDINATOR','COURSE',course),course);},true);
 check('Course-scoped Coordinator cannot manage other course',function(){return cmCanCourse_(actor('COURSE_COORDINATOR','COURSE',course),otherCourse);},false);
 check('Semester-scoped Coordinator can manage assigned semester',function(){return cmCanSemester_(actor('COURSE_COORDINATOR','SEMESTER',semester),semester);},true);
 check('Semester-scoped Coordinator cannot manage other semester',function(){return cmCanSemester_(actor('COURSE_COORDINATOR','SEMESTER',semester),otherSemester);},false);
 check('Instructor cannot manage course',function(){return cmCanCourse_(actor('INSTRUCTOR','OFFERING','*'),course);},false);
 check('Student cannot manage semester',function(){return cmCanSemester_(actor('STUDENT','SELF','TEST-USER'),semester);},false);
 check('System Coordinator passes system-level guard',function(){try{cmNeedSystem_(actor('COURSE_COORDINATOR','SYSTEM','*'));return true;}catch(e){return false;}},true);
 denied('Scoped Coordinator is denied system-level creation guard',function(){cmNeedSystem_(actor('COURSE_COORDINATOR','COURSE',course));});
 denied('Instructor is denied system-level creation guard',function(){cmNeedSystem_(actor('INSTRUCTOR','OFFERING','*'));});

 var courseRows=[{CourseID:'COURSE-A',Status:'ACTIVE'},{CourseID:'COURSE-B',Status:'ACTIVE'},{CourseID:'COURSE-C',Status:'DELETED'}];
 var semesterRows=[{SemesterID:'SEM-1',Status:'ACTIVE'},{SemesterID:'SEM-2',Status:'ACTIVE'},{SemesterID:'SEM-3',Status:'DELETED'}];
 var offeringRows=[{OfferingID:'OFF-1',CourseID:'COURSE-A',SemesterID:'SEM-1',Status:'ACTIVE'},{OfferingID:'OFF-2',CourseID:'COURSE-B',SemesterID:'SEM-2',Status:'ACTIVE'},{OfferingID:'OFF-3',CourseID:'COURSE-A',SemesterID:'SEM-1',Status:'DELETED'}];
 check('Course list filters to assigned course only',function(){return cmVisibleCourses_(actor('COURSE_COORDINATOR','COURSE',course),courseRows).map(function(x){return x.CourseID;}).join(',');},'COURSE-A');
 check('Semester list filters to assigned semester only',function(){return cmVisibleSemesters_(actor('COURSE_COORDINATOR','SEMESTER',semester),semesterRows).map(function(x){return x.SemesterID;}).join(',');},'SEM-1');
 check('System Admin sees all non-deleted courses',function(){return cmVisibleCourses_(actor('SYSTEM_ADMIN','SYSTEM','*'),courseRows).length;},2);
 check('System Coordinator sees all non-deleted semesters',function(){return cmVisibleSemesters_(actor('COURSE_COORDINATOR','SYSTEM','*'),semesterRows).length;},2);
 check('Instructor sees only assigned offering',function(){var a=actor('INSTRUCTOR','OFFERING','*');a.userId='INSTRUCTOR-1';var rows=offeringRows.concat();var old=cmRows_;cmRows_=function(){return [{OfferingID:'OFF-1',InstructorUserID:'INSTRUCTOR-1',Status:'ACTIVE'}];};try{return cmVisibleOfferings_(a,rows).map(function(x){return x.OfferingID;}).join(',');}finally{cmRows_=old;}},'OFF-1');
 check('Student sees no offerings by default',function(){var old=cmRows_;cmRows_=function(){return [];};try{return cmVisibleOfferings_(actor('STUDENT','SELF','TEST-USER'),offeringRows).length;}finally{cmRows_=old;}},0);
 var passed=cases.filter(function(x){return x.result==='PASS';}).length,failed=cases.length-passed;
 var out={success:failed===0,passed:passed,failed:failed,total:cases.length,cases:cases};
 console.log(JSON.stringify(out,null,2));return out;
}


/**
 * Read-only test against real TEST spreadsheet role assignments.
 * Checks role resolution and scope enforcement without changing data.
 * Logs aggregate counts only; does not print user, course, semester or offering IDs.
 */
function testCourseManagementLiveAuthorizationData(){
 var report={success:true,roleRows:0,activeRoles:0,checks:[],summary:{}};
 var ss=SpreadsheetApp.getActiveSpreadsheet();
 var roleSheet=ss&&ss.getSheetByName('UserRoles');
 var courseSheet=ss&&ss.getSheetByName('Courses');
 var semesterSheet=ss&&ss.getSheetByName('Semesters');
 var offeringSheet=ss&&ss.getSheetByName('CourseOfferings');
 var instructorSheet=ss&&ss.getSheetByName('CourseInstructors');
 if(!roleSheet||!courseSheet||!semesterSheet||!offeringSheet||!instructorSheet)throw new Error('Required course-management sheets are missing.');
 var roleRows=rowsAsObjects_(roleSheet),courses=rowsAsObjects_(courseSheet).filter(function(x){return x.Status!=='DELETED';});
 var semesters=rowsAsObjects_(semesterSheet).filter(function(x){return x.Status!=='DELETED';});
 var offerings=rowsAsObjects_(offeringSheet).filter(function(x){return x.Status!=='DELETED';});
 function add(name,ok){report.checks.push({name:name,result:ok?'PASS':'FAIL'});if(!ok)report.success=false;}
 report.roleRows=roleRows.length;
 var active=roleRows.filter(function(r){return String(r.Status).toUpperCase()==='ACTIVE';});
 report.activeRoles=active.length;
 var tested={};
 active.forEach(function(r){
  var uid=String(r.UserID),role=String(r.Role),scope=String(r.ScopeType),scopeId=String(r.ScopeID||''),actor={userId:uid,roles:getEffectiveRolesForUser_(uid)};
  var key=role+'|'+scope;
  tested[key]=(tested[key]||0)+1;
  if(role==='COURSE_COORDINATOR'&&scope==='COURSE'){
   var exists=courses.some(function(x){return String(x.CourseID)===scopeId;});
   add('Active course scope resolves to an existing course',exists&&cmCanCourse_(actor,scopeId));
   var other=courses.filter(function(x){return String(x.CourseID)!==scopeId;})[0];
   if(other)add('Course scope denies an unrelated course',!cmCanCourse_(actor,other.CourseID));
  }else if(role==='COURSE_COORDINATOR'&&scope==='SEMESTER'){
   var semExists=semesters.some(function(x){return String(x.SemesterID)===scopeId;});
   add('Active semester scope resolves to an existing semester',semExists&&cmCanSemester_(actor,scopeId));
   var otherSem=semesters.filter(function(x){return String(x.SemesterID)!==scopeId;})[0];
   if(otherSem)add('Semester scope denies an unrelated semester',!cmCanSemester_(actor,otherSem.SemesterID));
  }else if(role==='COURSE_COORDINATOR'&&(scope==='SYSTEM'||scope==='ALL')){
   add('System coordinator resolves to system-level course access',courses.every(function(x){return cmCanCourse_(actor,x.CourseID);}));
   add('System coordinator resolves to system-level semester access',semesters.every(function(x){return cmCanSemester_(actor,x.SemesterID);}));
  }else if(role==='SYSTEM_ADMIN'&&(scope==='SYSTEM'||scope==='ALL')){
   add('System Admin resolves to system-level course access',courses.every(function(x){return cmCanCourse_(actor,x.CourseID);}));
   add('System Admin resolves to system-level semester access',semesters.every(function(x){return cmCanSemester_(actor,x.SemesterID);}));
  }
 });
 var activeInstructorRows=rowsAsObjects_(instructorSheet).filter(function(x){return String(x.Status).toUpperCase()==='ACTIVE';});
 activeInstructorRows.forEach(function(r){
  var uid=String(r.InstructorUserID),off=offerings.filter(function(x){return String(x.OfferingID)===String(r.OfferingID);})[0];
  var actor={userId:uid,roles:getEffectiveRolesForUser_(uid)};
  add('Active instructor assignment resolves to its offering',Boolean(off)&&cmCanOffering_(actor,off));
 });
 report.summary={activeCourseCoordinatorScopes:active.filter(function(r){return r.Role==='COURSE_COORDINATOR';}).length,activeSystemAdminScopes:active.filter(function(r){return r.Role==='SYSTEM_ADMIN';}).length,activeInstructorAssignments:activeInstructorRows.length,activeCourses:courses.length,activeSemesters:semesters.length,activeOfferings:offerings.length,scopeTypesTested:Object.keys(tested).length};
 report.passed=report.checks.filter(function(x){return x.result==='PASS';}).length;
 report.failed=report.checks.length-report.passed;
 report.total=report.checks.length;
 if(report.total===0)report.note='No applicable active role assignments were available for live-data checks.';
 console.log(JSON.stringify(report,null,2));
 return report;
}

/**
 * Read-only integration test of list handlers against the active TEST spreadsheet.
 * Uses an already-linked active System Admin account; never prints LINE subject or IDs.
 * This exercises Sheets -> role resolution -> cmActor -> list handlers, but not doPost/token verification.
 */
function testCourseManagementReadEndpointsWithLinkedAdmin(){
 var ss=SpreadsheetApp.getActiveSpreadsheet();
 var roleRows=rowsAsObjects_(ss.getSheetByName('UserRoles'));
 var accountRows=rowsAsObjects_(ss.getSheetByName('LINEAccounts'));
 var activeAdmin=roleRows.filter(function(r){return String(r.Role)==='SYSTEM_ADMIN'&&String(r.Status).toUpperCase()==='ACTIVE'&&(String(r.ScopeType)==='SYSTEM'||String(r.ScopeType)==='ALL');})[0];
 if(!activeAdmin)throw new Error('No active system administrator role is configured.');
 var link=accountRows.filter(function(r){return String(r.UserID)===String(activeAdmin.UserID)&&String(r.Provider)==='LINE'&&String(r.Status).toUpperCase()==='ACTIVE';})[0];
 if(!link)throw new Error('The active system administrator does not have an active LINE account link.');
 var identity={sub:String(link.ProviderSubject)};
 var report={success:true,checks:[]};
 function run(name,action){
  try{
   var data=handleCourseManagementAction_(action,identity,{},'READONLY-TEST-'+action);
   var ok=Array.isArray(data);
   report.checks.push({name:name,result:ok?'PASS':'FAIL',rowCount:ok?data.length:null});
   if(!ok)report.success=false;
  }catch(e){
   report.checks.push({name:name,result:'FAIL',errorCode:e&&e.apiCode?e.apiCode:'INTERNAL_ERROR'});
   report.success=false;
  }
 }
 run('course.list handler returns an authorized array','course.list');
 run('semester.list handler returns an authorized array','semester.list');
 run('offering.list handler returns an authorized array','offering.list');
 report.note='Exercises live Sheets, LINE account lookup, role resolution and list handlers. Does not exercise doPost or LINE ID-token verification.';
 report.passed=report.checks.filter(function(x){return x.result==='PASS';}).length;
 report.failed=report.checks.length-report.passed;
 report.total=report.checks.length;
 console.log(JSON.stringify(report,null,2));
 return report;
}


/**
 * Simulated API-handler authorization test for the TEST spreadsheet only.
 * Run manually from the Apps Script editor. Never exposed through doPost.
 * Uses a synthetic Instructor actor and performs only requests expected to be
 * rejected before any spreadsheet mutation.
 */
function testSimulatedInstructorNegativeAuthorization(){
 var TEST_SPREADSHEET_ID='1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk';
 var ss=SpreadsheetApp.getActiveSpreadsheet();
 if(!ss||ss.getId()!==TEST_SPREADSHEET_ID)throw new Error('SAFETY_STOP: This test is restricted to the configured TEST spreadsheet.');
 var actor={userId:'SNC_SIMULATED_INSTRUCTOR_ONLY',roles:[{role:'INSTRUCTOR',scopeType:'OFFERING',scopeId:'*'}]};
 if(actor.roles.some(function(r){return r.role==='SYSTEM_ADMIN'||r.role==='COURSE_COORDINATOR';}))throw new Error('SAFETY_STOP: Simulated actor must not have elevated roles.');
 var activeOffering=cmRows_('CourseOfferings').filter(function(o){return String(o.Status).toUpperCase()==='ACTIVE';})[0];
 if(!activeOffering)throw new Error('TEST_BLOCKED: An active TEST offering is required for NEG-03.');
 var cases=[];
 function expectForbidden(name,action,payload){
  try{
   handleCourseManagementActionForActor_(action,actor,payload,'SIMULATED-NEG-'+name);
   cases.push({test:name,result:'FAIL',actual:'REQUEST_ALLOWED'});
  }catch(e){
   var code=e&&e.apiCode?e.apiCode:'UNEXPECTED_ERROR';
   cases.push({test:name,result:code==='FORBIDDEN'?'PASS':'FAIL',expected:'FORBIDDEN',actual:code});
  }
 }
 expectForbidden('NEG-01 Course Create','course.create',{
  courseCode:'SIM-NEG-TEST',courseName:'Simulated Negative Authorization',description:'Must not be created'
 });
 expectForbidden('NEG-02 Semester Create','semester.create',{
  academicYear:2570,term:'SIM-NEG-TEST',startDate:'2027-05-01',endDate:'2027-09-30'
 });
 expectForbidden('NEG-03 Assigned Offering Update','offering.update',{
  offeringId:String(activeOffering.OfferingID),section:'SIM-NEG-TEST'
 });
 var passed=cases.filter(function(x){return x.result==='PASS';}).length;
 var out={success:passed===cases.length,passed:passed,failed:cases.length-passed,total:cases.length,cases:cases,
  mode:'SIMULATED_ACTOR_HANDLER_TEST',database:'TEST',writesExpected:0,
  note:'Synthetic Instructor actor; all tested actions must be rejected before any write.'};
 console.log(JSON.stringify(out,null,2));
 return out;
}


/**
 * Read-only Instructor data-scope isolation and cross-offering access test.
 * TEST spreadsheet only. Uses a real active instructor assignment to build
 * the actor, but does not require LINE login and does not modify sheet data.
 */
function testInstructorDataScopeIsolation(){
 var TEST_SPREADSHEET_ID='1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk';
 var ss=SpreadsheetApp.getActiveSpreadsheet();
 if(!ss||ss.getId()!==TEST_SPREADSHEET_ID)throw new Error('SAFETY_STOP: This test is restricted to the configured TEST spreadsheet.');
 var assignments=cmRows_('CourseInstructors').filter(function(x){return String(x.Status).toUpperCase()==='ACTIVE';});
 var offerings=cmRows_('CourseOfferings').filter(function(x){return String(x.Status).toUpperCase()!=='DELETED';});
 if(!assignments.length)throw new Error('TEST_BLOCKED: No active instructor assignment exists.');
 var assignment=assignments[0],uid=String(assignment.InstructorUserID);
 var actor={userId:uid,roles:[{role:'INSTRUCTOR',scopeType:'OFFERING',scopeId:'*'}]};
 var assignedIds=assignments.filter(function(x){return String(x.InstructorUserID)===uid;}).map(function(x){return String(x.OfferingID);});
 var assignedMap={};assignedIds.forEach(function(id){assignedMap[id]=true;});
 var unrelated=offerings.filter(function(o){return !assignedMap[String(o.OfferingID)]&&String(o.Status).toUpperCase()==='ACTIVE';})[0];
 var report={success:true,mode:'READ_ONLY_SIMULATED_INSTRUCTOR_SCOPE',database:'TEST',checks:[]};
 function add(name,ok,detail){report.checks.push({test:name,result:ok?'PASS':'FAIL',detail:detail||''});if(!ok)report.success=false;}
 var courses=handleCourseManagementActionForActor_('course.list',actor,{},'SCOPE-TEST-COURSE');
 var semesters=handleCourseManagementActionForActor_('semester.list',actor,{},'SCOPE-TEST-SEMESTER');
 var visible=handleCourseManagementActionForActor_('offering.list',actor,{},'SCOPE-TEST-OFFERING');
 var visibleIds=visible.map(function(x){return String(x.offering.OfferingID);}).sort();
 var expectedIds=offerings.filter(function(o){return assignedMap[String(o.OfferingID)]&&String(o.Status).toUpperCase()!=='DELETED';}).map(function(o){return String(o.OfferingID);}).sort();
 add('Instructor cannot view course master list',courses.length===0,'visibleCount='+courses.length);
 add('Instructor cannot view semester master list',semesters.length===0,'visibleCount='+semesters.length);
 add('Offering list contains only offerings assigned to this instructor',JSON.stringify(visibleIds)===JSON.stringify(expectedIds),'visibleCount='+visibleIds.length+', assignedCount='+expectedIds.length);
 if(unrelated){
  var before=String(unrelated.Section||'');
  var crossResult='NO_RESULT';
  try{
   handleCourseManagementActionForActor_('offering.update',actor,{offeringId:String(unrelated.OfferingID),section:'SHOULD_NOT_CHANGE'},'SCOPE-TEST-CROSS-OFFERING');
   crossResult='REQUEST_ALLOWED';
  }catch(e){crossResult=e&&e.apiCode?e.apiCode:'UNEXPECTED_ERROR';}
  var after=cmGet_('CourseOfferings','OfferingID',unrelated.OfferingID);
  add('Instructor cannot update an unrelated offering',crossResult==='FORBIDDEN','actual='+crossResult);
  add('Unrelated offering remains unchanged after denied update',Boolean(after)&&String(after.Section||'')===before,'unchanged='+Boolean(after)&&String(after.Section||'')===before);
 }else{
  report.checks.push({test:'Cross-offering update denial',result:'BLOCKED',detail:'No second active offering outside this instructor assignment exists; no unrelated offering was created.'});
 }
 report.assignedOfferingCount=expectedIds.length;
 report.visibleOfferingCount=visibleIds.length;
 report.hasUnrelatedActiveOffering=Boolean(unrelated);
 report.passed=report.checks.filter(function(x){return x.result==='PASS';}).length;
 report.failed=report.checks.filter(function(x){return x.result==='FAIL';}).length;
 report.blocked=report.checks.filter(function(x){return x.result==='BLOCKED';}).length;
 report.total=report.checks.length;
 console.log(JSON.stringify(report,null,2));
 return report;
}
