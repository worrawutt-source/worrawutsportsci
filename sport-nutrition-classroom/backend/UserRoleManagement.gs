/**
 * SPORT NUTRITION CLASSROOM — User and Role Administration
 * System Admin only. SYSTEM_ADMIN assignment remains break-glass bootstrap only.
 */
function urRequireAdmin_(actor){
  if(!cmSystem_(actor,'SYSTEM_ADMIN'))throw apiError_('FORBIDDEN','System Admin permission is required.');
}
function urPublicUser_(u){
  return {userId:String(u.UserID),studentId:String(u.StudentID||''),firstName:String(u.FirstName||''),lastName:String(u.LastName||''),email:String(u.Email||''),status:String(u.Status||'')};
}
function handleUserRoleAction_(action,actor,p,requestId){
  urRequireAdmin_(actor);
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    if(action==='user.list'){
      var q=cmText_(p.query||'',100,'query',false).toLowerCase();
      var limit=Number(p.limit||100);
      if(!Number.isInteger(limit)||limit<1||limit>200)throw apiError_('VALIDATION_ERROR','limit must be 1 to 200.');
      return cmRows_('Users').filter(function(u){
        if(!q)return true;
        return [u.StudentID,u.FirstName,u.LastName,u.Email,u.UserID].some(function(v){return String(v||'').toLowerCase().indexOf(q)>=0;});
      }).sort(function(a,b){return String(a.StudentID).localeCompare(String(b.StudentID));}).slice(0,limit).map(function(u){
        var roles=getEffectiveRolesForUser_(u.UserID);
        return Object.assign(urPublicUser_(u),{roles:roles});
      });
    }
    if(action==='user.status'){
      var userId=cmText_(p.userId,100,'userId',true),target=cmGet_('Users','UserID',userId);
      if(!target)throw apiError_('NOT_FOUND','User not found.');
      var status=cmText_(p.status,20,'status',true).toUpperCase();
      if(['ACTIVE','INACTIVE'].indexOf(status)<0)throw apiError_('VALIDATION_ERROR','status must be ACTIVE or INACTIVE.');
      if(status==='INACTIVE'&&String(actor.userId)===userId)throw apiError_('CONFLICT','You cannot deactivate your own account.');
      if(status==='INACTIVE'){
        var isSystemAdmin=cmRows_('UserRoles').some(function(r){return String(r.UserID)===userId&&String(r.Role)==='SYSTEM_ADMIN'&&String(r.ScopeType)==='SYSTEM'&&String(r.Status).toUpperCase()==='ACTIVE';});
        if(isSystemAdmin){
          var otherAdmins=cmRows_('UserRoles').filter(function(r){
            if(String(r.Role)!=='SYSTEM_ADMIN'||String(r.ScopeType)!=='SYSTEM'||String(r.Status).toUpperCase()!=='ACTIVE'||String(r.UserID)===userId)return false;
            var u=cmGet_('Users','UserID',r.UserID);return Boolean(u&&String(u.Status).toUpperCase()==='ACTIVE');
          });
          if(!otherAdmins.length)throw apiError_('CONFLICT','The last active System Admin cannot be deactivated.');
        }
      }
      var userSheet=cmSheet_('Users'),userHeaders=userSheet.getRange(1,1,1,userSheet.getLastColumn()).getDisplayValues()[0];
      var statusCol=userHeaders.indexOf('Status')+1,updatedCol=userHeaders.indexOf('UpdatedAt')+1;
      if(!statusCol||!updatedCol)throw apiError_('SCHEMA_MISMATCH','Users table is missing Status or UpdatedAt.');
      var oldStatus=target.Status,oldUpdatedAt=target.UpdatedAt,changedAt=new Date();
      try{
        userSheet.getRange(target._row,statusCol).setValue(status);
        userSheet.getRange(target._row,updatedCol).setValue(changedAt);
        appendAudit_(actor.userId,status==='ACTIVE'?'USER_ACTIVATED':'USER_DEACTIVATED','User',userId,{studentId:String(target.StudentID),status:status},requestId);
      }catch(writeError){
        try{
          userSheet.getRange(target._row,statusCol).setValue(oldStatus);
          userSheet.getRange(target._row,updatedCol).setValue(oldUpdatedAt);
        }catch(rollbackError){console.error('USER_STATUS_ROLLBACK_FAILED');}
        throw apiError_('USER_STATUS_UPDATE_FAILED','Account status update failed; automatic rollback was attempted.');
      }
      return urPublicUser_(cmGet_('Users','UserID',userId));
    }
    if(action==='role.list'){
      return cmRows_('UserRoles').map(function(r){
        var u=cmGet_('Users','UserID',r.UserID)||{};
        return {userRoleId:String(r.UserRoleID),userId:String(r.UserID),studentId:String(u.StudentID||''),displayName:(String(u.FirstName||'')+' '+String(u.LastName||'')).trim(),role:String(r.Role),scopeType:String(r.ScopeType),scopeId:String(r.ScopeID||''),status:String(r.Status),createdAt:r.CreatedAt,createdByUserId:String(r.CreatedByUserID||'')};
      }).sort(function(a,b){return String(a.studentId).localeCompare(String(b.studentId));});
    }
    if(action==='role.grant'){
      var studentId=normalizeStudentId_(p.studentId),user=cmRows_('Users').filter(function(u){return String(u.StudentID)===studentId&&String(u.Status).toUpperCase()==='ACTIVE';})[0];
      if(!user)throw apiError_('NOT_FOUND','Active user not found.');
      var role=cmText_(p.role,40,'role',true).toUpperCase();
      if(role!=='COURSE_COORDINATOR')throw apiError_('VALIDATION_ERROR','Only COURSE_COORDINATOR can be granted here. SYSTEM_ADMIN must use the bootstrap procedure; INSTRUCTOR is assigned to an offering.');
      var scopeType=cmText_(p.scopeType,20,'scopeType',true).toUpperCase(),scopeId='';
      if(scopeType==='COURSE'){
        scopeId=cmText_(p.scopeId,100,'scopeId',true);
        if(!cmGet_('Courses','CourseID',scopeId))throw apiError_('NOT_FOUND','Course scope not found.');
      }else if(scopeType==='SEMESTER'){
        scopeId=cmText_(p.scopeId,100,'scopeId',true);
        if(!cmGet_('Semesters','SemesterID',scopeId))throw apiError_('NOT_FOUND','Semester scope not found.');
      }else if(scopeType==='SYSTEM'){scopeId='*';}
      else throw apiError_('VALIDATION_ERROR','scopeType must be COURSE, SEMESTER, or SYSTEM.');
      var duplicate=cmRows_('UserRoles').some(function(r){return String(r.UserID)===String(user.UserID)&&String(r.Role)===role&&String(r.ScopeType)===scopeType&&String(r.ScopeID)===scopeId&&String(r.Status).toUpperCase()==='ACTIVE';});
      if(duplicate)throw apiError_('DUPLICATE','This active role scope already exists.');
      var now=new Date(),id=Utilities.getUuid();
      cmSheet_('UserRoles').appendRow([id,user.UserID,role,scopeType,scopeId,'ACTIVE',now,now,actor.userId]);
      appendAudit_(actor.userId,'USER_ROLE_GRANTED','UserRole',id,{targetUserId:String(user.UserID),role:role,scopeType:scopeType,scopeId:scopeId},requestId);
      return {userRoleId:id,userId:String(user.UserID),role:role,scopeType:scopeType,scopeId:scopeId,status:'ACTIVE'};
    }
    if(action==='role.revoke'){
      var roleId=cmText_(p.userRoleId,100,'userRoleId',true),record=cmGet_('UserRoles','UserRoleID',roleId);
      if(!record)throw apiError_('NOT_FOUND','User role record not found.');
      if(String(record.Role)!=='COURSE_COORDINATOR')throw apiError_('FORBIDDEN','Only COURSE_COORDINATOR grants can be revoked here.');
      if(String(record.Status).toUpperCase()!=='ACTIVE')throw apiError_('CONFLICT','Role is not active.');
      var sh=cmSheet_('UserRoles'),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
      sh.getRange(record._row,headers.indexOf('Status')+1).setValue('INACTIVE');
      sh.getRange(record._row,headers.indexOf('UpdatedAt')+1).setValue(new Date());
      appendAudit_(actor.userId,'USER_ROLE_REVOKED','UserRole',roleId,{targetUserId:String(record.UserID),role:String(record.Role),scopeType:String(record.ScopeType),scopeId:String(record.ScopeID||'')},requestId);
      return {userRoleId:roleId,status:'INACTIVE'};
    }
    throw apiError_('NOT_IMPLEMENTED','User/role action is not implemented.');
  }finally{lock.releaseLock();}
}
