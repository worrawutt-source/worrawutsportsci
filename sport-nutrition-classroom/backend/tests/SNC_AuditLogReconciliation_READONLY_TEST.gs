/**
 * SPORT NUTRITION CLASSROOM
 * AuditLog ID + event reconciliation (TEST / READ-ONLY)
 *
 * Compares manifest-captured AuditLog IDs, actual AuditLog IDs added since
 * the pre-batch baseline, and Action + EntityType + EntityID.
 * No writes, Script Properties changes, triggers, or external calls.
 */
function SNC_AuditLogReconciliation_READONLY_TEST() {
  var env = sncAGR_env_TEST_();
  if (!env.ok) throw new Error('SAFETY_STOP: ' + env.reason);

  var manifestResult = SNC_GetAssignmentGroupManifest_TEST();
  if (!manifestResult.success || !manifestResult.assignmentGroup) {
    throw new Error('SAFETY_STOP: Assignment/Group manifest unavailable.');
  }

  var a = manifestResult.assignmentGroup;
  var capture = a.lastWriteCapture;
  var base = a.preBatchIds || {};

  if (!capture || capture.caseId !== 'GRP-05' ||
      !capture.newIds || !Array.isArray(capture.newIds.AuditLogs)) {
    throw new Error('SAFETY_STOP: Expected GRP-05 AuditLog capture is missing.');
  }
  if (!Array.isArray(base.AuditLogs)) {
    throw new Error('SAFETY_STOP: Pre-batch AuditLog baseline is missing.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('AuditLogs');
  if (!sh || sh.getLastRow() < 2) {
    throw new Error('SCHEMA_BLOCKED: AuditLogs sheet is unavailable or empty.');
  }

  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  var required = ['AuditID', 'ActorUserID', 'Action', 'EntityType',
    'EntityID', 'DetailsJson', 'CreatedAt', 'RequestID'];
  if (headers.length !== required.length ||
      !required.every(function(h, i) { return headers[i] === h; })) {
    throw new Error('SCHEMA_BLOCKED: AuditLogs headers do not match expected schema.');
  }

  var rows = rowsAsObjects_(sh);
  var actualIds = rows.map(function(r) { return String(r.AuditID || ''); })
    .filter(Boolean);
  var expectedIds = capture.newIds.AuditLogs.map(String);
  var baselineIds = base.AuditLogs.map(String);

  function duplicates(values) {
    var seen = {};
    var out = [];
    values.forEach(function(v) {
      if (seen[v]) out.push(v);
      seen[v] = true;
    });
    return out;
  }
  function difference(left, right) {
    return left.filter(function(v) { return right.indexOf(v) < 0; });
  }

  var duplicateExpectedIds = duplicates(expectedIds);
  var duplicateActualIds = duplicates(actualIds);
  var actualNewIds = difference(actualIds, baselineIds);
  var missingIds = difference(expectedIds, actualIds);
  var untrackedAuditIds = difference(actualNewIds, expectedIds);

  var rowsById = {};
  rows.forEach(function(r) {
    var id = String(r.AuditID || '');
    if (!id) return;
    if (!rowsById[id]) rowsById[id] = [];
    rowsById[id].push(r);
  });

  var auditRecords = [];
  var duplicateManifestIdRows = [];
  expectedIds.forEach(function(id) {
    var matches = rowsById[id] || [];
    if (matches.length > 1) {
      duplicateManifestIdRows.push(id);
      return;
    }
    if (matches.length !== 1) return;
    var r = matches[0];
    auditRecords.push({
      auditId: id,
      action: String(r.Action || ''),
      entityType: String(r.EntityType || ''),
      entityId: String(r.EntityID || ''),
      createdAt: r.CreatedAt
    });
  });

  var expectedEvents = {
    'ASSIGNMENT_CREATED|Assignment': 4,
    'ASSIGNMENT_UPDATED|Assignment': 2,
    'ASSIGNMENT_OPENED|Assignment': 2,
    'ASSIGNMENT_CLOSED|Assignment': 2,
    'GROUP_CREATED|Group': 3,
    'GROUP_MEMBER_JOINED|Group': 3
  };
  var actualEvents = {};
  auditRecords.forEach(function(r) {
    var key = r.action + '|' + r.entityType;
    actualEvents[key] = (actualEvents[key] || 0) + 1;
  });

  var eventComparison = {};
  Object.keys(expectedEvents).forEach(function(key) {
    eventComparison[key] = {
      expected: expectedEvents[key],
      actual: actualEvents[key] || 0,
      pass: expectedEvents[key] === (actualEvents[key] || 0)
    };
  });

  var unexpectedEvents = auditRecords.filter(function(r) {
    return !Object.prototype.hasOwnProperty.call(
      expectedEvents, r.action + '|' + r.entityType
    );
  });

  var assignmentIds = Object.keys(a.assignments || {}).map(function(k) {
    return String(a.assignments[k]);
  });
  var groupIds = Object.keys(a.groups || {}).map(function(k) {
    return String(a.groups[k].groupId);
  });

  var wrongEntityIds = auditRecords.filter(function(r) {
    if (r.entityType === 'Assignment') return assignmentIds.indexOf(r.entityId) < 0;
    if (r.entityType === 'Group') return groupIds.indexOf(r.entityId) < 0;
    return true;
  });

  var eventCountsPass = Object.keys(eventComparison).every(function(k) {
    return eventComparison[k].pass;
  });
  var pass = expectedIds.length === 16 &&
    actualNewIds.length === expectedIds.length &&
    missingIds.length === 0 &&
    untrackedAuditIds.length === 0 &&
    duplicateExpectedIds.length === 0 &&
    duplicateActualIds.length === 0 &&
    duplicateManifestIdRows.length === 0 &&
    eventCountsPass &&
    unexpectedEvents.length === 0 &&
    wrongEntityIds.length === 0;

  var result = {
    status: pass ? 'PASS' : 'REQUIRES_REVIEW',
    evidenceLevel: 'READ_ONLY_AUDITLOG_ID_AND_EVENT_RECONCILIATION',
    writesExpected: 0,
    externalCallsExpected: 0,
    manifestStatus: a.status || null,
    captureCaseId: capture.caseId,
    expectedIdCount: expectedIds.length,
    actualNewIdCountSincePreBatch: actualNewIds.length,
    matchedRecordCount: auditRecords.length,
    missingIds: missingIds,
    untrackedAuditIds: untrackedAuditIds,
    duplicateExpectedIds: duplicateExpectedIds,
    duplicateActualIds: duplicateActualIds,
    duplicateManifestIdRows: duplicateManifestIdRows,
    eventCounts: eventComparison,
    unexpectedEvents: unexpectedEvents,
    wrongEntityIds: wrongEntityIds,
    auditRecords: auditRecords
  };

  Logger.log('SNC_AUDITLOG_RECONCILIATION=' + JSON.stringify(result));
  return result;
}
