/**
 * SPORT NUTRITION CLASSROOM — LINE Notifications and delivery log
 * Requires LINE_CHANNEL_ACCESS_TOKEN in Script Properties.
 */
function ntSheet_(){var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('NotificationLogs');if(!sh)throw apiError_('DATABASE_NOT_READY','Notification log table is unavailable.');return sh;}
function ntLog_(userId,eventType,entityType,entityId,message,status,errorCode){
  var sh=ntSheet_();sh.appendRow([Utilities.getUuid(),userId,eventType,entityType,entityId,message,status,status==='SENT'?new Date():'',errorCode||'',new Date()]);
}
function ntSend_(userId,message,eventType,entityType,entityId){
  var account=cmRows_('LINEAccounts').filter(function(x){return String(x.UserID)===String(userId)&&String(x.Provider)==='LINE'&&String(x.Status).toUpperCase()==='ACTIVE';})[0];
  if(!account){ntLog_(userId,eventType,entityType,entityId,message,'FAILED','LINE_ACCOUNT_NOT_LINKED');return {sent:false,errorCode:'LINE_ACCOUNT_NOT_LINKED'};}
  var token=PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  if(!token){ntLog_(userId,eventType,entityType,entityId,message,'FAILED','LINE_TOKEN_NOT_CONFIGURED');return {sent:false,errorCode:'LINE_TOKEN_NOT_CONFIGURED'};}
  var response;
  try{
    response=UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push',{
      method:'post',contentType:'application/json',
      headers:{Authorization:'Bearer '+token},
      payload:JSON.stringify({to:String(account.ProviderSubject),messages:[{type:'text',text:String(message).slice(0,5000)}]}),
      muteHttpExceptions:true
    });
    var code=response.getResponseCode();
    if(code<200||code>=300){ntLog_(userId,eventType,entityType,entityId,message,'FAILED','LINE_HTTP_'+code);return {sent:false,errorCode:'LINE_HTTP_'+code};}
    ntLog_(userId,eventType,entityType,entityId,message,'SENT','');return {sent:true};
  }catch(e){ntLog_(userId,eventType,entityType,entityId,message,'FAILED','LINE_TRANSPORT_ERROR');return {sent:false,errorCode:'LINE_TRANSPORT_ERROR'};}
}
function ntStaffForOffering_(offeringId){
  return cmRows_('CourseInstructors').filter(function(x){return String(x.OfferingID)===String(offeringId)&&String(x.Status).toUpperCase()==='ACTIVE';}).map(function(x){return String(x.InstructorUserID);});
}
function ntCanManage_(actor,offering){
  if(!cmCanOffering_(actor,offering))throw apiError_('FORBIDDEN','Course staff permission is required.');
}
function handleNotificationAction_(action,actor,p,requestId){
  if(action==='notification.send'){
    var uid=cmText_(p.userId,100,'userId',true),message=cmText_(p.message,5000,'message',true);
    var entityType=cmText_(p.relatedEntityType||'Manual',50,'relatedEntityType',false),entityId=cmText_(p.relatedEntityId||requestId,100,'relatedEntityId',false);
    var offeringId=cmText_(p.offeringId,100,'offeringId',true),off=gmOffering_(offeringId);ntCanManage_(actor,off);
    var result=ntSend_(uid,message,'MANUAL',entityType,entityId);
    appendAudit_(actor.userId,'NOTIFICATION_SENT','Notification',entityId,{recipientUserId:uid,sent:result.sent},requestId);
    return result;
  }
  if(action==='notification.log'){
    var rows=cmRows_('NotificationLogs');
    return rows.filter(function(n){
      if(cmSystem_(actor,'SYSTEM_ADMIN'))return true;
      if(String(n.UserID)===String(actor.userId))return true;
      var offeringId=n.RelatedEntityType==='Assignment'?(cmGet_('Assignments','AssignmentID',n.RelatedEntityID)||{}).OfferingID:null;
      var off=offeringId&&cmGet_('CourseOfferings','OfferingID',offeringId);
      return Boolean(off&&cmCanOffering_(actor,off));
    });
  }
  if(action==='notification.retry'){
    var nid=cmText_(p.notificationId,100,'notificationId',true),n=cmGet_('NotificationLogs','NotificationID',nid);
    if(!n||String(n.Status)!=='FAILED')throw apiError_('NOT_FOUND','Failed notification not found.');
    if(!cmSystem_(actor,'SYSTEM_ADMIN'))throw apiError_('FORBIDDEN','System Admin permission is required to retry.');
    return ntSend_(n.UserID,n.Message,n.EventType,n.RelatedEntityType,n.RelatedEntityID);
  }
  throw apiError_('NOT_IMPLEMENTED','Notification action is not implemented.');
}
function notifyAssignmentOpened_(assignment){
  var offering=cmGet_('CourseOfferings','OfferingID',assignment.OfferingID);
  if(!offering)return;
  var users=cmRows_('Enrollments').filter(function(e){return String(e.OfferingID)===String(assignment.OfferingID)&&String(e.Status).toUpperCase()==='ACTIVE';}).map(function(e){return String(e.UserID);});
  var message='มีการเปิดรับงาน: '+String(assignment.Title)+' กำหนดส่ง '+new Date(assignment.Deadline).toLocaleString('th-TH');
  users.forEach(function(uid){ntSend_(uid,message,'ASSIGNMENT_OPENED','Assignment',assignment.AssignmentID);});
}
function notifySubmissionReceived_(assignment,submission){
  var message='มีการส่งงาน: '+String(assignment.Title)+' ('+String(submission.SubmissionStatus)+')';
  ntStaffForOffering_(assignment.OfferingID).forEach(function(uid){ntSend_(uid,message,'SUBMISSION_RECEIVED','Assignment',assignment.AssignmentID);});
}
function runDeadlineReminderNotifications(){
  var now=new Date(),limit=new Date(now.getTime()+24*60*60*1000),assignments=cmRows_('Assignments').filter(function(a){
    var d=new Date(a.Deadline);return String(a.Status)==='OPEN'&&d>now&&d<=limit;
  });
  var sent=0,skipped=0;
  assignments.forEach(function(a){
    var enrolled=cmRows_('Enrollments').filter(function(e){return String(e.OfferingID)===String(a.OfferingID)&&String(e.Status).toUpperCase()==='ACTIVE';});
    if(String(a.SubmissionType)==='INDIVIDUAL'){
      enrolled.forEach(function(e){
        var exists=cmRows_('Submissions').some(function(s){return String(s.AssignmentID)===String(a.AssignmentID)&&String(s.StudentUserID)===String(e.UserID)&&!s.PreviousSubmissionID;});
        var duplicate=cmRows_('NotificationLogs').some(function(n){return String(n.UserID)===String(e.UserID)&&String(n.EventType)==='DEADLINE_24H'&&String(n.RelatedEntityID)===String(a.AssignmentID)&&String(n.Status)==='SENT';});
        if(!exists&&!duplicate){var r=ntSend_(e.UserID,'เตือน: งาน '+a.Title+' ใกล้ครบกำหนดภายใน 24 ชั่วโมง','DEADLINE_24H','Assignment',a.AssignmentID);if(r.sent)sent++;else skipped++;}
      });
    }else{
      var groups=gmRows_('Groups').filter(function(g){return String(g.OfferingID)===String(a.OfferingID)&&String(g.Status).toUpperCase()==='ACTIVE';});
      groups.forEach(function(g){
        var exists=cmRows_('Submissions').some(function(s){return String(s.AssignmentID)===String(a.AssignmentID)&&String(s.GroupID)===String(g.GroupID)&&!s.PreviousSubmissionID;});
        var members=gmMembers_(g.GroupID);
        var duplicate=cmRows_('NotificationLogs').some(function(n){return String(n.EventType)==='DEADLINE_24H'&&String(n.RelatedEntityID)===String(a.AssignmentID+'|'+g.GroupID)&&String(n.Status)==='SENT';});
        if(!exists&&!duplicate)members.forEach(function(m){var r=ntSend_(m.UserID,'เตือน: งานกลุ่ม '+a.Title+' ใกล้ครบกำหนดภายใน 24 ชั่วโมง','DEADLINE_24H','Assignment',a.AssignmentID+'|'+g.GroupID);if(r.sent)sent++;else skipped++;});
      });
    }
  });
  return {success:true,assignmentsChecked:assignments.length,sent:sent,skipped:skipped};
}
function installDeadlineReminderTrigger(){
  var triggers=ScriptApp.getProjectTriggers();
  triggers.filter(function(t){return t.getHandlerFunction()==='runDeadlineReminderNotifications';}).forEach(function(t){ScriptApp.deleteTrigger(t);});
  ScriptApp.newTrigger('runDeadlineReminderNotifications').timeBased().everyHours(1).create();
  return {success:true,handler:'runDeadlineReminderNotifications',frequency:'EVERY_HOUR'};
}
