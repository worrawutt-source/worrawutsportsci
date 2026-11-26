
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
