# SPORT NUTRITION CLASSROOM — Group Integration Continuation Design

- Date: 23 November 2026 (Asia/Bangkok)
- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development`
- Baseline: DOCS v1.3; DOC-02 approved rules; SNC-WG-001 v1.0.0
- Existing test: `SNC_AssignmentGroupIntegrationRunner_TEST.gs` v0.1.0
- Scope: design only. No GAS code, Spreadsheet writes, Script Properties writes, execution, deployment, LINE, Drive, trigger, or cleanup is authorized/performed by this document.

## 1. Decision

Do not rerun the original persistent Assignment/Group Runner. Continue only the unexecuted Group cases GRP-07 through GRP-12 using a new, separately reviewed continuation runner after a read-only state gate and explicit owner approval.

The existing Assignment and Group fixtures are already present. The continuation must reuse the exact GroupIDs, UserIDs, and OfferingID stored in the current synthetic fixture manifest. It must not create another Course, Semester, CourseOffering, User, Enrollment, Assignment, or Group.

GRP-13 (membership lock) remains deferred to Submission Integration because the lock is created by a real Group Submission. GRP-14 (cross-offering isolation) is not implemented in the current runner and remains out of scope until separately designed.

## 2. Evidence currently established

### Owner-provided runtime evidence
- Assignment/Group original batch: 27 PASS, 1 FAIL; Manifest remains `IN_PROGRESS`; recorded cases stop at GRP-06B.
- ASG-13 focused CLOSED Assignment edit regression: PASS; expected/actual `CONFLICT`; Assignment row and AuditLog primary-key set unchanged for that invocation.
- Exact AuditLog reconciliation at the GRP-05 capture: PASS; expected/found IDs 16/16; no missing or duplicate IDs, unexpected events, or wrong entity IDs.
- Event counts reconciled:
  - `ASSIGNMENT_CREATED|Assignment`: 4
  - `ASSIGNMENT_UPDATED|Assignment`: 2
  - `ASSIGNMENT_OPENED|Assignment`: 2
  - `ASSIGNMENT_CLOSED|Assignment`: 2
  - `GROUP_CREATED|Group`: 3
  - `GROUP_MEMBER_JOINED|Group`: 3

### Current source inspected
- `backend/tests/SNC_AssignmentGroupIntegrationRunner_TEST.gs` — blob SHA `56b8fd81d6392e6c43138e4f9ce2769fccdb28cf`.
- `backend/GroupManagement.gs` — fetched from `development` during this design review.
- The original runner executes GRP-07 through GRP-12 after GRP-06B. Its GRP-07 expects `ENROLLMENT_REQUIRED`; GRP-08 checks group-list visibility; GRP-09 selects Student B as Alpha representative; GRP-10A/B expect `FORBIDDEN`; GRP-11 has Student A leave Alpha; GRP-12 has A rejoin Alpha.
- Source behavior confirmed:
  - `group.selectRepresentative` updates active group member roles and appends `GROUP_REPRESENTATIVE_SELECTED`.
  - `group.leave` sets the member row to `LEFT`, sets `LeftAt`, promotes a remaining member to `LEADER` if the departing member was leader, and appends `GROUP_MEMBER_LEFT`.
  - `group.join` appends a new active GroupMember row and `GROUP_MEMBER_JOINED`.
- The interruption reason for the original execution remains **NOT DETERMINED**. The exact Apps Script execution termination record was not supplied.

## 3. Continuation scope

| Case | Operation | Actor | Expected result | Expected mutation |
|---|---|---|---|---|
| GRP-07 | `group.create` with a non-enrolled synthetic actor | Non-enrolled synthetic actor | `ENROLLMENT_REQUIRED` | None |
| GRP-08A | `group.list` | Student A | Only Alpha is visible | None |
| GRP-08B | `group.list` | Student F | Only Solo is visible | None |
| GRP-08C | `group.list` | Existing SYSTEM_ADMIN | Alpha, Beta, Solo visible | None |
| GRP-09 | `group.selectRepresentative` | Student A selects B in Alpha | B becomes LEADER; A becomes MEMBER | GroupMembers role updates + one `GROUP_REPRESENTATIVE_SELECTED` AuditLog |
| GRP-10A | `group.selectRepresentative` | Student A, now ordinary member | `FORBIDDEN` | None |
| GRP-10B | `group.selectRepresentative` | Student F, not an Alpha member | `FORBIDDEN` | None |
| GRP-11 | `group.leave` | Student A leaves Alpha | A becomes LEFT with LeftAt; B remains active LEADER | GroupMembers update + one `GROUP_MEMBER_LEFT` AuditLog |
| GRP-12 | `group.join` | Student A rejoins Alpha | A has one new active membership as MEMBER; prior membership remains LEFT | One new GroupMember row + one `GROUP_MEMBER_JOINED` AuditLog |

Expected final Alpha state: A and B are active members; B is LEADER; A is MEMBER. The earlier A membership row remains `LEFT`; the rejoin must create a new GroupMemberID. Beta remains C/D/E active; Solo remains F active. No group should be locked.

## 4. Mandatory read-only state gate before any continuation

A new read-only diagnostic must run before continuation code is implemented or any mutation is attempted. It must return only redacted counts/statuses and case identifiers; do not log full UserIDs, GroupIDs, AssignmentIDs, or raw manifest.

The gate must verify all of the following:

1. Environment is exactly TEST and the active Spreadsheet ID equals the approved TEST Spreadsheet ID.
2. Core manifest is present and valid; the Assignment/Group extension exists and remains `IN_PROGRESS`.
3. Existing recorded case ledger is intact: ASG-13 is recorded as the original expected failure, GRP-01 through GRP-06B are PASS, and no GRP-07 through GRP-12 result is already recorded.
4. All four Assignment IDs and all three Group IDs in the manifest resolve to exactly one row each; no unexpected new Assignment or Group primary IDs exist relative to the pre-batch snapshot.
5. All six original GroupMember IDs in Alpha/Beta/Solo resolve exactly once. No unexpected GroupMember IDs exist at the current checkpoint.
6. Alpha contains exactly A and B as active members; Beta exactly C, D, E; Solo exactly F. The pre-continuation expected roles are Alpha A=LEADER, B=MEMBER; Beta C=LEADER, D/E=MEMBER; Solo F=LEADER. All Group rows are ACTIVE and `MembershipLockedAt` is empty.
7. AuditLogs added since the pre-batch snapshot match the already reconciled 16 captured IDs; no additional/untracked AuditLog IDs or duplicate primary keys exist.
8. No Submission exists for the synthetic Assignment/Group fixtures that could have locked membership or otherwise changed the state.
9. No prior continuation marker or continuation-generated event is present.

Any mismatch, ambiguous state, extra row, duplicate ID, unexpected AuditLog, locked group, or submission causes a hard BLOCK. The diagnostic must not attempt repair, rollback, cleanup, or state normalization.

The existing `SNC_ReconcileAssignmentGroup_READONLY_TEST()` is insufficient by itself for this gate: it compares primary-key counts but does not validate membership roles, statuses, lock state, submissions, or case-level audit evidence.

## 5. Safe continuation runner design

Proposed new file (not yet created):
`backend/tests/SNC_GroupContinuation_GR07_12_TEST.gs`

Required properties:

- TEST-only environment and exact Spreadsheet identity guard.
- Read-only preflight entry point separate from the persistent continuation entry point.
- Require exact explicit confirmation phrase distinct from the original runner.
- Acquire DocumentLock; handler-level functions retain their own ScriptLock.
- Load the existing core + Assignment/Group manifest. Never initialize a new manifest or overwrite the existing extension.
- Resolve actors and GroupIDs from the manifest at runtime; never hardcode identifiers from logs.
- Never call the original runner, Assignment handlers, group.create, or any fixture creation routine.
- Never directly write application sheets. All Group mutations must use `handleGroupManagementAction_`.
- Append case records and continuation metadata to the existing manifest; preserve all previous case records and IDs.
- Persist a continuation checkpoint before and after every mutating handler call.
- Stop immediately on the first unexpected outcome, assertion failure, or persistence error. Record `STOPPED_REQUIRES_RECONCILIATION` only if the state can be safely saved; otherwise do not pretend the stop marker was persisted.
- No automatic retries of mutating handlers.
- No notifications, LINE, Drive, triggers, file uploads, Submissions, cleanup, or deployment.

### Resume / duplicate-action protection

Before each mutating case, inspect the relevant rows and AuditLogs:

- If both the exact expected final state and exactly one matching AuditLog event (including actor, action, entity, and details) already exist, record the case as `RECOVERED_VERIFIED` without calling the handler again.
- If the pre-action state exists and no matching event exists, the action may be attempted once.
- If state changed but the matching AuditLog is missing, or an event exists while state is unchanged, stop as `REQUIRES_RECONCILIATION`; do not retry.
- If more than one matching event exists, stop as duplicate-event reconciliation.
- Negative and read-only cases may be re-evaluated only after confirming no relevant mutation occurred.

This is essential because the Group handlers are not documented as idempotent for repeated leave/join/representative operations.

## 6. Per-case state transitions and audit checks

### GRP-07
- Use a reserved synthetic non-enrolled actor identifier only as an in-memory actor; do not create a User row.
- Verify `ENROLLMENT_REQUIRED`.
- Verify Groups, GroupMembers, and AuditLogs primary-key sets remain unchanged.

### GRP-08A/B/C
- Read-only list checks using manifest actors.
- A sees only Alpha; F sees only Solo; existing SYSTEM_ADMIN sees all three groups.
- No writes or AuditLog events expected.

### GRP-09
- Preconditions: Alpha A=LEADER and B=MEMBER; both active; group unlocked.
- Invoke A selecting B.
- Verify A=MEMBER and B=LEADER; exactly one `GROUP_REPRESENTATIVE_SELECTED` event for Alpha by A with representativeUserId=B.
- Capture no new Group or GroupMember IDs; AuditLog delta exactly one.

### GRP-10A/B
- Preconditions after GRP-09: A=MEMBER, B=LEADER; F not a member of Alpha.
- Both attempts must return `FORBIDDEN`.
- Verify GroupMembers rows and AuditLog IDs unchanged by each rejected call.

### GRP-11
- Preconditions: Alpha A=MEMBER and B=LEADER; both active; group unlocked.
- Invoke A leave.
- Verify A's active membership becomes LEFT with non-empty LeftAt; B remains active LEADER.
- Verify exactly one `GROUP_MEMBER_LEFT` event for Alpha by A.
- No new Group or GroupMember primary ID is expected.

### GRP-12
- Preconditions: A has no active membership in the offering; A's prior Alpha membership is LEFT; B is active LEADER; group unlocked.
- Invoke A join Alpha.
- Verify exactly one new active GroupMember row for A in Alpha, role MEMBER; prior row remains LEFT.
- Verify exactly one `GROUP_MEMBER_JOINED` event for Alpha by A.
- Capture the new GroupMemberID in the existing manifest immediately after handler success.

## 7. Terminal reconciliation

At the end of GRP-12, the continuation must verify:

- No new Assignments or Groups were created.
- Exactly one additional GroupMember ID was created by GRP-12.
- The new GroupMemberID is stored in the existing manifest.
- No baseline IDs or rows changed outside the expected GroupMembers role/status/LeftAt fields.
- Exactly three expected Group audit events were added by successful mutations: representative selected, member left, member joined.
- No extra events or untracked primary IDs exist.
- Alpha/Beta/Solo memberships and roles match the expected final state.
- The continuation ledger records each case as PASS or RECOVERED_VERIFIED.
- The original manifest is marked complete only if all prior and continuation cases are reconciled and the original ASG-13 requirement failure is explicitly retained as a known historical failure with the separate focused regression PASS attached. Do not erase or rewrite the original ASG-13 record.

The overall Assignment & Group stage must not be reported as clean PASS while the original ASG-13 case record remains FAIL. Report the original batch as completed with a historical failure plus a separately passing corrective regression, unless the owner approves a transparent superseding case record that preserves the original evidence.

## 8. Approval gates and next action

This document is design-only and does not authorize implementation or execution.

Proposed next sequence:
1. Owner runs a new read-only continuation state diagnostic after its code is separately reviewed and copied to TEST GAS.
2. If READY, owner reviews and approves the proposed continuation runner and exact confirmation phrase.
3. Implement the continuation runner on `development` only.
4. Re-fetch and review the complete runner source before owner copies it to TEST GAS.
5. Owner runs the read-only preflight; only after READY and explicit execution approval may the continuation be run.
6. Reconcile exact IDs, row states, and AuditLogs; update the handoff.

No cleanup is included. Cleanup remains a separate exact-ID authorization and operation.
