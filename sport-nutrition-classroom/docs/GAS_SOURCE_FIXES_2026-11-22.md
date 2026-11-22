# SPORT NUTRITION CLASSROOM — GAS Source Fixes and Test Runner Correction

- Date: 2026-11-22 (Asia/Bangkok)
- Branch: `development`
- Baseline: DOCS v1.3
- Input snapshot: `SNC_GAS_BACKUP_2026-11-22(1).zip`
- Scope: verified source defects and safe test-support changes only.
- No GAS deployment, Worker deployment, spreadsheet mutation, Script Properties mutation, Drive operation, or Production operation was performed.

## 1. Changes committed

### 1.1 Assignment scheduler fixture override removed

File: `backend/AssignmentManagement.gs`

The file contained two definitions each of:
- `createAssignmentSchedulerTriggerFixtures()`
- `verifyAssignmentSchedulerTriggerFixtures()`

The first definitions were disabled compatibility stubs returning `disabled:true` and `writesExpected:0`. Later definitions overrode those stubs under JavaScript function-declaration behavior. The later implementations appended Assignment rows and wrote a Script Property, creating persistent test data for automatic scheduling that conflicts with the approved manual Assignment open/close workflow.

Change:
- Removed the later persistent fixture-creation and verification implementations.
- Retained the disabled compatibility stubs.
- Did not change the approved Assignment business rules or schema.

Validation:
- Node.js syntax parse: PASS.
- Static inspection: duplicate definitions removed in the committed source; persistent scheduler fixture append/property-write code removed from this module.
- GAS runtime regression: NOT RUN.
- TEST deployment verification: NOT RUN.

### 1.2 Corrected read-only integration route inspection runner

File: `backend/tests/SNC_IntegrationTestRunner_TEST.gs`

Added version 1.0.1 as a new canonical test runner. It corrects the earlier detector defect by checking the exact route literal and handler reference in `String(doPost)`, rather than applying a start-anchored route expression to the beginning of the complete function source.

Safety and interpretation:
- Static source inspection only; no Sheets, Drive, LINE, Script Properties, triggers, or external services are accessed.
- Does not execute application handlers or create fixtures.
- Route presence is reported as NOT RUN, never PASS.
- INT-01 is NOT RUN in this revision because it does not execute database-backed actor/enrollment checks.
- INT-02..INT-07 are NOT RUN when route and handler references exist; BLOCKED only when the expected source evidence is absent.
- INT-08 remains BLOCKED until deployed TEST browser/LIFF E2E and cross-module failure-recovery evidence exist.
- Static checks are separate from suite execution statuses.

Validation:
- Node.js syntax parse: PASS.
- Route-detector positive/negative unit logic: authored; runtime in Apps Script NOT RUN.
- GAS runtime: NOT RUN.
- Deployed TEST API and LIFF E2E: NOT RUN.

## 2. Corrected archive findings

The inspected archive contains 18 files (excluding the enclosing directory):
- 13 backend export files, including `setup.txt`;
- `json.txt` manifest;
- integration runner in `.gs` and `.txt` copies;
- `TestFixtures_TEST.txt`;
- `SchemaMigration_TEST.txt`.

Corrections to earlier audit wording:
- In this latest archive, `setup.txt` is a real setup module containing `SNC_SETUP`, version 1.5.0, and 22 table definitions. It is NOT a duplicate of `UserRoleManagement.txt`. The earlier duplicate-file statement referred to an earlier/incorrect snapshot and is superseded.
- `SNC_IntegrationTestRunner_TEST.gs` and `.txt` are duplicate runner copies; the canonical repository file is now under `backend/tests/`.
- The Assignment duplicate function definitions are confirmed in both the latest archive and GitHub source before the fix.
- The archive's `SchemaMigration_TEST.txt` references `SNC_SETUP.TABLES`, which is present in this latest archive's `setup.txt`.

## 3. Files deliberately not copied or executed

### TestFixtures_TEST.txt

Inspected as source only. It appends synthetic Enrollments and Assignments, writes a Script Properties manifest, and has a cleanup function that deletes rows by exact IDs recorded in that manifest. It uses fixed TEST spreadsheet/account/offering identifiers in the supplied copy.

Decision:
- Do not copy this helper into GAS or execute it yet.
- Before adoption, replace hardcoded environment identifiers with controlled TEST-only configuration, verify the target TEST spreadsheet and fixture identities, confirm all expected schema headers, and review partial-write recovery and cleanup behavior.
- Any fixture creation/cleanup remains a separately controlled TEST data operation. No fixture was created or deleted in this work package.

### SchemaMigration_TEST.txt

Inspected as source only. It is an additive migration helper intended to create exactly nine missing sheets after checking all existing schema headers and then verifying all 22 tables.

Decision:
- Do not execute it.
- Before any migration, run the read-only `inspectSNCDatabaseSchema()` from the correct setup module against the verified TEST spreadsheet, compare its result to the approved schema, and review whether the exact nine-sheet precondition is true.
- Creating sheets is a database change. This commit does not authorize or perform that operation.

### json.txt

The manifest specifies V8, Asia/Bangkok, `USER_DEPLOYING`, and `ANYONE_ANONYMOUS`. It is environment/deployment configuration, not an application source fix. It is not copied to the repository or used to deploy GAS.

## 4. Backend source divergence

The archive and current GitHub source are not fully content-identical. Hash differences alone do not identify semantic changes. This work package intentionally did not overwrite the 11 divergent backend modules with archive exports.

Required follow-up:
1. Complete normalized line-by-line and function-level reconciliation for every divergent module.
2. Determine the actual TEST GAS deployed source revision from Apps Script project/deployment metadata.
3. Resolve differences explicitly while preserving approved DOC-02 requirements and the current repository's source history.
4. Only then prepare the exact committed files for synchronization into GAS TEST.

## 5. Evidence summary

| Item | Result | Evidence level |
|---|---|---|
| Assignment duplicate override removed | PASS | Static source inspection + Node syntax |
| New route detector source syntax | PASS | Node syntax |
| Route detector unit logic in GAS | NOT RUN | Apps Script runtime unavailable |
| INT-01 database-backed checks | NOT RUN | Not implemented in runner 1.0.1 |
| INT-02..INT-07 integration suites | NOT RUN | Route presence is not integration evidence |
| INT-08 browser/LIFF E2E | BLOCKED | Deployed TEST E2E evidence unavailable |
| Fixture creation/cleanup | NOT RUN | Deliberately not executed |
| Schema migration | NOT RUN | Deliberately not executed |
| GAS deployment / Worker deployment | NOT RUN | Not authorized/performed |
| Production verification | NOT RUN | Out of scope |

## 6. Safety conclusion

Only the two source changes described in Section 1 were committed in this work package. No database schema, API contract, business rule, TEST data, Production data, GAS deployment, Worker deployment, or `main` branch was changed.
