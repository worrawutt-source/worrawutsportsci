# SPORT NUTRITION CLASSROOM — System Test Readiness & Reconciliation

- Date: 22 November 2026 (Asia/Bangkok)
- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development` only
- Verified HEAD before this report: `4ec8b9ebe8f2a897459936e688847a6d1bec6a83`
- Source baseline: GAS snapshot `SNC_GAS_BACKUP_2026-11-22(2).zip`
- Requirements baseline: DOCS v1.3 / Working Guidelines SNC-WG-001 v1.0.0
- TEST spreadsheet: owner-supplied TEST ID (not repeated here)
- Decision: **NOT CLEARED for full system test yet**

## 1. Executive decision

The 13 backend modules were compared at top-level function-block level, not only by file hash. The comparison found 159 top-level function blocks in the supplied GAS snapshot. 136 block fingerprints match the GitHub `development` source and 23 differ or are extra/removed. This gives a precise set of functions requiring review.

The comparison confirms that the 13 files have the same top-level function names except for two duplicate TEST fixture functions in the GAS AssignmentManagement export. No new or removed production API action family was identified from the inspected dispatcher/handler inventories.

Three source files are recommended for controlled replacement in the TEST GAS project:
1. `Code.gs` — security and partial-write recovery improvements.
2. `setup.gs` — canonical four-column StudentImport support and legacy preflight handling, without changing schema version 1.5.0 or the declared application table set.
3. `AssignmentManagement.gs` — remove duplicate top-level TEST fixture functions that shadow the approved disabled stubs and contain persistent fixture-write logic.

These are recommendations for the verified TEST project only, after taking a fresh GAS export. No Production replacement is authorized.

The remaining backend files are HOLD pending final semantic review of the changed function blocks. The current GitHub integration runner v1.0.1 must NOT replace the archived GAS runner wholesale because it omits the existing strict TEST environment guard and read-only INT-01 checks. A merged runner is still required.

## 2. Approved requirement baseline

DOC-01 Project Charter v1.0 and DOC-02 Requirements Specification v1.1 are identified as Approved Baseline. DOC-03 through DOC-08 in the supplied DOCS v1.3 package are marked Draft — Pending Design Approval. Their content is useful as design context, but must not silently override approved requirements.

The approved DOC-02 clarifications that must be regression-tested:
- Individual Assignment creates and assesses each student's own submission. It does not require group membership.
- Group Assignment uses a group associated with one CourseOffering for the course/semester.
- Group Assignment minimum size is two members. Maximum size is set per Assignment by the instructor; blank means no system-level maximum.
- A student may belong to no more than one active group in a CourseOffering.
- Membership is locked only for the group that has its first submission. Other groups in the same CourseOffering remain editable until their own first submission.
- Locking a group must not prevent its members from submitting Individual Assignments.
- Backend must validate SubmissionType on every submission request.

## 3. Function-block comparison

Method: normalize line endings to LF, identify top-level function declarations, and fingerprint each function block through the next top-level function declaration. The fingerprint comparison is a change locator; it is not a substitute for reviewing the full changed source. Nested local helper functions are included in the enclosing top-level block.

| GAS file | GAS top-level blocks | GitHub top-level blocks | Blocks requiring review | Finding |
|---|---:|---:|---:|---|
| Code.gs | 31 | 31 | 5 | OTP entropy, account-link/email rollback, test helper changes |
| setup.gs | 6 | 6 | 5 | schema preflight and StudentImport compatibility changes |
| UserRoleManagement.gs | 3 | 3 | 1 | role/user administration handler differs |
| AssignmentManagement.gs | 19 | 17 | 3 | duplicate fixture functions exist only in GAS; verify stub differs |
| GroupManagement.gs | 10 | 10 | 1 | group action handler differs |
| SubmissionManagement.gs | 14 | 14 | 1 | submission action handler differs |
| CourseManagement.gs | 36 | 36 | 1 | only testDuplicateRequestAuditConsistencyReadOnly differs |
| EnrollmentManagement.gs | 17 | 17 | 1 | only testEnrollmentAuthorizationPredicatesUnit differs |
| FileManagement.gs | 5 | 5 | 1 | file action handler differs |
| GradingManagement.gs | 6 | 6 | 1 | grading action handler differs |
| NotificationManagement.gs | 10 | 10 | 1 | trigger installer differs |
| StudentPortalManagement.gs | 1 | 1 | 1 | student portal read model handler differs |
| AuditManagement.gs | 1 | 1 | 1 | audit read handler differs |
| **Total** | **159** | **157** | **23** | 136 matching blocks; 23 changed/extra blocks |

Important: the AssignmentManagement count includes two duplicate top-level fixture function declarations in the GAS archive. The GitHub version has one disabled compatibility stub for each fixture function.

### 3.1 Code.gs — replacement recommended

Changed blocks:
- `makeOtp_`: GAS uses `Math.random()` as a fallback when UUID digits are insufficient. GitHub uses UUID-derived digits only and removes the weaker fallback.
- `confirmStudentLink_`: GitHub rolls back a newly created LINEAccounts row if audit logging fails. GAS can leave the account link written even if the audit append fails.
- `confirmEmailChange_`: GitHub restores the old email and UpdatedAt if the update/audit transaction fails. GAS does not provide the same rollback protection.
- `testApiMissingTokenGuard`: GitHub expects `TOKEN_MISSING`, consistent with the current authentication guard; the GAS snapshot expects `UNAUTHENTICATED`, so the archived test helper has a stale expectation.
- `testConfiguration`: review difference is in the test/helper block; no API contract change identified.

Decision: replace GAS `Code.gs` with GitHub `backend/Code.gs` after a fresh backup. This is a security/consistency correction. Do not expose token or Script Property values in test logs.

### 3.2 setup.gs — replacement recommended, but do not run setup

Changed blocks:
- `validateSNCSchemaBeforeMigration_`: GitHub accepts both the canonical StudentImport header `STUDENT_ID | FIRST_NAME | LAST_NAME | EMAIL` and the documented legacy staging layout `EMAIL | DISPLAY_NAME | STUDENT_ID`. GAS snapshot only accepts the canonical layout in preflight.
- `setupAccountLinkingSheets`: GitHub retains support for the legacy staging layout while retaining schema preflight and additive-only migration behavior.
- `importStudentsFromStaging`: GitHub imports canonical four-field records and can read legacy display-name rows only when the name can be split into first and last name. It validates all four required identity fields before writing and rejects conflicting duplicate IDs/emails.
- `inspectSNCDatabaseSchema`: read-only diagnostic output differs; no schema mutation is introduced by the inspector.
- `formatSetupHeader_`: function block fingerprint differs; no change to declared table schema identified.

The GitHub `SNC_SETUP.VERSION` remains 1.5.0 and the logical table/header declarations match the inspected TEST schema baseline. The owner-provided read-only inspection returned success=true for the active TEST spreadsheet under the current inspector.

Decision: replace GAS `setup.gs` with GitHub `backend/setup.gs` only after backing up the current GAS source. **Do not execute** `setupAccountLinkingSheets()`, `importStudentsFromStaging()`, or any migration during source synchronization. Schema migration is not required by the existing successful read-only schema inspection.

### 3.3 UserRoleManagement.gs — HOLD

The `handleUserRoleAction_` block differs. Both versions visibly retain System Admin gating, prevent self-deactivation, protect the last active System Admin, limit role grants to COURSE_COORDINATOR, and keep INSTRUCTOR assignment within offering assignment. The block-level mismatch has not been fully reconciled line by line; do not replace yet.

### 3.4 AssignmentManagement.gs — replacement recommended

Core assignment creation/update/open/close behavior and manual-control scheduler stubs match the inspected GitHub design. The GAS snapshot contains duplicate top-level declarations:
- First `createAssignmentSchedulerTriggerFixtures()` is a disabled no-write stub.
- A later declaration overrides it and creates two persistent Assignment rows in the TEST spreadsheet, writes `SNC_SCHEDULER_TRIGGER_TEST_TAG` to Script Properties, and requires a real trigger verification workflow.
- The duplicate `verifyAssignmentSchedulerTriggerFixtures()` is also present.

The later function declaration can shadow the disabled stub. This conflicts with the approved manual assignment open/close control and introduces unintended fixture writes if invoked.

GitHub contains only the disabled no-write stubs. It also retains `runAssignmentScheduler()`, `amProcessDueSchedules_()`, and `installAssignmentSchedulerTrigger()` as disabled/manual-control functions.

Decision: replace GAS `AssignmentManagement.gs` with GitHub `backend/AssignmentManagement.gs`. This removes the duplicate persistent fixture creator and preserves manual assignment control. Do not run scheduler trigger fixture functions.

### 3.5 GroupManagement.gs — HOLD

The action handler block differs. Current visible behavior in both sources includes:
- enrollment checks for group creation/join;
- one active group per student per CourseOffering;
- membership lock checks for join/leave/add/remove/representative changes;
- staff scope checks for staff membership changes;
- active group membership checks.

The changed handler still requires a final exact line review and TEST negative-case validation. Do not replace yet.

### 3.6 SubmissionManagement.gs — HOLD

The action handler block differs. Current inspected behavior includes:
- Individual submissions require active enrollment and derive the student from the authenticated actor;
- Group submissions require the assignment's CourseOffering, active group, active membership, designated leader/representative, minimum two members, and assignment-specific maximum;
- revisions are linked by PreviousSubmissionID and RevisionNumber;
- request idempotency is keyed by user/action/requestId and payload hash;
- the group is locked on first successful Group Submission;
- file shares, submission rows, staged-file links, group lock and audit writes have compensating rollback attempts.

Because the handler block fingerprint differs, the precise transaction and idempotency changes must be resolved before replacing. Do not run real submissions until a disposable fixture plan is approved.

### 3.7 CourseManagement.gs — no production replacement required from this diff

The only changed top-level block is `testDuplicateRequestAuditConsistencyReadOnly`. The production authorization, scope and course/offering handlers have matching function-block fingerprints. Keep the current GAS production module for this synchronization batch; reconcile the test helper separately if needed.

### 3.8 EnrollmentManagement.gs — no production replacement required from this diff

The only changed top-level block is `testEnrollmentAuthorizationPredicatesUnit`. The production import normalization, validation, rollback/recovery and authorization functions have matching function-block fingerprints. Keep the current GAS production module for this synchronization batch.

### 3.9 FileManagement.gs — HOLD

The `handleFileManagementAction_` block differs. Visible controls include MIME allow-list, base64 and 4 MB size limit, file-signature checks, private Drive folder requirement, staged upload registration, audit logging, rollback cleanup, and authorization before file access. Complete the exact handler diff and verify TEST Drive folder permissions before replacement or upload tests.

### 3.10 GradingManagement.gs — HOLD

The `handleGradingAction_` block differs. Current visible controls include course-scope authorization, score bounds, mandatory reason for grade changes, GradeHistory, audit logging, rollback, student ownership for Grade Review, and status-transition validation. Complete exact diff and negative permission tests before replacement.

### 3.11 NotificationManagement.gs — HOLD

Only `installDeadlineReminderTrigger()` differs. The reminder trigger is distinct from assignment auto-open/auto-close, which remains disabled. Verify the exact trigger-management difference and confirm TEST-only trigger ownership before replacing or installing any trigger. Do not send real LINE messages during preflight.

### 3.12 StudentPortalManagement.gs — HOLD

The read-model handler differs. Current visible design derives student identity from the authenticated actor, requires active enrollment, returns own submissions/grades, and hides member identities for groups the student does not belong to. Complete exact response-field comparison and IDOR/privacy tests before replacing.

### 3.13 AuditManagement.gs — HOLD

The audit read handler differs. Current visible design restricts audit listing to SYSTEM_ADMIN and caps the result size. Complete exact field-level privacy and authorization review before replacing.

## 4. API, permission, database and security reconciliation

### API
- The dispatcher has route families for auth, course/semester/offering/instructor, import/enrollment, student, file, user/role, audit, notification, grade/gradeReview, submission, group and assignment.
- No changed top-level dispatcher function or action-family route was identified in the function-block comparison.
- DOC-08 API Specification v1.1 is marked Draft — Pending Design Approval. Treat it as a test checklist, not an independently approved contract.
- Do not change action names, request/response envelopes, or error-code contracts in this synchronization batch.

### Permission
- Authorization is enforced in backend handlers; UI hiding is not the security boundary.
- Test matrix must include System Admin, Course Coordinator in-scope/out-of-scope, Instructor assigned/unassigned, Student own record, Student other record, active/inactive account, and group member/non-member.
- Negative tests must change client-supplied UserID, OfferingID, AssignmentID, GroupID, SubmissionID and FileID to prove object ownership/scope is checked server-side.

### Database
- Current declared schema version is 1.5.0.
- Owner-provided read-only schema inspection returned success=true for the designated TEST spreadsheet and matched all tables/headers declared by the inspector for that execution.
- No database schema migration is indicated by current evidence.
- Do not run `setupAccountLinkingSheets()` or `migrateMissingSNCTables_TEST_20261122()` during source sync.
- Do not alter the spreadsheet schema or data to make a test pass.

### Security
- Replace the weak Math.random OTP fallback with the GitHub UUID-only implementation.
- Adopt GitHub rollback protection for student LINE linking and email change.
- Verify LINE token validation, role/scope authorization, file ownership, Drive folder privacy, audit redaction, and no token/OTP/secret logging.
- No real LINE Push, live student import, real submission, grade mutation, or fixture cleanup during preflight.

## 5. Exact GAS file instructions

After taking a fresh GAS source export, synchronize only these three files in the TEST GAS project:

| Action | GAS file to replace | Source in GitHub | Reason |
|---|---|---|---|
| REPLACE | `Code.gs` | `sport-nutrition-classroom/backend/Code.gs` | UUID-only OTP; rollback for LINE link/email update; correct missing-token test expectation |
| REPLACE | `setup.gs` | `sport-nutrition-classroom/backend/setup.gs` | canonical 4-field StudentImport and legacy-safe preflight; schema version/table definitions retained |
| REPLACE | `AssignmentManagement.gs` | `sport-nutrition-classroom/backend/AssignmentManagement.gs` | remove duplicate fixture declarations that shadow disabled stubs and can create persistent TEST rows |

Keep the following GAS files unchanged in this batch:
- `UserRoleManagement.gs`
- `GroupManagement.gs`
- `SubmissionManagement.gs`
- `CourseManagement.gs`
- `EnrollmentManagement.gs`
- `FileManagement.gs`
- `GradingManagement.gs`
- `NotificationManagement.gs`
- `StudentPortalManagement.gs`
- `AuditManagement.gs`

Do not replace `SNC_IntegrationTestRunner_TEST.gs` with GitHub runner v1.0.1 as-is. It omits the archived runner's strict environment guard and read-only INT-01 procedure. The GAS runner v1.0.0 has a defective route detector that applies anchored route regexes to the entire `String(doPost)`. A merged runner is required before the consolidated run.

## 6. One-batch system test plan

Run the test batch only after the three replacements are installed in the verified TEST project and the remaining HOLD files have passed exact diff review.

| Stage | Test batch | Test behavior | Writes / external effects | Gate |
|---|---|---|---|---|
| 0 | Environment preflight | TEST property, active spreadsheet ID, deployment/API URL, LINE TEST separation | Read-only | All PASS |
| 1 | Static and pure unit | syntax, OTP/helper guards, assignment config/manual control, group representative/staged file, import validation, authorization predicates, grade review state machine, dispatcher route detector | No writes | All PASS |
| 2 | Database preflight | schema 1.5.0, all expected sheets/headers, key/reference integrity, duplicate checks, audit integrity | Read-only | All PASS |
| 3 | Identity and permissions | LIFF token valid/invalid/expired, account linking, role scope, inactive user, IDOR and cross-offering denial | TEST fixtures only; no real accounts | All PASS |
| 4 | Individual assignment flow | create/open/close, individual submit/revise, late/closed rejection, staged file access, grade/history/review | TEST fixtures and private TEST Drive folder | All PASS |
| 5 | Group assignment flow | create/join/leave, one-group-per-offering, representative, min 1 reject/min 2 accept/max reject, first submission locks only that group, other group remains editable, Individual Assignment still works after lock | TEST fixtures and private TEST Drive folder | All PASS |
| 6 | Notifications and audit | notification log, instructor notification routing, deduplication, audit event completeness | Stubbed LINE only; no real push | All PASS |
| 7 | Browser/LIFF E2E and recovery | Student/Instructor/Admin journeys, upload/access, retries, duplicate requests, partial-write rollback, CORS/redirect | TEST only | All PASS |
| 8 | Regression and evidence | compare before/after row counts and fixture IDs, verify no unrelated records changed, cleanup only exact fixture IDs | TEST cleanup by recorded manifest only | All PASS |

Do not start Stage 3–7 until a separate test fixture manifest identifies synthetic TEST actors, offerings, assignments, groups, Drive folder, and exact cleanup IDs. Existing real student accounts must not be repurposed as fixtures.

## 7. Readiness blockers

1. The exact function-level diff of the remaining HOLD handlers is not fully signed off.
2. The GAS project cannot be written or deployed through the currently available connected tools. The owner/operator must copy the three approved files into TEST GAS after exporting a fresh backup.
3. TEST Web App deployment/API URL mapping remains unverified.
4. LINE TEST/PRODUCTION channel, LIFF ID, and Worker upstream separation remain unverified.
5. A merged runner preserving the strict environment guard and fixing route detection is still required.
6. Synthetic TEST fixture plan and cleanup manifest have not been approved or executed.
7. No GAS V8 runtime tests or deployed browser/LIFF E2E tests have been run in this work package.

## 8. Execution record

PASS:
- Re-fetched GitHub `development` HEAD.
- Re-opened the exact DOCS v1.3 source documents and Working Guidelines.
- Compared 13 GAS modules to GitHub at top-level function-block fingerprint level.
- Identified 23 changed/extra function blocks and 136 matching blocks.
- Confirmed duplicate persistent TEST fixture declarations in the archived GAS AssignmentManagement export.
- Reviewed key Individual/Group Assignment, membership-lock, minimum/maximum size, submission revision, idempotency, OTP and rollback logic.
- Confirmed the existing owner-provided read-only schema inspection evidence for TEST schema 1.5.0.

NOT RUN:
- GAS source replacement.
- GAS V8 syntax/runtime execution after replacement.
- API requests against deployed TEST endpoint.
- LINE/LIFF runtime checks.
- Spreadsheet writes, fixture creation/cleanup, migration, Drive uploads, grade changes or notifications.
- Full system E2E and regression.

**Final status: PREPARATION IN PROGRESS — NOT READY FOR THE SINGLE FULL SYSTEM TEST RUN.** The exact three-file GAS replacement list is defined above; all remaining blockers must close before the full test batch is run once.
