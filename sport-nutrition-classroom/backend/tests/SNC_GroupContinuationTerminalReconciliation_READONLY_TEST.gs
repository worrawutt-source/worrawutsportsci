/**
 * SPORT NUTRITION CLASSROOM
 * Group Continuation Terminal Reconciliation (TEST / READ-ONLY)
 * Verifies the owner-run GRP-07..GRP-12 continuation against live TEST rows
 * and the persisted manifest. Never repairs, normalizes, or mutates data.
 */
function SNC_GroupContinuationTerminalReconciliation_READONLY_TEST() {
  var out = {
    runner: 'SNC_GroupContinuationTerminalReconciliation_READONLY_TEST',
    version: '1.0.1',
    evidenceLevel: 'READ_ONLY_TERMINAL_DATA_AND_AUDIT_RECONCILIATION',
    mode: 'READ_ONLY',
    writesExpected: 0,
    externalCallsExpected: 0,
    status: 'BLOCKED',
    checks: []
  };
  function check(id, ok, detail) {
    out.checks.push({id:id,status:ok?'PASS':'BLOCKED',detail:detail});
  }
  function finish() {
    out.status = out.checks.length && out.checks.every(function(x){return x.status==='PASS';})
      ? 'PASS' : 'REQUIRES_REVIEW';
    out.summary = {
      pass:out.checks.filter(function(x){return x.status==='PASS';}).length,
      blocked:out.checks.filter(function(x){return x.status!=='PASS';}).length
    };
    Logger.log('SNC_GROUP_TERMINAL_RECONCILIATION='+JSON.stringify(out));
    return out;
  }
  try {
    var env = sncAGR_env_TEST_();
    check('ENV-01',Boolean(env&&env.ok),'Exact TEST spreadsheet identity verified.');
    if (!env || !env.ok) return finish();

    var core = SNC_GetSyntheticFixtureManifest_TEST();
    var ext = SNC_GetAssignmentGroupManifest_TEST();
    var a = ext && ext.success ? ext.assignmentGroup : null;
    var c = a && a.continuation;
    var manifestOk = core && core.status==='CORE_FIXTURE_CREATED' &&
      Array.isArray(core.userIds) && core.userIds.length===6 && core.offeringId &&
      a && a.status==='IN_PROGRESS' && a.assignments && a.groups &&
      Array.isArray(a.preBatchIds && a.preBatchIds.GroupMembers) &&
      Array.isArray(a.preBatchIds && a.preBatchIds.AuditLogs) &&
      c && c.status==='COMPLETE_WITH_HISTORICAL_FAILURE' && Array.isArray(c.cases);
    check('MANIFEST-01',Boolean(manifestOk),
      manifestOk?'Core, Assignment/Group and completed continuation manifests are present.':
      'Required fixture or completed continuation manifest is missing or inconsistent.');
    if (!manifestOk) return finish();

    var requiredCases=['GRP-07','GRP-08A','GRP-08B','GRP-08C','GRP-09','GRP-10A','GRP-10B','GRP-11','GRP-12'];
    var caseIds=c.cases.map(function(x){return String(x.id);});
    var casesOk=caseIds.length===9 && requiredCases.every(function(id){
      var found=c.cases.filter(function(x){return String(x.id)===id;});
      return found.length===1 && (found[0].status==='PASS'||found[0].status==='RECOVERED_VERIFIED');
    }) && caseIds.every(function(id){return requiredCases.indexOf(id)>=0;}) &&
      c.status==='COMPLETE_WITH_HISTORICAL_FAILURE' &&
      c.terminalReconciliation && c.terminalReconciliation.alphaMembershipState==='PASS' &&
      c.terminalReconciliation.continuationCases==='PASS' &&
      Number(c.terminalReconciliation.newGroupMemberCount)===1;
    check('CASE-LEDGER-01',casesOk,
      casesOk?'All nine in-scope continuation cases are uniquely recorded as PASS/RECOVERED_VERIFIED.':
      'Continuation case ledger or terminal manifest marker does not match the expected nine cases.');

    var historical=a.cases.filter(function(x){return String(x.id)==='ASG-13';});
    var historyOk=historical.length===1 && historical[0].status==='FAIL' &&
      historical[0].expected==='CONFLICT' && historical[0].actual==='SUCCESS';
    check('HISTORY-01',historyOk,
      historyOk?'Historical ASG-13 FAIL remains preserved in the original ledger.':
      'Historical ASG-13 record is missing or was altered.');

    var users=core.userIds.map(String);
    var groups=a.groups;
    var groupIds=['alpha','beta','solo'].map(function(k){return String(groups[k]&&groups[k].groupId||'');});
    var fixtureOk=users.length===6 && groupIds.every(Boolean) &&
      groupIds.filter(function(x,i){return groupIds.indexOf(x)===i;}).length===3;
    check('FIXTURE-IDS-01',fixtureOk,'Existing six synthetic users and three group IDs are available.');
    if (!fixtureOk) return finish();

    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var groupRows=sncAGR_rows_TEST_(ss,'Groups');
    var memberRows=sncAGR_rows_TEST_(ss,'GroupMembers');
    var assignmentRows=sncAGR_rows_TEST_(ss,'Assignments');
    var submissionRows=sncAGR_rows_TEST_(ss,'Submissions');
    var auditRows=sncAGR_rows_TEST_(ss,'AuditLogs');

    function members(gid){return memberRows.filter(function(r){return String(r.GroupID)===String(gid);});}
    function pair(row){return String(row.UserID)+'|'+String(row.MemberRole).toUpperCase()+'|'+String(row.Status).toUpperCase()+'|'+(row.LeftAt?'Y':'N');}
    function exactPairs(gid,expected){
      var actual=members(gid).map(pair).sort();
      var wanted=expected.slice().sort();
      return actual.length===wanted.length && actual.every(function(v,i){return v===wanted[i];});
    }
    var alpha=String(groups.alpha.groupId), beta=String(groups.beta.groupId), solo=String(groups.solo.groupId);
    var alphaOk=exactPairs(alpha,[
      users[0]+'|MEMBER|LEFT|Y',
      users[0]+'|MEMBER|ACTIVE|N',
      users[1]+'|LEADER|ACTIVE|N'
    ]);
    var betaOk=exactPairs(beta,[
      users[2]+'|LEADER|ACTIVE|N',
      users[3]+'|MEMBER|ACTIVE|N',
      users[4]+'|MEMBER|ACTIVE|N'
    ]);
    var soloOk=exactPairs(solo,[users[5]+'|LEADER|ACTIVE|N']);
    var groupRowsOk=[alpha,beta,solo].every(function(gid){
      var found=groupRows.filter(function(r){return String(r.GroupID)===gid;});
      return found.length===1 && String(found[0].Status).toUpperCase()==='ACTIVE' &&
        String(found[0].OfferingID)===String(core.offeringId) && !found[0].MembershipLockedAt;
    });
    check('GROUP-STATE-01',alphaOk&&betaOk&&soloOk&&groupRowsOk,
      alphaOk&&betaOk&&soloOk&&groupRowsOk?
      'Alpha leave/rejoin state, Beta/Solo membership, roles, statuses and unlocked group states match expected terminal state.':
      'Live Group/GroupMember rows differ from the expected terminal membership state.');

    var actualIds=sncAGR_ids_TEST_(ss);
    var baselineMembers=a.preBatchIds.GroupMembers.map(String);
    var expectedMemberIds=[];
    ['alpha','beta','solo'].forEach(function(k){
      expectedMemberIds=expectedMemberIds.concat((groups[k].memberIds||[]).map(String));
    });
    var memberDelta=actualIds.GroupMembers.map(String).filter(function(id){
      return baselineMembers.indexOf(id)<0;
    });
    var memberIdsOk=expectedMemberIds.length===7 && memberDelta.length===7 &&
      expectedMemberIds.every(function(id){return memberDelta.indexOf(id)>=0;}) &&
      memberDelta.every(function(id){return expectedMemberIds.indexOf(id)>=0;});
    var assignmentIds=Object.keys(a.assignments).map(function(k){return String(a.assignments[k]);});
    var expectedGroupIds=groupIds.slice();
    var assignmentsOk=assignmentIds.length===4 && assignmentRows.length===actualIds.Assignments.length &&
      assignmentIds.every(function(id){return actualIds.Assignments.map(String).indexOf(id)>=0;});
    var groupsOk=expectedGroupIds.every(function(id){return actualIds.Groups.map(String).indexOf(id)>=0;}) &&
      actualIds.Groups.length===expectedGroupIds.length;
    check('PRIMARY-IDS-01',memberIdsOk&&assignmentsOk&&groupsOk,
      memberIdsOk&&assignmentsOk&&groupsOk?
      'Four Assignments, three Groups and exactly seven synthetic GroupMember IDs reconcile to manifest.':
      'Assignment, Group or GroupMember primary IDs differ from the manifest/baseline.');

    var syntheticAssignmentIds=assignmentIds;
    var noSubmissions=submissionRows.every(function(r){
      return syntheticAssignmentIds.indexOf(String(r.AssignmentID))<0 &&
        expectedGroupIds.indexOf(String(r.GroupID))<0;
    });
    check('SUBMISSIONS-01',noSubmissions,
      noSubmissions?'No Submission references the synthetic Assignment/Group fixtures.':
      'A Submission references a synthetic Assignment or Group fixture.');

    var auditSheet=ss.getSheetByName('AuditLogs');
    var auditHeaders=auditSheet&&auditSheet.getLastColumn()?
      auditSheet.getRange(1,1,1,auditSheet.getLastColumn()).getDisplayValues()[0]:[];
    var requiredHeaders=['AuditID','ActorUserID','Action','EntityType','EntityID','DetailsJson','CreatedAt','RequestID'];
    var schemaOk=auditHeaders.length===requiredHeaders.length &&
      requiredHeaders.every(function(h,i){return auditHeaders[i]===h;});
    check('AUDIT-SCHEMA-01',schemaOk,'AuditLogs schema matches the expected eight-column contract.');
    if (!schemaOk) return finish();

    var baseAudit=a.preBatchIds.AuditLogs.map(String);
    var actualAuditIds=auditRows.map(function(r){return String(r.AuditID||'');}).filter(Boolean);
    var newAuditIds=actualAuditIds.filter(function(id){return baseAudit.indexOf(id)<0;});
    var duplicates=actualAuditIds.filter(function(id,i){return actualAuditIds.indexOf(id)!==i;});
    var newAuditRows=auditRows.filter(function(r){return baseAudit.indexOf(String(r.AuditID||''))<0;});
    var eventCounts={};
    newAuditRows.forEach(function(r){
      var key=String(r.Action||'')+'|'+String(r.EntityType||'');
      eventCounts[key]=(eventCounts[key]||0)+1;
    });
    var expectedEvents={
      'ASSIGNMENT_CREATED|Assignment':4,
      'ASSIGNMENT_UPDATED|Assignment':2,
      'ASSIGNMENT_OPENED|Assignment':2,
      'ASSIGNMENT_CLOSED|Assignment':2,
      'GROUP_CREATED|Group':3,
      'GROUP_MEMBER_JOINED|Group':4,
      'GROUP_REPRESENTATIVE_SELECTED|Group':1,
      'GROUP_MEMBER_LEFT|Group':1
    };
    var eventKeys=Object.keys(expectedEvents);
    var eventsOk=newAuditIds.length===19 && newAuditRows.length===19 && duplicates.length===0 &&
      eventKeys.every(function(k){return (eventCounts[k]||0)===expectedEvents[k];}) &&
      Object.keys(eventCounts).every(function(k){return Object.prototype.hasOwnProperty.call(expectedEvents,k);});
    var auditEntityOk=newAuditRows.every(function(r){
      return String(r.EntityType)==='Assignment'
        ? assignmentIds.indexOf(String(r.EntityID))>=0
        : String(r.EntityType)==='Group' && expectedGroupIds.indexOf(String(r.EntityID))>=0;
    });
    var newGroupEvents=newAuditRows.filter(function(r){return String(r.EntityType)==='Group';});
    // The three original GROUP_MEMBER_JOINED events were generated by different
    // students in GRP-04A/B (not by the GRP-12 rejoining student). Therefore,
    // do not require every join event to have the same ActorUserID.
    var representativeEvents=newGroupEvents.filter(function(r){return String(r.Action)==='GROUP_REPRESENTATIVE_SELECTED';});
    var leaveEvents=newGroupEvents.filter(function(r){return String(r.Action)==='GROUP_MEMBER_LEFT';});
    var joinEvents=newGroupEvents.filter(function(r){return String(r.Action)==='GROUP_MEMBER_JOINED';});
    var requestIdsOk=newGroupEvents.every(function(r){return Boolean(String(r.RequestID||''));});
    var actorSetOk=representativeEvents.length===1 &&
      String(representativeEvents[0].ActorUserID)===users[0] &&
      leaveEvents.length===1 && String(leaveEvents[0].ActorUserID)===users[0] &&
      joinEvents.length===4 &&
      joinEvents.filter(function(r){return String(r.ActorUserID)===users[0];}).length===1 &&
      requestIdsOk;
    check('AUDIT-DELTA-01',eventsOk&&auditEntityOk&&actorSetOk,
      eventsOk&&auditEntityOk&&actorSetOk?
      'Exactly 19 post-baseline AuditLogs reconcile; original joins retain their distinct actors, the GRP-12 rejoin is attributed to the expected student, and all Group events have RequestIDs.':
      'Post-baseline AuditLog IDs, event counts, entity IDs, expected continuation actors or RequestIDs require review.');

    out.counts={
      continuationCases:c.cases.length,
      assignments:assignmentIds.length,
      groups:groupIds.length,
      groupMembersCurrent:actualIds.GroupMembers.length,
      syntheticGroupMemberDelta:memberDelta.length,
      auditLogsCurrent:actualAuditIds.length,
      auditLogDelta:newAuditIds.length,
      syntheticSubmissions:submissionRows.filter(function(r){
        return syntheticAssignmentIds.indexOf(String(r.AssignmentID))>=0 ||
          expectedGroupIds.indexOf(String(r.GroupID))>=0;
      }).length
    };
    out.manifestStatus=a.status;
    out.continuationStatus=c.status;
    out.historicalASG13='FAIL_PRESERVED';
    out.cleanupStatus=a.cleanupStatus||'NOT STARTED';
  } catch(e) {
    out.checks.push({id:'RECONCILIATION-ERROR',status:'BLOCKED',
      detail:String(e&&e.message||e).slice(0,200)});
  }
  return finish();
}
