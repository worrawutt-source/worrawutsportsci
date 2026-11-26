
function studentGroupForUser_(ctx){
  const m=readObjects_('GROUP_MEMBERS').find(x=>(String(x.USER_ID)===String(ctx.user.USER_ID)||String(x.STUDENT_ID)===String(ctx.user.STUDENT_ID))&&x.STATUS==='ACTIVE');
  if(!m)throw new Error('ยังไม่ได้อยู่ในกลุ่มวิจัย');
  assertGroupAccess_(ctx,m.GROUP_ID);return m.GROUP_ID;
}
function migrateResearchTopicDraftSchema_(){
  requireDatabase_();
  ensureWorkflowSheet_('RESEARCH_TOPIC_DRAFTS');
  return {ok:true,message:'สร้างชีต RESEARCH_TOPIC_DRAFTS เรียบร้อยแล้ว'};
}
function assertStudentGroupLeader_(ctx){
  const groupId=studentGroupForUser_(ctx);
  const g=readObjects_('RESEARCH_GROUPS').find(x=>String(x.GROUP_ID)===String(groupId)&&x.STATUS==='ACTIVE');
  if(!g||!String(g.GROUP_LEADER_USER_ID||'')||String(g.GROUP_LEADER_USER_ID)!==String(ctx.user.USER_ID))
    throw new Error('เฉพาะหัวหน้ากลุ่มที่ Admin กำหนดเท่านั้นที่บันทึกร่างหรือส่งหัวข้อวิจัยได้');
  return {groupId,g};
}
function enqueueResearchTopicNotification_(groupId,type,title,message,relatedId){
  // Use the existing notification tables only. Never create sheets or run migrations here.
  const ss=db_();
  if(!ss.getSheetByName('NOTIFICATIONS')||!ss.getSheetByName('NOTIFICATION_QUEUE'))throw new Error('ไม่พบตารางแจ้งเตือนที่เตรียมไว้แล้ว กรุณาตรวจสอบ TEST schema โดยไม่รัน migration อัตโนมัติ');
  const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===String(groupId)&&m.STATUS==='ACTIVE');
  const users=readObjectsFresh_('SYS_USERS'),recipientIds=[];
  members.forEach(m=>{let userId=String(m.USER_ID||'');if(!userId){const linked=users.find(u=>u.ROLE_ID===ROLE.STUDENT&&String(u.STUDENT_ID)===String(m.STUDENT_ID)&&u.STATUS==='ACTIVE');if(linked)userId=String(linked.USER_ID);}if(userId)recipientIds.push(userId);});
  readObjectsFresh_('ADVISOR_ASSIGNMENTS').filter(a=>String(a.GROUP_ID)===String(groupId)&&a.STATUS==='APPROVED').forEach(a=>recipientIds.push(String(a.ADVISOR_USER_ID)));
  const existing=readObjectsFresh_('NOTIFICATIONS');
  [...new Set(recipientIds)].forEach(userId=>{
    const user=users.find(u=>String(u.USER_ID)===userId);if(!user)return;
    const eventKey=[type,relatedId,user.USER_ID].join(':');
    if(existing.some(n=>String(n.NOTIFICATION_ID)===eventKey))return;
    appendObject_('NOTIFICATIONS',{NOTIFICATION_ID:eventKey,USER_ID:user.USER_ID,GROUP_ID:groupId,TYPE:type,TITLE:title,MESSAGE:message,RELATED_TYPE:'RESEARCH_TOPIC',RELATED_ID:relatedId,IS_READ:'FALSE',CREATED_AT:new Date(),READ_AT:''});
    if(user.EMAIL)appendObject_('NOTIFICATION_QUEUE',{QUEUE_ID:Utilities.getUuid(),EVENT_KEY:eventKey,RECIPIENT_EMAIL:user.EMAIL,RECIPIENT_USER_ID:user.USER_ID,SUBJECT:title,BODY:message,STATUS:'PENDING',ATTEMPTS:0,NEXT_ATTEMPT_AT:new Date(),LEASE_UNTIL:'',LAST_ERROR:'',CREATED_AT:new Date(),SENT_AT:''});
  });
}
function latestResearchTopicVersion_(groupId){
  return findObjectsByColumnValue_('RESEARCH_TOPIC_VERSIONS','GROUP_ID',groupId).sort((a,b)=>Number(b.VERSION_NO||0)-Number(a.VERSION_NO||0))[0]||null;
}
function assertResearchTopicEditable_(latest){
  if(!latest)return;
  const status=String(latest.REVIEW_STATUS||'');
  if(status==='PENDING')throw new Error('หัวข้อวิจัยอยู่ระหว่างการพิจารณาของอาจารย์ที่ปรึกษา ไม่สามารถส่งซ้ำได้');
  if(status==='APPROVED'||String(latest.STATUS)==='ADVISOR_APPROVED')throw new Error('อาจารย์ที่ปรึกษาเห็นชอบแล้ว ขั้นตอน RW-01 สิ้นสุดในระดับที่ปรึกษา');
  if(status==='REJECTED')throw new Error('หัวข้อวิจัยไม่ผ่านความเห็นชอบ การเริ่มส่งหัวข้อใหม่ต้องได้รับการดำเนินการตามแนวทางที่ผู้รับผิดชอบรายวิชากำหนด');
  if(status!=='REVISION_REQUIRED')throw new Error('สถานะหัวข้อวิจัยไม่อนุญาตให้ส่งฉบับใหม่');
}
function apiGetResearchTopicDraft(token){
  const ctx=requireSession_(token,[ROLE.STUDENT]);const {groupId}=assertStudentGroupLeader_(ctx);
  const row=readObjectsFresh_('RESEARCH_TOPIC_DRAFTS').find(x=>String(x.GROUP_ID||'').trim()===String(groupId||'').trim()&&String(x.STATUS||'').trim().toUpperCase()==='DRAFT');
  if(row)return {draft:{titleTh:row.TITLE_TH||'',titleEn:row.TITLE_EN||'',problem:row.PROBLEM_STATEMENT||'',objectives:row.OBJECTIVES||'',significance:row.RESEARCH_SIGNIFICANCE||'',updatedAt:row.UPDATED_AT instanceof Date?row.UPDATED_AT.getTime():String(row.UPDATED_AT||''),source:'DRAFT'}};
  const latest=latestResearchTopicVersion_(groupId);
  if(latest&&latest.REVIEW_STATUS==='REVISION_REQUIRED')return {draft:{titleTh:latest.TITLE_TH||'',titleEn:latest.TITLE_EN||'',problem:latest.PROBLEM_STATEMENT||'',objectives:latest.OBJECTIVES||'',significance:latest.RESEARCH_SIGNIFICANCE||'',updatedAt:latest.SUBMITTED_AT instanceof Date?latest.SUBMITTED_AT.getTime():String(latest.SUBMITTED_AT||''),source:'REVISION_REQUIRED',versionNo:Number(latest.VERSION_NO)||0,reviewComment:latest.REVIEW_COMMENT||''}};
  return {draft:null};
}
function apiSaveResearchTopicDraft(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);payload=payload||{};const {groupId}=assertStudentGroupLeader_(ctx);
  const values={TITLE_TH:String(payload.titleTh||'').slice(0,500),TITLE_EN:String(payload.titleEn||'').slice(0,500),PROBLEM_STATEMENT:String(payload.problem||'').slice(0,10000),OBJECTIVES:String(payload.objectives||'').slice(0,5000),RESEARCH_SIGNIFICANCE:String(payload.significance||'').slice(0,5000)};
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const latest=latestResearchTopicVersion_(groupId);if(latest)assertResearchTopicEditable_(latest);
    const sh=sheet_('RESEARCH_TOPIC_DRAFTS'),rows=readObjectsFresh_('RESEARCH_TOPIC_DRAFTS');
    const current=rows.find(x=>String(x.GROUP_ID).trim()===String(groupId).trim()&&String(x.STATUS||'').trim().toUpperCase()==='DRAFT'),now=new Date();
    const headers=SCHEMA.RESEARCH_TOPIC_DRAFTS,draftId=String(current&&current.DRAFT_ID||Utilities.getUuid());
    let targetRow=current?Number(current._row):0;
    if(current){
      Object.keys(values).forEach(k=>{const col=headers.indexOf(k);if(col<0)throw new Error('ไม่พบคอลัมน์ร่างหัวข้อ: '+k);sh.getRange(targetRow,col+1).setValue(values[k]);});
      const idCol=headers.indexOf('DRAFT_ID');if(idCol<0)throw new Error('ไม่พบคอลัมน์ DRAFT_ID ในชีตร่างหัวข้อ');
      if(!current.DRAFT_ID)sh.getRange(targetRow,idCol+1).setValue(draftId);
      sh.getRange(targetRow,headers.indexOf('UPDATED_BY')+1).setValue(ctx.user.USER_ID);
      sh.getRange(targetRow,headers.indexOf('UPDATED_AT')+1).setValue(now);
    }else{
      appendObject_('RESEARCH_TOPIC_DRAFTS',Object.assign({DRAFT_ID:draftId,GROUP_ID:groupId},values,{STATUS:'DRAFT',UPDATED_BY:ctx.user.USER_ID,UPDATED_AT:now}));
      targetRow=sh.getLastRow();
    }
    SpreadsheetApp.flush();
    const saved=readObjectsFresh_('RESEARCH_TOPIC_DRAFTS').find(x=>Number(x._row)===targetRow);
    if(!saved||String(saved.DRAFT_ID||'')!==draftId||String(saved.GROUP_ID||'').trim()!==String(groupId).trim()||String(saved.STATUS||'').trim().toUpperCase()!=='DRAFT'){
      throw new Error('บันทึกร่างแล้ว แต่ไม่สามารถยืนยันแถวข้อมูลที่บันทึกได้ กรุณาตรวจสอบชีตร่างหัวข้อ');
    }
    const persisted={titleTh:String(saved.TITLE_TH||''),titleEn:String(saved.TITLE_EN||''),problem:String(saved.PROBLEM_STATEMENT||''),objectives:String(saved.OBJECTIVES||''),significance:String(saved.RESEARCH_SIGNIFICANCE||''),updatedAt:saved.UPDATED_AT||now};
    const normalize=value=>String(value===undefined||value===null?'':value).replace(/\r\n?/g,'\n').trim();
    const fieldMap={TITLE_TH:'titleTh',TITLE_EN:'titleEn',PROBLEM_STATEMENT:'problem',OBJECTIVES:'objectives',RESEARCH_SIGNIFICANCE:'significance'};
    const verified=Object.keys(values).every(k=>normalize(persisted[fieldMap[k]])===normalize(values[k]));
    if(!verified)return {ok:false,saved:true,verified:false,message:'บันทึกร่างลงชีตแล้ว แต่ข้อมูลที่อ่านกลับยังไม่ตรงกับข้อมูลที่ส่ง กรุณาตรวจสอบข้อมูลร่างก่อนส่งซ้ำ',updatedAt:persisted.updatedAt instanceof Date?persisted.updatedAt.getTime():String(persisted.updatedAt||''),draft:Object.assign({},persisted,{updatedAt:persisted.updatedAt instanceof Date?persisted.updatedAt.getTime():String(persisted.updatedAt||'')})};
    return {ok:true,saved:true,verified:true,message:'บันทึกร่างหัวข้อวิจัยแล้ว ยังไม่ส่งให้อาจารย์พิจารณา',updatedAt:persisted.updatedAt instanceof Date?persisted.updatedAt.getTime():String(persisted.updatedAt||''),draft:Object.assign({},persisted,{updatedAt:persisted.updatedAt instanceof Date?persisted.updatedAt.getTime():String(persisted.updatedAt||'')})};
  }finally{lock.releaseLock();}
}
function apiStudentSaveResearchTopic(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);payload=payload||{};const {groupId}=assertStudentGroupLeader_(ctx);
  const titleTh=String(payload.titleTh||'').trim(),titleEn=String(payload.titleEn||'').trim();
  if(!titleTh)throw new Error('กรุณาระบุชื่อเรื่องวิจัยภาษาไทย');
  if(titleTh.length>500||titleEn.length>500)throw new Error('ชื่อเรื่องต้องมีความยาวไม่เกิน 500 ตัวอักษร');
  const problem=String(payload.problem||'').trim(),objectives=String(payload.objectives||'').trim(),significance=String(payload.significance||'').trim();
  if(problem.length<20||problem.length>10000)throw new Error('ช่องปัญหาวิจัยต้องมี 20–10,000 ตัวอักษร');
  if(objectives.length<10||objectives.length>5000)throw new Error('ช่องวัตถุประสงค์ต้องมี 10–5,000 ตัวอักษร');
  if(significance.length>5000)throw new Error('ช่องความสำคัญของการวิจัยต้องมีความยาวไม่เกิน 5,000 ตัวอักษร');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const group=readObjectsFresh_('RESEARCH_GROUPS').find(x=>String(x.GROUP_ID)===String(groupId)&&x.STATUS==='ACTIVE');
    if(!group||String(group.GROUP_LEADER_USER_ID||'')!==String(ctx.user.USER_ID))throw new Error('เฉพาะหัวหน้ากลุ่มที่ Admin กำหนดเท่านั้นที่ส่งหรือปรับปรุงหัวข้อวิจัยได้');
    const latest=latestResearchTopicVersion_(groupId);if(latest)assertResearchTopicEditable_(latest);
    const versions=findObjectsByColumnValue_('RESEARCH_TOPIC_VERSIONS','GROUP_ID',groupId),versionNo=versions.reduce((n,x)=>Math.max(n,Number(x.VERSION_NO)||0),0)+1,now=new Date(),id=Utilities.getUuid();
    appendObject_('RESEARCH_TOPIC_VERSIONS',{VERSION_ID:id,GROUP_ID:groupId,VERSION_NO:versionNo,TITLE_TH:titleTh,TITLE_EN:titleEn,PROBLEM_STATEMENT:problem,OBJECTIVES:objectives,RESEARCH_SIGNIFICANCE:significance,STATUS:'SUBMITTED',REVIEW_STATUS:'PENDING',SUBMITTED_BY:ctx.user.USER_ID,SUBMITTED_AT:now,REVIEWED_BY:'',REVIEWED_AT:'',REVIEW_COMMENT:''});
    const groupSheet=sheet_('RESEARCH_GROUPS');groupSheet.getRange(group._row,3).setValue(titleTh);groupSheet.getRange(group._row,4).setValue(titleEn);groupSheet.getRange(group._row,8).setValue(now);
    const draft=readObjectsFresh_('RESEARCH_TOPIC_DRAFTS').find(x=>String(x.GROUP_ID)===String(groupId)&&x.STATUS==='DRAFT');
    if(draft){const draftSheet=sheet_('RESEARCH_TOPIC_DRAFTS');draftSheet.getRange(draft._row,SCHEMA.RESEARCH_TOPIC_DRAFTS.indexOf('STATUS')+1).setValue('SUBMITTED');}
    logSystem_('RESEARCH_TOPIC_SUBMITTED','GROUP',groupId,{versionNo,titleTh},ctx.user.USER_ID);
    try{enqueueResearchTopicNotification_(groupId,'RESEARCH_TOPIC_SUBMITTED','ส่งหัวข้อวิจัยให้อาจารย์พิจารณา','กลุ่มของท่านส่งหัวข้อวิจัยเวอร์ชัน '+versionNo+' ให้อาจารย์ที่ปรึกษาพิจารณาแล้ว',id);}
    catch(notificationError){logSystem_('RESEARCH_TOPIC_NOTIFICATION_FAILED','GROUP',groupId,{versionId:id,error:String(notificationError.message||notificationError)},ctx.user.USER_ID);}
    return {ok:true,versionId:id,versionNo,message:'บันทึกหัวข้อวิจัยเวอร์ชัน '+versionNo+' และส่งให้อาจารย์พิจารณาแล้ว'};
  }finally{lock.releaseLock();}
}
function apiAdvisorReviewResearchTopic(token,versionId,decision,comment){
  const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR]);
  if(!['APPROVED','REVISION_REQUIRED','REJECTED'].includes(decision))throw new Error('สถานะการพิจารณาไม่ถูกต้อง');
  const note=String(comment||'').trim();
  if(['REVISION_REQUIRED','REJECTED'].includes(decision)&&note.length<5)throw new Error('กรุณาระบุข้อเสนอแนะอย่างน้อย 5 ตัวอักษรสำหรับผลการพิจารณานี้');
  if(note.length>3000)throw new Error('ข้อเสนอแนะต้องมีความยาวไม่เกิน 3,000 ตัวอักษร');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const row=readObjectsFresh_('RESEARCH_TOPIC_VERSIONS').find(x=>String(x.VERSION_ID)===String(versionId));
    if(!row)throw new Error('ไม่พบหัวข้อวิจัยเวอร์ชันนี้');assertGroupAccess_(ctx,row.GROUP_ID);
    if(String(row.REVIEW_STATUS)!=='PENDING')throw new Error('หัวข้อวิจัยเวอร์ชันนี้ได้รับการพิจารณาแล้ว ไม่สามารถบันทึกผลซ้ำได้');
    const sh=sheet_('RESEARCH_TOPIC_VERSIONS'),headers=SCHEMA.RESEARCH_TOPIC_VERSIONS,status=decision==='APPROVED'?'ADVISOR_APPROVED':decision;
    [['STATUS',status],['REVIEW_STATUS',decision],['REVIEWED_BY',ctx.user.USER_ID],['REVIEWED_AT',new Date()],['REVIEW_COMMENT',note]].forEach(([k,v])=>sh.getRange(row._row,headers.indexOf(k)+1).setValue(v));
    logSystem_('RESEARCH_TOPIC_REVIEWED','GROUP',row.GROUP_ID,{versionId,decision,status},ctx.user.USER_ID);
    const titles={APPROVED:'อาจารย์ที่ปรึกษาเห็นชอบหัวข้อวิจัย',REVISION_REQUIRED:'อาจารย์ที่ปรึกษาให้ปรับปรุงหัวข้อวิจัย',REJECTED:'อาจารย์ที่ปรึกษาไม่เห็นชอบหัวข้อวิจัย'};
    const messages={APPROVED:'หัวข้อวิจัยเวอร์ชัน '+row.VERSION_NO+' ได้รับความเห็นชอบจากอาจารย์ที่ปรึกษาแล้ว ขั้นตอน RW-01 สิ้นสุดในระดับที่ปรึกษา',REVISION_REQUIRED:'หัวข้อวิจัยเวอร์ชัน '+row.VERSION_NO+' ต้องปรับปรุง กรุณาอ่านข้อเสนอแนะและแก้ไขเพื่อส่งเป็นเวอร์ชันใหม่',REJECTED:'หัวข้อวิจัยเวอร์ชัน '+row.VERSION_NO+' ไม่ได้รับความเห็นชอบ กรุณาติดต่อผู้รับผิดชอบรายวิชาเพื่อพิจารณาแนวทางดำเนินการ'};
    try{enqueueResearchTopicNotification_(row.GROUP_ID,'RESEARCH_TOPIC_'+decision,titles[decision],messages[decision],String(versionId)+':'+decision);}
    catch(notificationError){logSystem_('RESEARCH_TOPIC_NOTIFICATION_FAILED','GROUP',row.GROUP_ID,{versionId,decision,error:String(notificationError.message||notificationError)},ctx.user.USER_ID);}
    return {ok:true,message:'บันทึกผลการพิจารณาหัวข้อวิจัยแล้ว'};
  }finally{lock.releaseLock();}
}

function apiUploadProposalPdf(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT,ROLE.ADVISOR,ROLE.ADMIN]);payload=payload||{};
  const groupId=String(payload.groupId||'');assertGroupAccess_(ctx,groupId);
  const chapter=String(payload.chapter||'').trim();if(!['CONCEPT','CHAPTER_1','CHAPTER_2','CHAPTER_3','INSTRUMENT','FULL_PROPOSAL','OTHER'].includes(chapter))throw new Error('ประเภทเอกสารไม่ถูกต้อง');
  const name=String(payload.fileName||'').trim();if(!/\.pdf$/i.test(name))throw new Error('รองรับเฉพาะ PDF');
  const b64=String(payload.base64||'').replace(/^data:application\/pdf;base64,/i,'').replace(/\s/g,'');if(!b64||b64.length>Math.ceil(8*1024*1024*4/3)+16)throw new Error('ไฟล์ว่างหรือมีขนาดเกิน 8 MB');
  const bytes=Utilities.base64Decode(b64);if(bytes.length>8*1024*1024||String.fromCharCode.apply(null,bytes.slice(0,5))!=='%PDF-')throw new Error('ไฟล์ PDF ไม่ถูกต้องหรือมีขนาดเกิน 8 MB');
  let file=null;
  try{
    const props=PropertiesService.getScriptProperties();let folderId=props.getProperty('RESEARCH_PROPOSALS_FOLDER_ID'),folder=null;
    if(folderId){try{folder=DriveApp.getFolderById(folderId)}catch(e){folder=null}}
    if(!folder){folder=DriveApp.createFolder('SPORT SCIENCE RESEARCH LAB - Proposal Documents');folder.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);props.setProperty('RESEARCH_PROPOSALS_FOLDER_ID',folder.getId())}
    const safe=name.replace(/[\\/:*?"<>|#%{}\[\]]/g,'_').slice(0,140);file=folder.createFile(Utilities.newBlob(bytes,'application/pdf',safe));file.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);
    const users=readObjects_('SYS_USERS').filter(u=>u.STATUS==='ACTIVE'),members=readObjects_('GROUP_MEMBERS').filter(m=>m.GROUP_ID===groupId&&m.STATUS==='ACTIVE'),as=readObjects_('ADVISOR_ASSIGNMENTS').find(x=>x.GROUP_ID===groupId&&x.STATUS==='APPROVED');
    const allowed=new Set(members.map(m=>m.USER_ID).filter(Boolean));if(as)allowed.add(as.ADVISOR_USER_ID);users.filter(u=>u.ROLE_ID===ROLE.ADMIN).forEach(u=>allowed.add(u.USER_ID));allowed.add(ctx.user.USER_ID);
    const warnings=[];const effective=normalizeEmail_(Session.getEffectiveUser().getEmail());
    users.filter(u=>allowed.has(u.USER_ID)&&u.EMAIL&&normalizeEmail_(u.EMAIL)!==effective).forEach(u=>{try{file.addViewer(normalizeEmail_(u.EMAIL))}catch(e){warnings.push(u.EMAIL)}});
    const record={FILE_RECORD_ID:Utilities.getUuid(),GROUP_ID:groupId,CHAPTER:chapter,FILE_NAME:safe,MIME_TYPE:'application/pdf',FILE_SIZE:bytes.length,DRIVE_FILE_ID:file.getId(),DRIVE_URL:file.getUrl(),UPLOADED_BY:ctx.user.USER_ID,UPLOADED_AT:new Date(),STATUS:'ACTIVE',NOTES:String(payload.notes||'').slice(0,1000)};
    appendObject_('PROPOSAL_FILES',record);logSystem_('PROPOSAL_PDF_UPLOADED','GROUP',groupId,{chapter,fileName:safe},ctx.user.USER_ID);
    return {ok:true,message:'อัปโหลดเอกสารโครงร่างสำเร็จ',shareWarnings:warnings};
  }catch(e){if(file)try{file.setTrashed(true)}catch(x){}throw e;}
}

/** Collaborative weekly draft: all active group members edit one shared draft. */
