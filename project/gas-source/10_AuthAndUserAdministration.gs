function apiStartStudentRegistration(payload) {
  requireDatabase_();
  if (String(getConfigValue_('STUDENT_REGISTRATION_OPEN','TRUE')).toUpperCase() !== 'TRUE') {
    throw new Error('ขณะนี้ Admin ปิดการลงทะเบียนนักศึกษาแล้ว');
  }
  payload = payload || {};
  const studentId = String(payload.studentId || '').trim();
  const email = normalizeEmail_(payload.email);
  const password = String(payload.password || '');
  validateEmail_(email);
  validatePassword_(password);
  if (!studentId) throw new Error('กรุณากรอกรหัสนักศึกษา');
  const student = readObjects_('STUDENTS').find(r => String(r.STUDENT_ID).trim() === studentId && String(r.IS_ACTIVE).toUpperCase() !== 'FALSE');
  if (!student) throw new Error('ไม่พบรหัสนักศึกษาในทะเบียนรายวิชา กรุณาตรวจสอบกับผู้รับผิดชอบรายวิชา');
  if (readObjects_('SYS_USERS').some(u => normalizeEmail_(u.EMAIL) === email)) throw new Error('อีเมลนี้มีบัญชีในระบบแล้ว');
  if (readObjects_('SYS_USERS').some(u => String(u.STUDENT_ID) === studentId)) throw new Error('รหัสนักศึกษานี้มีบัญชีแล้ว');
  const passwordSalt = Utilities.getUuid() + Utilities.getUuid();
  const passwordHash = hashPassword_(password, passwordSalt);
  const otp = issueOtp_(email, 'STUDENT_REGISTER', studentId, {
    studentId:studentId, displayName:String(student.FULL_NAME),
    passwordSalt:passwordSalt, passwordHash:passwordHash
  });
  MailApp.sendEmail({
    to:email, subject:'ยืนยันอีเมล — SPORT SCIENCE RESEARCH LAB',
    body:'รหัส OTP ของคุณคือ ' + otp + '\nรหัสนี้ใช้ได้ ' + APP.OTP_MINUTES + ' นาที และใช้ได้ครั้งเดียว\nหากคุณไม่ได้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลนี้'
  });
  return {ok:true, message:'ส่งรหัส OTP ไปยังอีเมลแล้ว กรุณาตรวจสอบกล่องจดหมายและ Spam', expiresInMinutes:APP.OTP_MINUTES};
}

/** Public client API: complete registration after email verification. */
function apiVerifyStudentRegistration(payload) {
  requireDatabase_(); payload=payload||{};
  const email=normalizeEmail_(payload.email), otp=String(payload.otp||'').trim();
  const lock=LockService.getScriptLock(); lock.waitLock(60000);
  try {
    const record=verifyOtp_(email,'STUDENT_REGISTER',otp);
    const data=JSON.parse(record.PAYLOAD_JSON||'{}');
    if(readObjects_('SYS_USERS').some(u=>normalizeEmail_(u.EMAIL)===email || String(u.STUDENT_ID)===String(data.studentId)))
      throw new Error('บัญชีหรือรหัสนักศึกษานี้ถูกใช้แล้ว');
    const user=createUser_({email,displayName:data.displayName,roleId:ROLE.STUDENT,studentId:data.studentId,passwordSalt:data.passwordSalt,passwordHash:data.passwordHash,emailVerified:true,status:'ACTIVE',createdBy:'SELF_REGISTRATION'});
    // Link an existing roster/group membership created by Admin before the student registered.
    const membership=readObjects_('GROUP_MEMBERS').find(m=>String(m.STUDENT_ID)===String(data.studentId)&&m.STATUS==='ACTIVE');
    if(membership) sheet_('GROUP_MEMBERS').getRange(membership._row,4).setValue(user.USER_ID);
    markOtpUsed_(record.OTP_ID);
    logSystem_('STUDENT_REGISTERED','USER',user.USER_ID,{studentId:data.studentId},user.USER_ID);
    return {ok:true,message:'ยืนยันอีเมลและลงทะเบียนสำเร็จ สามารถเข้าสู่ระบบได้'};
  } finally { lock.releaseLock(); }
}

/** Login. Client persists the token locally; every API call validates the server-side session and expiry. */
function apiLogin(payload) {
  requireDatabase_();
  payload = payload || {};
  const loginId = String(payload.username || payload.email || '').trim();
  const password = String(payload.password || '');
  if (!loginId) throw new Error('กรุณากรอก Username หรืออีเมล');
  const key = 'LOGIN_' + digestHex_(loginId.toLowerCase());
  const cache = CacheService.getScriptCache();
  const attempts = Number(cache.get(key) || 0);
  if (attempts >= 8) throw new Error('เข้าสู่ระบบไม่สำเร็จหลายครั้ง กรุณารอ 15 นาที');
  const user = readObjects_('SYS_USERS').find(u =>
    String(u.USERNAME || '').toLowerCase() === loginId.toLowerCase() ||
    (u.EMAIL && normalizeEmail_(u.EMAIL) === normalizeEmail_(loginId))
  );
  if (!user || user.STATUS !== 'ACTIVE' || !verifyPassword_(password, user.PASSWORD_SALT, user.PASSWORD_HASH)) {
    cache.put(key, String(attempts+1), 900);
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }
  cache.remove(key);
  if (String(user.EMAIL_VERIFIED).toUpperCase() !== 'TRUE') throw new Error('บัญชียังไม่ได้ยืนยันอีเมล');
  const token = Utilities.getUuid() + Utilities.getUuid();
  const now = new Date();
  const expires = new Date(now.getTime() + APP.SESSION_HOURS*3600000);
  const sessionId = Utilities.getUuid();
  const sh = sheet_('SYS_SESSIONS');
  sh.appendRow([sessionId,user.USER_ID,tokenHash_(token),now,expires,now,'','']);
  updateUserLastLogin_(user.USER_ID);
  logSystem_('LOGIN_SUCCESS','USER',user.USER_ID,{},user.USER_ID);
  return {
    ok:true, token:token, expiresAt:expires.toISOString(),
    forcePasswordChange: String(user.PASSWORD_CHANGE_REQUIRED).toUpperCase() === 'TRUE',
    user:{userId:user.USER_ID,username:user.USERNAME || user.EMAIL,email:user.EMAIL,displayName:user.DISPLAY_NAME,roleId:user.ROLE_ID,studentId:user.STUDENT_ID}
  };
}

function apiLogout(token) {
  if (!token) return {ok:true};
  const session = findSession_(token);
  if (session) {
    const sh = sheet_('SYS_SESSIONS');
    sh.getRange(session._row, 7).setValue(new Date());
    logSystem_('LOGOUT','USER',session.USER_ID,{},session.USER_ID);
  }
  return {ok:true};
}

/**
 * Returns active research groups assigned to the authenticated advisor.
 * Uses fresh reads and normalized IDs/status values so the advisor dashboard
 * and assigned-group list are based on the same source of truth.
 */
function getAdvisorAssignedGroups_(advisorUserId){
  const targetUserId=String(advisorUserId||'').trim();
  if(!targetUserId)return [];
  const assignments=readObjectsFresh_('ADVISOR_ASSIGNMENTS')
    .filter(a=>String(a.ADVISOR_USER_ID||'').trim()===targetUserId&&String(a.STATUS||'').trim().toUpperCase()==='APPROVED');
  const groupIds=[...new Set(assignments.map(a=>String(a.GROUP_ID||'').trim()).filter(Boolean))];
  if(!groupIds.length)return [];
  const groups=readObjectsFresh_('RESEARCH_GROUPS')
    .filter(g=>groupIds.includes(String(g.GROUP_ID||'').trim())&&String(g.STATUS||'').trim().toUpperCase()==='ACTIVE');
  const members=readObjectsFresh_('GROUP_MEMBERS');
  const students=readObjectsFresh_('STUDENTS');
  return groups.map(group=>{
    const groupId=String(group.GROUP_ID||'').trim();
    const groupMembers=members.filter(m=>String(m.GROUP_ID||'').trim()===groupId&&String(m.STATUS||'').trim().toUpperCase()==='ACTIVE');
    return {
      groupId,
      groupName:String(group.GROUP_NAME||'ไม่ระบุชื่อกลุ่ม'),
      topicTh:String(group.TOPIC_TITLE_TH||''),
      topicEn:String(group.TOPIC_TITLE_EN||''),
      members:groupMembers.map(m=>{
        const studentId=normalizeStudentId_(m.STUDENT_ID);
        const student=students.find(x=>normalizeStudentId_(x.STUDENT_ID)===studentId)||{};
        const fullName=String(student.FULL_NAME||[student.TITLE,student.FIRST_NAME,student.LAST_NAME].filter(Boolean).join(' ')).trim();
        return {studentId,name:fullName||'ไม่พบชื่อในทะเบียน'};
      })
    };
  });
}

/** Advisor-only: list groups with an approved assignment to the current advisor. */
function apiGetAdvisorAssignedGroups(token){
  const ctx=requireSession_(token,[ROLE.ADVISOR]);
  return sanitizeForClient_(getAdvisorAssignedGroups_(ctx.user.USER_ID));
}

function advisorWorkspaceDetails_(advisorUserId){
  const groups=getAdvisorAssignedGroups_(advisorUserId),ids=new Set(groups.map(g=>String(g.groupId)));
  const reports=readObjectsFresh_('PROGRESS_REPORTS').filter(r=>ids.has(String(r.GROUP_ID||'')));
  const topics=readObjectsFresh_('RESEARCH_TOPIC_VERSIONS').filter(r=>ids.has(String(r.GROUP_ID||'')));
  const files=readObjectsFresh_('PROPOSAL_FILES').filter(r=>ids.has(String(r.GROUP_ID||''))&&String(r.STATUS||'').toUpperCase()==='ACTIVE');
  const feedback=readObjectsFresh_('ADVISOR_FEEDBACK').filter(r=>ids.has(String(r.GROUP_ID||''))&&String(r.STATUS||'ACTIVE').toUpperCase()==='ACTIVE');
  const meetings=readObjectsFresh_('MEETING_RECORDS').filter(r=>ids.has(String(r.GROUP_ID||'')));
  const tasks=readObjectsFresh_('GROUP_TASKS').filter(r=>ids.has(String(r.GROUP_ID||''))&&!['DONE','CANCELLED','DELETED'].includes(String(r.STATUS||'').toUpperCase()));
  const groupSummaries=groups.map(g=>{
    const gr=reports.filter(r=>String(r.GROUP_ID)===String(g.groupId)).sort((a,b)=>new Date(b.SUBMITTED_AT||0)-new Date(a.SUBMITTED_AT||0));
    const gt=topics.filter(r=>String(r.GROUP_ID)===String(g.groupId)).sort((a,b)=>Number(b.VERSION_NO||0)-Number(a.VERSION_NO||0));
    const gm=meetings.filter(r=>String(r.GROUP_ID)===String(g.groupId));
    return {
      groupId:g.groupId,groupName:g.groupName,topicTh:g.topicTh,topicEn:g.topicEn,members:g.members,
      pendingReports:gr.filter(r=>['SUBMITTED','RESUBMITTED'].includes(String(r.STATUS||'').toUpperCase())).length,
      totalReports:gr.length,latestReport:gr[0]?{weekNo:gr[0].WEEK_NO,status:gr[0].STATUS,submittedAt:gr[0].SUBMITTED_AT}:null,
      proposalFiles:files.filter(r=>String(r.GROUP_ID)===String(g.groupId)).length,
      feedbackCount:feedback.filter(r=>String(r.GROUP_ID)===String(g.groupId)).length,
      meetingCount:[...new Set(gm.map(r=>String(r.MEETING_NO)))].filter(Boolean).length,
      openTasks:tasks.filter(r=>String(r.GROUP_ID)===String(g.groupId)).length,
      latestTopic:gt[0]?{versionNo:gt[0].VERSION_NO,reviewStatus:gt[0].REVIEW_STATUS,status:gt[0].STATUS}:null
    };
  });
  const pendingReports=reports.filter(r=>['SUBMITTED','RESUBMITTED'].includes(String(r.STATUS||'').toUpperCase())).map(r=>{
    const g=groups.find(x=>String(x.groupId)===String(r.GROUP_ID));
    return {groupId:r.GROUP_ID,groupName:g?g.groupName:'',weekNo:r.WEEK_NO,status:r.STATUS,submittedAt:r.SUBMITTED_AT,reportId:r.REPORT_ID};
  }).sort((a,b)=>new Date(b.submittedAt||0)-new Date(a.submittedAt||0));
  const pendingTopics=topics.filter(r=>String(r.REVIEW_STATUS||'').toUpperCase()==='PENDING').map(r=>{
    const g=groups.find(x=>String(x.groupId)===String(r.GROUP_ID));
    return {groupId:r.GROUP_ID,groupName:g?g.groupName:'',versionNo:r.VERSION_NO,titleTh:r.TITLE_TH,submittedAt:r.SUBMITTED_AT,versionId:r.VERSION_ID};
  });
  const dashboardMetrics={meetingsRecorded:new Set(meetings.map(r=>String(r.GROUP_ID)+'|'+String(r.MEETING_NO))).size};
  return sanitizeForClient_({
    metrics:{
      assignedGroups:groups.length,
      pendingReports:pendingReports.length,
      pendingTopics:pendingTopics.length,
      meetingsRecorded:meetings.length,
      feedbackProvided:feedback.length,
      openTasks:tasks.length
    },
    dashboardMetrics,
    groups:groupSummaries,pendingReports,pendingTopics,
    assessmentWindowA4:assessmentSettingsFresh_().WINDOW_A4||'CLOSED'
  });
}

function apiGetAdvisorWorkspaceSummary(token){
  const ctx=requireSession_(token,[ROLE.ADVISOR]);
  return advisorWorkspaceDetails_(ctx.user.USER_ID);
}

/** Dashboard bootstrap: all authorization is performed on the server. */
function apiGetDashboard(token) {
  const ctx = requireSession_(token, null, true);
  const role = ctx.user.ROLE_ID;
  const base = {
    appName:APP.NAME, version:APP.VERSION, courseCode:APP.COURSE_CODE,
    term:APP.TERM, section:APP.SECTION,
    expiresAt:new Date(ctx.session.EXPIRES_AT).toISOString(),
    forcePasswordChange: String(ctx.user.PASSWORD_CHANGE_REQUIRED).toUpperCase() === 'TRUE',
    user:{userId:ctx.user.USER_ID,username:ctx.user.USERNAME || ctx.user.EMAIL,email:ctx.user.EMAIL,displayName:ctx.user.DISPLAY_NAME,roleId:role}
  };
  if (role === ROLE.ADMIN) {
    base.metrics = {users:readObjects_('SYS_USERS').length, sessions:readObjects_('SYS_SESSIONS').filter(s=>!s.REVOKED_AT && new Date(s.EXPIRES_AT)>new Date()).length, roster:readObjects_('STUDENTS').length};
    base.menu = ['ภาพรวมระบบ','จัดการกลุ่มวิจัย','กำหนดอาจารย์ที่ปรึกษา','บันทึกการเข้าพบที่ปรึกษา','จัดการรายงานความก้าวหน้า','จัดการงานกลุ่ม','ติดตามจริยธรรม','สัญญาณเตือนความเสี่ยง','ประเมินผล A1–A6','บัญชีผู้ใช้','นำเข้ารายชื่อนักศึกษา','บันทึกระบบ','การตั้งค่าระบบ'];
    } else if (role === ROLE.ADVISOR) {
    const advisorSummary=advisorWorkspaceDetails_(ctx.user.USER_ID);
    base.advisorWorkspaceSummary=advisorSummary;
    base.metrics={assignedGroups:advisorSummary.metrics.assignedGroups,pendingReports:advisorSummary.metrics.pendingReports,pendingTopics:advisorSummary.metrics.pendingTopics,meetingsRecorded:advisorSummary.dashboardMetrics.meetingsRecorded};
    base.menu = ['ภาพรวมการให้คำปรึกษา','กลุ่มที่ได้รับมอบหมาย','บันทึกการเข้าพบที่ปรึกษา','ประเมิน A4'];
  } else if (role === ROLE.STUDENT) {
    // Derive dashboard group status from the active membership relationship.
    // This mirrors the membership lookup used by apiGetStudentWorkspace.
    const studentId = normalizeStudentId_(ctx.user.STUDENT_ID);
    const userId = String(ctx.user.USER_ID || '');
    const activeMembers = readObjectsFresh_('GROUP_MEMBERS')
      .filter(m => String(m.STATUS || '').toUpperCase() === 'ACTIVE');
    const membership = activeMembers.find(m => String(m.USER_ID || '') === userId) ||
      (studentId ? activeMembers.find(m => normalizeStudentId_(m.STUDENT_ID) === studentId) : null);
    const activeGroups = readObjectsFresh_('RESEARCH_GROUPS')
      .filter(g => String(g.STATUS || '').toUpperCase() === 'ACTIVE');
    const activeGroup = membership
      ? activeGroups.find(g => String(g.GROUP_ID) === String(membership.GROUP_ID))
      : null;
    base.metrics = {
      groupStatus: activeGroup ? 'จัดกลุ่มแล้ว' : 'ยังไม่ได้จัดกลุ่ม',
      milestones: 0,
      feedback: 0
    };
    base.menu = ['ข้อมูลของกลุ่ม','เอกสารโครงร่าง','บันทึกการเข้าพบที่ปรึกษา','รายงานความก้าวหน้า','งานกลุ่ม','ข้อเสนอแนะ','ประเมินเพื่อน'];
  } else {
    throw new Error('บัญชีนี้ไม่มี Role ที่ระบบรองรับ');
  }
  return base;
}

/** Admin-only: create/invite a Course Coordinator or Research Advisor. */
function apiCreateInvitation(token, payload) {
  const ctx = requireSession_(token, [ROLE.ADMIN]);
  payload = payload || {};
  const email = normalizeEmail_(payload.email);
  const displayName = String(payload.displayName || '').trim();
  const roleId = String(payload.roleId || '');
  validateEmail_(email);
  if (!displayName) throw new Error('กรุณาระบุชื่อผู้รับเชิญ');
  if (roleId !== ROLE.ADVISOR) throw new Error('ระบบอนุญาตให้ Admin เชิญได้เฉพาะ Advisor; นักศึกษาลงทะเบียนด้วยตนเอง');
  if (readObjects_('SYS_USERS').some(u=>normalizeEmail_(u.EMAIL)===email)) throw new Error('อีเมลนี้มีบัญชีแล้ว');
  const pending=readObjects_('SYS_INVITATIONS').some(r=>normalizeEmail_(r.EMAIL)===email && (r.STATUS==='PENDING' || r.STATUS==='PREPARING') && new Date(r.EXPIRES_AT)>new Date());
  if(pending) throw new Error('อีเมลนี้มีคำเชิญที่ยังไม่หมดอายุอยู่แล้ว');
  const code = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  const id = Utilities.getUuid();
  const expires = new Date(Date.now()+7*86400000);
  const invitationSheet = sheet_('SYS_INVITATIONS');
  const invitationLock = LockService.getScriptLock();
  invitationLock.waitLock(60000);
  let invitationRow;
  try {
    // Recheck duplicate state under lock to prevent concurrent duplicate invitations.
    const duplicate = readObjects_('SYS_INVITATIONS').some(r =>
      normalizeEmail_(r.EMAIL)===email &&
      (r.STATUS==='PENDING' || r.STATUS==='PREPARING') &&
      new Date(r.EXPIRES_AT)>new Date()
    );
    if (duplicate) throw new Error('อีเมลนี้มีคำเชิญที่กำลังดำเนินการหรือยังไม่หมดอายุอยู่แล้ว');
    invitationRow = invitationSheet.getLastRow() + 1;
    // Persist PREPARING before sending: avoids an email with an unusable code
    // if Sheets fails to persist the invitation record.
    invitationSheet.appendRow([id,email,displayName,roleId,tokenHash_(code),'PREPARING',expires,new Date(),ctx.user.USER_ID,'']);
    SpreadsheetApp.flush();
  } finally {
    invitationLock.releaseLock();
  }

  try {
    MailApp.sendEmail({
      to:email, subject:'คำเชิญเข้าร่วม SPORT SCIENCE RESEARCH LAB',
      body:'คุณได้รับเชิญให้ใช้งานระบบในบทบาท ' + roleId + '\\nอีเมล: ' + email + '\\nรหัสเชิญ: ' + code + '\\nกรุณาดำเนินการลงทะเบียนภายใน 7 วัน'
    });
  } catch(mailError) {
    invitationSheet.getRange(invitationRow,6).setValue('EMAIL_FAILED');
    SpreadsheetApp.flush();
    logSystem_('INVITATION_EMAIL_FAILED','INVITATION',id,{email,error:String(mailError.message||mailError)},ctx.user.USER_ID);
    throw new Error('ส่งอีเมลคำเชิญไม่สำเร็จ รายการถูกบันทึกสถานะ EMAIL_FAILED: '+mailError.message);
  }

  try {
    invitationSheet.getRange(invitationRow,6).setValue('PENDING');
    SpreadsheetApp.flush();
  } catch(stateError) {
    logSystem_('INVITATION_STATE_UPDATE_FAILED','INVITATION',id,{email,error:String(stateError.message||stateError)},ctx.user.USER_ID);
    throw new Error('ส่งอีเมลแล้ว แต่บันทึกสถานะคำเชิญไม่สำเร็จ กรุณาตรวจสอบรายการ PREPARING ก่อนส่งซ้ำ');
  }
  logSystem_('INVITATION_CREATED','INVITATION',id,{email,roleId},ctx.user.USER_ID);
  return {ok:true,message:'ส่งคำเชิญแล้ว'};
}

/** Invitee starts account creation using the invitation code; sends OTP to invited email. */
function apiStartInvitedRegistration(payload) {
  requireDatabase_();
  payload = payload || {};
  const email = normalizeEmail_(payload.email);
  const code = String(payload.inviteCode || '').trim();
  const password = String(payload.password || '');
  validateEmail_(email); validatePassword_(password);
  const inv = readObjects_('SYS_INVITATIONS').find(r=>normalizeEmail_(r.EMAIL)===email && r.STATUS==='PENDING' && new Date(r.EXPIRES_AT)>new Date() && verifyTokenHash_(code,r.INVITE_CODE_HASH));
  if (!inv) throw new Error('คำเชิญไม่ถูกต้อง หมดอายุ หรือถูกใช้แล้ว');
  if (readObjects_('SYS_USERS').some(u=>normalizeEmail_(u.EMAIL)===email)) throw new Error('อีเมลนี้มีบัญชีแล้ว');
  const passwordSalt = Utilities.getUuid() + Utilities.getUuid();
  const passwordHash = hashPassword_(password, passwordSalt);
  const otp = issueOtp_(email,'INVITED_REGISTER',inv.INVITATION_ID,{
    invitationId:inv.INVITATION_ID,passwordSalt:passwordSalt,passwordHash:passwordHash
  });
  MailApp.sendEmail({to:email,subject:'ยืนยันอีเมล — SPORT SCIENCE RESEARCH LAB',body:'รหัส OTP: '+otp+'\nใช้ได้ '+APP.OTP_MINUTES+' นาที'});
  return {ok:true,message:'ส่ง OTP ไปยังอีเมลที่ได้รับเชิญแล้ว'};
}

function apiVerifyInvitedRegistration(payload) {
  requireDatabase_(); payload=payload||{};
  const email=normalizeEmail_(payload.email), otp=String(payload.otp||'').trim();
  const lock=LockService.getScriptLock(); lock.waitLock(60000);
  try {
    const record=verifyOtp_(email,'INVITED_REGISTER',otp);
    const data=JSON.parse(record.PAYLOAD_JSON||'{}');
    const inv=readObjects_('SYS_INVITATIONS').find(r=>r.INVITATION_ID===data.invitationId && r.STATUS==='PENDING' && new Date(r.EXPIRES_AT)>new Date());
    if(!inv) throw new Error('ไม่พบคำเชิญที่ยังใช้งานได้');
    if(normalizeEmail_(inv.EMAIL)!==email) throw new Error('อีเมลไม่ตรงกับคำเชิญ');
    if(readObjects_('SYS_USERS').some(u=>normalizeEmail_(u.EMAIL)===email)) throw new Error('อีเมลนี้มีบัญชีแล้ว');
    const user=createUser_({email,emailVerified:true,displayName:inv.DISPLAY_NAME,roleId:inv.ROLE_ID,studentId:'',passwordSalt:data.passwordSalt,passwordHash:data.passwordHash,status:'ACTIVE',createdBy:'INVITATION'});
    const sh=sheet_('SYS_INVITATIONS'); sh.getRange(inv._row,6).setValue('ACCEPTED'); sh.getRange(inv._row,10).setValue(new Date());
    markOtpUsed_(record.OTP_ID);
    logSystem_('INVITATION_ACCEPTED','USER',user.USER_ID,{roleId:user.ROLE_ID},user.USER_ID);
    return {ok:true,message:'ลงทะเบียนสำเร็จ สามารถเข้าสู่ระบบได้'};
  } finally { lock.releaseLock(); }
}

/**
 * User changes own password. A temporary/reset password must be replaced before normal use.
 */
function apiChangePassword(token, currentPassword, newPassword) {
  // Validate the active session first; password-change sessions are explicitly allowed.
  const ctx = requireSession_(token, null, true);
  const userId = ctx.user.USER_ID;
  const current = String(currentPassword || '');
  const next = String(newPassword || '');
  if (!current || !next) throw new Error('กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่');
  validatePassword_(next);
  if (current === next) throw new Error('รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน');

  const lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try {
    // Re-read the account under lock to avoid writing against stale session data.
    const fresh = readObjects_('SYS_USERS').find(u => u.USER_ID === userId && u.STATUS === 'ACTIVE');
    if (!fresh) throw new Error('ไม่พบบัญชีผู้ใช้หรือบัญชีถูกระงับ');
    if (!verifyPassword_(current, fresh.PASSWORD_SALT, fresh.PASSWORD_HASH)) {
      throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
    }

    const salt = Utilities.getUuid() + Utilities.getUuid();
    const hash = hashPassword_(next, salt);
    const sh = sheet_('SYS_USERS');
    const headers = SCHEMA.SYS_USERS;
    const col = name => headers.indexOf(name) + 1;
    sh.getRange(fresh._row, col('PASSWORD_SALT')).setValue(salt);
    sh.getRange(fresh._row, col('PASSWORD_HASH')).setValue(hash);
    sh.getRange(fresh._row, col('UPDATED_AT')).setValue(new Date());
    sh.getRange(fresh._row, col('PASSWORD_CHANGE_REQUIRED')).setValue(false);
    SpreadsheetApp.flush();

    const saved = readObjects_('SYS_USERS').find(u => u.USER_ID === userId);
    if (!saved || saved.PASSWORD_SALT !== salt ||
        !verifyPassword_(next, saved.PASSWORD_SALT, saved.PASSWORD_HASH) ||
        String(saved.PASSWORD_CHANGE_REQUIRED).toUpperCase() === 'TRUE') {
      throw new Error('ระบบตรวจสอบการบันทึกรหัสผ่านไม่ผ่าน กรุณาลองอีกครั้ง');
    }
    logSystem_('PASSWORD_CHANGED', 'USER', userId, {forceChangeCleared:true},userId);
    return {ok:true, message:'บันทึกรหัสผ่านใหม่สำเร็จ', passwordChangeRequired:false};
  } finally {
    lock.releaseLock();
  }
}

/**
 * Admin-only password reset. Sets temporary password 123456 and forces change at next login.
 * Revoke all active sessions for the target account.
 */
function apiAdminResetPassword(token, userId) {
  const ctx = requireSession_(token, [ROLE.ADMIN]);
  const target = readObjects_('SYS_USERS').find(u => u.USER_ID === userId);
  if (!target) throw new Error('ไม่พบบัญชีผู้ใช้');
  if (target.USER_ID === ctx.user.USER_ID) throw new Error('ไม่อนุญาตให้รีเซ็ตรหัสผ่านบัญชีของตนเองผ่านเมนูนี้');
  const salt = Utilities.getUuid() + Utilities.getUuid();
  const hash = hashPassword_('123456', salt);
  const userSheet = sheet_('SYS_USERS');
  userSheet.getRange(target._row, 6).setValue(salt);
  userSheet.getRange(target._row, 7).setValue(hash);
  userSheet.getRange(target._row, 11).setValue(new Date());
  userSheet.getRange(target._row, SCHEMA.SYS_USERS.indexOf('PASSWORD_CHANGE_REQUIRED') + 1).setValue(true);

  const sessions = readObjects_('SYS_SESSIONS').filter(s => s.USER_ID === userId && !s.REVOKED_AT);
  const sessionSheet = sheet_('SYS_SESSIONS');
  sessions.forEach(s => sessionSheet.getRange(s._row, 7).setValue(new Date()));
  logSystem_('ADMIN_PASSWORD_RESET', 'USER', userId, {forceChange:true},ctx.user.USER_ID);
  return {ok:true, message:'รีเซ็ตรหัสผ่านเป็น 123456 แล้ว ผู้ใช้ต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งถัดไป'};
}

/** Admin-only user list; never returns password or token fields. */
function apiListUsers(token) {
  requireSession_(token,[ROLE.ADMIN]);
  return readObjects_('SYS_USERS').map(u=>({
    userId:u.USER_ID,username:u.USERNAME || u.EMAIL,email:u.EMAIL,displayName:u.DISPLAY_NAME,roleId:u.ROLE_ID,
    studentId:u.STUDENT_ID,status:u.STATUS,emailVerified:String(u.EMAIL_VERIFIED).toUpperCase()==='TRUE',
    createdAt:u.CREATED_AT ? new Date(u.CREATED_AT).toISOString() : '',lastLoginAt:u.LAST_LOGIN_AT ? new Date(u.LAST_LOGIN_AT).toISOString() : ''
  }));
}

function apiAdminImportStudentRosterFromExcel(token, fileId, sheetName) {
  const ctx=requireSession_(token, [ROLE.ADMIN]);
  return importStudentRosterFromExcel_(fileId, sheetName, ctx.user.USER_ID);
}

function apiSetUserRole(token, userId, roleId) {
  const ctx = requireSession_(token, [ROLE.ADMIN]);
  if (![ROLE.ADMIN, ROLE.ADVISOR, ROLE.STUDENT].includes(roleId)) throw new Error('Role ไม่ถูกต้อง');
  if (userId === ctx.user.USER_ID && roleId !== ROLE.ADMIN) throw new Error('ไม่สามารถลดสิทธิ์บัญชี Admin ที่กำลังใช้งานอยู่ได้');
  const target = readObjects_('SYS_USERS').find(u => u.USER_ID === userId);
  if (!target) throw new Error('ไม่พบบัญชีผู้ใช้');
  if (target.ROLE_ID === ROLE.ADMIN && roleId !== ROLE.ADMIN) {
    const adminCount = readObjects_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.ADMIN && u.STATUS==='ACTIVE').length;
    if (adminCount <= 1) throw new Error('ต้องมี Admin ที่ใช้งานได้อย่างน้อย 1 บัญชี');
  }
  sheet_('SYS_USERS').getRange(target._row, SCHEMA.SYS_USERS.indexOf('ROLE_ID') + 1).setValue(roleId);
  sheet_('SYS_USERS').getRange(target._row, SCHEMA.SYS_USERS.indexOf('UPDATED_AT') + 1).setValue(new Date());
  logSystem_('USER_ROLE_CHANGED','USER',userId,{oldRole:target.ROLE_ID,newRole:roleId},ctx.user.USER_ID);
  return {ok:true,message:'ปรับสิทธิ์ผู้ใช้เรียบร้อยแล้ว'};
}

function apiSetUserStatus(token,userId,status){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  if(!['ACTIVE','SUSPENDED'].includes(status)) throw new Error('สถานะไม่ถูกต้อง');
  if(userId===ctx.user.USER_ID && status!=='ACTIVE') throw new Error('ไม่สามารถระงับบัญชีของตนเองได้');
  const lock=LockService.getScriptLock(); lock.waitLock(60000);
  try{
    const user=readObjects_('SYS_USERS').find(u=>u.USER_ID===userId);
    if(!user) throw new Error('ไม่พบผู้ใช้');
    if(user.ROLE_ID===ROLE.ADMIN && status!=='ACTIVE'){
      const activeAdmins=readObjects_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.ADMIN && u.STATUS==='ACTIVE');
      if(activeAdmins.length<=1) throw new Error('ต้องมี Admin ที่ใช้งานได้อย่างน้อย 1 บัญชี');
    }
    const sh=sheet_('SYS_USERS');
    sh.getRange(user._row,SCHEMA.SYS_USERS.indexOf('STATUS')+1).setValue(status);
    sh.getRange(user._row,SCHEMA.SYS_USERS.indexOf('UPDATED_AT')+1).setValue(new Date());
    if(status==='SUSPENDED'){
      const sessions=readObjects_('SYS_SESSIONS').filter(x=>x.USER_ID===userId && !x.REVOKED_AT);
      const ss=sheet_('SYS_SESSIONS'); sessions.forEach(x=>ss.getRange(x._row,7).setValue(new Date()));
    }
    logSystem_('USER_STATUS_CHANGED','USER',userId,{status},ctx.user.USER_ID);
    return {ok:true,message:status==='ACTIVE'?'เปิดใช้งานบัญชีแล้ว':'ระงับบัญชีและยกเลิก Session แล้ว'};
  }finally{lock.releaseLock();}
}

function apiAdminBulkSetUserStatus(token,userIds,status){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  if(!['ACTIVE','SUSPENDED'].includes(status))throw new Error('สถานะไม่ถูกต้อง');
  const ids=Array.isArray(userIds)?[...new Set(userIds.map(x=>String(x||'').trim()).filter(Boolean))]:[];
  if(!ids.length)throw new Error('กรุณาเลือกบัญชีอย่างน้อย 1 รายการ');
  if(ids.length>200)throw new Error('ดำเนินการได้ไม่เกิน 200 บัญชีต่อครั้ง');
  if(status==='SUSPENDED'&&ids.includes(String(ctx.user.USER_ID)))throw new Error('ไม่สามารถปิดใช้งานบัญชี Admin ที่กำลังเข้าสู่ระบบได้');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const all=readObjectsFresh_('SYS_USERS');
    const targets=ids.map(id=>all.find(u=>String(u.USER_ID)===id)).filter(Boolean);
    if(targets.length!==ids.length)throw new Error('มีบัญชีบางรายการไม่พบในระบบ กรุณาโหลดรายการใหม่');
    if(status==='SUSPENDED'){
      const adminsToSuspend=targets.filter(u=>u.ROLE_ID===ROLE.ADMIN&&u.STATUS==='ACTIVE').length;
      const activeAdmins=all.filter(u=>u.ROLE_ID===ROLE.ADMIN&&u.STATUS==='ACTIVE').length;
      if(activeAdmins-adminsToSuspend<1)throw new Error('ต้องเหลือ Admin ที่ใช้งานได้อย่างน้อย 1 บัญชี');
    }
    const sh=sheet_('SYS_USERS'),statusCol=SCHEMA.SYS_USERS.indexOf('STATUS')+1,updatedCol=SCHEMA.SYS_USERS.indexOf('UPDATED_AT')+1;
    const now=new Date(),sessionSheet=sheet_('SYS_SESSIONS');
    targets.forEach(u=>{
      sh.getRange(u._row,statusCol).setValue(status);
      sh.getRange(u._row,updatedCol).setValue(now);
      if(status==='SUSPENDED'){
        readObjectsFresh_('SYS_SESSIONS').filter(x=>x.USER_ID===u.USER_ID&&!x.REVOKED_AT).forEach(x=>sessionSheet.getRange(x._row,7).setValue(now));
      }
      logSystem_('USER_STATUS_CHANGED','USER',u.USER_ID,{status,bulk:true},ctx.user.USER_ID);
    });
    return {ok:true,updated:targets.length,message:status==='SUSPENDED'?'ปิดใช้งาน '+targets.length+' บัญชีแล้ว โดยเก็บประวัติเดิมไว้':'เปิดใช้งาน '+targets.length+' บัญชีแล้ว'};
  }finally{lock.releaseLock();}
}

function apiGetAuditLog(token) {
  requireSession_(token,[ROLE.ADMIN]);
  return readObjects_('SYS_AUDIT_LOG').slice(-100).reverse().map(r=>({
    action:r.ACTION,targetType:r.TARGET_TYPE,targetId:r.TARGET_ID,createdAt:r.CREATED_AT ? new Date(r.CREATED_AT).toISOString() : '',actorUserId:r.ACTOR_USER_ID
  }));
}

/* ----------------------- Course operations & assessment v0.3.6 ----------------------- */
function sanitizeForClient_(value){
  if(value instanceof Date) return value.toISOString();
  if(value===undefined) return null;
  if(value===null || typeof value!=='object') return value;
  if(Array.isArray(value)) return value.map(sanitizeForClient_);
  const out={};
  Object.keys(value).forEach(k=>{out[k]=sanitizeForClient_(value[k]);});
  return out;
}

function apiAdminListCourseData(token){
  requireSession_(token,[ROLE.ADMIN]);
  const students=readObjects_('STUDENTS');
  const users=readObjects_('SYS_USERS');
  const members=readObjects_('GROUP_MEMBERS');
  const groups=readObjects_('RESEARCH_GROUPS');
  const assignments=readObjects_('ADVISOR_ASSIGNMENTS');
  const registered=new Map(users.filter(u=>u.ROLE_ID===ROLE.STUDENT).map(u=>[String(u.STUDENT_ID),u]));
  const activeMembership=new Map(members.filter(m=>m.STATUS==='ACTIVE').map(m=>[String(m.STUDENT_ID),m]));
  // Always return a complete, JSON-safe payload to google.script.run.
  // Date objects are not supported as client return values by Apps Script.
  const payload = {
    students:students.map(s=>{
      const id=String(s.STUDENT_ID);
      const u=registered.get(id), m=activeMembership.get(id);
      return {studentId:id,fullName:String(s.FULL_NAME||[s.TITLE,s.FIRST_NAME,s.LAST_NAME].filter(Boolean).join(' ')),section:String(s.SECTION||''),active:String(s.IS_ACTIVE).toUpperCase()!=='FALSE',registered:!!u,email:u?String(u.EMAIL||''):'',groupId:m?String(m.GROUP_ID||''):'',groupName:m?String(((groups.find(g=>g.GROUP_ID===m.GROUP_ID)||{}).GROUP_NAME)||''):''};
    }),
    users:users.filter(u=>u.STATUS==='ACTIVE').map(u=>({userId:String(u.USER_ID||''),displayName:String(u.DISPLAY_NAME||''),email:String(u.EMAIL||''),roleId:String(u.ROLE_ID||''),studentId:String(u.STUDENT_ID||''),status:String(u.STATUS||'')})),
    groups:groups.filter(g=>g.STATUS==='ACTIVE').map(g=>({ ...g, GROUP_LEADER_USER_ID:String(g.GROUP_LEADER_USER_ID||'') })),members,assignments,advisorInvitations:readObjectsFresh_('ADVISOR_INVITATIONS'),
    settings:assessmentSettings_(),
    registrationOpen:String(getConfigValue_('STUDENT_REGISTRATION_OPEN','TRUE')).toUpperCase()==='TRUE'
  };
  return sanitizeForClient_(payload);
}
