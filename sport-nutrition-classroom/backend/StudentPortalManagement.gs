/**
 * SPORT NUTRITION CLASSROOM — Student portal read models
 * Student data is derived from authenticated actor; client IDs are filters only.
 */
function handleStudentPortalAction_(action,actor,p){
  if(action==='student.offering.list'){
    var enrolled=cmRows_('Enrollments').filter(function(e){return String(e.UserID)===String(actor.userId)&&String(e.Status).toUpperCase()==='ACTIVE';});
    return enrolled.map(function(e){
      var o=cmGet_('CourseOfferings','OfferingID',e.OfferingID),c=o&&cmGet_('Courses','CourseID',o.CourseID),s=o&&cmGet_('Semesters','SemesterID',o.SemesterID);
      return o&&c&&s&&String(o.Status).toUpperCase()==='ACTIVE'?{offering:o,course:c,semester:s}:null;
    }).filter(Boolean);
  }
  if(action==='student.assignment.list'){
    var offeringId=cmText_(p.offeringId,100,'offeringId',true);
    if(!gmEnrolled_(offeringId,actor.userId))throw apiError_('FORBIDDEN','Active enrollment is required.');
    return cmRows_('Assignments').filter(function(a){return String(a.OfferingID)===offeringId&&String(a.Status).toUpperCase()!=='DELETED';})
      .sort(function(a,b){return new Date(a.Deadline)-new Date(b.Deadline);}).map(function(a){
        var target=String(a.SubmissionType)==='INDIVIDUAL'?{StudentUserID:actor.userId,GroupID:''}:null;
        var latest=target?smLatest_(a.AssignmentID,target):null;
        var groupSubmission=null;
        if(!target){
          var memberships=gmRows_('GroupMembers').filter(function(m){return String(m.UserID)===String(actor.userId)&&String(m.Status).toUpperCase()==='ACTIVE';});
          memberships.forEach(function(m){var g=gmGet_('Groups','GroupID',m.GroupID);if(g&&String(g.OfferingID)===offeringId)groupSubmission=smLatest_(a.AssignmentID,{StudentUserID:'',GroupID:g.GroupID});});
          latest=groupSubmission;
        }
        var grade=latest&&cmRows_('Grades').filter(function(g){return String(g.SubmissionID)===String(latest.SubmissionID);})[0];
        return {assignment:amPublic_(a),submission:latest,grade:grade?grPublic_(grade):null};
      });
  }
  if(action==='student.group.list'){
    var oid=cmText_(p.offeringId,100,'offeringId',true);
    if(!gmEnrolled_(oid,actor.userId))throw apiError_('ENROLLMENT_REQUIRED','Active enrollment is required.');
    return gmRows_('Groups').filter(function(g){return String(g.OfferingID)===oid&&String(g.Status).toUpperCase()==='ACTIVE';})
      .map(function(g){return gmPublicGroup_(g,actor);});
  }
  throw apiError_('NOT_IMPLEMENTED','Student portal action is not implemented.');
}
