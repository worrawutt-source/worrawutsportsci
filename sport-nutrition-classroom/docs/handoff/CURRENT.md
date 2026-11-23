

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
