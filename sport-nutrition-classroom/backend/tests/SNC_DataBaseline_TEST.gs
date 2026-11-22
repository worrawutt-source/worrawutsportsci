/**
 * SPORT NUTRITION CLASSROOM — Read-only data baseline collector
 * Version: 1.0.1
 *
 * SAFETY:
 * - Reads only the active spreadsheet and Script Properties.
 * - Does not write to Sheets, Drive, Script Properties, triggers, or external services.
 * - Captures each declared table's first-column primary keys, row count,
 *   duplicate/blank key counts, and SHA-256 digest.
 * - Never reads or exports names, emails, StudentID, or other personal fields.
 *
 * Run manually: sncCaptureDataBaseline_TEST()
 * Keep the returned primary-key manifest private as it may contain account-linked IDs.
 */
function sncCaptureDataBaseline_TEST() {
  var props = PropertiesService.getScriptProperties();
  var env = String(props.getProperty('SNC_ITR_ENVIRONMENT') || '').trim().toUpperCase();
  var expectedId = String(props.getProperty('SNC_ITR_TEST_SPREADSHEET_ID') || '').trim();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (env !== 'TEST') throw new Error('BASELINE_BLOCKED: SNC_ITR_ENVIRONMENT must be TEST.');
  if (!expectedId) throw new Error('BASELINE_BLOCKED: SNC_ITR_TEST_SPREADSHEET_ID is missing.');
  if (!ss || ss.getId() !== expectedId) throw new Error('BASELINE_BLOCKED: active spreadsheet does not match the approved spreadsheet ID.');
  if (typeof SNC_SETUP !== 'object' || !SNC_SETUP.TABLES) throw new Error('BASELINE_BLOCKED: SNC_SETUP.TABLES is unavailable.');

  var tables = [];
  var errors = [];
  Object.keys(SNC_SETUP.TABLES).sort().forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      errors.push({table:name, issue:'MISSING_TABLE'});
      return;
    }
    var expectedHeaders = SNC_SETUP.TABLES[name];
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (!expectedHeaders || !expectedHeaders.length || lastCol < 1) {
      errors.push({table:name, issue:'MISSING_PRIMARY_KEY_HEADER'});
      return;
    }
    var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function(v){return String(v).trim();});
    var pk = String(expectedHeaders[0]);
    if (headers[0] !== pk) {
      errors.push({table:name, issue:'PRIMARY_KEY_HEADER_MISMATCH', expected:pk, actual:headers[0] || ''});
      return;
    }
    var ids = lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().map(function(r){return String(r[0]).trim();}).filter(function(v){return v !== '';})
      : [];
    var seen = Object.create(null), duplicates = [];
    ids.forEach(function(id){ if (seen[id]) duplicates.push(id); else seen[id] = true; });
    var sorted = ids.slice().sort();
    var digestInput = sorted.join('\\n');
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, digestInput, Utilities.Charset.UTF_8)
      .map(function(b){var v=(b<0?b+256:b).toString(16);return v.length===1?'0'+v:v;}).join('');
    tables.push({
      table:name,
      primaryKey:pk,
      dataRows:Math.max(0,lastRow-1),
      nonBlankPrimaryKeys:ids.length,
      blankPrimaryKeyRows:Math.max(0,lastRow-1)-ids.length,
      duplicatePrimaryKeyCount:duplicates.length,
      primaryKeySha256:digest,
      primaryKeyValues:sorted
    });
  });

  var report = {
    report:'SNC_DATA_BASELINE',
    version:'1.0.0',
    mode:'READ_ONLY',
    capturedAt:new Date().toISOString(),
    spreadsheetName:ss.getName(),
    spreadsheetIdSuffix:ss.getId().slice(-6),
    schemaVersion:SNC_SETUP.VERSION,
    tableCount:tables.length,
    errorCount:errors.length,
    errors:errors,
    tables:tables
  };
  report.success = errors.length === 0 && tables.every(function(t){
    return t.blankPrimaryKeyRows === 0 && t.duplicatePrimaryKeyCount === 0;
  });
  // Log only compact, non-PII integrity evidence. The returned report retains
  // the full primary-key manifest for private owner-side retention if needed.
  var compact = {
    report:report.report,
    version:'1.0.1',
    mode:report.mode,
    capturedAt:report.capturedAt,
    spreadsheetName:report.spreadsheetName,
    spreadsheetIdSuffix:report.spreadsheetIdSuffix,
    schemaVersion:report.schemaVersion,
    tableCount:report.tableCount,
    errorCount:report.errorCount,
    errors:report.errors,
    success:report.success,
    tables:report.tables.map(function(t){
      return {
        table:t.table,
        primaryKey:t.primaryKey,
        dataRows:t.dataRows,
        nonBlankPrimaryKeys:t.nonBlankPrimaryKeys,
        blankPrimaryKeyRows:t.blankPrimaryKeyRows,
        duplicatePrimaryKeyCount:t.duplicatePrimaryKeyCount,
        primaryKeySha256:t.primaryKeySha256
      };
    })
  };
  console.log('SNC_DATA_BASELINE_SUMMARY=' + JSON.stringify(compact));
  return report;
}
