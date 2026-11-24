# WP-SUB-2 — Documentation and Test Evidence

This directory is the documentation and evidence area for WP-SUB-2 (Submission File / Google Drive integration) in the TEST environment.

## Contents and placement

- The approved-for-review test plan remains at:
  `docs/WP-SUB-2_TEST_PLAN_v1.0.0_2026-11-24.md`
- Store WP-SUB-2 test specifications, owner decisions, sanitized execution logs, reconciliation reports, and closure records in this directory.
- Keep source-controlled test utilities in `backend/tests/WP-SUB-2/`.
- Keep actual binary test fixtures and files created by upload tests in the dedicated TEST Google Drive folder. Do not commit binary test files, Drive credentials, access tokens, personal data, or real student data to GitHub.

## Google Drive fixture layout

The owner has created the TEST Drive folder structure:

- `SNC_TEST_SUBMISSION_FILES/01_VALID_FILES`
- `SNC_TEST_SUBMISSION_FILES/02_INVALID_FILES`
- `SNC_TEST_SUBMISSION_FILES/03_UPLOADED_TEST_FILES`
- `SNC_TEST_SUBMISSION_FILES/04_ROLLBACK_TEST`

The folder structure is recorded as owner-provided setup evidence only. Its folder ID, ownership, effective permissions, Script Property mapping, and runtime access have not yet been independently verified.

## Safety and approval boundary

- WP-SUB-2 Test Plan status: owner-approved as a plan; implementation and mutation scope remain separately gated.
- This directory creation does not authorize Runner execution, GAS execution, Drive uploads, permission changes, file deletion/cleanup, migrations, triggers, deployment, LINE/UrlFetch, or external calls.
- Use synthetic fixtures and synthetic actors only.
- Preserve all existing WP-SUB-1 records and evidence.
- Record runtime outcomes only from owner-supplied GAS logs. Static inspection is not runtime PASS evidence.

## Status

**Documentation structure created. No WP-SUB-2 implementation or Drive operation has been performed.**
