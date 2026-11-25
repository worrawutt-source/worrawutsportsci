# WP-SUB-2 Owner Evidence & Manifest Template

- Project: SPORT NUTRITION CLASSROOM
- Work package: WP-SUB-2 — Submission file / Google Drive integration
- Version: 1.0.0
- Date: 25 November 2026
- Status: **DRAFT TEMPLATE — OWNER INPUT / REVIEW REQUIRED**
- Branch: `development`

## Purpose and safety boundary

Use this template to collect owner-approved evidence needed to resolve WP-SUB-2 Preflight checks PF-01–PF-20. This document does not authorize Runner development, persistent execution, Drive upload, permission changes, file deletion, cleanup, migration, triggers, deployment, LINE/UrlFetch, or external calls.

Do not place raw User IDs, emails, Assignment/Group/Submission IDs, Drive File IDs, credentials, tokens, or file contents in this repository. Exact IDs, actor-to-email mapping, ACL details, and Drive inventory must be stored only in a restricted owner-approved location. In GitHub, record only a reference to that restricted evidence, approval status, and sanitized counts/hashes.

## Latest owner-run Preflight checkpoint

- Execution: `SNC_WP_SUB_2_Preflight_READONLY_TEST()`
- Result: `BLOCKED`; PASS=4, FAIL=0, BLOCKED=16, NOT_RUN=0
- PF-04–PF-07: PASS
- Safety: writesExpected=0, externalCallsExpected=0, driveMutationsExpected=0, sheetWritesExpected=0, propertiesWritesExpected=0, triggersExpected=0, cleanupPerformed=false
- Latest transient counts are recorded in `docs/handoff/CURRENT.md`; counts are not an exact-ID baseline.

## PF evidence register

| PF | Required evidence / owner decision | Evidence reference (restricted if needed) | Status |
|---|---|---|---|
| PF-01 | Approved, machine-verifiable TEST environment marker and exact TEST Spreadsheet identity |  | BLOCKED |
| PF-02 | External Source Manifest comparison; reconcile GAS source with `development`; review `appsscript.json` deployment settings separately | Fresh export comparison + owner confirmation of manifest settings; documented comment-only variance | PASS |
| PF-03 | Exact WP-SUB-1 manifest/baseline IDs; prove WP-SUB-2 scope does not overlap or reuse them |  | BLOCKED |
| PF-04 | Script Property matches owner-approved TEST submission folder | Preflight log 25 Nov 2026, 12:59 | PASS |
| PF-05 | Folder name and parent verified | Preflight log 25 Nov 2026, 12:59 | PASS |
| PF-06 | Four expected direct child folders present, no duplicate names | Preflight log 25 Nov 2026, 12:59 | PASS |
| PF-07 | Folder sharing access is PRIVATE | Preflight log 25 Nov 2026, 12:59 | PASS |
| PF-08 | Effective ACL including inherited permissions reviewed; no unexpected users/groups/domain access |  | BLOCKED |
| PF-09 | Approved GAS execution account and ownership/access context confirmed |  | BLOCKED |
| PF-10 | Approved fixture inventory: filename, SHA-256, bytes, MIME, extension, expected outcome, Drive folder |  | BLOCKED |
| PF-11 | Owner-approved synthetic Actor/Role mapping from existing Core Fixture |  | BLOCKED |
| PF-12 | Unique approved test email mapping for actors; keep raw emails restricted |  | BLOCKED |
| PF-13 | Exact eligible Individual and Group Assignment targets approved |  | BLOCKED |
| PF-14 | Exact Group/member/leader/current-active mapping approved |  | BLOCKED |
| PF-15 | Approved required-header/schema manifest for every relevant Sheet |  | BLOCKED |
| PF-16 | Exact primary-ID inventory for relevant Sheets plus exact Drive inventory/fingerprint captured read-only |  | BLOCKED |
| PF-17 | Notification stub strategy, restore proof, and zero real external calls confirmed for Runner design |  | BLOCKED |
| PF-18 | Owner-approved test window; no overlapping TEST activity; concurrency lock/stop plan confirmed |  | BLOCKED |
| PF-19 | Owner-approved restricted Manifest storage location, access list, retention, and backup | Owner approved encrypted owner-only evidence policy and owner/authorized-custodian-only GAS Execution Log access; exact destination and actual log ACL enforcement still require verification before inventory | APPROVED POLICY — VERIFY CONTROLS |
| PF-20 | Owner decision on post-test file disposition; default is preserve and no cleanup | Owner explicitly approved `PRESERVE`; no Cleanup, delete, move, rename, overwrite, or file alteration | PASS — PRESERVE |

## Source Manifest reconciliation

### Latest comparison from `SNC_GAS_EXPORT_20261125_FRESH.zip`

- Export contains **33 code files plus `appsscript.json`**.
- The 32 repository-tracked code files were compared with `development` after normalizing the export's missing final newline: **31/32 match exactly**; the only remaining difference is comment-only in the Cleanup file.
- `SNC_AuditLogReconciliation_READONLY_TEST.js` now matches GitHub `development` after newline normalization. Exported normalized Git blob SHA: `afc868148b568d2ed524c1fe66a2723b715e4dc5`, equal to the current GitHub blob. This supersedes the prior export discrepancy; the older ZIP remains historical evidence.
- `SNC_ApprovedCleanup_EXACT14_TEST.js`: the export has three trailing commented invocation lines not present in GitHub. They are comments, not executable top-level calls. The difference is documented and does not indicate a runnable cleanup call. **Do not run Cleanup.**
- `SNC_SetFolderProperty_TEMP.js` is an owner-created temporary utility to correct `SNC_SUBMISSION_FOLDER_ID`. Its presence in GAS is expected and explained; the property was previously verified by owner log. Do not rerun it unless the owner specifically needs to correct the property again.
- `appsscript.json` is not versioned in this repository. The export declares `webapp.executeAs=USER_DEPLOYING` and `webapp.access=ANYONE_ANONYMOUS`. The owner confirmed these values are intentional/current for this project. No setting was changed.
- Source code reconciliation is **owner-reviewed with one documented comment-only variance and one owner-created temporary utility**. PF-02 is now **PASS** for the source-manifest comparison and exported manifest review. This does not independently verify the effective settings of an already deployed Web App; no deployment was inspected or changed.
- Runtime distinction: the current GAS Preflight source intentionally hardcodes its PF-02 result as `BLOCKED` because it cannot inspect its own source/deployment manifest. The PASS above is the **external owner evidence-register status** after export comparison and owner review; it does not change the already supplied GAS Preflight log or make the overall Preflight READY. A code refinement to consume external evidence would require separate review.

| File | Exported normalized blob SHA | GitHub development blob SHA | Disposition |
|---|---|---|---|
| `SNC_ApprovedCleanup_EXACT14_TEST.js` | `24fa5153f188cbd4dca18894a574930e23c7c877` | `9fd76f859e4f806dd951ce94e2f22ba83ee0692d` | Comment-only variance; no executable invocation; preserve and do not run |
| `SNC_AuditLogReconciliation_READONLY_TEST.js` | `afc868148b568d2ed524c1fe66a2723b715e4dc5` | `afc868148b568d2ed524c1fe66a2723b715e4dc5` | Exact match after newline normalization |

The owner-created `SNC_SetFolderProperty_TEMP.js` is not a repository source file and is not counted among the 32 tracked code files.

## Restricted baseline manifest — storage outside GitHub

The following exact data must be captured read-only and kept in the owner-approved restricted location, not pasted into this file or chat:

- WP-SUB-1 stored manifest property and status; exact baseline and created ID arrays for relevant tables.
- Current exact primary IDs and exact deltas for Users, Enrollments, Assignments, Groups, GroupMembers, Submissions, SubmissionFiles, IdempotencyKeys, AuditLogs (as applicable).
- Exact Drive folder/file IDs, names, MIME types, sizes, and hashes for existing files; identify the four approved child folders and their contents.
- Sheet schema/header manifest and source blob manifest.
- Evidence timestamp, TEST Spreadsheet identity, execution account, and owner approval.

The capture must be read-only. Do not write a Script Property, Sheet, Drive file, or Runner Manifest as part of baseline capture until PF-19 storage and PF-20 disposition are approved.

## Owner review / approvals

- Source synchronization reviewed by: ____________________
- TEST environment and execution account confirmed by: ____________________
- Restricted evidence location approved by: **Owner approval recorded 25 Nov 2026**; exact encrypted destination and actual access enforcement to be verified before inventory.
- Effective ACL reviewed by: ____________________
- Fixture / actor / Assignment / Group mapping approved by: ____________________
- Test window approved: ____________________
- File disposition: **`PRESERVE` — owner approved 25 Nov 2026; no Cleanup.**
- Date/time (Asia/Bangkok): ____________________

## Gate

PF-02 source-manifest review is **PASS** with the documented comment-only Cleanup variance and owner confirmation of the exported manifest settings. PF-20 is **PASS — PRESERVE** by owner approval. PF-19 policy is approved, but exact encrypted destination and actual GAS Execution Log access enforcement must be verified before Exact-ID Inventory. Overall WP-SUB-2 Preflight remains **BLOCKED** because PF-01, PF-03, PF-08..PF-18 (except PF-04..PF-07 already PASS) and PF-19 operational verification are unresolved. Runner implementation and persistent execution remain separate approval gates. No Cleanup is authorized.


## Owner approval — PF-19/PF-20 — 25 Nov 2026

- PF-19 policy approved: store exact-ID evidence in an encrypted, owner-only restricted location; restrict GAS Execution Logs containing exact inventory output to owner/authorized custodian only.
- PF-20 approved disposition: `PRESERVE`. Do not run Cleanup or delete/move/rename/overwrite existing test files.
- This approval does not prove the encrypted destination is configured or the GAS Execution Log ACL is already restricted. Because the current Exact-ID Inventory function logs raw exact IDs, do not run it until both controls are verified. If the log cannot be restricted, use a separately reviewed safe-output approach before any inventory execution.
- Keep raw IDs and actor/file mappings out of chat and GitHub. Record only sanitized counts, hashes, and status in the repository.
