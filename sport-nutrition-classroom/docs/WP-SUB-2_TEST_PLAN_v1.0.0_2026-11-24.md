# SPORT NUTRITION CLASSROOM — WP-SUB-2 Test Plan
## Drive Binary Upload, Staged File Lifecycle, Access Control and Recovery

- Document ID: SNC-WP-SUB-2-TP
- Version: 1.0.0
- Date: 24 November 2026
- Status: DRAFT FOR OWNER REVIEW — NOT APPROVED FOR IMPLEMENTATION
- Repository: `worrawutt-source/worrawutsportsci`
- Work branch: `development`
- Depends on: WP-SUB-1 formal closure
- Next stage: WP-SUB-3 remains separately gated

---

## 1. Purpose

This plan defines a controlled TEST-only verification of real Google Drive binary upload and access behavior for Submission Management. It covers file validation, creation in the configured private TEST folder, staged metadata, attachment to a Submission, authorization and Drive permissions, and recovery from selected failures.

This document is a test design only. It does not authorize implementation, GAS execution, Drive folder creation, file upload, permission changes, cleanup, deployment, or changes to production.

## 2. Verified baseline and evidence boundary

WP-SUB-1 is formally closed at handler-level integration and read-only reconciliation scope. Owner-provided runtime evidence recorded 26/26 cases PASS and a separate read-only reconciliation of 10/10 checks PASS. WP-SUB-1 did not test binary upload or real Drive permissions.

The following source files were re-fetched from GitHub `development` for this plan:

| Source | Blob SHA |
|---|---|
| `backend/FileManagement.gs` | `86cd29160dd00207c9a575ce801da09e643911cb` |
| `backend/SubmissionManagement.gs` | `ef4b86678e8c1feeea425ba578501846129a229c` |
| `backend/NotificationManagement.gs` | `875b60d90f4599ee0f9bdf0f60dcea31e215de7b` |

These SHAs identify the source inspected when this plan was drafted. They are not permission to use stale files. Before implementation, re-fetch the current `development` HEAD and all relevant files, compare behavior, and revise this plan if the source has changed.

### 2.1 Source behavior observed

- `FileManagement.gs` allows PDF, legacy Word/PowerPoint/Excel, OOXML Word/PowerPoint/Excel, plain text, JPEG and PNG.
- The application limit is 4 MiB (`4 * 1024 * 1024` bytes). It checks the Base64 payload length, decoded byte count, declared MIME type, filename extension for applicable formats, and file signatures. OOXML content is unzipped and checked for expected internal paths; expanded entries are limited to 20 MiB.
- Upload requires Script Property `SNC_SUBMISSION_FOLDER_ID`. The handler checks that the target folder's sharing access is `PRIVATE`, creates a Drive file, and attempts to add the uploader as a Viewer.
- A successful upload appends a `SubmissionFiles` row whose `SubmissionID` is a staged marker: `STAGED:<userId>:<assignmentId>`; it then appends `SUBMISSION_FILE_UPLOADED` to AuditLogs.
- If metadata append fails, the handler attempts to trash the created Drive file. If Audit append fails, it attempts to delete the metadata row and trash the Drive file.
- `file.access` rejects missing or staged metadata, checks application-level Submission access, then returns the Drive URL and file metadata.
- During Submission creation/revision, `SubmissionManagement.gs` checks that each staged file belongs to the submitter or an active member of the same group for the same Assignment. It attempts to add Viewer access for the submitter, active group members, and active Course Instructors before linking the file to the Submission.
- Submission rollback attempts to restore staged metadata, remove created URL rows, remove the newly created Submission, restore the group lock and revoke newly added Viewer permissions. Rollback is compensating behavior, not an atomic transaction.
- `NotificationManagement.gs` contains LINE/UrlFetch notification behavior. WP-SUB-2 must prevent all notification paths from reaching LINE or any external network.

### 2.2 Important verification limitations

Static source inspection is not runtime proof. In particular:
- A folder-level `PRIVATE` check does not by itself prove the effective ACL of every created file or prove that a direct Drive URL is inaccessible to unauthorized accounts.
- The upload path attempts to add the uploader as Viewer only when a matching user record with an email is found; the current source does not explicitly fail when no matching user/email is found. This behavior must be verified and treated as a potential issue, not silently assumed safe.
- Rollback catches some secondary failures and logs generic markers. A test must reconcile actual Drive state and sheet metadata after any injected failure.
- Google Drive ownership, inherited permissions, shared-drive behavior and account-level restrictions may affect observed access. The exact TEST folder and account configuration are therefore mandatory preconditions.

## 3. Objectives

1. Verify that accepted file formats upload to the configured private TEST folder and produce correct staged metadata.
2. Verify that invalid, malformed, oversized or mismatched files are rejected before a Drive file is created.
3. Verify the staged-file lifecycle from upload through Submission attachment.
4. Verify application authorization and effective Drive access for uploader, active group members, assigned instructors, former group members and unrelated users.
5. Verify selected failure and rollback paths without replaying persistent test operations.
6. Reconcile all test-created Drive files, SubmissionFiles rows, Submission rows, group lock changes and AuditLogs using exact synthetic identifiers in a restricted manifest while keeping ordinary logs free of raw IDs.
7. Preserve all WP-SUB-1 baseline records and evidence.

## 4. Scope

### 4.1 Included

- TEST environment only.
- Real binary files in one explicitly designated private TEST Drive folder, after folder identity and permission review.
- The existing approved TEST application handlers for `file.upload`, `file.access`, `submission.create` and, if approved, `submission.revise`.
- Synthetic test accounts already present in the approved Core Fixture, subject to a fresh read-only preflight.
- Individual Assignment and Group Assignment paths, including staged file ownership by an active group member.
- Effective Drive permissions checked by account-level access tests.
- Controlled, explicitly approved failure injection and read-only reconciliation.

### 4.2 Excluded

- Production or `main` branch.
- WP-SUB-3 deployed API, LIFF, browser E2E, or UAT.
- LINE messaging, `UrlFetchApp`, external network calls, email delivery, or NotificationLogs writes.
- Trigger creation/deletion or execution, migration, schema changes, deployment, broad regression, or cleanup.
- Changes to authentication, password hashing, GPS, or unrelated modules.
- Direct manual edits to Sheets to simulate business-handler outcomes.
- Any real student, instructor, or personal data.
- Re-running WP-SUB-1 or any earlier persistent runner.

## 5. Required owner decisions and environment inputs

The following are hard blockers. They must be completed in the approval record before a Runner is implemented or any Drive mutation is attempted.

| Required input | Required owner decision/evidence |
|---|---|
| TEST Drive folder | Exact folder name and Drive folder ID; confirm it is dedicated to this test and contains no unrelated files |
| Folder ownership/location | My Drive or Shared Drive; owning account; parent folder and inherited sharing context |
| Effective folder access | Evidence that general access is Restricted/Private and no unintended group/domain access is inherited |
| TEST Script Property | Confirm `SNC_SUBMISSION_FOLDER_ID` points to the approved folder; do not print its value in ordinary logs |
| Execution identity | Confirm which Google account executes GAS and whether it is the Drive file owner |
| Synthetic users | Map existing Core Fixture roles to uploader/student, active group leader, active group member, former member, assigned instructor and unrelated enrolled/non-enrolled actor; use existing fixture accounts only |
| Email identity | Confirm each selected synthetic User has a valid, distinct test email and the owner authorizes temporary Viewer grants to those addresses |
| Assignment/group fixture | Identify existing eligible Individual and Group Assignments and active group membership from read-only evidence; do not create replacement fixtures without separate approval |
| File disposition | Select one: owner-reviewed manual retention after testing, or a separately approved exact-ID cleanup procedure. No automatic deletion/trashing is authorized by this plan |
| Failure injection | Approve exact in-memory stubs/wrappers and the specific failure points; no production helper may be replaced without guaranteed restoration |
| Test window | Owner-selected period when no other TEST execution or user activity can conflict with the test folder or fixture |

If any item is unknown, contradictory or cannot be verified read-only, stop before implementation.

## 6. Synthetic test file set

Use synthetic, non-confidential files created solely for this test. Each file must have a known byte count, expected MIME type, filename extension and signature. Do not use real documents.

Proposed file fixture set:

| Fixture | Purpose | Format/size requirement |
|---|---|---|
| F01 | Valid PDF upload | Minimal structurally valid PDF; greater than 0 bytes and below 4 MiB |
| F02 | Valid JPEG upload | Minimal valid JPEG; below 4 MiB |
| F03 | Valid PNG upload | Minimal valid PNG; below 4 MiB |
| F04 | Valid OOXML upload | Minimal valid DOCX or PPTX with required internal package paths; below 4 MiB |
| F05 | Boundary-size upload | Valid supported file of exactly 4,194,304 bytes; signature remains valid |
| F06 | Oversize upload | Valid-looking supported file of 4,194,305 bytes |
| F07 | MIME/signature mismatch | Valid file bytes declared as a different allowed MIME type |
| F08 | Invalid payload | Malformed Base64 or a decoded empty payload |
| F09 | Unsupported format | Synthetic executable/archive or other unsupported MIME; no Drive creation expected |

F01–F05 are proposed positive fixtures. F06–F09 are negative fixtures. The final manifest must record filename, SHA-256 digest, byte count, MIME type, extension and expected outcome. Do not put Base64 payloads or file contents in logs or GitHub.

If the owner does not approve exact-boundary upload size or a particular file format, omit that case and record it as NOT RUN; do not substitute an unapproved fixture.

## 7. Test actors and authorization matrix

Use only existing synthetic Core Fixture users. The owner must map actual fixture users to these roles in a private test manifest; this plan does not invent account IDs or email addresses.

| Actor | Expected application access | Expected Drive access after successful attachment |
|---|---|---|
| Uploader / individual submitter | May upload own file; may access attached Submission | Viewer |
| Group leader / submitter | May attach eligible staged file and submit group work | Viewer |
| Active group member who uploaded staged file | May stage a file for the same Assignment; may not submit if not designated representative | Viewer after attachment |
| Other active group member | May view group Submission | Viewer |
| Former/inactive group member | Must not gain application access through current membership | No newly granted Viewer permission |
| Assigned active instructor | May view Submission for assigned Offering | Viewer |
| Instructor not assigned to the Offering | No application access unless another explicit role grants it | No newly granted Viewer permission |
| Unrelated user | No application access | No Viewer permission; direct URL must be denied |
| System/Drive owner account | Administrative access may exist due to ownership | Record separately; do not treat owner access as proof of student authorization |

A user with inherited access from a parent folder or domain policy cannot be used as a clean negative-access actor. If that condition cannot be eliminated or isolated, mark the relevant ACL test BLOCKED.

## 8. Test cases and expected outcomes

The Runner should implement the following case IDs only after this plan and mutation scope are approved. The table is a design, not evidence that any test has run.

### 8.1 Preflight and folder safety

| ID | Test | Expected result |
|---|---|---|
| S2-PRE-01 | Verify TEST environment and branch/source manifest | Exact TEST identity; expected source revisions confirmed |
| S2-PRE-02 | Verify configured folder exists and is accessible | Folder found; no folder ID emitted in ordinary logs |
| S2-PRE-03 | Verify folder sharing access | `PRIVATE`; otherwise BLOCK and no upload |
| S2-PRE-04 | Verify no unexpected files in dedicated test folder | Empty or matches owner-approved pre-test inventory exactly |
| S2-PRE-05 | Verify fixture actors, emails, Assignments and memberships | All required roles and relationships exist and are eligible |
| S2-PRE-06 | Capture read-only baselines | Exact baseline IDs/counts for relevant Sheets and exact Drive folder inventory; no mutation |

### 8.2 Upload validation and staged metadata

| ID | Test | Expected result |
|---|---|---|
| S2-UP-01 | Upload F01 valid PDF | Success; one Drive file, one staged SubmissionFiles row and one upload Audit event |
| S2-UP-02 | Upload F02 valid JPEG | Same expected relationship and correct MIME/size metadata |
| S2-UP-03 | Upload F03 valid PNG | Same expected relationship and correct MIME/size metadata |
| S2-UP-04 | Upload F04 valid OOXML | Accepted only when extension, ZIP signature and required internal paths match |
| S2-UP-05 | Upload F05 exactly 4 MiB | Accepted if all other validation passes |
| S2-UP-06 | Upload F06 over 4 MiB | `FILE_INVALID`; no Drive file, metadata row or upload Audit event |
| S2-UP-07 | Upload F07 MIME/signature mismatch | `FILE_INVALID`; no Drive file or metadata |
| S2-UP-08 | Upload F08 malformed/empty payload | `FILE_INVALID`; no Drive file or metadata |
| S2-UP-09 | Upload F09 unsupported MIME | `FILE_INVALID`; no Drive file or metadata |
| S2-UP-10 | Upload with missing/invalid folder configuration | `CONFIGURATION_ERROR`; no Drive file or metadata |
| S2-UP-11 | Point configuration to a non-private test folder in an isolated preflight check | Upload must be blocked before file creation; restore approved configuration only through owner-controlled procedure |
| S2-UP-12 | Verify staged metadata | Staged marker, uploader, Assignment, file ID, URL, MIME, size and timestamp are consistent with the exact Drive file |

Do not change the real Script Property during a test merely to force S2-UP-10 or S2-UP-11. Prefer an in-memory configuration stub or a separate isolated TEST configuration, with explicit owner approval and restoration verification. If safe isolation is unavailable, mark the case BLOCKED.

### 8.3 Staged lifecycle and Submission attachment

| ID | Test | Expected result |
|---|---|---|
| S2-LC-01 | Attempt `file.access` on a staged file | `NOT_FOUND`; no Drive URL disclosed |
| S2-LC-02 | Attach own staged file to eligible Individual Submission | Submission created; staged row linked to Submission; revision 1 |
| S2-LC-03 | Attach active group member's staged file through authorized group leader | Accepted for same Assignment and active group |
| S2-LC-04 | Attempt to attach a non-member's staged file | `FILE_INVALID`; no Submission mutation |
| S2-LC-05 | Attempt to attach a former member's staged file | `FILE_INVALID`; no Submission mutation |
| S2-LC-06 | Attempt to attach staged file for another Assignment | `FILE_INVALID`; no Submission mutation |
| S2-LC-07 | Attempt to attach more than ten files/URLs | `VALIDATION_ERROR`; no Submission mutation |
| S2-LC-08 | Access attached file as authorized submitter | Application access allowed and Drive URL resolves to the expected file |
| S2-LC-09 | Access attached file as unauthorized actor | `FORBIDDEN` from application handler and direct Drive access denied |

Avoid reusing the same Submission target across cases if doing so would cause duplicate or revision semantics. Each positive lifecycle case needs a unique, pre-approved synthetic target or a separately approved revision case.

### 8.4 Drive ACL and role verification

| ID | Test | Expected result |
|---|---|---|
| S2-ACL-01 | Inspect effective permissions after upload, before attachment | Only the expected owner/uploader access is present; no public/domain access |
| S2-ACL-02 | Inspect permissions after Individual Submission attachment | Submitter and assigned active instructor are Viewers; no unrelated actor added |
| S2-ACL-03 | Inspect permissions after Group Submission attachment | Submitter, active group members and assigned instructors are Viewers |
| S2-ACL-04 | Verify former member access | Former member is not newly added; direct access denied unless unrelated inherited access exists (then BLOCKED) |
| S2-ACL-05 | Verify unassigned instructor and unrelated user | Not added as Viewer; direct access denied |
| S2-ACL-06 | Verify no link-sharing/public permission | No `ANYONE` or unintended domain permission |
| S2-ACL-07 | Verify `file.access` authorization for each role | Result matches application authorization matrix |
| S2-ACL-08 | Verify file identity | Drive file ID and metadata row refer to the same file; content digest matches uploaded fixture |

Drive permission inspection must distinguish direct permissions from inherited permissions. Record role, permission type and principal category; do not expose personal email addresses in ordinary logs.

### 8.5 Failure, rollback and orphan-file recovery

Failure tests must use controlled in-memory injection points or a dedicated isolated TEST wrapper. No arbitrary edits to production handlers and no manual Sheet mutation are permitted.

| ID | Failure point | Expected result and required reconciliation |
|---|---|---|
| S2-FR-01 | Simulate SubmissionFiles metadata append failure after Drive file creation | Handler returns storage failure; file is trashed when possible; no staged metadata remains; if file remains, stop and record exact orphan |
| S2-FR-02 | Simulate upload Audit append failure after metadata append | Handler returns storage failure; metadata row removal and file trash are attempted; reconcile both independently |
| S2-FR-03 | Simulate uploader Viewer grant failure | Upload fails; created Drive file is trashed when possible; no metadata/Audit success record |
| S2-FR-04 | Simulate failure while sharing with one authorized actor during Submission attachment | Previously added Viewer grants are revoked when possible; no Submission link, group lock or staged metadata mutation remains |
| S2-FR-05 | Simulate a later Submission write failure after successful file sharing | Submission rollback attempts to restore staged row, group lock and permissions; reconcile all resources independently |
| S2-FR-06 | Simulate rollback failure in a controlled wrapper | Runner must stop immediately, report `STOPPED_REQUIRES_RECONCILIATION`, preserve evidence and prohibit retry |
| S2-FR-07 | Verify failure recovery does not call LINE or external services | Stub counters show zero real external calls; original notification functions restored |

Do not induce a failure by deliberately revoking a real user's access, changing unrelated folder permissions, or deleting existing records. Do not simulate a rollback failure unless the exact injected operation and recovery path have been reviewed and separately approved.

### 8.6 Final reconciliation

| ID | Check | Expected result |
|---|---|---|
| S2-REC-01 | Baseline Sheet primary IDs retained | No baseline ID missing |
| S2-REC-02 | Exact new SubmissionFiles IDs | Every created row matches manifest; no unexplained extra row |
| S2-REC-03 | Exact Drive folder inventory delta | Every new file maps to one manifest entry; no unexplained file |
| S2-REC-04 | Submission relationships | Each attached file references the intended Submission |
| S2-REC-05 | Audit event relationships | Upload and Submission events match expected actor/entity pairs |
| S2-REC-06 | Permission reconciliation | Effective direct permissions match approved role matrix; no unexpected public/domain grant |
| S2-REC-07 | Failure-case recovery | Every failed case has expected no-write state or an explicitly recorded unresolved orphan/partial state |
| S2-REC-08 | Notification isolation | Real LINE/UrlFetch calls = 0; stubs restored |
| S2-REC-09 | Baseline preservation | No unexpected mutation to WP-SUB-1 rows or unrelated TEST data |
| S2-REC-10 | Manifest terminal state | `COMPLETE` only if all required cases and reconciliation pass; otherwise explicit BLOCKED/STOPPED state |

## 9. Execution and safety protocol

### Phase A — Read-only preparation

1. Re-fetch latest `development` HEAD, `CURRENT.md`, and all relevant backend/test files.
2. Confirm the WP-SUB-1 closure record and preserve its TEST records.
3. Inspect the configured TEST folder identity, folder inventory and effective sharing without creating or changing anything.
4. Confirm synthetic actor mappings, Assignment/group eligibility and email readiness from read-only data.
5. Capture exact pre-test baselines and source hashes.
6. Produce a preflight report with no writes, no Drive file creation, no permission changes and no external calls.

Any mismatch or unknown configuration blocks the phase.

### Phase B — Runner implementation (requires separate approval)

Only after the owner approves this plan, exact folder, actors, file manifest, failure injection points and file disposition:

1. Add a dedicated WP-SUB-2 Runner and read-only reconciliation utility on `development`.
2. Use application handlers for business operations; do not bypass handlers with direct Sheet mutation.
3. Install in-memory notification stubs before any action that could invoke notification hooks; restore all original function references in `finally` and error recovery.
4. Do not install triggers or invoke LINE/UrlFetch.
5. Capture each created Drive file ID and each created row ID immediately in a restricted persistent manifest. Ordinary logs must report counts/booleans only.
6. Use unique request IDs and unique targets. Never replay a completed case.
7. Include a zero-argument GAS Editor entry point where needed; preflight and persistent runner must be separate functions.
8. Stop on any unexpected write, failed rollback, untracked file, permission mismatch, manifest persistence failure or execution interruption.

### Phase C — Owner-run preflight

The owner copies only the approved preflight file(s) to the TEST GAS project and runs the read-only preflight. The owner shares the complete sanitized Execution Log.

The persistent Runner is not authorized merely because the preflight file exists. It may be run only after the owner reviews a READY result and gives separate explicit authorization for the exact persistent run.

### Phase D — One-time persistent execution

1. Run the approved persistent Runner once only.
2. If execution is interrupted, status is not terminal, or any failure occurs, do not rerun.
3. Run only the approved read-only manifest summary and reconciliation tools.
4. Reconcile exact Drive IDs, metadata IDs, Submission IDs, Audit IDs and permission state before deciding any next action.
5. If rollback is incomplete, mark the work STOPPED and await owner direction.

### Phase E — Closeout

WP-SUB-2 may be closed only when:
- all required positive and negative cases have an owner-supplied runtime result;
- all exact-ID and Drive inventory reconciliations pass;
- effective permissions match the role matrix;
- no unexplained orphan file, metadata row, Submission, Audit event or permission remains;
- all notification stubs are restored and real external calls are zero;
- baseline records remain intact; and
- the owner accepts the evidence limitations and final disposition of test files.

A generic runner terminal label is not sufficient without the detailed case manifest and independent reconciliation.

## 10. Manifest and logging requirements

The restricted persistent manifest should contain:
- plan version and approved scope hash;
- TEST environment marker and source blob SHAs;
- pre-test counts and exact baseline IDs for relevant tables;
- approved Drive folder reference (stored privately; never printed in ordinary logs);
- synthetic actor role mapping;
- file fixture names, SHA-256 digests, MIME types and byte counts;
- each test case status and request ID;
- exact created Drive file IDs, SubmissionFile IDs, Submission IDs, Audit IDs and relevant permission deltas;
- rollback attempts and their outcomes;
- notification stub call counts and restoration state;
- post-run reconciliation results and terminal status.

Ordinary logs must not expose raw synthetic IDs, personal emails, Base64 content, access tokens, folder IDs, Drive URLs or personal data. Use counts, Boolean flags, role labels and redacted error codes.

Manifest writes must be designed so that a failed case cannot leave an ambiguous `IN_PROGRESS` state without an explicit stop/reconciliation marker. If the manifest cannot be safely persisted, stop; do not replay the Runner.

## 11. File retention and cleanup boundary

This plan does not authorize cleanup.

Before implementation, the owner must choose and approve the disposition of every test-created file:
- retain in the dedicated TEST folder for manual owner review; or
- create a separate exact-ID cleanup plan and approve it after successful reconciliation.

No automatic deletion, trashing of successful test files, broad folder clearing, or reuse of earlier WP-SUB-1 cleanup targets is permitted. Failure-path rollback behavior inside the application is distinct from post-test cleanup authorization. If rollback leaves an orphan, preserve it and its evidence until the owner approves a specific recovery action.

## 12. Risks and design observations requiring review

1. **Effective Drive ACL risk:** private folder setting is necessary but insufficient evidence of file-level access. Direct Drive permission checks are mandatory.
2. **Uploader email handling:** current upload source does not explicitly reject a missing User/email record before proceeding to the metadata write. Confirm the actual behavior and decide whether a narrowly scoped source correction is needed; do not change it under this test-plan approval.
3. **Permission rollback risk:** permission revocation errors are caught and logged; a failed rollback may leave access behind. The Runner must treat any rollback uncertainty as STOPPED, not PASS.
4. **Non-atomic multi-resource writes:** Drive, Sheets and ACL changes are not one atomic transaction. Exact resource-by-resource reconciliation is required.
5. **Folder inheritance:** a folder may appear private while inherited or shared-drive access still grants principals access. Validate the effective permission model and test accounts.
6. **Owner/executor identity:** the Apps Script execution identity and Drive file ownership can affect permission outcomes. Record this explicitly.
7. **Concurrent activity:** another TEST user or trigger may change rows or permissions during the test. Require an isolated test window and read-only preflight.
8. **Notification side effects:** Submission creation can invoke notification code. Stubs must be active before the first action and restoration verified.

## 13. Approval checklist

The owner should approve or return each item explicitly.

- [ ] Approve this Test Plan version 1.0.0 as the WP-SUB-2 test design.
- [ ] Approve the exact TEST Drive folder and its private/effective permission evidence.
- [ ] Approve the synthetic actor mapping and test email accounts.
- [ ] Approve the exact file fixture set and size-boundary cases.
- [ ] Approve the exact Individual and Group Assignment targets.
- [ ] Approve the failure injection points and restoration safeguards.
- [ ] Approve the exact Drive operations and permission changes during testing.
- [ ] Decide the post-test file disposition; cleanup remains separately gated.
- [ ] Approve development of the WP-SUB-2 Preflight/Runner and read-only reconciliation utilities.

Approval of this plan alone must not be interpreted as authorization to run the persistent Runner, upload files, change permissions, clean up files, deploy, or perform any excluded operation.

## 14. Current decision

**WP-SUB-2 status: TEST PLAN DRAFTED — OWNER REVIEW REQUIRED.**

No WP-SUB-2 code, Runner, Preflight, GAS execution, Drive upload, permission change, file creation, migration, trigger, deployment, LINE call, external network call or cleanup has been performed under this document.
