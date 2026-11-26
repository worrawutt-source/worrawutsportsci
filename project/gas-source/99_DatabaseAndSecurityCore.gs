
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
  'ADVISOR_MAGIC_LINKS','MEETING_REPORTS','GROUP_TASKS',
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
