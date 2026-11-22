# Current Project Checkpoint

- Updated: 22 November 2026 (Asia/Bangkok)
- Repository: `worrawutt-source/worrawutsportsci`
- Working branch: `development` only
- Checkpoint source HEAD before this update: `8fb2a4bda6e73cc5a8a72462f54dea1efe77439b`
- This checkpoint commit: `61a8422f60bc132d79667f4725e4a2cfe478592b`
- GAS evidence: `SNC_GAS_BACKUP_2026-11-22(3).zip`
- Approved requirements: DOCS v1.3 DOC-01 v1.0 / DOC-02 v1.1; Working Guidelines SNC-WG-001 v1.0.0
- Test plan: SNC-TEST-PLAN-001 v1.1, Steps 0–3 previously completed by owner; next target is Step 4.

## Decision — controlled TEST GAS synchronization

**Do not bulk-replace all 13 backend modules.** The latest GAS backup (3) contains the previously identified Code.gs, setup.gs, and AssignmentManagement.gs corrections. The corresponding GitHub `development` files are the canonical versions of those corrections and are the only application modules cleared for controlled replacement in the TEST GAS project at this checkpoint.

### Files cleared for TEST GAS

1. Replace `Code.gs` with `sport-nutrition-classroom/backend/Code.gs`.
   - Confirms UUID-only OTP digit generation (no Math.random fallback).
   - Includes compensating rollback for a newly created LINEAccounts row when audit append fails.
   - Includes email/UpdatedAt rollback when the email-change audit/write sequence fails.
   - Backup (3) contains these corrections; align GAS to the canonical GitHub file.
2. Replace `setup.gs` with `sport-nutrition-classroom/backend/setup.gs`.
   - Canonical StudentImport header: STUDENT_ID, FIRST_NAME, LAST_NAME, EMAIL.
   - Retains read compatibility for legacy EMAIL, DISPLAY_NAME, STUDENT_ID staging layout.
   - Schema version remains 1.5.0 and declared application tables are unchanged in the reviewed comparison.
   - **Copy only. Do not run** setupAccountLinkingSheets() or importStudentsFromStaging().
3. Replace `AssignmentManagement.gs` with `sport-nutrition-classroom/backend/AssignmentManagement.gs`.
   - Removes duplicate persistent scheduler-fixture implementations found in backup (2).
   - Backup (3) now contains only the disabled no-write fixture stubs.
   - Manual assignment open/close policy remains; do not install or run scheduler triggers.
4. Replace `SNC_IntegrationTestRunner_TEST.gs` with `sport-nutrition-classroom/backend/tests/SNC_IntegrationTestRunner_TEST.gs` (v1.1.0, this checkpoint).
   - Merges strict TEST environment and spreadsheet identity guard with corrected static route/handler inspection.
   - Read-only; does not read/write application rows, Drive, triggers, or LINE.
   - INT-01..INT-07 remain NOT RUN until approved procedures/fixtures are available; INT-08 remains BLOCKED.
5. Add `SNC_SystemPreflight_TEST.gs` from `sport-nutrition-classroom/backend/tests/SNC_SystemPreflight_TEST.gs` (v1.0.0). Do not replace an application module with it.
   - Requires TEST property and exact TEST spreadsheet identity.
   - Runs read-only schema inspection, pure unit tests, and static route inspection.
   - No fixture creation, migration, trigger installation, or LINE calls.

### HOLD — do not replace these 10 modules yet

`AuditManagement.gs`, `CourseManagement.gs`, `EnrollmentManagement.gs`, `FileManagement.gs`, `GradingManagement.gs`, `GroupManagement.gs`, `NotificationManagement.gs`, `StudentPortalManagement.gs`, `SubmissionManagement.gs`, `UserRoleManagement.gs`.

Their GAS backup (3) and GitHub versions still require targeted semantic reconciliation of the changed function blocks and permission/data-side-effect behavior. A file hash mismatch alone is not approval to replace them. Keep the existing GAS TEST versions of these ten modules unchanged for now.

## Static checks completed on GAS backup (3)

- Node.js syntax parse: 13/13 backend modules PASS.
- Node.js syntax parse: Integration Test Runner v1.1.0 draft PASS.
- Node.js syntax parse: System Preflight v1.0.0 PASS.
- Preflight function inventory: all nine referenced pure-unit functions were found in the backup source.
- No GAS runtime execution is claimed by these local syntax checks.
- The owner previously ran the read-only schema inspector successfully against the TEST spreadsheet (schemaVersion 1.5.0; all declared table headers shown as MATCH in the supplied output). This is historical owner-provided evidence, not a new execution in this checkpoint.

## Copy instructions / safety

- Copy the five files above into the TEST GAS project only; preserve all existing production code and deployment settings.
- Before copying, export/download a fresh GAS backup. Do not delete existing files or data.
- Do not run setup/migration/import functions, TestFixtures_TEST, SchemaMigration_TEST, scheduler fixture functions, trigger installers, or LINE push.
- Do not deploy or change web app deployment settings as part of file synchronization.
- After copy, run only `SNC_SystemPreflight_TEST()` first. Capture the complete execution result. Do not run the integration runner until preflight passes.
- If the GAS editor reports duplicate declarations or compile errors, stop and restore the fresh backup; do not proceed to Step 4.
- Synthetic fixture creation remains a separate approval gate under `SYNTHETIC_TEST_FIXTURE_PLAN_v1.0_2026-11-22.md`; no fixtures have been created or deleted.

## Current readiness

**READY FOR OWNER TO COPY THE FIVE CLEARED FILES INTO TEST GAS. NOT READY FOR STEP 4 INTEGRATION EXECUTION YET.**

Step 4 may begin only after owner confirms the five-file synchronization, the TEST project compiles, and the preflight execution passes. Remaining ten backend modules stay on HOLD pending semantic review. No GAS source synchronization, spreadsheet write, Drive operation, migration, fixture creation/cleanup, LINE message, or deployment was performed by this checkpoint.
