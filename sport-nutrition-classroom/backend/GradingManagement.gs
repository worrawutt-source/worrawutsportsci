/**
 * SPORT NUTRITION CLASSROOM — Grading and Grade Review
 */
function grCanManage_(actor,submission){
  var a=smAssignment_(submission.AssignmentID),o=cmGet_('CourseOfferings','OfferingID',a.OfferingID);
  if(!o||!cmCanOffering_(actor,o))throw apiError_('FORBIDDEN','Instructor scope is required.');
  return a;
}
function grCanStudent_(actor,submission){
  if(String(submission.SubmissionType)==='INDIVIDUAL')return String(submission.StudentUserID)===String(actor.userId);
  return gmMembers_(submission.GroupID).some(function(m){return String(m.UserID)===String(actor.userId);});
}
function grPublic_(g){return {gradeId:String(g.GradeID),submissionId:String(g.SubmissionID),score:Number(g.Score),feedback:String(g.Feedback||''),gradedByUserId:String(g.GradedByUserID),gradedAt:g.GradedAt,updatedAt:g.UpdatedAt};}
function handleGradingAction_(action,actor,p,requestId){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    if(action==='grade.create'||action==='grade.update'){
      var sid=cmText_(p.submissionId,100,'submissionId',true),s=cmGet_('Submissions','SubmissionID',sid);
      if(!s)throw apiError_('NOT_FOUND','Submission not found.');
      var a=grCanManage_(actor,s),score=Number(p.score);
      if(!isFinite(score)||score<0||score>Number(a.MaxScore))throw apiError_('VALIDATION_ERROR','Score is outside the permitted range.');
      var feedback=cmText_(p.feedback||'',5000,'feedback',false),old=cmRows_('Grades').filter(function(x){return String(x.SubmissionID)===sid;})[0],now=new Date();
      if(action==='grade.create'&&old)throw apiError_('DUPLICATE','A grade already exists. Use grade.update.');
      if(action==='grade.update'&&!old)throw apiError_('NOT_FOUND','Grade not found. Use grade.create first.');
      var gradeId;
      if(!old){
        gradeId=Utilities.getUuid();
        cmSheet_('Grades').appendRow([gradeId,sid,score,feedback,actor.userId,now,now]);
      }else{
        gradeId=String(old.GradeID);
        if(p.reason===undefined||!String(p.reason).trim())throw apiError_('VALIDATION_ERROR','A reason is required when changing a grade.');
        cmSheet_('GradeHistory').appendRow([Utilities.getUuid(),gradeId,Number(old.Score),score,String(old.Feedback||''),feedback,actor.userId,cmText_(p.reason,1000,'reason',true),now]);
        var sh=cmSheet_('Grades'),h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
        sh.getRange(old._row,h.indexOf('Score')+1).setValue(score);
        sh.getRange(old._row,h.indexOf('Feedback')+1).setValue(feedback);
        sh.getRange(old._row,h.indexOf('GradedByUserID')+1).setValue(actor.userId);
        sh.getRange(old._row,h.indexOf('GradedAt')+1).setValue(now);
        sh.getRange(old._row,h.indexOf('UpdatedAt')+1).setValue(now);
      }
      appendAudit_(actor.userId,old?'GRADE_UPDATED':'GRADE_CREATED','Grade',gradeId,{submissionId:sid,score:score},requestId);
      return grPublic_(cmGet_('Grades','GradeID',gradeId));
    }
    if(action==='grade.get'||action==='grade.history'){
      var sid2=cmText_(p.submissionId,100,'submissionId',true),s2=cmGet_('Submissions','SubmissionID',sid2);
      if(!s2)throw apiError_('NOT_FOUND','Submission not found.');
      var a2=smAssignment_(s2.AssignmentID),o2=cmGet_('CourseOfferings','OfferingID',a2.OfferingID);
      var staff=Boolean(o2&&cmCanOffering_(actor,o2)),student=grCanStudent_(actor,s2);
      if(!staff&&!student)throw apiError_('FORBIDDEN','Grade access denied.');
      var grade=cmRows_('Grades').filter(function(x){return String(x.SubmissionID)===sid2;})[0]||null;
      if(action==='grade.get')return grade?grPublic_(grade):null;
      if(!staff)throw apiError_('FORBIDDEN','Only course staff may view grade history.');
      return grade?cmRows_('GradeHistory').filter(function(x){return String(x.GradeID)===String(grade.GradeID);}):[];
    }
    if(action==='gradeReview.create'){
      var gradeId2=cmText_(p.gradeId,100,'gradeId',true),g=cmGet_('Grades','GradeID',gradeId2);
      if(!g)throw apiError_('NOT_FOUND','Grade not found.');
      var s3=cmGet_('Submissions','SubmissionID',g.SubmissionID);
      if(!s3||!grCanStudent_(actor,s3))throw apiError_('FORBIDDEN','Only the student receiving this grade may request a review.');
      if(cmRows_('GradeReviewRequests').some(function(x){return String(x.GradeID)===gradeId2&&String(x.StudentUserID)===String(actor.userId)&&['PENDING','IN_REVIEW'].indexOf(String(x.Status))>=0;}))
        throw apiError_('CONFLICT','An active grade review request already exists.');
      var rid=Utilities.getUuid(),now2=new Date(),requestText=cmText_(p.requestText,3000,'requestText',true);
      cmSheet_('GradeReviewRequests').appendRow([rid,gradeId2,actor.userId,requestText,'PENDING','','',now2,now2]);
      appendAudit_(actor.userId,'GRADE_REVIEW_REQUESTED','GradeReviewRequest',rid,{gradeId:gradeId2},requestId);
      return cmGet_('GradeReviewRequests','ReviewRequestID',rid);
    }
    if(action==='gradeReview.list'){
      var rows=cmRows_('GradeReviewRequests');
      return rows.filter(function(x){
        if(String(x.StudentUserID)===String(actor.userId))return true;
        var g=cmGet_('Grades','GradeID',x.GradeID),s=g&&cmGet_('Submissions','SubmissionID',g.SubmissionID),a=s&&smAssignment_(s.AssignmentID),o=a&&cmGet_('CourseOfferings','OfferingID',a.OfferingID);
        return Boolean(o&&cmCanOffering_(actor,o));
      });
    }
    if(action==='gradeReview.update'){
      var rid2=cmText_(p.reviewRequestId,100,'reviewRequestId',true),rr=cmGet_('GradeReviewRequests','ReviewRequestID',rid2);
      if(!rr)throw apiError_('NOT_FOUND','Grade review request not found.');
      var g2=cmGet_('Grades','GradeID',rr.GradeID),s4=g2&&cmGet_('Submissions','SubmissionID',g2.SubmissionID);
      if(!s4)throw apiError_('NOT_FOUND','Related submission not found.');
      grCanManage_(actor,s4);
      var status=cmText_(p.status,20,'status',true).toUpperCase();
      if(['IN_REVIEW','RESOLVED','REJECTED'].indexOf(status)<0)throw apiError_('VALIDATION_ERROR','Invalid review status.');
      var response=cmText_(p.instructorResponse||'',3000,'instructorResponse',false),sh2=cmSheet_('GradeReviewRequests'),h2=sh2.getRange(1,1,1,sh2.getLastColumn()).getDisplayValues()[0];
      sh2.getRange(rr._row,h2.indexOf('Status')+1).setValue(status);
      sh2.getRange(rr._row,h2.indexOf('InstructorResponse')+1).setValue(response);
      sh2.getRange(rr._row,h2.indexOf('ReviewedByUserID')+1).setValue(actor.userId);
      sh2.getRange(rr._row,h2.indexOf('UpdatedAt')+1).setValue(new Date());
      appendAudit_(actor.userId,'GRADE_REVIEW_UPDATED','GradeReviewRequest',rid2,{status:status},requestId);
      return cmGet_('GradeReviewRequests','ReviewRequestID',rid2);
    }
    throw apiError_('NOT_IMPLEMENTED','Grading action is not implemented.');
  }finally{lock.releaseLock();}
}
