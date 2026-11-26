

function escapeHtml_(v){
  return String(v===null||v===undefined?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function authorizeAdvisorEmailService(){
  const quota=MailApp.getRemainingDailyQuota();
  return {ok:true,remainingDailyQuota:quota,message:'อนุญาตบริการส่งอีเมลแล้ว'};
}
function migrateAdvisorMagicLinkSchema_(){
  requireDatabase_();
  ['ADVISOR_INVITATIONS','ADVISOR_MAGIC_LINKS'].forEach(n=>ensureWorkflowSheet_(n));
  return {ok:true,message:'สร้างชีต ADVISOR_INVITATIONS และ ADVISOR_MAGIC_LINKS แล้ว'};
}
function migrateAdvisorPasswordSetupSchema_(){
  requireDatabase_();
  ensureWorkflowSheet_('ADVISOR_INVITATIONS');
  return {ok:true,message:'ปรับโครงสร้างคำเชิญอาจารย์เพื่อรองรับการตั้งรหัสผ่านครั้งแรกแล้ว'};
}
/**
 * Normalize advisor invitation tokens received through URL/form parameters.
 * Removes only trailing escaped newline markers or whitespace accidentally
 * appended by email clients; token contents are otherwise left unchanged.
 */
function normalizeAdvisorInviteToken_(value){
  return String(value||'').replace(/(?:\\[rn]|[\\r\\n\\t\\s])+$/gi,'').trim();
}

function findAdvisorInvitationByToken_(token){
  const hash=tokenHash_(token);
  const row=readObjectsFresh_('ADVISOR_INVITATIONS').find(x=>verifyTokenHash_(token,x.TOKEN_HASH)&&['INVITED','ACCEPTED'].includes(x.STATUS)&&new Date(x.EXPIRES_AT)>new Date());
  if(!row)return null;
  const g=readObjectsFresh_('RESEARCH_GROUPS').find(x=>String(x.GROUP_ID)===String(row.GROUP_ID));
  row.GROUP_NAME=g?g.GROUP_NAME:row.GROUP_ID;
  return row;
}

/**
 * Read-only diagnostic for an advisor invitation.
 * Pass the raw token from the advisorInvite URL. Never logs or returns secrets.
 * Use a temporary runner in Apps Script and remove it immediately after checking.
 */
function diagnoseAdvisorInvitationToken_(rawToken){
  const token=String(rawToken||'').trim();
  if(!token)throw new Error('กรุณาระบุ Token จากพารามิเตอร์ advisorInvite ในลิงก์อีเมล');
  requireDatabase_();
  const appSecret=PropertiesService.getScriptProperties().getProperty('APP_SECRET');
  const rows=readObjectsFresh_('ADVISOR_INVITATIONS');
  const now=new Date();
  const matched=rows.find(x=>verifyTokenHash_(token,x.TOKEN_HASH));
  const latest=rows.slice().sort((a,b)=>new Date(b.CREATED_AT||0)-new Date(a.CREATED_AT||0))[0]||null;
  const target=matched||latest;
  const maskEmail=email=>{
    const parts=String(email||'').split('@');
    if(parts.length!==2)return '';
    return (parts[0].length>2?parts[0].slice(0,2)+'***':'*')+'@'+parts[1];
  };
  if(!target)return {ok:false,diagnostic:'NO_INVITATION_RECORD',message:'ไม่พบรายการคำเชิญใน ADVISOR_INVITATIONS',appSecretConfigured:!!(appSecret&&String(appSecret).trim()),tokenLength:token.length,checkedAt:now.toISOString()};
  const expiry=new Date(target.EXPIRES_AT);
  const expired=!target.EXPIRES_AT||isNaN(expiry.getTime())||expiry.getTime()<=now.getTime();
  const hashValue=String(target.TOKEN_HASH||'');
  const hashFormat=hashValue.length===64?'HEX_64':(hashValue.length===44?'BASE64_44':'UNKNOWN_OR_LEGACY');
  let diagnostic='OK';
  if(!appSecret||!String(appSecret).trim())diagnostic='APP_SECRET_MISSING';
  else if(!matched)diagnostic='TOKEN_HASH_MISMATCH';
  else if(expired)diagnostic='INVITATION_EXPIRED';
  else if(target.STATUS!=='INVITED')diagnostic='INVITATION_ALREADY_RESPONDED_OR_NOT_ACTIVE';
  return {
    ok:diagnostic==='OK',diagnostic,
    invitationId:String(target.INVITATION_ID||''),groupId:String(target.GROUP_ID||''),
    advisorEmailMasked:maskEmail(target.ADVISOR_EMAIL),status:String(target.STATUS||''),
    createdAt:target.CREATED_AT instanceof Date?target.CREATED_AT.toISOString():String(target.CREATED_AT||''),
    expiresAt:isNaN(expiry.getTime())?'INVALID_DATE':expiry.toISOString(),expired,
    tokenHashMatch:!!matched,tokenHashFormat:hashFormat,
    appSecretConfigured:!!(appSecret&&String(appSecret).trim()),
    tokenLength:token.length,checkedAt:now.toISOString(),
    message:diagnostic==='OK'?'Token ตรงกับรายการคำเชิญ สถานะยังเป็น INVITED และยังไม่หมดอายุ':diagnostic
  };
}

/** Diagnostic wrappers are private to prevent unauthenticated google.script.run access. */
function diagnoseAdvisorInvitationToken__(rawToken){
  return diagnoseAdvisorInvitationToken_(rawToken);
}
function diagnoseLatestAdvisorInvitation__(){
  return diagnoseLatestAdvisorInvitation_();
}

/** Read-only summary; cannot verify Token Match without the raw URL token. */
function diagnoseLatestAdvisorInvitation_(){
  requireDatabase_();
  const rows=readObjectsFresh_('ADVISOR_INVITATIONS');
  const now=new Date();
  const latest=rows.slice().sort((a,b)=>new Date(b.CREATED_AT||0)-new Date(a.CREATED_AT||0))[0]||null;
  const appSecret=PropertiesService.getScriptProperties().getProperty('APP_SECRET');
  if(!latest)return {ok:false,diagnostic:'NO_INVITATION_RECORD',appSecretConfigured:!!(appSecret&&String(appSecret).trim()),checkedAt:now.toISOString()};
  const expiry=new Date(latest.EXPIRES_AT);
  return {
    invitationId:String(latest.INVITATION_ID||''),groupId:String(latest.GROUP_ID||''),
    status:String(latest.STATUS||''),
    createdAt:latest.CREATED_AT instanceof Date?latest.CREATED_AT.toISOString():String(latest.CREATED_AT||''),
    expiresAt:isNaN(expiry.getTime())?'INVALID_DATE':expiry.toISOString(),
    expired:!latest.EXPIRES_AT||isNaN(expiry.getTime())||expiry.getTime()<=now.getTime(),
    appSecretConfigured:!!(appSecret&&String(appSecret).trim()),
    tokenHashFormat:String(latest.TOKEN_HASH||'').length===64?'HEX_64':(String(latest.TOKEN_HASH||'').length===44?'BASE64_44':'UNKNOWN_OR_LEGACY'),
    checkedAt:now.toISOString(),
    note:'ฟังก์ชันนี้ไม่สามารถยืนยัน Token Match ได้หากไม่มี raw token จาก URL'
  };
}

function respondAdvisorInvitation_(token,decision,password,confirmPassword){
  if(!['ACCEPT','DECLINE'].includes(decision))throw new Error('คำตอบไม่ถูกต้อง');
  const row=findAdvisorInvitationByToken_(token);
  if(row&&row.STATUS==='ACCEPTED')return {ok:true,alreadyAccepted:true,message:'คำเชิญนี้ได้รับการตอบรับแล้ว ระบบบันทึกรหัสผ่านเรียบร้อย ขณะนี้รอ Admin อนุมัติ'};
  if(!row||row.STATUS!=='INVITED')throw new Error('คำเชิญนี้ถูกใช้แล้วหรือหมดอายุ');
  let salt='',hash='';
  if(decision==='ACCEPT'){
    const p=String(password||''),confirm=String(confirmPassword||'');
    validatePassword_(p);
    if(p!==confirm)throw new Error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
    salt=Utilities.getUuid()+Utilities.getUuid();
    hash=hashPassword_(p,salt);
  }
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const fresh=readObjectsFresh_('ADVISOR_INVITATIONS').find(x=>x.INVITATION_ID===row.INVITATION_ID&&['INVITED','ACCEPTED'].includes(x.STATUS)&&new Date(x.EXPIRES_AT)>new Date());
    if(!fresh)throw new Error('คำเชิญนี้ถูกตอบไปแล้วหรือหมดอายุ');
    if(fresh.STATUS==='ACCEPTED')return {ok:true,alreadyAccepted:true,message:'คำเชิญนี้ได้รับการตอบรับแล้ว ระบบบันทึกรหัสผ่านเรียบร้อย ขณะนี้รอ Admin อนุมัติ'};
    const sh=sheet_('ADVISOR_INVITATIONS'),headers=SCHEMA.ADVISOR_INVITATIONS;
    const set=(key,value)=>sh.getRange(fresh._row,headers.indexOf(key)+1).setValue(value);
    if(decision==='DECLINE'){
      set('STATUS','DECLINED');set('RESPONDED_AT',new Date());set('RESPONSE_NOTE','อาจารย์ปฏิเสธคำเชิญ');
      logSystem_('ADVISOR_INVITATION_DECLINED','GROUP',fresh.GROUP_ID,{invitationId:fresh.INVITATION_ID,email:fresh.ADVISOR_EMAIL},'EXTERNAL_ADVISOR');
      return {ok:true,message:'ท่านปฏิเสธคำเชิญแล้ว'};
    }
    set('STATUS','ACCEPTED');set('RESPONDED_AT',new Date());set('RESPONSE_NOTE','อาจารย์ตอบรับและตั้งรหัสผ่านแล้ว');
    set('PASSWORD_SALT',salt);set('PASSWORD_HASH',hash);
    SpreadsheetApp.flush();

    // Email notification is best-effort: mail quota/permission errors must not
    // turn a successfully stored acceptance into a failed browser response.
    let emailSent=true,emailError='';
    try{
      MailApp.sendEmail({to:fresh.ADVISOR_EMAIL,subject:'ยืนยันการตอบรับคำเชิญแล้ว · '+APP.NAME,body:'เรียน '+fresh.ADVISOR_NAME+'\n\nระบบได้รับการตอบรับคำเชิญและบันทึกรหัสผ่านของท่านแล้ว ขณะนี้อยู่ระหว่างรอ Admin อนุมัติการแต่งตั้ง เมื่อได้รับอนุมัติแล้ว ท่านสามารถเข้าสู่ระบบด้วยอีเมลนี้และรหัสผ่านที่ตั้งไว้'});
    }catch(mailErr){
      emailSent=false;
      emailError=String(mailErr&&mailErr.message||mailErr);
    }
    try{
      logSystem_('ADVISOR_INVITATION_ACCEPTED','GROUP',fresh.GROUP_ID,{invitationId:fresh.INVITATION_ID,email:fresh.ADVISOR_EMAIL,confirmationEmailSent:emailSent,emailError:emailError},'EXTERNAL_ADVISOR');
    }catch(logErr){
      console.error('ADVISOR_INVITATION_ACCEPTED log failed: '+String(logErr&&logErr.message||logErr));
    }
    return {ok:true,message:'ตั้งรหัสผ่านและตอบรับคำเชิญเรียบร้อยแล้ว ขณะนี้รอ Admin อนุมัติการแต่งตั้ง'+(emailSent?'':' (ระบบบันทึกการตอบรับแล้ว แต่ส่งอีเมลยืนยันไม่สำเร็จ)')};
  }finally{lock.releaseLock();}
}
function apiStudentNominateAdvisor(token,advisorName,advisorEmail){
  const ctx=requireSession_(token,[ROLE.STUDENT]);
  const me=readObjectsFresh_('GROUP_MEMBERS').find(m=>(String(m.USER_ID||'')===String(ctx.user.USER_ID)||normalizeStudentId_(m.STUDENT_ID)===normalizeStudentId_(ctx.user.STUDENT_ID))&&m.STATUS==='ACTIVE');
  if(!me)throw new Error('ยังไม่ได้อยู่ในกลุ่มวิจัย');
  const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>g.GROUP_ID===me.GROUP_ID&&g.STATUS==='ACTIVE');
  if(!group||String(group.GROUP_LEADER_USER_ID||'')!==String(ctx.user.USER_ID))throw new Error('เฉพาะหัวหน้ากลุ่มที่ Admin กำหนดเท่านั้นที่เสนอชื่ออาจารย์ที่ปรึกษาได้');
  const name=String(advisorName||'').trim(),email=normalizeEmail_(advisorEmail);
  if(name.length<3||name.length>150)throw new Error('กรุณากรอกชื่อ–นามสกุลอาจารย์ให้ถูกต้อง');
  validateEmail_(email);

  const lock=LockService.getScriptLock();lock.waitLock(60000);
  let invitationId='',invitationRow=0,inviteSheet;
  try{
    const invitations=readObjectsFresh_('ADVISOR_INVITATIONS').filter(x=>String(x.GROUP_ID)===String(me.GROUP_ID));
    const active=invitations.find(x=>['ACCEPTED','APPROVED'].includes(String(x.STATUS||'')));
    if(active)throw new Error('กลุ่มนี้มีอาจารย์ที่ตอบรับหรือได้รับการแต่งตั้งแล้ว ไม่สามารถส่งคำเชิญซ้ำได้');
    if(readObjectsFresh_('ADVISOR_ASSIGNMENTS').some(a=>String(a.GROUP_ID)===String(me.GROUP_ID)&&a.STATUS==='APPROVED'))throw new Error('กลุ่มนี้ได้รับมอบหมายอาจารย์ที่ปรึกษาแล้ว');

    // Reuse the existing pending/failed invitation row instead of blocking a resend
    // or creating duplicate invitation records for the same group.
    const pending=invitations.filter(x=>['INVITED','EMAIL_FAILED'].includes(String(x.STATUS||'')))
      .sort((a,b)=>new Date(b.CREATED_AT||0)-new Date(a.CREATED_AT||0))[0]||null;
    const tokenValue=Utilities.getUuid()+Utilities.getUuid();
    const expires=new Date(Date.now()+7*24*60*60*1000);
    inviteSheet=sheet_('ADVISOR_INVITATIONS');
    const headers=SCHEMA.ADVISOR_INVITATIONS;
    const set=(row,key,value)=>inviteSheet.getRange(row,headers.indexOf(key)+1).setValue(value);
    if(pending){
      invitationId=String(pending.INVITATION_ID);
      invitationRow=pending._row;
      set(invitationRow,'ADVISOR_NAME',name);
      set(invitationRow,'ADVISOR_EMAIL',email);
      set(invitationRow,'STATUS','INVITED');
      set(invitationRow,'TOKEN_HASH',tokenHash_(tokenValue));
      set(invitationRow,'EXPIRES_AT',expires);
      set(invitationRow,'CREATED_AT',new Date());
      set(invitationRow,'CREATED_BY',ctx.user.USER_ID);
      set(invitationRow,'RESPONDED_AT','');
      set(invitationRow,'RESPONSE_NOTE','');
      set(invitationRow,'APPROVED_BY','');
      set(invitationRow,'APPROVED_AT','');
      set(invitationRow,'ADVISOR_USER_ID','');
      set(invitationRow,'PASSWORD_SALT','');
      set(invitationRow,'PASSWORD_HASH','');
    }else{
      invitationId=Utilities.getUuid();
      appendObject_('ADVISOR_INVITATIONS',{INVITATION_ID:invitationId,GROUP_ID:me.GROUP_ID,ADVISOR_NAME:name,ADVISOR_EMAIL:email,STATUS:'INVITED',TOKEN_HASH:tokenHash_(tokenValue),EXPIRES_AT:expires,CREATED_AT:new Date(),CREATED_BY:ctx.user.USER_ID});
      invitationRow=readObjectsFresh_('ADVISOR_INVITATIONS').find(x=>x.INVITATION_ID===invitationId)._row;
    }
    SpreadsheetApp.flush();

    const url=ScriptApp.getService().getUrl()+'?advisorInvite='+encodeURIComponent(tokenValue);
    const subject='คำเชิญเป็นอาจารย์ที่ปรึกษางานวิจัยนักศึกษาสาขาวิทยาศาสตร์การกีฬา';
    const groupMembers=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===String(me.GROUP_ID)&&m.STATUS==='ACTIVE');
    const studentRows=readObjectsFresh_('STUDENTS');
    const memberLines=groupMembers.map((m,i)=>{
      const st=studentRows.find(x=>normalizeStudentId_(x.STUDENT_ID)===normalizeStudentId_(m.STUDENT_ID));
      const fullName=st?String(st.FULL_NAME||[st.TITLE,st.FIRST_NAME,st.LAST_NAME].filter(Boolean).join(' ')).trim():'ไม่พบชื่อในทะเบียน';
      return (i+1)+'. '+fullName+' (รหัสนักศึกษา '+String(m.STUDENT_ID||'-')+')';
    });
    const body='เรียน '+name+'\n\nนักศึกษาเสนอชื่อท่านเป็นอาจารย์ที่ปรึกษาของกลุ่ม '+group.GROUP_NAME+' ในรายวิชา '+APP.COURSE_CODE+' ภาคการศึกษา '+APP.TERM+
      '\n\nรายชื่อสมาชิกกลุ่ม ('+memberLines.length+' คน)\n'+(memberLines.length?memberLines.join('\n'):'ไม่พบข้อมูลสมาชิกกลุ่ม')+
      '\n\nกรุณาเปิดลิงก์นี้เพื่อตรวจสอบคำเชิญ ตอบรับหรือปฏิเสธ และหากตอบรับให้ตั้งรหัสผ่านสำหรับเข้าใช้งานระบบ (ลิงก์มีอายุ 7 วันและใช้ได้ครั้งเดียว):\n'+url+
      '\n\nการตอบรับยังต้องรอ Admin อนุมัติการแต่งตั้งอย่างเป็นทางการ';
    try{
      MailApp.sendEmail({to:email,subject,body,name:APP.NAME});
    }catch(err){
      set(invitationRow,'STATUS','EMAIL_FAILED');
      SpreadsheetApp.flush();
      throw new Error('บันทึกคำเชิญแล้ว แต่ส่งอีเมลไม่สำเร็จ: '+err.message+' สามารถกดส่งคำเชิญอีกครั้งได้');
    }
    logSystem_(pending?'ADVISOR_INVITATION_RESENT':'ADVISOR_INVITATION_SENT','GROUP',me.GROUP_ID,{invitationId,email},ctx.user.USER_ID);
    return {ok:true,message:(pending?'ส่งคำเชิญซ้ำไปยัง ':'ส่งคำเชิญไปยัง ')+email+' แล้ว ลิงก์มีอายุ 7 วัน'};
  }finally{lock.releaseLock();}
}
function apiAdminReviewAdvisorInvitation(token,invitationId,decision){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  if(!['APPROVE','REJECT'].includes(decision))throw new Error('คำสั่งไม่ถูกต้อง');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const row=readObjectsFresh_('ADVISOR_INVITATIONS').find(x=>x.INVITATION_ID===invitationId&&x.STATUS==='ACCEPTED');
    if(!row)throw new Error('ไม่พบคำเชิญที่อาจารย์ตอบรับและตั้งรหัสผ่านแล้ว');
    const sh=sheet_('ADVISOR_INVITATIONS'),headers=SCHEMA.ADVISOR_INVITATIONS;
    const set=(key,value)=>sh.getRange(row._row,headers.indexOf(key)+1).setValue(value);
    if(decision==='REJECT'){
      set('STATUS','REJECTED');set('APPROVED_BY',ctx.user.USER_ID);set('APPROVED_AT',new Date());
      SpreadsheetApp.flush();
      let noticeSent=true,noticeError='';
      try{MailApp.sendEmail({to:row.ADVISOR_EMAIL,subject:'ผลการพิจารณาคำเชิญที่ปรึกษา · '+APP.NAME,body:'เรียน '+row.ADVISOR_NAME+'\n\nขอบคุณที่ตอบรับคำเชิญ ขณะนี้ Admin ไม่อนุมัติการแต่งตั้งสำหรับกลุ่มนี้ หากมีข้อสงสัยกรุณาติดต่อผู้รับผิดชอบรายวิชา'});}
      catch(mailErr){noticeSent=false;noticeError=String(mailErr&&mailErr.message||mailErr);}
      logSystem_('ADVISOR_INVITATION_REJECTED','GROUP',row.GROUP_ID,{invitationId,noticeSent,noticeError},ctx.user.USER_ID);
      return {ok:true,message:'บันทึกผลไม่อนุมัติแล้ว'+(noticeSent?' และส่งอีเมลแจ้งอาจารย์แล้ว':' แต่ส่งอีเมลแจ้งอาจารย์ไม่สำเร็จ')};
    }

    let user=readObjectsFresh_('SYS_USERS').find(u=>normalizeEmail_(u.EMAIL)===normalizeEmail_(row.ADVISOR_EMAIL));
    if(user&&user.ROLE_ID!==ROLE.ADVISOR)throw new Error('อีเมลนี้ถูกใช้กับบัญชีบทบาทอื่น ไม่สามารถสร้างบัญชี Advisor ซ้ำได้');
    if(!user){
      if(!row.PASSWORD_SALT||!row.PASSWORD_HASH)throw new Error('คำเชิญนี้ยังไม่มีรหัสผ่านที่อาจารย์ตั้งไว้ กรุณาตรวจสอบข้อมูลก่อนอนุมัติ');
      user=createUser_({email:row.ADVISOR_EMAIL,displayName:row.ADVISOR_NAME,roleId:ROLE.ADVISOR,passwordSalt:row.PASSWORD_SALT,passwordHash:row.PASSWORD_HASH,emailVerified:true,status:'ACTIVE',createdBy:ctx.user.USER_ID});
    }else if(user.STATUS!=='ACTIVE'){throw new Error('บัญชีอาจารย์นี้ถูกระงับ กรุณาตรวจสอบบัญชีก่อนอนุมัติ');}
    const existing=readObjectsFresh_('ADVISOR_ASSIGNMENTS').find(a=>a.GROUP_ID===row.GROUP_ID&&a.STATUS==='APPROVED');
    if(existing)throw new Error('กลุ่มนี้มีอาจารย์ที่ปรึกษาที่ได้รับอนุมัติแล้ว');

    appendObject_('ADVISOR_ASSIGNMENTS',{ASSIGNMENT_ID:Utilities.getUuid(),GROUP_ID:row.GROUP_ID,ADVISOR_USER_ID:user.USER_ID,STATUS:'APPROVED',APPROVED_BY:ctx.user.USER_ID,APPROVED_AT:new Date(),CREATED_AT:new Date()});
    set('STATUS','APPROVED');set('APPROVED_BY',ctx.user.USER_ID);set('APPROVED_AT',new Date());set('ADVISOR_USER_ID',user.USER_ID);
    SpreadsheetApp.flush();

    const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===String(row.GROUP_ID));
    const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===String(row.GROUP_ID)&&m.STATUS==='ACTIVE');
    const studentIds=new Set(members.map(m=>normalizeStudentId_(m.STUDENT_ID)).filter(Boolean));
    const studentUsers=readObjectsFresh_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE'&&studentIds.has(normalizeStudentId_(u.STUDENT_ID))&&normalizeEmail_(u.EMAIL));
    const studentEmails=[...new Set(studentUsers.map(u=>normalizeEmail_(u.EMAIL)).filter(email=>email&&email!==normalizeEmail_(user.EMAIL)))];
    const studentRecords=readObjectsFresh_('STUDENTS');
    const memberNames=members.map(m=>{
      const student=studentRecords.find(s=>normalizeStudentId_(s.STUDENT_ID)===normalizeStudentId_(m.STUDENT_ID));
      return student?String(student.FULL_NAME||[student.TITLE,student.FIRST_NAME,student.LAST_NAME].filter(Boolean).join(' ')).trim():String(m.STUDENT_ID||'ไม่พบข้อมูลชื่อ');
    }).filter(Boolean);
    const memberList=memberNames.length?memberNames.map((name,index)=>(index+1)+'. '+name).join('\n'):'ไม่พบข้อมูลสมาชิกในกลุ่ม';
    const loginUrl='https://worrawutt-source.github.io/worrawutsportsci/project/';
    const approvedAt=new Date();
    const advisorBody='เรียน '+(user.DISPLAY_NAME||row.ADVISOR_NAME)+'\n\nAdmin อนุมัติการแต่งตั้งท่านเป็นอาจารย์ที่ปรึกษาเรียบร้อยแล้ว\n\nกลุ่มวิจัยประกอบด้วยสมาชิกดังนี้\n'+memberList+'\n\nท่านสามารถเข้าสู่ระบบ SPORT SCIENCE RESEARCH LAB ได้ที่\n'+loginUrl+'\n\nเข้าสู่ระบบด้วยอีเมลนี้และรหัสผ่านที่ตั้งไว้ในขั้นตอนตอบรับคำเชิญ\n\nหากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบเพื่อดำเนินการรีเซ็ตรหัสผ่าน';
    const studentBody='เรียน สมาชิกกลุ่มวิจัย\n\nกลุ่มวิจัยของท่านประกอบด้วยสมาชิกดังนี้\n'+memberList+'\n\nขอแจ้งให้ทราบว่า Admin ได้อนุมัติการแต่งตั้ง '+(user.DISPLAY_NAME||row.ADVISOR_NAME)+' ('+user.EMAIL+') เป็นอาจารย์ที่ปรึกษาเรียบร้อยแล้ว\n\nสามารถเข้าสู่ระบบ SPORT SCIENCE RESEARCH LAB ได้ที่\n'+loginUrl+'\n\nนักศึกษาสามารถติดต่อและดำเนินงานวิจัยภายใต้คำปรึกษาของอาจารย์ตามกระบวนการของรายวิชา';
    const mailResults={advisorSent:false,studentsSent:0,studentRecipientCount:studentEmails.length,errors:[]};
    try{MailApp.sendEmail({to:user.EMAIL,subject:'อนุมัติการเป็นอาจารย์ที่ปรึกษาแล้ว · '+APP.NAME,body:advisorBody});mailResults.advisorSent=true;}
    catch(mailErr){mailResults.errors.push('advisor: '+String(mailErr&&mailErr.message||mailErr));}
    for(const email of studentEmails){
      try{MailApp.sendEmail({to:email,subject:'แจ้งผลอนุมัติอาจารย์ที่ปรึกษาประจำกลุ่ม · '+APP.NAME,body:studentBody});mailResults.studentsSent++;}
      catch(mailErr){mailResults.errors.push(email+': '+String(mailErr&&mailErr.message||mailErr));}
    }
    logSystem_('ADVISOR_INVITATION_APPROVED','GROUP',row.GROUP_ID,{invitationId,userId:user.USER_ID,approvedAt:approvedAt.toISOString(),mailResults},ctx.user.USER_ID);
    const allNotified=mailResults.advisorSent&&mailResults.studentsSent===mailResults.studentRecipientCount;
    return {ok:true,message:'อนุมัติและกำหนดอาจารย์ที่ปรึกษาเรียบร้อยแล้ว · ส่งอีเมลถึงอาจารย์ '+(mailResults.advisorSent?'สำเร็จ':'ไม่สำเร็จ')+' · ส่งถึงนักศึกษา '+mailResults.studentsSent+'/'+mailResults.studentRecipientCount+' คน'+(allNotified?'':' · โปรดตรวจสอบบันทึกการส่งอีเมล')};
  }finally{lock.releaseLock();}
}
function issueAdvisorMagicLink_(user){
  const token=Utilities.getUuid()+Utilities.getUuid(),expires=new Date(Date.now()+15*60*1000);
  appendObject_('ADVISOR_MAGIC_LINKS',{LINK_ID:Utilities.getUuid(),USER_ID:user.USER_ID,EMAIL:user.EMAIL,TOKEN_HASH:tokenHash_(token),EXPIRES_AT:expires,CREATED_AT:new Date()});
  return ScriptApp.getService().getUrl()+'?advisorMagic='+encodeURIComponent(token);
}
function apiRequestAdvisorMagicLink(email){
  requireDatabase_();
  const normalized=normalizeEmail_(email);validateEmail_(normalized);
  const cache=CacheService.getScriptCache(),key='ADVISOR_MAGIC_'+digestHex_(normalized);
  if(cache.get(key))return {ok:true,message:'หากอีเมลนี้เป็นบัญชี Advisor ที่ใช้งานได้ ระบบจะส่ง Magic Link ให้'};
  cache.put(key,'1',60);
  const user=readObjectsFresh_('SYS_USERS').find(u=>normalizeEmail_(u.EMAIL)===normalized&&u.ROLE_ID===ROLE.ADVISOR&&u.STATUS==='ACTIVE'&&String(u.EMAIL_VERIFIED).toUpperCase()==='TRUE');
  if(user){const link=issueAdvisorMagicLink_(user);MailApp.sendEmail({to:normalized,subject:'ลิงก์เข้าสู่ระบบ · '+APP.NAME,body:'ใช้ลิงก์นี้เข้าสู่ระบบโดยไม่ต้องใช้รหัสผ่าน ลิงก์มีอายุ 15 นาทีและใช้ได้ครั้งเดียว:\\n'+link});}
  return {ok:true,message:'หากอีเมลนี้เป็นบัญชี Advisor ที่ใช้งานได้ ระบบจะส่ง Magic Link ให้'};
}
function consumeAdvisorMagicLink_(token){
  const row=readObjectsFresh_('ADVISOR_MAGIC_LINKS').find(x=>verifyTokenHash_(token,x.TOKEN_HASH)&&!x.USED_AT&&new Date(x.EXPIRES_AT)>new Date());
  if(!row)throw new Error('Magic Link ไม่ถูกต้อง หมดอายุ หรือถูกใช้แล้ว');
  const user=readObjectsFresh_('SYS_USERS').find(u=>u.USER_ID===row.USER_ID&&u.ROLE_ID===ROLE.ADVISOR&&u.STATUS==='ACTIVE');
  if(!user)throw new Error('ไม่พบบัญชี Advisor ที่ใช้งานได้');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const fresh=readObjectsFresh_('ADVISOR_MAGIC_LINKS').find(x=>x.LINK_ID===row.LINK_ID&&!x.USED_AT);
    if(!fresh)throw new Error('Magic Link ถูกใช้แล้ว');
    sheet_('ADVISOR_MAGIC_LINKS').getRange(fresh._row,7).setValue(new Date());
    const session=Utilities.getUuid()+Utilities.getUuid(),now=new Date(),expires=new Date(now.getTime()+APP.SESSION_HOURS*3600000);
    sheet_('SYS_SESSIONS').appendRow([Utilities.getUuid(),user.USER_ID,tokenHash_(session),now,expires,now,'','']);
    updateUserLastLogin_(user.USER_ID);logSystem_('ADVISOR_MAGIC_LOGIN','USER',user.USER_ID,{},user.USER_ID);
    return session;
  }finally{lock.releaseLock();}
}
function apiAdminReviewAdvisorNomination(token,assignmentId,decision){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  if(!['APPROVE','REJECT'].includes(decision))throw new Error('คำสั่งไม่ถูกต้อง');
  const row=readObjects_('ADVISOR_ASSIGNMENTS').find(a=>a.ASSIGNMENT_ID===assignmentId&&a.STATUS==='PENDING');
  if(!row)throw new Error('ไม่พบรายการเสนอชื่อที่รอพิจารณา');
  const sh=sheet_('ADVISOR_ASSIGNMENTS');
  if(decision==='APPROVE'){
    readObjects_('ADVISOR_ASSIGNMENTS').filter(a=>a.GROUP_ID===row.GROUP_ID&&a.STATUS==='APPROVED').forEach(a=>sh.getRange(a._row,4).setValue('REPLACED'));
    sh.getRange(row._row,4).setValue('APPROVED');
    sh.getRange(row._row,5).setValue(ctx.user.USER_ID);
    sh.getRange(row._row,6).setValue(new Date());
  }else sh.getRange(row._row,4).setValue('REJECTED');
  logSystem_('ADVISOR_NOMINATION_REVIEWED','GROUP',row.GROUP_ID,{assignmentId,decision},ctx.user.USER_ID);
  return {ok:true,message:decision==='APPROVE'?'อนุมัติอาจารย์ที่ปรึกษาแล้ว':'ส่งกลับ/ปฏิเสธข้อเสนอชื่อแล้ว'};
}

function apiAdminAssignAdvisor(token,groupId,advisorUserId){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const group=readObjects_('RESEARCH_GROUPS').find(g=>g.GROUP_ID===groupId&&g.STATUS==='ACTIVE');if(!group)throw new Error('ไม่พบกลุ่มวิจัย');
  const advisor=readObjects_('SYS_USERS').find(u=>u.USER_ID===advisorUserId&&u.ROLE_ID===ROLE.ADVISOR&&u.STATUS==='ACTIVE');if(!advisor)throw new Error('บัญชีอาจารย์ที่ปรึกษาไม่ถูกต้องหรือไม่ได้เปิดใช้งาน');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const sh=sheet_('ADVISOR_ASSIGNMENTS');
    readObjects_('ADVISOR_ASSIGNMENTS').filter(a=>a.GROUP_ID===groupId&&['APPROVED','PENDING'].includes(a.STATUS)).forEach(a=>sh.getRange(a._row,4).setValue('REPLACED'));
    appendObject_('ADVISOR_ASSIGNMENTS',{ASSIGNMENT_ID:Utilities.getUuid(),GROUP_ID:groupId,ADVISOR_USER_ID:advisorUserId,STATUS:'APPROVED',APPROVED_BY:ctx.user.USER_ID,APPROVED_AT:new Date(),CREATED_AT:new Date()});
    logSystem_('ADVISOR_ASSIGNED','GROUP',groupId,{advisorUserId},ctx.user.USER_ID);return {ok:true,message:'กำหนดอาจารย์ที่ปรึกษาแล้ว'};
  }finally{lock.releaseLock();}
}
