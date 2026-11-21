/**
 * SPORT NUTRITION CLASSROOM — Group Management
 * Implements CourseOffering-scoped student-managed groups.
 * Requires Groups and GroupMembers sheets created by setupSNCFullSchema().
 */
const GM_SCHEMA_ = Object.freeze({
  Groups: ['GroupID','OfferingID','GroupName','CreatedByUserID','MembershipLockedAt','Status','CreatedAt','UpdatedAt'],
  GroupMembers: ['GroupMemberID','GroupID','UserID','MemberRole','JoinedAt','LeftAt','Status']
});
function gmSheet_(name){
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if(!sh)throw apiError_('DATABASE_NOT_READY','Group management schema is not initialized.');
  var h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
  var expected=GM_SCHEMA_[name];
  if(!expected||h.length!==expected.length||!expected.every(function(x,i){return h[i]===x;}))
    throw apiError_('SCHEMA_MISMATCH','Group management table schema does not match.');
  return sh;
}
function gmRows_(name){gmSheet_(name);return rowsAsObjects_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name));}
function gmGet_(name,key,id){return gmRows_(name).filter(function(x){return String(x[key])===String(id);})[0]||null;}
function gmOffering_(id){
  var o=cmGet_('CourseOfferings','OfferingID',id);
  if(!o||String(o.Status).toUpperCase()!=='ACTIVE')throw apiError_('NOT_FOUND','Active course offering not found.');
  return o;
}
function gmEnrolled_(offeringId,userId){
  return cmRows_('Enrollments').some(function(e){
    return String(e.OfferingID)===String(offeringId)&&String(e.UserID)===String(userId)&&String(e.Status).toUpperCase()==='ACTIVE';
  });
}
function gmIsLocked_(g){return Boolean(g.MembershipLockedAt)||String(g.IsMembershipLocked).toUpperCase()==='TRUE';}
function gmMembers_(groupId){
  return gmRows_('GroupMembers').filter(function(m){return String(m.GroupID)===String(groupId)&&String(m.Status).toUpperCase()==='ACTIVE';});
}
function gmCanManage_(actor,offering){
  return cmSystem_(actor,'SYSTEM_ADMIN')||cmCanOffering_(actor,offering);
}
function gmPublicGroup_(g,actor){
  var members=gmMembers_(g.GroupID);
  return {groupId:String(g.GroupID),offeringId:String(g.OfferingID),groupName:String(g.GroupName),
    membershipLocked:Boolean(gmIsLocked_(g)),membershipLockedAt:g.MembershipLockedAt||null,
    memberCount:members.length,isMember:members.some(function(m){return String(m.UserID)===String(actor.userId);}),
    members:members.map(function(m){var u=cmGet_('Users','UserID',m.UserID);return {userId:String(m.UserID),firstName:u?String(u.FirstName):'',lastName:u?String(u.LastName):'',memberRole:String(m.MemberRole)};})};
}
function handleGroupManagementAction_(action,actor,p,requestId){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    if(action==='group.list'){
      var offeringId=cmText_(p.offeringId,100,'offeringId',true),offering=gmOffering_(offeringId);
      if(!gmCanManage_(actor,offering)&&!gmEnrolled_(offeringId,actor.userId))throw apiError_('FORBIDDEN','Not enrolled in this offering.');
      return gmRows_('Groups').filter(function(g){return String(g.OfferingID)===offeringId&&String(g.Status).toUpperCase()==='ACTIVE';})
        .filter(function(g){return gmCanManage_(actor,offering)||gmMembers_(g.GroupID).some(function(m){return String(m.UserID)===String(actor.userId);});})
        .map(function(g){return gmPublicGroup_(g,actor);});
    }
    if(action==='group.create'){
      var oid=cmText_(p.offeringId,100,'offeringId',true),off=gmOffering_(oid);
      if(!gmEnrolled_(oid,actor.userId))throw apiError_('ENROLLMENT_REQUIRED','Active enrollment is required to create a group.');
      var name=cmText_(p.groupName,100,'groupName',true);
      if(gmRows_('GroupMembers').some(function(m){return String(m.UserID)===String(actor.userId)&&String(m.Status).toUpperCase()==='ACTIVE'&&
        (function(){var g=gmGet_('Groups','GroupID',m.GroupID);return g&&String(g.OfferingID)===oid&&String(g.Status).toUpperCase()==='ACTIVE';})();}))
        throw apiError_('CONFLICT','You already belong to a group in this offering.');
      var gid=Utilities.getUuid(),now=new Date();
      gmSheet_('Groups').appendRow([gid,oid,name,actor.userId,'','ACTIVE',now,now]);
      gmSheet_('GroupMembers').appendRow([Utilities.getUuid(),gid,actor.userId,'LEADER',now,'','ACTIVE']);
      appendAudit_(actor.userId,'GROUP_CREATED','Group',gid,{offeringId:oid},requestId);
      return gmPublicGroup_(gmGet_('Groups','GroupID',gid),actor);
    }
    if(action==='group.join'){
      var target=cmText_(p.groupId,100,'groupId',true),g=gmGet_('Groups','GroupID',target);
      if(!g||String(g.Status).toUpperCase()!=='ACTIVE')throw apiError_('NOT_FOUND','Active group not found.');
      if(gmIsLocked_(g))throw apiError_('GROUP_MEMBERSHIP_LOCKED','Group membership is locked after its first submission.');
      if(!gmEnrolled_(g.OfferingID,actor.userId))throw apiError_('ENROLLMENT_REQUIRED','Active enrollment is required.');
      if(gmRows_('GroupMembers').some(function(m){if(String(m.UserID)!==String(actor.userId)||String(m.Status).toUpperCase()!=='ACTIVE')return false;var x=gmGet_('Groups','GroupID',m.GroupID);return x&&String(x.OfferingID)===String(g.OfferingID)&&String(x.Status).toUpperCase()==='ACTIVE';}))
        throw apiError_('CONFLICT','You already belong to a group in this offering.');
      gmSheet_('GroupMembers').appendRow([Utilities.getUuid(),target,actor.userId,'MEMBER',new Date(),'','ACTIVE']);
      appendAudit_(actor.userId,'GROUP_MEMBER_JOINED','Group',target,{},requestId);
      return gmPublicGroup_(gmGet_('Groups','GroupID',target),actor);
    }
    if(action==='group.leave'){
      var gid2=cmText_(p.groupId,100,'groupId',true),group=gmGet_('Groups','GroupID',gid2);
      if(!group||String(group.Status).toUpperCase()!=='ACTIVE')throw apiError_('NOT_FOUND','Active group not found.');
      if(gmIsLocked_(group))throw apiError_('GROUP_MEMBERSHIP_LOCKED','Group membership is locked after its first submission.');
      var member=gmMembers_(gid2).filter(function(m){return String(m.UserID)===String(actor.userId);})[0];
      if(!member)throw apiError_('FORBIDDEN','You are not a member of this group.');
      var members=gmMembers_(gid2),sh=gmSheet_('GroupMembers'),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
      sh.getRange(member._row,headers.indexOf('Status')+1).setValue('LEFT');
      sh.getRange(member._row,headers.indexOf('LeftAt')+1).setValue(new Date());
      if(String(member.MemberRole)==='LEADER'&&members.length>1){
        var next=members.filter(function(m){return String(m.UserID)!==String(actor.userId);})[0];
        sh.getRange(next._row,headers.indexOf('MemberRole')+1).setValue('LEADER');
      }
      appendAudit_(actor.userId,'GROUP_MEMBER_LEFT','Group',gid2,{},requestId);
      return {groupId:gid2,left:true};
    }
    if(action==='group.members'){
      var gid3=cmText_(p.groupId,100,'groupId',true),g3=gmGet_('Groups','GroupID',gid3);
      if(!g3)throw apiError_('NOT_FOUND','Group not found.');
      var o3=gmOffering_(g3.OfferingID);
      if(!gmCanManage_(actor,o3)&&!gmMembers_(gid3).some(function(m){return String(m.UserID)===String(actor.userId);}))
        throw apiError_('FORBIDDEN','Group access denied.');
      return gmPublicGroup_(g3,actor).members;
    }
    if(action==='group.selectRepresentative'){
      var gid4=cmText_(p.groupId,100,'groupId',true),rep=cmText_(p.userId,100,'userId',true),g4=gmGet_('Groups','GroupID',gid4);
      if(!g4)throw apiError_('NOT_FOUND','Group not found.');
      if(gmIsLocked_(g4))throw apiError_('GROUP_MEMBERSHIP_LOCKED','Group membership is locked.');
      if(!gmMembers_(gid4).some(function(m){return String(m.UserID)===rep;}))throw apiError_('VALIDATION_ERROR','Representative must be an active group member.');
      var o4=gmOffering_(g4.OfferingID);
      if(!gmCanManage_(actor,o4)&&!gmMembers_(gid4).some(function(m){return String(m.UserID)===String(actor.userId)&&String(m.MemberRole)==='LEADER';}))
        throw apiError_('FORBIDDEN','Only the group leader or course staff may select a representative.');
      var sh4=gmSheet_('GroupMembers'),h4=sh4.getRange(1,1,1,sh4.getLastColumn()).getDisplayValues()[0];
      gmMembers_(gid4).forEach(function(m){sh4.getRange(m._row,h4.indexOf('MemberRole')+1).setValue(String(m.UserID)===rep?'LEADER':'MEMBER');});
      appendAudit_(actor.userId,'GROUP_REPRESENTATIVE_SELECTED','Group',gid4,{representativeUserId:rep},requestId);
      return gmPublicGroup_(gmGet_('Groups','GroupID',gid4),actor);
    }
    throw apiError_('NOT_IMPLEMENTED','Group management action is not implemented.');
  }finally{lock.releaseLock();}
}
