/**
 * SPORT NUTRITION CLASSROOM — WP-SUB-1 Post-Run Reconciliation
 * Version: 1.0.0
 * Branch: development
 *
 * READ-ONLY ONLY. Compares the persisted WP-SUB-1 manifest with live TEST
 * rows. Does not write Script Properties, Sheets, Drive, or external services.
 *
 * Requires SNC_SubmissionIntegrationRunner_TEST.gs and its read-only helpers.
 */
var SNC_SUB_RECON_VERSION_ = '1.0.0';

function snsrSet_(values) {
  var out = {};
  (values || []).forEach(function(v) { out[String(v)] = true; });
  return out;
}
function snsrUnique_(values) {
  var seen = {}, duplicates = [];
  (values || []).forEach(function(v) {
    var key = String(v);
    if (seen[key]) duplicates.push(key);
    seen[key] = true;
  });
  return { values: Object.keys(seen).sort(), duplicates: duplicates };
}
function snsrSameSet_(a, b) {
  return JSON.stringify((a || []).map(String).sort()) ===
    JSON.stringify((b || []).map(String).sort());
}
function snsrMissing_(expected, actual) {
  var have = snsrSet_(actual);
  return (expected || []).map(String).filter(function(v) { return !have[v]; }).sort();
}
function snsrUnexpected_(expected, actual) {
  var have = snsrSet_(expected);
  return (actual || []).map(String).filter(function(v) { return !have[v]; }).sort();
}
function snsrRows_(name) { return cmRows_(name); }
function snsrIds_(table, key) {
  return snsrRows_(table).map(function(r) { return String(r[key] || ''); })
    .filter(Boolean).sort();
}

/**
 * Run after WP-SUB-1. Safe to run repeatedly; it performs reads only.
 * Output intentionally omits raw synthetic IDs.
 */
function SNC_SubmissionPostRunReconciliation_READONLY_TEST() {
  snsiAssertTest_();
  var m = snsiReadManifest_();
  var out = {
    functionName: 'SNC_SubmissionPostRunReconciliation_READONLY_TEST',
    version: SNC_SUB_RECON_VERSION_,
    mode: 'READ_ONLY_POST_RUN_RECONCILIATION',
    status: 'BLOCKED',
    writesExpected: 0,
    externalCallsExpected: 0,
    rawIdsLogged: false,
    checks: []
  };
  function add(id, pass, metrics) {
    out.checks.push({ id: id, status: pass ? 'PASS' : 'BLOCKED', metrics: metrics || {} });
  }
  if (!m) {
    add('MANIFEST-01', false, { reason: 'NO_MANIFEST' });
    out.summary = { pass: 0, blocked: 1, total: 1 };
    console.log('SNC_SUBMISSION_POSTRUN_RECONCILIATION=' + JSON.stringify(out));
    return out;
  }

  var tables = {
    Assignments: ['Assignments', 'AssignmentID'],
    Groups: ['Groups', 'GroupID'],
    GroupMembers: ['GroupMembers', 'GroupMemberID'],
    Submissions: ['Submissions', 'SubmissionID'],
    SubmissionFiles: ['SubmissionFiles', 'SubmissionFileID'],
    IdempotencyKeys: ['IdempotencyKeys', 'IdempotencyKey'],
    AuditLogs: ['AuditLogs', 'AuditID']
  };
  var current = {}, rows = {};
  Object.keys(tables).forEach(function(k) {
    rows[k] = snsrRows_(tables[k][0]);
    current[k] = rows[k].map(function(r) { return String(r[tables[k][1]] || ''); })
      .filter(Boolean).sort();
  });

  add('MANIFEST-01', m.status === 'COMPLETE_WITH_REVIEW_ITEMS' &&
    Array.isArray(m.cases) && m.cases.length === 26 &&
    m.cases.every(function(c) { return c.status === 'PASS'; }),
    { manifestStatus: String(m.status || ''), caseCount: (m.cases || []).length,
      passCount: (m.cases || []).filter(function(c) { return c.status === 'PASS'; }).length,
      failCount: (m.cases || []).filter(function(c) { return c.status !== 'PASS'; }).length });

  var baselineOk = true, createdOk = true, idMetrics = {};
  Object.keys(tables).forEach(function(k) {
    var base = (m.baseline && m.baseline[k]) || [];
    var created = (m.created && m.created[k]) || [];
    var missing = snsrMissing_(base, current[k]);
    var unexpected = snsrUnexpected_(base, current[k]);
    var missingCreated = snsrMissing_(created, current[k]);
    var delta = current[k].filter(function(id) { return !snsrSet_(base)[id]; });
    var duplicate = snsrUnique_(current[k]).duplicates.length;
    var deltaMatches = snsrSameSet_(created, delta);
    if (missing.length || duplicate) baselineOk = false;
    if (missingCreated.length || !deltaMatches) createdOk = false;
    idMetrics[k] = {
      baselineExpected: base.length,
      currentCount: current[k].length,
      baselineMissing: missing.length,
      createdExpected: created.length,
      createdMissing: missingCreated.length,
      postBaselineDelta: delta.length,
      deltaMatchesManifest: deltaMatches,
      duplicateIds: duplicate,
      unexpectedRelativeToBaseline: unexpected.length
    };
  });
  add('BASELINE-IDS-01', baselineOk, idMetrics);
  add('CREATED-IDS-01', createdOk, idMetrics);

  // Preserve the known 68-row AuditLog baseline and reconcile all post-run IDs.
  var auditBaselineCount = (m.baseline && m.baseline.AuditLogs || []).length;
  var auditCreatedCount = (m.created && m.created.AuditLogs || []).length;
  add('AUDIT-IDS-01', auditBaselineCount === 68 &&
    snsrMissing_(m.baseline.AuditLogs, current.AuditLogs).length === 0 &&
    snsrMissing_(m.created.AuditLogs, current.AuditLogs).length === 0 &&
    snsrSameSet_(m.created.AuditLogs,
      current.AuditLogs.filter(function(id) { return !snsrSet_(m.baseline.AuditLogs)[id]; })),
    { baselineExpected: auditBaselineCount, createdExpected: auditCreatedCount,
      currentCount: current.AuditLogs.length });

  // Validate the three manifest Groups against their exact offering/name and member topology.
  var groupNames = ['Alpha', 'Beta', 'Solo'];
  var groupIds = m.fixtures && m.fixtures.groups || {};
  var offeringId = String(m.offeringId || '');
  var groupRows = rows.Groups.filter(function(g) {
    return groupNames.some(function(n) { return String(groupIds[n] || '') === String(g.GroupID); });
  });
  var groupValid = groupNames.every(function(n) {
    var id = String(groupIds[n] || '');
    var g = groupRows.filter(function(x) { return String(x.GroupID) === id; })[0];
    return Boolean(g) && String(g.OfferingID) === offeringId &&
      String(g.GroupName) === 'SNC_TST_20261124_SUB_' + n;
  });
  var memberRows = rows.GroupMembers.filter(function(x) {
    return groupNames.some(function(n) { return String(groupIds[n] || '') === String(x.GroupID); });
  });
  var memberCounts = {};
  groupNames.forEach(function(n) {
    var id = String(groupIds[n] || '');
    var members = memberRows.filter(function(x) { return String(x.GroupID) === id; });
    var active = members.filter(function(x) { return String(x.Status).toUpperCase() === 'ACTIVE'; });
    memberCounts[n] = { total: members.length, active: active.length };
  });
  var topologyOk = groupValid && memberRows.length === 6 &&
    memberCounts.Alpha.total === 2 && memberCounts.Alpha.active === 2 &&
    memberCounts.Beta.total === 3 && memberCounts.Beta.active === 3 &&
    memberCounts.Solo.total === 1 && memberCounts.Solo.active === 0;
  add('GROUP-TOPOLOGY-01', topologyOk,
    { groupCount: groupRows.length, groupMemberCount: memberRows.length, groups: memberCounts });

  // All six test Assignments must belong to the fixture Offering and match their type.
  var assignmentFixtures = m.fixtures && m.fixtures.assignments || {};
  var assignmentIds = Object.keys(assignmentFixtures).map(function(k) { return String(assignmentFixtures[k]); });
  var assignmentRows = rows.Assignments.filter(function(a) {
    return assignmentIds.indexOf(String(a.AssignmentID)) >= 0;
  });
  var assignmentValid = assignmentIds.length === 6 && assignmentRows.length === 6 &&
    assignmentRows.every(function(a) {
      return String(a.OfferingID) === offeringId &&
        String(a.SubmissionType).toUpperCase() ===
          (String(a.Title).indexOf('Individual') >= 0 ? 'INDIVIDUAL' : 'GROUP');
    });
  add('ASSIGNMENT-RELATIONSHIP-01', assignmentValid,
    { fixtureAssignmentsExpected: 6, fixtureAssignmentsFound: assignmentRows.length });

  // All fixture Submissions must reference one of the six fixture Assignments.
  var fixtureAssignmentSet = snsrSet_(assignmentIds);
  var fixtureSubmissions = rows.Submissions.filter(function(s) {
    return fixtureAssignmentSet[String(s.AssignmentID)] === true;
  });
  var submissionRefsValid = fixtureSubmissions.length === (m.created.Submissions || []).length &&
    fixtureSubmissions.every(function(s) {
      return Boolean(s.SubmissionID) &&
        (String(s.SubmissionType).toUpperCase() === 'INDIVIDUAL'
          ? Boolean(s.StudentUserID) && !String(s.GroupID || '')
          : Boolean(s.GroupID));
    });
  add('SUBMISSION-RELATIONSHIP-01', submissionRefsValid,
    { manifestCreatedSubmissions: (m.created.Submissions || []).length,
      fixtureSubmissions: fixtureSubmissions.length });

  // Each test SubmissionFile must reference an existing fixture Submission.
  var fixtureSubmissionSet = snsrSet_(fixtureSubmissions.map(function(s) { return s.SubmissionID; }));
  var fixtureFiles = rows.SubmissionFiles.filter(function(f) {
    return (m.created.SubmissionFiles || []).map(String).indexOf(String(f.SubmissionFileID)) >= 0;
  });
  var filesValid = fixtureFiles.length === (m.created.SubmissionFiles || []).length &&
    fixtureFiles.every(function(f) { return fixtureSubmissionSet[String(f.SubmissionID)] === true; });
  add('SUBMISSION-FILE-REFERENCES-01', filesValid,
    { manifestCreatedFiles: (m.created.SubmissionFiles || []).length,
      filesFound: fixtureFiles.length,
      referencesResolve: fixtureFiles.filter(function(f) { return fixtureSubmissionSet[String(f.SubmissionID)] === true; }).length });

  // Audit events must refer to fixture Submission IDs; no assumptions about other AuditLog entities.
  var fixtureSubmissionIds = snsrSet_(fixtureSubmissions.map(function(s) { return s.SubmissionID; }));
  var submissionAuditRows = rows.AuditLogs.filter(function(a) {
    return String(a.EntityType) === 'Submission' && fixtureSubmissionIds[String(a.EntityID)] === true;
  });
  var auditRefsValid = submissionAuditRows.length === fixtureSubmissions.length &&
    submissionAuditRows.every(function(a) {
      return ['SUBMISSION_CREATED', 'SUBMISSION_REVISED'].indexOf(String(a.Action)) >= 0 &&
        Boolean(a.RequestID);
    });
  add('SUBMISSION-AUDIT-REFERENCES-01', auditRefsValid,
    { fixtureSubmissions: fixtureSubmissions.length, matchingAuditRows: submissionAuditRows.length });

  var stub = m.notificationStub || {};
  add('NOTIFICATION-STUB-01', stub.restored === true &&
    (stub.assignmentOpenCalls || []).length === 6 &&
    (stub.submissionCalls || []).length > 0,
    { restored: stub.restored === true, assignmentOpenCalls: (stub.assignmentOpenCalls || []).length,
      submissionCalls: (stub.submissionCalls || []).length });

  var blocked = out.checks.filter(function(x) { return x.status !== 'PASS'; }).length;
  out.summary = { pass: out.checks.length - blocked, blocked: blocked, total: out.checks.length };
  out.status = blocked === 0 ? 'PASS' : 'BLOCKED';
  out.currentCounts = Object.keys(current).reduce(function(o, k) {
    o[k] = current[k].length; return o;
  }, {});
  out.audit = { baselineExpected: auditBaselineCount, createdExpected: auditCreatedCount,
    currentCount: current.AuditLogs.length, submissionAuditRows: submissionAuditRows.length };
  console.log('SNC_SUBMISSION_POSTRUN_RECONCILIATION=' + JSON.stringify(out));
  return out;
}
