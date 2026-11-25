/**
 * SPORT NUTRITION CLASSROOM — WP-SUB-2 Read-only Preflight
 * Scope: G1 implementation only. This utility must never mutate Sheets,
 * Drive, Script Properties, Cache, triggers, notifications, or external services.
 *
 * Entry point:
 *   SNC_WP_SUB_2_Preflight_READONLY_TEST()
 *
 * Important:
 * - READY is deliberately impossible while required owner evidence is absent.
 * - DriveApp folder PRIVATE status is not treated as proof of effective ACL.
 * - Apps Script cannot reliably self-inspect deployed source blobs; source
 *   manifest verification therefore remains BLOCKED pending an external check.
 * - No Runner, Manifest writer, cleanup, or mutation helper is included.
 */
var SNC_WP_SUB_2_PREFLIGHT_ = Object.freeze({
  VERSION: '1.0.0',
  EXPECTED_FOLDER_ID: '1qkSUK8nEOw_bZqEIEkpM4VJQYZEZjK56',
  EXPECTED_FOLDER_NAME: 'SNC_TEST_SUBMISSION_FILES',
  EXPECTED_PARENT_NAME: 'ProjectLine',
  SUBFOLDERS: [
    '01_VALID_FILES',
    '02_INVALID_FILES',
    '03_UPLOADED_TEST_FILES',
    '04_ROLLBACK_TEST'
  ],
  REQUIRED_SHEETS: [
    'SubmissionFiles',
    'Submissions',
    'Groups',
    'GroupMembers',
    'AuditLogs',
    'Assignments',
    'CourseOfferings',
    'Users'
  ]
});

/**
 * Read-only entry point. Returns a sanitized report and logs only that report.
 * success means the inspection completed, not that the environment is READY.
 */
function SNC_WP_SUB_2_Preflight_READONLY_TEST() {
  var checks = [];
  var evidence = {
    sourceManifestMatch: false,
    folderConfigMatch: false,
    folderPrivate: false,
    effectiveAclVerified: false,
    actorMappingComplete: false,
    assignmentTargetsEligible: false,
    fixtureInventoryMatch: false,
    baselineCapturedReadOnly: false,
    externalCallsExpected: 0,
    writesExpected: 0
  };

  function add(id, status, detail) {
    checks.push({
      id: id,
      status: status,
      detail: String(detail || '').slice(0, 240)
    });
  }

  function blocked(id, detail) { add(id, 'BLOCKED', detail); }
  function pass(id, detail) { add(id, 'PASS', detail); }
  function fail(id, detail) { add(id, 'FAIL', detail); }

  // PF-01: There is no approved, machine-verifiable TEST environment marker
  // in the inspected application configuration. Do not infer from folder name.
  blocked('PF-01', 'ยังไม่มี TEST environment marker ที่อนุมัติและตรวจสอบได้');

  // PF-02: Apps Script runtime has no supported API to read its own source
  // files and compare Git blob SHAs. External source/GAS synchronization is needed.
  blocked('PF-02', 'ต้องตรวจ Source Manifest และเทียบกับ GAS จากภายนอก');

  // PF-03: WP-SUB-1 exact manifest/ID inventory is not available to this
  // read-only utility as an approved input. Never infer safety from row counts.
  blocked('PF-03', 'ยังไม่มี WP-SUB-1 exact-ID baseline สำหรับตรวจการไม่ทับซ้อน');

  // PF-04: Read Script Property only; never change it or print its value.
  var configuredFolderId = '';
  try {
    configuredFolderId = PropertiesService.getScriptProperties()
      .getProperty('SNC_SUBMISSION_FOLDER_ID') || '';
    if (!configuredFolderId) {
      fail('PF-04', 'ไม่พบ SNC_SUBMISSION_FOLDER_ID');
    } else {
      evidence.folderConfigMatch =
        configuredFolderId === SNC_WP_SUB_2_PREFLIGHT_.EXPECTED_FOLDER_ID;
      if (evidence.folderConfigMatch) {
        pass('PF-04', 'พบค่า Script Property และตรงกับโฟลเดอร์ TEST ที่กำหนด');
      } else {
        fail('PF-04', 'ค่า Script Property ไม่ตรงกับโฟลเดอร์ TEST ที่กำหนด');
      }
    }
  } catch (e) {
    blocked('PF-04', 'อ่าน Script Property ไม่สำเร็จ');
  }

  // PF-05/PF-06/PF-07: Inspect the owner-provided folder and its children.
  var rootFolder = null;
  var childFolders = {};
  try {
    rootFolder = DriveApp.getFolderById(
      SNC_WP_SUB_2_PREFLIGHT_.EXPECTED_FOLDER_ID
    );
    var rootName = rootFolder.getName();
    var parentNames = [];
    var parents = rootFolder.getParents();
    while (parents.hasNext()) {
      parentNames.push(parents.next().getName());
    }

    var correctParent = parentNames.indexOf(
      SNC_WP_SUB_2_PREFLIGHT_.EXPECTED_PARENT_NAME
    ) >= 0;

    if (rootName === SNC_WP_SUB_2_PREFLIGHT_.EXPECTED_FOLDER_NAME &&
        correctParent) {
      pass('PF-05', 'ยืนยันชื่อโฟลเดอร์และชื่อโฟลเดอร์แม่ตรงตามข้อมูลที่กำหนด');
    } else {
      fail('PF-05', 'ชื่อโฟลเดอร์หรือความสัมพันธ์กับโฟลเดอร์แม่ไม่ตรง');
    }

    var childIt = rootFolder.getFolders();
    while (childIt.hasNext()) {
      var child = childIt.next();
      var childName = child.getName();
      if (!childFolders[childName]) childFolders[childName] = [];
      childFolders[childName].push(child);
    }

    var missing = [];
    var duplicates = [];
    SNC_WP_SUB_2_PREFLIGHT_.SUBFOLDERS.forEach(function(name) {
      var matches = childFolders[name] || [];
      if (matches.length === 0) missing.push(name);
      if (matches.length > 1) duplicates.push(name);
    });

    if (!missing.length && !duplicates.length) {
      pass('PF-06', 'พบโฟลเดอร์ย่อยครบ 4 รายการและไม่มีชื่อซ้ำ');
    } else {
      fail('PF-06', 'โครงสร้างโฟลเดอร์ย่อยไม่ตรง: missing=' +
        missing.length + ', duplicateNames=' + duplicates.length);
    }

    var sharingAccess = rootFolder.getSharingAccess();
    evidence.folderPrivate = sharingAccess === DriveApp.Access.PRIVATE;
    if (evidence.folderPrivate) {
      pass('PF-07', 'โฟลเดอร์มี Sharing Access เป็น PRIVATE');
    } else {
      fail('PF-07', 'โฟลเดอร์ไม่ได้จำกัด Sharing Access เป็น PRIVATE');
    }
  } catch (e) {
    blocked('PF-05', 'ตรวจตัวตนโฟลเดอร์หรือโฟลเดอร์แม่ไม่ได้');
    blocked('PF-06', 'ตรวจโครงสร้างโฟลเดอร์ย่อยไม่ได้');
    blocked('PF-07', 'ตรวจ Sharing Access ของโฟลเดอร์ไม่ได้');
  }

  // PF-08: DriveApp cannot reliably distinguish all inherited/effective ACL
  // sources for this folder. PRIVATE alone is insufficient evidence.
  blocked('PF-08', 'ยังพิสูจน์ Effective ACL รวมสิทธิ์สืบทอดไม่ได้');
  evidence.effectiveAclVerified = false;

  // PF-09: Effective execution identity and its approved mapping are not
  // established by the project specification. Do not print account identity.
  blocked('PF-09', 'ยังไม่มีการยืนยันบัญชี GAS ที่ได้รับอนุมัติ');

  // PF-10: No approved fixture inventory manifest exists yet.
  blocked('PF-10', 'ยังไม่มี Fixture Manifest สำหรับเทียบไฟล์ตัวอย่าง');

  // PF-11/PF-12: Synthetic actor-role and distinct email mapping are owner inputs.
  blocked('PF-11', 'ยังไม่มี Actor/Role mapping ที่เจ้าของอนุมัติ');
  blocked('PF-12', 'ยังไม่มีการยืนยันอีเมลจำลองที่ถูกต้องและไม่ซ้ำ');

  // PF-13/PF-14: Do not guess Assignment or Group targets from live rows.
  blocked('PF-13', 'ยังไม่มี Assignment targets ที่ระบุและอนุมัติอย่างแน่นอน');
  blocked('PF-14', 'ยังไม่มี Group/member/leader mapping ที่อนุมัติ');

  // PF-15: Read-only schema inspection. Check required sheet presence,
  // non-empty header rows, and duplicate header names.
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      fail('PF-15', 'ไม่พบ Active Spreadsheet');
    } else {
      var sheetNames = ss.getSheets().map(function(sh) { return sh.getName(); });
      var missingSheets = SNC_WP_SUB_2_PREFLIGHT_.REQUIRED_SHEETS.filter(
        function(name) { return sheetNames.indexOf(name) < 0; }
      );
      var malformedSheets = [];
      SNC_WP_SUB_2_PREFLIGHT_.REQUIRED_SHEETS.forEach(function(name) {
        if (sheetNames.indexOf(name) < 0) return;
        var sh = ss.getSheetByName(name);
        var lastCol = sh.getLastColumn();
        if (lastCol < 1 || sh.getLastRow() < 1) {
          malformedSheets.push(name);
          return;
        }
        var headers = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0]
          .map(function(v) { return String(v || '').trim(); });
        var nonEmpty = headers.filter(function(v) { return !!v; });
        var unique = nonEmpty.filter(function(v, i, all) {
          return all.indexOf(v) === i;
        });
        if (!nonEmpty.length || unique.length !== nonEmpty.length ||
            nonEmpty.length !== headers.length) {
          malformedSheets.push(name);
        }
      });

      if (missingSheets.length || malformedSheets.length) {
        fail('PF-15', 'Sheet/Header มีข้อผิดพลาด: missingSheets=' +
          missingSheets.length + ', malformedSheets=' + malformedSheets.length);
      } else {
        blocked('PF-15', 'พบ Sheet และ Header เบื้องต้น แต่ยังไม่มี approved required-header manifest สำหรับยืนยัน Schema ครบถ้วน');
      }
    }
  } catch (e) {
    blocked('PF-15', 'ตรวจ Schema ของ Spreadsheet ไม่สำเร็จ');
  }

  // PF-16: Capture only transient row counts. Exact ID baseline and Drive
  // inventory fingerprints require an approved Manifest design and are not
  // persisted by this utility.
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      var counts = {};
      SNC_WP_SUB_2_PREFLIGHT_.REQUIRED_SHEETS.forEach(function(name) {
        var sh = active.getSheetByName(name);
        counts[name] = sh ? Math.max(0, sh.getLastRow() - 1) : null;
      });
      evidence.baselineCapturedReadOnly = false;
      blocked('PF-16', 'อ่านจำนวนแถวได้แบบชั่วคราว แต่ยังไม่มี exact-ID/Drive inventory baseline');
      evidence.transientRowCounts = counts;
    } else {
      blocked('PF-16', 'ไม่พบ Active Spreadsheet สำหรับอ่าน baseline');
    }
  } catch (e) {
    blocked('PF-16', 'อ่านข้อมูล baseline แบบ Read-only ไม่สำเร็จ');
  }

  // PF-17: Static source inspection found LINE/UrlFetch notification paths.
  // No runtime hook test is performed here; Preflight must not call handlers.
  blocked('PF-17', 'ต้องยืนยัน Notification Stub/restore และ zero external calls ในขั้น Runner แยกต่างหาก');

  // PF-18: Concurrency requires owner confirmation at execution time.
  blocked('PF-18', 'ยังไม่มีการยืนยันช่วงเวลาทดสอบและไม่มีงาน TEST อื่นทำงาน');

  // PF-19: Manifest storage is intentionally not selected or written here.
  blocked('PF-19', 'ยังไม่มีตำแหน่งจัดเก็บ Manifest ที่เจ้าของอนุมัติ');

  // PF-20: File disposition is an owner decision; cleanup is never implied.
  blocked('PF-20', 'ยังไม่มีมติการเก็บไฟล์ผลทดสอบหลังจบงาน');

  var totals = { PASS: 0, FAIL: 0, BLOCKED: 0, NOT_RUN: 0 };
  checks.forEach(function(c) { totals[c.status] = (totals[c.status] || 0) + 1; });
  var status = totals.FAIL ? 'BLOCKED' :
    (totals.BLOCKED || totals.NOT_RUN ? 'BLOCKED' : 'READY');

  var report = {
    utility: 'SNC_WP_SUB_2_Preflight_READONLY_TEST',
    version: SNC_WP_SUB_2_PREFLIGHT_.VERSION,
    success: true,
    status: status,
    checksTotal: checks.length,
    pass: totals.PASS,
    fail: totals.FAIL,
    blocked: totals.BLOCKED,
    notRun: totals.NOT_RUN,
    evidence: evidence,
    checks: checks,
    safety: {
      writesExpected: 0,
      externalCallsExpected: 0,
      driveMutationsExpected: 0,
      sheetWritesExpected: 0,
      propertiesWritesExpected: 0,
      triggersExpected: 0,
      cleanupPerformed: false
    }
  };

  console.log(JSON.stringify(report, null, 2));
  return report;
}
