/**
 * SPORT NUTRITION CLASSROOM — Group Continuation State Diagnostic
 * TEST / READ-ONLY / v1.0.0
 *
 * Verifies whether the existing Assignment & Group fixture is in the exact
 * pre-GRP-07 state required by GROUP_CONTINUATION_DESIGN_v1.0.
 *
 * No writes to Sheets, Script Properties, files, or external services.
 * Requires the existing SNC_AssignmentGroupIntegrationRunner_TEST.gs helpers.
 * Does not execute Group/Assignment/Submission handlers.
 */
function SNC_GroupContinuationStateDiagnostic_READONLY_TEST() {
  var result = {
    test: 'SNC_GROUP_CONTINUATION_STATE_DIAGNOSTIC',
    version: '1.0.0',
    evidenceLevel: 'READ_ONLY_TEST_DATA_INSPECTION',
    mode: 'READ_ONLY',
    writesExpected: 0,
    externalCallsExpected: 0,
    status: 'BLOCKED',
    checks: []
  };

  function check(id, ok, detail) {
    result.checks.push({
      id: id,
      status: ok ? 'PASS' : 'BLOCKED',
      detail: detail
    });
  }
  function sameSet(actual, expected) {
    if (actual.length !== expected.length) return false;
    var a = actual.slice().sort();
    var e = expected.slice().sort();
    return a.every(function(v, i) { return v === e[i]; });
  }
  function duplicates(values) {
    var seen = {};
    var out = [];
    values.forEach(function(v) {
      var k = String(v);
      if (seen[k]) out.push(k);
      seen[k] = true;
    });
    return out;
  }
  function delta(actual, baseline) {
    return actual.filter(function(id) {
      return baseline.indexOf(id) < 0;
    });
  }
  function oneRow(rows, key, id) {
    return rows.filter(function(r) {
      return String(r[key]) === String(id);
    });
  }

  try {
    // Environment and manifest gates.
    var env = sncAGR_env_TEST_();
    check('ENV-01', env.ok, env.ok
      ? 'Exact TEST environment and active Spreadsheet identity verified.'
      : 'TEST environment or active Spreadsheet identity mismatch.');
    if (!env.ok) return sncGCD_finish_(result);

    var mr = SNC_GetAssignmentGroupManifest_TEST();
    var m = mr && mr.success ? mr.assignmentGroup : null;
    var coreOk = Boolean(mr && mr.success &&
      mr.coreStatus === 'CORE_FIXTURE_CREATED' &&
      m && m.status === 'IN_PROGRESS' &&
      m.preBatchIds && m.assignments && m.groups &&
      Array.isArray(m.cases));
    check('MANIFEST-01', coreOk,
      coreOk ? 'Core and Assignment/Group manifests are present in the expected IN_PROGRESS state.'
        : 'Manifest missing, malformed, or not in the expected IN_PROGRESS state.');
    if (!coreOk) return sncGCD_finish_(result);

    // Ensure continuation has not already started.
    check('CONTINUATION-01', !m.continuation && !m.continuationState &&
      !m.groupContinuation,
      'No continuation marker exists in the current Assignment/Group manifest.');

    // Case ledger must be exactly at the known checkpoint.
    var cases = m.cases;
    function findCase(id) {
      return cases.filter(function(c) { return String(c.id) === id; });
    }
    var requiredPass = [
      'GRP-01','GRP-02','GRP-03','GRP-04A','GRP-04B','GRP-05','GRP-06A','GRP-06B'
    ];
    var ledgerOk = requiredPass.every(function(id) {
      var found = findCase(id);
      return found.length === 1 && found[0].status === 'PASS';
    });
    var asg13 = findCase('ASG-13');
    ledgerOk = ledgerOk && asg13.length === 1 &&
      asg13[0].status === 'FAIL' &&
      asg13[0].expected === 'CONFLICT' &&
      asg13[0].actual === 'SUCCESS';
    var notStarted = [
      'GRP-07','GRP-08A','GRP-08B','GRP-08C','GRP-09',
      'GRP-10A','GRP-10B','GRP-11','GRP-12'
    ].every(function(id) { return findCase(id).length === 0; });
    var caseIds = cases.map(function(c) { return String(c.id); });
    ledgerOk = ledgerOk && duplicates(caseIds).length === 0 && notStarted;
    check('CASE-LEDGER-01', ledgerOk,
      ledgerOk ? 'Completed case ledger matches the verified GRP-06B checkpoint; ASG-13 historical failure is preserved.'
        : 'Case ledger differs from the required checkpoint, contains duplicates, or continuation cases already exist.');

    // Resolve the required fixture identities from manifest only.
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var users = Array.isArray(m.userIds) ? m.userIds.map(String) : [];
    var assignmentMap = m.assignments || {};
    var assignmentIds = Object.keys(assignmentMap).map(function(k) {
      return String(assignmentMap[k]);
    });
    var groups = m.groups || {};
    var groupKeys = Object.keys(groups);
    var expectedGroupKeys = ['alpha','beta','solo'];
    var groupIds = groupKeys.map(function(k) { return String(groups[k].groupId); });
    var memberIds = [];
    groupKeys.forEach(function(k) {
      memberIds = memberIds.concat((groups[k].memberIds || []).map(String));
    });
    var fixtureShapeOk = users.length === 6 &&
      assignmentIds.length === 4 &&
      groupKeys.length === 3 &&
      sameSet(groupKeys, expectedGroupKeys) &&
      memberIds.length === 6 &&
      duplicates(assignmentIds).length === 0 &&
      duplicates(groupIds).length === 0 &&
      duplicates(memberIds).length === 0;
    check('FIXTURE-MANIFEST-01', fixtureShapeOk,
      fixtureShapeOk ? 'Manifest contains six users, four assignments, three groups and six original memberships.'
        : 'Fixture manifest does not have the expected entity counts or unique identifiers.');
    if (!fixtureShapeOk) return sncGCD_finish_(result);

    // Validate the columns required for safe, unambiguous inspection.
    var requiredColumns = {
      Assignments: ['AssignmentID','OfferingID','Status'],
      Groups: ['GroupID','OfferingID','MembershipLockedAt','Status'],
      GroupMembers: ['GroupMemberID','GroupID','UserID','MemberRole','LeftAt','Status'],
      Submissions: ['AssignmentID','GroupID']
    };
    var schemaOk = true;
    Object.keys(requiredColumns).forEach(function(name) {
      var sheet = ss.getSheetByName(name);
      if (!sheet || sheet.getLastColumn() < 1) {
        schemaOk = false;
        return;
      }
      var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
      if (!requiredColumns[name].every(function(h) {
        return headers.indexOf(h) >= 0;
      })) schemaOk = false;
    });
    var auditSheet = ss.getSheetByName('AuditLogs');
    if (!auditSheet || auditSheet.getLastColumn() < 1) {
      schemaOk = false;
    } else {
      var auditHeaders = auditSheet.getRange(1,1,1,auditSheet.getLastColumn()).getDisplayValues()[0];
      var auditPk = auditHeaders.indexOf('AuditID') >= 0 ||
        auditHeaders.indexOf('AuditLogID') >= 0;
      if (!auditPk || !['Action','EntityType','EntityID'].every(function(h) {
        return auditHeaders.indexOf(h) >= 0;
      })) schemaOk = false;
    }
    check('SCHEMA-01', schemaOk,
      schemaOk ? 'Required Assignment, Group, GroupMember, Submission and AuditLog columns are present.'
        : 'One or more required table columns are missing or unavailable.');
    if (!schemaOk) return sncGCD_finish_(result);

    // Read tables using the existing read-only helpers.
    var assignmentRows = sncAGR_rows_TEST_(ss, 'Assignments');
    var groupRows = sncAGR_rows_TEST_(ss, 'Groups');
    var memberRows = sncAGR_rows_TEST_(ss, 'GroupMembers');
    var auditRows = sncAGR_rows_TEST_(ss, 'AuditLogs');
    var submissionRows = sncAGR_rows_TEST_(ss, 'Submissions');
    var baseline = m.preBatchIds;

    var assignmentDelta = delta(sncAGR_ids_TEST_(ss).Assignments,
      (baseline.Assignments || []).map(String));
    var groupDelta = delta(sncAGR_ids_TEST_(ss).Groups,
      (baseline.Groups || []).map(String));
    var memberDelta = delta(sncAGR_ids_TEST_(ss).GroupMembers,
      (baseline.GroupMembers || []).map(String));

    var assignmentRowsOk = assignmentIds.every(function(id) {
      return oneRow(assignmentRows, 'AssignmentID', id).length === 1;
    }) && sameSet(assignmentDelta, assignmentIds);
    check('ASSIGNMENTS-01', assignmentRowsOk,
      assignmentRowsOk ? 'All four manifest Assignment IDs resolve exactly once; no unexpected new Assignment IDs.'
        : 'Assignment rows are missing/duplicated or new Assignment IDs do not match the manifest.');

    var groupRowsOk = groupIds.every(function(id) {
      var found = oneRow(groupRows, 'GroupID', id);
      return found.length === 1 &&
        String(found[0].Status).toUpperCase() === 'ACTIVE' &&
        !found[0].MembershipLockedAt &&
        String(found[0].OfferingID) === String(m.offeringId);
    }) && sameSet(groupDelta, groupIds);
    check('GROUPS-01', groupRowsOk,
      groupRowsOk ? 'All three manifest Groups resolve exactly once, are ACTIVE, unlocked and in the fixture offering.'
        : 'Group rows/status/lock/offering or exact new Group ID set is inconsistent.');

    var memberRowsOk = memberIds.every(function(id) {
      return oneRow(memberRows, 'GroupMemberID', id).length === 1;
    }) && sameSet(memberDelta, memberIds);
    check('GROUP-MEMBERS-01', memberRowsOk,
      memberRowsOk ? 'All six original GroupMember IDs resolve exactly once; no unexpected new membership IDs.'
        : 'Original GroupMember rows are missing/duplicated or unexpected membership IDs exist.');

    // Exact expected active membership composition and role state.
    var expectedComposition = {
      alpha: [
        { userId: users[0], role: 'LEADER' },
        { userId: users[1], role: 'MEMBER' }
      ],
      beta: [
        { userId: users[2], role: 'LEADER' },
        { userId: users[3], role: 'MEMBER' },
        { userId: users[4], role: 'MEMBER' }
      ],
      solo: [
        { userId: users[5], role: 'LEADER' }
      ]
    };
    var compositionOk = true;
    expectedGroupKeys.forEach(function(key) {
      var gid = String(groups[key].groupId);
      var active = memberRows.filter(function(r) {
        return String(r.GroupID) === gid &&
          String(r.Status).toUpperCase() === 'ACTIVE';
      });
      var expected = expectedComposition[key];
      var actualPairs = active.map(function(r) {
        return String(r.UserID) + '|' + String(r.MemberRole).toUpperCase();
      });
      var expectedPairs = expected.map(function(r) {
        return String(r.userId) + '|' + r.role;
      });
      if (!sameSet(actualPairs, expectedPairs)) compositionOk = false;
      var allForGroup = memberRows.filter(function(r) {
        return String(r.GroupID) === gid;
      });
      if (allForGroup.length !== expected.length ||
          allForGroup.some(function(r) {
            return String(r.Status).toUpperCase() !== 'ACTIVE' ||
              Boolean(r.LeftAt);
          })) compositionOk = false;
    });
    check('MEMBERSHIP-STATE-01', compositionOk,
      compositionOk ? 'Alpha A/B, Beta C/D/E and Solo F have the exact expected active roles; no prior leave/rejoin state.'
        : 'Group membership composition, role, status, or LeftAt state differs from the pre-continuation baseline.');

    // Exact AuditLog set and event matrix (16 previously reconciled records).
    var capture = m.lastWriteCapture;
    var auditBase = (baseline.AuditLogs || []).map(String);
    var capturedAuditIds = capture && capture.caseId === 'GRP-05' &&
      capture.newIds && Array.isArray(capture.newIds.AuditLogs)
      ? capture.newIds.AuditLogs.map(String) : [];
    var actualAuditIds = auditRows.map(function(r) {
      return String(r.AuditID || r.AuditLogID || '');
    }).filter(Boolean);
    var actualAuditDelta = delta(actualAuditIds, auditBase);
    var auditIdOk = capturedAuditIds.length === 16 &&
      duplicates(capturedAuditIds).length === 0 &&
      duplicates(actualAuditIds).length === 0 &&
      sameSet(actualAuditDelta, capturedAuditIds) &&
      capturedAuditIds.every(function(id) {
        return oneRow(auditRows, 'AuditID', id).length === 1 ||
          oneRow(auditRows, 'AuditLogID', id).length === 1;
      });
    check('AUDIT-IDS-01', auditIdOk,
      auditIdOk ? 'Exactly the 16 previously reconciled AuditLog IDs exist since baseline; no missing, duplicate or untracked IDs.'
        : 'AuditLog IDs differ from the previously reconciled 16-ID capture.');

    var expectedEvents = {
      'ASSIGNMENT_CREATED|Assignment': 4,
      'ASSIGNMENT_UPDATED|Assignment': 2,
      'ASSIGNMENT_OPENED|Assignment': 2,
      'ASSIGNMENT_CLOSED|Assignment': 2,
      'GROUP_CREATED|Group': 3,
      'GROUP_MEMBER_JOINED|Group': 3
    };
    var eventCounts = {};
    var entityIdsOk = true;
    var expectedEntityIds = {};
    assignmentIds.forEach(function(id) { expectedEntityIds[id] = true; });
    groupIds.forEach(function(id) { expectedEntityIds[id] = true; });
    actualAuditDelta.forEach(function(id) {
      var row = oneRow(auditRows, 'AuditID', id)[0] ||
        oneRow(auditRows, 'AuditLogID', id)[0];
      if (!row) { entityIdsOk = false; return; }
      var key = String(row.Action) + '|' + String(row.EntityType);
      eventCounts[key] = (eventCounts[key] || 0) + 1;
      if (!expectedEntityIds[String(row.EntityID)]) entityIdsOk = false;
    });
    var eventMatrixOk = Object.keys(expectedEvents).every(function(k) {
      return eventCounts[k] === expectedEvents[k];
    }) && Object.keys(eventCounts).every(function(k) {
      return Object.prototype.hasOwnProperty.call(expectedEvents, k);
    });
    check('AUDIT-EVENTS-01', eventMatrixOk && entityIdsOk,
      eventMatrixOk && entityIdsOk
        ? 'All 16 AuditLog events match the reconciled Action/EntityType matrix and manifest entity IDs.'
        : 'AuditLog event counts or EntityID references differ from the expected matrix.');

    // No Submission may exist for any synthetic Assignment or Group.
    var assignmentSet = {};
    assignmentIds.forEach(function(id) { assignmentSet[id] = true; });
    var groupSet = {};
    groupIds.forEach(function(id) { groupSet[id] = true; });
    var relatedSubmissions = submissionRows.filter(function(s) {
      return assignmentSet[String(s.AssignmentID)] ||
        groupSet[String(s.GroupID)];
    });
    check('SUBMISSIONS-01', relatedSubmissions.length === 0,
      relatedSubmissions.length === 0
        ? 'No Submission references any synthetic Assignment or Group.'
        : 'Submission rows reference synthetic Assignment or Group fixtures; continuation is blocked.');

    // Existing actor resolver is read-only; confirms a single active SYSTEM_ADMIN.
    var adminOk = Boolean(sncAGR_admin_TEST_(ss));
    check('ACTOR-01', adminOk,
      adminOk ? 'Existing active SYSTEM_ADMIN actor resolves uniquely.'
        : 'Existing SYSTEM_ADMIN actor is unavailable or ambiguous.');

    result.counts = {
      assignments: assignmentIds.length,
      groups: groupIds.length,
      originalGroupMembers: memberIds.length,
      capturedAuditLogs: capturedAuditIds.length,
      actualNewAuditLogs: actualAuditDelta.length,
      relatedSubmissions: relatedSubmissions.length
    };
    result.caseCheckpoint = 'GRP-06B';
  } catch (e) {
    result.checks.push({
      id: 'DIAGNOSTIC-ERROR',
      status: 'BLOCKED',
      detail: 'Read-only diagnostic could not complete; inspect the sanitized execution exception.'
    });
    result.errorClass = String(e && e.name || 'Error');
  }
  return sncGCD_finish_(result);
}

function sncGCD_finish_(result) {
  result.status = result.checks.length > 0 &&
    result.checks.every(function(c) { return c.status === 'PASS'; })
    ? 'READY' : 'BLOCKED';
  result.summary = {
    pass: result.checks.filter(function(c) { return c.status === 'PASS'; }).length,
    blocked: result.checks.filter(function(c) { return c.status !== 'PASS'; }).length
  };
  Logger.log('SNC_GROUP_CONTINUATION_STATE=' + JSON.stringify(result));
  return result;
}
