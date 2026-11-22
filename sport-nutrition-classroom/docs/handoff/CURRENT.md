# Current Project Checkpoint

- Updated: 22 November 2026 (Asia/Bangkok) — Preflight compact-log update
- Repository: `worrawutt-source/worrawutsportsci`
- Working branch: `development` only
- Initial HEAD before this checkpoint work: `8fb2a4bda6e73cc5a8a72462f54dea1efe77439b`
- Integration runner update commit: `61a8422f60bc132d79667f4725e4a2cfe478592b`
- Preflight compact-log update commit: `251bd1208b09b2f844870386467df5322c822769`
- Current branch HEAD was verified after the documentation update.
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
5. `SNC_SystemPreflight_TEST.gs` was already copied to GAS TEST. **Only replace this file again with the updated GitHub v1.0.1** to reduce execution-log volume.
   - Change is limited to compact summary logging; the schema checks, pure unit tests, static route inspection, and read-only guards are unchanged.
   - Emits one `SNC_PREFLIGHT_SUMMARY=` JSON record containing overall status, counts, each check/unit-test status, route presence, and integration-suite status.
   - The returned report object remains unchanged; detailed per-case unit-test payloads are not printed to Logger.

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

- At this checkpoint, copy only the updated `SNC_SystemPreflight_TEST.gs` v1.0.1 into the TEST GAS project. Do not recopy the other four files; they are unchanged from the latest GAS backup (3) / prior synchronization.
- Before copying, export/download a fresh GAS backup. Do not delete existing files or data.
- Do not run setup/migration/import functions, TestFixtures_TEST, SchemaMigration_TEST, scheduler fixture functions, trigger installers, or LINE push.
- Do not deploy or change web app deployment settings as part of file synchronization.
- After replacing the Preflight file, run only `SNC_SystemPreflight_TEST()` once. Capture the single `SNC_PREFLIGHT_SUMMARY=` line. Do not run the integration runner until all Preflight checks are reviewed.
- If the GAS editor reports duplicate declarations or compile errors, stop and restore the fresh backup; do not proceed to Step 4.
- Synthetic fixture creation remains a separate approval gate under `SYNTHETIC_TEST_FIXTURE_PLAN_v1.0_2026-11-22.md`; no fixtures have been created or deleted.

## Deployment identity clarification — 22 November 2026

The owner clarified that the current GAS Web App is the sole pre-release development/test system; it has not yet been put into operational use. There is no separate Production deployment to protect at this stage. Do not continue requesting a separate TEST-versus-Production deployment split unless the project architecture changes.

- Owner-confirmed active deployment version: **14**.
- Owner-provided Web App URL deployment ID matches the visible prefix of the Active Deployment ID in the supplied Manage deployments screenshot.
- Screenshot settings: Execute as **Me**; access **Anyone**.
- G-03 deployment identity: **PASS for matching the active deployment URL/ID and owner-confirmed version 14**.
- The web tool could not retrieve the Apps Script endpoint (cache miss); this is not evidence that the endpoint is unavailable. The URL match and version are based on owner-provided evidence.
- The prior read-only Preflight already verified the active spreadsheet identity and TEST environment property at execution time. This project uses one pre-release environment, not parallel TEST/Production deployments.
- Keep access configuration and backend authorization under security review; no deployment setting was changed.

## Owner-confirmed Web App endpoint response — 22 November 2026

The owner opened the active Web App URL in a browser and confirmed the endpoint returned this successful JSON response:

- `success: true`
- `data.service: SPORT NUTRITION CLASSROOM API`
- `data.status: READY`
- `data.version: 1.5.0`
- `error: null`

This confirms the active URL responds to the browser request and identifies itself as the SPORT NUTRITION CLASSROOM API version 1.5.0. Combined with the owner-confirmed active Deployment Version 14, this closes the endpoint reachability/identity evidence for G-03. It does **not** establish authenticated action routes, database-backed integration, browser/LIFF workflows, or failure recovery; those remain separate test levels.

## G-04 / G-05 source-level review — 22 November 2026

Read-only review performed against GAS Backup (3) and the matching GitHub `development` source for `FileManagement.gs` and `NotificationManagement.gs`. No GAS function was executed and no external request, Drive read/write, spreadsheet write, or setting change was made.

### G-04 External service / LINE separation

- `NotificationManagement.gs` contains a direct LINE Push API call to `https://api.line.me/v2/bot/message/push` using Script Property `LINE_CHANNEL_ACCESS_TOKEN`.
- Manual `notification.send`, `notification.retry`, assignment-open notifications, submission notifications, and `runDeadlineReminderNotifications()` can call `ntSend_()`.
- `installDeadlineReminderTrigger()` creates an hourly trigger. It must not be run during the fixture batch.
- The owner clarified that a Script Property absent from the displayed complete property list is not configured; `LINE_CHANNEL_ACCESS_TOKEN` is absent.
- In the current configuration, `ntSend_()` returns `LINE_TOKEN_NOT_CONFIGURED` and writes a FAILED notification log without calling LINE Push API, because the missing-token check occurs before `UrlFetchApp.fetch()`.
- Source code has no notification stub or environment guard. If a token is added later, those notification paths can send real LINE messages.
- Status: **G-04 PASS for current no-token outbound suppression, with a configuration-change caveat**. Do not add a token or invoke notification paths during integration tests; keep reminder/trigger installation disabled. Reassess G-04 if Script Properties change.

### G-05 Google Drive isolation

- `FileManagement.gs` reads `SNC_SUBMISSION_FOLDER_ID` from Script Properties before upload.
- Upload code checks `folder.getSharingAccess() === DriveApp.Access.PRIVATE` and rejects a folder whose inherited sharing is not private.
- It creates files inside that configured folder and may grant viewer access to uploader, group members, and assigned instructors. File access is additionally checked against submission authorization.
- Source code therefore contains a private-folder guard, but source inspection does not prove the configured folder ID points to a dedicated test folder, that the folder currently exists, or that it contains no pre-existing files / inherited or direct sharing.
- No owner-provided evidence currently identifies the configured `SNC_SUBMISSION_FOLDER_ID` or verifies its actual folder ACL and contents.
- Status: **G-05 BLOCKED / NOT VERIFIED**. Do not upload, share, move, trash, or delete Drive files until the exact folder identity, privacy, contents baseline, and recovery plan are evidenced.

### Evidence required to close these gates

- G-04: owner verifies whether `LINE_CHANNEL_ACCESS_TOKEN` is configured without revealing its value; provide non-secret evidence of the intended LINE channel/LIFF environment identity and confirm notification stub/disable strategy. Do not paste secrets or tokens into chat, GitHub, or logs.
- G-05: owner shows the Script Properties key `SNC_SUBMISSION_FOLDER_ID` with its value masked except a short suffix, then opens that exact Drive folder and provides evidence of folder identity, sharing set to Restricted / Private, and current contents. Do not change sharing or folder contents during inspection.

**Decision:** G-04 and G-05 remain BLOCKED. G-03 is closed based on owner-confirmed active deployment Version 14, matching URL/ID, and successful API health response. Fixture creation and integration execution remain on HOLD.

## G-05 folder identity supplied — 22 November 2026

The owner supplied the Google Drive Folder ID for `SPORT_NUTRITION_SUBMISSIONS` under `ProjectLine`: `1LmHuJKetRb6K8zyifpjvcKIYiMzUU7tj`.

- Folder name/location: owner screenshot evidence.
- Folder ID: owner-supplied; recorded above.
- Sharing state (General access): **OWNER CONFIRMED — Restricted**.
- Script Property `SNC_SUBMISSION_FOLDER_ID`: **OWNER CONFIRMED — configured with the supplied Folder ID**.
- G-05: **PASS — folder identity, Restricted sharing, and configuration confirmed by owner**. Folder appears empty in the supplied screenshot.

No upload, sharing change, or file mutation was performed as part of this review. Before file integration tests, retain the folder contents baseline and test only with synthetic files created by the approved fixture run.


The owner supplied a screenshot showing a newly created, currently empty Google Drive folder named `SPORT_NUTRITION_SUBMISSIONS` under `ProjectLine`. This establishes that the folder has been created and appears empty in the screenshot. The screenshot does not show its URL/Folder ID or sharing configuration.

- Folder existence/name: **OWNER EVIDENCE — PASS**
- Empty contents at screenshot time: **OWNER EVIDENCE — PASS**
- Folder ID matched to intended resource: **NOT VERIFIED**
- Sharing set to Restricted / Private: **NOT VERIFIED**
- `SNC_SUBMISSION_FOLDER_ID` Script Property configured: **NOT DONE**
- G-05 overall: **BLOCKED pending Folder ID and sharing verification**.

Next read-only check: open the folder's Share dialog and confirm General access is Restricted; copy the folder ID from the Drive URL (the text after `/folders/`). Do not change sharing or add the Script Property until the ID and sharing state are confirmed. No Drive or Script Properties change was performed by this review.

## G-05 owner confirmation — submission folder property absent — 22 November 2026

The owner inspected Apps Script Project Settings → Script Properties and confirmed that `SNC_SUBMISSION_FOLDER_ID` is **not present**.

Impact based on `FileManagement.gs`:
- `file.upload` reads this exact Script Property and returns `CONFIGURATION_ERROR` when it is missing.
- Therefore, submission file upload cannot be considered configured or integration-test ready in the current project.
- The code's private-folder ACL check is only reached after the property is present; it does not establish a configured private folder.
- G-05 status: **BLOCKED — required configuration absent**.

Do not add the property or create/select a Drive folder yet. First decide the intended submission folder and approve its exact Drive location, access policy, and recovery/baseline procedure. After approval, configure the property and verify the exact folder's Restricted/Private sharing and contents before any upload test. No property or Drive resource was changed.

## G-06 owner-run baseline execution — partial log evidence — 22 November 2026

The owner ran `sncCaptureDataBaseline_TEST()` in GAS. Execution log reports **Execution completed** and the visible baseline JSON reports:

- mode `READ_ONLY`;
- spreadsheet `SportNutritionApp`, ID suffix `dYeWFk`, schema version `1.5.0`;
- `tableCount=22` (corrects the earlier estimate of 21 tables; use actual `SNC_SETUP.TABLES` output);
- `errorCount=0` and `errors=[]`;
- every table entry visible before the log truncation has zero blank and duplicate primary keys;
- log output was truncated before the complete table list and final `success` field were visible. The visible excerpt includes table data through the beginning of `Submissions`, but does not establish the status of all 22 tables.

Assessment: **G-06 PARTIAL / REVIEW REQUIRED**, not yet PASS. No write or external operation is indicated by the collector's read-only mode. Do not run fixtures yet.

Next action: reduce baseline logging to a compact summary that contains all 22 table names, row counts, blank/duplicate key counts, per-table primary-key SHA-256 digests, `errorCount`, and `success` without printing the raw primary-key arrays. Retain the complete primary-key manifest privately for owner recovery; do not put raw IDs into GitHub. Re-run only the read-only baseline after installing the compact logger/helper, then verify all 22 entries and the final success flag.

## G-06 read-only baseline collector prepared — 22 November 2026

Added `sport-nutrition-classroom/backend/tests/SNC_DataBaseline_TEST.gs` v1.0.1 on `development` (latest commit `2c07885ba07bb156f1ac4806d512a8eddd196609`; initial helper commit `dd75f7fe888d6afbb5c59de03087aa3aa937a2cb`). The helper:

- Requires `SNC_ITR_ENVIRONMENT=TEST` and exact match between active spreadsheet ID and `SNC_ITR_TEST_SPREADSHEET_ID`.
- Reads only the 21 tables declared in `SNC_SETUP.TABLES`.
- Captures row counts, first-column primary key names, blank/duplicate key counts, SHA-256 digest, and sorted primary-key values.
- Does not read personal fields (names, emails, StudentID), and performs no Sheets/Drive/Properties/trigger/external writes.
- Emits one compact `SNC_DATA_BASELINE_SUMMARY=` record with all 22 table summaries and digests, without raw primary-key arrays. The returned report still contains the full primary-key manifest for private owner-side retention.

Status: helper v1.0.1 prepared and committed; v1.0.0 was executed once and its log was truncated. **v1.0.1 NOT YET COPIED TO GAS OR EXECUTED**. G-06 remains NOT RUN until the owner copies this single new helper file into the current Apps Script project, runs `sncCaptureDataBaseline_TEST()` once, and securely retains the output outside the live spreadsheet. If the function stops on environment/spreadsheet identity mismatch, do not bypass the guard; report the error for review. Do not run setup, migration, fixture, integration, or notification functions.

## Latest owner-run Preflight evidence — 22 November 2026

The owner copied `SNC_SystemPreflight_TEST.gs` v1.0.1 into GAS TEST and ran `SNC_SystemPreflight_TEST()`. The compact summary record was captured in the supplied execution log.

- Overall status: **BLOCKED**; PASS 11, FAIL 0, BLOCKED 1, NOT RUN 8.
- ENV-01: PASS — TEST environment and active spreadsheet identity verified.
- DB-01: PASS — read-only schema inspection passed for declared `SNC_SETUP.TABLES`.
- Pure unit tests: **84/84 PASS across 9 suites**, 0 failures.
- Static API route/handler presence: INT-02 through INT-07 and INT-07A present; this is not evidence of runtime integration.
- Integration suites INT-01 through INT-07A: NOT RUN. INT-08: BLOCKED pending verified deployed TEST endpoint, browser/LIFF execution and recovery evidence.
- `writesExpected=0`; `externalCallsExpected=0`. No fixture creation, data mutation, Drive operation, LINE push or deployment was performed.

The compact summary is complete. Earlier verbose Logger output from called schema/unit-test functions remains truncated in the execution log, but this does not invalidate the complete summary record.

## Current readiness

**Preflight execution: BLOCKED. Step 4 database-backed integration execution and fixture creation remain on HOLD.** The 84 pure unit tests and schema/environment checks passed, but they do not establish deployed API or cross-module integration behavior.

Next work is limited to closing the outstanding entry evidence: (1) verify the exact TEST Web App deployment identity/version and endpoint without redeploying; (2) confirm source synchronization and compile status in the TEST GAS project; (3) complete G-04/G-05/G-06/G-08 isolation, baseline and recovery evidence; and (4) obtain explicit owner approval of the exact fixture manifest and write/cleanup scope (G-07). Do not create fixtures or run the Integration Test Runner until all applicable gates are evidenced and approval is recorded. The ten backend modules listed under HOLD remain unchanged pending targeted semantic reconciliation.

No source synchronization, spreadsheet write, Drive operation, migration, fixture creation/cleanup, LINE message or deployment was performed by this checkpoint.

The owner supplied a screenshot showing a newly created, currently empty Google Drive folder named `SPORT_NUTRITION_SUBMISSIONS` under `ProjectLine`. This establishes that the folder has been created and appears empty in the screenshot. The screenshot does not show its URL/Folder ID or sharing configuration.

- Folder existence/name: **OWNER EVIDENCE — PASS**
- Empty contents at screenshot time: **OWNER EVIDENCE — PASS**
- Folder ID matched to intended resource: **NOT VERIFIED**
- Sharing set to Restricted / Private: **NOT VERIFIED**
- `SNC_SUBMISSION_FOLDER_ID` Script Property configured: **NOT DONE**
- G-05 overall: **BLOCKED pending Folder ID and sharing verification**.

Next read-only check: open the folder's Share dialog and confirm General access is Restricted; copy the folder ID from the Drive URL (the text after `/folders/`). Do not change sharing or add the Script Property until the ID and sharing state are confirmed. No Drive or Script Properties change was performed by this review.

## G-05 owner confirmation — submission folder property absent — 22 November 2026

The owner inspected Apps Script Project Settings → Script Properties and confirmed that `SNC_SUBMISSION_FOLDER_ID` is **not present**.

Impact based on `FileManagement.gs`:
- `file.upload` reads this exact Script Property and returns `CONFIGURATION_ERROR` when it is missing.
- Therefore, submission file upload cannot be considered configured or integration-test ready in the current project.
- The code's private-folder ACL check is only reached after the property is present; it does not establish a configured private folder.
- G-05 status: **BLOCKED — required configuration absent**.

Do not add the property or create/select a Drive folder yet. First decide the intended submission folder and approve its exact Drive location, access policy, and recovery/baseline procedure. After approval, configure the property and verify the exact folder's Restricted/Private sharing and contents before any upload test. No property or Drive resource was changed.

## Latest owner-run Preflight evidence — 22 November 2026

The owner copied `SNC_SystemPreflight_TEST.gs` v1.0.1 into GAS TEST and ran `SNC_SystemPreflight_TEST()`. The compact summary record was captured in the supplied execution log.

- Overall status: **BLOCKED**; PASS 11, FAIL 0, BLOCKED 1, NOT RUN 8.
- ENV-01: PASS — TEST environment and active spreadsheet identity verified.
- DB-01: PASS — read-only schema inspection passed for declared `SNC_SETUP.TABLES`.
- Pure unit tests: **84/84 PASS across 9 suites**, 0 failures.
- Static API route/handler presence: INT-02 through INT-07 and INT-07A present; this is not evidence of runtime integration.
- Integration suites INT-01 through INT-07A: NOT RUN. INT-08: BLOCKED pending verified deployed TEST endpoint, browser/LIFF execution and recovery evidence.
- `writesExpected=0`; `externalCallsExpected=0`. No fixture creation, data mutation, Drive operation, LINE push or deployment was performed.

The compact summary is complete. Earlier verbose Logger output from called schema/unit-test functions remains truncated in the execution log, but this does not invalidate the complete summary record.

## Current readiness

**Preflight execution: BLOCKED. Step 4 database-backed integration execution and fixture creation remain on HOLD.** The 84 pure unit tests and schema/environment checks passed, but they do not establish deployed API or cross-module integration behavior.

Next work is limited to closing the outstanding entry evidence: (1) verify the exact TEST Web App deployment identity/version and endpoint without redeploying; (2) confirm source synchronization and compile status in the TEST GAS project; (3) complete G-04/G-05/G-06/G-08 isolation, baseline and recovery evidence; and (4) obtain explicit owner approval of the exact fixture manifest and write/cleanup scope (G-07). Do not create fixtures or run the Integration Test Runner until all applicable gates are evidenced and approval is recorded. The ten backend modules listed under HOLD remain unchanged pending targeted semantic reconciliation.

No source synchronization, spreadsheet write, Drive operation, migration, fixture creation/cleanup, LINE message or deployment was performed by this checkpoint.


## G-06 read-only baseline — completed and verified — 22 November 2026

The owner copied `SNC_DataBaseline_TEST.gs` v1.0.1 into the existing GAS project and ran `sncCaptureDataBaseline_TEST()` once. The complete compact log `SNC_DATA_BASELINE_SUMMARY=` was supplied and reviewed.

- Status: **G-06 PASS**.
- `success=true`; `mode=READ_ONLY`; `tableCount=22`; `errorCount=0`; `errors=[]`.
- All 22 table records are present. Every table has `blankPrimaryKeyRows=0` and `duplicatePrimaryKeyCount=0`.
- For every table, `nonBlankPrimaryKeys` equals `dataRows`. SHA-256 digests are present for all 22 primary-key sets, including the standard empty-set digest for tables with zero rows.
- Spreadsheet identity in the report: `SportNutritionApp`, ID suffix `dYeWFk`, schema version `1.5.0`.
- The baseline collector reports read-only operation; no fixture, migration, application-data write, Drive operation, trigger, LINE call, or deployment was performed.

The per-table primary-key digests and row counts now provide a comparison baseline for post-test verification. Do not publish raw primary-key values or the full manifest to GitHub/chat. Preserve any returned full manifest privately if it was captured by the owner.

### Updated gate status

- G-03: **PASS** — active pre-release Web App identity/endpoint evidence recorded above.
- G-04: **PASS with configuration caveat** — current missing LINE token suppresses outbound push; reassess if the property is added.
- G-05: **PASS by owner confirmation** — dedicated Restricted submission folder and `SNC_SUBMISSION_FOLDER_ID` configuration confirmed above.
- G-06: **PASS** — complete 22-table read-only baseline verified in this update.
- G-07: **NOT APPROVED / OPEN** — explicit owner approval of the exact synthetic fixture manifest and write/cleanup scope is still required.
- G-08: **REVIEW REQUIRED** — recovery readiness evidence is still outstanding.

**Decision:** G-06 is closed. This does not authorize fixture creation or integration execution. Keep Step 4 fixture activity and the Integration Test Runner on HOLD until G-07 and G-08 are closed and all other applicable entry gates are confirmed. No fixture or cleanup operation has been performed.


## G-08 recovery readiness assessment — 22 November 2026

A read-only review was performed after the owner asked to proceed with the next gate checks. The available evidence establishes a read-only baseline of 22 application tables, including row counts and per-table primary-key SHA-256 digests. The project also has a source-code archive (`SNC_GAS_BACKUP_2026-11-22(3).zip`). These are useful safeguards but are **not** evidence that the TEST spreadsheet and test Drive files can be restored to their pre-test state.

The current evidence does not include:
- A verified, restorable copy/export of the TEST spreadsheet captured immediately before fixture writes.
- A demonstrated restore path and an identified operator who can restore that spreadsheet without affecting another resource.
- A backup/restore or exact recovery procedure for files created in the private submission folder.
- Evidence that recovery has been tested or that the owner can restore the TEST state if exact-ID cleanup partially fails.

The SHA-256 baseline can detect primary-key-set changes; it cannot recreate deleted/modified row contents, formulas, formatting, or Drive file bytes. The GAS source archive restores source code only, not spreadsheet or Drive state.

**G-08 status: BLOCKED / RECOVERY NOT VERIFIED.** No restore, copy, export, spreadsheet write, Drive operation, or fixture action was attempted.

### Required evidence to close G-08

1. Create a point-in-time backup of the exact TEST spreadsheet before any fixture write, using a clearly identified destination that is separate from the live TEST spreadsheet. Record source and backup spreadsheet IDs, names, capture time, owner, and access restrictions. Do not share publicly.
2. Confirm the owner/operator can restore from that backup. Prefer a restore rehearsal against a separate disposable copy, not the live TEST spreadsheet. Verify sheet names, headers, row counts, formulas, and key records on the rehearsal copy.
3. For Drive tests, confirm a recovery method for exact test-created files (for example, retaining source bytes in a controlled private location before upload, or another verified recovery approach). Do not rely on Trash as the only recovery mechanism.
4. Record who has authority to initiate recovery and the stop/escalation rule if cleanup or restore is incomplete.
5. Keep the baseline summary and private primary-key manifest outside GitHub; never publish raw identifiers or student/personal data.

Only after this evidence is reviewed should G-08 be marked PASS. The recovery rehearsal must not overwrite or alter the live TEST spreadsheet or the configured submission folder.

## G-07 owner authorization clarification — 22 November 2026

The owner instructed the project to proceed with checking G-08 and confirming G-07. This authorizes the gate-review work; it does not unambiguously approve the exact fixture manifest, data-write scope, or cleanup/deletion policy required by G-07.

**G-07 remains REVIEW REQUIRED / NOT APPROVED.** No fixture records, files, or test logs may be created or deleted until the owner explicitly approves the exact manifest in `SYNTHETIC_TEST_FIXTURE_PLAN_v1.0_2026-11-22.md`, including the proposed synthetic actors and academic entities, all fixture writes, exact-ID cleanup order, audit-log retention, and the stated exclusions. Any changes to that plan require renewed approval.

### Current gate decision

- G-03: PASS
- G-04: PASS with no-token configuration caveat
- G-05: PASS by owner confirmation
- G-06: PASS — complete 22-table read-only baseline
- G-07: REVIEW REQUIRED / NOT APPROVED
- G-08: BLOCKED / RECOVERY NOT VERIFIED

**Decision: HOLD.** Do not create fixtures, run the Integration Test Runner, upload test files, or execute cleanup until G-07 is explicitly approved and G-08 recovery evidence is verified. The next permitted action is to prepare and verify the isolated recovery copy/rehearsal, then obtain explicit fixture authorization.


## G-08 owner-confirmed TEST Spreadsheet backup — 22 November 2026

The owner confirmed that a separate copy of the latest TEST spreadsheet has been created and checked against the source: every sheet and its contents/structure are present as in the original.

- Backup name: `Copy of SportNutritionApp`
- Backup Spreadsheet ID: `18nqRH9ppjaFsO8cqys_F5NFAnI64arDjU4KTOPVYaqE`
- Source: TEST spreadsheet `SportNutritionApp` (ID suffix `dYeWFk`, as recorded in G-06).
- Backup creation: **OWNER CONFIRMED**.
- All sheets and contents/structure matching the original: **OWNER CONFIRMED**.
- The backup is a separate spreadsheet; no change to the source TEST spreadsheet was requested or performed by this review.
- No restore rehearsal or overwrite of the live TEST spreadsheet was performed.

**G-08 assessment: PASS for the agreed minimum backup safeguard (separate copy created and owner-confirmed complete).** Restore rehearsal is NOT RUN and is not represented as tested. The backup ID is recorded for recovery reference. Before any recovery action, verify the destination and obtain explicit owner authorization; do not overwrite the live TEST spreadsheet automatically.

### Updated gate status

- G-03: PASS
- G-04: PASS with no-token configuration caveat
- G-05: PASS by owner confirmation
- G-06: PASS — complete 22-table read-only baseline
- G-07: REVIEW REQUIRED / NOT APPROVED — exact synthetic fixture write/cleanup plan still requires explicit approval.
- G-08: PASS — separate TEST Spreadsheet backup and completeness confirmed by owner; restore rehearsal NOT RUN.

**Decision: HOLD remains in effect.** G-08 is closed for the minimum backup requirement, but no fixture creation, Integration Test Runner execution, Drive upload, or cleanup is authorized until G-07 receives explicit approval. No application data, Drive files, triggers, or LINE messages were changed as part of this gate update.


## G-07 owner approval — Synthetic Test Fixture Plan v1.0 — 22 November 2026

The owner explicitly approved **Synthetic Test Fixture Plan v1.0** (document SNC-TEST-FIXTURE-PLAN-001) in full, including the complete synthetic actor and academic-data manifest, all fixture writes described in the plan, the exact-ID cleanup sequence, retention of AuditLogs by default, preservation of the 18 existing Users and all baseline records, private TEST Drive file isolation, and the exclusions (no real LINE binding or push, no Production resources, no setup/migration/trigger installation, and no broad deletion).

- G-07: **PASS — explicit owner approval recorded**.
- Approval does not waive any other entry gate and does not authorize fixture creation while G-01, G-02, or any other applicable gate remains BLOCKED or NOT RUN.
- Fixture creation, Integration Test Runner execution, Drive upload, and cleanup remain **NOT RUN** pending completion and verification of all remaining gates.
