function assertTaskGroupAccess_(ctx,groupId){assertGroupAccess_(ctx,groupId);if(ctx.user.ROLE_ID===ROLE.STUDENT)return;}
function apiGetGroupTasks(token,groupId){
  const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR,ROLE.STUDENT]);groupId=String(groupId||'');assertTaskGroupAccess_(ctx,groupId);
  const tasks=readObjectsFresh_('GROUP_TASKS').filter(t=>String(t.GROUP_ID)===groupId&&t.STATUS!=='DELETED').sort((a,b)=>new Date(a.DUE_DATE||'2999-12-31')-new Date(b.DUE_DATE||'2999-12-31'));
  const comments=readObjectsFresh_('TASK_COMMENTS').filter(c=>String(c.GROUP_ID)===groupId&&c.STATUS==='ACTIVE');
  const roster=readObjectsFresh_('STUDENTS');const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===groupId&&m.STATUS==='ACTIVE').map(m=>{const st=roster.find(x=>String(x.STUDENT_ID)===String(m.STUDENT_ID))||{};return {userId:m.USER_ID,studentId:m.STUDENT_ID,name:st.FULL_NAME||m.STUDENT_ID};});
  return sanitizeForClient_({tasks:tasks.map(t=>({taskId:t.TASK_ID,groupId:t.GROUP_ID,weekNo:t.WEEK_NO,title:t.TASK_TITLE,detail:t.TASK_DETAIL,assignedToUserId:t.ASSIGNED_TO_USER_ID,status:t.STATUS,priority:t.PRIORITY,dueDate:t.DUE_DATE?formatDateOnly_(t.DUE_DATE):'',createdBy:t.CREATED_BY,createdAt:t.CREATED_AT,updatedAt:t.UPDATED_AT,completedAt:t.COMPLETED_AT,comments:comments.filter(c=>String(c.TASK_ID)===String(t.TASK_ID)).map(c=>({commentId:c.COMMENT_ID,comment:c.COMMENT,createdBy:c.CREATED_BY,createdAt:c.CREATED_AT}))})),members,canManage:ctx.user.ROLE_ID===ROLE.ADMIN||ctx.user.ROLE_ID===ROLE.ADVISOR});
}
function apiCreateGroupTask(token,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR]);payload=payload||{};const groupId=String(payload.groupId||'');assertGroupAccess_(ctx,groupId);if(!readObjectsFresh_('RESEARCH_GROUPS').some(g=>String(g.GROUP_ID)===groupId&&g.STATUS==='ACTIVE'))throw new Error('ไม่พบกลุ่มวิจัยที่ใช้งานอยู่');
  const title=String(payload.title||'').trim();if(title.length<3||title.length>180)throw new Error('ชื่องานต้องมี 3–180 ตัวอักษร');const weekNo=payload.weekNo===''||payload.weekNo===undefined? '':Number(payload.weekNo);if(weekNo!==''&&(!Number.isInteger(weekNo)||weekNo<1||weekNo>15))throw new Error('สัปดาห์ของงานต้องอยู่ระหว่าง 1–15');
  const due=payload.dueDate?new Date(payload.dueDate):'';if(due&&isNaN(due.getTime()))throw new Error('วันครบกำหนดไม่ถูกต้อง');
  const priority=['LOW','NORMAL','HIGH','URGENT'].includes(String(payload.priority))?String(payload.priority):'NORMAL';const assignee=String(payload.assignedToUserId||'');if(assignee&&!readObjectsFresh_('GROUP_MEMBERS').some(m=>String(m.GROUP_ID)===groupId&&String(m.USER_ID)===assignee&&m.STATUS==='ACTIVE'))throw new Error('ผู้รับผิดชอบต้องเป็นสมาชิกที่ใช้งานอยู่ในกลุ่ม');
  const id=Utilities.getUuid();appendObject_('GROUP_TASKS',{TASK_ID:id,GROUP_ID:groupId,WEEK_NO:weekNo,TASK_TITLE:title,TASK_DETAIL:String(payload.detail||'').slice(0,5000),ASSIGNED_TO_USER_ID:assignee,STATUS:'OPEN',CREATED_BY:ctx.user.USER_ID,CREATED_AT:new Date(),UPDATED_AT:new Date(),PRIORITY:priority,DUE_DATE:due,COMPLETED_AT:''});
  logSystem_('GROUP_TASK_CREATED','GROUP_TASK',id,{groupId,priority,dueDate:due?due.toISOString():''},ctx.user.USER_ID);
  enqueueGroupNotification_(groupId,'TASK_ASSIGNED','มีงานใหม่ในกลุ่ม',title,'GROUP_TASK',id);
  return {ok:true,taskId:id,message:'สร้างงานในกลุ่มแล้ว'};
}
function apiUpdateGroupTask(token,taskId,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR,ROLE.STUDENT]);payload=payload||{};const r=readObjectsFresh_('GROUP_TASKS').find(x=>String(x.TASK_ID)===String(taskId));if(!r)throw new Error('ไม่พบงาน');assertTaskGroupAccess_(ctx,r.GROUP_ID);
  const oldStatus=String(r.STATUS||'OPEN'),oldAssignee=String(r.ASSIGNED_TO_USER_ID||'');const status=String(payload.status||r.STATUS);if(!['OPEN','IN_PROGRESS','BLOCKED','DONE','CANCELLED'].includes(status))throw new Error('สถานะงานไม่ถูกต้อง');
  if(ctx.user.ROLE_ID===ROLE.STUDENT && !['IN_PROGRESS','BLOCKED','DONE'].includes(status))throw new Error('นักศึกษาเปลี่ยนได้เฉพาะสถานะความคืบหน้าของงาน');
  const sh=sheet_('GROUP_TASKS');const headers=SCHEMA.GROUP_TASKS;const set=(k,v)=>sh.getRange(r._row,headers.indexOf(k)+1).setValue(v);
  if(ctx.user.ROLE_ID!==ROLE.STUDENT){if(payload.title!==undefined){const title=String(payload.title).trim();if(title.length<3||title.length>180)throw new Error('ชื่องานต้องมี 3–180 ตัวอักษร');set('TASK_TITLE',title);}if(payload.detail!==undefined)set('TASK_DETAIL',String(payload.detail).slice(0,5000));if(payload.dueDate!==undefined){const d=payload.dueDate?new Date(payload.dueDate):'';if(d&&isNaN(d.getTime()))throw new Error('วันครบกำหนดไม่ถูกต้อง');set('DUE_DATE',d);}if(payload.priority!==undefined){if(!['LOW','NORMAL','HIGH','URGENT'].includes(String(payload.priority)))throw new Error('ระดับความสำคัญไม่ถูกต้อง');set('PRIORITY',payload.priority);}if(payload.assignedToUserId!==undefined){const assignee=String(payload.assignedToUserId||'');if(assignee&&!readObjectsFresh_('GROUP_MEMBERS').some(m=>String(m.GROUP_ID)===String(r.GROUP_ID)&&String(m.USER_ID)===assignee&&m.STATUS==='ACTIVE'))throw new Error('ผู้รับผิดชอบต้องเป็นสมาชิกที่ใช้งานอยู่ในกลุ่ม');set('ASSIGNED_TO_USER_ID',assignee);}}
  set('STATUS',status);set('UPDATED_AT',new Date());set('COMPLETED_AT',status==='DONE'?new Date():'');
  logSystem_('GROUP_TASK_UPDATED','GROUP_TASK',taskId,{beforeStatus:oldStatus,afterStatus:status,actorRole:ctx.user.ROLE_ID},ctx.user.USER_ID);const eventStamp=String(taskId)+':'+new Date().getTime();if(status!==oldStatus)enqueueGroupNotification_(r.GROUP_ID,'TASK_STATUS_'+status,'อัปเดตสถานะงาน',String(payload.title||r.TASK_TITLE)+' · '+status,'GROUP_TASK',eventStamp);else if(payload.assignedToUserId!==undefined&&String(payload.assignedToUserId||'')!==oldAssignee)enqueueGroupNotification_(r.GROUP_ID,'TASK_REASSIGNED','เปลี่ยนผู้รับผิดชอบงาน',String(payload.title||r.TASK_TITLE)+' · มีการเปลี่ยนผู้รับผิดชอบ','GROUP_TASK',eventStamp);else enqueueGroupNotification_(r.GROUP_ID,'TASK_UPDATED','ปรับปรุงรายละเอียดงาน',String(payload.title||r.TASK_TITLE),'GROUP_TASK',eventStamp);return {ok:true,message:'ปรับปรุงงานแล้ว'};
}
function apiAddTaskComment(token,taskId,comment){
  const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR,ROLE.STUDENT]);const r=readObjectsFresh_('GROUP_TASKS').find(x=>String(x.TASK_ID)===String(taskId));if(!r)throw new Error('ไม่พบงาน');assertTaskGroupAccess_(ctx,r.GROUP_ID);const body=String(comment||'').trim();if(body.length<2||body.length>3000)throw new Error('ข้อความต้องมี 2–3,000 ตัวอักษร');
  appendObject_('TASK_COMMENTS',{COMMENT_ID:Utilities.getUuid(),TASK_ID:taskId,GROUP_ID:r.GROUP_ID,COMMENT:body,CREATED_BY:ctx.user.USER_ID,CREATED_AT:new Date(),STATUS:'ACTIVE'});return {ok:true,message:'เพิ่มความคิดเห็นแล้ว'};
}
function enqueueGroupNotification_(groupId,type,title,message,relatedType,relatedId){
  phase2EnsureSchemas_();const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===String(groupId)&&m.STATUS==='ACTIVE');const users=readObjectsFresh_('SYS_USERS');
  const recipientIds=[];members.forEach(m=>{let userId=String(m.USER_ID||'');if(!userId){const linked=users.find(u=>u.ROLE_ID===ROLE.STUDENT&&String(u.STUDENT_ID)===String(m.STUDENT_ID)&&u.STATUS==='ACTIVE');if(linked)userId=String(linked.USER_ID);}if(userId)recipientIds.push(userId);});readObjectsFresh_('ADVISOR_ASSIGNMENTS').filter(a=>String(a.GROUP_ID)===String(groupId)&&a.STATUS==='APPROVED').forEach(a=>recipientIds.push(String(a.ADVISOR_USER_ID)));
  const existingNotifications=readObjectsFresh_('NOTIFICATIONS');[...new Set(recipientIds)].forEach(userId=>{const u=users.find(x=>String(x.USER_ID)===userId);if(!u)return;const key=[type,relatedId,u.USER_ID].join(':');if(existingNotifications.some(n=>String(n.NOTIFICATION_ID)===key))return;
    appendObject_('NOTIFICATIONS',{NOTIFICATION_ID:key,USER_ID:u.USER_ID,GROUP_ID:groupId,TYPE:type,TITLE:title,MESSAGE:message,RELATED_TYPE:relatedType,RELATED_ID:relatedId,IS_READ:'FALSE',CREATED_AT:new Date(),READ_AT:''});
    if(u.EMAIL)appendObject_('NOTIFICATION_QUEUE',{QUEUE_ID:Utilities.getUuid(),EVENT_KEY:key,RECIPIENT_EMAIL:u.EMAIL,RECIPIENT_USER_ID:u.USER_ID,SUBJECT:title,BODY:message,STATUS:'PENDING',ATTEMPTS:0,NEXT_ATTEMPT_AT:new Date(),LEASE_UNTIL:'',LAST_ERROR:'',CREATED_AT:new Date(),SENT_AT:''});
  });
}
function apiGetMyNotifications(token){const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR,ROLE.STUDENT]);return sanitizeForClient_(readObjectsFresh_('NOTIFICATIONS').filter(n=>String(n.USER_ID)===String(ctx.user.USER_ID)).sort((a,b)=>new Date(b.CREATED_AT)-new Date(a.CREATED_AT)).slice(0,100).map(n=>{delete n._row;return n;}));}
function apiMarkNotificationRead(token,id){const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR,ROLE.STUDENT]);const r=readObjectsFresh_('NOTIFICATIONS').find(n=>String(n.NOTIFICATION_ID)===String(id)&&String(n.USER_ID)===String(ctx.user.USER_ID));if(!r)throw new Error('ไม่พบการแจ้งเตือน');const sh=sheet_('NOTIFICATIONS');sh.getRange(r._row,9).setValue('TRUE');sh.getRange(r._row,10).setValue(new Date());return {ok:true};}
function processNotificationQueue_(){
  phase2EnsureSchemas_();const lock=LockService.getScriptLock();const queue=readObjectsFresh_('NOTIFICATION_QUEUE');const now=new Date();
  const candidates=queue.filter(q=>q.STATUS==='PENDING'||(q.STATUS==='PROCESSING'&&q.LEASE_UNTIL&&new Date(q.LEASE_UNTIL)<now)|| (q.STATUS==='RETRY'&&(!q.NEXT_ATTEMPT_AT||new Date(q.NEXT_ATTEMPT_AT)<=now))).slice(0,20);
  if(!candidates.length)return;
  const remaining=MailApp.getRemainingDailyQuota();if(remaining<1)return;
  if(remaining<candidates.length){processNotificationDigest_(candidates,remaining,lock);return;}
  for(const q of candidates){
    let claimed=false;lock.waitLock(10000);try{const current=readObjectsFresh_('NOTIFICATION_QUEUE').find(x=>x.QUEUE_ID===q.QUEUE_ID);if(current&&(current.STATUS==='PENDING'||current.STATUS==='RETRY'||(current.STATUS==='PROCESSING'&&new Date(current.LEASE_UNTIL)<now))){const sh=sheet_('NOTIFICATION_QUEUE');sh.getRange(current._row,7).setValue('PROCESSING');sh.getRange(current._row,10).setValue(new Date(now.getTime()+5*60*1000));claimed=true;}}finally{lock.releaseLock();}
    if(!claimed)continue;
    try{if(MailApp.getRemainingDailyQuota()<1)throw new Error('DAILY_QUOTA_EXHAUSTED');MailApp.sendEmail({to:q.RECIPIENT_EMAIL,subject:q.SUBJECT,body:q.BODY});updateNotificationQueue_(q.QUEUE_ID,'SENT','',true);}
    catch(e){const attempts=Number(q.ATTEMPTS||0)+1;const status=String(e.message||e).includes('DAILY_QUOTA')?'RETRY':(attempts>=5?'FAILED':'RETRY');updateNotificationQueue_(q.QUEUE_ID,status,String(e.message||e),false,attempts);}
  }
}
function processNotificationDigest_(candidates,quota,lock){
  const byRecipient=new Map();candidates.forEach(q=>{const key=String(q.RECIPIENT_EMAIL||'').trim().toLowerCase();if(!key)return;if(!byRecipient.has(key))byRecipient.set(key,[]);byRecipient.get(key).push(q);});
  let sentRecipients=0;const now=new Date();
  for(const [email,items] of byRecipient){if(sentRecipients>=quota)break;const claimed=[];lock.waitLock(10000);try{const currentRows=readObjectsFresh_('NOTIFICATION_QUEUE');items.forEach(q=>{const current=currentRows.find(x=>x.QUEUE_ID===q.QUEUE_ID);if(current&&(current.STATUS==='PENDING'||current.STATUS==='RETRY'||(current.STATUS==='PROCESSING'&&current.LEASE_UNTIL&&new Date(current.LEASE_UNTIL)<now))){const sh=sheet_('NOTIFICATION_QUEUE');sh.getRange(current._row,7).setValue('PROCESSING');sh.getRange(current._row,10).setValue(new Date(now.getTime()+5*60*1000));claimed.push(current);}});}finally{lock.releaseLock();}
    if(!claimed.length)continue;
    const body=['มีการแจ้งเตือนจากระบบ SPORT SCIENCE RESEARCH LAB จำนวน '+claimed.length+' รายการ','',...claimed.map((q,i)=>(i+1)+'. '+q.SUBJECT+'\n'+q.BODY)].join('\n\n');
    try{MailApp.sendEmail({to:email,subject:'สรุปการแจ้งเตือน SPORT SCIENCE RESEARCH LAB ('+claimed.length+' รายการ)',body});claimed.forEach(q=>updateNotificationQueue_(q.QUEUE_ID,'SENT','DIGEST_SENT',true));sentRecipients++;}
    catch(e){claimed.forEach(q=>{const attempts=Number(q.ATTEMPTS||0)+1;const status=String(e.message||e).includes('DAILY_QUOTA')?'RETRY':(attempts>=5?'FAILED':'RETRY');updateNotificationQueue_(q.QUEUE_ID,status,String(e.message||e),false,attempts);});if(String(e.message||e).includes('DAILY_QUOTA'))break;}
  }
}
function updateNotificationQueue_(id,status,error,sent,attempts){const r=readObjectsFresh_('NOTIFICATION_QUEUE').find(x=>x.QUEUE_ID===id);if(!r)return;const sh=sheet_('NOTIFICATION_QUEUE');sh.getRange(r._row,7).setValue(status);sh.getRange(r._row,8).setValue(attempts===undefined?Number(r.ATTEMPTS||0)+1:attempts);sh.getRange(r._row,9).setValue(status==='RETRY'?new Date(Date.now()+30*60*1000):'');sh.getRange(r._row,10).setValue('');sh.getRange(r._row,11).setValue(error);if(sent)sh.getRange(r._row,13).setValue(new Date());appendObject_('NOTIFICATION_LOG',{LOG_ID:Utilities.getUuid(),QUEUE_ID:id,EVENT_KEY:r.EVENT_KEY,STATUS:status,DETAILS:error,CREATED_AT:new Date()});}
function apiAdminInstallNotificationTrigger(token){const ctx=requireSession_(token,[ROLE.ADMIN]);if(String(getConfigValue_('ENVIRONMENT','')).toUpperCase()!=='TEST')throw new Error('Notification trigger installation is restricted to the TEST environment.');const lock=LockService.getScriptLock();lock.waitLock(30000);try{const triggers=ScriptApp.getProjectTriggers();if(!triggers.some(t=>t.getHandlerFunction()==='processNotificationQueue_'))ScriptApp.newTrigger('processNotificationQueue_').timeBased().everyMinutes(15).create();}finally{lock.releaseLock();}logSystem_('NOTIFICATION_TRIGGER_INSTALLED','SYSTEM','NOTIFICATION_QUEUE',{},ctx.user.USER_ID);return {ok:true,message:'ติดตั้ง Trigger แจ้งเตือนทุก 15 นาทีแล้ว (ไม่เปลี่ยนสถานะเปิด/ปิดสัปดาห์อัตโนมัติ)'};}
function apiAdminListGroupTasks(token){const ctx=requireSession_(token,[ROLE.ADMIN]);const groups=readObjectsFresh_('RESEARCH_GROUPS').filter(g=>g.STATUS==='ACTIVE');const map=new Map(groups.map(g=>[String(g.GROUP_ID),g]));return sanitizeForClient_(readObjectsFresh_('GROUP_TASKS').filter(t=>map.has(String(t.GROUP_ID))&&t.STATUS!=='DELETED').map(t=>({taskId:t.TASK_ID,groupId:t.GROUP_ID,groupName:map.get(String(t.GROUP_ID)).GROUP_NAME,title:t.TASK_TITLE,detail:t.TASK_DETAIL,status:t.STATUS,priority:t.PRIORITY,dueDate:t.DUE_DATE?formatDateOnly_(t.DUE_DATE):'',assignedToUserId:t.ASSIGNED_TO_USER_ID})));}
function apiAdminGetEarlyWarnings(token){const ctx=requireSession_(token,[ROLE.ADMIN]);return sanitizeForClient_(readObjectsFresh_('EARLY_WARNING_FLAGS').sort((a,b)=>new Date(b.CREATED_AT)-new Date(a.CREATED_AT)));}
function apiAdminGetGradeRelease(token){const ctx=requireSession_(token,[ROLE.ADMIN]);return sanitizeForClient_(readObjectsFresh_('GRADE_RELEASES').find(x=>x.ASSESSMENT_CYCLE==='FINAL_2569_2')||{STATUS:'DRAFT'});}
function apiAdminGetEthicsTracking(token){const ctx=requireSession_(token,[ROLE.ADMIN]);const groups=readObjectsFresh_('RESEARCH_GROUPS').filter(g=>g.STATUS==='ACTIVE');const records=readObjectsFresh_('ETHICS_TRACKING');return sanitizeForClient_(groups.map(g=>{const r=records.find(x=>String(x.GROUP_ID)===String(g.GROUP_ID))||null;if(r){delete r._row;if(r.REC_SUBMITTED_AT)r.REC_SUBMITTED_AT=formatDateOnly_(r.REC_SUBMITTED_AT);if(r.REC_APPROVAL_DATE)r.REC_APPROVAL_DATE=formatDateOnly_(r.REC_APPROVAL_DATE);}return {groupId:g.GROUP_ID,groupName:g.GROUP_NAME,topic:g.TOPIC_TITLE_TH,record:r};}));}
function apiAdminSaveEthicsTracking(token,payload){const ctx=requireSession_(token,[ROLE.ADMIN]);payload=payload||{};const groupId=String(payload.groupId||'');if(!readObjectsFresh_('RESEARCH_GROUPS').some(g=>String(g.GROUP_ID)===groupId&&g.STATUS==='ACTIVE'))throw new Error('ไม่พบกลุ่มวิจัย');const plan=String(payload.ethicsPlan||'UNDECIDED');if(!['DURING_COURSE','AFTER_COURSE','NOT_APPLICABLE','UNDECIDED'].includes(plan))throw new Error('แผนจริยธรรมไม่ถูกต้อง');if(plan==='DURING_COURSE'&&!['NOT_SUBMITTED','SUBMITTED'].includes(String(payload.submissionStatus||'NOT_SUBMITTED')))throw new Error('สถานะการยื่น REC ไม่ถูกต้อง');if(plan==='DURING_COURSE'&&!['PENDING','APPROVED','NOT_APPROVED'].includes(String(payload.approvalStatus||'PENDING')))throw new Error('สถานะผล REC ไม่ถูกต้อง');if(plan==='DURING_COURSE'&&String(payload.submissionStatus||'NOT_SUBMITTED')==='SUBMITTED'&&!String(payload.recReferenceNo||'').trim())throw new Error('เมื่อระบุว่ายื่น REC แล้ว ต้องมีเลขอ้างอิง REC');if(plan==='DURING_COURSE'&&String(payload.approvalStatus||'PENDING')!=='PENDING'&&(payload.recVerified!==true||!String(payload.recSourceReference||'').trim()))throw new Error('การบันทึกผล REC ที่สิ้นสุดแล้วต้องตรวจสอบกับแหล่งข้อมูล REC ก่อน');if(plan==='DURING_COURSE'&&String(payload.approvalStatus||'PENDING')==='APPROVED'&&(!String(payload.recApprovalNo||'').trim()||!payload.approvalDate))throw new Error('การระบุว่ารับรองแล้วต้องมีเลขที่รับรองและวันที่รับรอง');const reviewType=String(payload.reviewType||'');if(reviewType&&!['EXEMPTION','EXPEDITED','FULL_BOARD','NOT_DETERMINED'].includes(reviewType))throw new Error('ประเภทการพิจารณาไม่ถูกต้อง');if(reviewType&&reviewType!=='NOT_DETERMINED'&&(payload.recVerified!==true||!String(payload.recSourceReference||'').trim()))throw new Error('บันทึกประเภทการพิจารณาได้เมื่อมีการตรวจสอบกับแหล่งข้อมูล REC และระบุแหล่งอ้างอิงแล้วเท่านั้น');
  const sh=sheet_('ETHICS_TRACKING'),old=readObjectsFresh_('ETHICS_TRACKING').find(x=>String(x.GROUP_ID)===groupId);const obj={GROUP_ID:groupId,ETHICS_PLAN:plan,ETHICS_PLAN_DUE_WEEK:plan==='UNDECIDED'?(Number(payload.planDueWeek)||8):'',SUBMISSION_STATUS:plan==='DURING_COURSE'?String(payload.submissionStatus||'NOT_SUBMITTED'):(old&&old.SUBMISSION_STATUS||''),REC_SUBMITTED_AT:plan==='DURING_COURSE'?(payload.submittedAt||''):(old&&old.REC_SUBMITTED_AT||''),REC_REFERENCE_NO:plan==='DURING_COURSE'?String(payload.recReferenceNo||''):(old&&old.REC_REFERENCE_NO||''),REC_APPROVAL_STATUS:plan==='DURING_COURSE'?String(payload.approvalStatus||'PENDING'):(old&&old.REC_APPROVAL_STATUS||''),REC_APPROVAL_NO:plan==='DURING_COURSE'?String(payload.recApprovalNo||''):(old&&old.REC_APPROVAL_NO||''),REC_APPROVAL_DATE:plan==='DURING_COURSE'?(payload.approvalDate||''):(old&&old.REC_APPROVAL_DATE||''),REVIEW_TYPE:payload.reviewType!==undefined?reviewType:(old&&old.REVIEW_TYPE||''),VULNERABLE_GROUP_INVOLVEMENT:payload.vulnerableGroupInvolvement||old&&old.VULNERABLE_GROUP_INVOLVEMENT||'NOT_SPECIFIED',REC_VERIFIED_AT:payload.recVerified===true?((!old||!old.REC_VERIFIED_AT||payload.forceReverify===true)?new Date():old.REC_VERIFIED_AT):(old&&old.REC_VERIFIED_AT||''),REC_VERIFIED_BY:payload.recVerified===true?((!old||!old.REC_VERIFIED_AT||payload.forceReverify===true)?ctx.user.USER_ID:old.REC_VERIFIED_BY):(old&&old.REC_VERIFIED_BY||''),REC_SOURCE_REFERENCE:String(payload.recSourceReference||old&&old.REC_SOURCE_REFERENCE||''),UPDATED_BY:ctx.user.USER_ID,UPDATED_AT:new Date()};
  if(old){SCHEMA.ETHICS_TRACKING.forEach((h,i)=>sh.getRange(old._row,i+1).setValue(obj[h]===undefined?'':obj[h]));}else appendObject_('ETHICS_TRACKING',obj);logSystem_('ETHICS_TRACKING_UPDATED','GROUP',groupId,{before:old?{plan:old.ETHICS_PLAN,submissionStatus:old.SUBMISSION_STATUS,approvalStatus:old.REC_APPROVAL_STATUS,approvalNo:old.REC_APPROVAL_NO,reviewType:old.REVIEW_TYPE,verifiedAt:old.REC_VERIFIED_AT,verifiedBy:old.REC_VERIFIED_BY}:{},after:{plan,submissionStatus:obj.SUBMISSION_STATUS,approvalStatus:obj.REC_APPROVAL_STATUS,approvalNo:obj.REC_APPROVAL_NO,reviewType:obj.REVIEW_TYPE,verifiedAt:obj.REC_VERIFIED_AT,verifiedBy:obj.REC_VERIFIED_BY}},ctx.user.USER_ID);return {ok:true,message:'บันทึกข้อมูลติดตามจริยธรรมแล้ว'};}
function apiGetGroupEthicsSummary(token,groupId){const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR,ROLE.STUDENT]);groupId=String(groupId||'');assertGroupAccess_(ctx,groupId);const r=readObjectsFresh_('ETHICS_TRACKING').find(x=>String(x.GROUP_ID)===groupId);if(!r)return null;const safe={GROUP_ID:r.GROUP_ID,ETHICS_PLAN:r.ETHICS_PLAN,ETHICS_PLAN_DUE_WEEK:r.ETHICS_PLAN_DUE_WEEK,SUBMISSION_STATUS:r.ETHICS_PLAN==='DURING_COURSE'?r.SUBMISSION_STATUS:'',REC_SUBMITTED_AT:r.ETHICS_PLAN==='DURING_COURSE'?r.REC_SUBMITTED_AT:'',REC_APPROVAL_STATUS:r.ETHICS_PLAN==='DURING_COURSE'?r.REC_APPROVAL_STATUS:'',REC_APPROVAL_DATE:r.ETHICS_PLAN==='DURING_COURSE'&&r.REC_APPROVAL_DATE?formatDateOnly_(r.REC_APPROVAL_DATE):'',REVIEW_TYPE:r.REVIEW_TYPE};return sanitizeForClient_(safe);}
function gradeReleaseStatus_(){const r=readObjectsFresh_('GRADE_RELEASES').find(x=>x.ASSESSMENT_CYCLE==='FINAL_2569_2');return r?String(r.STATUS||'DRAFT'):'DRAFT';}
function assertGradeEditable_(){const status=gradeReleaseStatus_();if(status==='LOCKED'||status==='RELEASED')throw new Error('คะแนนถูก '+(status==='LOCKED'?'ล็อก':'ประกาศแล้ว')+' การแก้ไขต้องให้ Admin เปลี่ยนสถานะกลับเป็น DRAFT พร้อมระบุเหตุผล');}
function gradeCompleteness_(){
 const groups=readObjectsFresh_('RESEARCH_GROUPS').filter(g=>g.STATUS==='ACTIVE'),members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>m.STATUS==='ACTIVE'),gs=readObjectsFresh_('GROUP_SCORES'),ind=readObjectsFresh_('INDIVIDUAL_SCORES'),peers=readObjectsFresh_('PEER_ASSESSMENTS'),meetings=readObjectsFresh_('MEETING_RECORDS');let incomplete=[];
 groups.forEach(g=>{const score=gs.find(x=>String(x.GROUP_ID)===String(g.GROUP_ID))||{};['A1_SCORE','A2_SCORE','A3_SCORE','A4_GROUP_SCORE'].forEach(k=>{if(score[k]===''||score[k]===null||score[k]===undefined)incomplete.push(g.GROUP_NAME+' · '+k);});const gm=members.filter(m=>String(m.GROUP_ID)===String(g.GROUP_ID));gm.forEach(m=>{const p=ind.find(x=>String(x.STUDENT_ID)===String(m.STUDENT_ID))||{};if(p.A4_INDIVIDUAL_SCORE===''||p.A4_INDIVIDUAL_SCORE===null||p.A4_INDIVIDUAL_SCORE===undefined)incomplete.push(m.STUDENT_ID+' · A4');const peerCount=peers.filter(x=>String(x.GROUP_ID)===String(g.GROUP_ID)&&String(x.EVALUATEE_STUDENT_ID)===String(m.STUDENT_ID)).length;if(gm.length>1&&peerCount<gm.length-1)incomplete.push(m.STUDENT_ID+' · A5');const meetingCount=new Set(meetings.filter(x=>String(x.GROUP_ID)===String(g.GROUP_ID)&&String(x.STUDENT_ID)===String(m.STUDENT_ID)).map(x=>String(x.MEETING_NO))).size;if(meetingCount<7)incomplete.push(m.STUDENT_ID+' · A6 attendance ('+meetingCount+'/7)');});});return incomplete;
}
function apiAdminSetGradeRelease(token,status,reason){const ctx=requireSession_(token,[ROLE.ADMIN]);if(!['DRAFT','LOCKED','RELEASED'].includes(String(status)))throw new Error('สถานะการประกาศคะแนนไม่ถูกต้อง');const note=String(reason||'').trim();const currentRelease=readObjectsFresh_('GRADE_RELEASES').find(x=>x.ASSESSMENT_CYCLE==='FINAL_2569_2');const currentStatus=currentRelease?String(currentRelease.STATUS||'DRAFT'):'DRAFT';if(status==='LOCKED'&&currentStatus==='RELEASED')throw new Error('คะแนนที่ประกาศแล้วต้องเปิดกลับเป็น DRAFT พร้อมเหตุผลก่อน จึงจะ Lock ใหม่ได้');if(status==='RELEASED'&&(!currentRelease||currentStatus!=='LOCKED'))throw new Error('ต้อง Lock คะแนนก่อน จึงจะประกาศคะแนนได้');if(status==='RELEASED'){const missing=gradeCompleteness_();if(missing.length)throw new Error('ยังประกาศคะแนนไม่ได้ เนื่องจากข้อมูลไม่ครบ '+missing.length+' รายการ: '+missing.slice(0,12).join(', '));}const sh=sheet_('GRADE_RELEASES'),rows=readObjectsFresh_('GRADE_RELEASES'),old=rows.find(x=>x.ASSESSMENT_CYCLE==='FINAL_2569_2');if(old&&old.STATUS!=='DRAFT'&&status==='DRAFT'&&note.length<5)throw new Error('การเปิดแก้ไขคะแนนหลัง Lock/Release ต้องระบุเหตุผล');const obj={RELEASE_ID:old?old.RELEASE_ID:Utilities.getUuid(),ASSESSMENT_CYCLE:'FINAL_2569_2',STATUS:status,LOCKED_BY:status==='LOCKED'?ctx.user.USER_ID:(old&&old.LOCKED_BY||''),LOCKED_AT:status==='LOCKED'?new Date():(old&&old.LOCKED_AT||''),RELEASED_BY:status==='RELEASED'?ctx.user.USER_ID:(old&&old.RELEASED_BY||''),RELEASED_AT:status==='RELEASED'?new Date():(old&&old.RELEASED_AT||''),REOPEN_REASON:note,UPDATED_AT:new Date()};if(old){SCHEMA.GRADE_RELEASES.forEach((h,i)=>sh.getRange(old._row,i+1).setValue(obj[h]||''));}else appendObject_('GRADE_RELEASES',obj);logSystem_('GRADE_RELEASE_STATUS_CHANGED','ASSESSMENT',obj.ASSESSMENT_CYCLE,{before:old&&old.STATUS||'NONE',after:status,reason:note},ctx.user.USER_ID);return {ok:true,message:'ปรับสถานะคะแนนเป็น '+status+' แล้ว'};}
function apiAdminRecalculateEarlyWarnings(token){const ctx=requireSession_(token,[ROLE.ADMIN]);phase2EnsureSchemas_();const groups=readObjectsFresh_('RESEARCH_GROUPS').filter(g=>g.STATUS==='ACTIVE'),settings=progressWeekSettings_(),reports=readObjectsFresh_('PROGRESS_REPORTS'),ethics=readObjectsFresh_('ETHICS_TRACKING'),tasks=readObjectsFresh_('GROUP_TASKS'),activeRules=new Set(readObjectsFresh_('EARLY_WARNING_RULES').filter(r=>String(r.IS_ACTIVE).toUpperCase()==='TRUE').map(r=>r.RULE_CODE));let created=0;
  groups.forEach(g=>{const submittedWeeks=new Set(reports.filter(r=>String(r.GROUP_ID)===String(g.GROUP_ID)&&['SUBMITTED','RESUBMITTED','APPROVED','REVISION_REQUIRED','SUPERSEDED'].includes(String(r.STATUS))).map(r=>Number(r.WEEK_NO)));const openWeeks=settings.filter(w=>w.isOpen).map(w=>w.week).sort((a,b)=>a-b);const lastTwo=openWeeks.slice(-2);let run=0;if(lastTwo.length===2){for(let i=lastTwo.length-1;i>=0;i--){if(submittedWeeks.has(lastTwo[i]))break;run++;}}if(run>=2&&activeRules.has('NO_SUBMISSION_2_OPEN_WEEKS'))created+=upsertWarningFlag_(g.GROUP_ID,'NO_SUBMISSION_2_OPEN_WEEKS','HIGH','ไม่มีรายงานใน 2 สัปดาห์ที่เปิดรับล่าสุด',{openWeeks:openWeeks.slice(-2)});
    reports.filter(r=>String(r.GROUP_ID)===String(g.GROUP_ID)&&r.STATUS==='REVISION_REQUIRED'&&r.REVISION_DUE_AT&&new Date(r.REVISION_DUE_AT)<new Date()).forEach(r=>{if(activeRules.has('REVISION_OVERDUE'))created+=upsertWarningFlag_(g.GROUP_ID,'REVISION_OVERDUE','MEDIUM','รายงานสัปดาห์ที่ '+r.WEEK_NO+' เกินกำหนดแก้ไข',{reportId:r.REPORT_ID,revisionDueAt:r.REVISION_DUE_AT});});
    tasks.filter(t=>{if(String(t.GROUP_ID)!==String(g.GROUP_ID)||['DONE','CANCELLED','DELETED'].includes(String(t.STATUS))||!t.DUE_DATE)return false;const due=new Date(t.DUE_DATE);due.setHours(23,59,59,999);return due<new Date();}).forEach(t=>{if(activeRules.has('TASK_OVERDUE'))created+=upsertWarningFlag_(g.GROUP_ID,'TASK_OVERDUE','MEDIUM','งาน '+t.TASK_TITLE+' เกินกำหนด',{taskId:t.TASK_ID,dueDate:t.DUE_DATE});});
    const e=ethics.find(x=>String(x.GROUP_ID)===String(g.GROUP_ID));if(e&&e.ETHICS_PLAN==='UNDECIDED'&&Number(e.ETHICS_PLAN_DUE_WEEK)>0&&settings.some(w=>w.week>=Number(e.ETHICS_PLAN_DUE_WEEK)&&w.isOpen)&&activeRules.has('ETHICS_PLAN_UNDECIDED'))created+=upsertWarningFlag_(g.GROUP_ID,'ETHICS_PLAN_UNDECIDED','LOW','ยังไม่ได้กำหนดแผนจริยธรรมการวิจัย',{dueWeek:e.ETHICS_PLAN_DUE_WEEK});
  });logSystem_('EARLY_WARNINGS_RECALCULATED','SYSTEM','EARLY_WARNING_FLAGS',{created},ctx.user.USER_ID);return {ok:true,created};}
function upsertWarningFlag_(groupId,rule,severity,description,evidence){const rows=readObjectsFresh_('EARLY_WARNING_FLAGS'),evidenceJson=JSON.stringify(evidence||{});const matches=rows.filter(x=>String(x.GROUP_ID)===String(groupId)&&x.RULE_CODE===rule).sort((a,b)=>new Date(b.CREATED_AT)-new Date(a.CREATED_AT));if(matches.some(x=>['OPEN','ACKNOWLEDGED'].includes(String(x.STATUS))))return 0;if(matches.length&&String(matches[0].EVIDENCE_JSON||'')===evidenceJson&&['RESOLVED','DISMISSED'].includes(String(matches[0].STATUS)))return 0;appendObject_('EARLY_WARNING_FLAGS',{FLAG_ID:Utilities.getUuid(),GROUP_ID:groupId,RULE_CODE:rule,SEVERITY:severity,STATUS:'OPEN',DESCRIPTION:description,EVIDENCE_JSON:evidenceJson,ACKNOWLEDGED_BY:'',ACKNOWLEDGED_AT:'',RESOLUTION_NOTE:'',RESOLVED_BY:'',RESOLVED_AT:'',CREATED_AT:new Date(),UPDATED_AT:new Date()});return 1;}
function apiAdminUpdateEarlyWarning(token,flagId,status,note){const ctx=requireSession_(token,[ROLE.ADMIN]);if(!['ACKNOWLEDGED','RESOLVED','DISMISSED'].includes(String(status)))throw new Error('สถานะไม่ถูกต้อง');const r=readObjectsFresh_('EARLY_WARNING_FLAGS').find(x=>x.FLAG_ID===flagId);if(!r)throw new Error('ไม่พบรายการเตือน');if(status==='ACKNOWLEDGED'&&r.STATUS!=='OPEN')throw new Error('รับทราบได้เฉพาะรายการที่ยัง OPEN');if(['RESOLVED','DISMISSED'].includes(status)&&r.STATUS!=='ACKNOWLEDGED')throw new Error('ต้องรับทราบรายการก่อนจึงจะปิดหรือยกเลิกได้');if(['RESOLVED','DISMISSED'].includes(status)&&String(note||'').trim().length<5)throw new Error('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร');const sh=sheet_('EARLY_WARNING_FLAGS'),h=SCHEMA.EARLY_WARNING_FLAGS;if(status==='ACKNOWLEDGED'){sh.getRange(r._row,h.indexOf('ACKNOWLEDGED_BY')+1).setValue(ctx.user.USER_ID);sh.getRange(r._row,h.indexOf('ACKNOWLEDGED_AT')+1).setValue(new Date());}else{sh.getRange(r._row,h.indexOf('RESOLUTION_NOTE')+1).setValue(String(note).trim());sh.getRange(r._row,h.indexOf('RESOLVED_BY')+1).setValue(ctx.user.USER_ID);sh.getRange(r._row,h.indexOf('RESOLVED_AT')+1).setValue(new Date());}sh.getRange(r._row,h.indexOf('STATUS')+1).setValue(status);sh.getRange(r._row,h.indexOf('UPDATED_AT')+1).setValue(new Date());logSystem_('EARLY_WARNING_STATUS_CHANGED','EARLY_WARNING',flagId,{before:r.STATUS,after:status,note:String(note||'')},ctx.user.USER_ID);return {ok:true};}
function apiGetGroupAdvisorFeedbackStatus(token,groupId){const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR,ROLE.STUDENT]);assertGroupAccess_(ctx,String(groupId));const rows=readObjectsFresh_('ADVISOR_FEEDBACK').filter(f=>String(f.GROUP_ID)===String(groupId)&&String(f.STATUS||'ACTIVE')==='ACTIVE');return sanitizeForClient_({hasFeedback:rows.length>0,count:rows.length,lastAt:rows.reduce((m,r)=>!m||new Date(r.CREATED_AT)>new Date(m)?r.CREATED_AT:m,null)});}


/**
 * Course Coordinator dashboard summary.
 * Returns operational status only; never returns report narratives, advisor feedback,
 * meeting review comments, Drive URLs, file metadata, or student personal details.
 */
function apiAdminGetCoordinatorDashboard(token){
  requireSession_(token,[ROLE.ADMIN]);
  const groups=readObjects_('RESEARCH_GROUPS').filter(g=>String(g.STATUS||'').toUpperCase()==='ACTIVE');
  const assignments=readObjects_('ADVISOR_ASSIGNMENTS');
  const users=readObjects_('SYS_USERS').filter(u=>String(u.STATUS||'').toUpperCase()==='ACTIVE');
  const settings=readObjects_('PROGRESS_WEEK_SETTINGS').map(w=>({week:Number(w.WEEK_NO),title:String(w.TITLE||''),isOpen:String(w.IS_OPEN||'').toUpperCase()==='TRUE',dueDate:w.DUE_DATE?formatDateOnly_(w.DUE_DATE):''})).sort((a,b)=>a.week-b.week);
  const reports=readObjects_('PROGRESS_REPORTS');
  const extensions=readObjects_('GROUP_DEADLINE_EXTENSIONS').filter(x=>String(x.STATUS||'').toUpperCase()==='APPROVED');
  const meetingReports=readObjects_('MEETING_REPORTS');
  const meetingFiles=readObjects_('MEETING_FILES');
  const meetingRecords=readObjects_('MEETING_RECORDS');
  const groupTasks=readObjects_('GROUP_TASKS');
  const warnings=readObjects_('EARLY_WARNING_FLAGS');
  const groupScores=readObjects_('GROUP_SCORES');
  const individualScores=readObjects_('INDIVIDUAL_SCORES');
  const members=readObjects_('GROUP_MEMBERS').filter(m=>String(m.STATUS||'').toUpperCase()==='ACTIVE');
  const peerAssessments=readObjects_('PEER_ASSESSMENTS');
  const today=new Date();today.setHours(0,0,0,0);
  const dateOnly=v=>{
    if(!v)return null;
    if(v instanceof Date&&!isNaN(v.getTime())){const d=new Date(v);d.setHours(0,0,0,0);return d;}
    const s=String(v).slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
    const d=new Date(s+'T00:00:00');return isNaN(d.getTime())?null:d;
  };
  const isoDate=v=>{const d=dateOnly(v);return d?Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd'):'';};
  const groupById=new Map(groups.map(g=>[String(g.GROUP_ID),g]));
  const activeUserById=new Map(users.map(u=>[String(u.USER_ID),u]));
  const assignmentByGroup=new Map();
  assignments.forEach(a=>{
    const status=String(a.STATUS||'').toUpperCase(),key=String(a.GROUP_ID||'');
    if(status==='APPROVED')assignmentByGroup.set(key,a);
  });
  const pendingAssignments=assignments.filter(a=>String(a.STATUS||'').toUpperCase()==='PENDING'&&groupById.has(String(a.GROUP_ID)));
  const invitations=readObjects_('ADVISOR_INVITATIONS');
  const pendingInvitations=invitations.filter(i=>String(i.STATUS||'').toUpperCase()==='ACCEPTED'&&groupById.has(String(i.GROUP_ID)));
  const groupsNoAdvisor=groups.filter(g=>!assignmentByGroup.has(String(g.GROUP_ID))&&!pendingAssignments.some(a=>String(a.GROUP_ID)===String(g.GROUP_ID))&&!pendingInvitations.some(i=>String(i.GROUP_ID)===String(g.GROUP_ID)));
  const approvedAdvisorName=g=>{
    const a=assignmentByGroup.get(String(g.GROUP_ID)),u=a&&activeUserById.get(String(a.ADVISOR_USER_ID));
    return u?String(u.DISPLAY_NAME||u.EMAIL||''):a?'บัญชี Advisor ไม่พร้อมใช้งาน':'ยังไม่ได้แต่งตั้ง';
  };
  const latestByGroupWeek=new Map();
  reports.forEach(r=>{
    const key=String(r.GROUP_ID)+'|'+String(r.WEEK_NO),old=latestByGroupWeek.get(key);
    if(!old||new Date(r.SUBMITTED_AT||r.UPDATED_AT||0)>=new Date(old.SUBMITTED_AT||old.UPDATED_AT||0))latestByGroupWeek.set(key,r);
  });
  const effectiveDue=(groupId,week,setting)=>{
    const ext=extensions.filter(x=>String(x.GROUP_ID)===String(groupId)&&Number(x.WEEK_NO)===Number(week))
      .sort((a,b)=>new Date(b.APPROVED_AT||0)-new Date(a.APPROVED_AT||0))[0];
    return ext?ext.NEW_DUE_DATE:(setting&&setting.dueDate||'');
  };
  const pendingReports=[],revisionReports=[],overdueReports=[],dueSoonReports=[];
  const latestReportByGroup=new Map();
  groups.forEach(g=>{
    settings.forEach(w=>{
      const key=String(g.GROUP_ID)+'|'+String(w.week),r=latestByGroupWeek.get(key)||null;
      const due=effectiveDue(g.GROUP_ID,w.week,w),dueDate=dateOnly(due),status=String(r&&r.STATUS||'NOT_SUBMITTED').toUpperCase();
      const submitted=!!r&&!!r.SUBMITTED_AT;
      const row={groupId:String(g.GROUP_ID),groupName:String(g.GROUP_NAME||''),weekNo:Number(w.week),weekTitle:String(w.title||''),status,
        submittedAt:r&&r.SUBMITTED_AT?isoDate(r.SUBMITTED_AT):'',dueDate:isoDate(due),revisionDueAt:r&&r.REVISION_DUE_AT?isoDate(r.REVISION_DUE_AT):''};
      if(['SUBMITTED','RESUBMITTED'].includes(status))pendingReports.push(row);
      if(status==='REVISION_REQUIRED')revisionReports.push(row);
      const actionDue=status==='REVISION_REQUIRED'?dateOnly(r&&r.REVISION_DUE_AT||due):dueDate;
      if(!submitted&&status==='NOT_SUBMITTED'&&actionDue&&actionDue<today)overdueReports.push(row);
      if(status==='REVISION_REQUIRED'&&actionDue&&actionDue<today)overdueReports.push(row);
      if(['NOT_SUBMITTED','REVISION_REQUIRED'].includes(status)&&actionDue&&actionDue>=today&&Math.ceil((actionDue-today)/86400000)<=7)dueSoonReports.push(row);
      if(r){
        const prev=latestReportByGroup.get(String(g.GROUP_ID));
        if(!prev||new Date(r.SUBMITTED_AT||r.UPDATED_AT||0)>new Date(prev.SUBMITTED_AT||prev.UPDATED_AT||0))latestReportByGroup.set(String(g.GROUP_ID),r);
      }
    });
  });
  const meetingOneByGroup=new Map();
  groups.forEach(g=>{
    const gid=String(g.GROUP_ID);
    const online=meetingReports.filter(r=>String(r.GROUP_ID)===gid&&Number(r.MEETING_NO)===1)
      .sort((a,b)=>Number(b.VERSION||0)-Number(a.VERSION||0)||new Date(b.UPDATED_AT||0)-new Date(a.UPDATED_AT||0))[0];
    const file=meetingFiles.filter(f=>String(f.GROUP_ID)===gid&&Number(f.MEETING_NO)===1&&['SUBMITTED','VERIFIED','REVISION_REQUIRED','ACTIVE'].includes(String(f.STATUS||'').toUpperCase()))
      .sort((a,b)=>new Date(b.UPLOADED_AT||0)-new Date(a.UPLOADED_AT||0))[0];
    const recorded=meetingRecords.some(m=>String(m.GROUP_ID)===gid&&Number(m.MEETING_NO)===1);
    const latest=online||file||null;
    const status=latest?String(latest.STATUS||'SUBMITTED').toUpperCase():recorded?'NOT_SUBMITTED':'NOT_RECORDED';
    meetingOneByGroup.set(gid,{groupId:gid,groupName:String(g.GROUP_NAME||''),status,submittedAt:isoDate(latest&&(latest.SUBMITTED_AT||latest.UPLOADED_AT))});
  });
  const meetingOne=[...meetingOneByGroup.values()];
  const meetingOnePending=meetingOne.filter(x=>x.status==='SUBMITTED');
  const meetingOneRevision=meetingOne.filter(x=>x.status==='REVISION_REQUIRED');
  const openWarnings=warnings.filter(w=>['OPEN','ACKNOWLEDGED'].includes(String(w.STATUS||'').toUpperCase())&&groupById.has(String(w.GROUP_ID)));
  const tasks=groupTasks.filter(t=>groupById.has(String(t.GROUP_ID))&&!['COMPLETED','CANCELLED','DONE'].includes(String(t.STATUS||'').toUpperCase()));
  const taskRows=tasks.map(t=>({groupId:String(t.GROUP_ID),groupName:String((groupById.get(String(t.GROUP_ID))||{}).GROUP_NAME||''),title:String(t.TASK_TITLE||'งานกลุ่ม'),status:String(t.STATUS||''),dueDate:isoDate(t.DUE_DATE)}));
  const taskOverdue=taskRows.filter(t=>{const d=dateOnly(t.dueDate);return d&&d<today;});
  const taskDueSoon=taskRows.filter(t=>{const d=dateOnly(t.dueDate);return d&&d>=today&&Math.ceil((d-today)/86400000)<=7;});
  const calendar=[];
  settings.forEach(w=>{const d=dateOnly(w.dueDate);if(d)calendar.push({type:'PROGRESS',title:String(w.title||('รายงานความก้าวหน้า สัปดาห์ '+w.week)),date:isoDate(d),weekNo:Number(w.week),isOpen:!!w.isOpen});});
  taskRows.forEach(t=>{if(t.dueDate)calendar.push({type:'TASK',title:t.title,groupName:t.groupName,date:t.dueDate,status:t.status});});
  calendar.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const scoreByGroup=new Map(groupScores.map(s=>[String(s.GROUP_ID),s]));
  const individualByStudent=new Map(individualScores.map(s=>[String(s.STUDENT_ID),s]));
  const activeMembersByGroup=new Map();
  members.forEach(m=>{const k=String(m.GROUP_ID);if(!activeMembersByGroup.has(k))activeMembersByGroup.set(k,[]);activeMembersByGroup.get(k).push(m);});
  const assessmentWindows=assessmentSettings_();
  const assessments=['A1','A2','A3','A4','A5'].map(code=>{
    let complete=0,recorded=0,expected=groups.length;
    groups.forEach(g=>{
      const gid=String(g.GROUP_ID),score=scoreByGroup.get(gid)||{},gm=activeMembersByGroup.get(gid)||[];
      let has=false,isComplete=false;
      if(['A1','A2','A3'].includes(code)){const key=code+'_SCORE';has=score[key]!==''&&score[key]!==null&&score[key]!==undefined;isComplete=has;}
      else if(code==='A4'){
        const groupDone=score.A4_GROUP_SCORE!==''&&score.A4_GROUP_SCORE!==null&&score.A4_GROUP_SCORE!==undefined;
        const membersDone=gm.length>0&&gm.every(m=>{const s=individualByStudent.get(String(m.STUDENT_ID))||{};return s.A4_INDIVIDUAL_SCORE!==''&&s.A4_INDIVIDUAL_SCORE!==null&&s.A4_INDIVIDUAL_SCORE!==undefined;});
        has=groupDone||gm.some(m=>{const s=individualByStudent.get(String(m.STUDENT_ID))||{};return s.A4_INDIVIDUAL_SCORE!==''&&s.A4_INDIVIDUAL_SCORE!==null&&s.A4_INDIVIDUAL_SCORE!==undefined;});
        isComplete=groupDone&&membersDone;
      }else{
        const gmIds=gm.map(m=>String(m.STUDENT_ID)),expectedPeers=gmIds.length*Math.max(0,gmIds.length-1);
        const peers=peerAssessments.filter(p=>String(p.GROUP_ID)===gid&&gmIds.includes(String(p.EVALUATOR_STUDENT_ID))&&gmIds.includes(String(p.EVALUATEE_STUDENT_ID)));
        has=peers.length>0;isComplete=expectedPeers===0?true:peers.length>=expectedPeers;
      }
      if(has)recorded++;if(isComplete)complete++;
    });
    const windowKey='WINDOW_'+code,windowState=assessmentWindows[windowKey]||'NOT_CONFIGURED';
    return {code,points:{A1:10,A2:30,A3:20,A4:30,A5:10}[code],complete,recorded,expected,windowState,
      isOpen:['OPEN'].includes(String(windowState).toUpperCase()),active:code==='A4'||code==='A5'?String(windowState).toUpperCase()==='OPEN':false};
  });
  const groupRows=groups.map(g=>{
    const gid=String(g.GROUP_ID),assignment=assignmentByGroup.get(gid),advisor=approvedAdvisorName(g);
    const latest=latestReportByGroup.get(gid)||null;
    const progressStatus=latest?String(latest.STATUS||''):'NO_REPORT';
    const meeting=meetingOneByGroup.get(gid)||{status:'NOT_RECORDED'};
    const hasPendingNomination=pendingAssignments.some(a=>String(a.GROUP_ID)===gid)||pendingInvitations.some(i=>String(i.GROUP_ID)===gid);
    const tracking=(openWarnings.some(w=>String(w.GROUP_ID)===gid)?'ติดตามความเสี่ยง':
      overdueReports.some(r=>r.groupId===gid)||taskOverdue.some(t=>t.groupId===gid)?'เลยกำหนด':
      hasPendingNomination?'รออนุมัติ Advisor':
      !assignment?'รอแต่งตั้ง Advisor':
      ['SUBMITTED','RESUBMITTED','REVISION_REQUIRED'].includes(progressStatus)?'รอตรวจ/แก้ไข':'ติดตามตามสถานะ');
    return {groupId:gid,groupName:String(g.GROUP_NAME||''),topic:String(g.TOPIC_TITLE_TH||''),advisor,
      advisorStatus:assignment?'APPROVED':pendingAssignments.some(a=>String(a.GROUP_ID)===gid)?'PENDING':pendingInvitations.some(i=>String(i.GROUP_ID)===gid)?'ACCEPTED_PENDING_APPROVAL':'NOT_ASSIGNED',
      latestProgressStatus:progressStatus,latestProgressWeek:latest?Number(latest.WEEK_NO||0):null,latestProgressSubmittedAt:latest?isoDate(latest.SUBMITTED_AT):'',
      meetingOneStatus:meeting.status,meetingOneSubmittedAt:meeting.submittedAt||'',tracking};
  });
  return sanitizeForClient_({
    generatedAt:new Date().toISOString(),
    summary:{groups:groups.length,advisorMissing:groupsNoAdvisor.length,advisorPending:pendingAssignments.length+pendingInvitations.length,
      progressPending:pendingReports.length,progressRevision:revisionReports.length,progressOverdue:overdueReports.length,progressDueSoon:dueSoonReports.length,
      meetingOnePending:meetingOnePending.length,meetingOneRevision:meetingOneRevision.length,meetingOneRecorded:meetingOne.filter(x=>x.status!=='NOT_RECORDED').length,
      taskOverdue:taskOverdue.length,taskDueSoon:taskDueSoon.length,openWarnings:openWarnings.length},
    advisorActions:{missing:groupsNoAdvisor.map(g=>({groupId:String(g.GROUP_ID),groupName:String(g.GROUP_NAME||'')})),
      pending:pendingAssignments.map(a=>({groupId:String(a.GROUP_ID),groupName:String((groupById.get(String(a.GROUP_ID))||{}).GROUP_NAME||''),assignmentId:String(a.ASSIGNMENT_ID||''),status:'PENDING'}))
        .concat(pendingInvitations.map(i=>({groupId:String(i.GROUP_ID),groupName:String((groupById.get(String(i.GROUP_ID))||{}).GROUP_NAME||''),status:'ACCEPTED_PENDING_APPROVAL'})))},
    actions:{progressPending:pendingReports,progressRevision:revisionReports,progressOverdue:overdueReports,progressDueSoon,
      meetingOnePending,meetingOneRevision,taskOverdue,taskDueSoon,warnings:openWarnings.map(w=>({groupId:String(w.GROUP_ID),groupName:String((groupById.get(String(w.GROUP_ID))||{}).GROUP_NAME||''),severity:String(w.SEVERITY||''),status:String(w.STATUS||'')}))},
    activities:{advisorApproved:groups.filter(g=>assignmentByGroup.has(String(g.GROUP_ID))).length,advisorPending:pendingAssignments.length+pendingInvitations.length,
      meetingOneSubmitted:meetingOne.filter(x=>['SUBMITTED','VERIFIED','REVISION_REQUIRED','ACTIVE'].includes(x.status)).length,
      meetingOneVerified:meetingOne.filter(x=>x.status==='VERIFIED').length,
      progressWeekOpen:settings.filter(w=>w.isOpen).map(w=>({weekNo:Number(w.week),title:String(w.title||''),dueDate:isoDate(w.dueDate)}))},
    groups:groupRows,calendar,assessments
  });
}
