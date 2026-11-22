# SPORT NUTRITION CLASSROOM — GAS Reconciliation Review

- Date: 2026-11-22 (Asia/Bangkok)
- Source snapshot: `SNC_GAS_BACKUP_2026-11-22(1).zip`
- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development`
- Branch HEAD at review start: `09b1924b0e9c4fd76e2101c3ec8db64e6ade0032`
- Project baseline: DOCS v1.3
- Review type: source inventory, function inventory, test helper safety review, route inventory.
- No GAS deployment, Worker deployment, database writes, fixture creation/cleanup, or schema migration was performed.

## 1. Backend source reconciliation status

The latest ZIP has 13 backend export files. Function-name inventories were extracted from the ZIP and fetched GitHub files. For the 12 modules other than AssignmentManagement, the function-name inventories match by count and name/order at the inspected top-level declaration level. AssignmentManagement in the ZIP still has duplicate declarations in the archive; the GitHub source has already been corrected in commit `202433da1c0b73c021b71a926382dc48914561fb`.

Important limitation: matching function inventories do NOT establish equivalent function bodies or behavior. Blob hashes confirm content divergence for the modules below, but line-by-line semantic reconciliation is still required before treating either side as authoritative.

| ZIP export | GitHub file | ZIP function count | GitHub function count | Content state |
|---|---|---:|---:|---|
| code.txt | backend/Code.gs | 32 | 32 | DIFFERENT |
| AssignmentManagement.txt | backend/AssignmentManagement.gs | 21 declarations (19 unique) | 19 declarations | ZIP stale relative to committed safety fix |
| AuditManagement.txt | backend/AuditManagement.gs | 1 | 1 | DIFFERENT |
| CourseManagement.txt | backend/CourseManagement.gs | 57 | 57 | DIFFERENT |
| EnrollmentManagement.txt | backend/EnrollmentManagement.gs | 17 | 17 | DIFFERENT |
| FileManagement.txt | backend/FileManagement.gs | 7 | 7 | DIFFERENT |
| GradingManagement.txt | backend/GradingManagement.gs | 7 | 7 | DIFFERENT |
| GroupManagement.txt | backend/GroupManagement.gs | 10 | 10 | DIFFERENT |
| NotificationManagement.txt | backend/NotificationManagement.gs | 10 | 10 | DIFFERENT |
| StudentPortalManagement.txt | backend/StudentPortalManagement.gs | 1 | 1 | DIFFERENT |
| SubmissionManagement.txt | backend/SubmissionManagement.gs | 14 | 14 | DIFFERENT |
| UserRoleManagement.txt | backend/UserRoleManagement.gs | 3 | 3 | DIFFERENT |
| setup.txt | backend/setup.gs | 6 | 6 | DIFFERENT |

The function counts include nested/local function declarations in some test-heavy modules; they are inventory signals, not a semantic diff.

## 2. TestFixtures_TEST.txt — source review

Status: REVIEW REQUIRED; not committed as executable project source and not executed.

Observed behavior:
- Opens the active spreadsheet but compares its ID to a hardcoded TEST spreadsheet ID.
- Contains hardcoded User IDs for admin/instructor and two students, plus a hardcoded CourseOffering ID.
- Checks required sheets/headers, exact ACTIVE accounts, active instructor assignment, and active offering before writes.
- May append up to two Enrollment rows and always appends two Assignment rows (one GROUP and one INDIVIDUAL).
- Writes a Script Properties manifest before the first data write, then updates it after writes.
- Cleanup deletes only rows whose exact primary-key IDs are listed in the manifest, then deletes the manifest property.
- Uses Script Lock during create and cleanup, but inspection helpers are not locked.

Risks / required hardening before adoption:
1. Hardcoded spreadsheet/account/offering identifiers couple the file to one environment and make accidental reuse risky. Replace with TEST-only Script Properties or an explicit deployment-specific configuration process; never store Production identifiers.
2. A literal confirmation string inside source is not an independent runtime authorization. Require a separate explicit runtime flag or owner-approved invocation gate, with TEST environment verification immediately before each write.
3. Verify all schema headers exactly, not merely that required headers are present. The current helper allows extra/reordered columns in its fixture checks and dynamically maps Assignment columns.
4. Validate the manifest structure and schema before cleanup. Current cleanup trusts manifest IDs after checking only the spreadsheet ID; add allowlisted table/key validation, unique ID validation, and post-cleanup verification before deleting the manifest.
5. The fixture creates an INDIVIDUAL Assignment with MinGroupMembers/MaxGroupMembers set to numeric zero, while the approved application helper serializes these fields as empty for INDIVIDUAL. Align fixture rows to the actual schema/business serialization.
6. Recheck that fixture Status='OPEN' is valid for the current Assignment state model and that opened/closed timestamps satisfy current application expectations.
7. Handle partial failure between Enrollments append, Assignments append, and final manifest update; retain PREPARING manifest and provide a safe recovery report.
8. Avoid logging unnecessary student identifiers; report only the minimum synthetic fixture identifiers needed for verification.

Decision: keep this file out of the repository's executable test directory until hardening and test design review are complete. It must not be run in GAS yet.

## 3. SchemaMigration_TEST.txt — source review

Status: REVIEW REQUIRED; not committed as executable migration source and not executed.

Observed behavior:
- Uses a hardcoded Spreadsheet ID.
- Requires `SNC_SETUP.TABLES`.
- Checks every existing sheet header for exact equality before any write.
- Requires the missing-sheet list to equal exactly nine named tables: Groups, GroupMembers, Submissions, SubmissionFiles, Grades, GradeHistory, GradeReviewRequests, NotificationLogs, IdempotencyKeys.
- Creates only those nine sheets and writes header rows.
- Performs a read-only postflight check of all tables.
- Does not clear/delete/rename existing sheets and does not alter existing rows.
- Uses Script Lock and rechecks each sheet immediately before creation.

Risks / required hardening:
1. Replace hardcoded TEST Spreadsheet ID with an explicit TEST-only configuration that is independently checked against the active spreadsheet and a TEST environment marker.
2. Verify the source schema version and schema fingerprint, not only the presence of `SNC_SETUP.TABLES`.
3. Make the operation resumable: if an exception occurs after creating some sheets, a rerun should safely recognize the exact already-created tables and continue without treating them as an unexpected missing-table set.
4. Verify postflight headers for non-empty sheets and ensure zero data rows were added except the header row.
5. Record a structured migration plan/report before writes; do not automatically delete rollback artifacts or change Script Properties.
6. Confirm that the exact nine-sheet gap is still true in the current TEST spreadsheet using the read-only `inspectSNCDatabaseSchema()` result before any execution.

Decision: do not execute or copy to GAS until the TEST spreadsheet identity, live schema inspection, exact missing-table list, and migration recovery plan are reviewed. This review is not permission to migrate.

## 4. setup.txt versus backend/setup.gs

The latest archive's `setup.txt` is the expected setup module; it defines `SNC_SETUP` version 1.5.0 with 22 table definitions. It is not a duplicate of UserRoleManagement. The archive setup file and GitHub `backend/setup.gs` have different blob hashes and lengths. Their six-function inventories match. The schema object and migration logic still require a property-by-property comparison before choosing a canonical version.

No setup source was overwritten in this review.

## 5. Dispatcher and handler routing

The latest archive `code.txt` and GitHub `backend/Code.gs` both contain the main `doPost` dispatcher and 32 top-level function declarations by the current inventory method. The ZIP dispatcher visibly routes:
- course/semester/offering/instructor
- import/enrollment
- student
- file
- user/role
- audit
- notification
- grade/gradeReview
- submission
- group
- assignment

The GitHub dispatcher source inspection shows the same route families and handler calls. This confirms route-family presence at source level only; it does not prove deployed TEST behavior, payload compatibility, role enforcement, or module integration. Route/action-level parity and frontend caller compatibility remain to be tested.

## 6. Current decisions

- Keep GitHub `development` as the only editable source branch.
- Do not copy the ZIP wholesale into GitHub or GAS.
- Do not add or execute TestFixtures or SchemaMigration until their safety requirements are met.
- Do not deploy GAS or Worker.
- Do not mutate TEST or Production data during this review.
- Continue function-body reconciliation module by module, starting with Code.gs/Code.txt and setup.gs/setup.txt, then modules that own data writes and authorization.
