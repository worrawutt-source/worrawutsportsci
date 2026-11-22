# SPORT NUTRITION CLASSROOM — G-08 Restore Rehearsal Runbook

- Document ID: SNC-G08-RUNBOOK-001
- Version: 1.0
- Date: 22 November 2026 (Asia/Bangkok)
- Branch: `development`
- Related plan: `SYNTHETIC_TEST_FIXTURE_PLAN_v1.0_2026-11-22.md`
- Status: **OWNER APPROVED — EXECUTION NOT RUN (Google Drive/Sheets connector unavailable in assistant session)**

## 1. Purpose

Define a non-destructive rehearsal to establish that the owner can recover the pre-test TEST spreadsheet state and recover a TEST Drive file. This runbook does not authorize overwriting the live TEST spreadsheet, changing sharing, permanently deleting resources, or altering Production.

## 2. Known recovery resources

- Live TEST spreadsheet: `SportNutritionApp`, verified ID suffix `dYeWFk`.
- Owner-confirmed backup copy: `Copy of SportNutritionApp`, ID `18nqRH9ppjaFsO8cqys_F5NFAnI64arDjU4KTOPVYaqE`.
- Expected schema: version `1.5.0`, 22 declared tables.
- Private TEST submission folder: `SPORT_NUTRITION_SUBMISSIONS`, under `ProjectLine`, owner-confirmed Restricted.
- The owner confirmed the backup contains all sheets and contents/structure. No restore rehearsal has yet been evidenced.

## 3. Safety rules

1. Never restore over or edit the live TEST spreadsheet during this rehearsal.
2. Never modify the owner-confirmed backup source copy.
3. Use a separate disposable copy as the restore target.
4. Capture exact IDs of every disposable resource immediately after creation.
5. Do not include raw primary-key manifests, student personal data, or secrets in GitHub or chat.
6. Do not change Drive sharing or use permanent deletion.
7. If the backup cannot be copied/read, any sheet/header differs, or recovery identity cannot be verified, stop and mark G-08 BLOCKED.
8. Preserve the 18 existing Users and all baseline records.
9. Keep LINE token absent; do not run notification, trigger, setup, migration, fixture, or Integration Test Runner functions.

## 4. Spreadsheet restore rehearsal — proposed procedure

**Owner approval received on 22 November 2026. Execution remains pending because this assistant session has no live Google Drive/Sheets operation capability.**

1. In Google Drive, locate the backup by its exact ID recorded above. Verify its name is `Copy of SportNutritionApp`; do not open the live TEST spreadsheet as the copy source.
2. Use **Make a copy** on the backup source. Name the new disposable target `SNC_G08_RESTORE_DRILL_20261122`.
3. Record the exact new spreadsheet ID and URL in a private owner-side evidence note. Do not place the full ID in GitHub.
4. Open the disposable target and verify:
   - all 22 expected sheets exist;
   - each sheet's header row matches the pre-test baseline;
   - row counts match the retained G-06 baseline summary;
   - the full primary-key manifest/digests match the private pre-test manifest;
   - the 18 existing Users remain present and unchanged;
   - schema version remains `1.5.0`.
5. Record screenshots of the sheet tabs and sanitized comparison output. Do not expose names, emails, StudentIDs, or raw primary-key values.
6. If any mismatch appears, do not copy anything back to live TEST. Mark the rehearsal FAIL/BLOCKED and retain the disposable target for diagnosis.
7. After successful verification and evidence capture, trash only the exact disposable target spreadsheet created in step 2. Record its ID and confirm it is in Trash. Do not permanently delete it during the rehearsal.

**Acceptance:** the backup source can be copied into an isolated target and the target's 22-sheet structure, headers, row counts, and private key digests match the retained baseline. This proves copy-based recoverability; it does not authorize or test overwriting the live TEST spreadsheet.

## 5. Drive file recovery rehearsal — proposed procedure

**Owner approval received on 22 November 2026. Execution remains pending because this assistant session has no live Google Drive operation capability.**

1. Verify the exact TEST folder is still `SPORT_NUTRITION_SUBMISSIONS`, Restricted, and contains no unexpected files.
2. Create one harmless text sentinel file named `SNC_G08_SENTINEL_20261122.txt` in that folder, containing only a non-secret fixed marker such as `SNC-G08-RECOVERY-DRILL`.
3. Record the exact Drive file ID, parent folder ID, size, and a local SHA-256 digest of the content in a private owner-side evidence note.
4. Move only that exact sentinel file to Trash (never permanently delete it).
5. From Drive Trash, restore that exact file.
6. Verify the restored file retains the same file ID, parent folder, contents/digest, and restricted access context.
7. After recording evidence, move only that exact sentinel file to Trash again. Do not empty Trash or delete any pre-existing file.
8. If restore changes the file ID, parent, or access unexpectedly, stop and mark G-08 BLOCKED.

**Acceptance:** the owner can trash and restore one exact synthetic TEST file, verify its identity/content and keep the folder's access restricted, then leave only the exact sentinel in Trash for final controlled cleanup. Permanent deletion is out of scope.

## 6. Evidence record

For each rehearsal capture:
- operator and date/time (Asia/Bangkok);
- exact source backup ID and exact disposable target ID (private record);
- source and target spreadsheet name, schema version, sheet count, per-table row counts, and key digests;
- Drive sentinel ID, parent folder ID, content digest, and before/after Trash state;
- screenshots with sensitive identifiers redacted;
- final status: PASS / FAIL / BLOCKED / NOT RUN.

Do not place full spreadsheet IDs, Drive file IDs, raw key manifests, student data, or credentials in the public repository.

## 7. Current status

- Backup copy existence and completeness: **OWNER CONFIRMED**.
- Spreadsheet restore rehearsal: **NOT RUN — owner authorized; live Drive/Sheets operation unavailable in assistant session**.
- Drive sentinel restore rehearsal: **NOT RUN — owner authorized; live Drive operation unavailable in assistant session**.
- G-08: **BLOCKED / PARTIAL** until both rehearsals pass and evidence is recorded.
- Fixture creation and Integration Test Runner: **HOLD** until G-08 passes.

