/**
 * SPORT SCIENCE RESEARCH LAB — Phase 2 Core System
 * Google Apps Script / Google Sheets
 * Build: 0.4.0.2-MEETING-MONITORING-TEST
 *
 * IMPORTANT:
 * - Deploy TEST only. Do not point this project at production data.
 * - Custom email/password authentication is an interim implementation.
 * - Before real student use, complete the security/UAT checklist in README.md.
 */

const APP = Object.freeze({
  NAME: 'SPORT SCIENCE RESEARCH LAB',
  VERSION: '0.4.0.2-MEETING-MONITORING-TEST',
  COURSE_CODE: '4084901',
  TERM: '2/2569',
  SECTION: '01',
  COHORT: '670429501',
  SESSION_HOURS: 4,
  OTP_MINUTES: 10,
  OTP_MAX_ATTEMPTS: 5,
  PASSWORD_MIN: 6,
  PASSWORD_ITERATIONS: 5000
});

const SCHEMA = Object.freeze({
  SYS_CONFIG: ['KEY','VALUE','UPDATED_AT','UPDATED_BY'],
  SYS_ROLES: ['ROLE_ID','ROLE_NAME_TH','ROLE_NAME_EN','DESCRIPTION','IS_ACTIVE'],
  SYS_USERS: ['USER_ID','EMAIL','DISPLAY_NAME','ROLE_ID','STUDENT_ID','PASSWORD_SALT','PASSWORD_HASH','STATUS','EMAIL_VERIFIED','CREATED_AT','UPDATED_AT','LAST_LOGIN_AT','CREATED_BY','USERNAME','PASSWORD_CHANGE_REQUIRED'],
  SYS_SESSIONS: ['SESSION_ID','USER_ID','TOKEN_HASH','CREATED_AT','EXPIRES_AT','LAST_SEEN_AT','REVOKED_AT','USER_AGENT'],
  SYS_OTP: ['OTP_ID','EMAIL','PURPOSE','SUBJECT_ID','OTP_HASH','EXPIRES_AT','ATTEMPTS','CREATED_AT','USED_AT','PAYLOAD_JSON'],
  SYS_INVITATIONS: ['INVITATION_ID','EMAIL','DISPLAY_NAME','ROLE_ID','INVITE_CODE_HASH','STATUS','EXPIRES_AT','CREATED_AT','CREATED_BY','ACCEPTED_AT'],
  SYS_AUDIT_LOG: ['LOG_ID','ACTOR_USER_ID','ACTION','TARGET_TYPE','TARGET_ID','DETAILS_JSON','CREATED_AT'],
  STUDENTS: ['STUDENT_ID','FULL_NAME','COURSE_CODE','TERM','SECTION','COHORT','IS_ACTIVE','SOURCE','FIRST_NAME','LAST_NAME','TITLE'],
  SYS_MIGRATIONS: ['MIGRATION_ID','VERSION','DESCRIPTION','APPLIED_AT','APPLIED_BY'],
  RESEARCH_GROUPS: ['GROUP_ID','GROUP_NAME','TOPIC_TITLE_TH','TOPIC_TITLE_EN','STATUS','CREATED_BY','CREATED_AT','UPDATED_AT','GROUP_LEADER_USER_ID'],
  GROUP_MEMBERS: ['MEMBERSHIP_ID','GROUP_ID','STUDENT_ID','USER_ID','STATUS','JOINED_AT','UPDATED_AT'],
  ADVISOR_ASSIGNMENTS: ['ASSIGNMENT_ID','GROUP_ID','ADVISOR_USER_ID','STATUS','APPROVED_BY','APPROVED_AT','CREATED_AT'],
  ADVISOR_INVITATIONS: ['INVITATION_ID','GROUP_ID','ADVISOR_NAME','ADVISOR_EMAIL','STATUS','TOKEN_HASH','EXPIRES_AT','CREATED_AT','CREATED_BY','RESPONDED_AT','RESPONSE_NOTE','APPROVED_BY','APPROVED_AT','ADVISOR_USER_ID','PASSWORD_SALT','PASSWORD_HASH'],
  ADVISOR_MAGIC_LINKS: ['LINK_ID','USER_ID','EMAIL','TOKEN_HASH','EXPIRES_AT','CREATED_AT','USED_AT'],
  MEETING_RECORDS: ['MEETING_ID','GROUP_ID','MEETING_NO','MEETING_WEEK','MEETING_DATE','STUDENT_ID','ATTENDANCE_STATUS','NOTES','RECORDED_BY','UPDATED_AT'],
  MEETING_FILES: ['FILE_RECORD_ID','GROUP_ID','MEETING_NO','MEETING_WEEK','FILE_NAME','MIME_TYPE','FILE_SIZE','DRIVE_FILE_ID','DRIVE_URL','UPLOADED_BY','UPLOADED_AT','STATUS','NOTES','VERIFIED_BY','VERIFIED_AT','REVIEW_COMMENT'],
  ASSESSMENT_SETTINGS: ['SETTING_KEY','SETTING_VALUE','UPDATED_AT','UPDATED_BY'],
  GROUP_SCORES: ['GROUP_ID','A1_SCORE','A2_SCORE','A3_SCORE','A4_GROUP_SCORE','A4_ADVISOR_USER_ID','UPDATED_AT','UPDATED_BY'],
  INDIVIDUAL_SCORES: ['STUDENT_ID','GROUP_ID','A4_INDIVIDUAL_SCORE','A5_SCORE','A6_SCORE','ADMIN_NOTE','UPDATED_AT','UPDATED_BY'],
  PEER_ASSESSMENTS: ['PEER_ID','GROUP_ID','EVALUATOR_STUDENT_ID','EVALUATEE_STUDENT_ID','RESPONSIBILITY','DEADLINE','WORK_QUALITY','COLLABORATION','COMMUNICATION','SUBMITTED_AT'],
  RESEARCH_TOPIC_VERSIONS: ['VERSION_ID','GROUP_ID','VERSION_NO','TITLE_TH','TITLE_EN','PROBLEM_STATEMENT','OBJECTIVES','RESEARCH_SIGNIFICANCE','STATUS','REVIEW_STATUS','SUBMITTED_BY','SUBMITTED_AT','REVIEWED_BY','REVIEWED_AT','REVIEW_COMMENT'],
  RESEARCH_TOPIC_DRAFTS: ['DRAFT_ID','GROUP_ID','TITLE_TH','TITLE_EN','PROBLEM_STATEMENT','OBJECTIVES','RESEARCH_SIGNIFICANCE','STATUS','UPDATED_BY','UPDATED_AT'],
  PROPOSAL_FILES: ['FILE_RECORD_ID','GROUP_ID','CHAPTER','FILE_NAME','MIME_TYPE','FILE_SIZE','DRIVE_FILE_ID','DRIVE_URL','UPLOADED_BY','UPLOADED_AT','STATUS','NOTES'],
  PROGRESS_REPORTS: ['REPORT_ID','GROUP_ID','WEEK_NO','MILESTONE','WORK_COMPLETED','PROBLEMS','NEXT_ACTIONS','SUBMITTED_BY','SUBMITTED_AT','STATUS','REVIEWED_BY','REVIEWED_AT','REVIEW_COMMENT','TIMELINESS_STATUS','REVISION_DUE_AT','EXTENSION_ID'],
  PROGRESS_WEEK_SETTINGS: ['WEEK_NO','TITLE','DESCRIPTION','DELIVERABLE','CRITERIA','IS_OPEN','UPDATED_AT','UPDATED_BY','DUE_DATE'],
  GROUP_PROGRESS_DRAFTS: ['DRAFT_ID','GROUP_ID','WEEK_NO','WORK_COMPLETED','PROBLEMS','NEXT_ACTIONS','VERSION_NO','UPDATED_BY','UPDATED_AT','LOCK_VERSION'],
  GROUP_ACTIVITY_LOG: ['ACTIVITY_ID','GROUP_ID','WEEK_NO','USER_ID','ACTION','DETAILS','CREATED_AT'],
  GROUP_TASKS: ['TASK_ID','GROUP_ID','WEEK_NO','TASK_TITLE','TASK_DETAIL','ASSIGNED_TO_USER_ID','STATUS','CREATED_BY','CREATED_AT','UPDATED_AT','PRIORITY','DUE_DATE','COMPLETED_AT'],
  GROUP_LEADER_HISTORY: ['HISTORY_ID','GROUP_ID','OLD_LEADER_USER_ID','NEW_LEADER_USER_ID','ACTION_BY','ACTION_AT','NOTE'],
  ADVISOR_FEEDBACK: ['FEEDBACK_ID','GROUP_ID','RELATED_TYPE','RELATED_ID','COMMENT','CREATED_BY','CREATED_AT','STATUS'],
  NOTIFICATIONS: ['NOTIFICATION_ID','USER_ID','GROUP_ID','TYPE','TITLE','MESSAGE','RELATED_TYPE','RELATED_ID','IS_READ','CREATED_AT','READ_AT'],
  NOTIFICATION_QUEUE: ['QUEUE_ID','EVENT_KEY','RECIPIENT_EMAIL','RECIPIENT_USER_ID','SUBJECT','BODY','STATUS','ATTEMPTS','NEXT_ATTEMPT_AT','LEASE_UNTIL','LAST_ERROR','CREATED_AT','SENT_AT'],
  NOTIFICATION_LOG: ['LOG_ID','QUEUE_ID','EVENT_KEY','STATUS','DETAILS','CREATED_AT'],
  EARLY_WARNING_RULES: ['RULE_ID','RULE_CODE','RULE_NAME','IS_ACTIVE','PARAMETERS_JSON','UPDATED_BY','UPDATED_AT'],
  EARLY_WARNING_FLAGS: ['FLAG_ID','GROUP_ID','RULE_CODE','SEVERITY','STATUS','DESCRIPTION','EVIDENCE_JSON','ACKNOWLEDGED_BY','ACKNOWLEDGED_AT','RESOLUTION_NOTE','RESOLVED_BY','RESOLVED_AT','CREATED_AT','UPDATED_AT'],
  ETHICS_TRACKING: ['GROUP_ID','ETHICS_PLAN','ETHICS_PLAN_DUE_WEEK','SUBMISSION_STATUS','REC_SUBMITTED_AT','REC_REFERENCE_NO','REC_APPROVAL_STATUS','REC_APPROVAL_NO','REC_APPROVAL_DATE','REVIEW_TYPE','VULNERABLE_GROUP_INVOLVEMENT','REC_VERIFIED_AT','REC_VERIFIED_BY','REC_SOURCE_REFERENCE','UPDATED_BY','UPDATED_AT'],
  TASK_COMMENTS: ['COMMENT_ID','TASK_ID','GROUP_ID','COMMENT','CREATED_BY','CREATED_AT','STATUS'],
  GRADE_RELEASES: ['RELEASE_ID','ASSESSMENT_CYCLE','STATUS','LOCKED_BY','LOCKED_AT','RELEASED_BY','RELEASED_AT','REOPEN_REASON','UPDATED_AT'],
  GROUP_SCORE_AUDIT: ['AUDIT_ID','GROUP_ID','BEFORE_JSON','AFTER_JSON','REASON','ACTOR_USER_ID','CREATED_AT'],
  GROUP_DEADLINE_EXTENSIONS: ['EXTENSION_ID','GROUP_ID','WEEK_NO','ORIGINAL_DUE_DATE','NEW_DUE_DATE','REASON','APPROVED_BY','APPROVED_AT','STATUS']
});

const ROLE = Object.freeze({
  ADMIN: 'ADMIN',
  ADVISOR: 'ADVISOR',
  STUDENT: 'STUDENT'
});

/** Web entry point. */
function doGet(e) {
  e=e||{parameter:{}};
  const p=e.parameter||{};
  if(p.advisorInvite){
    const token=normalizeAdvisorInviteToken_(p.advisorInvite),inv=findAdvisorInvitationByToken_(token);
    if(inv&&inv.STATUS==='ACCEPTED'){
      const acceptedHtml='<meta name="viewport" content="width=device-width, initial-scale=1"><main style="font-family:Arial,sans-serif;max-width:620px;margin:40px auto;padding:28px;border:1px solid #dbe4ee;border-radius:16px;color:#193650"><h2>ท่านตอบรับคำเชิญเรียบร้อยแล้ว</h2><p>ระบบบันทึกการตอบรับและรหัสผ่านของท่านแล้ว</p><p>ขณะนี้อยู่ระหว่างรอ Admin อนุมัติการแต่งตั้ง</p><p>ไม่จำเป็นต้องตอบรับซ้ำ สามารถปิดหน้านี้ได้</p></main>';
      return HtmlService.createHtmlOutput(acceptedHtml).setTitle('ตอบรับคำเชิญแล้ว').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    if(!inv||inv.STATUS!=='INVITED') return HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width, initial-scale=1"><main style="font-family:Arial,sans-serif;max-width:620px;margin:40px auto;padding:24px"><h2>ลิงก์คำเชิญไม่ถูกต้อง หมดอายุ หรือถูกใช้แล้ว</h2></main>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    const actionUrl=ScriptApp.getService().getUrl();
    const html='<meta name="viewport" content="width=device-width, initial-scale=1"><main style="font-family:Arial,sans-serif;max-width:620px;margin:32px auto;padding:28px;border:1px solid #dbe4ee;border-radius:16px;color:#193650"><h2>ยืนยันคำเชิญเป็นอาจารย์ที่ปรึกษา</h2><p>เรียน '+escapeHtml_(inv.ADVISOR_NAME)+'</p><p>อีเมล: '+escapeHtml_(inv.ADVISOR_EMAIL)+'</p><p>กลุ่มวิจัย: '+escapeHtml_(inv.GROUP_NAME||inv.GROUP_ID)+'</p><p>หากท่านตอบรับ กรุณากำหนดรหัสผ่านสำหรับใช้เข้าสู่ระบบภายหลัง โดยการแต่งตั้งยังต้องรอ Admin อนุมัติ</p><form method="post" action="'+actionUrl+'" style="display:grid;gap:12px"><input type="hidden" name="advisorInviteToken" value="'+escapeHtml_(token)+'"><input type="hidden" name="advisorDecision" value="ACCEPT"><label>ตั้งรหัสผ่าน<input name="advisorPassword" type="password" minlength="6" autocomplete="new-password" required style="display:block;width:100%;padding:12px;margin-top:6px;box-sizing:border-box"></label><label>ยืนยันรหัสผ่าน<input name="advisorConfirmPassword" type="password" minlength="6" autocomplete="new-password" required style="display:block;width:100%;padding:12px;margin-top:6px;box-sizing:border-box"></label><small>รหัสผ่านต้องมีตัวอักษร ตัวเลข และอักขระพิเศษ อย่างน้อย 6 ตัวอักษร</small><button type="submit" style="padding:13px;background:#193650;color:white;border:0;border-radius:9px">ตอบรับและตั้งรหัสผ่าน</button></form><form method="post" action="'+actionUrl+'" style="margin-top:14px"><input type="hidden" name="advisorInviteToken" value="'+escapeHtml_(token)+'"><input type="hidden" name="advisorDecision" value="DECLINE"><button type="submit" style="padding:10px 16px;border:1px solid #ccd6e0;border-radius:9px;background:white">ปฏิเสธคำเชิญ</button></form></main>';
    return HtmlService.createHtmlOutput(html).setTitle('ยืนยันคำเชิญอาจารย์ที่ปรึกษา').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  let magicSessionToken='';
  if(p.advisorMagic){
    return HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width, initial-scale=1"><main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;padding:24px;border:1px solid #ddd;border-radius:12px"><h2>เข้าสู่ระบบ Advisor</h2><p>กดปุ่มด้านล่างเพื่อยืนยันการเข้าสู่ระบบด้วยอีเมล</p><form method="post" action="'+ScriptApp.getService().getUrl()+'"><input type="hidden" name="advisorMagicToken" value="'+escapeHtml_(String(p.advisorMagic))+'"><button style="padding:12px 20px;background:#17324d;color:white;border:0;border-radius:8px">ยืนยันและเข้าสู่ระบบ</button></form></main>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return renderFrontend_(magicSessionToken);
}
function doPost(e){
  const p=(e&&e.parameter)||{};
  if(p.advisorInviteToken){
    let result;
    const inviteToken=normalizeAdvisorInviteToken_(p.advisorInviteToken);
    try{
      result=respondAdvisorInvitation_(inviteToken,String(p.advisorDecision||''),String(p.advisorPassword||''),String(p.advisorConfirmPassword||''));
    }catch(err){
      const errorHtml='<meta name="viewport" content="width=device-width, initial-scale=1"><main style="font-family:Arial,sans-serif;max-width:620px;margin:40px auto;padding:24px"><h2>ยังดำเนินการไม่สำเร็จ</h2><p>'+escapeHtml_(err.message||String(err))+'</p><p><a href="'+ScriptApp.getService().getUrl()+'?advisorInvite='+encodeURIComponent(inviteToken)+'">กลับไปแก้ไขข้อมูล</a></p></main>';
      return HtmlService.createHtmlOutput(errorHtml)
        .setTitle('ดำเนินการคำเชิญ')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    const successHtml='<meta name="viewport" content="width=device-width, initial-scale=1"><main style="font-family:Arial,sans-serif;max-width:620px;margin:40px auto;padding:24px;border:1px solid #ddd;border-radius:12px"><h2>'+escapeHtml_(result.message)+'</h2><p>ท่านสามารถปิดหน้านี้ได้</p></main>';
    return HtmlService.createHtmlOutput(successHtml)
      .setTitle('ผลการตอบรับคำเชิญ')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if(p.advisorMagicToken){
    const token=consumeAdvisorMagicLink_(String(p.advisorMagicToken));
    return renderFrontend_(token);
  }
  return HtmlService.createHtmlOutput('คำขอไม่ถูกต้อง')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * GitHub-hosted frontend loader.
 * Frontend assets are fetched only from this immutable commit SHA.
 * The whitelist prevents arbitrary URL/path fetching.
 */
const FRONTEND_CONFIG = Object.freeze({
  OWNER: 'worrawutt-source',
  REPOSITORY: 'worrawutsportsci',
  COMMIT_SHA: '7b115f67c0a3cd5d985a1d036f385c7ecad1412e',
  BASE_PATH: 'project/frontend/',
  CACHE_SECONDS: 21600,
  CACHE_CHUNK_SIZE: 20000
});

/**
 * Run once from the Apps Script editor after adding the external_request scope.
 * This authorizes and verifies the pinned GitHub frontend source without
 * changing database records or Script Properties.
 */
function authorizeFrontendFetch() {
  const html = getFrontendAsset_('Index.html');
  return {
    ok: !!html,
    commit: FRONTEND_CONFIG.COMMIT_SHA,
    characters: html.length,
    message: 'GitHub frontend fetch completed'
  };
}

function renderFrontend_(magicSessionToken) {
  const html = getFrontendAsset_('Index.html')
    .replace('<!-- SSRL_STYLES -->', getFrontendAsset_('Styles.html'))
    .replace('<!-- SSRL_CLIENT -->', getFrontendAsset_('Client.html'))
    .replace('__SSRL_MAGIC_SESSION_JSON__', safeJsonForHtml_(magicSessionToken || ''));

  if (/<!-- SSRL_(?:STYLES|CLIENT) -->|__SSRL_MAGIC_SESSION_JSON__|<\?!=/.test(html)) {
    throw new Error('Frontend template markers were not fully resolved');
  }
  return HtmlService.createHtmlOutput(html)
    .setTitle(APP.NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function safeJsonForHtml_(value) {
  return JSON.stringify(String(value || ''))
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function getFrontendAsset_(filename) {
  const allowed = ['Index.html', 'Client.html', 'Styles.html'];
  if (!allowed.includes(filename)) throw new Error('Frontend asset is not allowed');
  const cache = CacheService.getScriptCache();
  const key = 'SSRL_FRONTEND_' + FRONTEND_CONFIG.COMMIT_SHA + '_' + filename;
  const count = Number(cache.get(key + '_COUNT') || 0);
  if (count > 0) {
    const chunks = [];
    for (let i = 0; i < count; i++) {
      const part = cache.get(key + '_' + i);
      if (part === null) { chunks.length = 0; break; }
      chunks.push(part);
    }
    if (chunks.length === count) return chunks.join('');
  }

  const url = 'https://raw.githubusercontent.com/' +
    FRONTEND_CONFIG.OWNER + '/' + FRONTEND_CONFIG.REPOSITORY + '/' +
    FRONTEND_CONFIG.COMMIT_SHA + '/' + FRONTEND_CONFIG.BASE_PATH + filename;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    followRedirects: true,
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  if (status !== 200) {
    throw new Error('โหลดไฟล์ ' + filename + ' จาก GitHub ไม่สำเร็จ (HTTP ' + status + ')');
  }
  const content = response.getContentText('UTF-8');
  if (!content) throw new Error('ไฟล์ frontend ว่าง: ' + filename);

  const pieces = [];
  for (let offset = 0; offset < content.length; offset += FRONTEND_CONFIG.CACHE_CHUNK_SIZE) {
    pieces.push(content.slice(offset, offset + FRONTEND_CONFIG.CACHE_CHUNK_SIZE));
  }
  try {
    pieces.forEach(function(piece, index) {
      cache.put(key + '_' + index, piece, FRONTEND_CONFIG.CACHE_SECONDS);
    });
    cache.put(key + '_COUNT', String(pieces.length), FRONTEND_CONFIG.CACHE_SECONDS);
  } catch (cacheError) {
    // Cache is an optimization only; the fetched content remains usable.
  }
  return content;
}

/**
 * Legacy initialization entry point intentionally disabled.
 * Database setup must not overwrite existing course data or role records.
 */
function initializeTestDatabase() {
  throw new Error('การ initialize ฐานข้อมูลถูกปิดเพื่อป้องกันข้อมูลเดิม กรุณาตรวจสอบ Script Properties DB_ID และใช้ฐานข้อมูล TEST ที่มีอยู่');
}

/**
 * Import student roster from an Excel .xlsx file stored in Google Drive.
 * Requires Advanced Google Service: Drive API v3 enabled.
 * Expected columns: student ID + first name + last name OR full name.
 */
function importStudentRosterFromExcel_(fileId, sheetName, actorUserId) {
  requireDatabase_();
  if (!fileId) throw new Error('กรุณาระบุ File ID ของไฟล์ Excel');
  const sourceFile = DriveApp.getFileById(String(fileId));
  const mime = sourceFile.getMimeType();
  if (!/spreadsheet|excel|officedocument/i.test(mime) && !/\.xlsx?$/i.test(sourceFile.getName())) {
    throw new Error('ไฟล์ที่เลือกไม่ใช่ Excel หรือ Spreadsheet ที่รองรับ');
  }

  let convertedId = '';
  try {
    const converted = Drive.Files.create(
      {name: 'TEMP_IMPORT_' + sourceFile.getName(), mimeType: 'application/vnd.google-apps.spreadsheet'},
      sourceFile.getBlob(),
      {fields: 'id'}
    );
    convertedId = converted.id;
    const xss = SpreadsheetApp.openById(convertedId);
    const sh = sheetName ? xss.getSheetByName(sheetName) : xss.getSheets()[0];
    if (!sh) throw new Error('ไม่พบ Sheet ในไฟล์ Excel: ' + sheetName);
    const values = sh.getDataRange().getDisplayValues();
    const norm = v => String(v || '').trim().toLowerCase().replace(/\s+/g,'').replace(/[：:]/g,'');
    const idKeys = ['student_id','รหัสนักศึกษา','รหัสนิสิต','รหัสประจำตัวนักศึกษา'].map(norm);
    const fullKeys = ['full_name','ชื่อ-สกุล','ชื่อสกุล','ชื่อ-นามสกุล'].map(norm);
    const firstKeys = ['first_name','firstname','ชื่อ','ชื่อตัว'].map(norm);
    const lastKeys = ['last_name','lastname','surname','นามสกุล'].map(norm);
    const titleKeys = ['title','prefix','คำนำหน้า','คำนำหน้าชื่อ'].map(norm);
    let hr=-1, ci={};
    for (let r=0; r<Math.min(values.length,20); r++) {
      const h=values[r].map(norm);
      const id=h.findIndex(x=>idKeys.includes(x));
      const full=h.findIndex(x=>fullKeys.includes(x));
      const first=h.findIndex(x=>firstKeys.includes(x));
      const last=h.findIndex(x=>lastKeys.includes(x));
      const title=h.findIndex(x=>titleKeys.includes(x));
      if (id>=0 && ((first>=0 && last>=0) || full>=0)) { hr=r; ci={id,full,first,last,title}; break; }
    }
    if (hr<0) throw new Error('ไม่พบหัวคอลัมน์รหัสนักศึกษาและชื่อ-นามสกุลใน 20 แถวแรก');
    const records=values.slice(hr+1).filter(r=>String(r[ci.id]||'').trim()).map(r=>{
      let first=ci.first>=0?String(r[ci.first]||'').trim():'';
      let last=ci.last>=0?String(r[ci.last]||'').trim():'';
      let title=ci.title>=0?String(r[ci.title]||'').trim():'';
      let full=ci.full>=0?String(r[ci.full]||'').trim():[title,first,last].filter(Boolean).join(' ').trim();
      if (!full) full=[title,first,last].filter(Boolean).join(' ').trim();
      if (ci.full>=0 && !first && !last && full) {
        const titleRegex = /^(นางสาว|น\.ส\.|นาย|นาง|ดร\.|ผศ\.ดร\.|รศ\.ดร\.|ศ\.ดร\.|ผศ\.|รศ\.|ศ\.)\s*(.+)$/;
        const match = full.match(titleRegex);
        let remaining = full;
        if (match) { title = title || match[1]; remaining = match[2].trim(); }
        const parts=remaining.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) { last=parts.pop(); first=parts.join(' '); }
        else { first=remaining; }
      }
      const studentId = String(r[ci.id]).trim();
      return [studentId,full,APP.COURSE_CODE,String(APP.TERM),String(APP.SECTION),String(APP.COHORT),true,'EXCEL:'+sourceFile.getName(),first,last,title];
    });
    if (!records.length) throw new Error('ไม่พบข้อมูลนักศึกษาหลังแถวหัวตาราง');
    const ids=records.map(r=>r[0]);
    if (new Set(ids).size!==ids.length) throw new Error('พบรหัสนักศึกษาซ้ำในไฟล์ Excel');
    const target=sheet_('STUDENTS');
    const existing=readObjects_('STUDENTS');
    const existingIds=new Set(existing.map(r=>String(r.STUDENT_ID)));
    const add=records.filter(r=>!existingIds.has(r[0]));
    if (add.length) { const range=target.getRange(target.getLastRow()+1,1,add.length,SCHEMA.STUDENTS.length); range.setNumberFormat('@'); range.setValues(add); }
    logSystem_('ROSTER_IMPORTED_FROM_EXCEL','STUDENT_ROSTER',APP.COURSE_CODE+'-'+APP.TERM,{fileName:sourceFile.getName(),sourceRows:records.length,imported:add.length,skipped:records.length-add.length},actorUserId || 'SYSTEM');
    return {ok:true,fileName:sourceFile.getName(),sourceRows:records.length,imported:add.length,alreadyPresent:records.length-add.length,total:readObjects_('STUDENTS').length};
  } finally {
    if (convertedId) {
      try { Drive.Files.delete(convertedId); } catch (cleanupError) { console.warn('Temporary conversion cleanup failed: '+cleanupError.message); }
    }
  }
}

/** Public client API: student registration begins with roster validation and email OTP. */
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

function advisorWorkspaceSummary_(advisorUserId){
  const groups=getAdvisorAssignedGroups_(advisorUserId),ids=new Set(groups.map(g=>String(g.groupId)));
  const reports=readObjectsFresh_('PROGRESS_REPORTS').filter(r=>ids.has(String(r.GROUP_ID||'')));
  const topics=readObjectsFresh_('RESEARCH_TOPIC_VERSIONS').filter(r=>ids.has(String(r.GROUP_ID||'')));
  const meetings=readObjectsFresh_('MEETING_RECORDS').filter(r=>ids.has(String(r.GROUP_ID||'')));
  const feedback=readObjectsFresh_('ADVISOR_FEEDBACK').filter(r=>ids.has(String(r.GROUP_ID||''))&&String(r.STATUS||'ACTIVE').toUpperCase()==='ACTIVE');
  const pendingReports=reports.filter(r=>['SUBMITTED','RESUBMITTED'].includes(String(r.STATUS||'').toUpperCase()));
  const pendingTopics=topics.filter(r=>String(r.REVIEW_STATUS||'').toUpperCase()==='PENDING');
  return {groups,metrics:{assignedGroups:groups.length,pendingReports:pendingReports.length,pendingTopics:pendingTopics.length,meetingsRecorded:new Set(meetings.map(r=>String(r.GROUP_ID)+'|'+String(r.MEETING_NO))).size,feedbackProvided:feedback.length}};
}

/** Advisor workspace summary: one server round-trip for dashboard and group monitoring. */
function apiGetAdvisorWorkspaceSummary(token){
  const ctx=requireSession_(token,[ROLE.ADVISOR]);
  const summary=advisorWorkspaceSummary_(ctx.user.USER_ID);
  const groups=summary.groups;
  const ids=new Set(groups.map(g=>String(g.groupId)));
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
  return sanitizeForClient_({
    metrics:{
      assignedGroups:groups.length,
      pendingReports:pendingReports.length,
      pendingTopics:pendingTopics.length,
      meetingsRecorded:meetings.length,
      feedbackProvided:feedback.length,
      openTasks:tasks.length
    },
    groups:groupSummaries,pendingReports,pendingTopics,
    assessmentWindowA4:assessmentSettingsFresh_().WINDOW_A4||'CLOSED'
  });
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
    base.menu = ['ภาพรวมระบบ','จัดการกลุ่มวิจัย','กำหนดอาจารย์ที่ปรึกษา','จัดการหัวข้องานวิจัย','บันทึกการเข้าพบ','จัดการรายงานความก้าวหน้า','จัดการงานกลุ่ม','ติดตามจริยธรรม','สัญญาณเตือนความเสี่ยง','ประเมินผล A1–A6','บัญชีผู้ใช้','นำเข้ารายชื่อนักศึกษา','บันทึกระบบ','การตั้งค่าระบบ'];
    } else if (role === ROLE.ADVISOR) {
    const advisorSummary=advisorWorkspaceSummary_(ctx.user.USER_ID);
    base.metrics={assignedGroups:advisorSummary.metrics.assignedGroups,pendingReports:advisorSummary.metrics.pendingReports,pendingTopics:advisorSummary.metrics.pendingTopics,meetingsRecorded:advisorSummary.metrics.meetingsRecorded};
    base.menu = ['ภาพรวมการให้คำปรึกษา','กลุ่มที่ได้รับมอบหมาย','บันทึกการพบอาจารย์','ประเมิน A4'];
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
    const groupId=activeGroup?String(activeGroup.GROUP_ID):'';
    const groupTasks=groupId?readObjectsFresh_('GROUP_TASKS').filter(t=>String(t.GROUP_ID)===groupId):[];
    const openTasks=groupTasks.filter(t=>['OPEN','IN_PROGRESS','BLOCKED'].includes(String(t.STATUS||'').toUpperCase())).length;
    const progressReports=groupId?readObjectsFresh_('PROGRESS_REPORTS').filter(r=>String(r.GROUP_ID)===groupId):[];
    const approvedWeeks=new Set(progressReports.filter(r=>String(r.STATUS||'').toUpperCase()==='APPROVED').map(r=>String(r.WEEK_NO||'' )).filter(Boolean));
    const groupFeedback=groupId?readObjectsFresh_('ADVISOR_FEEDBACK').filter(f=>String(f.GROUP_ID)===groupId&&String(f.STATUS||'').toUpperCase()!=='DELETED'): [];
    base.metrics = {
      groupStatus: activeGroup ? 'จัดกลุ่มแล้ว' : 'ยังไม่ได้จัดกลุ่ม',
      milestones: approvedWeeks.size,
      feedback: groupFeedback.length,
      openTasks: openTasks
    };
    base.menu = ['ข้อมูลของกลุ่ม','หัวข้องานวิจัย','งานกลุ่ม','เอกสารโครงร่าง','ความก้าวหน้า','บันทึกการเข้าพบ','ประเมินเพื่อน A5','ข้อเสนอแนะ','ผลการประเมิน'];
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

function apiAdminCreateGroup(token,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN]); payload=payload||{};
  const name=String(payload.groupName||'').trim();
  if(!name) throw new Error('กรุณาระบุชื่อกลุ่ม');
  if(name.length>100) throw new Error('ชื่อกลุ่มต้องไม่เกิน 100 ตัวอักษร');
  const lock=LockService.getScriptLock(); lock.waitLock(60000);
  try{
    if(readObjects_('RESEARCH_GROUPS').some(g=>g.STATUS==='ACTIVE'&&String(g.GROUP_NAME).trim().toLowerCase()===name.toLowerCase())) throw new Error('มีชื่อกลุ่มนี้อยู่แล้ว');
    const id=Utilities.getUuid(), now=new Date();
    appendObject_('RESEARCH_GROUPS',{GROUP_ID:id,GROUP_NAME:name,TOPIC_TITLE_TH:String(payload.topicTh||''),TOPIC_TITLE_EN:String(payload.topicEn||''),STATUS:'ACTIVE',CREATED_BY:ctx.user.USER_ID,CREATED_AT:now,UPDATED_AT:now});
    logSystem_('RESEARCH_GROUP_CREATED','GROUP',id,{groupName:name},ctx.user.USER_ID);
    return {ok:true,groupId:id,message:'สร้างกลุ่มวิจัยแล้ว'};
  }finally{lock.releaseLock();}
}

function normalizeStudentId_(value){
  // Compare IDs as trimmed text; preserve leading zeros and avoid numeric coercion.
  return String(value===null||value===undefined?'':value).trim().replace(/\s+/g,'');
}

function findActiveStudentUserById_(studentId){
  const target=normalizeStudentId_(studentId);
  if(!target) return null;
  const matches=readObjects_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE'&&normalizeStudentId_(u.STUDENT_ID)===target);
  return matches.length===1?matches[0]:null;
}

function addStudentToGroup_(groupId,studentId,userId,actorId){
  const group=readObjects_('RESEARCH_GROUPS').find(g=>g.GROUP_ID===groupId&&g.STATUS==='ACTIVE');
  if(!group) throw new Error('ไม่พบกลุ่มวิจัย');
  const student=readObjects_('STUDENTS').find(s=>normalizeStudentId_(s.STUDENT_ID)===normalizeStudentId_(studentId)&&String(s.IS_ACTIVE).toUpperCase()!=='FALSE');
  if(!student) throw new Error('ไม่พบรหัสนักศึกษาในทะเบียนที่ใช้งานอยู่');
  if(readObjects_('GROUP_MEMBERS').some(m=>normalizeStudentId_(m.STUDENT_ID)===normalizeStudentId_(studentId)&&m.STATUS==='ACTIVE')) throw new Error('นักศึกษานี้อยู่ในกลุ่มอื่นแล้ว');
  const user=userId?readObjects_('SYS_USERS').find(u=>u.USER_ID===userId&&u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE'):findActiveStudentUserById_(studentId);
  appendObject_('GROUP_MEMBERS',{MEMBERSHIP_ID:Utilities.getUuid(),GROUP_ID:groupId,STUDENT_ID:String(studentId),USER_ID:user?user.USER_ID:'',STATUS:'ACTIVE',JOINED_AT:new Date(),UPDATED_AT:new Date()});
  logSystem_('GROUP_MEMBER_ADDED','GROUP',groupId,{studentId:String(studentId)},actorId);
  return {ok:true,message:'เพิ่มสมาชิกเข้ากลุ่มแล้ว'};
}

function apiAdminAddGroupMember(token,groupId,studentId){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{return addStudentToGroup_(String(groupId),String(studentId), '',ctx.user.USER_ID);}
  finally{lock.releaseLock();}
}

// Add multiple students to one research group in a single server request.
function apiAdminAddGroupMembers(token,groupId,studentIds){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const gid=String(groupId||'').trim();
  const ids=Array.isArray(studentIds)?studentIds.map(x=>normalizeStudentId_(x)).filter(Boolean):[];
  if(!gid) throw new Error('กรุณาเลือกกลุ่มวิจัย');
  if(!ids.length) throw new Error('กรุณาเลือกนักศึกษาอย่างน้อย 1 คน');
  if(ids.length>100) throw new Error('เลือกนักศึกษาได้ไม่เกิน 100 คนต่อครั้ง');
  if(new Set(ids).size!==ids.length) throw new Error('พบรหัสนักศึกษาซ้ำในรายการที่เลือก');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===gid&&g.STATUS==='ACTIVE');
    if(!group) throw new Error('ไม่พบกลุ่มวิจัยหรือกลุ่มไม่ได้อยู่ในสถานะใช้งาน');
    const roster=readObjectsFresh_('STUDENTS');
    const activeMembers=readObjectsFresh_('GROUP_MEMBERS').filter(m=>m.STATUS==='ACTIVE');
    const missing=ids.filter(id=>!roster.some(s=>normalizeStudentId_(s.STUDENT_ID)===id&&String(s.IS_ACTIVE).toUpperCase()!=='FALSE'));
    if(missing.length) throw new Error('ไม่พบรหัสนักศึกษาที่ใช้งานได้: '+missing.join(', '));
    const already=ids.filter(id=>activeMembers.some(m=>normalizeStudentId_(m.STUDENT_ID)===id));
    if(already.length) throw new Error('นักศึกษาต่อไปนี้อยู่ในกลุ่มแล้ว จึงไม่เพิ่มซ้ำ: '+already.join(', '));
    const users=readObjectsFresh_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE');
    const sh=sheet_('GROUP_MEMBERS');
    const now=new Date();
    const rows=ids.map(id=>{
      const matches=users.filter(u=>normalizeStudentId_(u.STUDENT_ID)===id);
      return {
        MEMBERSHIP_ID:Utilities.getUuid(),
        GROUP_ID:gid,
        STUDENT_ID:id,
        USER_ID:matches.length===1?matches[0].USER_ID:'',
        STATUS:'ACTIVE',
        JOINED_AT:now,
        UPDATED_AT:now
      };
    });
    rows.forEach(row=>appendObject_('GROUP_MEMBERS',row));
    logSystem_('GROUP_MEMBERS_BULK_ADDED','GROUP',gid,{studentIds:ids,count:ids.length},ctx.user.USER_ID);
    SpreadsheetApp.flush();
    return {ok:true,count:ids.length,studentIds:ids,message:'เพิ่มสมาชิกเข้ากลุ่ม '+group.GROUP_NAME+' สำเร็จ '+ids.length+' คน'};
  }finally{lock.releaseLock();}
}

function apiAdminRepairGroupMemberLinks(token){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>m.STATUS==='ACTIVE');
    const users=readObjectsFresh_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE');
    const studentIds=new Set(readObjectsFresh_('STUDENTS').map(s=>normalizeStudentId_(s.STUDENT_ID)));
    const sh=sheet_('GROUP_MEMBERS');
    let linked=0, alreadyLinked=0, unresolved=0;
    const details=[];
    members.forEach(m=>{
      const sid=normalizeStudentId_(m.STUDENT_ID);
      const matches=users.filter(u=>normalizeStudentId_(u.STUDENT_ID)===sid);
      if(!sid||!studentIds.has(sid)||matches.length!==1){
        unresolved++;
        details.push({studentId:String(m.STUDENT_ID||''),groupId:String(m.GROUP_ID||''),reason:!sid?'ไม่มีรหัสนักศึกษา':!studentIds.has(sid)?'รหัสไม่อยู่ในทะเบียน':matches.length===0?'ไม่พบบัญชี Student ที่ตรงกับรหัส':'พบบัญชี Student มากกว่าหนึ่งบัญชี'});
        return;
      }
      const user=matches[0];
      if(String(m.USER_ID||'')===String(user.USER_ID)){alreadyLinked++;return;}
      sh.getRange(m._row,4).setValue(user.USER_ID);
      linked++;
    });
    SpreadsheetApp.flush();
    logSystem_('GROUP_MEMBER_LINK_REPAIR','COURSE','4084901',{linked,alreadyLinked,unresolved},ctx.user.USER_ID);
    return {ok:true,linked,alreadyLinked,unresolved,details,message:'ตรวจสอบการเชื่อมบัญชีกับสมาชิกกลุ่มแล้ว: เชื่อมใหม่ '+linked+' รายการ · เชื่อมอยู่แล้ว '+alreadyLinked+' รายการ · ต้องตรวจสอบ '+unresolved+' รายการ'};
  }finally{lock.releaseLock();}
}

function apiAdminSetGroupLeader(token,groupId,leaderUserId,note){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const gid=String(groupId||'').trim();
  const uid=String(leaderUserId||'').trim();
  if(!gid) throw new Error('ไม่พบรหัสกลุ่มวิจัย');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===gid&&g.STATUS==='ACTIVE');
    if(!group) throw new Error('ไม่พบกลุ่มวิจัยที่ใช้งานอยู่');
    const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===gid&&m.STATUS==='ACTIVE');
    let newLeader='';
    if(uid){
      const activeStudentUsers=readObjectsFresh_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE');
      const user=activeStudentUsers.find(u=>String(u.USER_ID)===uid);
      if(!user) throw new Error('บัญชีหัวหน้ากลุ่มไม่อยู่ในสถานะใช้งาน');
      const sid=normalizeStudentId_(user.STUDENT_ID);
      const member=members.find(m=>normalizeStudentId_(m.STUDENT_ID)===sid && (!String(m.USER_ID||'').trim() || String(m.USER_ID).trim()===uid));
      if(!member) throw new Error('หัวหน้ากลุ่มต้องเป็นสมาชิกที่ยังอยู่ในกลุ่มนี้ และรหัสนักศึกษาต้องตรงกับบัญชี');
      // Repair the membership link atomically when the student's active account is uniquely identified.
      if(!String(member.USER_ID||'').trim()){
        const memberSheet=sheet_('GROUP_MEMBERS');
        const memberHeaders=memberSheet.getRange(1,1,1,memberSheet.getLastColumn()).getDisplayValues()[0];
        const userCol=memberHeaders.indexOf('USER_ID');
        if(userCol<0) throw new Error('ไม่พบคอลัมน์ USER_ID ใน GROUP_MEMBERS');
        memberSheet.getRange(member._row,userCol+1).setValue(uid);
      }
      newLeader=uid;
    }
    const oldLeader=String(group.GROUP_LEADER_USER_ID||'');
    if(oldLeader===newLeader) return {ok:true,message:newLeader?'หัวหน้ากลุ่มไม่มีการเปลี่ยนแปลง':'กลุ่มนี้ยังไม่ได้กำหนดหัวหน้ากลุ่ม'};
    const sh=sheet_('RESEARCH_GROUPS');
    const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
    const col=headers.indexOf('GROUP_LEADER_USER_ID');
    if(col<0) throw new Error('ยังไม่พบคอลัมน์ GROUP_LEADER_USER_ID กรุณารัน migration ก่อน');
    sh.getRange(group._row,col+1).setValue(newLeader);
    const hist={HISTORY_ID:Utilities.getUuid(),GROUP_ID:gid,OLD_LEADER_USER_ID:oldLeader,NEW_LEADER_USER_ID:newLeader,ACTION_BY:ctx.user.USER_ID,ACTION_AT:new Date(),NOTE:String(note||'').trim()};
    appendObject_('GROUP_LEADER_HISTORY',hist);
    logSystem_(newLeader?'GROUP_LEADER_ASSIGNED':'GROUP_LEADER_UNASSIGNED','GROUP',gid,{oldLeaderUserId:oldLeader,newLeaderUserId:newLeader,note:String(note||'').trim()},ctx.user.USER_ID);
    SpreadsheetApp.flush();
    return {ok:true,message:newLeader?'กำหนดหัวหน้ากลุ่มเรียบร้อยแล้ว':'ยกเลิกการกำหนดหัวหน้ากลุ่มแล้ว'};
  }finally{lock.releaseLock();}
}

function apiAdminRemoveGroupMember(token,membershipId){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const row=readObjects_('GROUP_MEMBERS').find(m=>m.MEMBERSHIP_ID===membershipId&&m.STATUS==='ACTIVE');
  if(!row) throw new Error('ไม่พบสมาชิกที่ต้องการนำออก');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    sheet_('GROUP_MEMBERS').getRange(row._row,5).setValue('REMOVED');
    sheet_('GROUP_MEMBERS').getRange(row._row,7).setValue(new Date());
    const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===String(row.GROUP_ID));
    if(group&&String(group.GROUP_LEADER_USER_ID||'')===String(row.USER_ID||'')){
      const gs=sheet_('RESEARCH_GROUPS'), headers=gs.getRange(1,1,1,gs.getLastColumn()).getDisplayValues()[0], col=headers.indexOf('GROUP_LEADER_USER_ID');
      if(col>=0)gs.getRange(group._row,col+1).setValue('');
      appendObject_('GROUP_LEADER_HISTORY',{HISTORY_ID:Utilities.getUuid(),GROUP_ID:row.GROUP_ID,OLD_LEADER_USER_ID:row.USER_ID||'',NEW_LEADER_USER_ID:'',ACTION_BY:ctx.user.USER_ID,ACTION_AT:new Date(),NOTE:'ยกเลิกหัวหน้ากลุ่มเนื่องจากถูกนำออกจากกลุ่ม'});
    }
    logSystem_('GROUP_MEMBER_REMOVED','GROUP',row.GROUP_ID,{studentId:row.STUDENT_ID},ctx.user.USER_ID);
  }finally{lock.releaseLock();}
  return {ok:true,message:'นำสมาชิกออกจากกลุ่มแล้ว โดยเก็บประวัติเดิมไว้'};
}

function apiAdminArchiveGroup(token,groupId){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const row=readObjects_('RESEARCH_GROUPS').find(g=>g.GROUP_ID===groupId&&g.STATUS==='ACTIVE');
  if(!row) throw new Error('ไม่พบกลุ่มวิจัย');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    sheet_('RESEARCH_GROUPS').getRange(row._row,5).setValue('ARCHIVED');
    sheet_('RESEARCH_GROUPS').getRange(row._row,8).setValue(new Date());
    const memberSheet=sheet_('GROUP_MEMBERS');
    readObjects_('GROUP_MEMBERS').filter(m=>m.GROUP_ID===groupId&&m.STATUS==='ACTIVE').forEach(m=>{memberSheet.getRange(m._row,5).setValue('REMOVED');memberSheet.getRange(m._row,7).setValue(new Date());});
    const assignmentSheet=sheet_('ADVISOR_ASSIGNMENTS');
    readObjects_('ADVISOR_ASSIGNMENTS').filter(x=>x.GROUP_ID===groupId&&['APPROVED','PENDING'].includes(x.STATUS)).forEach(x=>assignmentSheet.getRange(x._row,4).setValue('REPLACED'));
    logSystem_('RESEARCH_GROUP_ARCHIVED','GROUP',groupId,{},ctx.user.USER_ID);
  }finally{lock.releaseLock();}
  return {ok:true,message:'เก็บกลุ่มเข้าคลังแล้ว ข้อมูลสมาชิกและประวัติยังคงอยู่'};
}

// Student-led group creation and membership. A student can belong to one active group only.
function apiGetStudentWorkspace(token){
  const ctx=requireSession_(token,[ROLE.STUDENT]);
  const user=readObjectsFresh_('SYS_USERS').find(u=>String(u.USER_ID)===String(ctx.user.USER_ID)&&u.STATUS==='ACTIVE');
  const userId=String(ctx.user.USER_ID||'');
  const studentId=normalizeStudentId_(user&&user.STUDENT_ID!==undefined?user.STUDENT_ID:ctx.user.STUDENT_ID);
  const members=readObjectsFresh_('GROUP_MEMBERS');
  // Prefer the immutable account link; fall back to the roster ID for memberships created before registration.
  let membership=members.find(m=>String(m.USER_ID||'')===userId&&m.STATUS==='ACTIVE');
  if(!membership&&studentId) membership=members.find(m=>normalizeStudentId_(m.STUDENT_ID)===studentId&&m.STATUS==='ACTIVE');
  // Self-heal the account link only when the student ID match is exact and unique.
  if(membership&&String(membership.USER_ID||'')!==userId){
    const matches=readObjectsFresh_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE'&&normalizeStudentId_(u.STUDENT_ID)===normalizeStudentId_(membership.STUDENT_ID));
    if(matches.length===1&&String(matches[0].USER_ID)===userId){
      sheet_('GROUP_MEMBERS').getRange(membership._row,4).setValue(userId);
      membership.USER_ID=userId;
      logSystem_('GROUP_MEMBER_ACCOUNT_LINKED','GROUP',membership.GROUP_ID,{studentId:String(membership.STUDENT_ID)},userId);
    }
  }
  const users=readObjectsFresh_('SYS_USERS');
  const advisors=users.filter(u=>u.ROLE_ID===ROLE.ADVISOR&&u.STATUS==='ACTIVE').map(u=>({userId:u.USER_ID,name:u.DISPLAY_NAME,email:u.EMAIL}));
  if(!membership) return {group:null,advisors,roster:readObjectsFresh_('STUDENTS').filter(s=>String(s.IS_ACTIVE).toUpperCase()!=='FALSE').map(s=>({studentId:String(s.STUDENT_ID),name:String(s.FULL_NAME||'')}))};
  const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===String(membership.GROUP_ID)&&g.STATUS==='ACTIVE');
  if(!group) return {group:null,advisors,roster:[],message:'พบประวัติสมาชิก แต่กลุ่มไม่ได้อยู่ในสถานะใช้งาน กรุณาติดต่อ Admin'};
  const allMembers=members.filter(m=>String(m.GROUP_ID)===String(membership.GROUP_ID)&&m.STATUS==='ACTIVE');
  const students=readObjectsFresh_('STUDENTS');
  const roster=allMembers.map(m=>{const st=students.find(x=>normalizeStudentId_(x.STUDENT_ID)===normalizeStudentId_(m.STUDENT_ID));return {studentId:String(m.STUDENT_ID),name:st?String(st.FULL_NAME||''):String(m.STUDENT_ID),isMe:String(m.USER_ID||'')===userId||normalizeStudentId_(m.STUDENT_ID)===studentId};});
  const assignments=readObjectsFresh_('ADVISOR_ASSIGNMENTS').filter(a=>String(a.GROUP_ID)===String(membership.GROUP_ID));
  const advisor=assignments.find(a=>a.STATUS==='APPROVED'), pending=assignments.find(a=>a.STATUS==='PENDING');
  const advisorUser=advisor&&users.find(u=>u.USER_ID===advisor.ADVISOR_USER_ID);
  const pendingUser=pending&&users.find(u=>u.USER_ID===pending.ADVISOR_USER_ID);
  const advisorInvite=readObjectsFresh_('ADVISOR_INVITATIONS').filter(x=>String(x.GROUP_ID)===String(membership.GROUP_ID)).sort((a,b)=>new Date(b.CREATED_AT)-new Date(a.CREATED_AT))[0]||null;
  const assignedIds=new Set(members.filter(x=>x.STATUS==='ACTIVE').map(x=>normalizeStudentId_(x.STUDENT_ID)));
  const registeredIds=new Set(users.filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE').map(u=>normalizeStudentId_(u.STUDENT_ID)));
  const availableRoster=students.filter(st=>String(st.IS_ACTIVE).toUpperCase()!=='FALSE'&&registeredIds.has(normalizeStudentId_(st.STUDENT_ID))&&!assignedIds.has(normalizeStudentId_(st.STUDENT_ID))).map(st=>({studentId:String(st.STUDENT_ID),name:String(st.FULL_NAME||'')}));
  const designatedLeader=String(group.GROUP_LEADER_USER_ID||'');
  const leaderAssigned=!!designatedLeader&&allMembers.some(m=>String(m.USER_ID||'')===designatedLeader);
  const ethics=readObjectsFresh_('ETHICS_TRACKING').find(x=>String(x.GROUP_ID)===String(group.GROUP_ID));
  const ethicsSummary=ethics?{plan:ethics.ETHICS_PLAN,planDueWeek:ethics.ETHICS_PLAN_DUE_WEEK,submissionStatus:ethics.ETHICS_PLAN==='DURING_COURSE'?ethics.SUBMISSION_STATUS:'',approvalStatus:ethics.ETHICS_PLAN==='DURING_COURSE'?ethics.REC_APPROVAL_STATUS:'',approvalDate:ethics.ETHICS_PLAN==='DURING_COURSE'&&ethics.REC_APPROVAL_DATE?formatDateOnly_(ethics.REC_APPROVAL_DATE):'',reviewType:ethics.REVIEW_TYPE}:null;
  return sanitizeForClient_({group:{groupId:group.GROUP_ID,groupName:group.GROUP_NAME,topicTh:group.TOPIC_TITLE_TH,createdBy:group.CREATED_BY,isLeader:leaderAssigned&&designatedLeader===userId,leaderAssigned,leaderUserId:leaderAssigned?designatedLeader:'',members:roster,advisor:advisorUser?advisorUser.DISPLAY_NAME:'',pendingAdvisor:pendingUser?pendingUser.DISPLAY_NAME:'',advisorInvite:advisorInvite?{name:advisorInvite.ADVISOR_NAME,email:advisorInvite.ADVISOR_EMAIL,status:advisorInvite.STATUS}:null},ethicsSummary,advisors:[],roster:availableRoster});
}

function apiStudentCreateGroup(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);payload=payload||{};
  if(readObjects_('GROUP_MEMBERS').some(m=>(String(m.USER_ID||'')===String(ctx.user.USER_ID)||normalizeStudentId_(m.STUDENT_ID)===normalizeStudentId_(ctx.user.STUDENT_ID))&&m.STATUS==='ACTIVE')) throw new Error('คุณอยู่ในกลุ่มแล้ว');
  const name=String(payload.groupName||'').trim();if(!name)throw new Error('กรุณาระบุชื่อกลุ่ม');if(name.length>100)throw new Error('ชื่อกลุ่มต้องไม่เกิน 100 ตัวอักษร');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    if(readObjects_('RESEARCH_GROUPS').some(g=>g.STATUS==='ACTIVE'&&String(g.GROUP_NAME).trim().toLowerCase()===name.toLowerCase()))throw new Error('ชื่อกลุ่มนี้มีแล้ว กรุณาใช้ชื่ออื่น');
    const id=Utilities.getUuid(),now=new Date();
    appendObject_('RESEARCH_GROUPS',{GROUP_ID:id,GROUP_NAME:name,TOPIC_TITLE_TH:String(payload.topicTh||''),TOPIC_TITLE_EN:'',STATUS:'ACTIVE',CREATED_BY:ctx.user.USER_ID,CREATED_AT:now,UPDATED_AT:now});
    addStudentToGroup_(id,ctx.user.STUDENT_ID,ctx.user.USER_ID,ctx.user.USER_ID);
    logSystem_('STUDENT_GROUP_CREATED','GROUP',id,{},ctx.user.USER_ID);
    return {ok:true,message:'สร้างกลุ่มและเพิ่มคุณเป็นสมาชิกคนแรกแล้ว'};
  }finally{lock.releaseLock();}
}

function apiStudentAddGroupMember(token,studentId){
  const ctx=requireSession_(token,[ROLE.STUDENT]);
  const me=readObjects_('GROUP_MEMBERS').find(m=>(String(m.USER_ID||'')===String(ctx.user.USER_ID)||normalizeStudentId_(m.STUDENT_ID)===normalizeStudentId_(ctx.user.STUDENT_ID))&&m.STATUS==='ACTIVE');
  if(!me)throw new Error('กรุณาสร้างกลุ่มก่อน');
  const group=readObjects_('RESEARCH_GROUPS').find(g=>g.GROUP_ID===me.GROUP_ID&&g.STATUS==='ACTIVE');
  if(!group||String(group.GROUP_LEADER_USER_ID||'')!==String(ctx.user.USER_ID))throw new Error('เฉพาะหัวหน้ากลุ่มที่ Admin กำหนดเท่านั้นที่เพิ่มสมาชิกได้');
  const target=readObjects_('SYS_USERS').find(u=>String(u.STUDENT_ID)===String(studentId)&&u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE');
  if(!target)throw new Error('นักศึกษาที่เลือกยังไม่ได้ลงทะเบียนหรือบัญชีไม่ได้เปิดใช้งาน');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{return addStudentToGroup_(me.GROUP_ID,String(studentId),target.USER_ID,ctx.user.USER_ID);}
  finally{lock.releaseLock();}
}


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
  const files=readObjectsFresh_('MEETING_FILES').filter(f=>['SUBMITTED','VERIFIED','REVISION_REQUIRED','ACTIVE'].includes(String(f.STATUS)));
  const assignments=readObjectsFresh_('ADVISOR_ASSIGNMENTS').filter(a=>a.STATUS==='APPROVED');
  const users=readObjectsFresh_('SYS_USERS');
  const weeks=[2,4,6,8,10,12,14];
  const rows=groups.map(g=>{const as=assignments.find(a=>a.GROUP_ID===g.GROUP_ID);const au=as&&users.find(u=>u.USER_ID===as.ADVISOR_USER_ID);const meetings=weeks.map((w,i)=>{const ff=files.filter(f=>String(f.GROUP_ID)===String(g.GROUP_ID)&&Number(f.MEETING_NO)===i+1).sort((a,b)=>new Date(b.UPLOADED_AT)-new Date(a.UPLOADED_AT));const latest=ff[0];return {meetingNo:i+1,week:w,status:!latest?'NOT_SUBMITTED':String(latest.STATUS),fileName:latest?latest.FILE_NAME:'',uploadedAt:latest&&latest.UPLOADED_AT?new Date(latest.UPLOADED_AT).toISOString():'',url:latest?latest.DRIVE_URL:'',reviewComment:latest?String(latest.REVIEW_COMMENT||''):''};});return {groupId:g.GROUP_ID,groupName:g.GROUP_NAME,advisor:au?au.DISPLAY_NAME:'ยังไม่กำหนด',meetings};});
  const all=rows.flatMap(x=>x.meetings);return sanitizeForClient_({groups:rows,summary:{groups:rows.length,total:all.length,submitted:all.filter(x=>['SUBMITTED','VERIFIED','ACTIVE','REVISION_REQUIRED'].includes(x.status)).length,verified:all.filter(x=>x.status==='VERIFIED').length,notSubmitted:all.filter(x=>x.status==='NOT_SUBMITTED').length,revision:all.filter(x=>x.status==='REVISION_REQUIRED').length}});
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

function apiAdminSetAssessmentWindow(token,type,isOpen){
  const ctx=requireSession_(token,[ROLE.ADMIN]);if(isOpen)assertGradeEditable_(); if(!['A4','A5'].includes(type)) throw new Error('ประเภทการประเมินไม่ถูกต้อง');
  setAssessmentSetting_('WINDOW_'+type,isOpen?'OPEN':'CLOSED',ctx.user.USER_ID);
  logSystem_('ASSESSMENT_WINDOW_CHANGED','ASSESSMENT',type,{status:isOpen?'OPEN':'CLOSED'},ctx.user.USER_ID); return {ok:true,message:(isOpen?'เปิด':'ปิด')+'การประเมิน '+type+' แล้ว'};
}
function apiAdvisorSaveA4(token,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR]);assertGradeEditable_(); payload=payload||{}; const groupId=String(payload.groupId||''); assertGroupAccess_(ctx,groupId);
  if(ctx.user.ROLE_ID===ROLE.ADVISOR && assessmentSettingsFresh_().WINDOW_A4!=='OPEN') throw new Error('Admin ยังไม่ได้เปิดช่วงประเมิน A4');
  const groupScore=Number(payload.groupScore); if(!Number.isFinite(groupScore)||groupScore<0||groupScore>10) throw new Error('คะแนน A4 ระดับกลุ่มต้องอยู่ระหว่าง 0–10');
  const members=readObjects_('GROUP_MEMBERS').filter(m=>m.GROUP_ID===groupId&&m.STATUS==='ACTIVE'); const individual=payload.individualScores||{};
  const validated=members.map(m=>{const v=Number(individual[String(m.STUDENT_ID)]);if(!Number.isFinite(v)||v<0||v>10)throw new Error('กรุณากรอกคะแนน A4 รายบุคคล 0–10 ให้ครบ: '+m.STUDENT_ID);return {studentId:m.STUDENT_ID,score:v};});
  const lock=LockService.getScriptLock(); lock.waitLock(60000);
  try{
    const oldGroup=readObjectsFresh_('GROUP_SCORES').find(x=>String(x.GROUP_ID)===groupId)||{};
    const oldIndividuals=readObjectsFresh_('INDIVIDUAL_SCORES').filter(x=>members.some(m=>String(m.STUDENT_ID)===String(x.STUDENT_ID))).map(x=>({studentId:x.STUDENT_ID,score:x.A4_INDIVIDUAL_SCORE}));
    const before={A4_GROUP_SCORE:oldGroup.A4_GROUP_SCORE??'',individual:oldIndividuals};
    upsertGroupScore_(groupId,{A4_GROUP_SCORE:groupScore,A4_ADVISOR_USER_ID:ctx.user.USER_ID},ctx.user.USER_ID);
    validated.forEach(x=>{upsertIndividualScore_(x.studentId,groupId,{A4_INDIVIDUAL_SCORE:x.score},ctx.user.USER_ID);});
    appendObject_('GROUP_SCORE_AUDIT',{AUDIT_ID:Utilities.getUuid(),GROUP_ID:groupId,BEFORE_JSON:JSON.stringify(before),AFTER_JSON:JSON.stringify({A4_GROUP_SCORE:groupScore,individual:validated}),REASON:'Advisor A4 assessment update',ACTOR_USER_ID:ctx.user.USER_ID,CREATED_AT:new Date()});
    logSystem_('A4_SCORES_SAVED','GROUP',groupId,{before,after:{groupScore,individual:validated},memberCount:members.length},ctx.user.USER_ID); return {ok:true,message:'บันทึก A4 ระดับกลุ่มและรายบุคคลแล้ว'};
  }finally{lock.releaseLock();}
}
function apiGetPeerTargets(token){
  const ctx=requireSession_(token,[ROLE.STUDENT]);
  if(assessmentSettings_().WINDOW_A5!=='OPEN') throw new Error('Admin ยังไม่ได้เปิดช่วงประเมินเพื่อน A5');
  const me=readObjects_('GROUP_MEMBERS').find(m=>(m.USER_ID===ctx.user.USER_ID||String(m.STUDENT_ID)===String(ctx.user.STUDENT_ID))&&m.STATUS==='ACTIVE');
  if(!me) throw new Error('ยังไม่ได้อยู่ในกลุ่มวิจัย');
  const members=readObjects_('GROUP_MEMBERS').filter(m=>m.GROUP_ID===me.GROUP_ID&&m.STATUS==='ACTIVE'&&String(m.STUDENT_ID)!==String(me.STUDENT_ID));
  const peers=findObjectsByColumnValue_('PEER_ASSESSMENTS','GROUP_ID',me.GROUP_ID).filter(p=>String(p.EVALUATOR_STUDENT_ID)===String(me.STUDENT_ID));
  return {groupId:me.GROUP_ID,evaluatorStudentId:String(me.STUDENT_ID),targets:members.map(m=>{const p=peers.find(x=>String(x.EVALUATEE_STUDENT_ID)===String(m.STUDENT_ID));return {studentId:String(m.STUDENT_ID),submitted:!!p,scores:p?{responsibility:p.RESPONSIBILITY,deadline:p.DEADLINE,workQuality:p.WORK_QUALITY,collaboration:p.COLLABORATION,communication:p.COMMUNICATION}:null};})};
}
function apiSubmitPeerAssessment(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);assertGradeEditable_();payload=payload||{};
  if(assessmentSettings_().WINDOW_A5!=='OPEN')throw new Error('Admin ยังไม่ได้เปิดช่วงประเมินเพื่อน A5');
  const me=readObjects_('GROUP_MEMBERS').find(m=>(m.USER_ID===ctx.user.USER_ID||String(m.STUDENT_ID)===String(ctx.user.STUDENT_ID))&&m.STATUS==='ACTIVE');
  if(!me)throw new Error('ยังไม่ได้เป็นสมาชิกกลุ่มวิจัย');
  const groupId=me.GROUP_ID,target=String(payload.evaluateeStudentId||'');
  if(target===String(me.STUDENT_ID))throw new Error('ไม่สามารถประเมินตนเองได้');
  const targetMember=readObjects_('GROUP_MEMBERS').find(m=>m.GROUP_ID===groupId&&String(m.STUDENT_ID)===target&&m.STATUS==='ACTIVE');
  if(!targetMember)throw new Error('เลือกสมาชิกในกลุ่มเดียวกันเท่านั้น');
  const scores=payload.scores||{},keys=['responsibility','deadline','workQuality','collaboration','communication'];
  keys.forEach(k=>{const n=Number(scores[k]);if(!Number.isInteger(n)||n<0||n>2)throw new Error('คะแนนแต่ละด้านต้องเป็นจำนวนเต็ม 0–2');});
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    // Recheck the assessment window under the lock so a closed window cannot accept a late submission.
    if(assessmentSettings_().WINDOW_A5!=='OPEN')throw new Error('Admin ปิดช่วงประเมินเพื่อน A5 แล้ว');
    const sh=sheet_('PEER_ASSESSMENTS');
    const old=findObjectsByColumnValue_('PEER_ASSESSMENTS','GROUP_ID',groupId).find(r=>String(r.EVALUATOR_STUDENT_ID)===String(me.STUDENT_ID)&&String(r.EVALUATEE_STUDENT_ID)===target);
    const row=[old?old.PEER_ID:Utilities.getUuid(),groupId,String(me.STUDENT_ID),target,Number(scores.responsibility),Number(scores.deadline),Number(scores.workQuality),Number(scores.collaboration),Number(scores.communication),new Date()];
    if(old)sh.getRange(old._row,1,1,row.length).setValues([row]);else sh.appendRow(row);
    invalidateReadCache_('PEER_ASSESSMENTS');
    logSystem_('PEER_ASSESSMENT_SUBMITTED','STUDENT',me.STUDENT_ID,{evaluatee:target},ctx.user.USER_ID);
    return {ok:true,message:'ส่งแบบประเมินเพื่อนแล้ว'};
  }finally{lock.releaseLock();}
}

function apiAdminSaveCoreScores(token,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN]);assertGradeEditable_(); payload=payload||{}; const groupId=String(payload.groupId||'');
  if(!readObjects_('RESEARCH_GROUPS').some(g=>g.GROUP_ID===groupId&&g.STATUS==='ACTIVE')) throw new Error('ไม่พบกลุ่มวิจัย');
  const vals={}; [['A1',10],['A2',30],['A3',20]].forEach(([k,max])=>{if(payload[k]===undefined||String(payload[k]).trim()==='')throw new Error('กรุณากรอกคะแนน '+k);const v=Number(payload[k]);if(!Number.isFinite(v)||v<0||v>max)throw new Error(k+' ต้องอยู่ระหว่าง 0–'+max);vals[k+'_SCORE']=v;});
  const reason=String(payload.reason||'').trim();if(reason.length<5)throw new Error('กรุณาระบุเหตุผลการบันทึก/แก้ไขคะแนนอย่างน้อย 5 ตัวอักษร');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const current=readObjectsFresh_('GROUP_SCORES').find(r=>String(r.GROUP_ID)===groupId)||{};
    const before={A1_SCORE:current.A1_SCORE??'',A2_SCORE:current.A2_SCORE??'',A3_SCORE:current.A3_SCORE??''};
    upsertGroupScore_(groupId,vals,ctx.user.USER_ID);
    appendObject_('GROUP_SCORE_AUDIT',{AUDIT_ID:Utilities.getUuid(),GROUP_ID:groupId,BEFORE_JSON:JSON.stringify(before),AFTER_JSON:JSON.stringify(vals),REASON:reason,ACTOR_USER_ID:ctx.user.USER_ID,CREATED_AT:new Date()});
    logSystem_('CORE_SCORES_SAVED','GROUP',groupId,{before,after:vals,reason},ctx.user.USER_ID);
  }finally{lock.releaseLock();}
  return {ok:true,message:'บันทึกคะแนน A1–A3 แล้ว'};
}
function apiGetAssessmentReport(token){
  const ctx=requireSession_(token,null); const role=ctx.user.ROLE_ID;
  const allGroups=readObjectsFresh_('RESEARCH_GROUPS'), allMembers=readObjectsFresh_('GROUP_MEMBERS'), assignments=readObjectsFresh_('ADVISOR_ASSIGNMENTS');
  let groups=allGroups.filter(g=>String(g.STATUS||'').trim().toUpperCase()==='ACTIVE');
  if(role===ROLE.ADVISOR){
    const ids=new Set(getAdvisorAssignedGroups_(ctx.user.USER_ID).map(g=>String(g.groupId)));
    groups=groups.filter(g=>ids.has(String(g.GROUP_ID)));
  }
  let studentMember=null;
  if(role===ROLE.STUDENT){
    studentMember=allMembers.find(x=>(String(x.USER_ID||'')===String(ctx.user.USER_ID||'')||String(x.STUDENT_ID||'')===String(ctx.user.STUDENT_ID||''))&&String(x.STATUS||'').trim().toUpperCase()==='ACTIVE');
    groups=groups.filter(g=>studentMember&&String(g.GROUP_ID)===String(studentMember.GROUP_ID));
  }
  const gs=readObjectsFresh_('GROUP_SCORES'), individual=readObjectsFresh_('INDIVIDUAL_SCORES'), meetings=readObjectsFresh_('MEETING_RECORDS'), peers=readObjectsFresh_('PEER_ASSESSMENTS'), students=readObjectsFresh_('STUDENTS'), users=readObjectsFresh_('SYS_USERS');
  const releaseStatus=gradeReleaseStatus_(),studentCanSeeScores=role!=='STUDENT'||releaseStatus==='RELEASED';
  return sanitizeForClient_(groups.map(g=>{
    const ms=allMembers.filter(m=>String(m.GROUP_ID)===String(g.GROUP_ID)&&String(m.STATUS||'').trim().toUpperCase()==='ACTIVE');
    const assignment=assignments.find(x=>String(x.GROUP_ID)===String(g.GROUP_ID)&&String(x.STATUS||'').trim().toUpperCase()==='APPROVED');
    const advisor=assignment&&users.find(x=>x.USER_ID===assignment.ADVISOR_USER_ID);
    const groupScore=studentCanSeeScores?(gs.find(x=>x.GROUP_ID===g.GROUP_ID)||{}):{};
    let outputMembers=ms;
    if(role===ROLE.STUDENT) outputMembers=ms.filter(m=>String(m.STUDENT_ID)===String(studentMember.STUDENT_ID));
    return {groupId:g.GROUP_ID,groupName:g.GROUP_NAME,topicTh:g.TOPIC_TITLE_TH,advisor:advisor?advisor.DISPLAY_NAME:'',groupScore,gradeReleaseStatus:releaseStatus,scoresReleased:studentCanSeeScores, members:outputMembers.map(m=>{
      const person=individual.find(x=>String(x.STUDENT_ID)===String(m.STUDENT_ID))||{};
      const meetingRowsRaw=meetings.filter(x=>x.GROUP_ID===g.GROUP_ID&&String(x.STUDENT_ID)===String(m.STUDENT_ID));
      const meetingByNo=new Map();meetingRowsRaw.forEach(x=>{const key=String(x.MEETING_NO);const old=meetingByNo.get(key);if(!old||new Date(x.UPDATED_AT||0)>new Date(old.UPDATED_AT||0))meetingByNo.set(key,x);});const meetingRows=[...meetingByNo.values()];
      const attendance=meetingRows.filter(x=>x.ATTENDANCE_STATUS==='PRESENT').length;
      const peerRows=peers.filter(x=>x.GROUP_ID===g.GROUP_ID&&String(x.EVALUATEE_STUDENT_ID)===String(m.STUDENT_ID));
      const peerAvg=peerRows.length?peerRows.reduce((sum,x)=>sum+Number(x.RESPONSIBILITY)+Number(x.DEADLINE)+Number(x.WORK_QUALITY)+Number(x.COLLABORATION)+Number(x.COMMUNICATION),0)/peerRows.length:null;
      const a5Complete=peerRows.length>=Math.max(0,ms.length-1);
      const a6=meetingRows.length>=7?Math.round((attendance/7*10)*100)/100:null;
      // Final total is intentionally not calculated until A1-A3 group/individual allocation is formally approved.
      const total=null;
      const student=students.find(x=>String(x.STUDENT_ID)===String(m.STUDENT_ID));
      const meetingStatuses={};
      meetingRows.forEach(x=>meetingStatuses[String(x.MEETING_NO)]=x.ATTENDANCE_STATUS);
      const a4=person.A4_INDIVIDUAL_SCORE;const groupComplete=['A1_SCORE','A2_SCORE','A3_SCORE','A4_GROUP_SCORE'].every(k=>groupScore[k]!==''&&groupScore[k]!==null&&groupScore[k]!==undefined);const complete=studentCanSeeScores&&groupComplete&&a4!==''&&a4!==null&&a4!==undefined&&a5Complete&&meetingRows.length>=7;const suppressA5=role!=='ADMIN'&&ms.length<3;
      return {studentId:String(m.STUDENT_ID),studentName:student?student.FULL_NAME:'',a4Individual:studentCanSeeScores?a4:null,a5:studentCanSeeScores&&!suppressA5&&a5Complete?peerAvg:null,a5Responses:studentCanSeeScores&&!suppressA5?peerRows.length:null,a5PrivacySuppressed:suppressA5,a6:studentCanSeeScores?a6:null,attendance,total,meetingStatuses,gradeCompleteness:studentCanSeeScores?(complete?'COMPLETE':'INCOMPLETE'):'HIDDEN',gradeReleaseStatus:releaseStatus};
    })};
  }));
}

/* ---------------- Student research workflow APIs (v0.3.12) ---------------- */
function apiGetStudentResearchData(token,requestedGroupId){
  const ctx=requireSession_(token,[ROLE.STUDENT,ROLE.ADVISOR,ROLE.ADMIN]);
  let groupId='';
  if(ctx.user.ROLE_ID===ROLE.STUDENT){
    const m=readObjects_('GROUP_MEMBERS').find(x=>(String(x.USER_ID)===String(ctx.user.USER_ID)||String(x.STUDENT_ID)===String(ctx.user.STUDENT_ID))&&x.STATUS==='ACTIVE');
    if(!m)return {group:null,topics:[],files:[],progress:[],feedback:[],milestones:studentMilestonePlan_()};
    groupId=m.GROUP_ID;
  } else if(ctx.user.ROLE_ID===ROLE.ADVISOR){
    const assigned=getAdvisorAssignedGroups_(ctx.user.USER_ID);
    groupId=String(requestedGroupId|| (assigned.length?assigned[0].groupId:''));
    if(!groupId)return {group:null,topics:[],files:[],progress:[],feedback:[],milestones:studentMilestonePlan_()};
  } else {
    groupId=String(requestedGroupId||'');
  }
  if(!groupId) throw new Error('กรุณาระบุกลุ่มผ่านพื้นที่ทำงานหรือรายการกลุ่มที่ได้รับมอบหมาย');
  assertGroupAccess_(ctx,groupId);
  const group=readObjectsFresh_('RESEARCH_GROUPS').find(x=>String(x.GROUP_ID)===String(groupId)&&String(x.STATUS||'').trim().toUpperCase()==='ACTIVE');
  const groupExtensions=readObjectsFresh_('GROUP_DEADLINE_EXTENSIONS');
  const progressWeeks=progressWeekSettings_().map(w=>{const ext=groupExtensions.filter(x=>String(x.GROUP_ID)===String(groupId)&&Number(x.WEEK_NO)===Number(w.week)&&x.STATUS==='APPROVED').sort((a,b)=>new Date(b.APPROVED_AT)-new Date(a.APPROVED_AT))[0];return {...w,effectiveDueDate:ext?formatDateOnly_(ext.NEW_DUE_DATE):w.dueDate};});
  const activeGroupMembers=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===String(groupId)&&m.STATUS==='ACTIVE');
  const groupLeader=String(group.GROUP_LEADER_USER_ID||'');
  const leaderIsActiveMember=!!groupLeader&&activeGroupMembers.some(m=>String(m.USER_ID)===groupLeader);
  const effectiveLeader=leaderIsActiveMember?groupLeader:'';
  return sanitizeForClient_({
    group:{groupId,groupName:group.GROUP_NAME,topicTh:group.TOPIC_TITLE_TH||'',topicEn:group.TOPIC_TITLE_EN||'',isLeader:!!effectiveLeader&&String(ctx.user.USER_ID)===effectiveLeader,leaderUserId:effectiveLeader,leaderAssigned:!!effectiveLeader,members:activeGroupMembers.map(m=>({studentId:m.STUDENT_ID,userId:m.USER_ID}))},
    topics:findObjectsByColumnValue_('RESEARCH_TOPIC_VERSIONS','GROUP_ID',groupId).sort((a,b)=>Number(b.VERSION_NO)-Number(a.VERSION_NO)).map(x=>({versionId:x.VERSION_ID,versionNo:x.VERSION_NO,titleTh:x.TITLE_TH,titleEn:x.TITLE_EN,problem:x.PROBLEM_STATEMENT,objectives:x.OBJECTIVES,significance:x.RESEARCH_SIGNIFICANCE,status:x.STATUS,reviewStatus:x.REVIEW_STATUS,submittedAt:x.SUBMITTED_AT,reviewComment:x.REVIEW_COMMENT})),
    files:findObjectsByColumnValue_('PROPOSAL_FILES','GROUP_ID',groupId).filter(x=>x.STATUS==='ACTIVE').sort((a,b)=>new Date(b.UPLOADED_AT)-new Date(a.UPLOADED_AT)).map(x=>({fileId:x.FILE_RECORD_ID,chapter:x.CHAPTER,fileName:x.FILE_NAME,url:x.DRIVE_URL,size:Number(x.FILE_SIZE)||0,uploadedAt:x.UPLOADED_AT,notes:x.NOTES})),
    progress:findObjectsByColumnValue_('PROGRESS_REPORTS','GROUP_ID',groupId).sort((a,b)=>Number(b.WEEK_NO)-Number(a.WEEK_NO)||new Date(b.SUBMITTED_AT||0)-new Date(a.SUBMITTED_AT||0)).map(x=>({reportId:x.REPORT_ID,weekNo:x.WEEK_NO,milestone:x.MILESTONE,workCompleted:x.WORK_COMPLETED,problems:x.PROBLEMS,nextActions:x.NEXT_ACTIONS,submittedAt:x.SUBMITTED_AT instanceof Date?x.SUBMITTED_AT.toISOString():String(x.SUBMITTED_AT||''),status:x.STATUS,reviewComment:x.REVIEW_COMMENT||'',timelinessStatus:x.TIMELINESS_STATUS||'',revisionDueAt:x.REVISION_DUE_AT||'',extensionId:x.EXTENSION_ID||''})),
    feedback:findObjectsByColumnValue_('ADVISOR_FEEDBACK','GROUP_ID',groupId).filter(x=>x.STATUS!=='DELETED').sort((a,b)=>new Date(b.CREATED_AT)-new Date(a.CREATED_AT)).map(x=>({feedbackId:x.FEEDBACK_ID,relatedType:x.RELATED_TYPE,relatedId:x.RELATED_ID,comment:x.COMMENT,createdBy:x.CREATED_BY,createdAt:x.CREATED_AT})),
    milestones:studentMilestonePlan_(),
    progressWeeks:progressWeeks,
    openProgressWeeks:progressWeeks.filter(w=>w.isOpen)
  });
}
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
function apiAdminGetResearchTopicManagement(token){
  requireSession_(token,[ROLE.ADMIN]);
  const groups=readObjectsFresh_('RESEARCH_GROUPS').filter(g=>String(g.STATUS||'').toUpperCase()==='ACTIVE');
  const versions=readObjectsFresh_('RESEARCH_TOPIC_VERSIONS');
  const assignments=readObjectsFresh_('ADVISOR_ASSIGNMENTS').filter(a=>String(a.STATUS||'').toUpperCase()==='APPROVED');
  const users=readObjectsFresh_('SYS_USERS');
  const byGroup=new Map();
  versions.forEach(v=>{const gid=String(v.GROUP_ID||'');if(!byGroup.has(gid))byGroup.set(gid,[]);byGroup.get(gid).push(v);});
  return sanitizeForClient_(groups.map(g=>{
    const rows=(byGroup.get(String(g.GROUP_ID))||[]).sort((a,b)=>Number(b.VERSION_NO||0)-Number(a.VERSION_NO||0));
    const latest=rows[0]||null;
    const assignment=assignments.find(x=>String(x.GROUP_ID)===String(g.GROUP_ID));
    const advisor=assignment?users.find(u=>String(u.USER_ID)===String(assignment.ADVISOR_USER_ID))||null:null;
    const mapVersion=v=>({versionId:String(v.VERSION_ID||''),versionNo:Number(v.VERSION_NO)||0,titleTh:String(v.TITLE_TH||''),titleEn:String(v.TITLE_EN||''),problem:String(v.PROBLEM_STATEMENT||''),objectives:String(v.OBJECTIVES||''),significance:String(v.RESEARCH_SIGNIFICANCE||''),status:String(v.STATUS||''),reviewStatus:String(v.REVIEW_STATUS||''),submittedAt:v.SUBMITTED_AT||'',reviewedAt:v.REVIEWED_AT||'',reviewComment:String(v.REVIEW_COMMENT||'')});
    return {groupId:String(g.GROUP_ID),groupName:String(g.GROUP_NAME||''),topicTitle:String(g.TOPIC_TITLE_TH||''),advisorName:advisor?String(advisor.DISPLAY_NAME||advisor.EMAIL||''):'',latest:latest?mapVersion(latest):null,history:rows.slice(0,10).map(mapVersion)};
  }));
}

function apiAllowResearchTopicRevision(token,versionId,comment){
  const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR]);
  const note=String(comment||'').trim();
  if(note.length<5||note.length>3000)throw new Error('กรุณาระบุเหตุผลให้แก้ไข 5–3,000 ตัวอักษร');
  const id=String(versionId||'').trim();if(!id)throw new Error('ไม่พบรหัสเวอร์ชันหัวข้อวิจัย');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const row=readObjectsFresh_('RESEARCH_TOPIC_VERSIONS').find(x=>String(x.VERSION_ID)===id);
    if(!row)throw new Error('ไม่พบหัวข้อวิจัยเวอร์ชันนี้');
    assertGroupAccess_(ctx,row.GROUP_ID);
    const latest=latestResearchTopicVersion_(row.GROUP_ID);
    if(!latest||String(latest.VERSION_ID)!==id)throw new Error('สามารถให้แก้ไขได้เฉพาะหัวข้องานวิจัยเวอร์ชันล่าสุด');
    const current=String(row.REVIEW_STATUS||'');
    if(current==='REVISION_REQUIRED')throw new Error('หัวข้อวิจัยนี้ได้รับอนุญาตให้แก้ไขแล้ว');
    if(!['PENDING','APPROVED','REJECTED'].includes(current))throw new Error('สถานะหัวข้อวิจัยนี้ไม่อนุญาตให้เปิดแก้ไข');
    const sh=sheet_('RESEARCH_TOPIC_VERSIONS'),headers=SCHEMA.RESEARCH_TOPIC_VERSIONS,now=new Date();
    [['STATUS','REVISION_REQUIRED'],['REVIEW_STATUS','REVISION_REQUIRED'],['REVIEWED_BY',ctx.user.USER_ID],['REVIEWED_AT',now],['REVIEW_COMMENT',note]].forEach(([key,value])=>sh.getRange(row._row,headers.indexOf(key)+1).setValue(value));
    logSystem_('RESEARCH_TOPIC_REVISION_ALLOWED','GROUP',row.GROUP_ID,{versionId:id,previousStatus:current,comment:note},ctx.user.USER_ID);
    try{enqueueResearchTopicNotification_(row.GROUP_ID,'RESEARCH_TOPIC_REVISION_ALLOWED','อนุญาตให้แก้ไขหัวข้องานวิจัย','หัวข้องานวิจัยเวอร์ชัน '+row.VERSION_NO+' ได้รับอนุญาตให้แก้ไขแล้ว กรุณาอ่านข้อเสนอแนะ: '+note,id+':EDIT:'+now.getTime());}
    catch(notificationError){logSystem_('RESEARCH_TOPIC_NOTIFICATION_FAILED','GROUP',row.GROUP_ID,{versionId:id,error:String(notificationError.message||notificationError)},ctx.user.USER_ID);}
    SpreadsheetApp.flush();
    return {ok:true,message:'อนุญาตให้แก้ไขหัวข้องานวิจัยแล้ว นักศึกษาสามารถปรับปรุงและส่งเป็นเวอร์ชันใหม่ได้'};
  }finally{lock.releaseLock();}
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

function getConfigValue_(key,fallback){
  const row=readObjects_('SYS_CONFIG').find(r=>String(r.KEY)===String(key));
  return row?String(row.VALUE):String(fallback);
}
function setConfigValue_(key,value,actor){
  const sh=sheet_('SYS_CONFIG'),row=readObjects_('SYS_CONFIG').find(r=>String(r.KEY)===String(key));
  if(row){sh.getRange(row._row,2).setValue(String(value));sh.getRange(row._row,3).setValue(new Date());sh.getRange(row._row,4).setValue(actor);}
  else appendObject_('SYS_CONFIG',{KEY:key,VALUE:String(value),UPDATED_AT:new Date(),UPDATED_BY:actor});
}
function apiAdminGetSystemSettings(token){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('DB_ID'));
  const sheets=Object.keys(SCHEMA).map(name=>({name,exists:!!ss.getSheetByName(name),rows:ss.getSheetByName(name)?Math.max(0,ss.getSheetByName(name).getLastRow()-1):0}));
  return {courseCode:APP.COURSE_CODE,term:APP.TERM,section:APP.SECTION,environment:getConfigValue_('ENVIRONMENT',''),registrationOpen:getConfigValue_('STUDENT_REGISTRATION_OPEN','TRUE').toUpperCase()==='TRUE',assessment:assessmentSettings_(),sheets,actor:ctx.user.USER_ID};
}
function apiAdminSetRegistrationOpen(token,isOpen){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  setConfigValue_('STUDENT_REGISTRATION_OPEN',isOpen?'TRUE':'FALSE',ctx.user.USER_ID);
  logSystem_('STUDENT_REGISTRATION_WINDOW_CHANGED','SYSTEM','STUDENT_REGISTRATION_OPEN',{isOpen:!!isOpen},ctx.user.USER_ID);
  return {ok:true,message:isOpen?'เปิดรับลงทะเบียนนักศึกษาแล้ว':'ปิดรับลงทะเบียนนักศึกษาแล้ว'};
}


/**
 * Optional verification/migration command.
 * The same safe creation now also runs lazily when a workflow API first needs
 * one of these sheets, so users do not have to run this manually.
 */
function migrateResearchWorkflowSchema_(){
  const ss = db_();
  const names = AUTO_CREATE_WORKFLOW_SHEETS_;
  const created = [], existing = [];
  names.forEach(name => {
    const before = ss.getSheetByName(name);
    ensureWorkflowSheet_(name);
    (before ? existing : created).push(name);
  });
  SpreadsheetApp.flush();
  return {
    ok: true,
    databaseId: ss.getId(),
    databaseName: ss.getName(),
    createdSheets: created,
    verifiedSheets: existing,
    message: created.length
      ? 'สร้างชีตที่ขาดและตรวจสอบโครงสร้างเรียบร้อยแล้ว'
      : 'ตรวจสอบชีต Research Workflow ทั้ง 4 ชีตเรียบร้อยแล้ว'
  };
}

function assertGroupAccess_(ctx,groupId){
  const targetGroupId=String(groupId||'').trim();
  const groups=readObjectsFresh_('RESEARCH_GROUPS');
  const group=groups.find(g=>String(g.GROUP_ID||'').trim()===targetGroupId&&String(g.STATUS||'').trim().toUpperCase()==='ACTIVE');
  if(!group)throw new Error('ไม่พบกลุ่มวิจัย');
  if(ctx.user.ROLE_ID===ROLE.ADMIN)return true;
  if(ctx.user.ROLE_ID===ROLE.ADVISOR){
    const advisorId=String(ctx.user.USER_ID||'').trim();
    const assigned=readObjectsFresh_('ADVISOR_ASSIGNMENTS').some(a=>
      String(a.GROUP_ID||'').trim()===targetGroupId&&
      String(a.ADVISOR_USER_ID||'').trim()===advisorId&&
      String(a.STATUS||'').trim().toUpperCase()==='APPROVED'
    );
    if(!assigned)throw new Error('ไม่มีสิทธิ์เข้าถึงกลุ่มนี้');
    return true;
  }
  const members=readObjectsFresh_('GROUP_MEMBERS');
  const member=members.find(x=>
    String(x.GROUP_ID||'').trim()===targetGroupId&&
    (String(x.USER_ID||'').trim()===String(ctx.user.USER_ID||'').trim()||
     String(x.STUDENT_ID||'').trim()===String(ctx.user.STUDENT_ID||'').trim())&&
    String(x.STATUS||'').trim().toUpperCase()==='ACTIVE'
  );
  if(!member)throw new Error('ไม่มีสิทธิ์เข้าถึงกลุ่มนี้');
  return true;
}
function assessmentSettings_(){const o={WINDOW_A4:'CLOSED',WINDOW_A5:'CLOSED'};readObjects_('ASSESSMENT_SETTINGS').forEach(r=>o[r.SETTING_KEY]=r.SETTING_VALUE);return o;}
function assessmentSettingsFresh_(){const o={WINDOW_A4:'CLOSED',WINDOW_A5:'CLOSED'};readObjectsFresh_('ASSESSMENT_SETTINGS').forEach(r=>o[r.SETTING_KEY]=r.SETTING_VALUE);return o;}
function setAssessmentSetting_(key,value,actor){const sh=sheet_('ASSESSMENT_SETTINGS'),r=readObjects_('ASSESSMENT_SETTINGS').find(x=>x.SETTING_KEY===key);if(r){sh.getRange(r._row,2).setValue(value);sh.getRange(r._row,3).setValue(new Date());sh.getRange(r._row,4).setValue(actor);}else appendObject_('ASSESSMENT_SETTINGS',{SETTING_KEY:key,SETTING_VALUE:value,UPDATED_AT:new Date(),UPDATED_BY:actor});}
function upsertGroupScore_(groupId,values,actor){const sh=sheet_('GROUP_SCORES'),r=readObjects_('GROUP_SCORES').find(x=>x.GROUP_ID===groupId);if(r){Object.keys(values).forEach(k=>sh.getRange(r._row,SCHEMA.GROUP_SCORES.indexOf(k)+1).setValue(values[k]));sh.getRange(r._row,7).setValue(new Date());sh.getRange(r._row,8).setValue(actor);}else{const o={GROUP_ID:groupId,A1_SCORE:'',A2_SCORE:'',A3_SCORE:'',A4_GROUP_SCORE:'',A4_ADVISOR_USER_ID:'',UPDATED_AT:new Date(),UPDATED_BY:actor};Object.assign(o,values);appendObject_('GROUP_SCORES',o);}}
function upsertIndividualScore_(studentId,groupId,values,actor){const sh=sheet_('INDIVIDUAL_SCORES'),r=readObjects_('INDIVIDUAL_SCORES').find(x=>String(x.STUDENT_ID)===String(studentId));if(r){Object.keys(values).forEach(k=>sh.getRange(r._row,SCHEMA.INDIVIDUAL_SCORES.indexOf(k)+1).setValue(values[k]));sh.getRange(r._row,7).setValue(new Date());sh.getRange(r._row,8).setValue(actor);}else{const o={STUDENT_ID:studentId,GROUP_ID:groupId,A4_INDIVIDUAL_SCORE:'',A5_SCORE:'',A6_SCORE:'',ADMIN_NOTE:'',UPDATED_AT:new Date(),UPDATED_BY:actor};Object.assign(o,values);appendObject_('INDIVIDUAL_SCORES',o);}}

/* ---------------------------- Internal helpers ---------------------------- */

function requireDatabase_() {
  const id=PropertiesService.getScriptProperties().getProperty('DB_ID');
  if (!id) throw new Error('ไม่พบ Script Property DB_ID กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล TEST เดิม โดยห้ามเรียกใช้ setup เพื่อสร้างฐานข้อมูลใหม่');
  return id;
}
let _databaseCache = null;
function db_(){ if (!_databaseCache) _databaseCache = SpreadsheetApp.openById(requireDatabase_()); return _databaseCache; }
const AUTO_CREATE_WORKFLOW_SHEETS_ = Object.freeze([
  'RESEARCH_TOPIC_VERSIONS',
  'RESEARCH_TOPIC_DRAFTS',
  'PROPOSAL_FILES',
  'PROGRESS_REPORTS',
  'ADVISOR_FEEDBACK',
  'PROGRESS_WEEK_SETTINGS',
  'ADVISOR_INVITATIONS',
  'ADVISOR_MAGIC_LINKS','GROUP_TASKS',
  'NOTIFICATIONS','NOTIFICATION_QUEUE','NOTIFICATION_LOG','EARLY_WARNING_RULES','EARLY_WARNING_FLAGS',
  'ETHICS_TRACKING','TASK_COMMENTS','GRADE_RELEASES','GROUP_SCORE_AUDIT','GROUP_DEADLINE_EXTENSIONS'
]);

/**
 * Safely creates or extends only declared additive workflow tables.
 * Existing rows are never cleared or rewritten. Existing headers must match
 * the declared schema prefix exactly; mismatches stop execution for manual review.
 */
function ensureWorkflowSheet_(name) {
  if (!AUTO_CREATE_WORKFLOW_SHEETS_.includes(name)) return null;
  const ss = db_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    const headers = SCHEMA[name];
    if (!headers || !headers.length) throw new Error('ไม่พบ Schema สำหรับชีต ' + name);
    try {
      sh = ss.insertSheet(name);
    } catch (createError) {
      // Another request may have created the same sheet at the same time.
      sh = ss.getSheetByName(name);
      if (!sh) throw createError;
    }
    if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.setFrozenRows(1);
      SpreadsheetApp.flush();
      console.log('WORKFLOW_SCHEMA_CREATED: ' + name + ' @ ' + ss.getId());
    }
  }
  const expected = SCHEMA[name];
  const lastCol = sh.getLastColumn();
  if (lastCol === 0 || sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, expected.length).setValues([expected]);
    sh.setFrozenRows(1);
  } else {
    const current = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(String);
    const isSafePrefix = current.length <= expected.length && current.every((h, i) => h === expected[i]);
    if (!isSafePrefix) {
      throw new Error('Schema mismatch in ' + name + '. ระบบหยุดโดยไม่แก้ไขข้อมูลเดิม กรุณาตรวจสอบหัวคอลัมน์');
    }
    if (current.length < expected.length) {
      sh.getRange(1, current.length + 1, 1, expected.length - current.length)
        .setValues([expected.slice(current.length)]);
      SpreadsheetApp.flush();
      console.log('WORKFLOW_SCHEMA_EXTENDED: ' + name + ' columns ' + current.length + ' -> ' + expected.length);
    }
  }
  return sh;
}

function sheet_(name){
  const ss = db_();
  let sh = ss.getSheetByName(name);
  if (!sh && AUTO_CREATE_WORKFLOW_SHEETS_.includes(name)) {
    sh = ensureWorkflowSheet_(name);
  }
  if(!sh) throw new Error('Missing sheet: '+name+' (Database: '+ss.getName()+')');
  return sh;
}
const READ_CACHE_TABLES_ = Object.freeze(['PEER_ASSESSMENTS','MEETING_RECORDS','SYS_AUDIT_LOG']);
const READ_CACHE_TTL_SECONDS_ = 5;
function readObjects_(name){
  // Cache only append-heavy history tables for a very short period. Critical write paths use readObjectsFresh_.
  if (READ_CACHE_TABLES_.includes(name)) {
    const cache=CacheService.getScriptCache(), key='RO_'+name;
    const cached=cache.get(key);
    if(cached){try{return JSON.parse(cached);}catch(e){cache.remove(key);}}
  }
  const rows=readObjectsFresh_(name);
  if (READ_CACHE_TABLES_.includes(name)) {
    try { const packed=JSON.stringify(rows); if(packed.length<95000) CacheService.getScriptCache().put('RO_'+name,packed,READ_CACHE_TTL_SECONDS_); } catch(e) { /* Cache is optional; continue with live data. */ }
  }
  return rows;
}
function readObjectsFresh_(name){
  const sh=sheet_(name), lastRow=sh.getLastRow(), lastCol=sh.getLastColumn();
  if(lastRow<2 || lastCol<1) return [];
  const values=sh.getRange(1,1,lastRow,lastCol).getValues();
  const headers=values[0].map(String);
  return values.slice(1).map((row,i)=>{
    const o={_row:i+2}; headers.forEach((h,j)=>o[h]=row[j]); return o;
  }).filter(o=>Object.keys(o).some(k=>k!=='_row' && o[k]!=='' && o[k]!==null));
}
function findObjectsByColumnValue_(name,columnName,value){
  const sh=sheet_(name), lastRow=sh.getLastRow(), lastCol=sh.getLastColumn();
  if(lastRow<2 || lastCol<1) return [];
  const headers=sh.getRange(1,1,1,lastCol).getValues()[0].map(String);
  const col=headers.indexOf(columnName)+1;
  if(!col) throw new Error('ไม่พบคอลัมน์ '+columnName+' ในชีต '+name);
  const matches=sh.getRange(2,col,lastRow-1,1).createTextFinder(String(value)).matchEntireCell(true).findAll();
  return matches.map(cell=>{
    const rowNo=cell.getRow(), values=sh.getRange(rowNo,1,1,lastCol).getValues()[0], obj={_row:rowNo};
    headers.forEach((h,j)=>obj[h]=values[j]); return obj;
  });
}
function invalidateReadCache_(name){
  if(READ_CACHE_TABLES_.includes(name)) CacheService.getScriptCache().remove('RO_'+name);
}
function appendObject_(name,obj){
  const headers=SCHEMA[name];
  sheet_(name).appendRow(headers.map(h=>obj[h]===undefined?'':obj[h]));
  invalidateReadCache_(name);
}
function createUser_(x){
  const salt=x.passwordSalt || (Utilities.getUuid()+Utilities.getUuid());
  const now=new Date(), id=Utilities.getUuid();
  const hash=x.passwordHash || hashPassword_(x.password,salt);
  appendObject_('SYS_USERS',{
    USER_ID:id,EMAIL:normalizeEmail_(x.email),DISPLAY_NAME:String(x.displayName||'').trim(),
    ROLE_ID:x.roleId,STUDENT_ID:x.studentId||'',PASSWORD_SALT:salt,PASSWORD_HASH:hash,
    STATUS:x.status||'ACTIVE',EMAIL_VERIFIED:!!x.emailVerified,CREATED_AT:now,
    UPDATED_AT:now,LAST_LOGIN_AT:'',CREATED_BY:x.createdBy||'SYSTEM',
    USERNAME:String(x.username || x.email || '').trim().toLowerCase(),
    PASSWORD_CHANGE_REQUIRED:!!x.passwordChangeRequired
  });
  return readObjects_('SYS_USERS').find(u=>u.USER_ID===id);
}
function bytesToHex_(bytes){
  return bytes.map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('');
}
function hashPasswordBytes_(password,salt){
  const pepper=PropertiesService.getScriptProperties().getProperty('APP_SECRET');
  if(!pepper) throw new Error('ไม่พบ APP_SECRET กรุณากู้คืนค่าเดิมจากการตั้งค่าที่ปลอดภัย ห้ามสร้างค่าใหม่ เพราะจะทำให้ตรวจสอบรหัสผ่านเดิมไม่ได้');
  let value=Utilities.computeHmacSha256Signature(salt+'|'+password,pepper);
  for(let i=1;i<APP.PASSWORD_ITERATIONS;i++){
    value=Utilities.computeHmacSha256Signature(Utilities.base64Encode(value),pepper);
  }
  return value;
}
// New hashes use hexadecimal only (0-9a-f), which cannot be interpreted as a formula.
function hashPassword_(password,salt){
  return bytesToHex_(hashPasswordBytes_(password,salt));
}
// Compatibility verifier accepts both new hex and existing Base64 hashes.
function verifyPassword_(password,salt,expected){
  if(!salt||!expected) return false;
  const bytes=hashPasswordBytes_(password,salt);
  return safeEqual_(bytesToHex_(bytes),String(expected)) ||
         safeEqual_(Utilities.base64Encode(bytes),String(expected));
}
function safeEqual_(a,b){
  a=String(a||''); b=String(b||'');
  if(a.length!==b.length) return false;
  let n=0; for(let i=0;i<a.length;i++) n|=a.charCodeAt(i)^b.charCodeAt(i);
  return n===0;
}
function tokenHashBytes_(token){
  const pepper=PropertiesService.getScriptProperties().getProperty('APP_SECRET');
  return Utilities.computeHmacSha256Signature(String(token||''),pepper||'MISSING_SECRET');
}
// New token hashes are hex; legacy Base64 hashes remain verifiable during transition.
function tokenHash_(token){ return bytesToHex_(tokenHashBytes_(token)); }
function verifyTokenHash_(token,storedHash){
  if(!storedHash) return false;
  const bytes=tokenHashBytes_(token);
  return safeEqual_(bytesToHex_(bytes),String(storedHash)) ||
         safeEqual_(Utilities.base64Encode(bytes),String(storedHash));
}
function digestHex_(value){
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8).map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('');
}
function normalizeEmail_(email){ return String(email||'').trim().toLowerCase(); }
function validateEmail_(email){
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||''))) throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
}
function validatePassword_(password){
  const p=String(password||'');
  if(p.length<APP.PASSWORD_MIN) throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
  if(p.length>128) throw new Error('รหัสผ่านยาวเกินกำหนด');
  if(!/\p{L}/u.test(p)) throw new Error('รหัสผ่านต้องมีตัวอักษรอย่างน้อย 1 ตัว');
  if(!/[0-9]/.test(p)) throw new Error('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  if(!/[^\p{L}0-9]/u.test(p)) throw new Error('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว เช่น @ # !');
}
function generateOtp_(){
  // UUID v4 supplies random hexadecimal digits; rejection sampling avoids modulo bias.
  const limit = 4294000000; // floor(2^32 / 1,000,000) * 1,000,000
  let value;
  do { value = parseInt(Utilities.getUuid().replace(/-/g,'').slice(0,8),16); } while (value >= limit);
  return String(value % 1000000).padStart(6,'0');
}
function issueOtp_(email,purpose,subjectId,payload){
  const lock=LockService.getScriptLock(); lock.waitLock(60000);
  try {
    const cache=CacheService.getScriptCache();
    const rateKey='OTP_RATE_'+digestHex_(normalizeEmail_(email)+'|'+purpose);
    if(cache.get(rateKey)) throw new Error('กรุณารอ 60 วินาทีก่อนขอรหัส OTP ใหม่อีกครั้ง');
    const otp=generateOtp_();
    const now=new Date(), expires=new Date(now.getTime()+APP.OTP_MINUTES*60000), id=Utilities.getUuid();
    appendObject_('SYS_OTP',{
      OTP_ID:id,EMAIL:email,PURPOSE:purpose,SUBJECT_ID:subjectId,
      OTP_HASH:tokenHash_(otp),EXPIRES_AT:expires,ATTEMPTS:0,
      CREATED_AT:now,USED_AT:'',PAYLOAD_JSON:JSON.stringify(payload)
    });
    cache.put(rateKey,'1',60);
    return otp;
  } finally { lock.releaseLock(); }
}
function verifyOtp_(email,purpose,otp){
  const rows=readObjects_('SYS_OTP').filter(r=>normalizeEmail_(r.EMAIL)===email && r.PURPOSE===purpose && !r.USED_AT).sort((a,b)=>new Date(b.CREATED_AT)-new Date(a.CREATED_AT));
  const r=rows[0];
  if(!r || new Date(r.EXPIRES_AT)<new Date()) throw new Error('OTP ไม่ถูกต้องหรือหมดอายุ');
  if(Number(r.ATTEMPTS)>=APP.OTP_MAX_ATTEMPTS) throw new Error('OTP ถูกใช้ผิดเกินจำนวนครั้งที่กำหนด');
  if(!verifyTokenHash_(otp,r.OTP_HASH)){
    sheet_('SYS_OTP').getRange(r._row,7).setValue(Number(r.ATTEMPTS)+1);
    SpreadsheetApp.flush(); // Commit failed-attempt counter before returning the error.
    throw new Error('OTP ไม่ถูกต้อง');
  }
  return r;
}
function markOtpUsed_(id){
  const r=readObjects_('SYS_OTP').find(x=>x.OTP_ID===id);
  if(r) sheet_('SYS_OTP').getRange(r._row,9).setValue(new Date());
}
function findSession_(token){
  const hash=tokenHash_(token);
  return readObjects_('SYS_SESSIONS').find(s=>verifyTokenHash_(token,s.TOKEN_HASH) && !s.REVOKED_AT && new Date(s.EXPIRES_AT)>new Date())||null;
}
function requireSession_(token,allowedRoles,allowPasswordChange){
  if(!token) throw new Error('กรุณาเข้าสู่ระบบใหม่');
  const s=findSession_(token);
  if(!s) throw new Error('Session หมดอายุหรือถูกยกเลิก กรุณาเข้าสู่ระบบใหม่');
  const user=readObjects_('SYS_USERS').find(u=>u.USER_ID===s.USER_ID && u.STATUS==='ACTIVE');
  if(!user) throw new Error('บัญชีถูกระงับหรือไม่พบผู้ใช้');
  if(String(user.PASSWORD_CHANGE_REQUIRED).toUpperCase()==='TRUE' && !allowPasswordChange) {
    throw new Error('กรุณาเปลี่ยนรหัสผ่านชั่วคราวก่อนใช้งานระบบ');
  }
  if(allowedRoles && !allowedRoles.includes(user.ROLE_ID)) throw new Error('ไม่มีสิทธิ์ดำเนินการ');
  sheet_('SYS_SESSIONS').getRange(s._row,6).setValue(new Date());
  return {user:user,session:s};
}
function updateUserLastLogin_(id){
  const u=readObjects_('SYS_USERS').find(x=>x.USER_ID===id);
  if(u) sheet_('SYS_USERS').getRange(u._row,12).setValue(new Date());
}
function logSystem_(action,targetType,targetId,details,actorUserId){
  try {
    appendObject_('SYS_AUDIT_LOG',{
      LOG_ID:Utilities.getUuid(),ACTOR_USER_ID:actorUserId || 'SYSTEM',ACTION:action,
      TARGET_TYPE:targetType,TARGET_ID:targetId,DETAILS_JSON:JSON.stringify(details||{}),CREATED_AT:new Date()
    });
  } catch(e) { console.error('Audit log failure: '+e.message); }
}
