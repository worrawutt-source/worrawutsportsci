function apiGetGroupProgressDraft(token,weekNo){
  const ctx=requireSession_(token,[ROLE.STUDENT,ROLE.ADVISOR,ROLE.ADMIN]);
  const week=Number(weekNo);if(!Number.isInteger(week)||week<1||week>15)throw new Error('สัปดาห์ไม่ถูกต้อง');
  let groupId='';
  if(ctx.user.ROLE_ID===ROLE.STUDENT) groupId=studentGroupForUser_(ctx);
  else groupId=String(arguments.length>2?arguments[2]:'');
  if(!groupId)throw new Error('ไม่พบกลุ่ม');
  assertGroupAccess_(ctx,groupId);
  const draft=readObjectsFresh_('GROUP_PROGRESS_DRAFTS').find(x=>String(x.GROUP_ID)===groupId&&Number(x.WEEK_NO)===week);
  const activity=readObjectsFresh_('GROUP_ACTIVITY_LOG').filter(x=>String(x.GROUP_ID)===groupId&&Number(x.WEEK_NO)===week).sort((a,b)=>new Date(b.CREATED_AT)-new Date(a.CREATED_AT)).slice(0,30);
  return {draft:draft?{workCompleted:draft.WORK_COMPLETED||'',problems:draft.PROBLEMS||'',nextActions:draft.NEXT_ACTIONS||'',versionNo:Number(draft.VERSION_NO)||1,updatedAt:draft.UPDATED_AT instanceof Date?draft.UPDATED_AT.toISOString():String(draft.UPDATED_AT||''),updatedBy:draft.UPDATED_BY}:null,activity:activity.map(x=>({action:x.ACTION,details:x.DETAILS,createdAt:x.CREATED_AT instanceof Date?x.CREATED_AT.toISOString():String(x.CREATED_AT||''),userId:x.USER_ID}))};
}
function apiSaveGroupProgressDraft(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);payload=payload||{};
  const groupId=studentGroupForUser_(ctx),week=Number(payload.weekNo);
  if(!Number.isInteger(week)||week<1||week>15)throw new Error('สัปดาห์ไม่ถูกต้อง');
  const setting=progressWeekSettings_().find(w=>w.week===week);if(!setting||!setting.isOpen)throw new Error('สัปดาห์นี้ยังไม่เปิดรับรายงาน');
  const latest=findObjectsByColumnValue_('PROGRESS_REPORTS','GROUP_ID',groupId).filter(r=>Number(r.WEEK_NO)===week).sort((a,b)=>new Date(b.SUBMITTED_AT||0)-new Date(a.SUBMITTED_AT||0))[0];
  if(latest&&['SUBMITTED','RESUBMITTED','APPROVED'].includes(String(latest.STATUS)))throw new Error('รายงานถูกส่งแล้ว ไม่สามารถแก้ไขร่างได้');
  const work=String(payload.workCompleted||'').slice(0,20000),problems=String(payload.problems||'').slice(0,10000),next=String(payload.nextActions||'').slice(0,10000);
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const sh=sheet_('GROUP_PROGRESS_DRAFTS'),rows=readObjectsFresh_('GROUP_PROGRESS_DRAFTS');
    let row=rows.find(x=>String(x.GROUP_ID)===groupId&&Number(x.WEEK_NO)===week),currentVersion=Number(row&&row.VERSION_NO)||0;
    if(row && Number(payload.lockVersion||0)!==currentVersion) throw new Error('มีสมาชิกแก้ไขร่างนี้ก่อนหน้าแล้ว กรุณาโหลดข้อมูลล่าสุดและนำการแก้ไขของคุณมารวมก่อนบันทึก');
    const version=currentVersion+1;
    if(row){const values=[work,problems,next,version,ctx.user.USER_ID,new Date(),String(payload.lockVersion||'')];const cols=['WORK_COMPLETED','PROBLEMS','NEXT_ACTIONS','VERSION_NO','UPDATED_BY','UPDATED_AT','LOCK_VERSION'];cols.forEach((c,i)=>sh.getRange(row._row,SCHEMA.GROUP_PROGRESS_DRAFTS.indexOf(c)+1).setValue(values[i]));}
    else appendObject_('GROUP_PROGRESS_DRAFTS',{DRAFT_ID:Utilities.getUuid(),GROUP_ID:groupId,WEEK_NO:week,WORK_COMPLETED:work,PROBLEMS:problems,NEXT_ACTIONS:next,VERSION_NO:version,UPDATED_BY:ctx.user.USER_ID,UPDATED_AT:new Date(),LOCK_VERSION:String(payload.lockVersion||'')});
    appendObject_('GROUP_ACTIVITY_LOG',{ACTIVITY_ID:Utilities.getUuid(),GROUP_ID:groupId,WEEK_NO:week,USER_ID:ctx.user.USER_ID,ACTION:'DRAFT_SAVED',DETAILS:'บันทึกร่างรายงานร่วม รุ่น '+version,CREATED_AT:new Date()});
    return {ok:true,message:'บันทึกร่างรายงานร่วมแล้ว',versionNo:version};
  }finally{lock.releaseLock();}
}

function apiStudentSubmitProgress(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);payload=payload||{};
  const groupId=studentGroupForUser_(ctx);
  const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===groupId&&g.STATUS==='ACTIVE');
  const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===groupId&&m.STATUS==='ACTIVE');
  const leader=String(group&&group.GROUP_LEADER_USER_ID||'');
  if(!leader||!members.some(m=>String(m.USER_ID)===leader)) throw new Error('กลุ่มนี้ยังไม่ได้รับการกำหนดหัวหน้ากลุ่ม กรุณาติดต่อ Admin');
  if(leader!==ctx.user.USER_ID) throw new Error('เฉพาะหัวหน้ากลุ่มที่ Admin กำหนดเท่านั้นที่ส่งรายงานอย่างเป็นทางการได้');
  const week=Number(payload.weekNo);
  if(!Number.isInteger(week)||week<1||week>15)throw new Error('ไม่พบสัปดาห์รายงานที่ระบบกำหนด');
  const settings=progressWeekSettings_().find(w=>w.week===week);
  if(!settings||!settings.isOpen)throw new Error('สัปดาห์นี้ปิดรับรายงานแล้ว กรุณาตรวจสอบประกาศจากอาจารย์ประจำวิชา');
  const draft=readObjectsFresh_('GROUP_PROGRESS_DRAFTS').find(x=>String(x.GROUP_ID)===groupId&&Number(x.WEEK_NO)===week);
  const work=String(payload.workCompleted!==undefined?payload.workCompleted:(draft&&draft.WORK_COMPLETED)||'').trim();
  if(work.length<20)throw new Error('กรุณาระบุงานที่ดำเนินการอย่างน้อย 20 ตัวอักษร');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const existing=findObjectsByColumnValue_('PROGRESS_REPORTS','GROUP_ID',groupId)
      .filter(r=>Number(r.WEEK_NO)===week)
      .sort((a,b)=>new Date(b.SUBMITTED_AT||0)-new Date(a.SUBMITTED_AT||0));
    const latest=existing[0];
    if(latest&&['SUBMITTED','RESUBMITTED','APPROVED'].includes(String(latest.STATUS)))
      throw new Error(latest.STATUS==='APPROVED'?'รายงานสัปดาห์นี้ได้รับอนุมัติแล้ว':'รายงานสัปดาห์นี้ส่งแล้ว กรุณารอการตรวจจากอาจารย์');
    if(latest&&latest.STATUS!=='REVISION_REQUIRED'&&latest.STATUS!=='SUPERSEDED')
      throw new Error('ไม่สามารถส่งรายงานซ้ำในสัปดาห์นี้ได้');
    if(latest&&latest.STATUS==='REVISION_REQUIRED'){
      const oldSheet=sheet_('PROGRESS_REPORTS');
      oldSheet.getRange(latest._row,SCHEMA.PROGRESS_REPORTS.indexOf('STATUS')+1).setValue('SUPERSEDED');
    }
    const id=Utilities.getUuid();
    const submissionTiming=progressSubmissionTimeliness_(settings,new Date(),groupId);
    appendObject_('PROGRESS_REPORTS',{
      REPORT_ID:id,GROUP_ID:groupId,WEEK_NO:week,MILESTONE:settings.title,
      WORK_COMPLETED:work,PROBLEMS:String(payload.problems!==undefined?payload.problems:(draft&&draft.PROBLEMS)||'').trim(),
      NEXT_ACTIONS:String(payload.nextActions!==undefined?payload.nextActions:(draft&&draft.NEXT_ACTIONS)||'').trim(),SUBMITTED_BY:ctx.user.USER_ID,
      SUBMITTED_AT:new Date(),STATUS:latest&&latest.STATUS==='REVISION_REQUIRED'?'RESUBMITTED':'SUBMITTED',
      REVIEWED_BY:'',REVIEWED_AT:'',REVIEW_COMMENT:'',TIMELINESS_STATUS:submissionTiming.status,REVISION_DUE_AT:'',EXTENSION_ID:submissionTiming.extensionId
    });
    logSystem_('PROGRESS_REPORT_SUBMITTED','GROUP',groupId,{reportId:id,weekNo:week},ctx.user.USER_ID);
    enqueueGroupNotification_(groupId,'PROGRESS_SUBMITTED','ส่งรายงานความก้าวหน้าแล้ว','กลุ่มส่งรายงานความก้าวหน้าสัปดาห์ที่ '+week+' แล้ว','PROGRESS_REPORT',id);
    return {ok:true,message:'ส่งรายงานสัปดาห์ที่ '+week+' แล้ว'};
  }finally{lock.releaseLock();}
}
function migrateCollaborativeWorkspaceSchema_(){
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const db=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('DB_ID'));
    const required={
      GROUP_PROGRESS_DRAFTS:['DRAFT_ID','GROUP_ID','WEEK_NO','WORK_COMPLETED','PROBLEMS','NEXT_ACTIONS','VERSION_NO','UPDATED_BY','UPDATED_AT','LOCK_VERSION'],
      GROUP_ACTIVITY_LOG:['ACTIVITY_ID','GROUP_ID','WEEK_NO','USER_ID','ACTION','DETAILS','CREATED_AT'],
      GROUP_TASKS:['TASK_ID','GROUP_ID','WEEK_NO','TASK_TITLE','TASK_DETAIL','ASSIGNED_TO_USER_ID','STATUS','CREATED_BY','CREATED_AT','UPDATED_AT'],
      GROUP_LEADER_HISTORY:['HISTORY_ID','GROUP_ID','OLD_LEADER_USER_ID','NEW_LEADER_USER_ID','ACTION_BY','ACTION_AT','NOTE']
    };
    Object.keys(required).forEach(name=>{let sh=db.getSheetByName(name);if(!sh)sh=db.insertSheet(name);if(sh.getLastRow()===0)sh.getRange(1,1,1,required[name].length).setValues([required[name]]);else{const h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];if(required[name].some((v,i)=>h[i]!==v))throw new Error('Schema mismatch: '+name)}sh.setFrozenRows(1)});
    const groups=db.getSheetByName('RESEARCH_GROUPS');if(groups){const h=groups.getRange(1,1,1,groups.getLastColumn()).getDisplayValues()[0];if(!h.includes('GROUP_LEADER_USER_ID'))groups.getRange(1,h.length+1).setValue('GROUP_LEADER_USER_ID')}
    return {ok:true,message:'เตรียมระบบทำงานร่วมกันและประวัติหัวหน้ากลุ่มเรียบร้อย'};
  }finally{lock.releaseLock();}
}

function apiAdvisorAddFeedback(token,payload){
  const ctx=requireSession_(token,[ROLE.ADVISOR,ROLE.ADMIN]);payload=payload||{};const groupId=String(payload.groupId||'');assertGroupAccess_(ctx,groupId);
  const comment=String(payload.comment||'').trim();if(comment.length<5)throw new Error('กรุณาระบุข้อเสนอแนะอย่างน้อย 5 ตัวอักษร');
  const id=Utilities.getUuid();appendObject_('ADVISOR_FEEDBACK',{FEEDBACK_ID:id,GROUP_ID:groupId,RELATED_TYPE:String(payload.relatedType||'GENERAL'),RELATED_ID:String(payload.relatedId||''),COMMENT:comment,CREATED_BY:ctx.user.USER_ID,CREATED_AT:new Date(),STATUS:'ACTIVE'});
  logSystem_('ADVISOR_FEEDBACK_ADDED','GROUP',groupId,{feedbackId:id},ctx.user.USER_ID);return {ok:true,message:'บันทึกข้อเสนอแนะแล้ว'};
}

/** ---------------- Phase 2.0 additive services ---------------- */
function migratePhase2AdditiveSchema_(){
  requireDatabase_();if(String(getConfigValue_('ENVIRONMENT','')).toUpperCase()!=='TEST')throw new Error('Phase 2 migration is restricted to the TEST database.');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{const created=[],extended=[];
    ['PROGRESS_REPORTS','PROGRESS_WEEK_SETTINGS','GROUP_TASKS','NOTIFICATIONS','NOTIFICATION_QUEUE','NOTIFICATION_LOG','EARLY_WARNING_RULES','EARLY_WARNING_FLAGS','ETHICS_TRACKING','TASK_COMMENTS','GRADE_RELEASES','GROUP_SCORE_AUDIT','GROUP_DEADLINE_EXTENSIONS'].forEach(name=>{const before=db_().getSheetByName(name);const beforeCols=before?before.getLastColumn():0;ensureWorkflowSheet_(name);if(!before)created.push(name);else if(beforeCols<SCHEMA[name].length)extended.push(name);});
    seedEarlyWarningRules_();const migrationVersion='0.4.0-PHASE2-TEST';if(!readObjectsFresh_('SYS_MIGRATIONS').some(r=>String(r.VERSION)===migrationVersion))appendObject_('SYS_MIGRATIONS',{MIGRATION_ID:Utilities.getUuid(),VERSION:migrationVersion,DESCRIPTION:'Phase 2 additive schemas for notifications, tasks, ethics, early warnings, deadline extensions and grade release',APPLIED_AT:new Date(),APPLIED_BY:'ADMIN_MIGRATION'});return {ok:true,created,extended,message:'Phase 2 additive migration complete. Existing rows were preserved.'};
  }finally{lock.releaseLock();}
}

function apiAdminMigratePhase2Schema(token){const ctx=requireSession_(token,[ROLE.ADMIN]);const result=migratePhase2AdditiveSchema_();logSystem_('PHASE2_SCHEMA_MIGRATED','SYSTEM','DATABASE',{created:result.created,extended:result.extended},ctx.user.USER_ID);return result;}

function phase2EnsureSchemas_(){
  ['NOTIFICATIONS','NOTIFICATION_QUEUE','NOTIFICATION_LOG','EARLY_WARNING_RULES','EARLY_WARNING_FLAGS','ETHICS_TRACKING','TASK_COMMENTS','GRADE_RELEASES','GROUP_SCORE_AUDIT','GROUP_DEADLINE_EXTENSIONS'].forEach(ensureWorkflowSheet_);
  seedEarlyWarningRules_();
  return {ok:true};
}
function seedEarlyWarningRules_(){
  const defaults=[
    ['NO_SUBMISSION_2_OPEN_WEEKS','ไม่ส่งรายงาน 2 สัปดาห์ที่เปิดรับ', {consecutiveOpenWeeks:2}],
    ['REVISION_OVERDUE','เกินกำหนดส่งรายงานแก้ไข', {}],
    ['TASK_OVERDUE','งานที่มอบหมายเกินกำหนด', {}],
    ['ETHICS_PLAN_UNDECIDED','ยังไม่กำหนดแผนจริยธรรมการวิจัย', {dueWeek:8}]
  ];
  const rows=readObjectsFresh_('EARLY_WARNING_RULES');
  defaults.forEach(x=>{if(!rows.some(r=>r.RULE_CODE===x[0]))appendObject_('EARLY_WARNING_RULES',{RULE_ID:Utilities.getUuid(),RULE_CODE:x[0],RULE_NAME:x[1],IS_ACTIVE:'TRUE',PARAMETERS_JSON:JSON.stringify(x[2]),UPDATED_BY:'SYSTEM',UPDATED_AT:new Date()});});
}
function progressSubmissionTimeliness_(settings, submittedAt, groupId){
  if(!settings||!settings.dueDate)return {status:'NO_DUE_DATE',extensionId:''};
  const ext=readObjectsFresh_('GROUP_DEADLINE_EXTENSIONS').filter(x=>String(x.GROUP_ID)===String(groupId)&&Number(x.WEEK_NO)===Number(settings.week)&&x.STATUS==='APPROVED').sort((a,b)=>new Date(b.APPROVED_AT)-new Date(a.APPROVED_AT))[0];
  const originalDue=new Date(settings.dueDate);if(isNaN(originalDue.getTime()))return {status:'NO_DUE_DATE',extensionId:''};originalDue.setHours(23,59,59,999);
  if(submittedAt.getTime()<=originalDue.getTime())return {status:'ON_TIME',extensionId:''};
  if(ext){const extendedDue=new Date(ext.NEW_DUE_DATE);extendedDue.setHours(23,59,59,999);return {status:submittedAt.getTime()<=extendedDue.getTime()?'EXTENSION_GRANTED':'LATE',extensionId:String(ext.EXTENSION_ID||'')};}
  return {status:'LATE',extensionId:''};
}
function apiAdminSetRevisionDeadline(token,reportId,dueAt,reason){
  const ctx=requireSession_(token,[ROLE.ADMIN]); const d=new Date(dueAt); if(isNaN(d.getTime()))throw new Error('กำหนดวันครบกำหนดแก้ไขไม่ถูกต้อง');
  const note=String(reason||'').trim(); if(note.length<5)throw new Error('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร');
  const sh=sheet_('PROGRESS_REPORTS'),r=readObjectsFresh_('PROGRESS_REPORTS').find(x=>String(x.REPORT_ID)===String(reportId)); if(!r||r.STATUS!=='REVISION_REQUIRED')throw new Error('ไม่พบรายงานที่อยู่ระหว่างรอแก้ไข');
  const col=SCHEMA.PROGRESS_REPORTS.indexOf('REVISION_DUE_AT')+1; sh.getRange(r._row,col).setValue(d);
  logSystem_('REVISION_DEADLINE_SET','PROGRESS_REPORT',reportId,{dueAt:d.toISOString(),reason:note},ctx.user.USER_ID);
  enqueueGroupNotification_(r.GROUP_ID,'REVISION_DEADLINE','กำหนดส่งรายงานแก้ไข','กำหนดส่งรายงานแก้ไขภายใน '+formatThaiDateTime_(d),'PROGRESS_REPORT',String(reportId)+':'+d.getTime());
  return {ok:true,message:'กำหนดวันส่งรายงานแก้ไขแล้ว'};
}
function apiAdminGrantProgressExtension(token,groupId,weekNo,newDueDate,reason){
  const ctx=requireSession_(token,[ROLE.ADMIN]); const d=new Date(newDueDate); if(isNaN(d.getTime()))throw new Error('วันขยายกำหนดส่งไม่ถูกต้อง');if(!readObjectsFresh_('RESEARCH_GROUPS').some(g=>String(g.GROUP_ID)===String(groupId)&&g.STATUS==='ACTIVE'))throw new Error('ไม่พบกลุ่มวิจัยที่ใช้งานอยู่');
  const note=String(reason||'').trim();if(note.length<5)throw new Error('กรุณาระบุเหตุผลการขยายเวลาอย่างน้อย 5 ตัวอักษร');
  assertGroupAccess_(ctx,String(groupId));const settings=readObjectsFresh_('PROGRESS_WEEK_SETTINGS').find(x=>Number(x.WEEK_NO)===Number(weekNo));if(!settings)throw new Error('ไม่พบสัปดาห์ที่กำหนด');if(String(settings.IS_OPEN).toUpperCase()!=='TRUE')throw new Error('การขยายกำหนดส่งทำได้เฉพาะสัปดาห์ที่ยังเปิดรับรายงาน');if(!settings.DUE_DATE)throw new Error('ต้องกำหนดวันส่งต้นฉบับก่อนจึงจะขยายเวลาได้');const original=new Date(settings.DUE_DATE);if(d<=original)throw new Error('วันขยายกำหนดส่งต้องอยู่หลังวันกำหนดส่งเดิม');
  const id=Utilities.getUuid();appendObject_('GROUP_DEADLINE_EXTENSIONS',{EXTENSION_ID:id,GROUP_ID:String(groupId),WEEK_NO:Number(weekNo),ORIGINAL_DUE_DATE:settings.DUE_DATE||'',NEW_DUE_DATE:d,REASON:note,APPROVED_BY:ctx.user.USER_ID,APPROVED_AT:new Date(),STATUS:'APPROVED'});
  logSystem_('PROGRESS_EXTENSION_GRANTED','GROUP',groupId,{weekNo:Number(weekNo),newDueDate:d.toISOString(),reason:note,extensionId:id},ctx.user.USER_ID);
  enqueueGroupNotification_(groupId,'DEADLINE_EXTENSION','ขยายกำหนดส่งงาน','กำหนดส่งงานสัปดาห์ที่ '+weekNo+' ได้รับการขยายเวลาเป็น '+formatThaiDateTime_(d),'PROGRESS_WEEK',id);
  return {ok:true,extensionId:id,message:'บันทึกการขยายกำหนดส่งเฉพาะกลุ่มแล้ว (ไม่มีการหักคะแนนอัตโนมัติ)'};
}
function formatThaiDateTime_(d){return Utilities.formatDate(new Date(d),Session.getScriptTimeZone()||'Asia/Bangkok','dd/MM/yyyy HH:mm');}
function formatDateOnly_(d){if(!d)return '';const date=new Date(d);if(isNaN(date.getTime()))return '';return Utilities.formatDate(date,Session.getScriptTimeZone()||'Asia/Bangkok','yyyy-MM-dd');}
