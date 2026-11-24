# WP-SUB-1 Submission Integration Runner v0.1.0

- Project: SPORT NUTRITION CLASSROOM
- Date: 24 November 2026
- Branch: development only
- Status: IMPLEMENTED IN SOURCE — STATIC REVIEW COMPLETE — OWNER GAS PREFLIGHT PENDING
- Governing plan: SUBMISSION_INTEGRATION_TEST_PLAN_v1.0_DRAFT_2026-11-24.md (owner-approved)
- Runner: backend/tests/SNC_SubmissionIntegrationRunner_TEST.gs
- Runner version: 0.1.0
- Runner blob SHA: 837c893e8bfeb3fe835f35e93766e33add0addc8

## 1. Entry points

1. Read-only preflight: SNC_SubmissionIntegrationRunnerPreflight_TEST()
2. Persistent run (one time only):
   SNC_RunSubmissionIntegration_CONFIRMED_TEST('RUN SNC SUBMISSION INTEGRATION WP-SUB-1 2026-11-24')
3. Read-only manifest summary:
   SNC_SubmissionIntegrationManifestSummary_READONLY_TEST()

Do not call the persistent entry point until the read-only runner preflight returns READY. The exact confirmation phrase is mandatory.

## 2. Fixture boundary

- Reuses the existing six synthetic Core Fixture users, six enrollments and one CourseOffering.
- Creates Alpha (2 members), Beta (3 members), and Solo (1 member) through group.create/group.join business handlers.
- Creates Individual, Group max 3, Group max 2, Group unlimited, Group CLOSED and Individual LATE Assignments through Assignment business handlers.
- Does not recreate any of the 14 removed Assignment/Group/GroupMember cleanup targets.
- Does not create users, enrollments, courses, semesters, offerings or SYSTEM_ADMIN roles.
- Does not write directly to business sheets.
- Generated IDs are recorded in the persistent Script Properties manifest immediately after successful fixture creation/handler operations.

## 3. Case coverage

The runner records SUB-01 through SUB-26:
- Individual submission and independence from group membership.
- Non-enrolled rejection.
- Group minimum, configured maximum and unlimited maximum.
- Representative-only submission and non-member rejection.
- Per-group membership lock and lock isolation.
- Individual submission after group lock.
- Duplicate create, revision chain, request replay and payload conflict.
- Late submission while Assignment remains OPEN; CLOSED Assignment rejection.
- Drive/Docs HTTPS URL metadata only; invalid URL and attachment count validation.
- Submission AuditLog reconciliation.
- In-memory notification stub and restoration.
- Controlled in-memory Audit append failure with rollback verification.
- Terminal exact-ID and SubmissionFiles reference reconciliation.

## 4. Side-effect controls

- Exact TEST Script Properties and active Spreadsheet ID guard.
- Existing SYSTEM_ADMIN actor resolved from active UserRoles; no fake administrator.
- Uses business handlers for Group, Assignment and Submission mutations.
- Mandatory in-memory stubs for both notifyAssignmentOpened_ and notifySubmissionReceived_, installed before the first Assignment is opened and restored in finally. This prevents LINE calls and NotificationLogs writes during Assignment opening and Submission creation.
- No DriveApp, UrlFetchApp, LINE push, NotificationLogs, triggers, deployment, setup, migration, or cleanup.
- URL metadata uses synthetic Drive/Docs URLs only; no URL is fetched.
- No deletion or cleanup authorization is included.
- Persistent manifest key: SNC_SUBMISSION_INTEGRATION_MANIFEST_TEST.
- If any case fails or execution is interrupted, runner stops and records post-minus-pre ID deltas. Never rerun the persistent runner; reconcile the manifest and live TEST state first.

## 5. Static review record

Static inspection of the committed runner confirmed:
- All 26 case identifiers are present.
- Exact TEST guard and confirmation phrase are present.
- Persistent manifest and immediate fixture ID capture are present.
- Both Assignment-open and Submission-received notification stubs and restoration are present.
- Controlled Audit append failure injection is present.
- No direct Sheet write API, Drive/network call, broad deletion API, or cleanup routine is present.

This record is static source evidence only. No JavaScript/GAS runtime execution of this runner has occurred. No WP-SUB-1 runtime PASS is claimed.

## 6. Owner execution sequence

1. Add only backend/tests/SNC_SubmissionIntegrationRunner_TEST.gs to the existing TEST Apps Script project.
2. Run SNC_SubmissionIntegrationRunnerPreflight_TEST(). Re-run this read-only preflight after syncing the latest runner revision.
3. Share the complete sanitized Execution Log. Proceed only if status=READY.
4. Run the persistent entry point exactly once using the phrase in Section 1.
5. Share the complete sanitized Execution Log, including any stop/error output.
6. Do not rerun if execution is interrupted, returns STOPPED_REQUIRES_RECONCILIATION, or does not complete normally. Do not perform cleanup.

WP-SUB-2 Drive upload/access and WP-SUB-3 deployed API/LIFF/Browser E2E remain separately gated and are not authorized by this runner.
