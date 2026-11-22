# SPORT NUTRITION CLASSROOM — Continuity Checkpoint

- Checkpoint date: 2026-11-22 (Asia/Bangkok)
- Project baseline: DOCS v1.3
- Working branch: `development`
- Repository: https://github.com/worrawutt-source/worrawutsportsci
- Project path: `sport-nutrition-classroom/`
- Purpose: durable handoff so work can continue if a ChatGPT conversation reaches its context/length limit.
- Status: working checkpoint; not a declaration that the MVP or integration tests are complete.

## 1. Operating rules that must survive a conversation reset

Source: `WORKING_GUIDELINES.md` (SNC-WG-001 v1.0.0, effective branch `development`, approved baseline DOCS v1.3).

1. Work only on `development`; do not modify `main` or Production without explicit approval.
2. Fetch current source and inspect the current branch/file state before editing. Do not rely on a previous chat summary as proof of current source.
3. Do not change approved scope, database schema, API contract, or business rules without an approved change request.
4. Keep TEST and PRODUCTION spreadsheets, Script Properties, GAS deployments, Worker configuration, LINE configuration, and data separate.
5. Never expose LINE access tokens, channel secrets, GAS secrets, credentials, or student personal data in source, frontend, logs, or GitHub.
6. Never use real student accounts or mutate existing TEST/PRODUCTION data just to make a test pass.
7. A test result must state its evidence level. Handler-level or simulated results do not prove deployed TEST API, browser/LIFF E2E, or Production behavior.
8. Use PASS, FAIL, BLOCKED, NOT RUN, DEFERRED, and REVIEW REQUIRED accurately. BLOCKED/NOT RUN/DEFERRED/REVIEW REQUIRED are not PASS.
9. Deliver work in coherent batches with source references, changed files, commit SHA, test evidence, limitations, and next actions.
10. Ask for approval only when scope, schema, API, Production, irreversible data operations, credentials, or material security decisions require it.

## 2. Approved requirements to preserve

DOC-02 Requirements Specification v1.1 records the approved MVP requirements and clarifications, including:
- Individual and Group Assignments are both required.
- Assignment type is explicitly INDIVIDUAL or GROUP.
- Students may submit Individual Assignments whether or not they belong to a group.
- A Group Assignment requires at least 2 members; maximum group members is set per Assignment and may be unlimited when null.
- Groups are scoped to one CourseOffering; a student may belong to at most one group per CourseOffering.
- Membership is locked only for the particular group after that group makes its first submission.
- Submission type, membership, enrollment, authorization, and idempotency are validated on the backend.
- Assignment open/close is controlled manually by the instructor; do not automatically open/close based on dates. Deadline remains relevant for late status and reminders.
- Required student import fields: Student ID, first name, last name, and email.

DOC-08 API Specification v1.1 is marked Draft — Pending Design Approval in the supplied DOCS v1.3 archive. Preserve this status; do not silently promote it to an approved specification.

## 3. Repository and source state known at checkpoint

- The GitHub connector confirmed that branch `development` exists.
- The previously recorded commit associated with the LIFF redirect change is `4c576bf9991d3d021208748c6667f2951543bf22`. Treat this as a known historical commit, not as a verified current branch HEAD. Recheck branch HEAD before the next write.
- The repository README fetched from `development` describes GitHub Pages frontend + Google Apps Script backend + Google Sheets database + Google Drive file storage + LINE LIFF student access.
- The README's 21-Nov-2026 status says backend modules and portal source had been expanded, but this was source-level work, not a completed/deployed MVP. It also says new schema definitions had not yet been migrated and new browser/LIFF E2E or live integration tests had not been performed.
- The README warns that uploaded GAS files from 21-Nov have different Git blob hashes from the corresponding repository files. This proves source divergence, not semantic differences. Reconcile before deployment or manual replacement.
- The local uploaded archive `SNC_GAS_BACKUP_2026-11-21.zip` contains `code.txt`, `course.txt`, `ass.txt`, `enroll.txt`, `setup.txt`, and `json.txt`. Function inspection confirms:
  - `doPost(e)`, `rowsAsObjects_(sheet)`, `verifyLiffIdentity_(idToken)` are in `course.txt`.
  - `getEffectiveRolesForUser_(uid)` and `handleCourseManagementActionForActor_(action,a,p,requestId)` are in `ass.txt`.
  - `handleEnrollmentManagementAction_(action,a,p,requestId)` is in `enroll.txt`.
  - `handleAssignmentManagementAction_(action,actor,p,requestId)` is in `ass.txt`.
  - The `enrollment` handler's visible actions include `import.preview` and `import.execute`; do not assume an `enrollment.list` action exists without inspecting the full function.
- Do not assume the ZIP source and repository source are interchangeable. The uploaded GAS archive is a reference snapshot and must be reconciled against the current `development` files.

## 4. LIFF / Instructor API issue history

- The LIFF redirect change was committed in the historical commit listed above.
- The prior work record says the LINE login redirect appeared to work, but a real browser/LIFF login was not fully verified.
- Instructor Dashboard API requests from GitHub Pages to GAS encountered a CORS issue (missing `Access-Control-Allow-Origin` in the observed response).
- A Cloudflare Worker proxy was discussed as a possible approach, with origin restrictions and no secrets/PII in logs, but it was NOT approved. Do not implement or deploy it without explicit approval.
- Before proposing a fix, re-inspect current Instructor frontend request code, GAS deployment behavior, browser network evidence, and current TEST endpoint. Do not assume the previous CORS diagnosis still describes the current deployed state.

## 5. Integration Test Runner artifact created in the 22-Nov conversation

Artifact: `SNC_IntegrationTestRunner_TEST.gs` (version label 1.0.0; 418 lines) was generated as a separate file and provided for download.

Important status: DRAFT / NOT VALIDATED / DO NOT RUN YET.

Reason:
- Its environment guard and read-only intent are useful starting points.
- However, a review against the uploaded 21-Nov GAS archive found at least one unsupported assumption: the draft invokes `handleEnrollmentManagementAction_('enrollment.list', ...)`, while the inspected handler's visible action branches do not establish that `enrollment.list` exists.
- Its sample fixture IDs (`STU_00000000000`, `STU_00000000001`, `STU_00000000002`) have not been verified against the TEST spreadsheet.
- Required sheet names, role representation, return shapes, route detection, and all INT-01..INT-08 test procedures still need verification against the exact current `development` GAS source and DOCS v1.3.
- The earlier chat's statement that it passed a static syntax check is not evidence of successful execution in Google Apps Script runtime.
- Do not count any INT test as PASS based on this draft. Do not deploy it to a live or Production script.

## 6. Next actions (ordered)

### P0 — Establish the exact current baseline
1. Re-fetch `development` branch HEAD and the current repository tree.
2. Fetch the current GAS source files from GitHub and compare them with the 21-Nov uploaded GAS archive by file/function, not only by filename.
3. Record exact paths, blob SHAs, commit SHA, and differences. Do not overwrite repository source with the ZIP automatically.
4. Confirm the TEST and PRODUCTION spreadsheet identities and GAS deployment/config separation without printing any secret values.

### P1 — Correct the integration test design before execution
5. Re-open DOC-02, DOC-05, DOC-06, DOC-08 and relevant current source modules.
6. Confirm the official INT-01..INT-08 definitions from project records or test plan. If no approved definitions exist, label any mapping as proposed and request approval before treating it as authoritative.
7. For each test, document: objective, preconditions, actor/role, fixture IDs verified from TEST, API/handler under test, expected result, data writes (if any), cleanup, evidence level, and risk.
8. Correct `SNC_IntegrationTestRunner_TEST.gs` to use actual action names, signatures, schema headers, fixture IDs, and response shapes. Prefer read-only tests first.
9. Separate pure unit/handler tests from tests that require deployed GAS, Worker, LINE LIFF, Drive, or browser access.
10. Run syntax validation and targeted tests in a TEST-only environment. Report BLOCKED where a required service or fixture is unavailable; do not weaken expected results.

### P2 — Resolve the instructor CORS/API integration
11. Reproduce the issue against the current TEST endpoint and capture request/response headers and browser console/network evidence.
12. Present safe options and trade-offs. Cloudflare Worker proxy remains an approval-gated option.
13. Do not deploy, alter Production, change auth/schema, or expose credentials without approval.

### P3 — Close out and checkpoint
14. Run relevant regression tests and record evidence levels separately.
15. Update this checkpoint after each completed work package with changed files, commit SHA, test results, blockers, and next actions.
16. Keep a copy of the latest checkpoint outside the chat as well (e.g. local project folder or Project files) so recovery does not depend on GitHub availability alone.

## 7. Suggested checkpoint update policy

Update this file:
- after each completed work package;
- after a meaningful decision or approval;
- after a test batch or deployment-state change;
- before switching to another major task;
- before ending a long work session.

Use dated entries or a short append-only history section. Do not store full conversation transcripts. Store durable decisions, exact source references, evidence, unresolved questions, and the next executable step.

## 8. Recovery prompt for a new conversation

Paste the following prompt into a new chat:

> Continue SPORT NUTRITION CLASSROOM from the latest continuity checkpoint in the GitHub repository. First read WORKING_GUIDELINES.md and the latest file under docs/handoff/. Verify the current development branch HEAD, repository tree, and source SHAs before making changes. Preserve DOCS v1.3 and all approval gates. Do not assume old chat summaries or historical commits are current. Report the current state, then continue the first unblocked next action. Do not modify main or Production.

---
This checkpoint is a continuity aid, not a substitute for the approved requirements, source code, test evidence, or explicit project-owner approvals.


## 9. Integration Test Runner execution record — 22-Nov-2026

### 9.1 Execution evidence supplied by project owner

Runner: `SNC_IntegrationTestRunner_TEST`  
Version: `1.0.0`  
Execution: 22-Nov-2026, approximately 10:35 Asia/Bangkok (03:35 UTC)  
Environment reported by runner: `TEST`  
Mode: `READ_ONLY_INTEGRATION_HANDLER_TEST`  
Duration: 8,422 ms  
Spreadsheet reported: `SportNutritionApp` (ID suffix intentionally not repeated here)

Suite summary: PASS 0 / FAIL 0 / BLOCKED 8 / NOT RUN 0.

INT-01 — Users / Roles / Enrollment:
- Suite status: BLOCKED.
- 10 subchecks PASS, 0 FAIL, 2 BLOCKED.
- ADMIN active; required SYSTEM_ADMIN and INSTRUCTOR roles resolved.
- STUDENT_A and STUDENT_B active; STUDENT role resolved for each.
- Both students' enrollment-list handler calls returned 0 rows; no active enrollment fixture was found for either student.
- System Admin offering-list handler returned 3 rows.
- Fixture creation/deletion: 0/0. Runner reported no cleanup action was required or attempted.

INT-02 — Group Management: BLOCKED by runner because the deployed/inspected GAS route was not detected.
INT-03 — Group Authorization: BLOCKED by runner because group authorization route/fixtures were not detected.
INT-04 — Submission / Revision / Idempotency: BLOCKED by runner because submission route was not detected.
INT-05 — File Upload / Attach / Access / Rollback: BLOCKED by runner because file route and verified TEST Drive upload condition were not detected.
INT-06 — Grading / Grade History / Grade Review: BLOCKED by runner because grading routes were not detected.
INT-07 — Notifications / Audit: BLOCKED by runner because notification route was not detected; LINE Push was excluded.
INT-08 — End-to-End / Failure Recovery: BLOCKED because deployed browser/LIFF E2E and cross-module recovery evidence was not available.

Interpretation:
- The execution proves that this runner revision executed in Apps Script against a spreadsheet it identified as TEST and that its implemented read-only checks returned the results above. It does not prove complete integration coverage or application readiness.
- The 10 PASS values are INT-01 subchecks only; no suite passed in full. Do not report the overall result as PASS.
- No FAIL was reported. BLOCKED indicates missing fixtures, routes, or test conditions, not a demonstrated application defect.
- The runner source itself is not committed in the repository as of this checkpoint. The project owner supplied its execution log in the conversation.
- The output does not independently prove the identity/version of the deployed GAS source. The exact deployment version and source snapshot remain to be established.

### 9.2 Important repository-versus-deployment discrepancy found after the run

The live `development` branch HEAD was rechecked and remains:
`07d2e5b1a5338e78584e44c8b5cbbed997ba1c72`.

The current repository tree contains separate modules and the current `Code.gs` has `doPost` route branches for group, submission, file, grade/gradeReview, and notification actions. Current source blob SHAs:
- `backend/Code.gs`: `6c7ae93d00bc76c6e5ca43c93b05c46c5ee1774d`
- `backend/GroupManagement.gs`: `9dc280d88bcee8e346d028082cae725fe2d88ee8`
- `backend/SubmissionManagement.gs`: `ef4b86678e8c1feeea425ba578501846129a229c`
- `backend/FileManagement.gs`: `86cd29160dd00207c9a575ce801da09e643911cb`
- `backend/GradingManagement.gs`: `12bd34c5dd857250c7d6ccd76e28b5da7f4507f8`
- `backend/NotificationManagement.gs`: `875b60d90f4599ee0f9bdf0f60dcea31e215de7b`

Therefore, the runner's statements that these routes/modules were absent in the inspected GAS backup must not be generalized to the current GitHub source. They indicate that the source inspected by the runner and the current repository source are not yet proven to be the same revision. This is a source/deployment reconciliation issue, not evidence that the repository modules are absent.

### 9.3 Updated next actions

P0 — Reconcile the TEST deployment:
1. Obtain/export the exact GAS source currently deployed in TEST (including all .gs files) and identify its deployment/version metadata without exposing secrets.
2. Compare that source with the current `development` backend files by content/function and record file hashes. Do not overwrite TEST or repository source during comparison.
3. Confirm whether the current `development` modules are actually included in the deployed TEST project and whether the `doPost` routes dispatch to them.
4. Re-run only safe read-only route/preflight checks after the source identity is established.

P1 — Resolve INT-01 fixture gap:
5. Identify valid synthetic TEST enrollment fixtures and an offering that can be used without modifying existing records. Do not use real student accounts or insert records merely to force PASS without a separately reviewed fixture plan.
6. If no suitable fixtures exist, keep the two enrollment checks BLOCKED and document the fixture prerequisite.

P2 — Rebuild test coverage from the actual deployed source:
7. Reconcile INT-02..INT-07 route detection with the current deployed `doPost` and handler implementations. A route's presence alone is not a passing integration test.
8. Implement module-specific tests only after verifying handler signatures, actor authorization, sheet schemas, safe fixtures, write/rollback behavior, and cleanup safeguards.
9. Keep INT-08 separate until deployed TEST browser/LIFF E2E and failure-recovery conditions can be verified.

No application source, schema, deployment, TEST data, or Production data was changed as part of recording this execution result.
