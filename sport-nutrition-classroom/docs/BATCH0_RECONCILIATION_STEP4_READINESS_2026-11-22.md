# SPORT NUTRITION CLASSROOM — Batch 0 Reconciliation & Step 4 Readiness

- Date: 22 November 2026 (Asia/Bangkok)
- Repository: worrawutt-source/worrawutsportsci
- Branch: development
- Verified HEAD before this report: 0e60b5fa12bcdf6b87b141eaff1566ac0d089a5e
- Baseline: DOCS v1.3; SNC-WG-001 v1.0.0
- GAS snapshot: SNC_GAS_BACKUP_2026-11-22(2).zip
- TEST Spreadsheet ID supplied by Project Owner: 1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk
- Scope: evidence reconciliation, source hash comparison, static syntax validation, runner inspection, test-readiness assessment.
- Safety: no GAS source write, GitHub backend source write, deployment, spreadsheet write, migration, fixture creation, fixture cleanup, LINE request, or production access was performed.

## 1. Executive result

Batch 0 is NOT CLEARED for deployed integration testing. The latest backup is structurally complete for the 13 backend modules, but all 13 normalized Git blob hashes differ from the GitHub development HEAD. A semantic, line-by-line diff is still required before any source synchronization. The live GAS environment, active spreadsheet binding, deployment-to-TEST URL mapping, and LINE TEST/PRODUCTION separation are not independently verified.

Static syntax parsing passed for all 16 JavaScript/Apps Script source files in the archive (13 backend modules plus the integration runner, fixture helper, and migration helper). This is archive-level syntax evidence only.

## 2. GitHub verification

- development branch exists.
- HEAD: 0e60b5fa12bcdf6b87b141eaff1566ac0d089a5e
- Latest commit: docs(snc): finalize backend reconciliation evidence
- Commit timestamp: 2026-11-22T04:55:24Z
- Parent: 2edf500da22421cdacd851740fb858b3f2d25466
- Latest commit changes only sport-nutrition-classroom/docs/BACKEND_RECONCILIATION_REMEDIATION_2026-11-22.md (3 additions, 0 deletions); it does not change backend source.
- GitHub branch and commit were re-fetched for this work package.

## 3. GAS screenshot evidence

Observed from Project Owner screenshots:
- Apps Script project title: Nutrition Project.
- Visible backend files: Code.gs, setup.gs, AssignmentManagement.gs, AuditManagement.gs, CourseManagement.gs, EnrollmentManagement.gs, FileManagement.gs, GradingManagement.gs, GroupManagement.gs, NotificationManagement.gs, StudentPortalManagement.gs, SubmissionManagement.gs, UserRoleManagement.gs.
- TEST helper files visible: SchemaMigration_TEST.gs, TestFixtures_TEST.gs, SNC_IntegrationTestRunner_TEST.gs.
- Script Properties names visible: LINE_CHANNEL_ID, SNC_ACCOUNT_LINKING_SCHEMA_VERSION, SNC_ASSIGNMENT_SCHEDULER_SPREADSHEET_ID, SNC_INITIAL_ADMIN_STUDENT_ID, SNC_ITR_ENVIRONMENT, SNC_ITR_TEST_SPREADSHEET_ID, SNC_OTP_PEPPER, SNC_SCHEDULER_TRIGGER_TEST_TAG. Values were not disclosed or inspected.
- Web App deployment screenshot: Execute as Me; Who has access Anyone; Deployment ID and URL truncated. The screenshot does not establish that this deployment is the TEST endpoint.
- Project Owner supplied TEST Spreadsheet ID 1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk. It matches the TEST ID recorded in backend documentation and TEST helpers, but active container-bound spreadsheet identity has not been read from GAS.

## 4. Archive inventory and source hash comparison

The archive contains 18 files: 13 backend source exports, appsscript manifest, integration runner in .gs and .txt forms, TestFixtures_TEST.txt, and SchemaMigration_TEST.txt.

Hashes below are Git blob SHA-1 values computed from archive files after normalizing CRLF/CR to LF. GitHub hashes are from the verified HEAD tree.

| Archive file | GitHub file | Archive blob SHA | GitHub blob SHA | Result |
|---|---|---|---|---|
| code.txt | backend/Code.gs | 0c1bd9a6fc06c5a51317f1b2c904733dc697e55d | b46be6a82576ae97e36afe4639a859c17ead94d9 | DIFFERENT |
| setup.txt | backend/setup.gs | 540a14845fd45655d6ae8a295620678e3a678d19 | 10cd8a90a0631131268fec11d5bd011a46551644 | DIFFERENT |
| AssignmentManagement.txt | backend/AssignmentManagement.gs | c02a56f17a935e2a8a9e957cbdf2955a1d255087 | ae56f8931c986dd8bbaafe72af219c9ca3d5044b | DIFFERENT |
| AuditManagement.txt | backend/AuditManagement.gs | 24eb865f7c278c6afe672ec13cdd5e004967ea60 | 3d640aa1dbf0e30699ea7706637fd1b7cadbe452 | DIFFERENT |
| CourseManagement.txt | backend/CourseManagement.gs | d8a336d648959eda89e7aea6d2f95849c49cb22b | 52a7f4049ff51772226fe33369cc26a0acb02a1b | DIFFERENT |
| EnrollmentManagement.txt | backend/EnrollmentManagement.gs | 17e318f31ddd3a720fa8e61e50c15b87d7b5ede1 | a4ccfc11c4825155aa0732de6460cc4ac1c705db | DIFFERENT |
| FileManagement.txt | backend/FileManagement.gs | 38904fe6e56362ff6089ae01a2732256a7b09066 | 86cd29160dd00207c9a575ce801da09e643911cb | DIFFERENT |
| GradingManagement.txt | backend/GradingManagement.gs | 5a5c9390f40e57e5521f96454e42f0108dc8b84b | 12bd34c5dd857250c7d6ccd76e28b5da7f4507f8 | DIFFERENT |
| GroupManagement.txt | backend/GroupManagement.gs | 7b82b52894395c6ae40ca9307fe917ec09cf012b | 9dc280d88bcee8e346d028082cae725fe2d88ee8 | DIFFERENT |
| NotificationManagement.txt | backend/NotificationManagement.gs | 11bddb26f91c295dc828d6480a9308833cd7a0f0 | 875b60d90f4599ee0f9bdf0f60dcea31e215de7b | DIFFERENT |
| StudentPortalManagement.txt | backend/StudentPortalManagement.gs | c43b3704ebb6cf5ae7e38948b275b223aab33d6f | 0d289ba8425437b303a274c1156bbaa3b7028860 | DIFFERENT |
| SubmissionManagement.txt | backend/SubmissionManagement.gs | 6668cc87133f1db91251887dfa3a8bceb7fc1ff4 | ef4b86678e8c1feeea425ba578501846129a229c | DIFFERENT |
| UserRoleManagement.txt | backend/UserRoleManagement.gs | 88d99101f6a710d14fd427044004f2f14a9e3575 | 86682f156ebd58a7a7a21b64a4fefe3fd763ea86 | DIFFERENT |

Result: 0 MATCH / 13 DIFFERENT. Hash mismatch proves content divergence only; it does not by itself establish semantic impact or which GAS code is currently deployed.

Correction to earlier handoff interpretation: this 22-Nov archive DOES contain a proper setup.txt defining SNC_SETUP and all 13 backend exports. The older 22-Nov reconciliation note described a different snapshot in which setup.txt duplicated UserRoleManagement; that observation must not be applied to this newly supplied archive.

## 5. Static checks

- JavaScript/Apps Script syntax: 16/16 PASS using Node.js stdin parsing (avoids Node treating .gs/.txt as unknown extensions).
- This is not GAS V8 runtime validation.
- appsscript manifest: timeZone Asia/Bangkok, runtime V8, executeAs USER_DEPLOYING, access ANYONE_ANONYMOUS.
- No migration or fixture helper was executed.

## 6. Integration Test Runner findings

The archive's SNC_IntegrationTestRunner_TEST.gs contains a route-detection defect:

```javascript
function sncITR_hasDoPostRoute_TEST_(routeRegex) {
  if (typeof doPost !== 'function') return false;
  return routeRegex.test(String(doPost));
}
```

The runner supplies anchored expressions such as /^group\./, /^submission\./, /^file\./, /^notification\./ and /^(grade\.|gradeReview\.)/. These are tested against the complete source string of doPost, which begins with 'function doPost(e)', not against an action name. A local reproduction against the archived dispatcher source returned false for all five route patterns. Therefore INT-02 through INT-07 can be incorrectly classified BLOCKED even where dispatcher branches and modules exist.

Required runner remediation before relying on suite statuses:
1. Replace the source-string route test with deterministic dispatcher evidence checks for each action family.
2. Add pure unit tests covering positive and negative route detection.
3. Verify handler function presence separately from dispatcher route presence.
4. Keep a suite NOT RUN when its route exists but no suite-specific test procedure exists. Do not mark it PASS.
5. INT-08 remains BLOCKED until deployed TEST Browser/LIFF and failure-recovery evidence exists.

INT-01 requires the strict environment guard to pass and its existing read-only TEST preconditions to be satisfied. Do not run it until environment identity is verified.

## 7. Test helper and migration safety

- TestFixtures_TEST.txt includes functions to inspect, create, inspect and clean up fixtures. Creation writes Enrollment and Assignment rows and stores a manifest in Script Properties. Cleanup deletes exact recorded fixture IDs. Neither helper was executed.
- SchemaMigration_TEST.txt creates nine missing Sheets after strict checks and is a persistent schema change. It was not executed.
- The migration references SNC_SETUP.TABLES and requires the correct setup.gs loaded in the same GAS project. Do not execute before the source reconciliation and explicit schema safety gate.
- No student account, real LINE account, or existing TEST data should be modified to satisfy test preconditions without an approved fixture plan.

## 8. Environment and LINE blockers

| Check | Result | Evidence gap |
|---|---|---|
| GAS Project file inventory | PASS | Screenshot confirms visible modules |
| TEST environment identity | BLOCKED | SNC_ITR_ENVIRONMENT value not visible/verified |
| Active Spreadsheet binding | BLOCKED | No read-only GAS result proving active ID |
| TEST Spreadsheet ID reference | PARTIAL | Owner-supplied ID matches documented TEST ID |
| Script Property names | PASS | Names visible; values intentionally not exposed |
| Deployment settings | PARTIAL | Execute as Me / Anyone visible; URL and deployment identity truncated |
| TEST API URL | BLOCKED | Cannot confirm URL maps to TEST GAS deployment |
| LINE TEST/PRODUCTION isolation | BLOCKED | No evidence of separate LIFF/channel configuration or Worker environment target |
| GAS vs GitHub semantic diff | BLOCKED | All hashes differ; line-by-line semantic review still required |

The current GitHub student portal source has a hardcoded LIFF ID and API URL configuration. The Worker source obtains its GAS upstream from GAS_API_URL. Runtime values and TEST/Production separation cannot be established from source alone; dashboard/environment evidence is required.

## 9. Reconciliation plan

Do not synchronize any file yet.

R1 — Semantic diff: compare each of the 13 files function-by-function and classify ADDED, REMOVED, MODIFIED, UNCHANGED, and configuration-only differences. Prioritize Code.gs dispatcher/authentication, setup.gs/schema, UserRoleManagement, Enrollment, Assignment, Group, Submission, File, Grading, Notification and Audit.

R2 — Decision matrix: for every changed function, identify DOCS v1.3 requirement, GAS behavior, GitHub behavior, data/schema impact, API contract impact, security impact, and recommended target.

R3 — Controlled synchronization plan: list exact target files, backup/rollback, validation commands, and post-sync regression tests. No file replacement until Project Owner approval and a verified GAS TEST identity.

R4 — TEST environment closure: privately verify SNC_ITR_ENVIRONMENT=TEST, SNC_ITR_TEST_SPREADSHEET_ID equals the supplied TEST ID, active spreadsheet matches, and TEST API URL points to the intended GAS TEST deployment. Do not expose secret values.

R5 — LINE separation: verify distinct TEST LIFF/LINE configuration and Worker upstream target. Do not use Production credentials or send real LINE messages during preflight.

## 10. Readiness for system testing step 4

NOT READY. The following gates must pass before step 4 is authorized:
- GAS TEST identity and active spreadsheet binding verified.
- TEST deployment/API URL mapping verified.
- LINE TEST/PRODUCTION separation verified.
- All 13 source differences semantically reviewed and reconciliation approved.
- Runner route detection corrected and its pure tests passed.
- Approved TEST fixture and cleanup plan reviewed; fixtures remain uncreated until the relevant test batch approval.
- No unresolved schema mismatch or unsafe migration precondition.

## 11. Work performed / not performed

PASS:
- Re-fetched development branch and HEAD.
- Inspected Working Guidelines and approved DOCS v1.3 materials.
- Inspected the newly supplied GAS backup inventory.
- Computed all 13 archive Git blob hashes and compared them to the HEAD tree.
- Ran static syntax parsing for 16 source files.
- Reproduced the runner route-detection defect.
- Reviewed fixture and migration helpers as source only.

NOT RUN:
- GAS runtime execution.
- Spreadsheet read-only inspection from Apps Script.
- Deployed TEST API calls.
- LINE/LIFF/Worker runtime checks.
- Unit/Integration tests against live TEST data.
- Schema migration and fixture operations.

No production or live TEST data was changed. No source code was synchronized. No deployment was performed.


## 12. Addendum — Owner confirmation and live read-only schema inspection

Evidence received after the initial report:
- Project Owner confirmed `SNC_ITR_ENVIRONMENT = TEST`. This closes the explicit environment-property value check based on owner confirmation; the value was not independently read by the assistant.
- Project Owner ran `inspectSNCDatabaseSchema()`. Execution completed with `success: true`, `mode: READ_ONLY_SCHEMA_INSPECTION`, `schemaVersion: 1.5.0`, spreadsheet ID `1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk`, and spreadsheet name `SportNutritionApp`.
- The inspected function sets success to true only when `missingTables.length === 0` and `headerMismatches.length === 0`. Therefore the returned success=true establishes that every table declared in the active `SNC_SETUP.TABLES` was present and matched the expected header sequence under this inspector's criteria. The output itself was truncated in the execution log, so individual table rows beyond the visible portion are not separately evidenced in the supplied log.
- This verifies the active spreadsheet binding for the execution that produced the log. No write operation was performed by this inspection.

## 13. Addendum — Runner source comparison

The GAS archive runner and GitHub development runner are not the same revision:
- Archived GAS backup runner contains `sncITR_hasDoPostRoute_TEST_(routeRegex)`, which applies route regexes to `String(doPost)`; this is defective because it tests an anchored action regex against the entire function source.
- GitHub development contains `backend/tests/SNC_IntegrationTestRunner_TEST.gs`, version 1.0.1, with a different read-only static dispatcher inspection design. It searches for exact route literals and handler names, includes positive/negative route-detector unit checks, and explicitly leaves integration suites NOT RUN unless suite procedures are implemented.
- This GitHub runner is a proposed reconciliation target, not evidence that the deployed GAS project currently contains it. It has not been copied into GAS or executed.
- GitHub runner blob at the HEAD reviewed for this addendum: `49cee4ea49b99cb27024c2647cb85de890286743`.

Required action: review and approve the exact runner replacement before synchronizing it into the verified TEST GAS project. The replacement must be syntax-checked and its pure route detector unit check executed in GAS TEST before any database-backed suite is considered.

## 14. Updated gate status

| Gate | Updated result | Basis |
|---|---|---|
| GitHub branch/HEAD | PASS | Re-fetched development HEAD |
| GAS project inventory | PASS | Owner screenshots |
| SNC_ITR_ENVIRONMENT | PASS (owner-confirmed) | Owner explicitly confirmed TEST |
| Active TEST spreadsheet binding | PASS | Read-only execution returned the exact TEST ID and name |
| Schema inspection | PASS | success=true from read-only inspector; function success criteria reviewed |
| TEST deployment/API URL mapping | BLOCKED | Deployment URL and identity remain truncated/unverified |
| LINE TEST/PRODUCTION separation | BLOCKED | No verified LIFF/channel/Worker runtime configuration evidence |
| 13 backend semantic differences | BLOCKED | Hashes differ; full function-by-function semantic decision matrix not yet completed |
| GAS runner reconciliation | BLOCKED | Archive runner defective; GitHub v1.0.1 candidate exists but is not deployed to GAS |
| Step 4 readiness | NOT CLEARED | Deployment, LINE, source and runner gates remain open |

No source synchronization, deployment, migration, fixture creation/cleanup, spreadsheet write, or Production access was performed after the initial report.
