# SPORT NUTRITION CLASSROOM — Backend Reconciliation & Remediation Report

- Date: 22 November 2026
- Branch: development
- Baseline: DOCS v1.3; DOC-02 Requirements Specification v1.1 approved
- GAS source snapshot reviewed: SNC_GAS_BACKUP_2026-11-22(1).zip
- Scope: Code.gs, setup.gs, and all 12 backend management modules
- Safety: No GAS deployment, Worker deployment, TEST/PRODUCTION Spreadsheet writes, fixture execution, or Production access performed.

## 1. Executive result

The source review and safe source corrections in this batch are committed to development. Static syntax checks pass for all 13 backend source modules. Existing pure unit tests executed from the supplied GAS snapshot pass 74/74 across assignment configuration/manual control, course authorization, duplicate-offering predicate, enrollment import/authorization, grade-review transitions, group representative authorization, and staged-file authorization. Code-level missing-token guard passes 4/4 in a local mocked handler test.

This does not establish deployed GAS runtime, TEST API, browser/LIFF E2E, LINE provider, Drive permissions, or live Spreadsheet behavior. Those remain NOT RUN/BLOCKED and must not be represented as passed.

## 2. Source changes committed

### 2.1 backend/Code.gs
- Corrected the testPostMissingToken() comment: expected API error is TOKEN_MISSING, not UNAUTHENTICATED.
- Removed the Math.random fallback from OTP generation. OTP digits now derive from repeated Utilities.getUuid() values only.
- Added compensating rollback if creation of a new LINEAccounts row succeeds but the corresponding AuditLogs write fails.
- Added compensating rollback of Users.Email and UpdatedAt if the email-change AuditLogs write fails.
- Rollback failures emit fixed safe diagnostic labels; no token or request payload is logged.

### 2.2 backend/setup.gs
- Changed the canonical StudentImport staging headers to STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL, matching the approved DOC-02/DOC-05 field requirements.
- Preserved read compatibility for existing legacy staging headers EMAIL, DISPLAY_NAME, STUDENT_ID. Legacy names are parsed only when a recognized Thai prefix and at least two name tokens are present.
- Import validation now uses the actual source row number even when blank rows are filtered.
- Existing Users table schema and all 22 canonical table definitions were not changed.
- Updated the function documentation to distinguish canonical and legacy import formats.

### 2.3 Previously committed source correction retained
- backend/AssignmentManagement.gs retains one canonical declaration each for createAssignmentSchedulerTriggerFixtures() and verifyAssignmentSchedulerTriggerFixtures(). The duplicate later definitions that could override disabled manual-control stubs were removed.
- Assignment opening and closing remain instructor-controlled; scheduler handlers are disabled/no-op under BR-001.

## 3. Reconciliation findings

### 3.1 Code.gs and dispatcher
- doPost() routes authentication, course/semester/offering/instructor, import/enrollment, student, file, user/role, audit, notification, grading, submission, group, and assignment action families.
- Missing ID token is rejected before protected action handlers.
- LINE ID token is sent to LINE's verify endpoint with configured channel ID; raw ID tokens and request payloads are not logged.
- The archive and development source have matching dispatcher route families and matching function inventories. The visible dispatcher/auth sections were inspected; this is not a byte-for-byte or full semantic equivalence proof for every line.
- The testPostMissingToken comment mismatch was corrected.

### 3.2 setup.gs
- SNC_SETUP remains version 1.5.0 and defines 22 application tables.
- Existing table headers are checked before migration writes. Only documented legacy additive migrations for EmailOTPChallenges (+3 columns) and Assignments (+6 scheduling columns) are accepted.
- The setup path does not clear or delete existing table rows. It creates missing sheets and writes the schema version only after the setup loop completes.
- StudentImport is a staging sheet, not one of the 22 application tables. Its canonical import fields now align with the approved requirements; legacy staging remains readable.
- No migration function was executed.

### 3.3 Backend modules
- AssignmentManagement: manual open/close policy retained; Individual has blank group limits; Group enforces minimum 2 and optional assignment-specific maximum.
- CourseManagement: scope-aware course/semester/offering authorization predicates reviewed; unit tests cover global and scoped coordinators, instructor offering scope, and student restrictions.
- EnrollmentManagement: pure import validation and authorization predicates tested; no live import executed.
- GroupManagement: membership and CourseOffering-scoped group rules reviewed; no live group data changed.
- SubmissionManagement: validates assignment type, enrollment, active group membership, designated representative, group size and staged file ownership; group submission locks only its own group. Uses ScriptLock and idempotency records. Cross-resource rollback and idempotency persistence failure still require deployed TEST failure-injection.
- FileManagement: upload validation and staged-file authorization reviewed; Drive sharing/rollback behavior was not exercised against Google Drive.
- GradingManagement: grade access and grade-review state transitions reviewed; pure transition tests pass.
- NotificationManagement: deadline reminders use a time-driven notification trigger. This is separate from Assignment open/close; Assignment state remains manually controlled.
- UserRoleManagement: SYSTEM_ADMIN bootstrap remains separate; user/role administration requires SYSTEM_ADMIN.
- StudentPortalManagement: student identity is derived from authenticated actor; group member identities are hidden for groups the actor does not belong to.
- AuditManagement: audit read endpoint is restricted to SYSTEM_ADMIN.

## 4. Test evidence

### 4.1 Static syntax
- ZIP snapshot JavaScript/Apps Script sources: Node.js --check PASS for 13 backend files plus the Integration Test Runner source.
- Current development versions of all 13 backend files: V8 Function-construction syntax check PASS.
- Apps Script runtime compatibility is not proven by Node syntax checks.

### 4.2 Pure unit tests executed from supplied snapshot
| Test | Result |
|---|---:|
| Assignment submission configuration | PASS 10/10 |
| Manual assignment control/scheduler no-op | PASS 4/4 |
| Course authorization logic | PASS 19/19 |
| Duplicate offering predicate | PASS 7/7 |
| Enrollment import logic | PASS 9/9 |
| Enrollment authorization predicates | PASS 6/6 |
| Grade-review state machine | PASS 10/10 |
| Group representative authorization | PASS 4/4 |
| Group staged-file authorization | PASS 5/5 |
| **Total** | **PASS 74/74** |

These tests were executed in a local Node VM with mocked minimum globals. They are pure/unit-level evidence, not deployed GAS or live database tests.

### 4.3 API guard
- Direct doPost() handler test with mocked ContentService and no token: PASS 4/4 for auth.verify, course.list, semester.list, and offering.list.
- No LINE API request, Spreadsheet access, or write occurred in this test.

## 5. Open risks / not closed

1. OTP request rate limiting is not implemented in the current account-linking flow, although RATE_LIMITED appears in the API error vocabulary. A limit threshold/window and lockout policy are not defined in the approved requirements available for this batch. Do not invent a threshold; define and approve it before implementing.
2. The current Code.gs OTP challenge supports expiry and a maximum of five verification attempts per challenge, but that is not equivalent to request-rate limiting.
3. Several management operations across modules update business rows and then append audit events without a uniform cross-sheet transaction. Code.gs account-link and email-change paths now attempt compensation, but this pattern is not yet uniform across all modules.
4. Submission idempotency persistence occurs after submission side effects. A failure while saving the IdempotencyKeys row can leave a committed submission without a stored replay response. This requires a controlled TEST failure-injection design before changing behavior.
5. DOC-08 API Specification v1.1 remains Draft/Pending Approval in the project baseline notes. The implementation's use of requestId for submission idempotency must be reconciled with the draft's idempotencyKey field before treating that API contract as final.
6. The DOC-05 recommendation to preserve a group-membership snapshot at first submission is not evidenced in the current Submissions schema/source. It is a design recommendation in the source document; implementation needs an approved schema/API change if made mandatory.
7. TestFixtures_TEST and SchemaMigration_TEST remain REVIEW REQUIRED and must not be run. They contain hard-coded TEST environment identifiers; the fixture helper writes persistent Enrollment/Assignment records and the migration helper performs schema writes.
8. No current GAS deployment identity was verified, and no live TEST Spreadsheet, LINE LIFF, Google Drive, or browser E2E run was performed.

## 6. Safety and approval boundaries

- No database schema/table/column was added or removed.
- No existing TEST or Production row was edited.
- No setup/migration function or persistent fixture helper was executed.
- No GAS deployment, Worker deployment, or Production action was performed.
- Existing legacy StudentImport staging data remains supported without rewriting it.

## 7. Commits in this batch

- Code.gs missing-token test documentation: 5069097928b4d172e3cb2cf399f7f1eedbd47f5c
- setup.gs canonical StudentImport fields and legacy compatibility: 8b7cf4f143699fdd11dbe1b8ff7a907b52190c07
- setup.gs legacy name parsing hardening: 42fc1f0678780f327d580b5c1847b7319b273dcc
- setup.gs canonical/legacy import documentation: 211064d36244000ea725376f8808f5a72ce17faa
- Code.gs OTP entropy and account/audit compensation: e34bff764f728d199024c48c2cd0ed680505f181

## 8. Next required verification

1. Re-fetch and reconcile the latest development source against the GAS snapshot before copying anything into Apps Script.
2. Review and approve an OTP rate-limit policy.
3. Design failure-injection tests for AuditLogs, IdempotencyKeys, Drive sharing, and partial migration.
4. Harden TestFixtures_TEST and SchemaMigration_TEST under a TEST-only runtime identity gate.
5. Only then run approved TEST API and browser/LIFF E2E verification. No Production deployment is authorized by this report.
