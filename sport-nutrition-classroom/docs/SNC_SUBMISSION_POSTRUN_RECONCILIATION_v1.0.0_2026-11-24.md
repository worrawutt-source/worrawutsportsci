# WP-SUB-1 Post-Run Reconciliation v1.0.0

- Project: SPORT NUTRITION CLASSROOM
- Date: 24 November 2026
- Branch: development only
- Status: SOURCE IMPLEMENTED — STATIC REVIEW REQUIRED — OWNER TEST GAS RUN PENDING
- Scope: read-only reconciliation of the completed WP-SUB-1 TEST run.
- Required companion source: `backend/tests/SNC_SubmissionIntegrationRunner_TEST.gs`
- Runner blob SHA: `6fd1d994e36b6d16b9019e9e9c0cf9be87a632b7`
- Reconciliation file: `backend/tests/SNC_SubmissionPostRunReconciliation_READONLY_TEST.gs`
- Reconciliation blob SHA: `be185e361947c301baa3b477d7e86682e154a0ce`

## Entry point

Run only:

`SNC_SubmissionPostRunReconciliation_READONLY_TEST()`

The function requires the existing Runner helpers and reads the persisted `SNC_SUBMISSION_INTEGRATION_MANIFEST_TEST` Script Property plus current TEST sheet rows.

## Checks

1. Manifest status and all 26 case records.
2. Every baseline ID retained across Assignments, Groups, GroupMembers, Submissions, SubmissionFiles, IdempotencyKeys and AuditLogs.
3. Every current post-baseline ID exactly matches the corresponding manifest-created ID; duplicate IDs are detected.
4. The original AuditLogs baseline is 68 IDs and remains present; created Audit IDs reconcile to the current delta.
5. Alpha (2 active members), Beta (3 active members plus one temporary join/leave history row), and Solo (one member row now LEFT) match the recorded Group IDs and CourseOffering.
6. Six fixture Assignments belong to the fixture CourseOffering and have the expected Individual/Group type.
7. Fixture Submissions reference fixture Assignments and have valid Individual/Group target fields.
8. Each created SubmissionFile references a fixture Submission.
9. Each fixture Submission has a matching Submission Audit event with RequestID.
10. Both notification hooks were restored; six Assignment-open stub calls and one or more Submission-received stub calls are recorded.

## Safety

- Read-only: no Sheet writes, Script Properties writes, Drive operations, UrlFetch, LINE, triggers, migration, deployment, or cleanup.
- Logs contain counts and Boolean checks only; raw synthetic IDs are not emitted.
- Repeatable; it does not modify the manifest or any business data.
- This is ID/relationship reconciliation, not a historical cell-by-cell comparison. The runner did not snapshot all baseline row values.
- Any BLOCKED check requires investigation from read-only evidence. Do not rerun the persistent runner or cleanup.

## Owner execution

1. Add this single reconciliation file to the existing TEST GAS project after confirming the Runner file is still synchronized to the blob SHA above.
2. Run `SNC_SubmissionPostRunReconciliation_READONLY_TEST()` once (repeat is safe if needed).
3. Share the complete sanitized Execution Log.
4. Do not run the persistent Submission runner, cleanup utility, migrations, setup, triggers, deployment, Drive upload, or LINE functions as part of this step.

No GAS runtime result is claimed by this source change.
