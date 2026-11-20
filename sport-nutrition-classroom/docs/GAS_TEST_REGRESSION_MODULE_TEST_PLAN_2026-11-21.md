# GAS TEST Regression & Module Test Plan

**Date:** 2026-11-21  
**Source:** GitHub `development` HEAD `efc6e8936915bd2cc78ca3d6c6932c72da555689`  
**Target:** GAS TEST only. Production and `main` are out of scope.

## Execution gate

The current assistant session can read GitHub source but has no authenticated Google Apps Script Editor or GAS TEST deployment execution capability. Therefore this document is an execution plan, not a claim that GAS runtime tests have passed. Before running any database-reading test, confirm the active Apps Script project is attached to TEST spreadsheet ID:

`1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk`

Never run a test against an unverified active spreadsheet.

## 1. Safe first-pass tests

Run these first in the GAS editor after confirming the TEST project and active spreadsheet.

| Module | Function | Expected behavior | Data effects |
|---|---|---|---|
| Assignment | `testAssignmentManagementSchemaPreflight()` | Confirms exact Assignment headers | Read-only; includes TEST spreadsheet ID guard |
| Assignment | `testAssignmentSchedulerLogicUnit()` | 13 pure scheduler logic cases | No spreadsheet; writesExpected=0 |
| Course | `testCourseManagementPreflight()` | Checks UserRoles, Courses, Semesters, CourseOfferings, CourseInstructors headers | Read-only; does not itself enforce TEST ID |
| Course | `testCourseManagementAuthorizationLogic()` | Pure role/scope authorization and visibility predicates | In-memory only; no sheet writes expected |
| Course | `testCourseManagementLiveAuthorizationData()` | Validates active role and instructor scope mappings against current TEST rows | Read-only |
| Course | `testDataIntegrityAuditLogReadOnly()` | Schema, key uniqueness, references, AuditLogs metadata | Read-only; includes TEST spreadsheet ID guard |
| Enrollment | `testEnrollmentImportLogicUnit()` | Row normalization and import conflict validation | Pure in-memory; writesExpected=0 |
| Enrollment | `testEnrollmentAuthorizationPredicatesUnit()` | Import authorization role/scope predicates | Pure in-memory |
| Enrollment | `testEnrollmentSchemaPreflight()` | Checks enrollment-related schema | Read-only; verify TEST project first |

Record the complete Execution Log output and the returned JSON object for each function.

## 2. Conditional read-only regression tests

Run only if the TEST data has the required existing records; BLOCKED is an acceptable result when preconditions are absent.

- `testCourseManagementReadEndpointsWithLinkedAdmin()`: requires an active SYSTEM_ADMIN role and active LINE account link; calls read endpoints only.
- `testSimulatedInstructorNegativeAuthorization()`: verifies simulated instructor denial; inspect current test implementation before execution.
- `testInstructorDataScopeIsolation()`: requires suitable active instructor/offering records; verify no fixture creation before execution.
- `testCourseCoordinatorScopeIsolation()`: requires suitable scoped coordinator records; verify no fixture creation before execution.
- `testSystemAdminAuthorizationAndPermissionBoundary()`: read/denial boundary test; inspect implementation for writes before execution.
- `testSecurityRevocationSpoofingAndAudit()`: denial/spoofing and audit invariance checks; execute only after confirming the function performs no writes and the TEST dataset has suitable records.
- `testDuplicateRequestAuditConsistencyReadOnly()`: despite its name, it invokes create requests and requires a special existing fixture. Do not run unless its behavior and fixture are independently reviewed; RequestID is not an idempotency key.
- `testEnrollmentAuthorizationPredicatesUnit()`: already included in first-pass list; no TEST data required.

## 3. Do not run in this batch

- `testAssignmentSchedulerIntegration()`: source explicitly appends three persistent Assignment fixtures and declares `cleanupPerformed:false`. A prior scheduler fixture run was already completed and cleaned up; do not recreate these fixtures.
- `testSyntheticIdentityAndRoleRevocationFixtures()`: do not run until its implementation and cleanup behavior are reviewed.
- Any function that appends rows, changes statuses, creates fixture entities, or modifies triggers without a dedicated approved cleanup plan.

## 4. Regression acceptance criteria

- Every executed test is recorded as PASS, FAIL, BLOCKED, or NOT RUN.
- BLOCKED and NOT RUN are never counted as PASS.
- Schema preflights must match expected headers exactly.
- Assignment scheduler logic unit test must report all cases PASS.
- Course authorization logic must report all cases PASS, including negative scope tests.
- Enrollment import and authorization unit tests must report all cases PASS.
- Read-only data integrity test must report zero failures.
- No TEST rows, AuditLogs, trigger settings, or existing fixtures are changed by the selected read-only batch.

## 5. Evidence required for closure

For each function, record:
- Function name and execution timestamp
- GAS project/deployment environment and confirmed TEST spreadsheet ID
- Complete execution result JSON
- PASS/FAIL/BLOCKED count
- Any execution error and stack trace
- Confirmation that no sheet rows or trigger settings were modified

This batch does not certify Browser/LINE LIFF end-to-end behavior or Production.
