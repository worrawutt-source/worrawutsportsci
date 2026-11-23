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


## Post-approval entry-gate review — 22 November 2026

Following the owner's explicit approval of Synthetic Test Fixture Plan v1.0, the remaining entry gates were reviewed against the latest checkpoint, owner-provided evidence, the current development source references, and the supplied GAS Backup (3).

### Static source check

- Archive reviewed: `SNC_GAS_BACKUP_2026-11-22(3).zip`.
- Node.js syntax parsing: **18/18 files PASS** (13 application modules plus the included test/support scripts and setup files).
- This is local static syntax evidence only. It is not a Google Apps Script project compile, does not detect all Apps Script runtime/declaration conflicts, and does not prove the TEST GAS editor contains these exact file versions.
- The current GitHub development source files were located for Code.gs, setup.gs, AssignmentManagement.gs, Integration Test Runner v1.1.0, and System Preflight v1.0.1. The Data Baseline helper v1.0.1 is also present in the repository.

### Gate results

- G-01 Source synchronization: **BLOCKED / NOT VERIFIED**. The checkpoint defines the exact approved files and copy sequence, but there is no new owner evidence confirming the current TEST GAS project contains those exact versions after the latest required synchronization. A source archive and GitHub files alone do not prove the GAS editor state.
- G-02 GAS compile: **BLOCKED / NOT RUN**. Local Node.js parsing passed 18/18, but no evidence confirms that all files save in the current Apps Script project without duplicate global declarations or GAS compile errors.
- G-03 Environment identity: **PASS** based on the owner-confirmed active pre-release deployment Version 14, matching deployment URL/ID, and successful API health response recorded above.
- G-04 External/LINE separation: **PASS WITH CAVEAT** for current outbound suppression because `LINE_CHANNEL_ACCESS_TOKEN` is absent and `ntSend_()` exits before the LINE fetch. This does not prove a separate TEST LINE channel/LIFF or Worker/upstream identity. Do not add a token or execute notification paths; reassess before any test that depends on LINE/LIFF identity.
- G-05 Drive isolation: **PASS BY OWNER CONFIRMATION** for the dedicated `SPORT_NUTRITION_SUBMISSIONS` folder, Restricted sharing, and configured `SNC_SUBMISSION_FOLDER_ID`. Preserve the current folder contents baseline.
- G-06 Data baseline: **PASS** — complete read-only 22-table baseline, success=true, errorCount=0, and no blank/duplicate primary keys.
- G-07 Fixture authorization: **PASS** — explicit owner approval of the complete v1.0 manifest and exact-ID cleanup scope recorded in this checkpoint.
- G-08 Recovery: **BLOCKED / PARTIAL**. A separate copy of the TEST spreadsheet is owner-confirmed complete, but restore rehearsal is NOT RUN. A verified recovery procedure for the TEST Drive files and an evidenced recovery operator/authority are also not recorded. The backup copy is a safeguard, not proof of recoverability.

### Decision

**HOLD — do not create synthetic fixtures and do not run the Integration Test Runner.** G-01 and G-02 remain unverified, and G-08 does not yet meet the plan's recovery entry criterion. G-04's current no-token protection must remain unchanged. No application data, Drive files, triggers, LINE messages, or deployment settings were changed during this gate review.

### Evidence needed to proceed

1. Confirm the latest approved source files have been copied into the current TEST GAS project exactly as specified in the synchronization instructions; provide a fresh GAS export or editor evidence sufficient to verify the versions.
2. Save/compile the complete GAS project and provide the execution/editor evidence showing no duplicate global declarations or compile errors.
3. Perform a restore rehearsal against a separate disposable spreadsheet copy (not the live TEST spreadsheet), and verify the agreed recovery procedure for files created in the private TEST Drive folder. Record the authorized recovery operator and stop/escalation rule.
4. Keep LINE token absent and do not run notification/trigger functions during this fixture batch.


## G-01 / G-02 execution attempt — GAS TEST access limitation — 22 November 2026

The latest supplied source archive `SNC_GAS_BACKUP_2026-11-22(3).zip` was extracted and all source-bearing files were checked locally with Node.js v22.16.0 using `node --check`.

- JavaScript/GAS source files checked: **18/18 PASS**.
- The archive also contains `json.txt`, which is configuration/data rather than a JavaScript source file and was not included in the syntax count.
- No source file was modified by this check.
- This confirms syntax parseability under Node.js only. It does not confirm Apps Script-specific compilation, global symbol uniqueness in the live project, or that the live GAS TEST editor contains the same file contents.

The available connected tools in this work session do not provide access to the live Google Apps Script editor/project or its file APIs. Therefore the assistant cannot directly copy files into GAS TEST, save the project, or execute a GAS compile from this session. No claim is made that those operations were performed.

### Gate status after this attempt

- G-01 Source synchronization: **BLOCKED / NOT VERIFIED** — live GAS TEST file contents cannot be read from the available tools in this session. The approved copy list and order remain as documented in the earlier synchronization instructions. In particular, the latest checkpoint directs replacing only `SNC_SystemPreflight_TEST.gs` v1.0.1 at this stage; do not bulk-replace the other ten held modules or run setup/migration/trigger functions.
- G-02 GAS compile: **BLOCKED / NOT RUN** — 18/18 local Node.js syntax checks passed, but no live Apps Script save/compile evidence is available.

### Required owner-side evidence to close G-01 and G-02

1. In the existing GAS TEST project, verify the five controlled application/test files against the approved GitHub `development` versions and the current synchronization instructions: `Code.gs`, `setup.gs`, `AssignmentManagement.gs`, `SNC_IntegrationTestRunner_TEST.gs`, and `SNC_SystemPreflight_TEST.gs`. The Data Baseline helper v1.0.1 was separately required for the completed G-06 run; retain it. Do not replace the ten held backend modules.
2. If the current GAS project does not contain the latest `SNC_SystemPreflight_TEST.gs` v1.0.1, replace that file only with the GitHub `development` version. Do not run setup, migration, fixtures, scheduler, trigger installation, notifications, or the Integration Test Runner.
3. Save the GAS project and provide a fresh export of the project files (or equivalent file-content evidence) so the synchronized source can be compared to the approved versions. Redact all credentials/secrets; do not include real student data.
4. Provide GAS editor/save evidence showing the project has no duplicate global declarations and no compile/syntax errors. Do not execute application functions as a substitute for compile verification. If Apps Script reports an error, stop and report the exact sanitized message before making further changes.

**Decision: HOLD.** G-01 and G-02 remain BLOCKED. No GAS file was copied or changed, no Apps Script function was executed, and no spreadsheet, Drive, trigger, LINE, or deployment operation was performed in this work session.


## G-01 owner confirmation — five GAS TEST files match approved source — 22 November 2026

The owner inspected the current GAS TEST project and confirmed that all five controlled files match the approved GitHub `development` source versions:

1. `Code.gs`
2. `setup.gs`
3. `AssignmentManagement.gs`
4. `SNC_IntegrationTestRunner_TEST.gs`
5. `SNC_SystemPreflight_TEST.gs`

- G-01 Source synchronization: **PASS — owner-confirmed exact match for all five controlled files**.
- This is owner-provided verification; no direct live GAS project read or independent byte-for-byte comparison was available to the assistant in this session.
- The ten held backend modules remain unchanged. No setup, migration, fixture, trigger, notification, or Integration Test Runner function was run as part of this confirmation.
- G-02 GAS project compile: **BLOCKED / EVIDENCE PENDING**. File-content matching and Node.js syntax parsing do not establish that the complete Apps Script project saves without duplicate global declarations or GAS-specific compile errors.

### Remaining evidence for G-02

Please provide the GAS editor save/compile result or a fresh execution log from a safe read-only project preflight that confirms the current project loads without duplicate declarations or syntax/compile errors. Do not run setup, migration, fixtures, scheduler, trigger installation, notification, or Integration Test Runner functions. Keep the project and application data unchanged.

**Decision: G-01 is closed; G-02 remains BLOCKED pending Apps Script project-level evidence. G-08 recovery evidence also remains outstanding. Fixture creation remains on HOLD.**


## Global declaration audit — GitHub development — 22 November 2026

The owner supplied GAS Editor screenshots showing `SNC_SETUP` references in `SNC_DataBaseline_TEST.gs`, `SNC_SystemPreflight_TEST.gs`, and `SchemaMigration_TEST.gs`, plus the actual declaration in `setup.gs`. The find box count in an individual file indicates search matches, not duplicate global declarations.

A repository-wide read-only audit was performed against all 16 `.gs` files under `sport-nutrition-classroom/backend/` on branch `development`.

- Files inspected: **16** (12 application modules including `setup.gs`, plus 3 TEST helpers/runners and the additional backend module as listed in the repository tree).
- Top-level declaration scan: **175** declarations found.
- Duplicate names detected by the top-level declaration scan: **0**.
- `SNC_SETUP`: exactly **one** top-level declaration, `const SNC_SETUP = Object.freeze({...})` in `sport-nutrition-classroom/backend/setup.gs`, line 15.
- References to `SNC_SETUP` in other files are expected consumers of the shared configuration object; they are not duplicate declarations.
- No source code was changed or removed as part of this audit.

### GAS-only files visible in the supplied screenshots

The screenshots also show `SchemaMigration_TEST.gs` and `TestFixtures_TEST.gs` in the live GAS Editor. Neither filename exists in the current GitHub `development` backend tree, and repository code search returned no matching file. Their complete source was not supplied in the screenshots, so their global declarations, dependencies, execution references, and whether they are obsolete cannot be established.

**Do not delete these files based on the current evidence.** They are not GitHub files to remove, and their removal from GAS would require a separate source/dependency review. In particular, do not run the migration or fixture functions. If the owner wants them assessed for removal, obtain a fresh GAS export containing these exact files and inspect their complete contents and references first.

### G-02 impact

- GitHub backend top-level declaration audit: **PASS — no duplicate top-level names detected in the 16 repository `.gs` files**.
- `SNC_SETUP` declaration: **PASS — single declaration in setup.gs**.
- Complete live GAS project duplicate/global and compile status: **REVIEW REQUIRED / NOT CLOSED** until the two GAS-only files (`SchemaMigration_TEST.gs`, `TestFixtures_TEST.gs`) and any other editor-only files are inspected, and the Apps Script project save/compile evidence is available.
- No GAS-only file was removed or modified; no setup, migration, fixture, trigger, notification, or integration function was executed.


## Audit correction — include GAS archive-only files — 22 November 2026

The prior audit statement that `SchemaMigration_TEST.gs` and `TestFixtures_TEST.gs` were not available for inspection was incorrect. Both files were present in the owner-provided archive `/mnt/data/SNC_GAS_BACKUP_2026-11-22(3).zip` as `SchemaMigration_TEST.txt` (164 lines) and `TestFixtures_TEST.txt` (390 lines). The archive was reopened and both complete sources were reviewed. This correction supersedes the earlier statement that their source was unavailable.

### `SchemaMigration_TEST.txt`
- Contains one top-level function: `migrateMissingSNCTables_TEST_20261122()`.
- References the single shared `SNC_SETUP` declaration in `setup.gs`; it does not redeclare `SNC_SETUP`.
- It is an additive TEST schema migration: preflights all declared table headers, requires an exact nine-sheet missing-table list (`Groups`, `GroupMembers`, `Submissions`, `SubmissionFiles`, `Grades`, `GradeHistory`, `GradeReviewRequests`, `NotificationLogs`, `IdempotencyKeys`), creates those sheets and verifies the declared schemas.
- It is not a normal runtime module and should not be run as part of routine testing. The archive proves the function exists, not whether it has already been executed. Do not run it again without checking the current TEST spreadsheet schema and migration evidence.
- Recommendation: retain as a migration record/source artifact, but keep it out of the normal runtime source set or clearly isolate it as a one-time TEST migration utility. Do not delete the historical source without preserving it in the archive/change history.

### `TestFixtures_TEST.txt`
- Contains fixture inspection, creation, inspection-after-creation, exact-ID cleanup, and private helper functions.
- It writes to `Enrollments` and `Assignments`, and stores a fixture manifest in Script Properties. Cleanup deletes exact manifest IDs only.
- Critical discrepancy: this is an older fixture design using hard-coded existing `UserID` values (`STU_00000000000` through `...002`) and a hard-coded existing `OfferingID`, requiring those accounts and offering to already exist and be active. It does not implement the currently approved synthetic-actor fixture plan (`SNC_TST_20261122_...`) and therefore must not be used for the current integration test batch.
- The source also allows reuse of pre-existing active enrollments, and creates two assignments (one GROUP, one INDIVIDUAL); this is materially different from the approved fixture plan's actor/entity matrix and exact scope.
- Recommendation: classify as **LEGACY / DO NOT RUN** for the current test cycle. Preserve it as historical source until dependency and execution-history review is complete; do not copy it into the active GAS runtime or run create/cleanup functions.

### Duplicate and usage findings
- Neither file declares `SNC_SETUP`; both use the shared declaration from `setup.gs` as intended.
- The top-level functions declared by these two files do not collide by name with the top-level function declarations found in the 16 current GitHub backend `.gs` files.
- The earlier finding remains valid only for the 16 tracked GitHub `.gs` files: no duplicate top-level declaration names were detected there. The two archive-only files were absent from the tracked GitHub tree, not absent from the owner-provided source archive.
- Whether the two files are currently present in the live GAS editor and whether their functions are referenced by triggers or other dynamic calls cannot be established from the archive alone. The migration function is an explicit one-time utility; the fixture file exposes callable test functions. No evidence supports deleting either file as unused.

### Corrected status
- GitHub tracked backend declaration audit: **PASS — no duplicate top-level declarations detected in the 16 tracked `.gs` files**.
- Archive-only migration and fixture source review: **PASS — reviewed; no `SNC_SETUP` redeclaration or top-level function-name collision with tracked backend source detected**.
- `SchemaMigration_TEST`: **LEGACY MIGRATION UTILITY — retain as historical source; do not rerun without schema-state verification**.
- `TestFixtures_TEST`: **LEGACY / DO NOT RUN for current fixture plan; uses existing hard-coded accounts/offering and conflicts with the approved synthetic fixture approach**.
- GAS live-project compile and complete usage status: **REVIEW REQUIRED**; archive inspection is not proof of current editor contents, successful compilation, or execution history.
- No GAS source, spreadsheet rows, Script Properties, triggers, Drive files, or LINE messages were modified by this audit.


## Full archive cross-file declaration and legacy utility review — 22 November 2026

The complete owner-provided archive `SNC_GAS_BACKUP_2026-11-22(3).zip` was reopened. The audit normalized the archive's duplicate representations (the Integration Test Runner appears as both `.gs` and `.txt`) so each logical source file was counted once.

- Canonical source files reviewed: **18**.
- Top-level declarations scanned: **190**.
- Duplicate top-level declaration names across the 18 canonical source files: **0**.
- `SNC_SETUP` is declared once in `setup.txt` (the GAS `setup.gs` source) and is referenced by the migration and preflight/baseline code as a shared configuration object. These references are not redeclarations.
- The two legacy utilities declare no top-level names that collide with the other canonical source files.
- No top-level function declared in either legacy utility is referenced by another canonical source file. This establishes no static cross-file call dependency; it does not prove the user has never run the functions manually or that they are not selected manually from the Apps Script function menu.

### Disposition recommendation for the two GAS-only files

1. `SchemaMigration_TEST.gs` — one-off migration utility. Its only top-level function is `migrateMissingSNCTables_TEST_20261122()`. The function is not called by the application modules or current test runners. The latest G-06 baseline reports all 22 tables present, so there is no current evidence of a missing-table task. Recommendation: **remove this file from the active GAS TEST project after preserving its exact source in the backup/archive**. Do not run it again. The archive copy remains the historical migration record.
2. `TestFixtures_TEST.gs` — legacy fixture utility. It defines its own `SNC_FIXTURE_*` globals and callable inspect/create/cleanup functions, with no static cross-file references. It uses pre-existing hard-coded UserIDs and OfferingID and conflicts with the approved synthetic actor/academic fixture manifest. Recommendation: **remove this file from the active GAS TEST project after preserving its exact source in the backup/archive**. Do not run any function in it. Use only the approved current fixture plan and its controlled runner when all entry gates pass.

These recommendations concern the two extra files visible in the GAS editor but absent from the tracked GitHub runtime source. There is no GitHub runtime copy to edit or delete. Their original source remains preserved in the owner-provided ZIP. Do not delete or modify any of the 16 tracked backend source files.

### G-02 status

- Archive-wide static top-level declaration audit: **PASS — 0 duplicate names across 18 canonical source files**.
- Legacy utility dependency scan: **PASS — no static cross-file references to their declared functions**.
- GAS live-project compile: **NOT VERIFIED**. Static source analysis does not replace a save/compile check in Apps Script, and the current editor's exact source state has not been independently fetched.
- Recommended owner action: after confirming the ZIP backup remains safely retained, remove only `SchemaMigration_TEST.gs` and `TestFixtures_TEST.gs` from the active GAS TEST project, save the project, and provide a screenshot of the final file list and any save/compile status. Do not run either file's functions, and do not delete any other file.

No GitHub application source, GAS project, spreadsheet, Script Properties, triggers, Drive files, or LINE messages were modified by this audit. This update records findings and a proposed owner-side cleanup only.


## Owner evidence — legacy GAS TEST files removed from editor — 22 November 2026

The owner supplied two screenshots of the current GAS TEST editor file navigator after the requested cleanup. The visible file list includes `appsscript.json`, the active backend modules, `setup.gs`, `SNC_IntegrationTestRunner_TEST.gs`, `SNC_SystemPreflight_TEST.gs`, and `SNC_DataBaseline_TEST.gs`. The two legacy files `SchemaMigration_TEST.gs` and `TestFixtures_TEST.gs` are absent from the displayed file list.

- Removal from the visible GAS TEST project file list: **OWNER-CONFIRMED BY SCREENSHOTS**.
- No other file removal is apparent in the supplied screenshots; the visible active backend and TEST helper files remain present.
- Screenshot evidence does not by itself establish the save completed, project compilation, absence of duplicate declarations across any non-visible files, or runtime preflight results.
- G-01 remains **PASS** based on the earlier owner confirmation that the five controlled files matched the approved development source. The two legacy files were not part of the approved active source set.
- G-02 remains **BLOCKED / EVIDENCE PENDING** until the project save is confirmed and the read-only `SNC_SystemPreflight_TEST()` is run successfully in the TEST-bound GAS project. Do not run setup, migration, fixtures, triggers, notifications, or the Integration Test Runner.

No GitHub source files were changed by this editor cleanup evidence. No application data, Drive files, Script Properties, triggers, deployment settings, or LINE messages were changed by this checkpoint update.


## G-02 GAS TEST Preflight execution evidence — 22 November 2026

The owner supplied the complete execution-log excerpt for `SNC_SystemPreflight_TEST` v1.0.1, run against the TEST-bound `SportNutritionApp` spreadsheet. The log shows `Execution started` and `Execution completed` with no runtime exception. The emitted `SNC_PREFLIGHT_SUMMARY` reports:

- `environment`: TEST; spreadsheet name `SportNutritionApp`; spreadsheet ID suffix `dYeWFk`.
- `mode`: `READ_ONLY_SCHEMA_STATIC_AND_PURE_UNIT`; `writesExpected=0`; `externalCallsExpected=0`.
- ENV-01: PASS — TEST environment and active spreadsheet identity verified.
- DB-01: PASS — read-only inspection of all declared `SNC_SETUP.TABLES`; the emitted table details show `MATCH` with no missing or unexpected headers for the displayed tables.
- Unit test suites: 9 PASS, 0 FAIL. The suite results include assignment configuration (10/10), manual open/close controls (4/4), course/offering authorization (19/19), duplicate predicate (7/7), import validation (9/9), import authorization (6/6), group representative authorization (4/4), staged-file authorization (5/5), and grade-review state machine (10/10).
- Overall Preflight: `BLOCKED`; summary counts `PASS=11`, `FAIL=0`, `BLOCKED=1`, `NOT RUN=8`.
- Integration suites INT-01 through INT-07A: NOT RUN. Their API route/handler presence is reported as `PRESENT — NOT RUN`, not as integration-test PASS.
- INT-08 Browser/LIFF end-to-end/failure recovery: BLOCKED pending verified deployed TEST endpoint, browser/LIFF execution, and cross-module recovery evidence.

### Gate decision

- G-02 GAS project save/load/syntax execution: **PASS** — the owner-provided execution log confirms the current project successfully executed `SNC_SystemPreflight_TEST` after the two legacy files were removed, with no reported syntax/runtime load error. The repository-wide top-level declaration scan also found no duplicate names in the 16 tracked backend `.gs` files; the two archived legacy files were separately reviewed and had no duplicate `SNC_SETUP` declaration or top-level function-name collision with tracked backend source.
- Preflight overall: **BLOCKED**, independently of G-02, because INT-08 is BLOCKED and eight integration suites are NOT RUN.
- G-01: **PASS** (owner-confirmed five controlled files match approved development source).
- G-08: **BLOCKED / PARTIAL** — spreadsheet backup copy is owner-confirmed, but restore rehearsal and Drive-file recovery procedure are not evidenced.

The Preflight run was read-only by its declared mode and reported zero expected writes/external calls. No fixture creation, Integration Test Runner execution, migration, trigger, notification, Drive upload, or cleanup was performed.


## G-08 recovery work package — runbook prepared — 22 November 2026

The current checkpoint and approved fixture plan were reviewed against SNC-WG-001 v1.0.0. No Google Drive/Sheets connector capable of performing live copy, restore, Trash, or ACL operations is available in this session. Therefore no live recovery operation was attempted.

Created `sport-nutrition-classroom/docs/G08_RESTORE_REHEARSAL_RUNBOOK_v1.0_2026-11-22.md` (SNC-G08-RUNBOOK-001 v1.0) with a non-destructive recovery rehearsal using the owner-confirmed backup `Copy of SportNutritionApp` (backup ID retained in this private project checkpoint) as the source and a separate disposable spreadsheet copy as the target. The runbook requires comparison of all 22 sheets, headers, row counts, schema version 1.5.0, and private primary-key digests against the retained G-06 baseline. It explicitly prohibits restoring over live TEST or modifying the backup source.

The runbook also defines a Drive sentinel-file trash/restore test in the Restricted TEST submission folder. Because both the disposable spreadsheet creation/cleanup and the Drive sentinel create/Trash/restore are persistent resource operations outside the already-approved synthetic fixture manifest, explicit owner authorization is required before those operations. No resource was created, copied, trashed, restored, or deleted in this work package.

### G-08 status

- Backup copy existence/completeness: **OWNER CONFIRMED**.
- Spreadsheet restore rehearsal: **NOT RUN — awaiting explicit authorization for one disposable copy and exact-ID cleanup**.
- Drive file restore rehearsal: **NOT RUN — awaiting explicit authorization for one temporary sentinel file and exact-ID Trash/restore**.
- G-08: **BLOCKED / PARTIAL**.
- Fixture creation and Integration Test Runner: **HOLD**.

The runbook was committed on `development` as `62d2850509e54961da3a19393e827fd23746acfe`. No application source, TEST spreadsheet data, Drive files, Script Properties, triggers, deployment settings, or LINE messages were changed.


## G-08 owner authorization and execution readiness — 22 November 2026

The owner explicitly approved execution of both rehearsals in `SNC-G08-RUNBOOK-001 v1.0`:

1. G08-01 — create one disposable spreadsheet copy from the exact owner-confirmed backup source, verify all 22 sheets/headers/row counts/schema version/private primary-key digests against the G-06 baseline, then trash only that exact disposable copy.
2. G08-02 — create one harmless sentinel text file in the Restricted TEST submission folder, record its exact ID and digest, move only that file to Trash, restore it, verify identity/content/parent/access, then move only that exact sentinel to Trash for final controlled cleanup.

Authorization is limited to those two rehearsals and the exact temporary resources they create. It does not authorize changes to the live TEST spreadsheet, backup source, pre-existing Drive files, sharing/ACLs, permanent deletion, Production, triggers, LINE, or application data.

### Execution capability and current result

The current session has no connected Google Drive or Google Sheets action capable of creating/copying spreadsheets, creating Drive files, moving items to/from Trash, or reading Drive ACL/metadata. Therefore the assistant cannot execute either rehearsal directly or verify the resulting cloud resources in this session.

- Owner authorization: **PASS — explicit approval recorded**.
- G08-01 spreadsheet copy/restore rehearsal: **NOT RUN — live Drive/Sheets operation unavailable in this session**.
- G08-02 Drive sentinel Trash/restore rehearsal: **NOT RUN — live Drive operation unavailable in this session**.
- G-08: **BLOCKED — authorization satisfied; execution evidence pending**.
- Fixture creation and Integration Test Runner remain **HOLD**.

No spreadsheet or Drive resource was created, copied, trashed, restored, or deleted by the assistant. No application data, Script Properties, triggers, deployment settings, or LINE messages were changed.

### Owner-side execution handoff

The owner may execute the exact steps in `G08_RESTORE_REHEARSAL_RUNBOOK_v1.0_2026-11-22.md` in Google Drive. Record the disposable spreadsheet ID and sentinel file ID privately; do not put full IDs, raw primary-key manifests, personal data, or secrets in GitHub/chat. Provide sanitized screenshots and verification outputs for both rehearsals. The assistant will review the evidence and update G-08 only after both acceptance criteria are met.


## Owner clarification — G-08 is backup safeguard only; no additional restore rehearsal — 22 November 2026

The owner clarified that the backup/recovery processes have already passed in the existing operational process. The separate spreadsheet-copy rehearsal and Drive sentinel Trash/restore procedure proposed in `SNC-G08-RUNBOOK-001` are unnecessary for this project gate and are to be skipped. The backup copy is retained as a data-safety safeguard before synthetic testing, not as a request to repeat an already-passed recovery workflow.

This owner clarification supersedes the earlier G-08 runbook proposal and the subsequent request for disposable-copy and sentinel-file execution. Do not create `SNC_G08_RESTORE_DRILL_20261122`, do not create `SNC_G08_SENTINEL_20261122.txt`, and do not perform additional Trash/restore operations for G-08.

### Revised G-08 decision

- Existing TEST spreadsheet backup `Copy of SportNutritionApp`: **OWNER CONFIRMED COMPLETE** — all sheets, contents, and structure match the source as previously confirmed.
- Existing backup/recovery process: **OWNER CONFIRMED ALREADY PASSED** — accepted without repeating a separate rehearsal.
- Additional spreadsheet restore rehearsal: **NOT REQUIRED / WAIVED**.
- Additional Drive sentinel-file rehearsal: **NOT REQUIRED / WAIVED**.
- G-08 backup safeguard: **PASS — owner-confirmed backup and already-passed operational process**.
- No new spreadsheet or Drive resources are to be created for G-08.

The owner approval previously given for the runbook is superseded by this later instruction to skip those additional rehearsals. No resources were created, copied, trashed, restored, or deleted by the assistant.

**Next decision:** G-01 through G-08 entry gates are now satisfied on the evidence/owner confirmations recorded in this checkpoint. Proceed to the next controlled stage only after verifying the current source/deployment and TEST environment identities against the approved plan. The Integration Test Runner and fixture creation have not yet been run; this G-08 clarification does not convert any integration test status to PASS.

## POST endpoint diagnostic and Code.gs synchronization — 22 November 2026

The owner confirmed that the latest `testPostMissingToken()` function was copied from GitHub into the active GAS project and saved.

### POST diagnostic evidence (owner-provided)

- POST to the `/dev` URL returned HTTP 401 with HTML. This endpoint was not used for subsequent verification.
- POST to the active deployed `/exec` URL returned HTTP 200 and `application/json; charset=utf-8`.
- Response error code: `TOKEN_MISSING`, with the expected authentication rejection message.
- Result: **POST /exec dispatch and missing-token rejection PASS**.
- This does not test a valid LINE ID token, LINE identity verification success, or any database-backed application action.

### GitHub source synchronization

- Updated `sport-nutrition-classroom/backend/Code.gs` on `development` to use the active TEST `/exec` endpoint in `testPostMissingToken()`, emit safe response diagnostics, and assert the expected `TOKEN_MISSING` result.
- Follow-up correction ensures the JSON detection regular expression is stored as executable JavaScript regex syntax.
- Commits: `5e6a93ea7f628a80aaec9806909632a4e21e6294` (helper synchronization), then `875a0f074ea2b9ce4a0174077ccbeea75931c8e2` (regex correction).
- Latest Code.gs blob SHA: `7c9928f7ae269287d1537dec6256dce13783d26d`.
- Owner confirms the changed function has been copied into GAS. This confirms synchronization of the changed helper only; it is not a fresh whole-file GAS-versus-GitHub comparison.

### Next controlled action

The current `SNC_IntegrationTestRunner_TEST()` v1.1.0 source is explicitly read-only: it validates TEST Script Properties and active spreadsheet identity, inspects dispatcher/handler presence, and does not read or write application rows, Drive, triggers, or LINE. Its route presence findings are static inspection only and must remain `NOT RUN`, not integration PASS.

After the owner confirms the helper copy/save, run `SNC_IntegrationTestRunner_TEST()` once in the active GAS project and provide its complete sanitized log. Do not run fixture creation, setup/migration, notification, trigger, upload, or cleanup functions during this read-only runner step. Review the runner output before preparing the next fixture execution procedure.

- Synthetic fixture creation: **NOT RUN**.
- Database-backed Functional Integration Tests: **NOT RUN**.
- Real LINE LIFF valid-token test: **NOT RUN**.
- No application data, Drive resources, Script Properties, triggers, deployment settings, or LINE messages were changed by this synchronization.

## Integration Test Runner v1.1.0 — owner execution evidence — 23 November 2026

The owner executed `SNC_IntegrationTestRunner_TEST()` in the GAS TEST project. The supplied log shows Execution started/completed without runtime exception.

- Mode: `READ_ONLY_TEST_GUARD_AND_STATIC_DISPATCH_INSPECTION`.
- `writesExpected=0`; `externalCallsExpected=0`.
- Environment: TEST; Spreadsheet `SportNutritionApp`; ID suffix `dYeWFk`.
- ENV-01: PASS — TEST environment and active spreadsheet identity verified.
- STATIC-01: PASS — `doPost` dispatcher source available.
- STATIC-02: PASS — static route detector self-test passed.
- INT-02 Group Management: route and handler present; **NOT RUN**.
- INT-03 Group Authorization: route and handler present; **NOT RUN**.
- INT-04 Submission / Revision / Idempotency: route and handler present; **NOT RUN**.
- INT-05 File Upload / Attach / Access / Rollback: route and handler present; **NOT RUN**.
- INT-06 Grading / Grade Review: route and handler present; **NOT RUN**.
- INT-07 Notifications / Audit: route and handler present; **NOT RUN**.
- INT-01 Users / Roles / Enrollment: **NOT RUN**, synthetic fixture required.
- INT-08 Browser / LIFF E2E / Failure Recovery: **BLOCKED**, deployed browser/LIFF E2E and recovery evidence required.
- Summary: PASS=3, FAIL=0, BLOCKED=1, NOT RUN=7; overallStatus=BLOCKED.

### Interpretation and next step

This execution verifies the TEST environment guard and static dispatcher/handler presence only. It is not database-backed integration evidence and does not convert INT-01..INT-07 to PASS. The read-only runner completed as designed.

Proceed to a source-level review of the approved synthetic fixture creation path and actor authorization. Do not run legacy fixture/test functions or write directly to application sheets as a shortcut. Before any persistent write, produce a controlled execution procedure that checks exact TEST spreadsheet identity, confirms all reserved IDs are unused, captures exact created primary keys, and supports exact-ID rollback/cleanup. Keep file-upload tests separate until Drive folder and per-file sharing safeguards are reconfirmed. Keep notification actions and trigger functions out of this batch; the current no-token suppression is a caveat, not a durable notification stub.

- Integration Runner execution: **PASS — read-only checks only**.
- Static routes/handlers: **PRESENT — NOT RUN**.
- Synthetic fixture creation: **NOT RUN**.
- Database-backed integration tests: **NOT RUN**.
- Browser/LIFF E2E: **BLOCKED / NOT RUN**.

## Synthetic fixture runner v0.1.0 — core fixture handoff — 23 November 2026

Created `sport-nutrition-classroom/backend/tests/SNC_SyntheticFixtureRunner_TEST.gs` on `development`.

- Version: **0.1.0**.
- Source commit: `f1e57d15dcdd6894578183aefae0a5d5f3cbf3d4`.
- Exact-ID recovery-capture hardening commit: `08caf08f95160259bc514fbb03ffec06297c4db9`.
- Locking correction commit: `212109856a046d553538135120395174c895b5bd` (uses DocumentLock for the runner; application handlers retain their own ScriptLock).
- Apps Script editor entry-point wrapper commit: `c4b61d5433baffe2e73e45e8c6a175dc641cec78` (`SNC_CreateSyntheticCoreFixtures_CONFIRMED_TEST()` supplies the exact confirmation phrase because the Apps Script Run control does not pass function arguments).
- Current file blob SHA: `ac82b8ad56fab07237ed5401ef8fe9e4fa1f4c1e`.
- Source: https://github.com/worrawutt-source/worrawutsportsci/blob/development/sport-nutrition-classroom/backend/tests/SNC_SyntheticFixtureRunner_TEST.gs

### Scope of this first runner batch

The file is limited to creating the synthetic core needed to start INT-01:
- One synthetic Course, Semester, and CourseOffering.
- Six synthetic student Users and six active Enrollments through the existing `course.*` and `import.*` application handlers.
- Uses the existing active SYSTEM_ADMIN actor context; does not create a fake administrator, fake LINE account, or grant SYSTEM_ADMIN.
- Uses reserved numeric StudentIDs and `.invalid` email addresses.
- Captures generated IDs in a Script Properties manifest. A baseline of relevant primary keys is captured before writes; if execution stops, the runner records exact newly appearing IDs for reconciliation.
- No direct application-sheet writes, Drive files, uploads, group/assignment/submission fixtures, notifications, LINE calls, triggers, deployment changes, or automatic cleanup.
- Cleanup remains a separate operation and is not implemented or invoked by this file.

### Functions to copy into GAS

1. `SNC_SyntheticFixturePreflight_TEST()` — read-only environment, manifest, reserved-ID, and actor readiness check.
2. `SNC_CreateSyntheticCoreFixtures_TEST(confirmation)` — persistent fixture creation; requires the exact confirmation phrase embedded in the source.
3. `SNC_GetSyntheticFixtureManifest_TEST()` — reads the exact stored manifest for private owner-side retention.

### Safety and execution status

- Environment guard requires `SNC_ITR_ENVIRONMENT=TEST`, exact configured TEST spreadsheet ID, and active spreadsheet match.
- Creation requires preflight status READY and exactly one active SYSTEM_ADMIN actor.
- A script lock prevents concurrent fixture-runner execution.
- Manifest is saved after each successful creation stage; no IDs or student details are printed in the compact creation summary.
- On an error, the runner stops, records the exact-ID delta against the pre-write baseline when possible, and requires manual reconciliation. It does not attempt broad or automatic rollback.
- Static source review: **prepared; not yet executed in GAS**.
- GAS syntax/compile: **NOT RUN** (file has not yet been copied into the Apps Script project).
- Fixture creation: **NOT RUN**.
- INT-01 database-backed verification: **NOT RUN**.
- INT-02 through INT-08 remain NOT RUN/BLOCKED as previously recorded.

### Owner handoff

Copy only this new file into the existing GAS TEST project as a new script file named `SNC_SyntheticFixtureRunner_TEST.gs`. Do not replace any existing module. After saving, run `SNC_SyntheticFixturePreflight_TEST()` only and provide the complete sanitized log. Do not run the creation function until the preflight output is reviewed. Do not run setup/migration, legacy fixture functions, file upload, notification, trigger, or cleanup functions.

No GAS project, spreadsheet, Drive resource, Script Properties, trigger, deployment, or LINE configuration was changed by creating this GitHub source file.

## Synthetic fixture Preflight — owner execution evidence — 23 November 2026

The owner executed `SNC_SyntheticFixturePreflight_TEST()` in the GAS TEST project. The supplied execution log shows Execution started/completed without runtime exception.

- Runner: `SNC_SyntheticFixtureRunner_TEST` v0.1.0.
- Mode: `READ_ONLY_FIXTURE_PREFLIGHT`; `writesExpected=0`; `externalCallsExpected=0`.
- TEST environment and active spreadsheet identity: **PASS**; `SportNutritionApp`, ID suffix `dYeWFk`.
- Prior fixture manifest absent: **PASS**.
- All six reserved synthetic StudentIDs unused: **PASS**.
- Reserved synthetic CourseCode unused: **PASS**.
- Reserved synthetic semester key unused: **PASS**.
- Exactly one active existing SYSTEM_ADMIN actor available: **PASS** (identifier not logged).
- Summary: **6 PASS, 0 BLOCKED; status READY**.
- No fixture creation or application data write occurred during Preflight.

### Apps Script editor invocation adjustment

The original creation function accepts a confirmation argument, but the Apps Script editor Run control does not provide function arguments. Added `SNC_CreateSyntheticCoreFixtures_CONFIRMED_TEST()` as an explicit editor entry point. It calls the guarded creation function with the exact confirmation phrase already embedded in the source. This wrapper does not expand the approved fixture scope.

- Wrapper commit: `c4b61d5433baffe2e73e45e8c6a175dc641cec78`.
- Updated file blob SHA: `ac82b8ad56fab07237ed5401ef8fe9e4fa1f4c1e`.
- The updated file must be copied into GAS before the wrapper appears in the function list.
- Fixture creation remains **NOT RUN** until the owner runs the wrapper and supplies the sanitized execution result.
- If the wrapper stops with an error, do not rerun it; first inspect `SNC_GetSyntheticFixtureManifest_TEST()` and reconcile exact IDs.



## Synthetic Core Fixture Creation — 23 Nov 2026
- Owner-executed `SNC_SyntheticFixturePreflight_TEST()`: READY; 6/6 checks PASS; read-only; zero writes and external calls expected.
- Owner-executed `SNC_CreateSyntheticCoreFixtures_CONFIRMED_TEST()`: execution completed successfully.
- Result: `CORE_FIXTURE_CREATED`; evidence level `HANDLER_LEVEL_INTEGRATION`.
- Created: 1 Course, 1 Semester, 1 CourseOffering, 6 synthetic Students, 6 Enrollments, and 1 ImportJob. Fixture manifest stored in Script Properties.
- Cleanup status: NOT STARTED. No automatic rollback or cleanup was run.
- Not tested in this run: Group, Assignment, Submission, Drive, Notification, Trigger, LINE, Browser/LIFF.
- Next evidence step: run read-only `SNC_GetSyntheticFixtureManifest_TEST()` and inspect the exact generated synthetic IDs before planning the next integration stage. Do not rerun fixture creation.


## Fixture Manifest Logging Helper — 23 Nov 2026
- Added `SNC_LogSyntheticFixtureManifest_TEST()` to `backend/tests/SNC_SyntheticFixtureRunner_TEST.gs`.
- The helper calls the existing read-only manifest getter, logs the returned JSON, and returns it. It performs no spreadsheet writes, external calls, or cleanup.
- Owner should copy the latest runner source into Apps Script, save, then execute `SNC_LogSyntheticFixtureManifest_TEST()` to expose the stored manifest in the execution log.
- Source commit: `4fbc0792455fd99e3799060617e2043df320dfe0`.


## Synthetic Core Fixture Manifest Verified — 23 Nov 2026
- Owner executed `SNC_LogSyntheticFixtureManifest_TEST()`; execution completed and emitted the stored manifest.
- Manifest confirms environment TEST, spreadsheet suffix `dYeWFk`, status `CORE_FIXTURE_CREATED`, evidence level `HANDLER_LEVEL_INTEGRATION`.
- Stage reconciliation: PASS for Course creation, Semester creation, CourseOffering creation, Students import/enrollment (6), and fixture ID reconciliation (6 Users, 6 Enrollments).
- Exact generated Course, Semester, CourseOffering, ImportJob, Student, User, and Enrollment identifiers are recorded in the TEST Script Properties manifest. Do not copy existing baseline identifiers or full identifier lists into shared documentation.
- Baseline ID snapshots are present for Courses, Semesters, CourseOfferings, Users, Enrollments, and ImportJobs; existing records are to be preserved.
- Cleanup remains NOT STARTED. Do not rerun core fixture creation and do not perform broad cleanup.
- This confirms fixture creation and ID reconciliation only; it does not establish end-to-end API/browser/LIFF integration or pass Group, Assignment, Submission, Drive, Notification, Trigger, or LINE tests.
- Next: use the stored exact manifest IDs to design/execute the next approved integration stage with narrowly scoped checks; first inspect current handlers and dependencies. Keep all existing baseline records unchanged.
