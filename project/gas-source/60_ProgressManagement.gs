function studentMilestonePlan_(){
  return [
    {week:1,title:'ปฐมนิเทศและกำหนดความสนใจวิจัย'},
    {week:2,title:'พบอาจารย์ที่ปรึกษาครั้งที่ 1 และกำหนดปัญหาวิจัย'},
    {week:3,title:'พัฒนา Concept Paper และร่างบทที่ 1'},
    {week:4,title:'พบอาจารย์ที่ปรึกษาครั้งที่ 2 และปรับบทที่ 1'},
    {week:5,title:'อบรมจริยธรรมและจัดทำ Literature Matrix'},
    {week:6,title:'พบอาจารย์ที่ปรึกษาครั้งที่ 3 และวางโครงบทที่ 2'},
    {week:7,title:'สังเคราะห์ Research Gap และกรอบแนวคิด'},
    {week:8,title:'พบอาจารย์ที่ปรึกษาครั้งที่ 4 และทบทวนบทที่ 2'},
    {week:9,title:'ออกแบบวิธีดำเนินการวิจัยและร่างบทที่ 3'},
    {week:10,title:'พบอาจารย์ที่ปรึกษาครั้งที่ 5 และทบทวนบทที่ 3'},
    {week:11,title:'พัฒนาเครื่องมือและแผนตรวจสอบคุณภาพ'},
    {week:12,title:'พบอาจารย์ที่ปรึกษาครั้งที่ 6 และตรวจบทที่ 1–3'},
    {week:13,title:'บูรณาการโครงร่างและเตรียมนำเสนอ'},
    {week:14,title:'พบอาจารย์ที่ปรึกษาครั้งที่ 7 และตรวจฉบับสุดท้าย'},
    {week:15,title:'นำเสนอและส่งมอบโครงร่างฉบับสมบูรณ์'}
  ];
}

/** Default 15-week plan follows the approved 4084901 course calendar. */
function progressWeekSettings_(){
  ensureWorkflowSheet_('PROGRESS_WEEK_SETTINGS');
  const sh=sheet_('PROGRESS_WEEK_SETTINGS');
  let rows=readObjectsFresh_('PROGRESS_WEEK_SETTINGS');
  if(!rows.length){
    const plan=studentMilestonePlan_();
    plan.forEach(m=>appendObject_('PROGRESS_WEEK_SETTINGS',{
      WEEK_NO:m.week,TITLE:m.title,DESCRIPTION:'',DELIVERABLE:'',CRITERIA:'',
      IS_OPEN:'FALSE',UPDATED_AT:new Date(),UPDATED_BY:'SYSTEM_SEED'
    }));
    rows=readObjectsFresh_('PROGRESS_WEEK_SETTINGS');
  }
  const byWeek=new Map(rows.map(r=>[Number(r.WEEK_NO),r]));
  return studentMilestonePlan_().map(m=>{
    const r=byWeek.get(m.week)||{};
    return {
      week:Number(m.week),title:String(r.TITLE||m.title),
      description:String(r.DESCRIPTION||''),deliverable:String(r.DELIVERABLE||''),
      criteria:String(r.CRITERIA||''),isOpen:String(r.IS_OPEN).toUpperCase()==='TRUE',dueDate:r.DUE_DATE?formatDateOnly_(r.DUE_DATE):''
    };
  });
}

function apiAdminGetProgressManagement(token){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const settings=progressWeekSettings_();
  const groups=readObjectsFresh_('RESEARCH_GROUPS').filter(g=>g.STATUS==='ACTIVE');
  const students=readObjectsFresh_('STUDENTS');
  const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>m.STATUS==='ACTIVE');
  const assignments=readObjectsFresh_('ADVISOR_ASSIGNMENTS').filter(a=>a.STATUS==='APPROVED');
  const users=readObjectsFresh_('SYS_USERS').filter(u=>u.STATUS==='ACTIVE');
  const reports=readObjectsFresh_('PROGRESS_REPORTS');
  const advisorFeedbackRows=readObjectsFresh_('ADVISOR_FEEDBACK');
  const deadlineExtensions=readObjectsFresh_('GROUP_DEADLINE_EXTENSIONS');
  const groupMap=new Map(groups.map(g=>[String(g.GROUP_ID),g]));
  const studentMap=new Map(students.map(st=>[String(st.STUDENT_ID),st]));
  const userMap=new Map(users.map(u=>[String(u.USER_ID),u]));
  const membersByGroup=new Map();
  members.forEach(m=>{
    const key=String(m.GROUP_ID);if(!membersByGroup.has(key))membersByGroup.set(key,[]);
    const st=studentMap.get(String(m.STUDENT_ID))||{};
    membersByGroup.get(key).push({studentId:String(m.STUDENT_ID||''),name:String(st.FULL_NAME||[st.TITLE,st.FIRST_NAME,st.LAST_NAME].filter(Boolean).join(' ')||m.STUDENT_ID||'')});
  });
  const advisorByGroup=new Map();
  assignments.forEach(a=>{
    const u=userMap.get(String(a.ADVISOR_USER_ID));
    if(u)advisorByGroup.set(String(a.GROUP_ID),{userId:String(u.USER_ID),name:String(u.DISPLAY_NAME||u.EMAIL||'ไม่ระบุชื่อ')});
  });
  const latestByGroupWeek=new Map();
  reports.forEach(r=>{
    const key=String(r.GROUP_ID)+'|'+String(r.WEEK_NO),prev=latestByGroupWeek.get(key);
    if(!prev||new Date(r.SUBMITTED_AT||0)>=new Date(prev.SUBMITTED_AT||0))latestByGroupWeek.set(key,r);
  });
  const settingsByWeek=new Map(settings.map(w=>[Number(w.week),w]));
  const reviewerName=(id)=>{const u=userMap.get(String(id||''));return u?String(u.DISPLAY_NAME||u.EMAIL||''):'';};
  const reportRows=[];
  // Return one row per active group per week so the coordinator can also see groups that have not submitted.
  settings.forEach(w=>groups.forEach(g=>{
    const key=String(g.GROUP_ID)+'|'+String(w.week),r=latestByGroupWeek.get(key)||null;
    const advisor=advisorByGroup.get(String(g.GROUP_ID))||{userId:'',name:'ยังไม่ได้กำหนด'};
    const groupMembers=membersByGroup.get(String(g.GROUP_ID))||[];
    const feedbackRows=advisorFeedbackRows.filter(f=>String(f.GROUP_ID)===String(g.GROUP_ID)&&String(f.STATUS||'ACTIVE')==='ACTIVE'&&r&&(!f.RELATED_ID||String(f.RELATED_ID)===String(r.REPORT_ID)));
    const extension=deadlineExtensions.filter(x=>String(x.GROUP_ID)===String(g.GROUP_ID)&&Number(x.WEEK_NO)===Number(w.week)&&x.STATUS==='APPROVED').sort((a,b)=>new Date(b.APPROVED_AT)-new Date(a.APPROVED_AT))[0];
    reportRows.push({
      reportId:r?String(r.REPORT_ID):'',groupId:String(g.GROUP_ID),groupName:String(g.GROUP_NAME||'ไม่พบชื่อกลุ่ม'),hasAdvisorFeedback:feedbackRows.length>0,advisorFeedbackCount:feedbackRows.length,dueDate:w.dueDate||'',effectiveDueDate:extension?formatDateOnly_(extension.NEW_DUE_DATE):(w.dueDate||''),timelinessStatus:String(r&&r.TIMELINESS_STATUS||''),revisionDueAt:r&&r.REVISION_DUE_AT||'',extensionId:r&&r.EXTENSION_ID||'',
      topicTitle:String(g.TOPIC_TITLE_TH||''),advisorName:advisor.name,advisorUserId:advisor.userId,
      weekNo:Number(w.week),weekTitle:String(w.title||''),weekIsOpen:!!w.isOpen,
      milestone:String(r&&r.MILESTONE||w.title||''),workCompleted:String(r&&r.WORK_COMPLETED||''),
      problems:String(r&&r.PROBLEMS||''),nextActions:String(r&&r.NEXT_ACTIONS||''),
      submittedAt:r?r.SUBMITTED_AT:'',status:r?String(r.STATUS||'SUBMITTED'):'NOT_SUBMITTED',
      reviewComment:String(r&&r.REVIEW_COMMENT||''),reviewedAt:r?r.REVIEWED_AT:'',
      reviewedByName:r?reviewerName(r.REVIEWED_BY):'',members:groupMembers
    });
  }));
  reportRows.sort((a,b)=>a.weekNo-b.weekNo||a.groupName.localeCompare(b.groupName,'th'));
  const totals={groups:groups.length,weeks:settings.length,reports:reports.length,openWeeks:settings.filter(w=>w.isOpen).length};
  return sanitizeForClient_({settings,reports:reportRows,groups:groups.map(g=>({groupId:String(g.GROUP_ID),groupName:String(g.GROUP_NAME||''),advisorName:(advisorByGroup.get(String(g.GROUP_ID))||{}).name||'ยังไม่ได้กำหนด'})),totals});
}

function apiAdminSaveProgressWeek(token,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN]);payload=payload||{};
  const week=Number(payload.weekNo);
  if(!Number.isInteger(week)||week<1||week>15)throw new Error('สัปดาห์ต้องอยู่ระหว่าง 1–15');
  const title=String(payload.title||'').trim();
  if(!title)throw new Error('กรุณาระบุหัวข้อประจำสัปดาห์');
  if(title.length>200)throw new Error('หัวข้อต้องไม่เกิน 200 ตัวอักษร');
  const dueDate=payload.dueDate?new Date(payload.dueDate):'';if(dueDate&&isNaN(dueDate.getTime()))throw new Error('กำหนดส่งไม่ถูกต้อง');
  const sh=ensureWorkflowSheet_('PROGRESS_WEEK_SETTINGS');
  const row=readObjectsFresh_('PROGRESS_WEEK_SETTINGS').find(r=>Number(r.WEEK_NO)===week);
  const values={WEEK_NO:week,TITLE:title,DESCRIPTION:String(payload.description||'').trim(),
    DELIVERABLE:String(payload.deliverable||'').trim(),CRITERIA:String(payload.criteria||'').trim(),
    IS_OPEN:payload.isOpen===true?'TRUE':'FALSE',UPDATED_AT:new Date(),UPDATED_BY:ctx.user.USER_ID,DUE_DATE:payload.dueDate===undefined?(row&&row.DUE_DATE||''):dueDate};
  if(row){
    const headers=SCHEMA.PROGRESS_WEEK_SETTINGS;
    headers.forEach((h,i)=>sh.getRange(row._row,i+1).setValue(values[h]===undefined?'':values[h]));
  }else appendObject_('PROGRESS_WEEK_SETTINGS',values);
  logSystem_('PROGRESS_WEEK_CONFIG_SAVED','COURSE_WEEK',String(week),{isOpen:values.IS_OPEN,title},ctx.user.USER_ID);
  return {ok:true,message:'บันทึกการตั้งค่าสัปดาห์ที่ '+week+' แล้ว'};
}

function apiAdminReviewProgressReport(token,reportId,decision,comment){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const allowed=['APPROVED','REVISION_REQUIRED'];
  if(!allowed.includes(String(decision)))throw new Error('ผลการพิจารณาไม่ถูกต้อง');
  const note=String(comment||'').trim();
  if(decision==='REVISION_REQUIRED'&&note.length<5)throw new Error('กรุณาระบุเหตุผลที่ส่งกลับแก้ไขอย่างน้อย 5 ตัวอักษร');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const sh=sheet_('PROGRESS_REPORTS');
    const row=readObjectsFresh_('PROGRESS_REPORTS').find(r=>String(r.REPORT_ID)===String(reportId));
    if(!row)throw new Error('ไม่พบรายงานความก้าวหน้า');
    if(!['SUBMITTED','RESUBMITTED'].includes(String(row.STATUS)))throw new Error('รายงานนี้ได้รับการพิจารณาไปแล้ว หรือไม่อยู่ในสถานะรอตรวจ');
    const headers=SCHEMA.PROGRESS_REPORTS;
    const set=(key,value)=>sh.getRange(row._row,headers.indexOf(key)+1).setValue(value);
    set('STATUS',decision);set('REVIEWED_BY',ctx.user.USER_ID);set('REVIEWED_AT',new Date());set('REVIEW_COMMENT',note);
    logSystem_('PROGRESS_REPORT_REVIEWED','PROGRESS_REPORT',String(reportId),{decision,comment:note,groupId:String(row.GROUP_ID),weekNo:Number(row.WEEK_NO)},ctx.user.USER_ID);
    enqueueGroupNotification_(row.GROUP_ID,'PROGRESS_REVIEW_'+decision,'ผลการตรวจรายงานความก้าวหน้า',decision==='APPROVED'?'รายงานสัปดาห์ที่ '+row.WEEK_NO+' ได้รับอนุมัติแล้ว':'รายงานสัปดาห์ที่ '+row.WEEK_NO+' ต้องปรับปรุง: '+note,'PROGRESS_REPORT',String(reportId));
    return {ok:true,message:decision==='APPROVED'?'อนุมัติรายงานความก้าวหน้าแล้ว':'ส่งรายงานกลับให้แก้ไขแล้ว'};
  }finally{lock.releaseLock();}
}

function migrateProgressWorkflowSchema_(){
  requireDatabase_();
  const created=[],verified=[];
  ['PROGRESS_REPORTS','PROGRESS_WEEK_SETTINGS'].forEach(name=>{
    const ss=db_(),before=ss.getSheetByName(name);
    ensureWorkflowSheet_(name);
    (before?verified:created).push(name);
  });
  const settings=progressWeekSettings_();
  return {ok:true,created,verified,weekCount:settings.length,message:'เตรียมโครงสร้างรายงานความก้าวหน้า 15 สัปดาห์เรียบร้อยแล้ว'};
}
