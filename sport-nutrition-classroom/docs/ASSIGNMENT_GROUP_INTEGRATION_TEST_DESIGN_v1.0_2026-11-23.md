# SPORT NUTRITION CLASSROOM — Assignment & Group Integration Test Design

- Date: 23 November 2026 (Asia/Bangkok)
- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development`
- Baseline: DOCS v1.3; DOC-02 approved rules; SNC-WG-001 v1.0.0
- Existing fixture: `SNC_SyntheticFixtureRunner_TEST.gs` v0.1.0, manifest status `CORE_FIXTURE_CREATED`
- Scope: Source inspection and test design only. No GAS execution, spreadsheet writes, source synchronization, deployment, notification, trigger, LINE, Drive, or cleanup operation is authorized/performed by this design.

## 1. Decision

Proceed with a controlled **handler-level integration** batch for Assignment Management and Group Management using the existing synthetic CourseOffering and six enrolled synthetic students. Do not create a second Course, Semester, CourseOffering, or student set.

The batch should create only the approved downstream synthetic records:
- Assignments: Individual, Group max 3, Group max 2, Group with no configured maximum.
- Groups: Alpha (Students A+B), Beta (Students C+D+E), Solo (Student F only).

This batch does not test submission creation, membership locking, file handling, grading, notifications, deployed API authentication, Browser/LIFF, or concurrency. Those remain separate stages.

## 2. Source inspected

All source files below were fetched from the current `development` branch.

| File | Blob SHA | Relevant findings |
|---|---|---|
| `backend/AssignmentManagement.gs` | `ae56f8931c986dd8bbaafe72af219c9ca3d5044b` | `handleAssignmentManagementAction_` supports list/get/create/update/open/close; creates DRAFT assignments; group min=2; optional max; manual open/close; writes AuditLogs. |
| `backend/GroupManagement.gs` | `9dc280d88bcee8e346d028082cae725fe2d88ee8` | `handleGroupManagementAction_` supports list/create/join/leave/members/selectRepresentative/addMember/removeMember; requires active enrollment; one active group per student per offering; writes Groups, GroupMembers, AuditLogs. |
| `backend/SubmissionManagement.gs` | `ef4b86678e8c1feeea425ba578501846129a229c` | Group submission validates minimum/maximum/representative and sets that group's `MembershipLockedAt` when the first Group Submission is committed. This is out of scope for this batch. |
| `backend/Code.gs` | `7c9928f7ae269287d1537dec6256dce13783d26d` | Dispatcher routes `group.*` and `assignment.*` to their handlers after LINE identity verification. Internal handler invocation is not deployed API/LINE E2E. |
| `backend/NotificationManagement.gs` | `875b60d90f4599ee0f9bdf0f60dcea31e215de7b` | `notifyAssignmentOpened_` iterates offering enrollments and calls `ntSend_`; `ntSend_` can call LINE Push API when token and linked account are configured. |
| `backend/tests/SNC_SyntheticFixtureRunner_TEST.gs` | `7a9f7b6eccde49295b6d73f23a8a592942d26bb2` | Existing manifest stores OfferingID and six StudentIDs/UserIDs/EnrollmentIDs. The core fixture runner does not yet create Assignments or Groups. |
| `docs/SYNTHETIC_TEST_FIXTURE_PLAN_v1.0_2026-11-22.md` | `6bc3674e5acddf9ea866a3f56aa031eacbafcc88` | Explicitly defines four assignment variants and Alpha/Beta/Solo membership composition; cleanup is exact-ID only. |

## 3. Important source findings / risks

### 3.1 Notification side effect on assignment.open

`handleAssignmentManagementAction_('assignment.open', ...)` calls `notifyAssignmentOpened_` when the function exists. The notification function calls `ntSend_` for each active enrollment. `ntSend_` checks for an active LINE account and then reads `LINE_CHANNEL_ACCESS_TOKEN`; if both exist, it performs a real outbound LINE push.

**Test safety requirement:** the handler-level runner must temporarily replace `notifyAssignmentOpened_` with an in-memory no-op/stub before any open action and restore the original function in a `finally` block. Record `notificationStubbed=true` and `externalCallsExpected=0`. If safe replacement/restoration cannot be verified in the GAS runtime, skip OPEN/CLOSE integration cases and mark them BLOCKED; do not rely solely on the token currently being absent.

### 3.2 Assignment update status guard appears missing

The approved workflow requires assignment edits only while Open or reopened; Closed assignments reject edits. The inspected `assignment.update` branch validates the assignment and offering but contains no status check before applying updates. It appears to allow edits in DRAFT and CLOSED states.

**Required test:** after opening and closing a synthetic assignment, attempt an update and expect `CONFLICT` (or the exact approved error contract). Current source is likely to fail this requirement. Do not modify source as part of this test-design work. Record as a source-level requirement gap; any code fix requires a separately reviewed change and regression plan.

### 3.3 Assignment update audit and max-group rule

- Assignment creation writes an Assignment row and `ASSIGNMENT_CREATED` AuditLog.
- Update writes requested fields, updates `UpdatedAt`, and appends `ASSIGNMENT_UPDATED`.
- `MaxGroupMembers` may be changed only on GROUP assignments and only while no Submission exists for that Assignment.
- Manual open/close writes status/timestamps and AuditLog.
- Opening a DRAFT assignment sets OPEN; closing is permitted only from OPEN. Opening an already OPEN assignment and closing a non-OPEN assignment return `CONFLICT`.

### 3.4 Group membership behavior

- A group can be created only by an actively enrolled student; creator is inserted as LEADER.
- A student may have only one active group in the same offering.
- Joining requires active enrollment, active/unlocked group, and no existing active group membership in the offering.
- Leave changes member Status to LEFT and records LeftAt; when a leader leaves a group with other members, one remaining member is promoted to LEADER.
- Only leader or course staff may select representative; selected representative is stored as LEADER and other active members become MEMBER.
- Group membership lock is checked by join/leave/representative/staff add/remove; it is set by Submission Management, not Group Management.
- Group creation itself permits a one-member group. The minimum of two is enforced at Group Submission validation, not at group creation. This is required for the approved Solo negative-boundary fixture.
- Staff add/remove routes require Course Staff authorization. Do not assume the existing SYSTEM_ADMIN actor is a CourseOffering Instructor until `cmCanOffering_` authorization is checked at runtime; use student create/join/leave paths for this batch.

### 3.5 Handler-level evidence boundary

The test runner will call internal handlers with explicit synthetic actor contexts. This bypasses LINE ID-token verification and the public `doPost` dispatcher. Results must be labeled `HANDLER_LEVEL_INTEGRATION`, not deployed API E2E.

## 4. Existing fixture mapping

Read the exact identifiers from the stored manifest at runtime; do not hardcode IDs from an earlier log into the runner.

| Logical actor | Manifest mapping | Purpose |
|---|---|---|
| Student A | `studentIds[0]` / `userIds[0]` | Alpha creator / leader |
| Student B | `studentIds[1]` / `userIds[1]` | Alpha member |
| Student C | `studentIds[2]` / `userIds[2]` | Beta creator / leader |
| Student D | `studentIds[3]` / `userIds[3]` | Beta member |
| Student E | `studentIds[4]` / `userIds[4]` | Beta member |
| Student F | `studentIds[5]` / `userIds[5]` | Solo group; remains outside Alpha/Beta |

The existing CourseOffering ID is `manifest.offeringId`. The existing active SYSTEM_ADMIN actor should be resolved using the fixture runner's existing actor resolver at runtime; do not log its identifier.

## 5. Assignment test cases

All successful creates generate new AssignmentIDs. Capture each ID immediately into an Assignment/Group extension section of the existing manifest. Never identify test records by title alone.

| Test ID | Action | Input / actor | Expected result | Writes |
|---|---|---|---|---|
| ASG-01 | `assignment.create` | SYSTEM_ADMIN; INDIVIDUAL; no group max | DRAFT, Min/Max group fields blank | 1 Assignment + AuditLog |
| ASG-02 | `assignment.create` | SYSTEM_ADMIN; GROUP; max=3 | DRAFT, Min=2, Max=3 | 1 Assignment + AuditLog |
| ASG-03 | `assignment.create` | SYSTEM_ADMIN; GROUP; max=2 | DRAFT, Min=2, Max=2 | 1 Assignment + AuditLog |
| ASG-04 | `assignment.create` | SYSTEM_ADMIN; GROUP; max blank | DRAFT, Min=2, Max blank | 1 Assignment + AuditLog |
| ASG-05 | `assignment.create` invalid | GROUP max=1, fractional max, unknown type; then verify row count unchanged | `VALIDATION_ERROR`; no Assignment row created | 0 Assignment |
| ASG-06 | `assignment.create` invalid | INDIVIDUAL with maxGroupMembers=2 | `VALIDATION_ERROR`; no Assignment row created | 0 Assignment |
| ASG-07 | `assignment.get/list` | SYSTEM_ADMIN and enrolled Student F | Admin can retrieve/list scoped records; student cannot manage assignment (get denied; list should not disclose records) | 0 |
| ASG-08 | `assignment.update` | Update title/description/maxScore/deadline on a fixture assignment before any Submission | Updated values returned and persisted; UpdatedAt changed; AuditLog written | 1+ AuditLog |
| ASG-09 | `assignment.update` invalid | Try MaxGroupMembers on Individual assignment | `VALIDATION_ERROR`; no field mutation | 0 |
| ASG-10 | `assignment.update` invalid | Try changing Group max after a Submission exists | `CONFLICT`; no mutation. **Defer to Submission stage** because this batch creates no Submissions | 0 |
| ASG-11 | `assignment.open` then `assignment.close` | Stub notification function; open DRAFT then close OPEN | OPEN then CLOSED; timestamps/status/audit consistent | Assignment updates + AuditLogs |
| ASG-12 | Duplicate transitions | Open already OPEN; close already CLOSED | `CONFLICT`; state unchanged | 0 |
| ASG-13 | Closed edit guard | Attempt update on CLOSED assignment | Expected `CONFLICT` under approved policy. Current source appears to permit it; expected source gap/FAIL if execution confirms. | 0 expected |

## 6. Group test cases

Use the student actor contexts from the manifest. Create group records only through `handleGroupManagementAction_`; do not write directly to Groups or GroupMembers.

| Test ID | Action | Actor / composition | Expected result | Writes |
|---|---|---|---|---|
| GRP-01 | `group.create` | A creates Alpha | 1 active group; A is LEADER | 1 Group + 1 GroupMember + AuditLog |
| GRP-02 | `group.join` | B joins Alpha | Alpha has A+B; B is MEMBER | 1 GroupMember + AuditLog |
| GRP-03 | `group.create` | C creates Beta | 1 active group; C is LEADER | 1 Group + 1 GroupMember + AuditLog |
| GRP-04 | `group.join` | D then E join Beta | Beta has C+D+E | 2 GroupMembers + AuditLogs |
| GRP-05 | `group.create` | F creates Solo | One-member active group is allowed at group stage | 1 Group + 1 GroupMember + AuditLog |
| GRP-06 | One-group-per-offering | A attempts to join Beta; F attempts to join Alpha | `CONFLICT`; no extra GroupMember row | 0 |
| GRP-07 | Enrollment gate | Non-enrolled synthetic/unknown user attempts create/join | `ENROLLMENT_REQUIRED` or `NOT_FOUND` per exact code path; no row created | 0 |
| GRP-08 | Membership visibility | A lists Alpha; F lists offering groups; Admin attempts group list | Member sees own group; enrolled non-member sees no other students' group; staff access only if authorized | 0 |
| GRP-09 | Representative selection | A selects B as representative | B becomes LEADER; A becomes MEMBER; AuditLog written | GroupMembers updates + AuditLog |
| GRP-10 | Representative authorization | B (new leader) selects A; ordinary member tries selection; non-member tries selection | Leader action succeeds; unauthorized action denied | Updates only for authorized action |
| GRP-11 | Leave and leader succession | A leaves Alpha after B is leader | A becomes LEFT; B remains/promoted LEADER; LeftAt populated | GroupMembers update + AuditLog |
| GRP-12 | Join after leave | A rejoins Alpha after leaving | A returns as active member; no duplicate active membership | 1 GroupMember + AuditLog |
| GRP-13 | Group membership lock | Attempt join/leave/representative change on a locked group | `GROUP_MEMBERSHIP_LOCKED` | **DEFERRED** to Submission Integration; lock must be set through real synthetic Group Submission, not direct sheet write |
| GRP-14 | Cross-offering isolation | Use an ID from an existing baseline offering only if a safe non-mutating authorization probe can be made | Cross-offering group access denied; no existing records changed | 0 |

## 7. Execution sequence and safety gates

### Batch A — read-only preflight
1. Verify TEST environment and exact TEST spreadsheet identity using existing runner guard.
2. Read stored manifest; require `CORE_FIXTURE_CREATED`.
3. Confirm every manifest Course/Semester/Offering/User/Enrollment ID still exists and is not duplicated.
4. Confirm exact expected Group/GroupMembers/Assignments fixture IDs are not already present; no prior extension manifest exists.
5. Verify required tables and exact headers: Assignments, Groups, GroupMembers, AuditLogs.
6. Verify no real LINE push path can be reached: install and verify temporary notification stub for open tests; do not read/log token values.
7. Snapshot pre-batch primary IDs for Assignments, Groups, GroupMembers and AuditLogs; preserve baseline rows.

Any failed preflight check stops the batch with zero writes.

### Batch B — Assignment records and lifecycle
1. Resolve existing SYSTEM_ADMIN actor privately.
2. Create ASG-01 through ASG-04 through Assignment handler.
3. Immediately capture generated AssignmentIDs in the extension manifest after each successful action.
4. Run invalid-input tests and verify no unintended Assignment row was created.
5. Run scoped list/get and permitted update tests.
6. For ASG-11/12, temporarily stub `notifyAssignmentOpened_`, run open/close transitions, then restore original function in `finally`.
7. Run closed-edit guard test and record actual source behavior without modifying it.
8. Verify each generated Assignment row and exact AuditLog evidence.

### Batch C — Group records and membership
1. Create Alpha with A, join B.
2. Create Beta with C, join D and E.
3. Create Solo with F.
4. Immediately capture GroupID and each generated GroupMemberID after every successful write.
5. Run one-group-per-offering negative tests; verify no additional member/group rows.
6. Run visibility and representative/leave/rejoin tests.
7. Verify all active memberships, roles, LeftAt and audit events against expected composition.
8. Do not simulate membership lock by editing `MembershipLockedAt`; defer to the Submission stage.

### Batch D — post-test reconciliation
1. Read extension manifest and verify every created ID points to exactly one row.
2. Compare post-test IDs against pre-batch snapshots; all new Assignment/Group/GroupMember IDs must be in the extension manifest.
3. Confirm no existing baseline IDs or rows were modified.
4. Confirm no LINE/Drive/trigger/external calls occurred.
5. Record each case status using PASS/FAIL/BLOCKED/NOT RUN/DEFERRED/REVIEW REQUIRED.
6. Cleanup remains NOT STARTED. Cleanup requires its own separate execution gate and exact-ID plan.

## 8. Fixture manifest extension requirements

Extend the existing Script Properties manifest; do not replace or erase the core manifest.

Recommended additive object:
```javascript
manifest.assignmentGroup = {
  sourceCommit: "<runner source commit>",
  startedAt: "<ISO timestamp>",
  status: "IN_PROGRESS | COMPLETE | STOPPED_REQUIRES_RECONCILIATION",
  preBatchIds: {
    Assignments: [],
    Groups: [],
    GroupMembers: [],
    AuditLogs: []
  },
  assignments: {
    individual: "<generated AssignmentID>",
    groupMax3: "<generated AssignmentID>",
    groupMax2: "<generated AssignmentID>",
    groupNoMax: "<generated AssignmentID>"
  },
  groups: {
    alpha: { groupId: "<generated>", memberIds: ["<generated>", "<generated>"] },
    beta: { groupId: "<generated>", memberIds: ["<generated>", "<generated>", "<generated>"] },
    solo: { groupId: "<generated>", memberIds: ["<generated>"] }
  },
  cases: [],
  cleanupStatus: "NOT STARTED"
};
```

The runner must save the manifest after each successful write. If any action throws or a partial write is suspected, stop all dependent cases, capture exact post-minus-pre IDs, set `STOPPED_REQUIRES_RECONCILIATION`, and never auto-delete or rerun the batch.

## 9. Risks / known gaps

1. **Assignment update status guard:** current source appears inconsistent with the approved Closed assignment edit restriction. ASG-13 is a deliberate detector; code fix is a separate change.
2. **Notification side effect:** open action must be stubbed and restoration verified.
3. **Group lock not in this batch:** Group lock only occurs during Group Submission creation.
4. **Course staff role coverage:** core fixture manifest contains six students and an existing SYSTEM_ADMIN actor; it does not create a synthetic Instructor/CourseInstructor. Staff-scoped actions are not assumed covered by this batch.
5. **API E2E:** direct internal handler calls do not validate LINE ID token, dispatcher, or deployed URL.
6. **Concurrency:** sequential tests do not prove concurrent one-group-per-offering enforcement.
7. **AuditLogs:** retain as evidence; do not delete during this stage.
8. **No cleanup:** the existing core fixture and all new extension records remain in TEST until a separately authorized exact-ID cleanup or explicit retention decision.

## 10. Approval boundary

This document is a test design only. It does not authorize or perform:
- copying or deploying new code to GAS;
- creating Assignment, Group, or GroupMember records;
- running notification or submission handlers;
- changing schema, installing triggers, or using LINE/Drive;
- cleanup or deletion.

Next implementation artifact, after design review: a separate TEST-only handler-level runner with read-only preflight, per-write manifest capture, notification stubbing, stop-on-error, and post-run reconciliation. No test write should begin until the runner source is reviewed and the owner explicitly authorizes execution of this Assignment/Group batch.
