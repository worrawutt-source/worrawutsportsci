/**
 * SPORT NUTRITION CLASSROOM — Group Continuation Runner (TEST)
 * Version 0.1.0 | GRP-07 through GRP-12 only
 *
 * Reuses the existing core and Assignment/Group fixture manifests.
 * Never reruns the original Assignment/Group runner or creates fixtures.
 * All application mutations go through handleGroupManagementAction_().
 * No Submissions, notifications, LINE, Drive, triggers, cleanup or deployment.
 *
 * IMPORTANT: Run the read-only preflight first. Persistent execution requires
 * the exact confirmation phrase below and a separate owner approval.
 */
var SNC_GC_CONFIG_TEST = Object.freeze({
  VERSION: '0.1.0',
  MANIFEST_PROPERTY: 'SNC_SYNTHETIC_FIXTURE_MANIFEST_TEST',
  CONFIRMATION: 'CONTINUE SNC GROUP TESTS GRP-07 TO GRP-12 2026-11-23',
  REQUIRED_ORIGINAL_CASES: [
    'GRP-01','GRP-02','GRP-03','GRP-04A','GRP-04B','GRP-05','GRP-06A','GRP-06B'
  ],
  CONTINUATION_CASES: [
    'GRP-07','GRP-08A','GRP-08B','GRP-08C','GRP-09','GRP-10A','GRP-10B','GRP-11','GRP-12'
  ]
});

/** Read-only preflight; safe to run repeatedly. */
function SNC_GroupContinuationPreflight_TEST() {
  var out = {
    runner: 'SNC_GroupContinuation_GR07_12_TEST',
    version: SNC_GC_CONFIG_TEST.VERSION,
    evidenceLevel: 'READ_ONLY_TEST_DATA_INSPECTION',
    mode: 'READ_ONLY',
    writesExpected: 0,
    externalCallsExpected: 0,
    status: 'BLOCKED',
    checks: []
  };
  function check(id, ok, detail) {
    out.checks.push({id:id, status:ok?'PASS':'BLOCKED', detail:detail});
  }
  try {
    var env = sncAGR_env_TEST_();
    check('ENV-01', env.ok, env.ok ? 'Exact TEST spreadsheet identity verified.' : env.reason);
    if (!env.ok) return sncGC_finish_(out);

    var core = SNC_GetSyntheticFixtureManifest_TEST();
    var ext = SNC_GetAssignmentGroupManifest_TEST();
    var a = ext && ext.success ? ext.assignmentGroup : null;
    var valid = core && core.success !== false &&
      core.status === 'CORE_FIXTURE_CREATED' &&
      Array.isArray(core.userIds) && core.userIds.length === 6 &&
      core.offeringId && ext && ext.success && a &&
      a.status === 'IN_PROGRESS' && a.preBatchIds && a.assignments &&
      a.groups && Array.isArray(a.cases);
    check('MANIFEST-01', Boolean(valid), valid ?
      'Existing core and Assignment/Group manifests are present.' :
      'Existing fixture manifests are missing or not in the required state.');
    if (!valid) return sncGC_finish_(out);

    var original = a.cases;
    var originalsOk = SNC_GC_CONFIG_TEST.REQUIRED_ORIGINAL_CASES.every(function(id) {
      var rows = original.filter(function(c){return String(c.id)===id;});
      return rows.length===1 && rows[0].status==='PASS';
    });
    var asg13 = original.filter(function(c){return String(c.id)==='ASG-13';});
    originalsOk = originalsOk && asg13.length===1 &&
      asg13[0].status==='FAIL' && asg13[0].expected==='CONFLICT' &&
      asg13[0].actual==='SUCCESS';
    check('ORIGINAL-LEDGER-01', originalsOk,
      originalsOk ? 'Original GRP-01..GRP-06B PASS and historical ASG-13 FAIL are preserved.' :
      'Original case ledger differs from the approved checkpoint.');
    var prior = a.continuation && Array.isArray(a.continuation.cases) ?
      a.continuation.cases : [];
    var priorIds = prior.map(function(c){return String(c.id);});
    check('CONTINUATION-LEDGER-01',
      priorIds.every(function(id){return SNC_GC_CONFIG_TEST.CONTINUATION_CASES.indexOf(id)>=0;}) &&
      priorIds.filter(function(id,i){return priorIds.indexOf(id)===i;}).length===priorIds.length,
      'Continuation ledger contains only unique in-scope case IDs.');

    var users = core.userIds.map(String), groups = a.groups;
    var groupKeys = Object.keys(groups || {});
    var idsOk = users.length===6 && groupKeys.length===3 &&
      ['alpha','beta','solo'].every(function(k){return Boolean(groups[k]&&groups[k].groupId);});
    check('FIXTURE-IDS-01', idsOk, idsOk ?
      'Existing six users and three named Group fixtures are available.' :
      'Required fixture identifiers are missing or malformed.');
    if (!idsOk) return sncGC_finish_(out);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var groupRows = sncAGR_rows_TEST_(ss,'Groups');
    var memberRows = sncAGR_rows_TEST_(ss,'GroupMembers');
    var subRows = sncAGR_rows_TEST_(ss,'Submissions');
    var auditRows = sncAGR_rows_TEST_(ss,'AuditLogs');
    var groupIds = ['alpha','beta','solo'].map(function(k){return String(groups[k].groupId);});
    var expected = {};
    expected[groupIds[0]] = [{u:users[0],r:'LEADER'},{u:users[1],r:'MEMBER'}];
    expected[groupIds[1]] = [{u:users[2],r:'LEADER'},{u:users[3],r:'MEMBER'},{u:users[4],r:'MEMBER'}];
    expected[groupIds[2]] = [{u:users[5],r:'LEADER'}];
    var compositionOk = groupIds.every(function(gid) {
      var gr = groupRows.filter(function(g){return String(g.GroupID)===gid;});
      if (gr.length!==1 || String(gr[0].Status).toUpperCase()!=='ACTIVE' ||
          String(gr[0].OfferingID)!==String(core.offeringId) || gr[0].MembershipLockedAt) return false;
      var rows = memberRows.filter(function(m){return String(m.GroupID)===gid;});
      var pairs = rows.map(function(m){return String(m.UserID)+'|'+String(m.MemberRole).toUpperCase()+'|'+String(m.Status).toUpperCase();}).sort();
      var want = expected[gid].map(function(m){return m.u+'|'+m.r+'|ACTIVE';}).sort();
      return pairs.length===want.length && pairs.every(function(v,i){return v===want[i];}) &&
        rows.every(function(m){return !m.LeftAt;});
    });
    check('GROUP-STATE-01', compositionOk,
      compositionOk ? 'Alpha, Beta and Solo membership roles/statuses remain at the verified pre-GRP-07 state.' :
      'Group membership, role, status, offering or lock state is not the required precondition.');

    var baseline = a.preBatchIds || {};
    var actualIds = sncAGR_ids_TEST_(ss);
    function delta(actual, base) {
      return actual.filter(function(id){return (base||[]).map(String).indexOf(String(id))<0;});
    }
    var assignmentExpected = Object.keys(a.assignments).map(function(k){return String(a.assignments[k]);});
    var groupExpected = groupIds.slice();
    var memberExpected = [];
    ['alpha','beta','solo'].forEach(function(k){memberExpected=memberExpected.concat((groups[k].memberIds||[]).map(String));});
    var exactIds = JSON.stringify(delta(actualIds.Assignments,baseline.Assignments).sort())===JSON.stringify(assignmentExpected.slice().sort()) &&
      JSON.stringify(delta(actualIds.Groups,baseline.Groups).sort())===JSON.stringify(groupExpected.slice().sort()) &&
      JSON.stringify(delta(actualIds.GroupMembers,baseline.GroupMembers).sort())===JSON.stringify(memberExpected.slice().sort());
    check('PRIMARY-IDS-01', exactIds,
      exactIds ? 'Assignment, Group and original GroupMember IDs match the existing manifest exactly.' :
      'Unexpected or missing Assignment, Group or GroupMember primary IDs detected.');

    var auditIds = delta(actualIds.AuditLogs,baseline.AuditLogs);
    var captured = a.lastWriteCapture && a.lastWriteCapture.newIds &&
      Array.isArray(a.lastWriteCapture.newIds.AuditLogs) ?
      a.lastWriteCapture.newIds.AuditLogs.map(String) : [];
    var auditOk = captured.length===16 && auditIds.length===16 &&
      captured.every(function(id){return auditIds.indexOf(id)>=0;}) &&
      auditRows.length===actualIds.AuditLogs.length;
    check('AUDIT-BASELINE-01', auditOk,
      auditOk ? 'The exact 16 previously reconciled AuditLog IDs remain the baseline.' :
      'AuditLog baseline differs from the previously reconciled 16 records.');

    var submissionOk = subRows.every(function(s) {
      return assignmentExpected.indexOf(String(s.AssignmentID))<0 &&
        groupExpected.indexOf(String(s.GroupID))<0;
    });
    check('SUBMISSIONS-01', submissionOk,
      submissionOk ? 'No Submission references the synthetic Assignment or Group fixtures.' :
      'A Submission exists for a synthetic fixture; continuation is blocked.');

    var actor = sncAGR_admin_TEST_(ss);
    check('ACTOR-01', Boolean(actor), 'Exactly one existing active SYSTEM_ADMIN actor is available.');
    out.counts = {
      assignments: assignmentExpected.length,
      groups: groupExpected.length,
      originalGroupMembers: memberExpected.length,
      capturedAuditLogs: captured.length,
      syntheticSubmissions: subRows.filter(function(s){
        return assignmentExpected.indexOf(String(s.AssignmentID))>=0 ||
          groupExpected.indexOf(String(s.GroupID))>=0;
      }).length,
      continuationCasesRecorded: prior.length
    };
  } catch (e) {
    out.checks.push({id:'PREFLIGHT-ERROR',status:'BLOCKED',detail:String(e&&e.message||e).slice(0,180)});
  }
  return sncGC_finish_(out);
}

function sncGC_finish_(r) {
  r.status = r.checks.length && r.checks.every(function(c){return c.status==='PASS';}) ? 'READY' : 'BLOCKED';
  r.summary = {
    pass:r.checks.filter(function(c){return c.status==='PASS';}).length,
    blocked:r.checks.filter(function(c){return c.status!=='PASS';}).length
  };
  Logger.log('SNC_GROUP_CONTINUATION_PREFLIGHT='+JSON.stringify(r));
  return r;
}

/** Explicit entry point; persistent execution is separately approval-gated. */
function SNC_RunGroupContinuation_CONFIRMED_TEST() {
  return SNC_RunGroupContinuation_TEST('CONTINUE SNC GROUP TESTS GRP-07 TO GRP-12 2026-11-23');
}

/**
 * Persistent continuation. Do not run until the owner separately approves
 * this exact function/phrase after reviewing the complete source and READY preflight.
 */
function SNC_RunGroupContinuation_TEST(confirmation) {
  if (String(confirmation||'') !== SNC_GC_CONFIG_TEST.CONFIRMATION)
    throw new Error('SAFETY_STOP: exact continuation confirmation phrase required.');
  var lock = LockService.getDocumentLock();
  if (!lock) throw new Error('SAFETY_STOP: document lock unavailable.');
  lock.waitLock(30000);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();
  var m = null, a = null, core = null;
  try {
    var pre = SNC_GroupContinuationPreflight_TEST();
    if (pre.status !== 'READY') throw new Error('SAFETY_STOP: continuation preflight is not READY.');
    core = SNC_GetSyntheticFixtureManifest_TEST();
    var ext = SNC_GetAssignmentGroupManifest_TEST();
    m = JSON.parse(props.getProperty(SNC_GC_CONFIG_TEST.MANIFEST_PROPERTY));
    a = m.assignmentGroup;
    if (!a.continuation) {
      a.continuation = {
        runnerVersion:SNC_GC_CONFIG_TEST.VERSION,
        status:'IN_PROGRESS',
        startedAt:new Date().toISOString(),
        cases:[],
        checkpoint:null
      };
      sncGC_save_(m);
    }
    var c = a.continuation;
    var actors = core.userIds.map(function(uid){
      return {userId:String(uid),roles:[{role:'STUDENT',scopeType:'SELF',scopeId:String(uid)}]};
    });
    var admin = sncAGR_admin_TEST_(ss);
    var alphaId = String(a.groups.alpha.groupId);
    var betaId = String(a.groups.beta.groupId);
    var soloId = String(a.groups.solo.groupId);
    var offeringId = String(core.offeringId);

    function rows(name){return sncAGR_rows_TEST_(ss,name);}
    function groupMembers(gid){return rows('GroupMembers').filter(function(r){return String(r.GroupID)===String(gid);});}
    function activeMembers(gid){return groupMembers(gid).filter(function(r){return String(r.Status).toUpperCase()==='ACTIVE';});}
    function auditRows(){return rows('AuditLogs');}
    function auditMatches(action,entityId,actorId,requestId,detailKey,detailValue) {
      var found = auditRows().filter(function(r){
        var req = String(r.RequestID||'');
        if (String(r.Action)!==action || String(r.EntityType)!=='Group' ||
            String(r.EntityID)!==String(entityId) || String(r.ActorUserID)!==String(actorId) ||
            req!==String(requestId)) return false;
        if (detailKey) {
          var d={}; try{d=JSON.parse(String(r.DetailsJson||'{}'));}catch(e){return false;}
          if (String(d[detailKey])!==String(detailValue)) return false;
        }
        return true;
      });
      return found;
    }
    function stateFor(caseId) {
      var ar = activeMembers(alphaId);
      var aRows = groupMembers(alphaId).filter(function(r){return String(r.UserID)===String(actors[0].userId);});
      var bRows = groupMembers(alphaId).filter(function(r){return String(r.UserID)===String(actors[1].userId);});
      if (caseId==='GRP-09') return aRows.length===1 && bRows.length===1 &&
        String(aRows[0].Status).toUpperCase()==='ACTIVE' && String(aRows[0].MemberRole)==='MEMBER' &&
        String(bRows[0].Status).toUpperCase()==='ACTIVE' && String(bRows[0].MemberRole)==='LEADER';
      if (caseId==='GRP-11') return aRows.length===1 && bRows.length===1 &&
        String(aRows[0].Status).toUpperCase()==='LEFT' && Boolean(aRows[0].LeftAt) &&
        String(bRows[0].Status).toUpperCase()==='ACTIVE' && String(bRows[0].MemberRole)==='LEADER' &&
        ar.length===1;
      if (caseId==='GRP-12') return aRows.length===2 && bRows.length===1 &&
        aRows.filter(function(r){return String(r.Status).toUpperCase()==='LEFT'&&Boolean(r.LeftAt);}).length===1 &&
        aRows.filter(function(r){return String(r.Status).toUpperCase()==='ACTIVE'&&String(r.MemberRole)==='MEMBER'&&!r.LeftAt;}).length===1 &&
        String(bRows[0].Status).toUpperCase()==='ACTIVE' && String(bRows[0].MemberRole)==='LEADER' &&
        ar.length===2;
      return false;
    }
    function preState(caseId) {
      var ar=activeMembers(alphaId);
      var aRows=groupMembers(alphaId).filter(function(r){return String(r.UserID)===String(actors[0].userId);});
      var bRows=groupMembers(alphaId).filter(function(r){return String(r.UserID)===String(actors[1].userId);});
      if(caseId==='GRP-09') return aRows.length===1&&bRows.length===1&&
        String(aRows[0].Status).toUpperCase()==='ACTIVE'&&String(aRows[0].MemberRole)==='LEADER'&&
        String(bRows[0].Status).toUpperCase()==='ACTIVE'&&String(bRows[0].MemberRole)==='MEMBER'&&ar.length===2;
      if(caseId==='GRP-11') return aRows.length===1&&bRows.length===1&&
        String(aRows[0].Status).toUpperCase()==='ACTIVE'&&String(aRows[0].MemberRole)==='MEMBER'&&
        String(bRows[0].Status).toUpperCase()==='ACTIVE'&&String(bRows[0].MemberRole)==='LEADER'&&ar.length===2;
      if(caseId==='GRP-12') return aRows.length===1&&bRows.length===1&&
        String(aRows[0].Status).toUpperCase()==='LEFT'&&Boolean(aRows[0].LeftAt)&&
        String(bRows[0].Status).toUpperCase()==='ACTIVE'&&String(bRows[0].MemberRole)==='LEADER'&&ar.length===1;
      return false;
    }
    function record(id,status,expected,actual,detail) {
      var prior=c.cases.filter(function(x){return String(x.id)===id;});
      if(prior.length) {
        if(prior.length!==1 || prior[0].status!==status) throw new Error('CASE_LEDGER_CONFLICT: '+id);
        return;
      }
      c.cases.push({id:id,status:status,expected:expected,actual:actual,detail:detail,at:new Date().toISOString()});
      sncGC_save_(m);
    }
    function checkpoint(id,requestId,phase) {
      c.checkpoint={caseId:id,requestId:requestId,phase:phase,at:new Date().toISOString()};
      sncGC_save_(m);
    }
    function begin(id,requestId) {
      var prior=c.cases.filter(function(x){return String(x.id)===id;});
      if(prior.length) return false;
      checkpoint(id,requestId,'BEFORE_HANDLER');
      return true;
    }
    function unchangedIds(before,after,names) {
      return names.every(function(n){
        return JSON.stringify(before[n].slice().sort())===JSON.stringify(after[n].slice().sort());
      });
    }
    function currentIds(){return sncAGR_ids_TEST_(ss);}
    function call(action,actor,p,requestId) {
      return handleGroupManagementAction_(action,actor,p,requestId);
    }
    function assertNoAuditDelta(before,after) {
      return JSON.stringify(before.AuditLogs.slice().sort())===JSON.stringify(after.AuditLogs.slice().sort());
    }
    function runNegative(id,expected,action,actor,p) {
      if(c.cases.some(function(x){return x.id===id;})) return;
      var before=currentIds(), requestId=Utilities.getUuid();
      checkpoint(id,requestId,'BEFORE_HANDLER');
      var actual='SUCCESS';
      try { call(action,actor,p,requestId); }
      catch(e) { actual=String(e&&e.apiCode||'UNCLASSIFIED_ERROR'); }
      var after=currentIds();
      if(actual!==expected || !unchangedIds(before,after,['Groups','GroupMembers','AuditLogs']))
        throw new Error('NEGATIVE_CASE_REQUIRES_RECONCILIATION: '+id+' expected='+expected+' actual='+actual);
      record(id,'PASS',expected,actual,'Expected rejection; Group, GroupMember and AuditLog IDs unchanged.');
      checkpoint(id,requestId,'VERIFIED');
    }
    function runRead(id,fn,verify) {
      if(c.cases.some(function(x){return x.id===id;})) return;
      var before=currentIds(), requestId=Utilities.getUuid();
      checkpoint(id,requestId,'BEFORE_READ');
      var value=fn();
      if(!verify(value)) throw new Error('READ_ASSERTION_FAILED: '+id);
      var after=currentIds();
      if(!unchangedIds(before,after,['Groups','GroupMembers','AuditLogs']))
        throw new Error('READ_ONLY_MUTATION_DETECTED: '+id);
      record(id,'PASS','EXPECTED_VISIBILITY','PASS','Read-only result matched expected visibility; no IDs changed.');
      checkpoint(id,requestId,'VERIFIED');
    }

    // GRP-07: expected rejection for an in-memory non-enrolled actor.
    runNegative('GRP-07','ENROLLMENT_REQUIRED','group.create',
      {userId:'SNC_TST_NONENROLLED',roles:[{role:'STUDENT',scopeType:'SELF',scopeId:'SNC_TST_NONENROLLED'}]},
      {offeringId:offeringId,groupName:'SHOULD_NOT_EXIST'});

    // GRP-08A/B/C: visibility is restricted to membership, except SYSTEM_ADMIN.
    runRead('GRP-08A',function(){return call('group.list',actors[0],{offeringId:offeringId},Utilities.getUuid());},
      function(v){return v.length===1&&String(v[0].groupId)===alphaId;});
    runRead('GRP-08B',function(){return call('group.list',actors[5],{offeringId:offeringId},Utilities.getUuid());},
      function(v){return v.length===1&&String(v[0].groupId)===soloId;});
    runRead('GRP-08C',function(){return call('group.list',admin,{offeringId:offeringId},Utilities.getUuid());},
      function(v){var got=v.map(function(x){return String(x.groupId);}).sort();return JSON.stringify(got)===JSON.stringify([alphaId,betaId,soloId].sort());});

    function runMutation(id,action,actor,p,expectedState,expectedAction,entityId,detailKey,detailValue) {
      var existing=c.cases.filter(function(x){return x.id===id;});
      if(existing.length) return;
      var requestId=c.checkpoint&&c.checkpoint.caseId===id&&c.checkpoint.requestId ?
        String(c.checkpoint.requestId) : Utilities.getUuid();
      if(!c.checkpoint||c.checkpoint.caseId!==id) checkpoint(id,requestId,'BEFORE_HANDLER');
      var before=currentIds();
      var matching=auditMatches(expectedAction,entityId,actor.userId,requestId,detailKey,detailValue);
      if(matching.length>1) throw new Error('DUPLICATE_AUDIT_REQUIRES_RECONCILIATION: '+id);
      if(expectedState()) {
        if(matching.length!==1) throw new Error('STATE_WITHOUT_EXACT_AUDIT_REQUIRES_RECONCILIATION: '+id);
        record(id,'RECOVERED_VERIFIED','STATE_AND_AUDIT','MATCH','Recovered completed mutation without replay.');
        checkpoint(id,requestId,'RECOVERED_VERIFIED');
        return;
      }
      if(matching.length!==0) throw new Error('AUDIT_WITHOUT_EXPECTED_STATE_REQUIRES_RECONCILIATION: '+id);
      if(!preState(id)) throw new Error('PRECONDITION_MISMATCH_REQUIRES_RECONCILIATION: '+id);
      checkpoint(id,requestId,'BEFORE_HANDLER');
      call(action,actor,p,requestId);
      checkpoint(id,requestId,'HANDLER_RETURNED');
      var after=currentIds();
      if(!expectedState()) throw new Error('POST_STATE_MISMATCH_REQUIRES_RECONCILIATION: '+id);
      var ev=auditMatches(expectedAction,entityId,actor.userId,requestId,detailKey,detailValue);
      if(ev.length!==1) throw new Error('POST_AUDIT_MISMATCH_REQUIRES_RECONCILIATION: '+id);
      if(id==='GRP-12') {
        var newMember=groupMembers(alphaId).filter(function(r){
          return String(r.UserID)===String(actors[0].userId)&&
            String(r.Status).toUpperCase()==='ACTIVE'&&String(r.MemberRole)==='MEMBER'&&!r.LeftAt;
        });
        if(newMember.length!==1) throw new Error('GRP12_NEW_MEMBER_AMBIGUOUS');
        a.groups.alpha.memberIds.push(String(newMember[0].GroupMemberID));
      }
      var delta=currentIds();
      if(id==='GRP-09' || id==='GRP-11') {
        if(!unchangedIds(before,delta,['Assignments','Groups','GroupMembers']) ||
          delta.GroupMembers.length!==before.GroupMembers.length)
          throw new Error('UNEXPECTED_PRIMARY_ID_DELTA: '+id);
      }
      if(id==='GRP-12') {
        var added=delta.GroupMembers.filter(function(x){return before.GroupMembers.indexOf(x)<0;});
        if(added.length!==1) throw new Error('GRP12_EXPECTED_ONE_NEW_MEMBERSHIP_ID');
      }
      record(id,'PASS','EXPECTED_STATE_AND_ONE_AUDIT','PASS','Mutation state and exact RequestID-linked AuditLog verified.');
      checkpoint(id,requestId,'VERIFIED');
    }

    // Resume safely from state + exact request-linked audit, never blind-retry.
    runMutation('GRP-09','group.selectRepresentative',actors[0],
      {groupId:alphaId,userId:actors[1].userId},
      function(){return stateFor('GRP-09');},
      'GROUP_REPRESENTATIVE_SELECTED',alphaId,'representativeUserId',actors[1].userId);
    runNegative('GRP-10A','FORBIDDEN','group.selectRepresentative',actors[0],
      {groupId:alphaId,userId:actors[0].userId});
    runNegative('GRP-10B','FORBIDDEN','group.selectRepresentative',actors[5],
      {groupId:alphaId,userId:actors[0].userId});
    runMutation('GRP-11','group.leave',actors[0],{groupId:alphaId},
      function(){return stateFor('GRP-11');},
      'GROUP_MEMBER_LEFT',alphaId);
    runMutation('GRP-12','group.join',actors[0],{groupId:alphaId},
      function(){return stateFor('GRP-12');},
      'GROUP_MEMBER_JOINED',alphaId);

    // Terminal reconciliation; historical ASG-13 FAIL is never rewritten.
    var finalIds=currentIds();
    var finalActive=activeMembers(alphaId);
    var finalA=groupMembers(alphaId).filter(function(r){return String(r.UserID)===String(actors[0].userId);});
    var finalB=groupMembers(alphaId).filter(function(r){return String(r.UserID)===String(actors[1].userId);});
    var terminal=finalA.length===2 && finalB.length===1 &&
      finalA.filter(function(r){return String(r.Status).toUpperCase()==='LEFT'&&Boolean(r.LeftAt);}).length===1 &&
      finalA.filter(function(r){return String(r.Status).toUpperCase()==='ACTIVE'&&String(r.MemberRole)==='MEMBER';}).length===1 &&
      String(finalB[0].Status).toUpperCase()==='ACTIVE'&&String(finalB[0].MemberRole)==='LEADER'&&
      finalActive.length===2 &&
      ['beta','solo'].every(function(k){return !groupMembers(String(a.groups[k].groupId)).some(function(r){return String(r.Status).toUpperCase()==='LEFT';});});
    var allCases=SNC_GC_CONFIG_TEST.CONTINUATION_CASES.every(function(id){
      var found=c.cases.filter(function(x){return String(x.id)===id;});
      return found.length===1 && (found[0].status==='PASS'||found[0].status==='RECOVERED_VERIFIED');
    });
    var deltaMembers=finalIds.GroupMembers.filter(function(id){return (a.preBatchIds.GroupMembers||[]).indexOf(id)<0;});
    var expectedMemberIds=[];
    ['alpha','beta','solo'].forEach(function(k){expectedMemberIds=expectedMemberIds.concat(a.groups[k].memberIds||[]);});
    var memberSetOk=deltaMembers.length===expectedMemberIds.length &&
      expectedMemberIds.every(function(id){return deltaMembers.indexOf(String(id))>=0;});
    if(!terminal||!allCases||!memberSetOk) throw new Error('TERMINAL_RECONCILIATION_FAILED');
    c.status='COMPLETE_WITH_HISTORICAL_FAILURE';
    c.completedAt=new Date().toISOString();
    c.terminalReconciliation={alphaMembershipState:'PASS',continuationCases:'PASS',newGroupMemberCount:1};
    sncGC_save_(m);
    var summary={
      status:c.status,
      evidenceLevel:'HANDLER_LEVEL_INTEGRATION',
      continuationCaseCount:c.cases.length,
      pass:c.cases.filter(function(x){return x.status==='PASS';}).length,
      recovered:c.cases.filter(function(x){return x.status==='RECOVERED_VERIFIED';}).length,
      fail:c.cases.filter(function(x){return x.status==='FAIL';}).length,
      historicalASG13:'FAIL_PRESERVED',
      terminalReconciliation:'PASS',
      cleanupStatus:a.cleanupStatus||'NOT STARTED'
    };
    Logger.log('SNC_GROUP_CONTINUATION_RESULT='+JSON.stringify(summary));
    return {summary:summary};
  } catch (e) {
    try {
      var raw=props.getProperty(SNC_GC_CONFIG_TEST.MANIFEST_PROPERTY);
      if(raw) {
        m=JSON.parse(raw);a=m.assignmentGroup;
        if(a&&a.continuation) {
          a.continuation.status='STOPPED_REQUIRES_RECONCILIATION';
          a.continuation.stoppedAt=new Date().toISOString();
          a.continuation.stopReason=String(e&&e.message||e).slice(0,220);
          sncGC_save_(m);
        }
      }
    } catch (persistError) {
      console.error('GROUP_CONTINUATION_STOP_MARKER_NOT_CONFIRMED');
    }
    Logger.log('SNC_GROUP_CONTINUATION_STOPPED='+JSON.stringify({
      status:'STOPPED_REQUIRES_RECONCILIATION',
      reason:String(e&&e.message||e).slice(0,220)
    }));
    throw e;
  } finally {
    lock.releaseLock();
  }
}

function sncGC_save_(manifest) {
  PropertiesService.getScriptProperties().setProperty(
    SNC_GC_CONFIG_TEST.MANIFEST_PROPERTY, JSON.stringify(manifest)
  );
}
