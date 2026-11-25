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
| PF-02 | External Source Manifest comparison; reconcile GAS source with `development`; review `appsscript.json` deployment settings separately |  | BLOCKED |
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
| PF-19 | Owner-approved restricted Manifest storage location, access list, retention, and backup |  | BLOCKED |
| PF-20 | Owner decision on post-test file disposition; default is preserve and no cleanup |  | BLOCKED |

## Source Manifest reconciliation

### Current comparison from `SNC_GAS_EXPORT_20261125.zip`

- Export contains 32 code files plus `appsscript.json`.
- 30/32 code files match GitHub `development` after normalizing the missing final newline in the export.
- Differences requiring owner reconciliation:
  1. `SNC_ApprovedCleanup_EXACT14_TEST.js`: export contains three trailing commented invocation lines not present in GitHub. They are comments, not executable calls. Do not run Cleanup.
  2. `SNC_AuditLogReconciliation_READONLY_TEST.js`: exported version differs substantively from GitHub `development`; the GitHub version adds pre-batch AuditLog baseline, exact delta/untracked ID, and header checks. Sync/review the current read-only helper in the TEST GAS project.
- `appsscript.json` is not versioned in this repository. The export declares `webapp.executeAs=USER_DEPLOYING` and `webapp.access=ANYONE_ANONYMOUS`. Owner must review and record the approved deployment configuration; no deployment action is authorized.

| File | Exported normalized blob SHA | GitHub development blob SHA | Owner disposition |
|---|---|---|---|
| `SNC_ApprovedCleanup_EXACT14_TEST.js` | `24fa5153f188cbd4dca18894a574930e23c7c877` | `9fd76f859e4f806dd951ce94e2f22ba83ee0692d` |  |
| `SNC_AuditLogReconciliation_READONLY_TEST.js` | `0e3dedbd94ad67b850cea8bc8bf3a0fa7877bd3a` | `afc868148b568d2ed524c1fe66a2723b715e4dc5` |  |

After the owner syncs/reviews the differences, re-export the same TEST GAS project and rerun the external file-by-file comparison. Do not claim PF-02 PASS until code files and manifest configuration have an approved, reproducible reconciliation.

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
- Restricted evidence location approved by: ____________________
- Effective ACL reviewed by: ____________________
- Fixture / actor / Assignment / Group mapping approved by: ____________________
- Test window approved: ____________________
- File disposition: `PRESERVE` / other separately approved decision: ____________________
- Date/time (Asia/Bangkok): ____________________

## Gate

**WP-SUB-2 remains BLOCKED.** Runner implementation and persistent execution remain separate approval gates. No cleanup is implied by this template.
