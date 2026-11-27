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
  MEETING_REPORTS: ['REPORT_ID','GROUP_ID','MEETING_NO','MEETING_WEEK','MEETING_DATE','PREPARATION_PROGRESS','AGENDA_1','AGENDA_2','AGENDA_3','PROBLEMS','CONSULTATION_SUMMARY','NEXT_ACTION_1','DUE_DATE_1','NEXT_ACTION_2','DUE_DATE_2','NEXT_ACTION_3','DUE_DATE_3','STATUS','CREATED_BY','UPDATED_BY','CREATED_AT','UPDATED_AT','SUBMITTED_AT','REVIEWED_BY','REVIEWED_AT','REVIEW_COMMENT','VERSION'],
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
  COMMIT_SHA: '5e6e9f1760bf98490807e64da0fa87433def826b',
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
