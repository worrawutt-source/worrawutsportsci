# SNC Final Cleanup Dry-run — Read-only v1.0.0

**Date:** 23 November 2026  
**Branch:** `development`  
**Related review:** `SNC_SYNTHETIC_FIXTURE_CLEANUP_PREVIEW_v1.2_2026-11-23.md`  
**Status:** IMPLEMENTED — OWNER TEST RUN REQUIRED — CLEANUP NOT AUTHORIZED

## 1. Purpose and strict boundary

This utility performs the final, point-in-time, read-only inspection before any separately authorized cleanup of the exact 14 approved synthetic rows. It does not delete, edit, normalize, repair, or create data. It does not call business handlers, Drive, LINE, UrlFetch, triggers, or deployment functions.

Run only:

```javascript
SNC_FinalCleanupDryRun_READONLY_TEST()
```

Do not run any persistent fixture/integration runner or cleanup function.

The utility always reports:
- `mode: READ_ONLY`
- `writesExpected: 0`
- `externalCallsExpected: 0`
- `cleanupAuthorized: false`
- `deletionPerformed: false`

A PASS means only that the checks in this utility passed against the Spreadsheet state at execution time. It is not approval to delete.

## 2. Exact approved scope

The scope is unchanged from Preview v1.2:
- 4 exact AssignmentID values
- 3 exact GroupID values
- 7 exact GroupMemberID values

The allowlist is cross-checked against the persisted Assignment/Group manifest. The utility blocks on any missing, duplicate, substituted, or additional ID. It does not select rows by prefix, status, row number, or broad predicate.

All AuditLogs, core fixture records, Users, Enrollments, Course, Semester, CourseOffering, Drive files, Script Properties/manifests, triggers, deployments, LINE bindings, and all other rows remain excluded and preserved.

## 3. Checks performed

| Check | Read-only assertion |
|---|---|
| PG-01-ENV | Script Properties identify TEST; configured and active Spreadsheet IDs match the approved TEST Spreadsheet |
| PG-03-MANIFEST | Core and Assignment/Group manifests exist; continuation is COMPLETE_WITH_HISTORICAL_FAILURE |
| HISTORY-ASG13 | Historical ASG-13 FAIL remains in the manifest with expected CONFLICT / actual SUCCESS |
| PG-04-ALLOWLIST | Manifest IDs exactly equal the approved 4/3/7 IDs |
| PG-09-SHEET-COVERAGE | Every current tab (at least 23) has a readable used range and nonblank header row |
| PG-09-NO-DEPENDENCIES | Every used cell is scanned for exact IDs and tokenized composite references; any hit outside target rows and AuditLogs blocks |
| PG-09-TARGET-ROWS | Exactly 4/3/7 candidate rows are found in the correct target sheets |
| PG-05-UNIQUE-ROWS | Each exact primary ID resolves to one and only one row |
| PG-06-ROW-IDENTITY | Candidate title/name, offering, type, status, max group size, membership role/status and left marker match Preview v1.2 |
| PG-07-RELATIONSHIPS | Candidate Groups and Assignments point to the approved Offering; all candidate GroupMembers point to an allowlisted Group |
| PG-08-SUBMISSIONS | Entire Submissions table is readable and has no candidate AssignmentID or GroupID reference |
| PG-10-AUDIT-PRESERVATION | Fresh AuditLogs snapshot has 49 baseline IDs present, 68 unique current IDs, 19 post-baseline IDs, expected event matrix, and candidate audit entity links; preserve all |
| PG-11-BASELINE-PROTECTION | No target ID overlaps the pre-batch Assignment/Group/GroupMember primary-key baseline |
| PG-13-SCOPE-LOCK | Scope remains exactly the 14 owner-approved IDs |
| PG-14-DRY-RUN-REPORT | Structured report is generated with authorization and deletion flags false |

Any missing sheet, unreadable range, malformed manifest, unexpected reference, field mismatch, duplicate ID, or exception produces BLOCKED/REQUIRES_REVIEW. Do not proceed on a partial result.

## 4. AuditLogs evidence limitation

The utility verifies the live state against the retained pre-batch AuditID manifest and the expected 19-event delta. It captures the current AuditID set and event counts in the output. However, no prior full-row snapshot of all 68 AuditLogs was retained in the evidence available to this utility. Therefore it cannot independently prove historical cell-by-cell immutability of every AuditLog row. The owner must preserve all AuditLogs and must not alter them during this process.

## 5. Backup/recovery limitation

This is a read-only utility and does not test backup access or restore capability. PG-12 remains a separate owner-controlled prerequisite, supported by the previously accepted backup/recovery evidence. If that evidence is no longer current or accessible, stop; do not proceed.

## 6. Owner run instructions

1. Confirm the GAS project is the TEST project and corresponds to GitHub `development`.
2. Add only `SNC_FinalCleanupDryRun_READONLY_TEST.gs` to the TEST GAS editor.
3. Save the file.
4. Run only `SNC_FinalCleanupDryRun_READONLY_TEST()`.
5. Copy the complete `SNC_FINAL_CLEANUP_DRY_RUN=` JSON line from Execution log and provide it for review.

Do not run the old fixture runners, migrations, setup, cleanup, or any deletion code.

## 7. Decision gate

- Exact 14-row scope: owner-approved.
- Final read-only dry-run: pending owner execution and review.
- Cleanup execution authorization: **NOT GRANTED**.
- Cleanup implementation: **NOT CREATED**.
- Cleanup status: **NOT STARTED**.

Even if the final dry-run returns PASS, a separate explicit owner instruction is required before any cleanup implementation or deletion operation is considered. This utility itself can never authorize or perform cleanup.
