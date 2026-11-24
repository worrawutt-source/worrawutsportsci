# SPORT NUTRITION CLASSROOM — WP-SUB-2 Preflight & Runner Specification

- Document ID: SNC-WP-SUB-2-PRS
- Version: 1.0.0
- Date: 24 November 2026
- Status: **DRAFT FOR OWNER REVIEW — NOT APPROVED FOR IMPLEMENTATION OR EXECUTION**
- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development`
- Governing test plan: `docs/WP-SUB-2_TEST_PLAN_v1.0.0_2026-11-24.md`
- Work package: Drive Binary Upload, Staged File Lifecycle, Access Control and Recovery

---

## 1. Purpose and decision boundary

This specification translates the WP-SUB-2 Test Plan into a proposed design for two separate Google Apps Script (GAS) utilities:

1. **Preflight** — read-only inspection of source/configuration, TEST folder, fixture eligibility and baseline state. It must not create, modify, share, trash or delete Drive files; write Sheets or Script Properties; install or execute triggers; send notifications; or call external services.
2. **Runner** — controlled, persistent test execution using approved application handlers and explicitly approved Drive operations. It is a separate utility and must not be callable as a side effect of Preflight.

This document is a design proposal only. It does not authorize implementation, copying code into GAS, running Preflight, running Runner, uploading files, granting/revoking permissions, changing Script Properties, or cleanup.

## 2. Verified repository and source baseline

At specification drafting, the latest observed `development` HEAD was:

- `d27e9d6fe40b1e298a4610c349431fe976e2bf5c`

Current source blobs re-fetched from `development`:

| File | Blob SHA |
|---|---|
| `backend/FileManagement.gs` | `86cd29160dd00207c9a575ce801da09e643911cb` |
| `backend/SubmissionManagement.gs` | `ef4b86678e8c1feeea425ba578501846129a229c` |
| `backend/NotificationManagement.gs` | `875b60d90f4599ee0f9bdf0f60dcea31e215de7b` |
| `docs/WP-SUB-2_TEST_PLAN_v1.0.0_2026-11-24.md` | `df64f7483ee8a4441756c90e7d85e4f50f7be848` |

These hashes are drafting references, not implementation pins. Before implementation, re-fetch HEAD and all relevant source files; if any source changes, perform a behavior diff and revise this specification before coding.

### 2.1 Relevant source behavior

- Upload accepts the MIME types and file signatures defined in `FileManagement.gs`, with `FM_MAX_BYTES_ = 4 * 1024 * 1024`. OOXML packages are unzipped and checked for required package paths and an expanded size limit of 20 MiB.
- Upload reads Script Property `SNC_SUBMISSION_FOLDER_ID`, obtains the folder through `DriveApp.getFolderById`, requires `folder.getSharingAccess() === DriveApp.Access.PRIVATE`, creates a Drive file, attempts uploader Viewer access, appends a staged `SubmissionFiles` row and then appends an AuditLog event.
- The staged marker is `STAGED:<userId>:<assignmentId>`.
- Upload metadata failure and AuditLog failure trigger compensating cleanup attempts; cleanup failures may leave orphaned Drive files or metadata and must be independently reconciled.
- `file.access` denies missing/staged metadata and checks application-level Submission access before returning the Drive URL.
- Submission attachment validates that the staged file belongs to the submitter or an active member of the same group for the same Assignment. It attempts to share files with the submitter, active group members and active Course Instructors.
- Submission rollback is compensating, not atomic. It attempts to restore staged metadata, Submission rows, group lock and newly added Viewer permissions.
- Submission creation may call `notifySubmissionReceived_`; notification functions can reach LINE through `UrlFetchApp.fetch`. The Runner must prevent real notification and network activity before any handler action.

### 2.2 Source review items to preserve

1. Folder `PRIVATE` status is not equivalent to proof of effective file-level ACL isolation. Direct and inherited permissions need separate inspection.
2. The uploader grant in the upload handler is attempted only when a matching User record with an email is found; the handler does not fail at that point when the record/email is absent. Later submission sharing validates email for authorized participants. Preflight must verify actor records and emails before any persistent run.
3. The current rollback paths may catch secondary errors and emit generic logs. The Runner must not interpret the handler's error response alone as proof that rollback succeeded.
4. A failure to persist Runner manifest state is itself a stop condition. No automatic replay is permitted.

## 3. TEST Drive folder mapping

The owner supplied a screenshot showing:

- Parent folder: `ProjectLine`
- Test folder: `SNC_TEST_SUBMISSION_FILES`
- Folder ID read from the supplied Drive URL: `1qkSUK8nEOw_bZqElkpM4VJQZEZjK56`
- Child folders:
  - `01_VALID_FILES`
  - `02_INVALID_FILES`
  - `03_UPLOADED_TEST_FILES`
  - `04_ROLLBACK_TEST`

The folder ID and names are recorded as **owner-provided setup information**. The ID, parent, ownership, access inheritance, effective permissions, and GAS execution access have not been independently verified.

### 3.1 Intended use of the four child folders

| Folder | Intended contents | Preflight expectation | Runner behavior |
|---|---|---|---|
| `01_VALID_FILES` | Approved synthetic valid source fixtures | Inventory matches approved fixture manifest exactly | Read fixtures only if the approved fixture delivery method permits it; do not modify source fixtures |
| `02_INVALID_FILES` | Approved synthetic invalid/negative fixtures | Inventory matches approved fixture manifest exactly | Read fixtures only; no upload should create a Drive file for rejected cases |
| `03_UPLOADED_TEST_FILES` | Files created by successful upload cases | Baseline inventory captured exactly; any pre-existing items are declared | New files may be created only during the separately authorized persistent run |
| `04_ROLLBACK_TEST` | Isolated files for approved failure/rollback cases | Baseline inventory captured exactly | Use only for approved rollback cases; do not clear or overwrite existing contents |

No folder should be created, renamed, moved, emptied, or have its sharing changed by either utility. Preflight must report unexpected contents as BLOCKED, not attempt to repair the folder.

### 3.2 Configuration binding

- Script Property key: `SNC_SUBMISSION_FOLDER_ID`.
- Expected configured folder: the exact owner-supplied TEST folder above.
- Preflight may read the property value in memory and compare it to the expected ID, but must never print the raw ID or write the property.
- Ordinary logs should report `folderConfigMatch=true/false`, not the folder ID.
- If the property is missing, mismatched, unreadable, or points to another folder, Preflight returns BLOCKED. Do not change the property as part of this work package.
- Runner must repeat the folder identity guard immediately before its first Drive mutation; a prior Preflight result is not a permanent authorization token.

## 4. Utility file layout and entry points

Proposed files, subject to approval:

| Proposed file | Purpose | Entry point |
|---|---|---|
| `backend/tests/WP-SUB-2/SNC_WP_SUB_2_Preflight_TEST.gs` | Read-only preflight and sanitized report | `SNC_WP_SUB_2_Preflight_READONLY_TEST()` |
| `backend/tests/WP-SUB-2/SNC_WP_SUB_2_Runner_TEST.gs` | Persistent test orchestration and manifest state machine | `SNC_WP_SUB_2_Run_CONFIRMED_TEST()` |
| `backend/tests/WP-SUB-2/SNC_WP_SUB_2_Reconciliation_TEST.gs` | Read-only exact-ID, Drive inventory and permission reconciliation | `SNC_WP_SUB_2_Reconcile_READONLY_TEST()` |
| `backend/tests/WP-SUB-2/SNC_WP_SUB_2_Manifest_TEST.gs` | Manifest schema and safe state helpers, if separated | Internal helpers only |

The Preflight and Runner entry points must be separate. The Preflight file must not call the Runner. No time-based trigger, menu action, web endpoint, deployment, or automatic continuation is proposed.

A zero-argument Editor entry point should be provided for each owner-run function. Internal functions may accept explicit configuration objects for unit-level testing, but must not expose a callable path that bypasses environment and approval guards.

## 5. Preflight specification — read-only

### 5.1 Hard invariants

Preflight must:

- perform reads only;
- not call `DriveApp.createFile`, `setTrashed`, `addViewer`, `removeViewer`, or any permission mutation;
- not write Sheets, Script Properties, PropertiesService, CacheService or manifest state;
- not invoke business handlers that can mutate records;
- not install, delete or run triggers;
- not call `UrlFetchApp`, LINE, email, or external network services;
- not create temporary files or folders;
- not reveal raw folder IDs, file IDs, user IDs, email addresses, Drive URLs, tokens or file contents in ordinary logs.

Preflight may read the approved Drive folder and its child folders, relevant Sheet schemas/rows, Script Property values, source/version markers supplied by the owner, and Drive permission metadata. If a permission API does not expose sufficient information to establish effective access, report the check as BLOCKED/UNVERIFIED rather than infer success.

### 5.2 Check groups

| ID | Check | Required evidence | PASS condition | BLOCK condition |
|---|---|---|---|---|
| PF-01 | TEST project identity | Explicit TEST environment marker and approved project binding | Exact TEST identity confirmed | Missing, ambiguous or production identity |
| PF-02 | Source revision | Current expected source hashes or approved source manifest | All relevant files match approved implementation set | Missing or mismatched source |
| PF-03 | WP-SUB-1 safety | Existing WP-SUB-1 manifest/records read-only state | No attempt to mutate or reuse prior records | Any collision or unsafe overlap |
| PF-04 | Script Property presence | Presence and in-memory comparison of `SNC_SUBMISSION_FOLDER_ID` | Present and matches approved folder ID | Missing, mismatched or inaccessible |
| PF-05 | Folder identity | Folder name, ID comparison, parent relation | Exact TEST folder under expected parent | Wrong folder, missing folder or ambiguous identity |
| PF-06 | Child folder topology | Four expected child names and IDs | Exactly the expected child folders are resolved | Missing, duplicate-name ambiguity or unexpected topology |
| PF-07 | Folder sharing state | Folder sharing access and available permission details | PRIVATE/Restricted and no detectable unintended broad grant | Non-private, inherited broad grant, or insufficient evidence |
| PF-08 | Effective access model | Direct/inherited permission metadata and account context | Approved restricted access model is demonstrable | Any unexplained principal or inability to inspect |
| PF-09 | Execution identity | Effective GAS account identity in a privacy-safe form; Drive capability | Matches owner-approved executor | Unknown or not authorized |
| PF-10 | Fixture inventory | File names, sizes, MIME metadata and approved fixture manifest | Exact match; no unexpected files | Missing, extra, changed or unapproved file |
| PF-11 | Actor mapping | Synthetic User records and role mapping | All required actors exist and are distinct where required | Missing, duplicate or real-person identity |
| PF-12 | Actor email readiness | Valid distinct synthetic email records | All required emails are valid and owner-approved | Missing, invalid or shared email where distinction is required |
| PF-13 | Assignment eligibility | Individual/Group Assignment status and Offering relation | Existing approved targets are eligible and open for intended operation | Closed, missing, wrong Offering or already-used target |
| PF-14 | Group topology | Active members, leader/representative, former member and membership status | Matches approved role matrix and group constraints | Ambiguous or unexpected membership |
| PF-15 | Sheet schema | Required columns in SubmissionFiles, Submissions, Groups, AuditLogs and supporting tables | Required headers exist exactly once | Missing/duplicate required header |
| PF-16 | Baseline inventory | Exact relevant row IDs and Drive folder file IDs/counts | Capturable without mutation; no unexplained prior test files | Duplicate IDs, unknown files or baseline ambiguity |
| PF-17 | Notification isolation readiness | Test harness can install and restore in-memory stubs without invoking real network | Stub design and restore path are statically verified | Cannot guarantee zero external calls |
| PF-18 | Concurrent activity | Owner confirms isolated TEST window; read-only state stable | No competing run or user activity expected | Concurrent run/activity or unknown state |
| PF-19 | Manifest readiness | Approved scope/version and manifest storage design | Persistent manifest location and access restrictions approved | Manifest store unspecified or not protected |
| PF-20 | File disposition | Owner decision recorded | Retention choice recorded; cleanup remains separately gated | No disposition decision |

### 5.3 Preflight result contract

Preflight returns a sanitized object and logs a compact summary:

- `success`: true only when the inspection itself completed.
- `status`: `READY`, `BLOCKED`, or `ERROR`.
- `checksTotal`, `pass`, `fail`, `blocked`, `notRun`.
- `sourceManifestMatch`.
- `folderConfigMatch`.
- `folderPrivate`.
- `effectiveAclVerified`.
- `actorMappingComplete`.
- `assignmentTargetsEligible`.
- `fixtureInventoryMatch`.
- `baselineCapturedReadOnly`.
- `externalCallsExpected=0`.
- `writesExpected=0`.
- `blockers`: sanitized check IDs and reason codes only.

READY requires every mandatory check to PASS. An unknown, inaccessible or inconclusive security check is BLOCKED, not PASS. READY means only that the observed state meets the preflight conditions at that moment; it does not authorize persistent execution.

## 6. Runner specification — persistent, controlled execution

### 6.1 Runner hard gates

Before any mutation, Runner must require all of the following:

1. TEST environment confirmed.
2. Current source hashes match the reviewed and approved source manifest.
3. Exact Drive folder identity and configuration match.
4. Preflight result is READY and is bound to the same scope version, source manifest and fixture inventory.
5. Owner has separately authorized the exact persistent run, actors, Assignment targets, fixtures, Drive operations, failure injections and file disposition.
6. No prior WP-SUB-2 run is in a non-terminal or unresolved state.
7. No WP-SUB-1 IDs or files will be reused.
8. Notification isolation is installed and verified before any handler action that could invoke notifications.
9. Manifest storage and recovery path are available and write-tested only by an explicitly approved safe mechanism.

If any gate fails, Runner exits before creating a Drive file, changing permissions or writing business records.

### 6.2 State machine

Proposed states:

- `NOT_STARTED`
- `PREFLIGHT_VERIFIED`
- `RUNNING`
- `STOPPED_REQUIRES_RECONCILIATION`
- `RECONCILED_WITH_REVIEW_ITEMS`
- `COMPLETE`
- `ABORTED_BEFORE_MUTATION`

Rules:

- `COMPLETE` is permitted only after all required cases and independent reconciliation pass.
- Any unexpected write, missing manifest persistence, exception after mutation begins, failed rollback, permission mismatch, unknown Drive file, notification-stub restoration failure, or external-call evidence transitions to `STOPPED_REQUIRES_RECONCILIATION`.
- A stopped or interrupted run must never be restarted from the beginning.
- No resume operation is included in v1.0.0. A future continuation must be a separately reviewed design based on exact reconciliation.
- The Runner must persist the case intent before mutation, persist exact returned IDs immediately after each successful mutation, and persist case completion only after its postcondition checks pass.
- If it cannot persist the post-mutation IDs, it must stop and rely on read-only folder/table reconciliation; it must not guess or replay.

### 6.3 Manifest design

The restricted manifest should be stored in a dedicated, owner-approved TEST-only location. Its storage mechanism is not selected in this specification; it must be approved before implementation. Do not silently choose a sheet or Script Property that might be shared with production or other test suites.

Manifest fields:

- schema version, plan version, scope hash, run token, created timestamp;
- TEST environment marker and source blob SHAs;
- preflight summary and timestamp;
- approved folder reference (restricted field; never ordinary log);
- approved actor role mapping (restricted);
- approved Assignment and Group target references (restricted);
- fixture names, SHA-256, byte count, MIME type and extension;
- pre-run exact baseline IDs/inventory for relevant tables and Drive child folders;
- per-case ID, intent status, request ID, actor role, target role, expected operation;
- exact returned Drive file IDs, SubmissionFile IDs, Submission IDs, Audit IDs and permission deltas;
- rollback attempts, results and unresolved resources;
- notification stub counters and restoration state;
- post-run reconciliation summary and terminal status.

Ordinary logs must show counts, Boolean flags, case IDs, sanitized reason codes and state only. Do not print raw IDs, emails, file content, Base64, Drive URLs or Script Property values.

### 6.4 Notification isolation

- Before the first action that could call notification hooks, Runner must replace the relevant notification function references in memory with deterministic test stubs.
- The stub must record expected call counts and sanitized event categories only; it must not write NotificationLogs or invoke LINE.
- The Runner must also guard against accidental calls to `UrlFetchApp.fetch` during the run. A test wrapper may throw a deterministic error and increment an in-memory counter; it must not make a network request.
- Save original function references before replacement.
- Restore originals in a guaranteed `finally` path and verify identity equality after restoration.
- If restoration cannot be verified, stop and report BLOCKED/STOPPED. Do not continue to another test case.
- Static review must identify all notification call paths reachable from the selected handlers; stubbing only one hook is insufficient if another path can call `ntSend_` directly.

### 6.5 Proposed case execution sequence

The final case set must be selected from the governing Test Plan and the owner's approved fixture/actor/target matrix. The following sequence is proposed:

**Batch A — upload validation**
- Positive: valid PDF, JPEG, PNG, approved OOXML and exact 4 MiB boundary, if approved.
- Negative: over-limit, MIME/signature mismatch, malformed/empty Base64 and unsupported MIME.
- For each negative case, verify no new Drive file, SubmissionFiles row or upload Audit event.
- For each positive case, capture exact Drive and metadata IDs immediately.

**Batch B — staged lifecycle**
- Verify staged file is not accessible through `file.access`.
- Attach only approved Individual and Group staged files through application handlers.
- Verify invalid owner, wrong Assignment and inactive/former membership are rejected without Submission mutation.
- Use unique, pre-approved Submission targets; do not replay or revise an existing target unless revision is explicitly approved.

**Batch C — ACL verification**
- Inspect Drive permission state before and after attachment.
- Verify authorized submitter, active group members and assigned instructors receive the expected Viewer access.
- Verify former members, unassigned instructors and unrelated actors are not newly granted access.
- Distinguish direct from inherited permissions. Any inherited access that invalidates a negative test makes that case BLOCKED.

**Batch D — failure and rollback**
- Run only separately approved failure injections.
- Each failure injection must identify the exact function boundary, expected partial state, expected compensation and read-only evidence needed.
- Failure-injection cases run last, after positive cases, and only in their designated folder/target.
- If rollback is incomplete or uncertain, stop the entire Runner.

**Batch E — terminal reconciliation**
- Run only after the Runner has stopped writing and notification stubs have been restored.
- Compare exact baseline and new IDs for relevant Sheets.
- Compare exact Drive inventory delta in all four child folders.
- Reconcile file-to-metadata-to-Submission-to-Audit relationships.
- Reconcile direct and inherited permissions.
- Verify no unexpected public/domain access, no unexplained orphan and no baseline loss.
- Report each case result independently; no aggregate label can conceal missing evidence.

### 6.6 Idempotency and replay protection

- Every case has a unique immutable case key and request ID.
- The manifest records `INTENT_RECORDED` before invoking a mutating handler.
- A case with an intent record but no confirmed terminal postcondition is unresolved; do not replay.
- A returned file or row ID must be recorded immediately. If this persistence fails, stop.
- Before any future continuation is considered, read-only reconciliation must prove the exact current state and the owner must approve a continuation design.
- Do not rely only on application IdempotencyKeys; Drive file creation occurs before some metadata/audit steps and can leave an orphan when later steps fail.

## 7. Read-only reconciliation utility

The reconciliation utility must be separate from Runner and must not mutate any state.

Required checks:

1. Compare all baseline primary IDs against current IDs for `SubmissionFiles`, `Submissions`, `Groups`, `GroupMembers` (only if the approved Group path is used), and `AuditLogs`.
2. Compare manifest-created IDs with current rows; identify missing, duplicate and untracked IDs.
3. Compare each child Drive folder's current file IDs against its pre-run inventory plus manifest-created IDs.
4. Verify each manifest Drive file maps to exactly one intended SubmissionFiles row.
5. Verify staged markers for files that were expected to remain staged; verify SubmissionID links for attached files.
6. Verify expected Audit action/entity pairs and exact entity IDs.
7. Verify group membership lock values before/after only for approved Group Submission cases.
8. Inspect effective permissions and compare expected direct permission deltas; inherited access must be reported separately.
9. Verify notification stub restoration and zero real external calls from captured counters/log evidence.
10. Return `PASS`, `FAIL`, `BLOCKED` or `NOT_RUN` for each check and a sanitized overall status.

Reconciliation must not trash or delete orphan files, remove permissions, repair metadata, or rewrite the manifest. It reports exact unresolved resources in the restricted manifest and sanitized references in ordinary logs.

## 8. Proposed execution sequence and approval gates

| Gate | Activity | Mutations allowed? | Required owner decision |
|---|---|---:|---|
| G0 | Approve this specification and exact scope | No | Approve/revise design |
| G1 | Implement Preflight only on `development` | No runtime mutation | Approve code scope |
| G2 | Owner copies Preflight into TEST GAS and runs it | No | Approve read-only execution |
| G3 | Review sanitized Preflight report and resolve blockers | No | Confirm READY |
| G4 | Implement Runner and Reconciliation on `development` | Code repository only | Approve implementation and exact persistent scope |
| G5 | Owner copies approved utilities into TEST GAS | No Drive mutation yet | Confirm GAS/source synchronization |
| G6 | Owner explicitly authorizes one persistent run | Yes, exact approved scope only | Approve run token, test window, fixture/actor/target matrix and file disposition |
| G7 | Owner executes Runner once | Yes, exact approved scope only | Supply complete sanitized logs |
| G8 | Read-only reconciliation and closeout review | No | Accept evidence and disposition |

Approval at one gate does not imply approval of later gates. In particular, approval of this specification does not authorize Runner implementation or execution.

## 9. Stop conditions

Stop immediately and preserve all evidence if any of the following occurs:

- environment or source mismatch;
- Drive folder ID/name/parent mismatch;
- folder is not private or effective ACL cannot be established;
- unexpected file appears in any test folder;
- actor email/role/assignment/group mapping differs from approval;
- manifest is missing, unreadable, or cannot persist state;
- a case creates an untracked file or row;
- a negative test creates any persistent record;
- permission grant/revocation result is uncertain;
- rollback fails or is only partially verified;
- notification stub cannot be installed/restored;
- any real LINE/UrlFetch/external call is detected or cannot be ruled out;
- concurrent TEST activity is detected;
- execution is interrupted or ends without a terminal manifest state.

After a stop, run only read-only diagnostics/reconciliation. Do not rerun Runner, delete files, revoke permissions, or repair rows without a separate exact-ID plan and explicit authorization.

## 10. Owner decisions still required

The screenshot establishes the intended Drive folder structure but does not establish its effective security or runtime readiness. Before G1/G4, owner review must resolve:

1. Confirm the folder ID and parent shown in Section 3 are correct.
2. Confirm whether the folder is in My Drive or a Shared Drive and identify the intended GAS execution account.
3. Provide/review evidence of folder ownership, general access Restricted, direct and inherited permissions, and whether any domain/group principals inherit access.
4. Confirm the TEST Script Property `SNC_SUBMISSION_FOLDER_ID` points to this folder. Do not send the raw value in chat; Preflight can compare it locally.
5. Confirm each child folder is dedicated to this WP and identify any existing files that are intentional baseline content.
6. Approve the exact synthetic fixture list and the method by which binary fixtures will be supplied to GAS.
7. Approve exact existing Individual/Group Assignment targets and synthetic actor role mapping, including distinct valid email identities.
8. Confirm the manifest storage location and its access restrictions.
9. Approve exact failure injection points and restoration proof.
10. Choose successful-file disposition: retain for owner review; cleanup requires a separate exact-ID plan and explicit approval.
11. Select an isolated test window and confirm no other TEST activity will conflict.
12. Decide whether the current upload behavior around missing uploader email requires a separately scoped source fix. Do not include an application fix implicitly in the Runner work.

## 11. Out of scope

- Production, `main`, deployment, API/LIFF/browser E2E and UAT.
- WP-SUB-3 and any unrelated modules.
- Migration, schema change, trigger installation/deletion, email, LINE, UrlFetch or external network.
- Real student/instructor data or personal documents.
- Broad regression or replay of WP-SUB-1/Assignment & Group runners.
- Automatic cleanup, folder clearing, permission repair or orphan deletion.
- Any application Source Code correction not separately approved.

## 12. Approval record

Owner decision for this specification:

- [ ] Approve specification v1.0.0 as written for design purposes.
- [ ] Request revisions (identify sections).
- [ ] Approve Preflight implementation on `development` as a separate scope.
- [ ] Approve Preflight read-only GAS execution as a separate scope.
- [ ] Runner implementation and persistent execution remain unapproved until separately authorized.

**Current status: DRAFT FOR OWNER REVIEW. No Preflight/Runner code has been implemented or executed.**
