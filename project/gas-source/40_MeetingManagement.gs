
function apiRecordMeetingAttendance(token,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR]);assertGradeEditable_();payload=payload||{};
  const groupId=String(payload.groupId||''),no=Number(payload.meetingNo),week=[2,4,6,8,10,12,14][no-1];
  if(!week||Number(payload.meetingWeek)!==week)throw new Error('ครั้งที่พบอาจารย์ต้องตรงกับสัปดาห์ที่กำหนด 2,4,6,8,10,12,14');
  assertGroupAccess_(ctx,groupId);
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const members=readObjects_('GROUP_MEMBERS').filter(m=>m.GROUP_ID===groupId&&m.STATUS==='ACTIVE');if(!members.length)throw new Error('กลุ่มนี้ยังไม่มีสมาชิก');
    const attendance=payload.attendance||{},sh=sheet_('MEETING_RECORDS'),existing=findObjectsByColumnValue_('MEETING_RECORDS','GROUP_ID',groupId);
    members.forEach(m=>{
      const status=attendance[String(m.STUDENT_ID)]==='PRESENT'?'PRESENT':'ABSENT';
      const old=existing.find(r=>r.GROUP_ID===groupId&&Number(r.MEETING_NO)===no&&String(r.STUDENT_ID)===String(m.STUDENT_ID));
      const vals={MEETING_ID:old?old.MEETING_ID:Utilities.getUuid(),GROUP_ID:groupId,MEETING_NO:no,MEETING_WEEK:week,MEETING_DATE:payload.meetingDate?new Date(payload.meetingDate):new Date(),STUDENT_ID:String(m.STUDENT_ID),ATTENDANCE_STATUS:status,NOTES:String(payload.notes||''),RECORDED_BY:ctx.user.USER_ID,UPDATED_AT:new Date()};
      if(old)SCHEMA.MEETING_RECORDS.forEach((h,i)=>sh.getRange(old._row,i+1).setValue(vals[h]===undefined?'':vals[h]));
      else appendObject_('MEETING_RECORDS',vals);
    });
    invalidateReadCache_('MEETING_RECORDS');
    SpreadsheetApp.flush();
    logSystem_('MEETING_ATTENDANCE_RECORDED','GROUP',groupId,{meetingNo:no,week},ctx.user.USER_ID);
    return {ok:true,message:'บันทึกการเข้าพบรายบุคคลแล้ว'};
  }finally{lock.releaseLock();}
}

/**
 * Online meeting report form: one current report per group and meeting number.
 * Students may save drafts or submit; assigned advisors may read/review.
 */
function apiListMeetingReports(token,groupId,meetingNo){
  const ctx=requireSession_(token,[ROLE.STUDENT,ROLE.ADVISOR,ROLE.ADMIN]);
  groupId=String(groupId||'').trim();meetingNo=Number(meetingNo);
  if(!groupId||!Number.isInteger(meetingNo)||meetingNo<1||meetingNo>7)throw new Error('ข้อมูลกลุ่มหรือครั้งที่เข้าพบไม่ถูกต้อง');
  assertGroupAccess_(ctx,groupId);
  const rows=readObjectsFresh_('MEETING_REPORTS').filter(r=>String(r.GROUP_ID)===groupId&&Number(r.MEETING_NO)===meetingNo)
    .sort((a,b)=>Number(b.VERSION||0)-Number(a.VERSION||0)||new Date(b.UPDATED_AT||0)-new Date(a.UPDATED_AT||0));
  const r=rows[0];
  if(!r)return {report:null,canEdit:ctx.user.ROLE_ID===ROLE.STUDENT,canReview:ctx.user.ROLE_ID===ROLE.ADVISOR};
  return sanitizeForClient_({report:{
    reportId:String(r.REPORT_ID),groupId:String(r.GROUP_ID),meetingNo:Number(r.MEETING_NO),meetingWeek:Number(r.MEETING_WEEK),
    meetingDate:r.MEETING_DATE?formatDateOnly_(r.MEETING_DATE):'',preparationProgress:String(r.PREPARATION_PROGRESS||''),
    agenda:[String(r.AGENDA_1||''),String(r.AGENDA_2||''),String(r.AGENDA_3||'')],problems:String(r.PROBLEMS||''),
    consultationSummary:String(r.CONSULTATION_SUMMARY||''),
    nextActions:[String(r.NEXT_ACTION_1||''),String(r.NEXT_ACTION_2||''),String(r.NEXT_ACTION_3||'')],
    dueDates:[r.DUE_DATE_1?formatDateOnly_(r.DUE_DATE_1):'',r.DUE_DATE_2?formatDateOnly_(r.DUE_DATE_2):'',r.DUE_DATE_3?formatDateOnly_(r.DUE_DATE_3):''],
    status:String(r.STATUS||'DRAFT'),createdAt:r.CREATED_AT?new Date(r.CREATED_AT).toISOString():'',
    updatedAt:r.UPDATED_AT?new Date(r.UPDATED_AT).toISOString():'',
    submittedAt:r.SUBMITTED_AT?new Date(r.SUBMITTED_AT).toISOString():'',
    reviewedAt:r.REVIEWED_AT?new Date(r.REVIEWED_AT).toISOString():'',
    reviewComment:String(r.REVIEW_COMMENT||''),version:Number(r.VERSION||1)
  },canEdit:ctx.user.ROLE_ID===ROLE.STUDENT&&['DRAFT','REVISION_REQUIRED'].includes(String(r.STATUS)),canReview:ctx.user.ROLE_ID===ROLE.ADVISOR&&['SUBMITTED','REVISION_REQUIRED'].includes(String(r.STATUS))});
}

/** Student group representative saves or submits structured meeting report. */
function apiSaveMeetingReport(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);payload=payload||{};
  const groupId=String(payload.groupId||'').trim(),no=Number(payload.meetingNo),week=[2,4,6,8,10,12,14][no-1];
  if(!groupId||!week)throw new Error('กรุณาเลือกกลุ่มและครั้งที่เข้าพบให้ถูกต้อง');
  assertGroupAccess_(ctx,groupId);
  const text=(v,max)=>String(v||'').trim().slice(0,max);
  const p={
    meetingDate:String(payload.meetingDate||'').trim(),
    preparationProgress:text(payload.preparationProgress,4000),
    agenda:[text(Array.isArray(payload.agenda)?payload.agenda[0]:payload.agenda,4000)],
    problems:text(payload.problems,4000),
    consultationSummary:text(payload.consultationSummary,5000),
    nextActions:[text(Array.isArray(payload.nextActions)?payload.nextActions[0]:payload.nextActions,4000)],
    dueDates:[String(Array.isArray(payload.dueDates)?(payload.dueDates[0]||''):(payload.dueDates||'')).trim()]
  };
  const validDateOnly=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(new Date(s+'T00:00:00').getTime())&&Utilities.formatDate(new Date(s+'T00:00:00'),Session.getScriptTimeZone(),'yyyy-MM-dd')===s;
  const isSubmit=String(payload.action||'DRAFT')==='SUBMIT';
  if(p.meetingDate&&!validDateOnly(p.meetingDate))throw new Error('วันที่เข้าพบไม่ถูกต้อง');
  if(p.dueDates.some(x=>x&&!validDateOnly(x)))throw new Error('กำหนดส่งงานไม่ถูกต้อง');
  if(isSubmit&&(!p.meetingDate||!p.preparationProgress||!p.agenda[0]||!p.problems||!p.consultationSummary||!p.nextActions[0]||!p.dueDates[0]))throw new Error('กรุณากรอกข้อมูลให้ครบก่อนส่ง รวมถึงวันที่เข้าพบ ประเด็นที่ต้องการปรึกษา งานที่ต้องดำเนินการ และกำหนดส่ง');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const sh=sheet_('MEETING_REPORTS'),rows=readObjectsFresh_('MEETING_REPORTS').filter(r=>String(r.GROUP_ID)===groupId&&Number(r.MEETING_NO)===no).sort((a,b)=>Number(b.VERSION||0)-Number(a.VERSION||0));
    const old=rows[0],now=new Date(),status=isSubmit?'SUBMITTED':'DRAFT';
    if(old&&!['DRAFT','REVISION_REQUIRED'].includes(String(old.STATUS)))throw new Error('บันทึกครั้งนี้ถูกส่งแล้วหรืออาจารย์ตรวจแล้ว ไม่สามารถแก้ไขได้');
    const vals={
      REPORT_ID:old?old.REPORT_ID:Utilities.getUuid(),GROUP_ID:groupId,MEETING_NO:no,MEETING_WEEK:week,MEETING_DATE:p.meetingDate?new Date(p.meetingDate+'T00:00:00'):'',
      PREPARATION_PROGRESS:p.preparationProgress,AGENDA_1:p.agenda[0],AGENDA_2:'',AGENDA_3:'',PROBLEMS:p.problems,
      CONSULTATION_SUMMARY:p.consultationSummary,NEXT_ACTION_1:p.nextActions[0],DUE_DATE_1:p.dueDates[0]?new Date(p.dueDates[0]+'T00:00:00'):'',
      NEXT_ACTION_2:'',DUE_DATE_2:'',NEXT_ACTION_3:'',DUE_DATE_3:'',
      STATUS,CREATED_BY:old?old.CREATED_BY:ctx.user.USER_ID,UPDATED_BY:ctx.user.USER_ID,CREATED_AT:old?old.CREATED_AT:now,UPDATED_AT:now,
      SUBMITTED_AT:status==='SUBMITTED'?now:'',REVIEWED_BY:'',REVIEWED_AT:'',REVIEW_COMMENT:'',VERSION:old?Number(old.VERSION||1):1
    };
    if(old){const headers=SCHEMA.MEETING_REPORTS;sh.getRange(old._row,1,1,headers.length).setValues([headers.map(h=>vals[h]===undefined?'':vals[h])]);}
    else appendObject_('MEETING_REPORTS',vals);
    SpreadsheetApp.flush();logSystem_(status==='SUBMITTED'?'MEETING_REPORT_SUBMITTED':'MEETING_REPORT_DRAFT_SAVED','GROUP',groupId,{meetingNo:no,reportId:vals.REPORT_ID},ctx.user.USER_ID);
    return {ok:true,message:status==='SUBMITTED'?'ส่งบันทึกการเข้าพบแล้ว':'บันทึกฉบับร่างแล้ว',status};
  }finally{lock.releaseLock();}
}

/** Assigned advisor reviews a structured online meeting report. */
function apiAdvisorReviewMeetingReport(token,reportId,decision,comment){
  const ctx=requireSession_(token,[ROLE.ADVISOR]);
  if(!['VERIFIED','REVISION_REQUIRED'].includes(String(decision)))throw new Error('สถานะตรวจสอบไม่ถูกต้อง');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const rows=readObjectsFresh_('MEETING_REPORTS'),row=rows.find(r=>String(r.REPORT_ID)===String(reportId));
    if(!row)throw new Error('ไม่พบแบบบันทึกการเข้าพบ');
    assertGroupAccess_(ctx,String(row.GROUP_ID));
    const latest=rows.filter(r=>String(r.GROUP_ID)===String(row.GROUP_ID)&&Number(r.MEETING_NO)===Number(row.MEETING_NO)).sort((a,b)=>Number(b.VERSION||0)-Number(a.VERSION||0))[0];
    if(!latest||String(latest.REPORT_ID)!==String(row.REPORT_ID))throw new Error('บันทึกนี้ไม่ใช่ฉบับล่าสุด');
    if(!['SUBMITTED','REVISION_REQUIRED'].includes(String(row.STATUS)))throw new Error('สถานะบันทึกไม่สามารถตรวจได้');
    const sh=sheet_('MEETING_REPORTS'),headers=SCHEMA.MEETING_REPORTS,now=new Date();
    const vals={...row,STATUS:decision,REVIEWED_BY:ctx.user.USER_ID,REVIEWED_AT:now,REVIEW_COMMENT:String(comment||'').trim().slice(0,2000),UPDATED_BY:ctx.user.USER_ID,UPDATED_AT:now};
    sh.getRange(row._row,1,1,headers.length).setValues([headers.map(h=>vals[h]===undefined?'':vals[h])]);
    SpreadsheetApp.flush();logSystem_('MEETING_REPORT_REVIEWED','GROUP',row.GROUP_ID,{meetingNo:row.MEETING_NO,reportId,decision},ctx.user.USER_ID);
    return {ok:true,message:decision==='VERIFIED'?'อาจารย์ตรวจบันทึกแล้ว':'ส่งบันทึกกลับให้นักศึกษาแก้ไขแล้ว'};
  }finally{lock.releaseLock();}
}

/**
 * Student-only meeting report submission to a private Drive folder.
 * Maximum upload size: 8 MB. Advisor verifies; Admin has read-only monitoring.
 */
function apiUploadMeetingPdf(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);
  payload=payload||{};
  const groupId=String(payload.groupId||'').trim();
  const meetingNo=Number(payload.meetingNo);
  const weeks=[2,4,6,8,10,12,14];
  const week=weeks[meetingNo-1];
  if(!groupId||!week) throw new Error('กรุณาเลือกกลุ่มและครั้งที่เข้าพบให้ถูกต้อง');
  assertGroupAccess_(ctx,groupId);
  const fileName=String(payload.fileName||'รายงานการเข้าพบ.pdf').trim();
  if(!/\.pdf$/i.test(fileName)) throw new Error('อนุญาตให้อัปโหลดเฉพาะไฟล์ PDF');
  const base64=String(payload.base64||'').replace(/^data:application\/pdf;base64,/i,'').replace(/\s/g,'');
  if(!base64) throw new Error('ไม่พบข้อมูลไฟล์ PDF');
  if(base64.length>Math.ceil(8*1024*1024*4/3)+16) throw new Error('ไฟล์มีขนาดเกิน 8 MB');
  let bytes;
  try{bytes=Utilities.base64Decode(base64);}catch(e){throw new Error('ข้อมูลไฟล์ไม่ถูกต้อง กรุณาเลือก PDF ใหม่');}
  if(bytes.length>8*1024*1024) throw new Error('ไฟล์มีขนาดเกิน 8 MB');
  const signature=String.fromCharCode.apply(null,bytes.slice(0,5));
  if(signature!=='%PDF-') throw new Error('ไฟล์ที่เลือกไม่ใช่ PDF ที่ถูกต้อง');
  const safeName=fileName.replace(/[\\/:*?"<>|#%{}\[\]]/g,'_').slice(0,140);
  let driveFile=null;
  try{
    const props=PropertiesService.getScriptProperties();
    let folderId=props.getProperty('MEETING_REPORTS_FOLDER_ID');
    let folder=null;
    if(folderId){try{folder=DriveApp.getFolderById(folderId);}catch(e){folder=null;}}
    if(!folder){
      folder=DriveApp.createFolder('SPORT SCIENCE RESEARCH LAB - Meeting Reports');
      folder.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);
      props.setProperty('MEETING_REPORTS_FOLDER_ID',folder.getId());
    }
    const blob=Utilities.newBlob(bytes,'application/pdf',safeName);
    driveFile=folder.createFile(blob);
    driveFile.setDescription('Meeting report | Group '+groupId+' | Meeting '+meetingNo+' | Uploaded by '+ctx.user.USER_ID);
    driveFile.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);

    // Explicitly grant view access to only the users who need this group's report.
    const users=readObjects_('SYS_USERS').filter(u=>u.STATUS==='ACTIVE');
    const memberRows=readObjects_('GROUP_MEMBERS').filter(m=>m.GROUP_ID===groupId&&m.STATUS==='ACTIVE');
    const assignment=readObjects_('ADVISOR_ASSIGNMENTS').find(a=>a.GROUP_ID===groupId&&a.STATUS==='APPROVED');
    const allowedIds=new Set(memberRows.map(m=>m.USER_ID).filter(Boolean));
    if(assignment) allowedIds.add(assignment.ADVISOR_USER_ID);
    users.filter(u=>u.ROLE_ID===ROLE.ADMIN).forEach(u=>allowedIds.add(u.USER_ID));
    allowedIds.add(ctx.user.USER_ID);
    const eligibleUsers=users.filter(u=>allowedIds.has(u.USER_ID));
    const emails=[...new Set(eligibleUsers.map(u=>normalizeEmail_(u.EMAIL)).filter(Boolean))];
    const shareWarnings=eligibleUsers.filter(u=>!u.EMAIL).map(u=>'ไม่มีอีเมลในบัญชี: '+u.USER_ID);
    const effectiveEmail=normalizeEmail_(Session.getEffectiveUser().getEmail());
    emails.filter(email=>email!==effectiveEmail).forEach(email=>{try{driveFile.addViewer(email);}catch(e){shareWarnings.push(email);}});

    const lock=LockService.getScriptLock();
    if(!lock.tryLock(60000)) throw new Error('ระบบกำลังบันทึกข้อมูลจำนวนมาก กรุณาลองใหม่อีกครั้ง');
    try{
      const record={FILE_RECORD_ID:Utilities.getUuid(),GROUP_ID:groupId,MEETING_NO:meetingNo,MEETING_WEEK:week,FILE_NAME:safeName,MIME_TYPE:'application/pdf',FILE_SIZE:bytes.length,DRIVE_FILE_ID:driveFile.getId(),DRIVE_URL:driveFile.getUrl(),UPLOADED_BY:ctx.user.USER_ID,UPLOADED_AT:new Date(),STATUS:'SUBMITTED',NOTES:String(payload.notes||'').slice(0,1000),VERIFIED_BY:'',VERIFIED_AT:'',REVIEW_COMMENT:''};
      appendObject_('MEETING_FILES',record);
      logSystem_('MEETING_PDF_UPLOADED','GROUP',groupId,{meetingNo,fileName:safeName,fileSize:bytes.length,fileRecordId:record.FILE_RECORD_ID},ctx.user.USER_ID);
      return {ok:true,message:'ส่งบันทึกการเข้าพบสำเร็จ',file:{fileName:safeName,url:record.DRIVE_URL,size:bytes.length,uploadedAt:new Date().toISOString()},shareWarnings:shareWarnings};
    }finally{lock.releaseLock();}
  }catch(err){
    if(driveFile){try{driveFile.setTrashed(true);}catch(cleanupError){console.error('PDF cleanup failed: '+cleanupError.message);}}
    throw err;
  }
}

/** List meeting submissions only for users who can access the selected group. */
function apiListMeetingPdfs(token,groupId,meetingNo){
  const ctx=requireSession_(token,null); groupId=String(groupId||'').trim(); meetingNo=Number(meetingNo);
  if(!groupId||meetingNo<1||meetingNo>7) throw new Error('ข้อมูลกลุ่มหรือครั้งที่เข้าพบไม่ถูกต้อง');
  assertGroupAccess_(ctx,groupId);
  return readObjects_('MEETING_FILES').filter(f=>f.GROUP_ID===groupId&&Number(f.MEETING_NO)===meetingNo&&['SUBMITTED','VERIFIED','REVISION_REQUIRED','ACTIVE'].includes(String(f.STATUS)))
    .sort((a,b)=>new Date(b.UPLOADED_AT)-new Date(a.UPLOADED_AT))
    .map(f=>({fileRecordId:f.FILE_RECORD_ID,fileName:String(f.FILE_NAME),url:String(f.DRIVE_URL),size:Number(f.FILE_SIZE)||0,uploadedAt:f.UPLOADED_AT?new Date(f.UPLOADED_AT).toISOString():'',notes:String(f.NOTES||''),status:String(f.STATUS||'SUBMITTED'),reviewComment:String(f.REVIEW_COMMENT||''),verifiedAt:f.VERIFIED_AT?new Date(f.VERIFIED_AT).toISOString():''}));
}

/** Admin-only read-only monitoring across all active groups. */
function apiAdminGetMeetingMonitoring(token){
  requireSession_(token,[ROLE.ADMIN]);
  const groups=readObjectsFresh_('RESEARCH_GROUPS').filter(g=>g.STATUS==='ACTIVE');
  const reports=readObjectsFresh_('MEETING_REPORTS').filter(r=>['SUBMITTED','VERIFIED','REVISION_REQUIRED'].includes(String(r.STATUS)));
  const files=readObjectsFresh_('MEETING_FILES').filter(f=>['SUBMITTED','VERIFIED','REVISION_REQUIRED','ACTIVE'].includes(String(f.STATUS)));
  const recordedMeetings=readObjectsFresh_('MEETING_RECORDS');
  const assignments=readObjectsFresh_('ADVISOR_ASSIGNMENTS').filter(a=>a.STATUS==='APPROVED');
  const users=readObjectsFresh_('SYS_USERS'),weeks=[2,4,6,8,10,12,14];
  const rows=groups.map(g=>{
    const as=assignments.find(a=>a.GROUP_ID===g.GROUP_ID),au=as&&users.find(u=>u.USER_ID===as.ADVISOR_USER_ID);
    const meetings=weeks.map((w,i)=>{
      const online=reports.filter(r=>String(r.GROUP_ID)===String(g.GROUP_ID)&&Number(r.MEETING_NO)===i+1).sort((a,b)=>Number(b.VERSION||0)-Number(a.VERSION||0))[0];
      const legacy=files.filter(f=>String(f.GROUP_ID)===String(g.GROUP_ID)&&Number(f.MEETING_NO)===i+1).sort((a,b)=>new Date(b.UPLOADED_AT)-new Date(a.UPLOADED_AT))[0];
      const latest=online||legacy;
      const meetingOccurred=recordedMeetings.some(m=>String(m.GROUP_ID)===String(g.GROUP_ID)&&Number(m.MEETING_NO)===i+1);return {meetingNo:i+1,week:w,status:!latest?(meetingOccurred?'NOT_SUBMITTED':'UPCOMING'):String(latest.STATUS),reportId:online?String(online.REPORT_ID):'',fileName:legacy?String(legacy.FILE_NAME||''):'',uploadedAt:latest&&latest.SUBMITTED_AT?new Date(latest.SUBMITTED_AT).toISOString():latest&&latest.UPLOADED_AT?new Date(latest.UPLOADED_AT).toISOString():'',url:legacy?String(legacy.DRIVE_URL||''):'',reviewComment:latest?String(latest.REVIEW_COMMENT||''):''};
    });
    return {groupId:g.GROUP_ID,groupName:g.GROUP_NAME,advisor:au?au.DISPLAY_NAME:'ยังไม่กำหนด',meetings};
  });
  const all=rows.flatMap(x=>x.meetings);
  return sanitizeForClient_({groups:rows,summary:{groups:rows.length,total:all.length,due:all.filter(x=>x.status!=='UPCOMING').length,upcoming:all.filter(x=>x.status==='UPCOMING').length,submitted:all.filter(x=>['SUBMITTED','VERIFIED','REVISION_REQUIRED','ACTIVE'].includes(x.status)).length,verified:all.filter(x=>x.status==='VERIFIED').length,notSubmitted:all.filter(x=>x.status==='NOT_SUBMITTED').length,revision:all.filter(x=>x.status==='REVISION_REQUIRED').length}});
}

/**
 * Advisor-only meeting status matrix for assigned groups.
 * Returns status metadata only; full report content is read through apiListMeetingReports.
 */
function apiAdvisorGetMeetingMonitoring(token){
  const ctx=requireSession_(token,[ROLE.ADVISOR]);
  const assigned=getAdvisorAssignedGroups_(ctx.user.USER_ID);
  const groupIds=new Set(assigned.map(g=>String(g.groupId)));
  const reports=readObjectsFresh_('MEETING_REPORTS').filter(r=>groupIds.has(String(r.GROUP_ID||'')));
  const files=readObjectsFresh_('MEETING_FILES').filter(f=>groupIds.has(String(f.GROUP_ID||''))&&['SUBMITTED','VERIFIED','REVISION_REQUIRED','ACTIVE'].includes(String(f.STATUS||'').toUpperCase()));
  const records=readObjectsFresh_('MEETING_RECORDS').filter(m=>groupIds.has(String(m.GROUP_ID||'')));
  const weeks=[2,4,6,8,10,12,14];
  const groups=assigned.map(g=>({
    groupId:g.groupId,groupName:g.groupName,advisorUserId:String(ctx.user.USER_ID),
    meetings:weeks.map((week,i)=>{
      const no=i+1;
      const online=reports.filter(r=>String(r.GROUP_ID)===String(g.groupId)&&Number(r.MEETING_NO)===no)
        .sort((a,b)=>Number(b.VERSION||0)-Number(a.VERSION||0)||new Date(b.UPDATED_AT||0)-new Date(a.UPDATED_AT||0))[0];
      const legacy=files.filter(f=>String(f.GROUP_ID)===String(g.groupId)&&Number(f.MEETING_NO)===no)
        .sort((a,b)=>new Date(b.UPLOADED_AT||0)-new Date(a.UPLOADED_AT||0))[0];
      const meetingRecorded=records.some(m=>String(m.GROUP_ID)===String(g.groupId)&&Number(m.MEETING_NO)===no);
      return {
        meetingNo:no,week,status:online?String(online.STATUS||'DRAFT'):legacy?String(legacy.STATUS||'SUBMITTED'):meetingRecorded?'NOT_SUBMITTED':'UPCOMING',
        hasReport:!!online,hasLegacy:!!legacy,
        updatedAt:online&&online.UPDATED_AT?new Date(online.UPDATED_AT).toISOString():'',
        uploadedAt:legacy&&legacy.UPLOADED_AT?new Date(legacy.UPLOADED_AT).toISOString():'',
        reportId:online?String(online.REPORT_ID||''):''
      };
    })
  }));
  return sanitizeForClient_({groups});
}

/** Advisor verifies or requests revision of the latest group submission. */
function apiAdvisorReviewMeetingSubmission(token,fileRecordId,decision,comment){
  const ctx=requireSession_(token,[ROLE.ADVISOR]);
  if(!['VERIFIED','REVISION_REQUIRED'].includes(String(decision)))throw new Error('สถานะตรวจสอบไม่ถูกต้อง');
  const allFiles=readObjectsFresh_('MEETING_FILES');const row=allFiles.find(f=>String(f.FILE_RECORD_ID)===String(fileRecordId));
  if(!row)throw new Error('ไม่พบเอกสารที่ส่ง'); assertGroupAccess_(ctx,String(row.GROUP_ID));
  const latest=allFiles.filter(f=>String(f.GROUP_ID)===String(row.GROUP_ID)&&Number(f.MEETING_NO)===Number(row.MEETING_NO)).sort((a,b)=>new Date(b.UPLOADED_AT)-new Date(a.UPLOADED_AT))[0];
  if(!latest||String(latest.FILE_RECORD_ID)!==String(row.FILE_RECORD_ID))throw new Error('เอกสารนี้ไม่ใช่ฉบับล่าสุด กรุณาตรวจสอบฉบับที่นักศึกษาส่งล่าสุด');
  const sh=sheet_('MEETING_FILES'),headers=SCHEMA.MEETING_FILES;
  const set=(key,val)=>{const i=headers.indexOf(key);if(i>=0)sh.getRange(row._row,i+1).setValue(val);};
  set('STATUS',decision);set('VERIFIED_BY',ctx.user.USER_ID);set('VERIFIED_AT',new Date());set('REVIEW_COMMENT',String(comment||'').slice(0,1000));
  logSystem_('MEETING_SUBMISSION_REVIEWED','GROUP',row.GROUP_ID,{fileRecordId,decision},ctx.user.USER_ID);
  return {ok:true,message:decision==='VERIFIED'?'ตรวจสอบบันทึกการเข้าพบแล้ว':'ส่งกลับให้นักศึกษาแก้ไขแล้ว'};
}

/** Additive, non-destructive migration for meeting submission review metadata. */
function migrateMeetingFilesSchema_(){
  const dbId=requireDatabase_(),lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('ระบบกำลังทำงาน กรุณาลองใหม่');
  try{const ss=SpreadsheetApp.openById(dbId);let sh=ss.getSheetByName('MEETING_FILES');if(!sh){sh=ss.insertSheet('MEETING_FILES');sh.getRange(1,1,1,SCHEMA.MEETING_FILES.length).setValues([SCHEMA.MEETING_FILES]);sh.setFrozenRows(1);return {ok:true,added:SCHEMA.MEETING_FILES.length};}
    if(sh.getLastRow()===0||sh.getLastColumn()===0){sh.getRange(1,1,1,SCHEMA.MEETING_FILES.length).setValues([SCHEMA.MEETING_FILES]);sh.setFrozenRows(1);return {ok:true,added:SCHEMA.MEETING_FILES.length};}
    const current=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(String);const expected=SCHEMA.MEETING_FILES;
    if(current.length>expected.length||current.length<13||current.some((h,i)=>expected[i]!==h))throw new Error('หัวคอลัมน์ MEETING_FILES ไม่ตรงตาม Schema ที่รองรับ ระบบหยุดโดยไม่แก้ไขข้อมูล');
    const added=[];expected.slice(current.length).forEach(h=>{sh.getRange(1,sh.getLastColumn()+1).setValue(h);added.push(h);});
    return {ok:true,message:'ตรวจสอบ/เพิ่มคอลัมน์ข้อมูลตรวจสอบเอกสารสำเร็จ',added,rows:Math.max(0,sh.getLastRow()-1)};
  }finally{lock.releaseLock();}
}
