/**
 * SPORT NUTRITION CLASSROOM — Submission Management
 * Individual and group submissions with immutable revision history.
 * File upload is handled by FileManagement.gs.
 */
function smAssignment_(id){
  var a=cmGet_('Assignments','AssignmentID',id);
  if(!a)throw apiError_('NOT_FOUND','Assignment not found.');
  return a;
}
function smCanView_(actor,submission){
  var a=smAssignment_(submission.AssignmentID),o=cmGet_('CourseOfferings','OfferingID',a.OfferingID);
  if(o&&cmCanOffering_(actor,o))return true;
  if(String(submission.SubmissionType)==='INDIVIDUAL')return String(submission.StudentUserID)===String(actor.userId);
  return gmMembers_(submission.GroupID).some(function(m){return String(m.UserID)===String(actor.userId);});
}
function smCanSubmitGroup_(member,requireRepresentative){
  return Boolean(member)&&(!requireRepresentative||String(member.MemberRole).toUpperCase()==='LEADER');
}
function testGroupSubmissionRepresentativeUnit(){
  var cases=[
    {test:'Designated leader may submit group work',result:smCanSubmitGroup_({MemberRole:'LEADER'},true)?'PASS':'FAIL'},
    {test:'Ordinary member cannot submit group work',result:!smCanSubmitGroup_({MemberRole:'MEMBER'},true)?'PASS':'FAIL'},
    {test:'Ordinary member may still upload staged file',result:smCanSubmitGroup_({MemberRole:'MEMBER'},false)?'PASS':'FAIL'},
    {test:'Non-member cannot submit or upload',result:!smCanSubmitGroup_(null,false)?'PASS':'FAIL'}
  ];
  var passed=cases.filter(function(x){return x.result==='PASS';}).length;
  var out={success:passed===cases.length,mode:'PURE_UNIT_GROUP_SUBMISSION_AUTHORIZATION',database:'NONE',passed:passed,failed:cases.length-passed,total:cases.length,writesExpected:0,cases:cases};
  console.log(JSON.stringify(out,null,2));return out;
}
function smValidateTarget_(actor,a,p,requireRepresentative){
  if(String(a.Status).toUpperCase()!=='OPEN')throw apiError_('ASSIGNMENT_CLOSED','Assignment is not open.');
  var type=String(a.SubmissionType).toUpperCase();
  if(type==='INDIVIDUAL'){
    if(!gmEnrolled_(a.OfferingID,actor.userId))throw apiError_('ENROLLMENT_REQUIRED','Active enrollment is required.');
    return {type:type,studentUserId:actor.userId,groupId:''};
  }
  if(type!=='GROUP')throw apiError_('INVALID_SUBMISSION_TYPE','Unsupported assignment submission type.');
  var groupId=cmText_(p.groupId,100,'groupId',true),g=gmGet_('Groups','GroupID',groupId);
  if(!g||String(g.OfferingID)!==String(a.OfferingID)||String(g.Status).toUpperCase()!=='ACTIVE')
    throw apiError_('NOT_FOUND','Active group in this offering not found.');
  var activeMembers=gmMembers_(groupId),actorMember=activeMembers.filter(function(m){return String(m.UserID)===String(actor.userId);})[0];
  if(!actorMember)throw apiError_('GROUP_MEMBERSHIP_REQUIRED','Submitter must be an active member of the group.');
  if(!smCanSubmitGroup_(actorMember,Boolean(requireRepresentative)))
    throw apiError_('FORBIDDEN','Only the designated group representative may submit group work.');
  var count=activeMembers.length,min=Number(a.MinGroupMembers||2),max=String(a.MaxGroupMembers||'').trim()===''?null:Number(a.MaxGroupMembers);
  if(count<min)throw apiError_('GROUP_MIN_MEMBERS_NOT_MET','Group must contain at least two active members.');
  if(max!==null&&count>max)throw apiError_('GROUP_MAX_MEMBERS_EXCEEDED','Group exceeds the maximum member count for this assignment.');
  return {type:type,studentUserId:'',groupId:groupId,group:g};
}
function smTargetKey_(a,target){
  return target.type==='INDIVIDUAL'
    ? {StudentUserID:String(target.studentUserId),GroupID:''}
    : {StudentUserID:'',GroupID:String(target.groupId)};
}
function smLatest_(assignmentId,target){
  return cmRows_('Submissions').filter(function(s){
    return String(s.AssignmentID)===String(assignmentId)&&
      String(s.StudentUserID||'')===String(target.StudentUserID||'')&&
      String(s.GroupID||'')===String(target.GroupID||'');
  }).sort(function(a,b){return Number(b.RevisionNumber)-Number(a.RevisionNumber);})[0]||null;
}
function smCreateRevision_(actor,a,target,p,previous,requestId){
  var fileIds=Array.isArray(p.fileIds)?p.fileIds:[];
  var driveUrls=Array.isArray(p.driveUrls)?p.driveUrls:[];
  if(fileIds.length+driveUrls.length>10)throw apiError_('VALIDATION_ERROR','A submission may reference at most ten files or URLs.');
  var stagedFiles=fileIds.map(function(fileId){
    var staged=cmGet_('SubmissionFiles','SubmissionFileID',fileId);
    if(!staged||String(staged.SubmissionID)!=='STAGED:'+String(actor.userId)+':'+String(a.AssignmentID))
      throw apiError_('FILE_INVALID','Uploaded file is invalid or does not belong to this user.');
    return staged;
  });
  driveUrls.forEach(function(url){
    if(typeof url!=='string'||url.length>2048||!/^https:\/\/(drive|docs)\.google\.com\//i.test(url))
      throw apiError_('FILE_INVALID','Only Google Drive or Google Docs HTTPS URLs are accepted.');
  });
  stagedFiles.forEach(function(staged){
    if(staged.DriveFileID&&typeof fmShareWithSubmissionActors_==='function'){
      try{fmShareWithSubmissionActors_(DriveApp.getFileById(String(staged.DriveFileID)),actor,a,target);}
      catch(e){throw apiError_('FILE_PERMISSION_FAILED','Unable to grant submission file access to authorized participants.');}
    }
  });
  var now=new Date(),deadline=new Date(a.Deadline),status=now.getTime()>deadline.getTime()?'LATE':'SUBMITTED';
  var id=Utilities.getUuid(),rev=previous?Number(previous.RevisionNumber)+1:1;
  cmSheet_('Submissions').appendRow([
    id,a.AssignmentID,target.type,target.studentUserId,target.groupId,actor.userId,now,status,rev,
    previous?previous.SubmissionID:'',now
  ]);
  if(target.type==='GROUP'&&!target.group.MembershipLockedAt){
    var gs=gmSheet_('Groups'),gh=gs.getRange(1,1,1,gs.getLastColumn()).getDisplayValues()[0];
    gs.getRange(target.group._row,gh.indexOf('MembershipLockedAt')+1).setValue(now);
  }
  var fileSheet=cmSheet_('SubmissionFiles'),fileHeaders=fileSheet.getRange(1,1,1,fileSheet.getLastColumn()).getDisplayValues()[0];
  stagedFiles.forEach(function(staged){
    fileSheet.getRange(staged._row,fileHeaders.indexOf('SubmissionID')+1).setValue(id);
  });
  driveUrls.forEach(function(url){
    var row=new Array(fileHeaders.length);
    row[fileHeaders.indexOf('SubmissionFileID')]=Utilities.getUuid();
    row[fileHeaders.indexOf('SubmissionID')]=id;
    row[fileHeaders.indexOf('FileName')]='Google Drive URL';
    row[fileHeaders.indexOf('MimeType')]='text/uri-list';
    row[fileHeaders.indexOf('FileSize')]=0;
    row[fileHeaders.indexOf('DriveFileID')]='';
    row[fileHeaders.indexOf('DriveUrl')]=url;
    row[fileHeaders.indexOf('UploadedByUserID')]=actor.userId;
    row[fileHeaders.indexOf('CreatedAt')]=now;
    fileSheet.appendRow(row);
  });
  appendAudit_(actor.userId,previous?'SUBMISSION_REVISED':'SUBMISSION_CREATED','Submission',id,{
    assignmentId:a.AssignmentID,submissionType:target.type,revisionNumber:rev,status:status
  },requestId);
  if(typeof notifySubmissionReceived_==='function'){
    try{notifySubmissionReceived_(a,cmGet_('Submissions','SubmissionID',id));}
    catch(notificationError){console.error('SUBMISSION_NOTIFICATION_FAILED');}
  }
  return cmGet_('Submissions','SubmissionID',id);
}
function smIdempotencyHash_(payload){
  var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(payload||{}),Utilities.Charset.UTF_8);
  return bytes.map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');
}
function smFindIdempotency_(actor,action,requestId,payload){
  var key=String(actor.userId)+':'+String(action)+':'+String(requestId);
  var existing=cmRows_('IdempotencyKeys').filter(function(x){return String(x.IdempotencyKey)===key;})[0];
  if(!existing)return null;
  if(String(existing.RequestHash)!==smIdempotencyHash_(payload))throw apiError_('CONFLICT','Request ID was reused with a different payload.');
  try{return JSON.parse(existing.ResponseJson);}catch(e){throw apiError_('CONFLICT','Previous request result is unavailable.');}
}
function smSaveIdempotency_(actor,action,requestId,payload,result){
  var key=String(actor.userId)+':'+String(action)+':'+String(requestId),now=new Date();
  cmSheet_('IdempotencyKeys').appendRow([key,actor.userId,action,smIdempotencyHash_(payload),JSON.stringify(result),now,new Date(now.getTime()+7*24*60*60*1000)]);
}
function handleSubmissionManagementAction_(action,actor,p,requestId){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    if(action==='submission.create'||action==='submission.revise'){
      var previousResult=smFindIdempotency_(actor,action,requestId,p);
      if(previousResult)return previousResult;
      var aid=cmText_(p.assignmentId,100,'assignmentId',true),a=smAssignment_(aid),target=smValidateTarget_(actor,a,p,true);
      var key=smTargetKey_(a,target),latest=smLatest_(aid,key);
      if(action==='submission.create'&&latest)throw apiError_('DUPLICATE','A submission already exists. Use submission.revise.');
      if(action==='submission.revise'&&!latest)throw apiError_('NOT_FOUND','There is no previous submission to revise.');
      var result=smCreateRevision_(actor,a,target,p,latest,requestId);
      var response={submission:result,revisionNumber:Number(result.RevisionNumber)};
      smSaveIdempotency_(actor,action,requestId,p,response);
      return response;
    }
    if(action==='submission.list'){
      var aid2=cmText_(p.assignmentId,100,'assignmentId',true),a2=smAssignment_(aid2),o2=cmGet_('CourseOfferings','OfferingID',a2.OfferingID);
      var staff=Boolean(o2&&cmCanOffering_(actor,o2));
      return cmRows_('Submissions').filter(function(s){return String(s.AssignmentID)===aid2&&(staff||smCanView_(actor,s));})
        .sort(function(x,y){return Number(y.RevisionNumber)-Number(x.RevisionNumber);});
    }
    if(action==='submission.get'){
      var sid=cmText_(p.submissionId,100,'submissionId',true),s=cmGet_('Submissions','SubmissionID',sid);
      if(!s)throw apiError_('NOT_FOUND','Submission not found.');
      if(!smCanView_(actor,s))throw apiError_('FORBIDDEN','Submission access denied.');
      return {submission:s,files:cmRows_('SubmissionFiles').filter(function(f){return String(f.SubmissionID)===sid;})};
    }
    throw apiError_('NOT_IMPLEMENTED','Submission action is not implemented.');
  }finally{lock.releaseLock();}
}
