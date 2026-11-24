/**
 * SPORT SCIENCE RESEARCH LAB — Database Setup v0.3.6
 * MUST be used in a container-bound Apps Script project opened from
 * the target Google Spreadsheet: Extensions > Apps Script.
 * This setup NEVER creates a new Spreadsheet.
 */
function setup() {
  return setupTestDatabase();
}

function setupTestDatabase() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (!active) {
      throw new Error('ไม่พบ Active Spreadsheet กรุณาเปิด Google Sheets เป้าหมาย แล้วเลือก Extensions > Apps Script เพื่อสร้าง/เปิด Script ที่ผูกกับไฟล์นั้น');
    }

    const props = PropertiesService.getScriptProperties();
    // Fallback to the previously created TEST database when this is a newly
    // container-bound script project with fresh Script Properties.
    const LEGACY_TEST_DB_ID = '1HQYjHcmaKrDBsu8SORswG8B9LdYbTWsjex8f0RvGCQc';
    const previousId = props.getProperty('DB_ID') || LEGACY_TEST_DB_ID;
    const targetId = active.getId();

    // Use the spreadsheet hosting this Apps Script. Do not create a new file.
    props.setProperty('DB_ID', targetId);
    props.setProperty('ENVIRONMENT', 'TEST');
    if (!props.getProperty('APP_SECRET')) {
      props.setProperty('APP_SECRET', Utilities.getUuid() + Utilities.getUuid());
    }

    Object.keys(SCHEMA).forEach(name => {
      let sh = active.getSheetByName(name);
      if (!sh) sh = active.insertSheet(name);
      const expected = SCHEMA[name];
      if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
        sh.clear();
        sh.getRange(1, 1, 1, expected.length).setValues([expected]);
      } else {
        const current = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0].map(String);
        const prefixMatches = current.every((h, i) => expected[i] === h);
        if (!prefixMatches || current.length > expected.length) {
          throw new Error('Schema mismatch in ' + name + '. หยุดโดยไม่เขียนทับข้อมูล กรุณาตรวจสอบหัวคอลัมน์');
        }
        if (current.length < expected.length) {
          sh.getRange(1, current.length + 1, 1, expected.length - current.length)
            .setValues([expected.slice(current.length)]);
        }
      }
      sh.setFrozenRows(1);
    });

    // One-time safe migration from the previous separate TEST database.
    // Copy a table only when its destination currently contains headers only.
    let migrationStatus = 'NOT_REQUIRED';
    if (previousId && previousId !== targetId) {
      try {
        const previous = SpreadsheetApp.openById(previousId);
        Object.keys(SCHEMA).forEach(name => {
          const oldSheet = previous.getSheetByName(name);
          const newSheet = active.getSheetByName(name);
          if (!oldSheet || oldSheet.getLastRow() < 2 || newSheet.getLastRow() > 1) return;
          const oldHeaders = oldSheet.getRange(1, 1, 1, oldSheet.getLastColumn()).getDisplayValues()[0];
          const newHeaders = newSheet.getRange(1, 1, 1, newSheet.getLastColumn()).getDisplayValues()[0];
          const oldIndex = new Map(oldHeaders.map((h,i)=>[h,i]));
          const rows = oldSheet.getRange(2,1,oldSheet.getLastRow()-1,oldSheet.getLastColumn()).getValues();
          const mapped = rows.map(row=>newHeaders.map(h=>oldIndex.has(h)?row[oldIndex.get(h)]:''));
          if (mapped.length) newSheet.getRange(2,1,mapped.length,newHeaders.length).setValues(mapped);
        });
        migrationStatus = 'COMPLETED';
      } catch (migrationError) {
        migrationStatus = 'SKIPPED_NO_ACCESS';
        console.warn('ข้ามการย้ายข้อมูลจากฐานข้อมูลเดิม (' + previousId + '): ' + migrationError.message);
      }
    }

    migrateLegacyRoles_();
    seedRoles_();
    seedConfig_();

    let users = readObjects_('SYS_USERS');
    let admin = users.find(u => String(u.USERNAME || '').toLowerCase() === 'admin' || u.ROLE_ID === ROLE.ADMIN);
    if (!admin) {
      admin = createUser_({
        username: 'admin', email: '', displayName: 'System Administrator',
        roleId: ROLE.ADMIN, studentId: '', password: '123456',
        passwordChangeRequired: true, emailVerified: true,
        status: 'ACTIVE', createdBy: 'SYSTEM_SETUP'
      });
      logSystem_('DEFAULT_ADMIN_CREATED','USER',admin.USER_ID,{username:'admin',forcePasswordChange:true});
    }

    logSystem_('DATABASE_SETUP_COMPLETED','DATABASE',targetId,{
      version:APP.VERSION,environment:'TEST',spreadsheetId:targetId,previousDatabaseId:previousId || null
    });

    const result = {
      ok:true,
      databaseName:active.getName(),
      spreadsheetId:targetId,
      url:active.getUrl(),
      createdSheets:Object.keys(SCHEMA),
      adminUsername:'admin',
      adminCreated:!!admin,
      migrationStatus:migrationStatus, migratedFromPreviousDatabase:migrationStatus==='COMPLETED'
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function migrateLegacyRoles_() {
  const sh = sheet_('SYS_USERS');
  const users = readObjects_('SYS_USERS');
  users.forEach(u => {
    let next = String(u.ROLE_ID || '');
    if (next === 'SYSTEM_ADMIN') next = ROLE.ADMIN;
    else if (next === 'RESEARCH_ADVISOR') next = ROLE.ADVISOR;
    else if (next === 'COURSE_COORDINATOR') next = ROLE.ADVISOR; // least-privilege migration
    if (next && next !== u.ROLE_ID) {
      sh.getRange(u._row, SCHEMA.SYS_USERS.indexOf('ROLE_ID') + 1).setValue(next);
    }
  });
}

function seedRoles_() {
  const sh = sheet_('SYS_ROLES');
  const rows = [
    [ROLE.ADMIN,'ผู้ดูแลระบบ','Administrator','จัดการผู้ใช้ สิทธิ์ และการตั้งค่าระบบ',true],
    [ROLE.ADVISOR,'อาจารย์ที่ปรึกษา','Research Advisor','ให้คำปรึกษาเฉพาะกลุ่มที่ได้รับมอบหมาย',true],
    [ROLE.STUDENT,'นักศึกษา','Student','ดำเนินงานในพื้นที่กลุ่มของตน',true]
  ];
  if (sh.getLastRow() > 1) {
    sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
  }
  sh.getRange(2,1,rows.length,rows[0].length).setValues(rows);
}

function seedConfig_() {
  const sh = sheet_('SYS_CONFIG');
  const current = readObjects_('SYS_CONFIG');
  const existing = new Set(current.map(r=>String(r.KEY)));
  const rows = [
    ['APP_NAME',APP.NAME],['APP_VERSION',APP.VERSION],['COURSE_CODE',APP.COURSE_CODE],
    ['TERM',APP.TERM],['SECTION',APP.SECTION],['ENVIRONMENT','TEST']
  ];
  rows.forEach(r=>{
    const old = current.find(x=>String(x.KEY)===r[0]);
    if (old) {
      const row = old._row;
      sh.getRange(row,2).setValue(r[1]);
      sh.getRange(row,3).setValue(new Date());
      sh.getRange(row,4).setValue('SYSTEM_SETUP');
    } else {
      sh.appendRow([r[0],r[1],new Date(),'SYSTEM_SETUP']);
    }
  });
}


/**
 * ADMIN ACCOUNT RECOVERY — run manually from Apps Script editor.
 * Resets the existing Admin account in the ACTIVE bound Spreadsheet.
 * It does not delete users, students, groups, or other business data.
 *
 * Run: recoverAdminAccess()
 * Temporary login: admin / 123456
 * User must change password immediately after login.
 */
function recoverAdminAccess() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('ไม่พบ Active Spreadsheet: เปิด Apps Script ผ่าน Google Sheets เป้าหมายก่อน');
  }

  // Ensure all server functions use the spreadsheet currently hosting this script.
  PropertiesService.getScriptProperties().setProperty('DB_ID', active.getId());

  // Reuse the existing setup. It is idempotent and does not create a new Spreadsheet.
  setupTestDatabase();

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const users = readObjects_('SYS_USERS');
    let admin = users.find(u =>
      String(u.USERNAME || '').trim().toLowerCase() === 'admin' ||
      String(u.ROLE_ID || '') === ROLE.ADMIN ||
      String(u.ROLE_ID || '') === 'SYSTEM_ADMIN'
    );

    const salt = Utilities.getUuid() + Utilities.getUuid();
    const hash = hashPassword_('123456', salt);
    const now = new Date();

    if (!admin) {
      admin = createUser_({
        username: 'admin',
        email: '',
        displayName: 'System Administrator',
        roleId: ROLE.ADMIN,
        studentId: '',
        passwordSalt: salt,
        passwordHash: hash,
        passwordChangeRequired: true,
        emailVerified: true,
        status: 'ACTIVE',
        createdBy: 'ADMIN_ACCOUNT_RECOVERY'
      });
    } else {
      const sh = sheet_('SYS_USERS');
      const setField = (field, value) => {
        const col = SCHEMA.SYS_USERS.indexOf(field) + 1;
        if (col < 1) throw new Error('ไม่พบคอลัมน์ ' + field + ' ใน SYS_USERS');
        sh.getRange(admin._row, col).setValue(value);
      };
      setField('USERNAME', 'admin');
      setField('ROLE_ID', ROLE.ADMIN);
      setField('PASSWORD_SALT', salt);
      setField('PASSWORD_HASH', hash);
      setField('STATUS', 'ACTIVE');
      setField('EMAIL_VERIFIED', true);
      setField('PASSWORD_CHANGE_REQUIRED', true);
      setField('UPDATED_AT', now);
      if (!admin.DISPLAY_NAME) setField('DISPLAY_NAME', 'System Administrator');
      admin = readObjects_('SYS_USERS').find(u => u.USER_ID === admin.USER_ID);
    }

    // Revoke every active session so the recovered account starts cleanly.
    const sessions = readObjects_('SYS_SESSIONS').filter(s =>
      s.USER_ID === admin.USER_ID && !s.REVOKED_AT
    );
    const sessionSheet = sheet_('SYS_SESSIONS');
    sessions.forEach(s => sessionSheet.getRange(s._row, 7).setValue(now));

    logSystem_('ADMIN_ACCOUNT_RECOVERED', 'USER', admin.USER_ID, {
      username: 'admin',
      forcePasswordChange: true,
      revokedSessions: sessions.length
    });

    const result = {
      ok: true,
      spreadsheetId: active.getId(),
      adminUserId: admin.USER_ID,
      username: 'admin',
      temporaryPassword: '123456',
      forcePasswordChange: true,
      revokedSessions: sessions.length,
      message: 'กู้คืนบัญชี Admin แล้ว กรุณา Login และเปลี่ยนรหัสผ่านทันที'
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}
