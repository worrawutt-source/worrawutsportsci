# SPORT NUTRITION CLASSROOM — GAS Source Reconciliation

- Audit date: 2026-11-22 (Asia/Bangkok)
- Uploaded snapshot: `SNC_GAS_BACKUP_2026-11-22.zip`
- Repository: `worrawutt-source/worrawutsportsci`
- Branch audited: `development`
- Branch HEAD at audit: `034eb31874c72f7c0eb0a65cb32b7b6fd034b3f3`
- Project baseline: DOCS v1.3
- Scope: archive inventory, source-to-repository hash comparison, route/runner inspection, static syntax parsing.
- No GAS deployment, TEST/PRODUCTION spreadsheet, Script Properties, Drive files, or application data were changed.

## 1. Executive findings

1. The uploaded archive contains 18 files: 13 named backend source/export files, app manifest, integration runner in both `.gs` and `.txt` forms, a TEST fixture helper, and a TEST schema migration helper.
2. The archive does contain the Group, Submission, File, Grading, Notification, Enrollment, and other backend handlers. The earlier interpretation that INT-02..INT-07 were blocked because these modules were absent from this 22-Nov snapshot is incorrect.
3. The primary cause of INT-02..INT-07 being reported BLOCKED is a defect in the runner's route-detection function. It applies anchored regular expressions such as `/^group\./` to the entire string representation of `doPost`, which begins with `function doPost(e)`. The anchors therefore cannot match. The runner consequently reports BLOCKED even though the corresponding route branches are present in `code.txt`.
4. The runner's own intended behavior is to report a detected route with no implemented suite procedure as `NOT RUN`, not `BLOCKED`. INT-02..INT-07 should be reclassified as NOT RUN after correcting route detection; this does not mean those integration tests have passed.
5. INT-01's `enrollment.list` action is present in this 22-Nov archive. The earlier 21-Nov snapshot warning about that action is superseded for this archive. The execution log confirms the runner called the handler and got 0 enrollment rows for each student fixture; the two fixture-presence checks remain BLOCKED because no active enrollment records were found.
6. The archive does not provide a valid copy of the repository's `backend/setup.gs`: `setup.txt` is byte-for-byte the same source content as `UserRoleManagement.txt`, and does not define `SNC_SETUP`. The TEST migration helper references `SNC_SETUP.TABLES`, so its prerequisite definition is absent from this archive.
7. Only one of the 12 comparable backend source files matches the current GitHub `development` blob exactly after normalizing CRLF to LF: `AssignmentManagement.txt` matches `AssignmentManagement.gs`. The other 11 comparable files differ. The setup module is missing/incorrectly represented. This proves the uploaded GAS snapshot is not source-identical to the current GitHub branch; it does not by itself prove which side is deployed or which differences are behaviorally significant.

## 2. Archive inventory

| Archive entry | Purpose / observation |
|---|---|
| `code.txt` | API foundation and `doPost` dispatcher |
| `AssignmentManagement.txt` | Assignment handler and scheduler-related functions |
| `AuditManagement.txt` | Audit handler |
| `CourseManagement.txt` | Course, semester, offering, instructor handlers |
| `EnrollmentManagement.txt` | Import and enrollment handlers |
| `FileManagement.txt` | File upload/access handlers |
| `GradingManagement.txt` | Grade and grade-review handlers |
| `GroupManagement.txt` | Group handlers |
| `NotificationManagement.txt` | Notification handlers |
| `StudentPortalManagement.txt` | Student portal handlers |
| `SubmissionManagement.txt` | Submission/revision handlers |
| `UserRoleManagement.txt` | User and role administration |
| `setup.txt` | Duplicate content of `UserRoleManagement.txt`; not the expected setup module |
| `json.txt` | Apps Script manifest |
| `SNC_IntegrationTestRunner_TEST.gs` | Runner source used for this test |
| `SNC_IntegrationTestRunner_TEST.txt` | Same runner source as the .gs copy after line-ending normalization |
| `TestFixtures_TEST.txt` | Separate TEST fixture creation/inspection/cleanup helper; not executed in the reported run |
| `SchemaMigration_TEST.txt` | TEST-only missing-sheet migration helper; not executed in this audit |

## 3. Route evidence in the uploaded API dispatcher

The uploaded `code.txt` contains these route branches:
- `file.` → `handleFileManagementAction_`
- `notification.` → `handleNotificationAction_`
- `grade.` / `gradeReview.` → `handleGradingAction_`
- `submission.` → `handleSubmissionManagementAction_`
- `group.` → `handleGroupManagementAction_`

The corresponding handler functions exist in their named archive files. The action inventory also includes:
- Group: `group.list`, `group.create`, `group.join`, `group.leave`, `group.members`, `group.selectRepresentative`, `group.addMember`, `group.removeMember`
- Submission: `submission.create`, `submission.revise`, `submission.list`, `submission.get`
- File: `file.upload`, `file.access`
- Grading: `grade.create`, `grade.update`, `grade.get`, `grade.history`, `gradeReview.create`, `gradeReview.list`, `gradeReview.update`
- Notification: `notification.send`, `notification.log`, `notification.retry`
- Enrollment: `enrollment.list`, `enrollment.update`, `import.preview`, `import.execute`, `import.result`

Presence of routes/actions is source inspection evidence only. It does not prove that deployed integration, authorization, Drive operations, rollback, or E2E tests pass.

## 4. Runner defect explaining the BLOCKED statuses

Current runner code:

```javascript
function sncITR_hasDoPostRoute_TEST_(routeRegex) {
  if (typeof doPost !== 'function') return false;
  return routeRegex.test(String(doPost));
}
```

The caller supplies patterns anchored at the beginning, for example `/^group\./`, `/^submission\./`, `/^file\./`, and `/^notification\./`. The value being tested is the complete function source string, which begins with `function doPost(e)`, not the route name. Thus these anchored expressions do not match the function source. This makes the route check return false and causes INT-02..INT-07 to be incorrectly marked BLOCKED.

Required correction:
- Do not use a start-anchored route regex against the entire function source.
- Prefer explicit, deterministic checks for the existence of each expected handler plus a separately verified dispatcher-route check; or, if source-string inspection is retained, use a non-anchored pattern and verify that the runtime exposes the function source as expected.
- Keep suite status as NOT RUN where the route exists but no actual suite procedure is implemented. Do not change NOT RUN to PASS.
- Add a unit test for the route-detection helper using representative dispatcher source text.

## 5. TEST run interpretation

The supplied 22-Nov execution log reported:
- Overall: PASS 0 / FAIL 0 / BLOCKED 8 / NOT RUN 0.
- INT-01: 10 subchecks PASS, 0 FAIL, 2 BLOCKED; active users/roles and handler reads succeeded; student enrollment lists returned 0 rows; offering list returned 3 rows.
- INT-02..INT-07: reported BLOCKED by the defective route detector described above; their status should be NOT RUN pending implementation of suite-specific tests, not PASS.
- INT-08: remains BLOCKED pending deployed browser/LIFF E2E and cross-module failure-recovery evidence.
- No fixtures were created or deleted by this runner execution.

Do not reinterpret the 10 INT-01 subchecks as a suite-level PASS. INT-01 remains BLOCKED until the required active TEST enrollment fixtures exist or the test preconditions are otherwise met under an approved fixture plan.

## 6. Source comparison against current GitHub development

GitHub source blob SHAs were fetched from the current `development` branch. Local archive hashes below are Git blob SHA-1 values computed after converting CRLF to LF, so they can be compared directly to GitHub blob SHAs.

| Archive file | GitHub path | Archive normalized blob SHA | GitHub blob SHA | Result |
|---|---|---|---|---|
| `code.txt` | `backend/Code.gs` | `0c1bd9a6fc06c5a51317f1b2c904733dc697e55d` | `6c7ae93d00bc76c6e5ca43c93b05c46c5ee1774d` | DIFFERENT |
| `AssignmentManagement.txt` | `backend/AssignmentManagement.gs` | `c02a56f17a935e2a8a9e957cbdf2955a1d255087` | `c02a56f17a935e2a8a9e957cbdf2955a1d255087` | MATCH |
| `AuditManagement.txt` | `backend/AuditManagement.gs` | `24eb865f7c278c6afe672ec13cdd5e004967ea60` | `3d640aa1dbf0e30699ea7706637fd1b7cadbe452` | DIFFERENT |
| `CourseManagement.txt` | `backend/CourseManagement.gs` | `d8a336d648959eda89e7aea6d2f95849c49cb22b` | `52a7f4049ff51772226fe33369cc26a0acb02a1b` | DIFFERENT |
| `EnrollmentManagement.txt` | `backend/EnrollmentManagement.gs` | `17e318f31ddd3a720fa8e61e50c15b87d7b5ede1` | `a4ccfc11c4825155aa0732de6460cc4ac1c705db` | DIFFERENT |
| `FileManagement.txt` | `backend/FileManagement.gs` | `38904fe6e56362ff6089ae01a2732256a7b09066` | `86cd29160dd00207c9a575ce801da09e643911cb` | DIFFERENT |
| `GradingManagement.txt` | `backend/GradingManagement.gs` | `5a5c9390f40e57e5521f96454e42f0108dc8b84b` | `12bd34c5dd857250c7d6ccd76e28b5da7f4507f8` | DIFFERENT |
| `GroupManagement.txt` | `backend/GroupManagement.gs` | `7b82b52894395c6ae40ca9307fe917ec09cf012b` | `9dc280d88bcee8e346d028082cae725fe2d88ee8` | DIFFERENT |
| `NotificationManagement.txt` | `backend/NotificationManagement.gs` | `11bddb26f91c295dc828d6480a9308833cd7a0f0` | `875b60d90f4599ee0f9bdf0f60dcea31e215de7b` | DIFFERENT |
| `StudentPortalManagement.txt` | `backend/StudentPortalManagement.gs` | `c43b3704ebb6cf5ae7e38948b275b223aab33d6f` | `0d289ba8425437b303a274c1156bbaa3b7028860` | DIFFERENT |
| `SubmissionManagement.txt` | `backend/SubmissionManagement.gs` | `6668cc87133f1db91251887dfa3a8bceb7fc1ff4` | `ef4b86678e8c1feeea425ba578501846129a229c` | DIFFERENT |
| `UserRoleManagement.txt` | `backend/UserRoleManagement.gs` | `88d99101f6a710d14fd427044004f2f14a9e3575` | `86682f156ebd58a7a7a21b64a4fefe3fd763ea86` | DIFFERENT |
| `setup.txt` | `backend/setup.gs` | Duplicate of UserRoleManagement content | `2d573129bedfbb4d839063f67bad9657658e3ac4` | MISSING / INCORRECT FILE |

A hash mismatch establishes content divergence, but does not identify the exact semantic changes. A line-by-line diff against the repository source is still required before deciding which source should be treated as authoritative or deployed.

## 7. Static validation and safety

- All JavaScript source files extracted from this archive, including the runner, passed Node.js syntax parsing (`node --check`).
- This is a syntax check only; it is not a Google Apps Script runtime test.
- No likely credential patterns (private key header, Google API key, JWT-shaped token, or long token-like string) were detected by the limited archive scan. This is not a comprehensive secret audit.
- `TestFixtures_TEST.txt` and `SchemaMigration_TEST.txt` were inspected as source only. Neither was executed.
- No TEST/PRODUCTION data was changed.

## 8. Recommended next work package

1. Correct the route-detection helper and revise the report classification for INT-02..INT-07 to NOT RUN until suite-specific test procedures exist.
2. Compare the 11 divergent source files line-by-line against current GitHub `development`; produce a semantic diff report and identify the actual deployed revision from Apps Script deployment metadata.
3. Obtain the correct `setup.gs` export and reconcile it with `SNC_SETUP.TABLES` references before running any migration helper.
4. Keep INT-01 enrollment fixture checks BLOCKED unless a safe, approved synthetic TEST fixture is available.
5. Design module-specific tests with explicit preconditions, actor/role, fixtures, expected outputs, write impact, cleanup, and evidence level.
6. Do not deploy source, run migration, create/delete fixtures, or alter spreadsheet data as part of this reconciliation without the applicable approval and safety checks.

---
This report records source inspection and static validation. It does not certify the deployed TEST application or declare the MVP ready.
