# SPORT NUTRITION CLASSROOM — Deep Source Difference Analysis

- Date: 22 November 2026 (Asia/Bangkok)
- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development`
- Source baseline: supplied `SNC_GAS_BACKUP_2026-11-22(2).zip`
- GitHub revision inspected: `development` HEAD `f4cc4c0c93fc9521ca3f6263e22ded3e68e2de32` (source blob SHAs below)
- Requirements baseline: DOCS v1.3; SNC-WG-001 v1.0.0
- Status: static source comparison; no GAS source synchronization or runtime tests

## 1. Executive conclusion

The six priority modules and the remaining seven backend modules have the same exported function-name inventory in the supplied GAS snapshot and GitHub source at the inspected revision. Their public action literal inventories also match for the modules with API actions. However, all 13 file-level Git blob hashes differ, and matching function names/action names do **not** establish equivalent implementation behavior.

The current comparison supports these conclusions:
- No exported function addition/removal was detected in the 13 backend modules.
- No action literal addition/removal was detected in the compared backend action handlers.
- The files are not byte-identical; internal function bodies, comments, validation, ordering, and/or formatting differ.
- A complete line-by-line semantic adjudication of every modified function is not yet established by this report. No claim of full semantic equivalence is made.
- Consequently, no backend file is approved for replacement in GAS at this stage.

This report deliberately distinguishes **confirmed static facts** from **risk-based review findings**. It does not infer the exact code change solely from a hash mismatch.

## 2. Six priority modules

### 2.1 Code.gs — API dispatcher and identity boundary

- GAS file: `Code.gs` (archive `code.txt`, 694 lines)
- GitHub file: `backend/Code.gs` (720 lines)
- GitHub blob: `b46be6a82576ae97e36afe4639a859c17ead94d9`
- Exported function inventory: same 31 functions in both sources.
- Action literals in the module: same six authentication actions: `auth.verify`, `auth.me`, `auth.requestLinkOtp`, `auth.linkStudent`, `auth.requestEmailChange`, `auth.confirmEmailChange`. The dispatcher also routes the other management action families to their handlers.

**GitHub source behavior observed:** the dispatcher validates the JSON envelope, bounds request ID/action strings, normalizes payload to an object, verifies LINE ID tokens before protected actions, resolves the linked user and effective roles for authentication responses, and routes course/semester/offering/instructor, import/enrollment, student, file, user/role, audit, notification, grade/review, submission, group, and assignment actions. Error responses use a common envelope and safe diagnostic logging; token-shaped values are redacted by the log sanitizer. LINE identity verification checks token length and delegates signature/audience/expiry verification to LINE's verify endpoint using the Script Property channel ID.

**Risk/decision:** this is the API and authentication boundary. The 26-line size increase alone does not identify which branches changed. Before release, compare the complete dispatcher, token verification, account linking, OTP, and audit functions. Verify every frontend/Worker caller still sends the same action names and payload keys, and that no ID token, OTP, email, or student data enters logs.

**GAS replacement:** `Code.gs` — **DO NOT REPLACE YET**.

### 2.2 setup.gs — schema and data initialization

- GAS file: `setup.gs` (archive `setup.txt`, 369 lines)
- GitHub file: `backend/setup.gs` (381 lines)
- GitHub blob: `10cd8a90a0631131268fec11d5bd011a46551644`
- Exported function inventory: same six functions in both sources.

**GitHub source responsibilities observed:** schema preflight/validation, account-linking sheet setup, blank-sheet detection, header formatting, staging import, and read-only schema inspection. This file is the schema authority used by the GAS runtime's `SNC_SETUP.TABLES` contract.

**Risk/decision:** a small header/table definition difference can cause data corruption or make a valid spreadsheet appear incompatible. The owner's read-only inspection returned schema version 1.5.0 and success=true against the designated TEST spreadsheet, but that verifies the schema expected by the executed inspector, not that two setup.gs versions are interchangeable. Compare every table name, header name/order, required sheet, schema version, migration precondition, and setup side effect before any change. The Working Guidelines require schema setup to remain in setup.gs rather than being hidden in Code.gs.

**GAS replacement:** `setup.gs` — **DO NOT REPLACE YET**. Any schema/header delta requires a separate approved migration plan.

### 2.3 UserRoleManagement.gs — role administration

- GAS file: `UserRoleManagement.gs` (archive `UserRoleManagement.txt`, 100 lines)
- GitHub file: `backend/UserRoleManagement.gs` (101 lines)
- GitHub blob: `86682f156ebd58a7a7a21b64a4fefe3fd763ea86`
- Exported function inventory: same three functions in both sources.
- Action literals: `user.list`, `user.status`, `role.list`, `role.grant`, `role.revoke`.

**GitHub source behavior observed:** role administration is implemented in a dedicated module; role grants/revocations and user status operations are protected by admin authorization, and user output is projected through a public-user serializer. The module reads role/user/course/semester data.

**Risk/decision:** verify the exact admin predicate, whether only SYSTEM_ADMIN may grant/revoke roles, whether coordinator scope is constrained to assigned courses/semesters, protection against self-demotion or removal of the last administrator, and audit records for role/status changes. Cross-check DOC-06 Permission Matrix and CourseManagement effective-role logic. Do not assume that a UI-hidden action is authorization.

**GAS replacement:** `UserRoleManagement.gs` — **DO NOT REPLACE YET**.

### 2.4 AssignmentManagement.gs — assignment lifecycle and schedules

- GAS file: `AssignmentManagement.gs` (archive `AssignmentManagement.txt`, 261 lines)
- GitHub file: `backend/AssignmentManagement.gs` (228 lines)
- GitHub blob: `ae56f8931c986dd8bbaafe72af219c9ca3d5044b`
- Exported function inventory: same 17 functions in both sources.
- Action literals: `assignment.list`, `assignment.get`, `assignment.create`, `assignment.update`, `assignment.open`, `assignment.close`.

**GitHub source behavior observed:** assignment configuration includes submission-type rules, minimum/maximum group member settings, schedule configuration, and explicit open/close actions. Updates to group-size rules are rejected after a submission exists. Manual open/close actions update status/timestamps and audit the event; opening may invoke assignment-open notification. Scheduler-related functions and tests are present.

**Risk/decision:** the archive is 33 lines longer than GitHub, while the function inventory is the same. That is a material review signal but does not prove which behavior was added/removed. Inspect all schedule helper functions, assignment create/update validation, manual status transitions, and scheduler trigger lifecycle. Confirm the approved product rule on teacher-controlled open/close versus automatic scheduling before accepting any scheduler behavior. Check that the scheduler cannot silently open/close assignments contrary to the approved course policy. Verify max-group-size immutability after first submission and compatibility with GroupManagement/SubmissionManagement.

**GAS replacement:** `AssignmentManagement.gs` — **DO NOT REPLACE YET**.

### 2.5 GroupManagement.gs — group formation and membership lock

- GAS file: `GroupManagement.gs` (archive `GroupManagement.txt`, 159 lines)
- GitHub file: `backend/GroupManagement.gs` (160 lines)
- GitHub blob: `9dc280d88bcee8e346d028082cae725fe2d88ee8`
- Exported function inventory: same 10 functions in both sources.
- Action literals: `group.list`, `group.create`, `group.join`, `group.leave`, `group.members`, `group.selectRepresentative`, `group.addMember`, `group.removeMember`.

**GitHub source behavior observed:** students must be enrolled in the offering; active users cannot join/create a second active group in the same offering; membership operations are guarded by the group's membership-lock state; leaders can be reassigned; course staff can add/remove members; staff additions require active enrollment; group membership changes are audited. Group membership is locked after first submission.

**Risk/decision:** DOCS v1.3 approved assignment-scoped groups with teacher-defined maximum members per assignment and membership lock on first submission. Confirm that max-member enforcement is based on the assignment configuration and applies consistently to student self-join, group creation, staff add-member, and submission validation. Confirm whether a group can be shared across assignments in the same offering without violating assignment-specific maximums. Verify concurrency protection and no duplicate active membership. The inspected GroupManagement handler uses a script lock, but this alone does not prove all related writes are atomic.

**GAS replacement:** `GroupManagement.gs` — **DO NOT REPLACE YET**.

### 2.6 SubmissionManagement.gs — submission, revisions, files, idempotency

- GAS file: `SubmissionManagement.gs` (archive `SubmissionManagement.txt`, 233 lines)
- GitHub file: `backend/SubmissionManagement.gs` (234 lines)
- GitHub blob: `ef4b86678e8c1feeea425ba578501846129a229c`
- Exported function inventory: same 14 functions in both sources.
- Action literals: `submission.create`, `submission.revise`, `submission.list`, `submission.get`.

**GitHub source behavior observed:** individual submissions require active enrollment; group submissions require active group membership and designated representative authority; minimum/maximum group size is checked against assignment fields; staged files must belong to the submitter or an active member of the same group for the same assignment; Google Drive/Docs HTTPS URLs are constrained; revisions preserve previous submission linkage; request IDs are idempotency keys with payload-hash conflict detection; group membership lock is written at first group submission; file sharing and database writes have compensating rollback attempts; notification failure is logged without undoing a successful submission.

**Risk/decision:** this is high impact for student work and data integrity. Inspect the exact order of file sharing, submission row insertion, group lock, staged-file reassignment, URL rows, audit append, rollback, and idempotency persistence. Confirm that failed rollback is surfaced and recoverable, that duplicate request retries cannot create duplicate revisions, and that file permissions do not expose submissions to non-members. Verify that group membership lock semantics are consistent with the approved requirement and that revision creation does not unlock membership.

**GAS replacement:** `SubmissionManagement.gs` — **DO NOT REPLACE YET**.

## 3. Remaining seven backend modules

| Module / GAS file | Function inventory | GitHub blob | Main reconciliation focus | GAS replacement |
|---|---:|---|---|---|
| `CourseManagement.gs` | Same 34 named functions | `52a7f4049ff51772226fe33369cc26a0acb02a1b` | Effective roles, coordinator/instructor scope, course/semester/offering lifecycle, duplicate prevention, revocation, audit and isolation tests | HOLD |
| `EnrollmentManagement.gs` | Same 17 named functions | `a4ccfc11c4825155aa0732de6460cc4ac1c705db` | Import preview/execute, normalization, duplicate checks, job state, rollback/recovery, instructor scope | HOLD |
| `FileManagement.gs` | Same 5 named functions | `86cd29160dd00207c9a575ce801da09e643911cb` | File signature/type validation, ownership/access, Drive sharing, rollback and direct URL exposure | HOLD |
| `GradingManagement.gs` | Same 6 named functions | `12bd34c5dd857250c7d6ccd76e28b5da7f4507f8` | Grader scope, student visibility, grade history, review-state transition graph, post-review edits | HOLD |
| `NotificationManagement.gs` | Same 10 named functions | `875b60d90f4599ee0f9bdf0f60dcea31e215de7b` | Recipient resolution, consent/target separation, message payload PII, retry/idempotency, triggers and external side effects | HOLD |
| `StudentPortalManagement.gs` | Same 1 named function | `0d289ba8425437b303a274c1156bbaa3b7028860` | Student self-scope, enrollment-based visibility, grades/submission privacy and response projection | HOLD |
| `AuditManagement.gs` | Same 1 named function | `3d640aa1dbf0e30699ea7706637fd1b7cadbe452` | Admin-only audit read, sensitive-field redaction, pagination and read-only behavior | HOLD |

The function-count comparison is based on top-level named function declarations. It does not detect changes to inline callbacks, constants, object properties, schema arrays, or behavior inside a function.

## 4. API and permission reconciliation summary

The action literal inventories match between the supplied archive and GitHub for the compared modules. This supports route-name continuity, not full API compatibility. A complete contract check must still compare payload fields, required/optional status, response shape, error codes, and caller usage in the frontend and Worker.

Permission review must be performed at the handler level, not only by matching action names:
- System-wide role administration must remain restricted.
- Course coordinator/instructor permissions must remain scoped to authorized courses, semesters, or offerings.
- Student reads must be scoped to the authenticated user and active enrollment/group membership.
- Group membership changes must respect enrollment, duplicate membership, assignment limits, and lock state.
- Submission reads/files must respect student/group ownership and course staff access.
- Grade and grade-review access must follow DOC-06 and the approved review transition model.

## 5. Database and security findings

- The owner-provided read-only schema inspection returned schema version 1.5.0 and success=true for the active designated TEST spreadsheet. This is evidence for that inspection run only.
- Do not infer that every schema used by both setup.gs versions is identical. The setup file comparison must be completed against DOC-05 and the actual table/header inventory.
- High-risk write paths are enrollment import/rollback, group create/member changes, submission revision/file sharing, grading, role changes, and notification delivery.
- Audit coverage must be checked for both successful and rejected privileged operations.
- No secrets or student PII should be copied into this report or GitHub.
- No database write, fixture creation, migration, external notification, or Production access was performed during this analysis.

## 6. File-by-file GAS replacement decision

**Exact GAS replacement list at this revision: NONE.**

The following files were examined and remain HOLD:
1. `Code.gs`
2. `setup.gs`
3. `UserRoleManagement.gs`
4. `AssignmentManagement.gs`
5. `GroupManagement.gs`
6. `SubmissionManagement.gs`
7. `CourseManagement.gs`
8. `EnrollmentManagement.gs`
9. `FileManagement.gs`
10. `GradingManagement.gs`
11. `NotificationManagement.gs`
12. `StudentPortalManagement.gs`
13. `AuditManagement.gs`

This is the only safe instruction supported by current evidence. It does not mean that these files will never be replaced. It means each file needs a completed function-body diff and test evidence before an exact replacement can be issued. The TEST runner is a separate test-support artifact and is not included in the 13 backend modules.

## 7. Next controlled work package

1. Complete exact function-body diffs for the six priority files, documenting each changed function as ADDED/REMOVED/MODIFIED/UNCHANGED and the semantic impact.
2. Compare each modified function with DOCS v1.3 and identify any requirement conflict.
3. Build isolated pure tests for changed authorization, group-limit, schedule, submission, rollback, and idempotency logic.
4. Complete the same process for the remaining seven modules.
5. Only then issue a per-file release manifest with exact GAS filename, approved GitHub blob/commit, backup version, test evidence, and rollback instruction.

System Testing Step 4 remains **NOT CLEARED** until source reconciliation, runner reconciliation, TEST deployment/API mapping, and LINE TEST/PRODUCTION separation gates are closed.
