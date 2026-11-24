

## Assignment & Group Integration — latest owner evidence and continuation checkpoint — 23 Nov 2026

### Source synchronization
- The owner explicitly confirmed: the current `SNC_AssignmentGroupIntegrationRunner_TEST.gs` in Apps Script (GAS) and GitHub `development` have been corrected and are now aligned.
- This is **OWNER-CONFIRMED synchronization**. It has not been independently re-fetched and hash-compared in this checkpoint.
- Do not revisit `SNC_DataBaseline_TEST.gs` for this issue. The previously supplied file named `SNC_DataBaseline_TEST.txt` was actually Runner content; the owner clarified that it was the wrong file and asked not to inspect DataBaseline.

### Owner-run Assignment & Group test outcome
- Assignment & Group preflight had previously returned **READY, 9/9 PASS**.
- The persistent Assignment & Group runner was executed by the owner in GAS.
- Stored manifest summary: `status=IN_PROGRESS`, `caseCount=28`, `pass=27`, `fail=1`, `notRun=0`; `stopReason=null`.
- The 27 passing records include Assignment cases through ASG-12C, notification-stub verification, and Group cases through GRP-06B.
- **ASG-13 FAIL:** expected `CONFLICT` when editing a Closed Assignment, but actual result was `SUCCESS`. This confirms the previously identified DOC-02 requirement gap: Closed Assignments must reject edits, but the current handler permits the update.
- The recorded cases end at GRP-06B. GRP-07 onward have no recorded results. Do not infer the precise cause of the interruption from the available evidence.
- The manifest did not transition to `STOPPED_REQUIRES_RECONCILIATION` and did not record post-failure IDs. The catch/status persistence path therefore needs read-only diagnosis; do not assume the catch block ran successfully.

### Read-only reconciliation evidence supplied by owner
- Assignments: actual 4, manifest 4, all manifest IDs exist, unexpected count 0.
- Groups: actual 3, manifest 3, all manifest IDs exist, unexpected count 0.
- GroupMembers: actual 6, manifest 6, all manifest IDs exist, unexpected count 0.
- AuditLogs: 16 rows associated with the batch.
- Last captured write: GRP-05; captured delta was Groups=3, GroupMembers=6, AuditLogs=16.
- No post-failure ID list or post-batch reconciliation record was present.
- This is **read-only diagnostic evidence**, not a completed formal post-batch reconciliation or cleanup.
- Notification stub state in the summary: `notificationStubbed=false`, `notificationStubRestored=true`. The test log records the stub check itself as PASS with two expected stub calls.

### Current safety state
- **Do not rerun** `SNC_RunAssignmentGroupIntegration_CONFIRMED_TEST()` or any persistent Assignment/Group test. The batch has already written synthetic records and remains unresolved.
- Do not perform cleanup, broad deletion, migration, new fixture creation, Drive operation, LINE call, trigger installation, or deployment.
- Preserve all existing baseline records and the exact synthetic records already captured in the manifest.
- Continue with read-only inspection only until the incomplete manifest and interruption are understood.

### Next work — resume from this exact point
1. Fetch the latest `SNC_AssignmentGroupIntegrationRunner_TEST.gs` from GitHub `development` before any code-level diagnosis; the owner has confirmed GAS/GitHub alignment, but the current source should be re-read rather than relying on an older blob SHA.
2. Read the stored Assignment/Group manifest and existing read-only diagnostic helpers:
   - `SNC_GetAssignmentGroupManifest_TEST()`
   - `SNC_LogAssignmentGroupManifestSummary_TEST()`
   - `SNC_LogAssignmentGroupFailureDetail_TEST()`
   - `SNC_ReconcileAssignmentGroup_READONLY_TEST()`
3. Diagnose why the manifest remained `IN_PROGRESS` and why the recorded cases stop at GRP-06B. Do not state a root cause until supported by source/log evidence.
4. Separately plan the DOC-02 closed-assignment edit guard correction. Do not change application code until the owner approves the proposed fix and regression scope.
5. After diagnosis and approved correction, design a safe continuation strategy that resumes from verified state without replaying completed writes. Do not rerun the original persistent runner as-is.
6. Only after Assignment & Group is formally reconciled and closed should the next stage (Submission Management) be planned. File/Drive, Grading/Review, Notifications/Audit, full regression, and UAT remain pending.

### Overall project status at this checkpoint
- Approved requirements/design baseline: complete for DOC-01 v1.0, DOC-02 v1.1, DOCS v1.3 and SNC-WG-001 v1.0.0.
- Core synthetic fixture: created and manifest verified.
- Assignment & Group preflight: 9/9 PASS.
- Assignment & Group integration: **INCOMPLETE — 27 PASS / 1 FAIL; manifest IN_PROGRESS; requires read-only diagnosis and reconciliation**.
- ASG-13 closed-assignment edit guard: **FAIL / requirement gap**.
- Submission, File/Drive, Grading/Review, notification/audit integration, full regression and UAT: **NOT STARTED**.
- No cleanup has been performed; cleanup status remains **NOT STARTED**.

This checkpoint records owner-provided execution evidence and the next safe continuation point. It does not claim that any new GAS execution, source comparison, runtime verification, cleanup, or code fix occurred during this documentation update.


## Assignment & Group — read-only source diagnosis checkpoint — 23 Nov 2026

### Latest source inspected
- Re-fetched from GitHub `development`:
  - `backend/tests/SNC_AssignmentGroupIntegrationRunner_TEST.gs` — blob SHA `56b8fd81d6392e6c43138e4f9ce2769fccdb28cf`.
  - `backend/AssignmentManagement.gs` — blob SHA `ae56f8931c986dd8bbaafe72af219c9ca3d5044b`.
  - `backend/GroupManagement.gs` — blob SHA `9dc280d88bcee8e346d028082cae725fe2d88ee8`.
  - Design reference remains `docs/ASSIGNMENT_GROUP_INTEGRATION_TEST_DESIGN_v1.0_2026-11-23.md`.
- This is a current GitHub source inspection. The owner previously confirmed GAS/GitHub Runner synchronization; the current GAS copy has not been independently fetched or hash-compared.

### Confirmed source finding — ASG-13
- In `AssignmentManagement.gs`, the `assignment.update` branch checks assignment existence, offering authorization, and field validation, then writes updates and `UpdatedAt` and appends `ASSIGNMENT_UPDATED`.
- It contains **no guard on `current.Status` before writing.
- Therefore the source-level cause of ASG-13 is confirmed: a Closed Assignment can pass through the update handler. This matches the owner-run result (expected `CONFLICT`, actual `SUCCESS`).
- Proposed correction for review (not implemented): enforce the approved DOC-02 edit-state rule immediately after loading and authorizing the current Assignment, before any sheet mutation or audit append. Reject Closed state with `apiError_('CONFLICT', ...)`. The exact allowed editable states must follow DOC-02 wording; do not silently broaden the rule to DRAFT or other states.
- No application code was changed.

### Runner control-flow review — interruption remains undetermined
- The current Runner records each case by persisting the manifest. `GRP-06A` and `GRP-06B` are both expected to return `CONFLICT` because the actors already belong to a group in the same offering.
- After GRP-06B, the Runner compares the complete GroupMembers primary-key list against the pre-join snapshot. It then proceeds to GRP-07.
- The outer catch block is designed to re-read the manifest, compute post-minus-pre ID deltas, set `STOPPED_REQUIRES_RECONCILIATION`, and save. However, its inner catch suppresses any failure during this recovery write. Thus a failed recovery operation can leave the manifest at `IN_PROGRESS` without surfacing the recovery failure. An Apps Script forced termination/timeout could also prevent catch/finally execution. These are plausible mechanisms, **not established root causes**.
- The supplied manifest has 28 cases and ends at GRP-06B, but the current source's expected path and the available log do not establish whether the next assertion, an execution interruption, or a manifest persistence issue occurred. Root cause remains **NOT DETERMINED**.
- The current helper `SNC_LogAssignmentGroupFailureDetail_TEST()` reports recorded cases and capture metadata but does not expose the underlying exception stack or execution termination reason.
- No persistent runner was executed during this source review.

### Next owner action — read-only only
Run these existing functions individually in GAS; do not run the persistent runner:
1. `SNC_LogAssignmentGroupManifestSummary_TEST()`
2. `SNC_LogAssignmentGroupFailureDetail_TEST()`
3. `SNC_ReconcileAssignmentGroup_READONLY_TEST()`

Share the complete sanitized log outputs. Do not paste the full raw manifest or synthetic IDs. Also share the Apps Script execution record for the original Runner execution if still available (start/end/duration and any timeout/exception text); redact identifiers and personal data.

### Safety and approval boundary
- Do not rerun `SNC_RunAssignmentGroupIntegration_CONFIRMED_TEST()`.
- Do not change Assignment/Group/GroupMember/AuditLog rows, delete data, or run cleanup.
- No GAS source changes, deployment, trigger, Drive, LINE, or external calls were made in this checkpoint.
- After the three read-only outputs are reviewed, prepare a formal exact-ID reconciliation and a narrowly scoped ASG-13 patch/regression proposal for owner approval. Do not modify application code before approval.


## Owner-provided read-only diagnostics — 23 Nov 2026, 13:39–13:40

The owner executed the three requested read-only functions individually in GAS. Evidence below is copied from the supplied logs.

### Manifest summary
- `coreStatus=CORE_FIXTURE_CREATED`
- `status=IN_PROGRESS`; `stopReason=null`
- `caseCount=28`; `pass=27`; `fail=1`; `notRun=0`
- `postFailureNewIdCounts`: Assignments=0, Groups=0, GroupMembers=0, AuditLogs=0 (these are zero because no post-failure ID snapshot is stored; do not interpret this as proof no writes occurred after the last capture).
- `notificationStubbed=false`; `notificationStubRestored=true`.

### Case details
- ASG-01 through ASG-12C and ASG-NOTIFY-STUB passed.
- ASG-13 failed: expected `CONFLICT`, actual `SUCCESS`.
- GRP-01 through GRP-06B passed. GRP-06A and GRP-06B each returned `CONFLICT` with detail `You already belong to a group in this offering.`.
- The case list ends at GRP-06B. No GRP-07 or later case was recorded.
- Manifest contains four Assignment IDs and three Group IDs.
- Last write capture remains GRP-05 with new ID counts Groups=3, GroupMembers=6, AuditLogs=16.

### Read-only reconciliation
- Assignments: actual new IDs=4, manifest IDs=4, all manifest IDs exist, unexpected=0.
- Groups: actual new IDs=3, manifest IDs=3, all manifest IDs exist, unexpected=0.- GroupMembers: actual new IDs=6, manifest IDs=6, all manifest IDs exist, unexpected=0.
- AuditLogs: actual new row count=16. This helper reports a count only; it does not verify exact AuditLog IDs/events against a manifest.
- Manifest remains IN_PROGRESS; caseCount=28; no post-failure IDs or post-batch IDs; reconciliation field remains null.

### Interpretation and remaining uncertainty
- The supplied read-only evidence confirms no unexpected Assignment, Group, or GroupMember primary IDs relative to the pre-batch baseline and the current manifest.
- It does **not** prove AuditLog event completeness, that no mutation occurred after the last captured write, or that the batch's completion/stop state was correctly persisted.
- Both expected negative membership checks passed, so their API outcomes are not the apparent reason for the stop. However, the logs do not include the original Runner execution's exception, timeout, or duration. Root cause for the interruption remains **NOT DETERMINED**.
- Do not infer that `postFailureNewIdCounts=0` means the runner stopped before any writes; the recorded Group and Assignment writes already exist and are reconciled to their manifest IDs.

### Next step
1. Obtain the Apps Script Executions record for the original persistent Runner invocation, including start/end/duration and any exception or timeout message. If available, share only the error/termination detail; no identifiers or raw manifest needed.
2. Do not rerun the original Runner.
3. Prepare a separate read-only AuditLog verification using the exact expected action/entity pairs from the existing manifest and source behavior; do not mutate rows.
4. Prepare an owner-reviewable ASG-13 patch and narrow regression plan. No application source changes until the owner approves.
5. After diagnosis, create a continuation runner that resumes only unexecuted cases from verified state and cannot replay GRP-01..GRP-06 or Assignment creates. Do not implement/run this without review and approval.

No persistent test, data mutation, cleanup, code patch, deployment, trigger, Drive, or LINE action was performed during this diagnostic turn.


## Owner-approved ASG-13 source correction — 23 Nov 2026

### Approval and implementation
- Owner approved the narrowly scoped CLOSED Assignment edit guard.
- Updated `backend/AssignmentManagement.gs` on `development`:
  - Immediately after Assignment lookup and offering authorization, reject `Status=CLOSED` (case-insensitive) with `CONFLICT`.
  - Guard runs before sheet mutation and AuditLog append.
  - No change was made to DRAFT, OPEN, or any other status behavior.
- Added `backend/tests/SNC_AssignmentClosedEditRegression_TEST.gs`:
  - Function: `SNC_TestClosedAssignmentEditGuard_READONLY_TEST()`.
  - Uses the existing manifest's Individual Assignment, requires it to already be CLOSED, and attempts a synthetic title update.
  - Verifies expected `CONFLICT`, unchanged Assignment row, and unchanged AuditLogs primary-key set.
  - No fixture creation, cleanup, external calls, or intended writes.

### GitHub commits
- Assignment handler fix commit: `5c9dbce6e916ba28c0431279b92284e322dbdb35`.
- Regression test addition commit: `c95873684d246ae84dc0dc2666ba9e6969033806`.
- Current handler blob SHA: `460c7a0eb244fa5a85239d0e2f531404d58601d8`.
- Current regression test blob SHA: `0dbc216894acb93c6fea11c90d4a46487daf73fb`.
- Both changes are on `development`; no change to `main`.

### Verification boundary
- GitHub source was re-fetched after both commits and the guard/test contents were inspected.
- Static source verification only. The owner has not yet copied the updated files into GAS or run the regression function.
- Do not report ASG-13 as runtime PASS until the regression log is supplied.
- No GAS execution, Spreadsheet mutation, deployment, cleanup, trigger, Drive, or LINE operation was performed.

### Next safe actions
1. Owner copies the updated `AssignmentManagement.gs` and new regression test file into the TEST GAS project.
2. Run only `SNC_TestClosedAssignmentEditGuard_READONLY_TEST()`; do not rerun the original persistent Assignment/Group Runner.
3. Share the complete sanitized log. Expected result: `success=true`, `actualErrorCode=CONFLICT`, `assignmentUnchanged=true`, `auditLogIdsUnchanged=true`.
4. Continue with read-only exact AuditLog reconciliation and design a continuation mechanism for GRP-07 onward. The continuation must validate the existing manifest and exact current IDs before any write, and must never replay GRP-01 through GRP-06 or Assignment creation.
5. Assignment & Group remains **INCOMPLETE** until the focused regression, remaining Group cases, exact AuditLog reconciliation, and terminal manifest reconciliation are all evidenced. Cleanup remains NOT STARTED.

## Owner-run ASG-13 closed-assignment regression — runtime evidence — 23 Nov 2026

### Execution result supplied by owner
The owner copied the approved AssignmentManagement.gs fix and regression test into the TEST GAS project and ran only:
- SNC_TestClosedAssignmentEditGuard_READONLY_TEST()

Execution log:
- Started: 1:54:14 PM
- Regression result logged: 1:54:26 PM
- Completed: 1:54:23 PM (the supplied log timestamps are not chronologically ordered; preserve as reported and do not infer execution duration)

Structured result:
- success=true
- evidenceLevel=HANDLER_LEVEL_READ_ONLY_REGRESSION
- test=CLOSED_ASSIGNMENT_EDIT_REJECTED_WITHOUT_MUTATION
- expectedErrorCode=CONFLICT
- actualErrorCode=CONFLICT
- assignmentUnchanged=true
- auditLogIdsUnchanged=true
- writesExpected=0
- externalCallsExpected=0

### Assessment
- ASG-13 focused regression: RUNTIME PASS, based on the owner-provided GAS execution log.
- This verifies the CLOSED Assignment edit guard rejects the update with CONFLICT and, for this test invocation, the Assignment row and AuditLog primary-key set remain unchanged.
- Evidence scope is handler-level regression; it is not a full API/deployment E2E test and does not validate other Assignment statuses.
- The earlier Assignment & Group batch remains INCOMPLETE: manifest still needs exact AuditLog reconciliation, verified continuation for GRP-07 onward, remaining Group cases, and terminal manifest reconciliation.
- The original persistent Runner must not be rerun. No cleanup has been performed.

### Next safe work
1. Perform read-only exact AuditLog reconciliation against the existing manifest and expected action/entity pairs.
2. Review the Apps Script Executions record for the original Runner if available; the interruption cause remains NOT DETERMINED.
3. Prepare a continuation design that starts only from verified unexecuted cases and cannot replay completed Assignment/Group writes. Obtain owner approval before implementing any new continuation code or expanding test scope.
4. Keep cleanup, broad deletion, migration, deployment, triggers, Drive, and LINE operations out of scope absent separate approval.

This checkpoint records the owner-supplied runtime log. No additional GAS execution or data mutation was performed during the documentation update.
## Read-only AuditLog reconciliation utility added — 23 Nov 2026

New file on development:
- Path: sport-nutrition-classroom/backend/tests/SNC_AuditLogReconciliation_READONLY_TEST.gs
- Commit: 751ec30f3a53ca1a3d31fb5a39893bec24651ceb
- URL: https://github.com/worrawutt-source/worrawutsportsci/blob/development/sport-nutrition-classroom/backend/tests/SNC_AuditLogReconciliation_READONLY_TEST.gs

Function: SNC_AuditLogReconciliation_READONLY_TEST()

Read-only behavior:
- Verifies TEST environment through the existing sncAGR_env_TEST_() guard.
- Reads the existing Assignment/Group manifest and requires the AuditLog ID capture at GRP-05.
- Verifies the AuditLogs schema and reads AuditID, Action, EntityType, EntityID, and CreatedAt.
- Compares captured IDs against current AuditLogs and against the pre-batch baseline; reports missing and untracked IDs.
- Checks duplicate IDs, expected Action/EntityType counts, and EntityID membership in the Assignment/Group manifest.
- Does not write Sheets, Script Properties, or files; does not call external services or triggers.

Expected event matrix encoded in the utility:
- ASSIGNMENT_CREATED / Assignment: 4
- ASSIGNMENT_UPDATED / Assignment: 2
- ASSIGNMENT_OPENED / Assignment: 2
- ASSIGNMENT_CLOSED / Assignment: 2
- GROUP_CREATED / Group: 3
- GROUP_MEMBER_JOINED / Group: 3

Next action: owner copies this single new test file into the TEST GAS project and runs only SNC_AuditLogReconciliation_READONLY_TEST(). Share the complete sanitized log. Do not rerun the original persistent Assignment/Group Runner. Runtime status remains NOT RUN until owner supplies the execution result.

Note: The utility requires the GRP-05 capture and does not assert that no events could exist outside the captured time window beyond the comparison against IDs added since preBatchIds. It is a read-only reconciliation aid, not a completion marker for the Assignment/Group batch.
## Owner-run AuditLog ID and event reconciliation — runtime PASS — 23 Nov 2026
### Execution result supplied by owner
Function: SNC_AuditLogReconciliation_READONLY_TEST()
Execution: started 2:01:44 PM; completed 2:01:46 PM.
Structured result reported:
- status=PASS
- evidenceLevel=READ_ONLY_AUDITLOG_ID_AND_EVENT_RECONCILIATION
- manifestStatus=IN_PROGRESS
- captureCaseId=GRP-05
- expectedIdCount=16; foundIdCount=16
- missingIds=[]
- duplicateExpectedIds=[]; duplicateActualIds=[]
- unexpectedEvents=[]
- wrongEntityIds=[]

Event-count reconciliation:
- ASSIGNMENT_CREATED / Assignment: expected 4, actual 4
- ASSIGNMENT_UPDATED / Assignment: expected 2, actual 2
- ASSIGNMENT_OPENED / Assignment: expected 2, actual 2
- ASSIGNMENT_CLOSED / Assignment: expected 2, actual 2
- GROUP_CREATED / Group: expected 3, actual 3
- GROUP_MEMBER_JOINED / Group: expected 3, actual 3

### Assessment
- **AuditLog reconciliation at the GRP-05 capture: RUNTIME PASS**, based on the owner-provided execution log.
- All 16 captured IDs were found exactly once and mapped to the expected event types and Assignment/Group entity IDs.
- The 16 records include two ASSIGNMENT_UPDATED events. One was generated by the original ASG-13 behavior before the CLOSED edit guard was added; the later focused regression confirmed the guard now rejects a CLOSED edit without changing the Assignment row or AuditLog ID set.
- This PASS is limited to the captured 16 AuditLogs and the comparison performed by the utility. It does not prove that the interrupted batch completed, that no later events were generated, or that GRP-07 onward passed.
- The manifest remains IN_PROGRESS. Assignment & Group Integration remains INCOMPLETE. No cleanup has been performed.

### Next safe work
1. Do not rerun the original persistent Assignment/Group Runner.
2. Establish the exact current state for Group cases GRP-07 onward and the manifest before designing a continuation. Existing GRP-01..GRP-06 results must not be replayed.
3. Any continuation runner must be separately reviewed and approved before implementation or execution.
4. Keep cleanup and all other out-of-scope operations prohibited absent separate approval.

This checkpoint records the owner-supplied runtime log. No Spreadsheet mutation or GAS execution was performed during this documentation update.
## Group continuation design — GRP-07 through GRP-12 — 23 Nov 2026

### Design artifact
- Created `sport-nutrition-classroom/docs/GROUP_CONTINUATION_DESIGN_v1.0_2026-11-23.md`.
- Commit: `34141c67ae5423d1da7e917a83e2ff44250939b9`.
- URL: https://github.com/worrawutt-source/worrawutsportsci/blob/development/sport-nutrition-classroom/docs/GROUP_CONTINUATION_DESIGN_v1.0_2026-11-23.md
- Design only. No GAS code was created or executed; no Spreadsheet/Script Properties writes, deployment, triggers, LINE, Drive, or cleanup occurred.

### Source review
- Re-fetched `backend/tests/SNC_AssignmentGroupIntegrationRunner_TEST.gs` from `development`: blob SHA `56b8fd81d6392e6c43138e4f9ce2769fccdb28cf`.
- Re-fetched `backend/GroupManagement.gs` from `development`: blob SHA `9dc280d88bcee8e346d028082cae725fe2d88ee8`.
- Confirmed source sequence after GRP-06B: GRP-07 non-enrolled create; GRP-08A/B/C visibility; GRP-09 representative selection; GRP-10A/B forbidden selection attempts; GRP-11 leave; GRP-12 rejoin.
- GRP-13 membership-lock test remains deferred to Submission Integration; GRP-14 is not in the current runner and is out of scope.
- Original execution interruption cause remains NOT DETERMINED; no Apps Script execution termination record has been provided.

### Continuation safety requirements
- Never rerun the original persistent Assignment/Group Runner.
- Proposed new runner: `SNC_GroupContinuation_GR07_12_TEST.gs`, only after separate review and approval.
- It must reuse the existing manifest and IDs, never create fixtures, never replay completed cases, and never write directly to application sheets.
- Before implementation/execution, a new read-only state gate must verify exact current Group/GroupMember states, roles, lock state, Submission absence, case ledger, and AuditLog baseline. Any ambiguity blocks continuation.
- Mutating cases GRP-09, GRP-11, and GRP-12 require state-plus-AuditLog reconciliation before any retry; ambiguous partial mutations must stop rather than repeat.
- Cleanup remains NOT STARTED and out of scope.

### Current status
- AuditLog reconciliation at GRP-05 capture: RUNTIME PASS (16/16 exact IDs and event matrix).
- ASG-13 focused CLOSED edit regression: RUNTIME PASS.
- Assignment & Group batch: INCOMPLETE; original manifest remains IN_PROGRESS and retains historical ASG-13 FAIL.
- Continuation runner: NOT IMPLEMENTED; no continuation preflight executed.
- Next step: owner review/approval of the design, then implement only the read-only state diagnostic as the first separately reviewed artifact.

## Approved Group continuation Read-only State Diagnostic — 23 Nov 2026

### Owner approval
- Owner approved development of the Read-only State Diagnostic only.
- Approval does not authorize implementation/execution of the continuation runner, any persistent Group action, cleanup, deployment, triggers, Drive, or LINE.

### Artifact created on development
- File: `sport-nutrition-classroom/backend/tests/SNC_GroupContinuationStateDiagnostic_READONLY_TEST.gs`
- Function: `SNC_GroupContinuationStateDiagnostic_READONLY_TEST()`
- Latest commit: `ff00a76b5d671f385bf892428a8341e3d502b916`
- Latest blob SHA: `fda9de5861908cbf939dbd055bae3f6917fba40d`
- URL: https://github.com/worrawutt-source/worrawutsportsci/blob/development/sport-nutrition-classroom/backend/tests/SNC_GroupContinuationStateDiagnostic_READONLY_TEST.gs
- Version: 1.0.0; evidence level: READ_ONLY_TEST_DATA_INSPECTION.

### Diagnostic scope
The diagnostic uses existing Runner read-only helpers and checks:
- Exact TEST environment and active Spreadsheet identity.
- Core/Assignment-Group manifest checkpoint, expected case ledger and absence of continuation markers.
- Six active users and enrollments, one active CourseOffering.
- Four Assignment IDs, three Group IDs and six original GroupMember IDs against exact pre-batch ID deltas.
- Group ACTIVE/unlocked state and exact Alpha (A/B), Beta (C/D/E), Solo (F) membership/roles/statuses.
- Exact 16 previously reconciled AuditLog IDs and expected Action/EntityType counts and EntityID references.
- No Submission referencing any synthetic Assignment or Group.
- Unique active SYSTEM_ADMIN actor.

The diagnostic emits redacted counts and check statuses only; it does not log raw manifest or synthetic identifiers. It does not invoke application handlers or write Sheets, Script Properties, files, or call external services. Any discrepancy returns BLOCKED; it does not repair or normalize data.

### Static source review
Latest file was re-fetched from GitHub `development`. Static checks:
- TEST environment and exact Spreadsheet guard: PASS
- manifest checkpoint validation: PASS
- active Offering/User/Enrollment validation: PASS
- exact Assignment/Group/GroupMember IDs: PASS
- membership role/status/lock validation: PASS
- AuditLog 16-ID and event matrix validation: PASS
- Submission absence validation: PASS
- no persistent Sheet/Properties writes: PASS
- no handler or external service calls: PASS
- no raw manifest/ID logging: PASS
- Static inspection only; no Apps Script runtime execution has occurred.
- Requires the existing `SNC_AssignmentGroupIntegrationRunner_TEST.gs` helper functions to remain in the TEST GAS project:
  `sncAGR_env_TEST_`, `SNC_GetAssignmentGroupManifest_TEST`, `sncAGR_rows_TEST_`, `sncAGR_ids_TEST_`, `sncAGR_admin_TEST_`.

### Next owner action
1. Copy only `SNC_GroupContinuationStateDiagnostic_READONLY_TEST.gs` into the TEST GAS project.
2. Run only `SNC_GroupContinuationStateDiagnostic_READONLY_TEST()`.
3. Share the complete sanitized `SNC_GROUP_CONTINUATION_STATE` JSON and any Apps Script exception.
4. Do not run the original Assignment/Group Runner or any Group mutation/continuation function. No continuation runner has been implemented. Wait for diagnostic evidence and separate review before proceeding.

### Current status
- Diagnostic source: IMPLEMENTED ON DEVELOPMENT; STATIC REVIEW PASS.
- Diagnostic GAS runtime: NOT RUN.
- Group continuation: NOT IMPLEMENTED / NOT RUN.
- Assignment & Group stage: INCOMPLETE pending diagnostic, continuation and terminal reconciliation.- Cleanup: NOT STARTED.


## Group continuation diagnostic manifest-resolution correction — 23 Nov 2026

### Owner runtime evidence reviewed
The owner ran `SNC_GroupContinuationStateDiagnostic_READONLY_TEST()` v1.0.0:
- ENV-01 PASS
- MANIFEST-01 PASS
- CONTINUATION-01 PASS
- CASE-LEDGER-01 PASS
- FIXTURE-MANIFEST-01 BLOCKED
- No Apps Script exception; execution completed normally.

### Root cause from source inspection
The diagnostic v1.0.0 incorrectly expected `userIds` and `offeringId` inside the Assignment/Group extension object returned by `SNC_GetAssignmentGroupManifest_TEST()`. Source inspection confirms the manifest has two layers:
- Core fixture fields (`offeringId`, `userIds`) are returned by `SNC_GetSyntheticFixtureManifest_TEST()`.
- Assignment/Group fields (`assignments`, `groups`, `preBatchIds`, `cases`) are returned by `SNC_GetAssignmentGroupManifest_TEST()`.

Therefore, the reported BLOCKED was caused by a diagnostic source defect, not evidence that fixture rows or IDs are missing. No data mutation is indicated by the supplied read-only execution log.

### Correction implemented on development
- File: `sport-nutrition-classroom/backend/tests/SNC_GroupContinuationStateDiagnostic_READONLY_TEST.gs`
- Version: 1.0.1
- Commit: `aa3aebdf3276f6f53e1691aa86bf3bca1b44c302`
- Blob SHA: `c43fb2e8312cbafa17cc910d0926752ed147233c`
- URL: https://github.com/worrawutt-source/worrawutsportsci/blob/development/sport-nutrition-classroom/backend/tests/SNC_GroupContinuationStateDiagnostic_READONLY_TEST.gs

Changes:
- Reads the core fixture manifest via `SNC_GetSyntheticFixtureManifest_TEST()`.
- Reads the Assignment/Group extension via `SNC_GetAssignmentGroupManifest_TEST()`.
- Gets the six UserIDs and OfferingID from the core manifest; Assignment, Group and GroupMember IDs from the extension.
- Retains redacted output and all existing state checks. No writes, handler calls, external calls, cleanup or fixture creation were added.

### Verification boundary and next owner action
- Static source inspection: correction reviewed in GitHub `development`.
- GAS runtime for v1.0.1: NOT RUN.
- Owner should replace the previous diagnostic file with this v1.0.1 source (do not add a second copy with duplicate function names), then run only `SNC_GroupContinuationStateDiagnostic_READONLY_TEST()`.
- Share the complete sanitized `SNC_GROUP_CONTINUATION_STATE` JSON and any exception.
- Do not rerun the original persistent Assignment/Group Runner or execute any Group mutation/continuation, cleanup, migration, trigger, Drive, LINE or deployment action.

### Current status
- Diagnostic v1.0.0: RUNTIME BLOCKED due to diagnostic manifest-layer mismatch.
- Diagnostic v1.0.1: IMPLEMENTED ON DEVELOPMENT; STATIC REVIEW ONLY.
- Group continuation: NOT IMPLEMENTED / NOT RUN.
- Assignment & Group stage: INCOMPLETE.
- Cleanup: NOT STARTED.


## Group continuation runner implemented — 23 Nov 2026

### Owner approval and scope
- Owner approved development of the Continuation Runner for GRP-07 through GRP-12.
- Work performed on `development` only.
- The owner-run read-only Group Continuation State Diagnostic v1.0.1 was READY with 15 PASS and 0 BLOCKED before implementation.
- No GAS execution, Spreadsheet mutation, Script Properties mutation, fixture creation, cleanup, deployment, triggers, Drive, LINE, or Submissions were performed during implementation.

### New source artifact
- File: `sport-nutrition-classroom/backend/tests/SNC_GroupContinuation_GR07_12_TEST.gs`
- Version: 0.1.0
- Commit (latest correction): `6b035995645ffa87d0333654d8d1e3e4fb4fc935`
- Blob SHA: `d5b8d8fa12b9422d786dcf16efc8d1adb11cba36`
- URL: https://github.com/worrawutt-source/worrawutsportsci/blob/development/sport-nutrition-classroom/backend/tests/SNC_GroupContinuation_GR07_12_TEST.gs
- Read-only preflight: `SNC_GroupContinuationPreflight_TEST()`
- Persistent entry point: `SNC_RunGroupContinuation_CONFIRMED_TEST()`
- Exact confirmation phrase embedded in source: `CONTINUE SNC GROUP TESTS GRP-07 TO GRP-12 2026-11-23`

### Implemented safeguards and scope
- Uses the existing core and Assignment/Group manifest getters; does not initialize or replace the existing fixture manifest.
- Uses existing GroupIDs, UserIDs and OfferingID only.
- Covers GRP-07, GRP-08A/B/C, GRP-09, GRP-10A/B, GRP-11 and GRP-12 only.
- Group mutations call `handleGroupManagementAction_()`; no direct writes to application tables.
- Includes TEST environment and exact Spreadsheet identity guard, document lock, preflight, case checkpoints, RequestID-linked AuditLog matching, state verification, duplicate-event detection, stop-on-error behavior, and terminal reconciliation.
- GRP-12 captures the single new GroupMemberID in the existing manifest.
- Original case ledger and ASG-13 historical FAIL are retained; summary labels the continuation as complete with historical failure rather than a clean overall PASS.
- No notification, LINE, Drive, trigger, Submission, cleanup, migration or deployment behavior is included.

### Static source review
Latest source was re-fetched from `development`; static checks passed for:
- Version and preflight function present.
- Exact confirmation phrase present.
- Scope limited to the nine intended case IDs.
- Existing manifest getters used.
- Group handler used for application mutations.
- Original persistent runner is not called.
- No cleanup/delete-row/trash operation present.
- Before-handler and handler-returned checkpoints present.
- AuditLog verification includes RequestID.
- Historical ASG-13 FAIL is preserved.
- Terminal GroupMember ID count reconciliation corrected.

Static review is not GAS runtime verification. The new preflight and continuation have NOT been run in Apps Script.

### Important execution boundary / next action
- The persistent entry point is implemented but is NOT authorized to run by this development approval.
- Owner should copy the new file into the TEST GAS project and run only `SNC_GroupContinuationPreflight_TEST()` first.
- Share the complete sanitized preflight output for source/result review.
- Do not run `SNC_RunGroupContinuation_CONFIRMED_TEST()` until the owner separately approves persistent execution after reviewing the complete source and READY preflight.
- If an execution is interrupted after a mutation, do not rerun blindly. Preserve the checkpoint and request read-only reconciliation before any further action.
- Original Assignment/Group runner must never be rerun.
- Cleanup remains NOT STARTED.


### Additional fail-closed limitation
- The preflight deliberately requires the original pre-GRP-07 membership composition and exact original GroupMember ID set. Therefore, if a persistent run is interrupted after GRP-09, GRP-11 or GRP-12 has changed application state, a fresh preflight will BLOCK rather than resume automatically.
- The RequestID/state recovery checks in the runner are not a substitute for a successful resume gate. In that interruption scenario, preserve the manifest/checkpoint and obtain a separate read-only reconciliation before changing or rerunning anything. Do not claim automatic resumability.


## Owner-run Group Continuation Runner — runtime completion evidence — 23 Nov 2026

### Owner-provided GAS execution log
- `SNC_GroupContinuationPreflight_TEST()`: READY; 10 PASS, 0 BLOCKED.
- `SNC_RunGroupContinuation_CONFIRMED_TEST()`: completed normally.
- Structured result:
  - status: `COMPLETE_WITH_HISTORICAL_FAILURE`
  - evidenceLevel: `HANDLER_LEVEL_INTEGRATION`
  - continuationCaseCount: 9
  - pass: 9; recovered: 0; fail: 0
  - historicalASG13: `FAIL_PRESERVED`
  - terminalReconciliation: PASS  - cleanupStatus: `NOT STARTED`
- This is owner-supplied runtime evidence. No independent access to the GAS execution was available.

### Assessment
- GRP-07, GRP-08A/B/C, GRP-09, GRP-10A/B, GRP-11 and GRP-12 are recorded as nine passing continuation cases.
- The Runner's own terminal check passed. This confirms the checks encoded in that Runner; it is not a substitute for independent read-only inspection of the final rows and AuditLogs.
- Original ASG-13 FAIL remains preserved in the historical Assignment/Group ledger. The separate focused CLOSED-edit regression previously passed, but the historical batch result must not be rewritten.
- No cleanup was started. Do not rerun either persistent Assignment/Group Runner or the Group continuation Runner.

### Independent terminal reconciliation utility added
- File: `backend/tests/SNC_GroupContinuationTerminalReconciliation_READONLY_TEST.gs`
- Version: 1.0.0
- Function: `SNC_GroupContinuationTerminalReconciliation_READONLY_TEST()`
- Commit: 81d7a5cbbed55d18162ed76a729f28b703163aa7
- URL: https://github.com/worrawutt-source/worrawutsportsci/blob/development/sport-nutrition-classroom/backend/tests/SNC_GroupContinuationTerminalReconciliation_READONLY_TEST.gs
- Read-only scope: TEST environment; core and Assignment/Group manifests; all nine continuation ledger records; historical ASG-13 preservation; Alpha/Beta/Solo terminal membership and roles; Assignment/Group/GroupMember primary IDs; Submission absence; and AuditLog delta since the pre-batch baseline.
- Expected AuditLog delta encoded from the existing baseline plus the three mutating continuation cases: 19 records total (the original 16 plus representative selection, leave, and rejoin events).
- The utility reads live TEST Sheets and Script Properties through existing read-only helpers. It performs no Sheet/Properties/file writes, application-handler calls, external calls, cleanup, trigger, Drive, LINE, or deployment operation.
- Static review of this newly authored source is limited to its written logic; no GAS runtime has been run for this utility.

### Next owner action
1. Copy this single new file into the TEST GAS project.
2. Run only `SNC_GroupContinuationTerminalReconciliation_READONLY_TEST()`.
3. Share the complete sanitized `SNC_GROUP_TERMINAL_RECONCILIATION` result and any exception.
4. Do not run any persistent Runner or Cleanup function. Cleanup remains NOT STARTED and requires separate approval after the read-only reconciliation is reviewed.

### Current stage status
- Group continuation Runner: owner-reported runtime PASS, 9/9 cases; zero recovered, zero failed.
- Runner terminal check: owner-reported PASS.
- Independent terminal row/AuditLog reconciliation: NOT RUN.
- Assignment & Group overall historical status: `COMPLETE_WITH_HISTORICAL_FAILURE`; retain ASG-13 historical FAIL.
- Cleanup: NOT STARTED.


## Terminal reconciliation follow-up — AuditLog actor-check false block and corrected diagnostic — 23 Nov 2026

### Owner-provided runtime evidence
Function: `SNC_GroupContinuationTerminalReconciliation_READONLY_TEST()`, version 1.0.0.
- Overall: `REQUIRES_REVIEW`; 9 PASS, 1 BLOCKED.
- Passed: TEST identity, manifests, nine continuation cases, historical ASG-13 preservation, fixture IDs, terminal Group/GroupMember state, primary IDs, Submission absence, AuditLogs schema.
- AuditLog counts: current 68; post-baseline delta 19.
- `AUDIT-DELTA-01` was BLOCKED. No data mutation was performed by this read-only diagnostic.

### Source-level diagnosis
The v1.0.0 diagnostic applied one actor constraint to every `GROUP_MEMBER_JOINED` event, requiring all join events to have the GRP-12 rejoining student's ActorUserID. Inspection of the original Assignment/Group Runner shows the earlier GRP-04 joins were performed by different student actors. Therefore, the actor assertion was over-restrictive and can produce a false BLOCKED even when the events are correct. This is a diagnostic logic defect; it is not evidence that AuditLogs are corrupt.
- Expected event matrix remains 19 total: original 16 plus `GROUP_REPRESENTATIVE_SELECTED` (1), `GROUP_MEMBER_LEFT` (1), and the additional `GROUP_MEMBER_JOINED` (1).
- Corrected actor validation: require all Group delta events to have RequestIDs; require the representative-selection and leave events to be by the GRP-12 actor; among four Group join events, require exactly one by that actor (the GRP-12 rejoin), while allowing the three earlier joins to retain their own actors.
- No assumption is made about unverified actor identities for the three earlier joins beyond preserving their distinct recorded values.

### Corrected diagnostic source
- File: `backend/tests/SNC_GroupContinuationTerminalReconciliation_READONLY_TEST.gs`
- Version: 1.0.1
- Commit: bff6dc3241766c4137df5f63c70eefed00b03560
- URL: https://github.com/worrawutt-source/worrawutsportsci/blob/development/sport-nutrition-classroom/backend/tests/SNC_GroupContinuationTerminalReconciliation_READONLY_TEST.gs
- This changes only the read-only audit actor assertion. It does not change expected event counts, application handlers, Sheet data, manifests, or any persistent test state.

### Next owner action
Replace the existing v1.0.0 diagnostic source in TEST GAS with v1.0.1 (do not add a duplicate file/function), then run only `SNC_GroupContinuationTerminalReconciliation_READONLY_TEST()`. Share the full sanitized result. Do not run persistent runners or Cleanup. Cleanup remains NOT STARTED.

### Status
- Terminal reconciliation v1.0.0: RUNTIME REQUIRES_REVIEW due to over-restrictive diagnostic actor check.
- v1.0.1: source correction committed; GAS runtime NOT RUN.
- Application data: no changes from this diagnostic correction.
- Cleanup: NOT STARTED.


## Owner-run independent terminal reconciliation — v1.0.1 — 23 Nov 2026

### Runtime evidence supplied by owner
Function: `SNC_GroupContinuationTerminalReconciliation_READONLY_TEST()`, version 1.0.1.
- Overall status: **PASS**, 10 PASS, 0 BLOCKED.
- Evidence level: `READ_ONLY_TERMINAL_DATA_AND_AUDIT_RECONCILIATION`.
- Mode: `READ_ONLY`; writesExpected=0; externalCallsExpected=0.
- ENV-01, MANIFEST-01, CASE-LEDGER-01, HISTORY-01, FIXTURE-IDS-01, GROUP-STATE-01, PRIMARY-IDS-01, SUBMISSIONS-01, AUDIT-SCHEMA-01 and AUDIT-DELTA-01 all PASS.
- All nine continuation cases are uniquely recorded as PASS/RECOVERED_VERIFIED.
- Historical ASG-13 FAIL remains preserved in the original ledger.
- Four Assignments, three Groups and exactly seven synthetic GroupMember IDs reconcile to the manifest.
- No Submission references the synthetic Assignment/Group fixtures.
- Exactly 19 post-baseline AuditLogs reconcile. Earlier joins retain their distinct actors; the GRP-12 rejoin is attributed to the expected student; all Group events have RequestIDs.
- Counts: continuationCases=9; assignments=4; groups=3; groupMembersCurrent=7; syntheticGroupMemberDelta=7; auditLogsCurrent=68; auditLogDelta=19; syntheticSubmissions=0.
- Manifest status remains `IN_PROGRESS`; continuation status is `COMPLETE_WITH_HISTORICAL_FAILURE`; cleanupStatus=`NOT STARTED`.

### Assessment and evidence boundary
- The corrected independent terminal reconciliation is **RUNTIME PASS**, based on the owner-provided GAS log.
- The v1.0.0 AuditLog actor-check BLOCKED is retained as historical diagnostic evidence; v1.0.1 corrected the assertion and passed. Do not erase the earlier result.
- Assignment/Group work is reconciled at the tested handler/data/AuditLog scope, with the original ASG-13 batch FAIL preserved and the separate focused CLOSED-edit regression RUNTIME PASS.
- This is not a full deployed Web App E2E test, Submission integration, or UAT.
- No cleanup or data mutation occurred in this read-only execution.

### Next safe work
1. Record this owner-supplied runtime evidence in the project test evidence record.
2. Prepare and review an exact-ID cleanup plan using only the synthetic fixture manifest and verified post-baseline ID sets. The plan must list every target table and exact primary key before any deletion; preserve all non-fixture rows and all AuditLogs unless separately approved.
3. Do not execute cleanup, delete rows/files, alter Script Properties, or change the manifest until a separate explicit owner approval is given after reviewing the exact-ID allowlist and recovery implications.
4. After cleanup disposition is resolved, plan Submission Management integration as a separate stage. Group membership lock on first Group Submission remains untested/deferred.

### Current status
- Assignment & Group continuation: 9/9 cases PASS; independent terminal reconciliation 10/10 PASS.
- ASG-13: historical batch FAIL preserved; focused CLOSED-edit corrective regression RUNTIME PASS.
- Assignment/Group manifest: `IN_PROGRESS` (historical parent manifest status retained; do not rewrite solely to make it appear complete).
- Cleanup: **NOT STARTED — separate approval required**.
- Submission integration and Group submission-lock behavior: **NOT STARTED / DEFERRED**.


## Draft cleanup plan created — 23 Nov 2026

- Added `docs/SNC_SYNTHETIC_FIXTURE_CLEANUP_PLAN_v1.0_DRAFT_2026-11-23.md` on `development`.
- Commit: `9fa9ac6a6db6c2761935881e2582b4f84ca6b187`.
- This is a planning document only. It contains no deletion code and does not authorize cleanup.
- Exact primary-key IDs are intentionally not fabricated; they must be extracted from the persisted manifest and revalidated against current TEST tables in a separate read-only inventory.
- AuditLogs are designated for preservation. Core fixture Users, Enrollments, Course, Semester and CourseOffering are not included in the cleanup scope pending the owner's decision on whether they are needed for Submission Integration.
- Cleanup remains **NOT STARTED**. No rows, files, properties, triggers or deployments were changed.


## Exact-ID inventory utility prepared — read-only — 23 Nov 2026

### Source artifact
- Added `backend/tests/SNC_ExactIdInventory_READONLY_TEST.gs` on `development`.
- Version 1.0.0; function `SNC_ExactIdInventory_READONLY_TEST()`.
- Commit: `52cf7e662ef4fd86615ebf1ea28d64c8f1c9f08b`.
- Current blob SHA after fetch: `abcdd2a46080e9e5b53529c95f2e3c257ba034c4`.
### Static review
- Exact TEST environment and Spreadsheet identity guard: PASS.
- Reads the existing core and Assignment/Group manifests; does not create or alter them.
- Compares current post-baseline Assignment, Group and GroupMember primary IDs against the exact manifest ID sets (expected 4/3/7).
- Resolves each manifest ID to exactly one current row and reports its exact primary ID plus limited synthetic record metadata.
- Checks Assignment/Group OfferingID relationships, GroupMember-to-Group references, reserved synthetic prefix on Assignment titles/Group names, and Submission references.
- Confirms the 19 post-baseline AuditLog IDs remain present and labels AuditLogs `PRESERVE_ALL`.
- Static checks passed: version, TEST guard, manifest getters, exact ID set comparison, dependency checks, AuditLog preservation, absence of write/delete/handler APIs, and structured exact inventory logging.
- No GAS runtime execution has occurred yet. Static review is not runtime evidence.

### Owner action — read-only only
1. Add this single file to the existing TEST GAS project. Do not replace existing runners or add duplicate copies.
2. Run only `SNC_ExactIdInventory_READONLY_TEST()`.
3. Share the complete `SNC_EXACT_ID_INVENTORY` log. It contains synthetic IDs only; redact any unexpected personal or non-synthetic values if present.
4. Do not run any cleanup, deletion, persistent test runner, migration, trigger, Drive, LINE, or deployment function.

### Safety / interpretation
- The inventory function is read-only by design: no Spreadsheet/Script Properties writes, no application handlers, no external calls, and no deletion.
- It will return `REQUIRES_REVIEW` if any ID set, row resolution, relationship, Submission dependency, synthetic prefix, or AuditLog count differs from the reconciled state.
- A PASS inventory is a proposed candidate list for owner review only; it does not authorize deletion.
- Cleanup remains **NOT STARTED**. The core fixture is not included in this Assignment/Group inventory.


## Exact-ID Cleanup Preview v1.1 — 23 Nov 2026

### Owner-provided runtime inventory reviewed
- Owner supplied the complete execution log for `SNC_ExactIdInventory_READONLY_TEST()` v1.0.0.
- Result: `PASS`, 8 checks passed, 0 blocked; read-only mode, writesExpected=0, externalCallsExpected=0.
- Exact candidate set: 4 Assignments, 3 Groups, 7 GroupMembers; every ID resolves to exactly one row.
- Offering and GroupMember relationships pass; no Submission references candidate Assignment/Group IDs.
- All candidate Assignment titles and Group names carry the reserved synthetic prefix.
- Nineteen post-baseline AuditLog IDs remain present; current AuditLogs count is 68.
- The supplied inventory explicitly excludes the core fixture.

### Preview created
- Added `docs/SNC_SYNTHETIC_FIXTURE_CLEANUP_PREVIEW_v1.1_2026-11-23.md`.
- Commit: `fbaaa448adb6cfc84d0e094f466f7bfafc71fa8a`.
- The preview records all 14 exact candidate primary IDs and limited metadata:
  - 4 AssignmentID values
  - 3 GroupID values
  - 7 GroupMemberID values, including the historical LEFT row as a separate exact ID
- Explicit exclusions: all 68 AuditLogs, six core Users, six Enrollments, Course, Semester, CourseOffering, Submissions, Script Properties/manifests, triggers, deployments, LINE bindings, Drive files and all non-allowlisted/baseline rows.
- Proposed dependency order, conditional expected post-cleanup state, and 14 fail-closed pre-deletion guards are documented.
- PG-09 requires inspection of all known reference tables/columns. The current inventory only establishes absence of Submission references and does not prove absence of every possible downstream reference.
- Preview is for owner review only. It does not authorize execution.

### Safety state
- Cleanup remains `NOT STARTED`.
- No cleanup/deletion function has been implemented or executed.
- No TEST Spreadsheet data, AuditLogs, manifests, Script Properties, triggers, Drive files, LINE bindings or deployments were changed.
- Next gate: owner review of Preview v1.1. A separate explicit execution approval and final read-only dry-run are required before any cleanup.


## PG-09 reference audit and read-only scan utility — 23 Nov 2026

### Static source audit
- Inspected current `development` source modules:
  - `AssignmentManagement.gs` blob `460c7a0eb244fa5a85239d0e2f531404d58601d8`
  - `GroupManagement.gs` blob `9dc280d88bcee8e346d028082cae725fe2d88ee8`
  - `SubmissionManagement.gs` blob `ef4b86678e8c1feeea425ba578501846129a229c`
  - `FileManagement.gs` blob `86cd29160dd00207c9a575ce801da09e643911cb`
  - `GradingManagement.gs` blob `12bd34c5dd857250c7d6ccd76e28b5da7f4507f8`
  - `NotificationManagement.gs` blob `875b60d90f4599ee0f9bdf0f60dcea31e215de7b`
  - `CourseManagement.gs` blob `52a7f4049ff51772226fe33369cc26a0acb02a1b`
- Confirmed source-level references beyond Submissions:
  - NotificationLogs: Assignment RelatedEntityID and group reminder composite AssignmentID|GroupID.
  - SubmissionFiles: staged rows encode AssignmentID as STAGED:<userId>:<assignmentId>; committed rows refer to SubmissionID.
  - Grades: SubmissionID; GradeHistory and GradeReviewRequests: GradeID (transitive Submission dependency).
  - GroupMembers: GroupID child relationship; scan must detect non-allowlisted members referencing candidate Groups.
  - AuditLogs: Assignment/Group entity IDs; preserve all logs.
- Static source audit does not inspect live TEST rows or establish all runtime references. PG-09 remains BLOCKED pending the read-only live scan.

### PG-09 utility
- Added `backend/tests/SNC_PG09ReferenceScan_READONLY_TEST.gs`.
- Function: `SNC_PG09ReferenceScan_READONLY_TEST()`.
- Version: 1.0.0.
- Commit: `191bb4eb11c5c88475df670d645b1577926b6d0f`.
- Current blob SHA: `97dbacadfccb5fa086c11cc2413bccef08ed827b`.
- Utility verifies exact TEST identity and manifest allowlist, enumerates all current Spreadsheet tabs, scans all used cells for exact allowlisted ID tokens and delimited composite references, and classifies AuditLogs as preserve-only.
- Static inspection: exact TEST guard, manifest cross-check, all-sheet scan, composite token parsing, fail-closed behavior and no mutation/deletion APIs.
- No GAS runtime execution has occurred; do not claim runtime PASS.

### Owner action — read-only only
1. Add only `SNC_PG09ReferenceScan_READONLY_TEST.gs` to the existing TEST GAS project.
2. Run only `SNC_PG09ReferenceScan_READONLY_TEST()`.
3. Share the complete `SNC_PG09_REFERENCE_SCAN` log.
4. Do not run cleanup, deletion, persistent test runners, migration, triggers, Drive, LINE or deployment.

### Safety state
- Any unexpected reference blocks cleanup.
- AuditLogs remain PRESERVE_ALL; core fixture remains excluded.
- Cleanup remains NOT STARTED; no deletion utility exists.
- A final dry-run and separate explicit cleanup authorization remain required after PG-09 runtime evidence is reviewed.


## Exact-ID Cleanup Preview v1.2 and PG-09 runtime evidence — 23 Nov 2026

### Owner-provided PG-09 scan result
- Function: `SNC_PG09ReferenceScan_READONLY_TEST()`, version 1.0.0.
- Overall result: **PASS**, 6 PASS, 0 BLOCKED; evidence level `READ_ONLY_ALL_SHEET_EXACT_ID_REFERENCE_SCAN`.
- Exact TEST identity, manifest cross-check, exact 4/3/7 allowlist, all-tab schema coverage, target-row counts and no-dependency checks all passed.
- All 23 current Spreadsheet tabs were enumerated and readable.
- Exact target rows: Assignments 4, Groups 3, GroupMembers 7; unexpected references: 0.
- AuditLogs: 19 matches classified `PRESERVE_AUDITLOG`; current AuditLogs count 68; disposition `PRESERVE_ALL`.
- Dependency-related sheets (Submissions, SubmissionFiles, Grades, GradeHistory, GradeReviewRequests and NotificationLogs) were readable and had zero data rows at scan time.
- Scan was read-only: writesExpected=0, externalCallsExpected=0. Owner-provided runtime evidence; no independent GAS execution access.

### Preview v1.2
- Added `docs/SNC_SYNTHETIC_FIXTURE_CLEANUP_PREVIEW_v1.2_2026-11-23.md` on `development`.
- Carries forward the exact 14-ID allowlist and exclusions from v1.1; updates PG-09 with the 23-tab scan evidence and requires an immediate pre-deletion repeat scan.
- All 68 AuditLogs, Core Fixture, Script Properties/manifests, triggers, deployments, LINE bindings, Drive files and all non-allowlisted rows remain excluded and preserved.
- Proposed exact-ID order remains GroupMembers → Groups → Assignments, with fail-closed checks and post-operation reconciliation.

### Safety state
- PG-09 point-in-time scan gate: **PASS**.
- Preview review: pending owner review.
- Explicit cleanup authorization: **NOT GRANTED**.
- Cleanup utility: **NOT IMPLEMENTED**.
- Cleanup status: **NOT STARTED**. No rows/files/properties/triggers/deployments were changed by this work package.- Do not run any cleanup function. A separate explicit authorization and a fresh final read-only dry-run are required before any deletion.


## Owner approval — exact 14-row cleanup scope — 23 Nov 2026

- Owner explicitly approved the deletion **scope** documented in `SNC_SYNTHETIC_FIXTURE_CLEANUP_PREVIEW_v1.2_2026-11-23.md`: exactly 4 Assignment rows, 3 Group rows and 7 GroupMember rows (14 exact primary IDs).
- Scope approval is recorded as an owner decision; it does not authorize execution.
- No additions, substitutions, predicate-based deletion, or expansion to Core Fixture, AuditLogs, Drive files, Script Properties, triggers, deployments, LINE bindings, or any non-allowlisted records are approved.
- Next gate: prepare a fresh, read-only final dry-run against the exact TEST Spreadsheet immediately before any proposed cleanup. It must revalidate TEST identity, all 14 exact IDs and unique row matches, all-sheet references (PG-09), all exclusions and AuditLog preservation.
- **Explicit execution authorization: NOT GRANTED.**
- **Cleanup utility: NOT IMPLEMENTED. Cleanup: NOT STARTED.** No data was deleted or modified.


## Final cleanup dry-run utility prepared — 23 Nov 2026

- Added `backend/tests/SNC_FinalCleanupDryRun_READONLY_TEST.gs` v1.0.0.
- Added design/run record `docs/SNC_FINAL_CLEANUP_DRY_RUN_READONLY_v1.0.0_2026-11-23.md`.
- Utility is read-only: no writes, external calls, handler calls, Drive/LINE/UrlFetch, triggers, cleanup, or deletion.
- Exact allowlist remains 4 Assignment + 3 Group + 7 GroupMember IDs from Preview v1.2; manifest cross-check required.
- Checks TEST identity, core/Assignment/Group/continuation manifests, preserved historical ASG-13 FAIL, all-sheet exact-token scan, exact row resolution and metadata, relationships, Submissions dependencies, AuditLogs baseline/delta/event matrix, and baseline-ID exclusion.
- Output always forces `cleanupAuthorized=false` and `deletionPerformed=false`.
- AuditLogs limitation explicitly reported: current 49 baseline IDs + 19 post-baseline IDs and event matrix are checked, but no prior full-row snapshot exists to prove historical cell-by-cell immutability.
- PG-12 backup/recovery remains a separate owner prerequisite; this read-only utility does not test backup access or restore.
- Owner must add only the utility file to TEST GAS and run only `SNC_FinalCleanupDryRun_READONLY_TEST()`; return the complete `SNC_FINAL_CLEANUP_DRY_RUN=` log line.
- Current gate: **OWNER RUNTIME RESULT PENDING**. Even after PASS, separate explicit cleanup execution authorization is required.
- Cleanup implementation: **NOT CREATED**. Cleanup status: **NOT STARTED**. No rows modified or deleted.

- Final static review refinement: membership flag comparison uses the same non-empty truthiness semantics as the existing inventory/reconciliation utilities (including date-backed LeftAt values). Latest utility blob SHA: `86625749e759cbadaedc303433d32a4e075ac44e`.


## Final cleanup dry-run — owner runtime PASS — 23 Nov 2026

Owner supplied the complete GAS Execution Log for `SNC_FinalCleanupDryRun_READONLY_TEST()` v1.0.0.

- Runtime status: **PASS**, 15 PASS / 0 BLOCKED.
- Evidence level: `FINAL_READ_ONLY_PRE_CLEANUP_DRY_RUN`.
- TEST identity: PASS; exact configured and active TEST Spreadsheet matched.
- Manifests and continuation state: PASS; historical ASG-13 FAIL preserved.
- Exact allowlist: PASS; exactly 4 Assignments, 3 Groups, 7 GroupMembers.
- All 23 tabs readable; exact-ID/composite-reference scan found 0 unexpected references.
- All 14 target IDs resolve exactly once; record metadata and relationships match Preview v1.2.
- Submissions: 0 rows; no candidate references.
- AuditLogs: 68 unique IDs; all 49 baseline IDs present; 19 post-baseline IDs present; event matrix and candidate entity links pass. Preserve all 68.
- Core fixture: 6 synthetic users and approved CourseOffering retained.
- Runtime flags: `writesExpected=0`, `externalCallsExpected=0`, `cleanupAuthorized=false`, `deletionPerformed=false`.
- Limitations remain: no prior full-row AuditLogs snapshot exists to prove historical cell-by-cell immutability; PG-12 backup/recovery access is not tested by this utility and remains a separate owner prerequisite.
- **Decision:** Final read-only dry-run passed at the time of owner execution. This does not authorize deletion. Cleanup implementation remains not created; cleanup remains **NOT STARTED**; no records were modified or deleted.
- Next gate: owner must separately provide explicit cleanup execution authorization after reviewing the PASS result and confirming the PG-12 backup/recovery prerequisite. Until then, do not implement or execute deletion.


### Owner confirmation — PG-12 backup/recovery readiness — 23 Nov 2026

- Owner stated: **“พร้อมใช้งาน”** in response to the outstanding TEST Spreadsheet Backup/Recovery readiness prerequisite.
- Record this as **OWNER-CONFIRMED AVAILABLE**, not independently verified by the assistant.
- This confirmation closes the owner-readiness response for PG-12; it does not change the 14-row allowlist or grant cleanup execution authorization.
- Final dry-run remains PASS (15/15). Cleanup implementation remains not created; cleanup remains **NOT STARTED**; no records have been modified or deleted.
- **Separate explicit cleanup execution authorization is still required** before any deletion code is prepared or run.


## Owner authorization — exact 14-row TEST cleanup — 23 Nov 2026

- Owner explicitly authorized cleanup of the 14 exact records in Preview v1.2. Scope is unchanged: 4 Assignments, 3 Groups, 7 GroupMembers; TEST Spreadsheet only.
- PG-12 backup/recovery readiness: owner-confirmed available (not independently verified).
- Added `backend/tests/SNC_ApprovedCleanup_EXACT14_TEST.gs` v1.0.0; commit: `84a7dcbd32830f1f9743b5affacc0855f32fc975`.
- Entry point: `SNC_ExecuteApprovedCleanup_TEST('EXECUTE SNC CLEANUP EXACT 14 ROWS TEST 2026-11-23')`.
- Utility requires exact TEST Script Properties/active Spreadsheet, re-runs `SNC_FinalCleanupDryRun_READONLY_TEST()` immediately before mutation, and requires all checks PASS.
- Controlled exact-ID delete order: GroupMembers 7 → Groups 3 → Assignments 4. Verifies non-target rows in all three tables and compares the complete AuditLogs data grid before/after. No cascade, broad predicate, or other resource mutation.
- Owner must add only this new utility file to the existing TEST GAS project and run the entry point above. Assistant cannot execute GAS runtime.
- **Current status: UTILITY COMMITTED; OWNER GAS EXECUTION PENDING; CLEANUP NOT YET VERIFIED.** No deletion is claimed. If result is PARTIAL_STOP/ABORTED/error, do not rerun; share full log for reconciliation.


## Owner GAS cleanup invocation — confirmation guard aborted safely — 24 Nov 2026

- Owner supplied Execution Log for `SNC_ExecuteApprovedCleanup_TEST` v1.0.0, Preview v1.2.
- Runtime result: `ABORTED_CONFIRMATION_REQUIRED`; reason: `Exact execution phrase did not match.`
- No deletion occurred: GroupMembers/Groups/Assignments arrays all empty; `cleanupAuthorized=false`; `deletionPerformed=false`.
- This abort occurred at the initial confirmation-phrase guard, before TEST identity checks, fresh dry-run, or any mutation.
- No recovery is required. A new invocation may be attempted only with the exact phrase embedded in the utility: `EXECUTE SNC CLEANUP EXACT 14 ROWS TEST 2026-11-23`.
- Do not change the allowlist or utility. If the next execution returns anything other than a complete verified result, stop and provide the full log for reconciliation.


## Post-cleanup read-only verification prepared — 24 Nov 2026

- Owner supplied the GAS Execution Log for `SNC_ExecuteApprovedCleanup_TEST` v1.0.0.
- The log reports `status=COMPLETE`: exactly 7 GroupMembers, 3 Groups and 4 Assignments deleted (14 total); AuditLogs remained 68 rows with `fullGridUnchanged=true`; non-target rows in all three target tables were preserved; Core Fixture was preserved.
- The same Execution Log contains a subsequent `ABORTED_CONFIRMATION_REQUIRED` record with empty deletion arrays and `deletionPerformed=false`. This is a separate unsuccessful invocation after the completed run and does not undo the earlier COMPLETE result.
- Added `backend/tests/SNC_PostCleanupVerification_READONLY_TEST.gs` v1.0.0.
  - Commit: `e51272a60123a2c3ec0642b3cde272348a5db1be`.
  - Function: `SNC_PostCleanupVerification_READONLY_TEST()`.
  - Verifies exact TEST identity, all 23 tabs, absence of all 14 approved IDs outside AuditLogs, zero remaining Group/GroupMember rows, preserved manifests/core Users/Enrollments/CourseOffering, and AuditLogs 68 unique IDs (49 baseline + 19 post-baseline) with expected event matrix/entity links.
  - Read-only only: writesExpected=0, externalCallsExpected=0; no cleanup, deletion, mutation, handlers, Drive, LINE, UrlFetch, triggers or deployment.
- Added `sport-nutrition-classroom/docs/SNC_POST_CLEANUP_VERIFICATION_READONLY_v1.0.0_2026-11-24.md` with design, safety constraints, evidence boundary and owner run instructions.
- **Runtime status: PENDING OWNER GAS EXECUTION.** No runtime PASS is claimed. Owner should add only the new verifier file to the existing TEST GAS project and run only `SNC_PostCleanupVerification_READONLY_TEST()`; share the complete `SNC_POST_CLEANUP_VERIFICATION=` log.
- Do not rerun cleanup or restart Integration Test until the read-only post-cleanup verification returns PASS and its evidence is reviewed.


## Owner runtime — post-cleanup verification PASS — 24 Nov 2026

Owner supplied the GAS Execution Log from 06:27:28–06:27:44.

### Evidence from this execution
- `SNC_FinalCleanupDryRun_READONLY_TEST()` v1.0.0 returned `REQUIRES_REVIEW` (6 PASS / 2 BLOCKED):
  - `PG-09-TARGET-ROWS` observed Assignments=0, Groups=0, GroupMembers=0 for the 14 allowlisted target records.
  - `PG-05-UNIQUE-ROWS` was BLOCKED because the 14 exact IDs no longer resolve to one row each.
- The subsequent `SNC_ExecuteApprovedCleanup_TEST()` invocation stopped safely with `ABORTED_FINAL_DRYRUN_FAILED`; its deletion arrays were empty, `cleanupAuthorized=false`, and `deletionPerformed=false`. **No deletion occurred during this invocation.**
- `SNC_PostCleanupVerification_READONLY_TEST()` v1.0.0 returned **RUNTIME PASS, 8 PASS / 0 BLOCKED**:
  - Exact TEST identity and all 23 tabs passed.
  - All 14 approved IDs absent from every non-AuditLogs tab.
  - No allowlisted Assignment/Group/GroupMember IDs remain; Groups=0 rows and GroupMembers=0 rows.
  - Assignments sheet has 20 rows remaining; none of the four allowlisted Assignment IDs remains.
  - Core fixture preserved: six synthetic Users, six Enrollments, and one exact CourseOffering.
  - AuditLogs: 68 unique rows; all 49 baseline IDs and 19 post-baseline events present; schema, event matrix and entity links pass.
  - Submissions rows=0.
  - `writesExpected=0`, `externalCallsExpected=0`, `deletionPerformed=false` for the verifier.
- Historical ASG-13 remains `FAIL_PRESERVED`; continuation marker remains `COMPLETE_WITH_HISTORICAL_FAILURE`.

### Interpretation and disposition
- Current persisted TEST state satisfies the read-only post-cleanup verification criteria for the exact 14-row scope.
- The 06:27 cleanup invocation did **not** perform deletion; it correctly refused because the target rows were already absent. This log alone does not establish which earlier operation removed them. The post-cleanup verifier establishes their current absence and preservation checks, while the earlier successful cleanup execution log (if retained) is needed to attribute the deletion operation itself.
- The final pre-cleanup dry-run is now expected to fail its target-row-presence checks because the target rows are already absent. Do not rerun cleanup or attempt to recreate targets.

## CHAT HANDOFF — SPORT NUTRITION CLASSROOM — 24 Nov 2026

### Current authoritative project position
- Repository: `worrawutt-source/worrawutsportsci`; work branch remains `development` only. Do not modify `main` or production.
- Approved baseline remains DOC-01 v1.0, DOC-02 v1.1, DOCS v1.3 and SNC-WG-001 v1.0.0. DOC-03..DOC-08 remain drafts/pending and must not override approved requirements.
- Core synthetic fixture and Assignment/Group integration work have been completed to the documented scope. The continuation runner recorded 9/9 PASS; independent terminal reconciliation v1.0.1 recorded 10/10 PASS.
- Historical ASG-13 failure from the original Assignment/Group runner remains preserved as historical evidence. The narrowly scoped CLOSED Assignment edit guard was implemented in `backend/AssignmentManagement.gs`; the owner-run focused regression returned RUNTIME PASS: expected/actual `CONFLICT`, Assignment unchanged, AuditLog IDs unchanged. Do not erase or rewrite the historical failure.
- Group submission-lock behavior remains untested/deferred. The Assignment/Group handler-level integration evidence is not Web App E2E/UAT.
- Exact 14-row synthetic Assignment/Group cleanup scope was approved and execution authorization was separately granted for TEST only. The exact scope was 4 Assignments, 3 Groups and 7 GroupMembers. All AuditLogs, Core Fixture, baseline/non-allowlisted rows, Drive files, Script Properties/manifests, triggers, deployments and LINE bindings are excluded and preserved.

### Latest owner-supplied GAS log — 24 Nov 2026, 06:27:28–06:27:44
- `SNC_FinalCleanupDryRun_READONLY_TEST()` v1.0.0 returned `REQUIRES_REVIEW`, 6 PASS / 2 BLOCKED, because all 14 approved target IDs were already absent (Assignments=0 target rows, Groups=0, GroupMembers=0; exact unique-row resolution failed).
- The cleanup invocation in this log returned `ABORTED_FINAL_DRYRUN_FAILED`. Deletion arrays were empty; `cleanupAuthorized=false`; `deletionPerformed=false`. **This invocation performed no deletion. Do not rerun cleanup or recreate the target rows.**
- `SNC_PostCleanupVerification_READONLY_TEST()` v1.0.0 returned **RUNTIME PASS, 8 PASS / 0 BLOCKED**. This is owner-supplied GAS runtime evidence for current-state verification only.
- Verified current state: all 23 tabs readable; all 14 approved IDs absent from every non-AuditLogs tab; 20 other Assignment rows remain; Groups=0; GroupMembers=0; Submissions=0; six synthetic Core Users and six Enrollments plus the CourseOffering remain; AuditLogs=68 unique rows (49 baseline + 19 post-baseline), schema/event matrix/entity links reconcile.
- Verifier flags: `writesExpected=0`, `externalCallsExpected=0`, `deletionPerformed=false`. Historical ASG-13 remains `FAIL_PRESERVED`; continuation status remains `COMPLETE_WITH_HISTORICAL_FAILURE`.
- **Evidence boundary:** this latest 06:27 log proves the 14 records are absent now and that the read-only verifier passed. It does not identify which earlier operation removed them. The cleanup invocation shown in this log did not delete them. Do not claim that this specific invocation completed cleanup.
- No evidence from this log establishes Web App E2E/UAT, Submission integration, backup restoration, or full system regression.

### Relevant source files and evidence records
- Assignment handler fix: `backend/AssignmentManagement.gs`, commit `5c9dbce6e916ba28c0431279b92284e322dbdb35`, blob `460c7a0eb244fa5a85239d0e2f531404d58601d8`.
- Focused regression: `backend/tests/SNC_AssignmentClosedEditRegression_TEST.gs`, commit `c95873684d246ae84dc0dc2666ba9e6969033806`; owner runtime PASS.
- Assignment/Group continuation runner: `backend/tests/SNC_GroupContinuation_GR07_12_TEST.gs`, commit `6b035995645ffa87d0333654d8d1e3e4fb4fc935`; owner runtime 9/9 PASS.
- Terminal reconciliation: `backend/tests/SNC_GroupContinuationTerminalReconciliation_READONLY_TEST.gs`, v1.0.1, commit `bff6dc3241766c4137df5f63c70eefed00b03560`; owner runtime 10/10 PASS.
- Final post-cleanup verifier: `backend/tests/SNC_PostCleanupVerification_READONLY_TEST.gs`, v1.0.0, commit `e51272a60123a2c3ec0642b3cde272348a5db1be`.
- Post-cleanup verification design/evidence: `docs/SNC_POST_CLEANUP_VERIFICATION_READONLY_v1.0.0_2026-11-24.md`, commit `b07e4b9bd2ed5ce46bb88336f281338aaf7de5ae`.
- Exact 14-row approved scope is documented in `docs/SNC_SYNTHETIC_FIXTURE_CLEANUP_PREVIEW_v1.2_2026-11-23.md`. Approval of scope and execution authorization do not change the rule that no cleanup rerun is permitted after the current targets are absent.
- Current TEST Spreadsheet: `SportNutritionApp`, ID `1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk`. TEST Script Properties: `SNC_ITR_ENVIRONMENT=TEST`; `SNC_ITR_TEST_SPREADSHEET_ID` set to the same ID. Never expose synthetic IDs unnecessarily or use real student data.

### Next stage — Submission Integration (NOT STARTED)
Proceed only with the established workflow: **inspect current source → prepare a test design/plan → present for owner approval → implement approved test utilities → owner executes in GAS → reconcile evidence → update this handoff**.
1. First inspect the current `development` versions of Submission/File/Grading/Notification handlers and the existing schemas/contracts. Do not rely on stale blob SHAs; re-fetch current source before analysis.
2. Review approved DOC-01/DOC-02/DOCS v1.3 and the current test plan. Do not infer pending DOC-03..DOC-08 requirements.
3. Design a narrowly scoped Submission Integration test plan, including authorization, individual submission, group submission/submitter identity, duplicate/idempotency behavior, status transitions, group lock behavior, file staging/commit boundary, audit events, failure recovery and exact cleanup/reconciliation.
4. Clearly separate handler-level tests from Web App/API E2E. Include no real Drive uploads, notifications, LINE calls, triggers, or external side effects unless separately designed and explicitly approved.
5. Use synthetic data only. Preserve Core Fixture and all baseline records. Any new persistent fixture or cleanup scope requires a separately reviewed exact-ID plan and explicit owner approval.
6. Do not implement or run Submission tests until the owner approves the test design and mutation scope.

### Hard safety constraints carried into the new chat
- Do not rerun the original Assignment/Group persistent runner, continuation runner, cleanup utility, or recreate the 14 deleted target records.
- Do not run migrations, setup, triggers, LINE push, deployment, broad deletion, or mutate production/main.
- Do not write directly to Sheets to bypass application business handlers, except an explicitly approved cleanup utility with exact-ID guards.
- Never claim a GAS runtime result unless the owner supplies its Execution Log. Label evidence as owner-confirmed, static inspection, or owner-run runtime.
- After each work package, update `sport-nutrition-classroom/docs/handoff/CURRENT.md` on `development`.
- The assistant cannot execute Apps Script; the owner copies approved code into GAS and supplies sanitized Execution Logs.

### New-chat resume instruction
Start by reading this `CURRENT.md` on branch `development`, then inspect the latest Submission-related source files and approved design documents. The immediate task is to **prepare the Submission Integration test plan for review only**. Do not start implementation or run tests before owner approval.

## Submission Integration — test plan prepared for owner review — 24 Nov 2026

- Re-inspected current GitHub `development` source before planning. Current blobs:
  - `SubmissionManagement.gs`: `ef4b86678e8c1feeea425ba578501846129a229c`
  - `FileManagement.gs`: `86cd29160dd00207c9a575ce801da09e643911cb`
  - `GroupManagement.gs`: `9dc280d88bcee8e346d028082cae725fe2d88ee8`
  - `AssignmentManagement.gs`: `460c7a0eb244fa5a85239d0e2f531404d58601d8`
  - `Code.gs`: `7c9928f7ae269287d1537dec6256dce13783d26d`
  - `GradingManagement.gs`: `12bd34c5dd857250c7d6ccd76e28b5da7f4507f8`
  - `NotificationManagement.gs`: `875b60d90f4599ee0f9bdf0f60dcea31e215de7b`
- Reviewed approved DOC-01 v1.0 and DOC-02 v1.1 from the supplied DOCS v1.3 package, approved DOCS v1.3 CR-001 amendment, SNC-WG-001, existing synthetic fixture plan, and Assignment/Group integration design. Pending DOC-03..DOC-08 drafts were not used to override approved requirements.
- Created `docs/SUBMISSION_INTEGRATION_TEST_PLAN_v1.0_DRAFT_2026-11-24.md` on `development`; commit `c7a147b5949943ac565304a9a45c415fa2f7a6dd`.
- Plan proposes WP-SUB-0 read-only readiness; WP-SUB-1 handler-level Submission Integration (Individual/Group, member limits, leader authorization, per-group lock, revision chain, idempotency, late status, URL attachments, audit, notification stub and controlled rollback); WP-SUB-2 separately gated Drive upload/access; WP-SUB-3 separately gated deployed TEST API/LIFF/Browser E2E.
- The plan explicitly preserves the six synthetic Core Fixture users/enrollments/offering and AuditLogs; does not recreate the 14 removed target rows; requires new fixtures through business handlers and exact-ID manifest; no direct Sheet fixture writes.
- Owner decisions requested: WP-SUB-1 scope and exact fixture boundary, URL-only attachment scope, controlled in-memory failure injection, mandatory notification stub/zero external calls, and separate cleanup approval.
- **Current status: PLAN DRAFTED — OWNER REVIEW/APPROVAL PENDING.** No runner/test code created, no GAS functions executed, no fixtures created, no Spreadsheet/Drive/LINE/trigger/deployment/migration/cleanup actions performed.
- Next action: owner reviews the plan and responds with approval/amendments. Only after approval may the implementation work package begin. The Assistant must re-fetch current source and verify TEST GAS synchronization before implementation.

## Submission Integration — owner approval and WP-SUB-0 preflight prepared — 24 Nov 2026

- Owner approved the Submission Integration Test Plan v1.0 and all six decisions on 24 Nov 2026:
  1. WP-SUB-1 handler-level integration scope.
  2. Synthetic fixture topology: Alpha (2), Beta (3), Solo (1), Individual Assignment and Group Assignments (max 3, max 2, no max).
  3. WP-SUB-1 attachment scope limited to Google Drive/Docs URL metadata; binary upload/Drive permission testing remains separately gated as WP-SUB-2.
  4. Controlled in-memory Audit Append failure injection, with restoration and exact rollback verification; BLOCKED if safe restoration cannot be established.
  5. Mandatory in-memory `notifySubmissionReceived_` stub and zero LINE/UrlFetch/external calls.
  6. No cleanup authorization; cleanup requires a separate exact-ID preview and explicit authorization.
- Plan updated to owner-approved status: `docs/SUBMISSION_INTEGRATION_TEST_PLAN_v1.0_DRAFT_2026-11-24.md`; commit `c781cd9a2cda5781878a439815962f65d4ff8c5b`.
- Re-fetched current `development` source and inspected schema. Correct schema headers were checked against `backend/setup.gs`; Users, UserRoles, CourseOfferings, Enrollments, Assignments, Groups, GroupMembers, Submissions, SubmissionFiles, IdempotencyKeys and AuditLogs are included in the read-only preflight.
- Created WP-SUB-0 preflight:
  `backend/tests/SNC_SubmissionIntegrationPreflight_READONLY_TEST.gs`, version 1.0.0.
  - Initial commit `e4d0894c03c732bd3ae7a3964408be10e2b4e751`; schema-alignment fix commit `302e2f739c7abc751187d77af38c292d19300b84`; latest blob SHA `31da4a63144f7a2204882f21bbc6ea37d3b493d1`.
  - Read-only checks: exact TEST identity, Core Fixture manifest, no prior Submission Integration manifest, exact required headers, active offering, six active users/enrollments, existing active SYSTEM_ADMIN role, handler/hook availability, reserved-prefix collision, no existing Core Fixture submissions, and unique AuditLog IDs.
  - Reports expected GitHub development blob SHAs for owner comparison. It cannot inspect GAS editor source itself.
- **Current status: WP-SUB-0 SOURCE PREPARED — OWNER SOURCE-SYNC CONFIRMATION AND READ-ONLY GAS PREFLIGHT PENDING.** No Submission handler, fixture creation, Drive upload, LINE, trigger, migration, deployment or cleanup was run.
- Next step: owner syncs the preflight file into TEST GAS and confirms the listed backend source files match the expected development versions; then runs only `SNC_SubmissionIntegrationPreflight_READONLY_TEST()` and shares the complete sanitized Execution Log. If READY, prepare WP-SUB-1 persistent runner; if BLOCKED, resolve only the reported readiness issue before any mutation.



## WP-SUB-0 runtime READY and WP-SUB-1 runner prepared — 24 Nov 2026

### Owner confirmation and WP-SUB-0 evidence
- Owner confirmed all five TEST GAS backend source files match the expected development blob SHAs recorded in the approved Submission Integration plan.
- Owner supplied the Execution Log for SNC_SubmissionIntegrationPreflight_READONLY_TEST(): status READY, 12 PASS / 0 BLOCKED; writesExpected=0; externalCallsExpected=0.
- Checks passed: exact TEST identity, Core Fixture manifest, no prior Submission Integration manifest, all required schemas, active Offering, six active Users and Enrollments, existing active SYSTEM_ADMIN, required handlers, reserved prefix unused, no existing Core Fixture Submissions, and unique AuditLog IDs.
- Baseline counts: Users 24; Enrollments 6; Assignments 20; Groups 0; GroupMembers 0; Submissions 0; SubmissionFiles 0; IdempotencyKeys 0; AuditLogs 68.
- WP-SUB-0 status: OWNER-RUN RUNTIME READY — 12/12 PASS.

### WP-SUB-1 implementation source
- Added backend/tests/SNC_SubmissionIntegrationRunner_TEST.gs v0.1.0.
- Latest blob SHA: a8e9864f88b18c368a689432535096c902dff583.
- Commit chain includes initial runner commit 6547a77b1d4a3407fd886faa804c442279b557bd and subsequent hardening; final runner SHA above.
- Added docs/SNC_SUBMISSION_INTEGRATION_RUNNER_v0.1.0_2026-11-24.md; commit c14e47cc00ba611d165fa7046bbe15d6c8ff1f65.
- Updated approved plan with WP-SUB-0 owner runtime evidence and WP-SUB-1 implementation checkpoint; plan commit 26a27d3a886ab3655179660e72d341139183a904.
- Static inspection: SUB-01..SUB-26 present; exact TEST guard, persistent manifest, immediate fixture ID capture, dual in-memory stubs for notifyAssignmentOpened_ and notifySubmissionReceived_ installed before any Assignment opens and restored, controlled in-memory Audit append failure injection, and terminal reconciliation present. No direct Sheet mutation, DriveApp/UrlFetch/network, trigger, deployment, cleanup or broad deletion calls.
- Runner fixture scope: existing six synthetic Core users/offering/enrollments only; creates Alpha(2), Beta(3), Solo(1) and the approved Individual/Group Assignment test set via application handlers. URL metadata only; no binary upload.
- Read-only runner preflight: SNC_SubmissionIntegrationRunnerPreflight_TEST().
- Persistent runner: SNC_RunSubmissionIntegration_CONFIRMED_TEST('RUN SNC SUBMISSION INTEGRATION WP-SUB-1 2026-11-24').
- Read-only manifest summary: SNC_SubmissionIntegrationManifestSummary_READONLY_TEST().
- Exact confirmation phrase: RUN SNC SUBMISSION INTEGRATION WP-SUB-1 2026-11-24.
- Manifest key: SNC_SUBMISSION_INTEGRATION_MANIFEST_TEST.
- **Current status: WP-SUB-1 SOURCE PREPARED — STATIC REVIEW COMPLETE — OWNER GAS PREFLIGHT PENDING.** Runner has not been copied into GAS or executed. No WP-SUB-1 runtime result is claimed.
- Owner next action: add only the runner file to TEST GAS; run SNC_SubmissionIntegrationRunnerPreflight_TEST(); share the full sanitized log. Proceed to persistent run only if READY. Execute persistent runner once only. If interrupted or stopped, do not rerun; share logs and reconcile manifest first.
- WP-SUB-2 Drive upload/access, WP-SUB-3 deployed API/LIFF/Browser E2E, and cleanup remain outside this authorization. No cleanup is authorized.


### WP-SUB-1 dual notification-stub safety correction — 24 Nov 2026
- Static source inspection of NotificationManagement.gs found notifyAssignmentOpened_() is called by assignment.open and can invoke ntSend_(), which may call LINE UrlFetch and write NotificationLogs.
- Earlier Runner version stubbed only notifySubmissionReceived_ after Assignment creation/opening. That was insufficient to guarantee the approved no-LINE/no-external-side-effect boundary.
- Updated Runner now stubs BOTH notifyAssignmentOpened_ and notifySubmissionReceived_ before the first Assignment is created/opened; restores both original function references in normal completion and error recovery.
- SUB-24 verifies six assignment-open stub calls, one or more submission-received stub calls, and restoration of both hooks.
- Corrected a SUB-18 test actor collision: SUB-18 now uses a different student than SUB-17 so its first request reaches creation and the second changed-payload replay can test CONFLICT rather than fail early as DUPLICATE.
- Latest Runner blob SHA: a8e9864f88b18c368a689432535096c902dff583.
- Updated runner design document commit: 7effe3a8172bc2cde81f27684eba2c55cfaaa007.
- Updated plan commit: b8f1d89ab17f5fc5ba549d1441161ba8053039eb.
- Earlier user-run Runner Preflight READY (7/7) predates these source corrections and does NOT validate the latest Runner revision.
- **Current status: WP-SUB-1 LATEST SOURCE STATIC REVIEW COMPLETE — FRESH OWNER READ-ONLY PREFLIGHT REQUIRED — PERSISTENT RUN NOT STARTED.**
- Owner action: sync latest runner blob SHA a8e9864f88b18c368a689432535096c902dff583, run SNC_SubmissionIntegrationRunnerPreflight_TEST() again, and share the complete sanitized Execution Log. Only if READY may the persistent runner be run once.


## WP-SUB-1 Summary Output Bug Fix — 24 Nov 2026

- Owner confirmed the GAS editor had the Submission Integration Runner file selected when the 10:01 execution log showed only Cleanup output. Do not attribute the log to a wrong function selection without execution-history evidence.
- Static inspection of the latest development Runner found a confirmed terminal Summary bug: the output object referenced `manifest.notificationStub.calls.length`, but the persisted Manifest schema stores calls in `manifest.notificationStub.submissionCalls` and `assignmentOpenCalls`. This would throw after the test cases and terminal reconciliation had run, then route execution into STOPPED_REQUIRES_RECONCILIATION despite the Summary-only defect.
- Minimal fix applied: Summary now reads `manifest.notificationStub.submissionCalls.length`. No test logic, expected results, fixture topology, cleanup behavior, or authorization boundary changed.
- Runner commit: `622cbcb20e2550b6b3d1224bc71e0a171888dac6`; updated Runner blob SHA: `837c893e8bfeb3fe835f35e93766e33add0addc8`.
- Runner design document updated to reference the corrected Runner SHA; commit `bc156492e9be5771a5121dd85dc245b3f97a9945`.
- **Current status: SUMMARY BUG FIXED IN DEVELOPMENT — FRESH OWNER READ-ONLY PREFLIGHT REQUIRED — PERSISTENT RUN NOT AUTHORIZED UNTIL MANIFEST RECONCILIATION.** The earlier 7/7 READY result predates this fix and does not validate the corrected source. The 10:01 log contains Cleanup output only and does not establish whether the Persistent Runner began or whether a Submission manifest was created.
- Owner next action: first run only `SNC_SubmissionIntegrationManifestSummary_READONLY_TEST()` to establish whether a prior Manifest exists. If `NO_MANIFEST`, sync corrected Runner SHA `837c893e8bfeb3fe835f35e93766e33add0addc8`, run `SNC_SubmissionIntegrationRunnerPreflight_TEST()`, and share the complete log. Do not run the Persistent Runner until the manifest state is reconciled and a fresh preflight is READY.
- Cleanup remains unauthorized; do not rerun Cleanup, recreate the earlier 14 cleanup targets, or delete any Submission Integration records.


## WP-SUB-1 GAS Editor entrypoint defect — 24 Nov 2026

- Owner-provided evidence: the Executions page shows `SNC_RunSubmissionIntegration_CONFIRMED_TEST` invoked as Type=Editor, Status=Completed, duration 8.118 s at 10:14:31. The subsequent read-only manifest summary at 10:21 returned `NO_MANIFEST`.
- Source root cause identified: the persistent entry point required a `confirmationPhrase` argument and returned `ABORTED_CONFIRMATION_REQUIRED` without logging when the argument was absent. The GAS Editor Run action invokes the selected function without a way to supply that argument. This explains the Completed execution with no manifest and no Submission Integration log.
- Minimal source correction: public `SNC_RunSubmissionIntegration_CONFIRMED_TEST()` is now a zero-argument Editor entry point that delegates to `snsiRunSubmissionIntegration_(SNC_SUB_INT_CONFIRM_)`. The exact previously owner-approved confirmation phrase remains bound internally. The wrapper logs a start marker; any internal confirmation abort logs an explicit abort marker. Test cases, fixture topology, handler calls, and cleanup boundary are unchanged.
- Corrected Runner commit: `41859f6b3d4bf04ec532d85ff775191c03eeabbb`; latest Runner blob SHA: `6fd1d994e36b6d16b9019e9e9c0cf9be87a632b7`.
- Runner design document updated for zero-argument Editor invocation; commit `4032421f108d2b41ad081dd305aad78bb2e86b5f`.
- Cloud Logs for 10:14 and 10:21 show Cleanup messages interleaved with Editor execution logs, but the supplied excerpts do not identify the originating execution ID. Do not attribute Cleanup execution to the Submission Runner. The visible Executions list also shows time-driven `runAssignmentScheduler` entries overlapping these timestamps. Current GitHub `AssignmentManagement.gs` implementation returns immediately with `disabled:true` and contains no cleanup calls; therefore the precise source of the Cleanup logs remains unverified and must be isolated by opening each Execution row's own details/logs.
- Cleanup outputs show `deletionPerformed=false`; no cleanup rerun is authorized or needed.
- **Current status: EDITOR ENTRYPOINT BUG FIXED ON DEVELOPMENT — NO SUBMISSION MANIFEST EXISTS — FRESH GAS SOURCE SYNC AND READ-ONLY PREFLIGHT REQUIRED. Persistent run has not yet begun.**
- Owner next action: sync corrected Runner blob SHA `6fd1d994e36b6d16b9019e9e9c0cf9be87a632b7` into TEST GAS; run only `SNC_SubmissionIntegrationRunnerPreflight_TEST()`; share the full log. If READY, the owner may then run the zero-argument `SNC_RunSubmissionIntegration_CONFIRMED_TEST()` exactly once. Do not append a phrase in the Run UI; the wrapper supplies the approved phrase. If any manifest appears or execution is interrupted, do not rerun; reconcile first.
- No WP-SUB-1 business-handler test cases have been run. WP-SUB-2, WP-SUB-3 and cleanup remain separately gated.


## WP-SUB-1 owner-run result and read-only post-run reconciliation — 24 Nov 2026

### Owner runtime evidence received
- Owner ran the persistent WP-SUB-1 runner in TEST GAS.
- Execution output: `COMPLETE_WITH_REVIEW_ITEMS`, 26 cases, 26 PASS, 0 FAIL.
- Recorded created counts: Groups 3; GroupMembers 7; Assignments 6; Submissions 12; SubmissionFiles 2; IdempotencyKeys 12; AuditLogs 34.
- Both notification stubs were restored; submission stub calls 12; external calls expected 0.
- Read-only Manifest Summary repeated the same status/counts and confirmed `cleanupStatus=NOT AUTHORIZED`.
- A separate/interleaved Cleanup log reported a lock timeout. It also reported no deletion; it is not evidence of a WP-SUB-1 failure. Do not rerun Cleanup.
- `COMPLETE_WITH_REVIEW_ITEMS` is the runner's generic no-failure terminal label; it does not establish that a populated review-items list exists.
- The Manifest Summary does not expose Primary IDs or compare every baseline ID with current TEST rows; formal post-run reconciliation is therefore still pending.

### Read-only reconciliation source added
- Added `backend/tests/SNC_SubmissionPostRunReconciliation_READONLY_TEST.gs`, version 1.0.0.
- Latest blob SHA: `be185e361947c301baa3b477d7e86682e154a0ce`.
- Added design/owner run instructions: `docs/SNC_SUBMISSION_POSTRUN_RECONCILIATION_v1.0.0_2026-11-24.md`.
- Reconciliation checks baseline-ID retention, exact post-baseline ID deltas against Manifest, duplicate IDs, the 68-ID AuditLog baseline, Group topology including Beta's temporary join/leave row, six Assignment relationships, Submission targets, SubmissionFile references, Submission Audit references, and notification-stub restoration.
- Output is count/Boolean only and does not log raw synthetic IDs.
- Read-only only: no Sheet or Script Properties writes, Drive, UrlFetch, LINE, triggers, migration, deployment, or cleanup.
- Evidence boundary: confirms IDs and relationships, not cell-by-cell immutability of historical baseline rows.

### Current status and owner action
- **WP-SUB-1 HANDLER RUN: OWNER-REPORTED 26/26 PASS.**
- **POST-RUN RECONCILIATION: SOURCE PREPARED — OWNER GAS RUN PENDING.**
- Owner syncs only the reconciliation file into the existing TEST GAS project, confirms the Runner source is still the approved blob SHA, then runs `SNC_SubmissionPostRunReconciliation_READONLY_TEST()` and supplies the complete sanitized Execution Log.
- Do not rerun the persistent Submission runner, cleanup, or make manual Sheet edits. WP-SUB-2 Drive upload/access and WP-SUB-3 deployed API/LIFF/Browser E2E remain separately gated.
