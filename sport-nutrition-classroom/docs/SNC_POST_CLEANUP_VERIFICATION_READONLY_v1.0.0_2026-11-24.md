# SNC Post-cleanup Verification — Read-only v1.0.0

Date: 24 November 2026  
Branch: `development`  
Target: TEST Spreadsheet only  
Scope: Exact 14-row cleanup approved in Preview v1.2

## Purpose

Verify the persisted state after the owner-run cleanup reported `COMPLETE`. This utility is read-only and does not attempt to repair, recreate, delete, or otherwise mutate any data.

## Runtime entry point

`SNC_PostCleanupVerification_READONLY_TEST()`

Source:
`backend/tests/SNC_PostCleanupVerification_READONLY_TEST.gs`

## Verification gates

1. Exact TEST Script Properties and active Spreadsheet ID.
2. All 23 expected TEST tabs readable with nonblank headers.
3. All 14 approved AssignmentID/GroupID/GroupMemberID values absent from every non-AuditLogs tab, including composite references.
4. No allowlisted IDs remain in the three target tables; Groups and GroupMembers have zero remaining data rows.
5. Core fixture and Assignment/Group manifests remain available; continuation marker remains intact.
6. All six synthetic Users and their Enrollments remain; exact CourseOffering remains.
7. AuditLogs schema remains the expected eight-column schema.
8. AuditLogs has 68 unique IDs, all 49 baseline IDs, 19 post-baseline events, expected event matrix and correct entity links.

## Safety

- `writesExpected=0`, `externalCallsExpected=0`.
- No Spreadsheet writes, Script Properties writes, application handlers, Drive, LINE, UrlFetch, triggers, deployment, or cleanup calls.
- `cleanupAuthorized=false` and `deletionPerformed=false` in every report.
- A failed check returns `REQUIRES_REVIEW`; do not rerun repeatedly or attempt corrective mutation. Share the complete log for reconciliation.

## Evidence boundary

The owner-provided cleanup Execution Log already reports `COMPLETE`, with 7 GroupMembers, 3 Groups and 4 Assignments deleted; 68 AuditLogs and all non-target rows preserved. This new utility independently checks the current persisted state after that operation.

The verifier cannot reconstruct historical non-target row contents because no pre-cleanup full-row snapshot was persisted outside the cleanup execution. Therefore, it checks current exact-ID absence and core/AuditLog state; the cleanup log remains the evidence for the in-run preservation comparisons. Backup restoration, Web App end-to-end behavior and Submission integration are outside this verification.

## Owner run instructions

1. Add only `SNC_PostCleanupVerification_READONLY_TEST.gs` to the existing TEST GAS project.
2. Run only `SNC_PostCleanupVerification_READONLY_TEST()`.
3. Share the complete `SNC_POST_CLEANUP_VERIFICATION=` log.
4. Do not run any cleanup, migration, persistent integration runner, trigger, Drive, LINE, or deployment function.

A runtime PASS is not claimed until the owner supplies the GAS Execution Log.
