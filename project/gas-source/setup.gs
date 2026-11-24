/**
 * SPORT SCIENCE RESEARCH LAB — Safe Configuration Diagnostics
 * This file intentionally contains NO database initialization, schema seeding,
 * data migration, role reset, or account recovery routines.
 *
 * Database records and Script Properties must be preserved.
 * Run diagnoseSystemConfiguration() only when an administrator requests
 * a read-only configuration check. Do not run setup() to initialize data.
 */

function setup() {
  throw new Error('ปิดการทำงาน setup แบบเดิมเพื่อป้องกันการล้าง/เขียนทับข้อมูล กรุณาใช้ฐานข้อมูล TEST ที่กำหนดค่า DB_ID ไว้แล้ว และติดต่อผู้ดูแลระบบก่อนเปลี่ยนการตั้งค่า');
}

function setupTestDatabase() {
  throw new Error('ฟังก์ชัน setupTestDatabase ถูกปิดเพื่อป้องกันการสร้าง/แก้ไข schema และ seed ข้อมูลโดยไม่ผ่านแผน migration ที่อนุมัติ');
}

function recoverAdminAccess() {
  throw new Error('ปิดการกู้คืนบัญชีแบบรหัสผ่านเริ่มต้นเพื่อความปลอดภัย กรุณาใช้กระบวนการกู้คืนบัญชีที่ได้รับอนุมัติ');
}

/**
 * Read-only diagnostics. Does not create sheets or modify Script Properties.
 */
function diagnoseSystemConfiguration() {
  const props = PropertiesService.getScriptProperties();
  const dbId = props.getProperty('DB_ID') || '';
  const appSecretConfigured = !!props.getProperty('APP_SECRET');
  const result = {
    ok: true,
    databaseConfigured: !!dbId,
    appSecretConfigured: appSecretConfigured,
    environment: props.getProperty('ENVIRONMENT') || 'UNSET',
    spreadsheetName: '',
    spreadsheetIdSuffix: dbId ? dbId.slice(-6) : '',
    requiredSheets: [],
    missingSheets: [],
    schemaIssues: [],
    checkedAt: new Date().toISOString()
  };

  if (!dbId) {
    result.ok = false;
    result.message = 'ไม่พบ Script Property DB_ID — ยังไม่สามารถเชื่อมต่อฐานข้อมูล';
    return result;
  }
  if (!appSecretConfigured) {
    result.ok = false;
    result.message = 'ไม่พบ APP_SECRET — ห้ามสร้าง secret ใหม่หรือเริ่มใช้งานจนกว่าจะตรวจสอบการตั้งค่าเดิม';
  }

  const ss = SpreadsheetApp.openById(dbId);
  result.spreadsheetName = ss.getName();

  if (typeof SCHEMA === 'undefined') {
    result.ok = false;
    result.message = 'ไม่พบ SCHEMA จาก Code.gs';
    return result;
  }

  Object.keys(SCHEMA).forEach(function(name) {
    const sh = ss.getSheetByName(name);
    if (!sh) {
      result.missingSheets.push(name);
      return;
    }
    const expected = SCHEMA[name];
    const lastCol = sh.getLastColumn();
    const actual = lastCol ? sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(String) : [];
    const prefixMatches = actual.length <= expected.length &&
      actual.every(function(header, index) { return header === expected[index]; });
    if (!prefixMatches) {
      result.schemaIssues.push({
        sheet: name,
        expectedColumns: expected.length,
        actualHeaders: actual
      });
    } else if (actual.length < expected.length) {
      result.schemaIssues.push({
        sheet: name,
        expectedColumns: expected.length,
        actualColumns: actual.length,
        status: 'MISSING_COLUMNS — requires separately approved additive migration'
      });
    }
    result.requiredSheets.push(name);
  });

  result.ok = result.ok && result.missingSheets.length === 0 && result.schemaIssues.length === 0;
  result.message = result.ok
    ? 'ตรวจสอบการตั้งค่าและ schema ผ่าน โดยไม่มีการแก้ไขข้อมูล'
    : 'พบประเด็นที่ต้องตรวจสอบก่อนใช้งาน ไม่มีการแก้ไขฐานข้อมูลหรือ Script Properties';
  return result;
}
