# Submission Integration Test Plan v1.0 — DRAFT FOR OWNER REVIEW

- Project: SPORT NUTRITION CLASSROOM
- Date: 24 November 2026
- Branch: `development` only
- Status: **OWNER APPROVED — 24 November 2026; implementation proceeds through WP-SUB-0 readiness gate**
- Evidence basis: approved DOC-01 v1.0, approved DOC-02 v1.1 (including FR-CL-001..008 and BR-007..009), approved DOCS v1.3 / CR-001 amendment, current `development` source inspection, SNC-WG-001 v1.0.0, and the approved synthetic fixture plan v1.0.
- This plan does not treat pending DOC-03..DOC-08 drafts as approved requirements and does not authorize schema changes, migrations, setup, trigger installation, Drive operations, LINE calls, deployment, or data cleanup.

## 1. Purpose and test boundary

Verify the Submission Management flow for Individual and Group Assignments through the current backend business handlers, including first submission, revision, authorization, group membership lock, staged/attached file references, idempotency, audit records, and failure compensation.

The initial work package is **handler-level integration against the TEST Spreadsheet**. It is not Web App/API E2E, LIFF authentication E2E, Browser E2E, production readiness, or a full regression test. Those require separate gates and evidence.

No real student accounts or personal data may be used. Preserve the six existing synthetic Core Fixture Users, Enrollments, CourseOffering, baseline rows, and all AuditLogs. The 14 Assignment/Group/GroupMember cleanup targets are already absent and must not be recreated.

## 2. Source snapshot inspected

Current GitHub `development` blobs inspected for this plan:

| File | Blob SHA | Relevance |
|---|---|---|
| `backend/SubmissionManagement.gs` | `ef4b86678e8c1feeea425ba578501846129a229c` | Target validation, revision chain, idempotency, submission write/rollback, group lock, audit and notification hook |
| `backend/FileManagement.gs` | `86cd29160dd00207c9a575ce801da09e643911cb` | File upload staging, private Drive folder checks, file access, staged-file audit and cleanup |
| `backend/GroupManagement.gs` | `9dc280d88bcee8e346d028082cae725fe2d88ee8` | Active membership, representative, join/leave restrictions and MembershipLockedAt enforcement |
| `backend/AssignmentManagement.gs` | `460c7a0eb244fa5a85239d0e2f531404d58601d8` | Assignment status/type/member-limit rules; includes CLOSED edit guard |
| `backend/Code.gs` | `7c9928f7ae269287d1537dec6256dce13783d26d` | API action routing and LIFF identity verification |
| `backend/GradingManagement.gs` | `12bd34c5dd857250c7d6ccd76e28b5da7f4507f8` | Downstream consumer; grading/review actions are not in this test batch |
| `backend/NotificationManagement.gs` | `875b60d90f4599ee0f9bdf0f60dcea31e215de7b` | Outbound LINE implementation; submission notification must be stubbed |

Re-fetch all source files and confirm the TEST GAS project is synchronized before implementation. The SHA table is a design-time snapshot, not proof that GAS currently contains those exact blobs.

## 3. Observed handler contracts to test

### 3.1 Submission Management

- Actions currently routed: `submission.create`, `submission.revise`, `submission.list`, `submission.get`.
- Assignment must be OPEN at submission time. Due Date is used to calculate `SUBMITTED` versus `LATE`; it does not itself close the Assignment (CR-001).
- Individual submission requires active enrollment and uses the authenticated actor as StudentUserID; no group is required.
- Group submission requires an active group in the same Offering, active membership of the actor, designated LEADER role, minimum member count (default 2), and the Assignment-specific maximum when configured.
- Group submission records the actual submitter and timestamp, creates a revision chain, and sets that group's `MembershipLockedAt` on first successful submission.
- Revisions create a new Submission row with incremented RevisionNumber and PreviousSubmissionID; previous rows remain traceable.
- At most ten combined file IDs and Drive URLs are accepted. Drive URLs must be HTTPS under drive.google.com or docs.google.com.
- Request replay is keyed in the current implementation by actor + action + requestId. Same key/same payload should return the stored response; same key/different payload should return CONFLICT. A new requestId for an existing first submission should return DUPLICATE and direct the caller to revise.
- Submission write failure attempts compensating rollback of Submission, file links, URL rows, group lock and newly added file shares. Rollback failure is logged; the error response instructs the operator to verify state before retrying.

### 3.2 File Management

- `file.upload` validates MIME, file signature, 1–4 MB size, and a private folder configured by `SNC_SUBMISSION_FOLDER_ID`; it creates a Drive file and a staged SubmissionFiles row with a `STAGED:<userId>:<assignmentId>` marker.
- A Group member may upload/stage a file; submission itself requires the designated representative.
- Submission may attach a staged file created by the submitter or by an active member of the same group for the same Assignment.
- `file.access` must deny staged/unattached files and deny users outside the submission's authorized scope.
- Binary upload and Drive permission tests have real Drive side effects. They are separated into a gated Drive sub-work-package and are not to be run in the initial handler-only batch unless the owner separately approves its exact TEST folder/file scope.

### 3.3 Notification and audit side effects

- Submission creation/revision invokes `notifySubmissionReceived_` when defined. Its implementation can reach LINE Messaging API through `ntSend_`.
- Every test that creates a submission must replace `notifySubmissionReceived_` with a controlled in-memory stub and restore the original in `finally`. Record stub calls and verify restoration. Never rely on an absent token to prevent external delivery.
- Verify AuditLogs through exact IDs and expected action/entity pairs. Preserve all AuditLogs; do not delete audit evidence.
- NotificationLogs and outbound LINE delivery are not part of the initial batch. No real LINE push is permitted.

## 4. Work packages and gates

### WP-SUB-0 — Read-only source and environment readiness

1. Re-fetch the source snapshot in Section 2 and compare against the TEST GAS project through owner confirmation or a safe source-sync check.
2. Confirm exact TEST Script Properties and active Spreadsheet identity.
3. Read-only inspect required headers and primary keys for Assignments, Groups, GroupMembers, Submissions, SubmissionFiles, IdempotencyKeys and AuditLogs. Do not run setup or migration.
4. Confirm current Core Fixture manifest and all six synthetic Users, six Enrollments and CourseOffering remain valid.
5. Confirm the 14 deleted Assignment/Group/GroupMember IDs remain absent; do not recreate them.
6. Snapshot row counts and all primary IDs for affected tables, preserving the baseline outside the live spreadsheet.
7. Confirm no prior Submission Integration manifest exists. If one exists, stop and reconcile; do not overwrite it.
8. Confirm notification stub strategy and ensure no LINE/Drive calls are expected in WP-SUB-1.

**Gate:** all checks PASS; otherwise stop before any persistent fixture creation.

### WP-SUB-1 — Submission handler integration without binary Drive upload

Use the existing six synthetic Core Fixture Users/Offering/Enrollments only. Create the minimum new Group, GroupMember and Assignment fixtures through the supported application handlers. Do not write directly to Sheets.

Proposed fixture roles:
- Alpha: two active members, one LEADER and one MEMBER.
- Beta: three active members, one LEADER and two MEMBERs.
- Solo: one active member for the minimum-member negative case.
- One Individual Assignment.
- Group Assignments configured for maximum 3, maximum 2, and no configured maximum.
- Use unique reserved synthetic IDs/prefix and a persistent manifest. Capture each generated ID immediately after each successful write.

The exact actor-to-group allocation and whether the Solo member must leave before the no-group Individual case will be finalized against the live Core Fixture manifest during WP-SUB-0. No fixture IDs are pre-authorized by this draft.

#### Test cases

| ID | Scenario | Expected result | Mutations / evidence |
|---|---|---|---|
| SUB-01 | Individual Assignment by an enrolled student with no active group | Submission succeeds; type INDIVIDUAL; StudentUserID and SubmittedByUserID equal authenticated actor; GroupID blank | 1 Submission + idempotency record + AuditLog |
| SUB-02 | Individual submission by a student who belongs to a group | Succeeds independently of group membership/lock | 1 Submission + idempotency record + AuditLog |
| SUB-03 | Individual submission by non-enrolled actor | ENROLLMENT_REQUIRED; no Submission, file-link or lock mutation | No business rows |
| SUB-04 | Group Assignment with one active member | GROUP_MIN_MEMBERS_NOT_MET; no Submission; group remains unlocked | No business rows |
| SUB-05 | Group Assignment at minimum boundary (2 members) | Leader succeeds; member count validated | 1 Submission; that Group locked |
| SUB-06 | Group Assignment at configured maximum boundary (3 members, max 3) | Leader succeeds | 1 Submission; that Group locked |
| SUB-07 | Group Assignment exceeds configured maximum (3 members, max 2) | GROUP_MAX_MEMBERS_EXCEEDED; no Submission or lock | No business rows |
| SUB-08 | Group Assignment with blank maximum | No system-level maximum rejection for valid active group | Run before first successful submission of that Group |
| SUB-09 | Ordinary active Group member attempts submission | FORBIDDEN; no Submission or lock | No business rows |
| SUB-10 | Non-member or member of another Offering attempts Group submission | Membership/target rejection; no Submission or lock | No business rows |
| SUB-11 | Group A first submission then membership change attempt | Alpha membership operations return GROUP_MEMBERSHIP_LOCKED | No membership mutation |
| SUB-12 | Group A locked while Group B has not submitted | Group B join/leave/representative change remains permitted, subject to its own rules | Only explicitly tested Group B membership changes |
| SUB-13 | Individual submission after the student's Group is locked | Individual submission still succeeds | 1 Individual Submission |
| SUB-14 | Second submission.create with a new requestId for same target | DUPLICATE; no second first-submission row | No new Submission |
| SUB-15 | submission.revise for existing Individual target | New row; RevisionNumber increments; PreviousSubmissionID points to prior row; prior row unchanged | 1 new Submission + idempotency + AuditLog |
| SUB-16 | submission.revise for existing Group target by leader | New linked revision; Group remains locked | 1 new Submission + AuditLog |
| SUB-17 | Same actor/action/requestId and identical payload replay | Same stored result returned; no duplicate Submission or AuditLog | No additional business row |
| SUB-18 | Same actor/action/requestId with changed payload | CONFLICT; no mutation | No additional business row |
| SUB-19 | Submission after Deadline while Assignment remains OPEN | Submission accepted with status LATE | 1 Submission; due date does not close Assignment |
| SUB-20 | Submission while Assignment is CLOSED | ASSIGNMENT_CLOSED; no Submission, file-link or lock mutation | No business rows |
| SUB-21 | Attach valid HTTPS Drive/Docs URL | SubmissionFiles metadata is linked to the new Submission | 1 Submission + exact URL metadata row |
| SUB-22 | Invalid URL, unsupported host/protocol, or more than 10 total attachments | FILE_INVALID / VALIDATION_ERROR; no partial submission | No Submission/file metadata/lock mutation |
| SUB-23 | Submission audit event | SUBMISSION_CREATED for first submission; SUBMISSION_REVISED for revision; correct actor/entity/requestId | Exact AuditLog reconciliation |
| SUB-24 | Submission notification hook | Stub receives expected call(s), original hook restored, zero LINE/UrlFetch calls | Stub call ledger; no NotificationLog or push |
| SUB-25 | Injected failure at AuditLog append after submission writes | SUBMISSION_WRITE_FAILED; rollback restores Submission, URL/file links and Group lock to pre-state | Exact before/after snapshots; fail closed if rollback incomplete |
| SUB-26 | Post-case integrity reconciliation | All created IDs in manifest; no untracked Submission/SubmissionFile/Idempotency rows; all references valid | Read-only terminal reconciliation |

**Execution ordering:** negative validation cases first; idempotency and duplicate tests before any ambiguous retry; first successful Group submission only after the relevant Group boundary tests; lock-isolation cases immediately after Alpha's first submission; Individual-after-lock case next; revisions and URL attachments after initial records exist; injected rollback case last in an isolated disposable fixture path.

### WP-SUB-2 — Controlled Drive upload and file-access integration (separate approval)

Not included in WP-SUB-1 execution. Requires a separate exact-scope approval and preflight confirming:
- `SNC_SUBMISSION_FOLDER_ID` resolves to the dedicated private TEST folder and inherited sharing is not public.
- Pre-run folder file IDs are snapshotted; only files created by this test may be trashed during separately approved cleanup.
- Test file payloads are synthetic, non-sensitive and within the 4 MB limit.
- `file.upload` creates staged metadata and a private Drive file; malformed signature, unsupported MIME and oversize payload are rejected.
- A staged file created by the submitter or active member of the same Group/Assignment may be attached by the designated representative.
- Wrong Assignment, unrelated uploader, former/inactive member and non-member staged files are rejected.
- `file.access` permits only submitter/group members/assigned course staff after attachment; staged/unattached files and unrelated users are denied.
- Drive share rollback and file cleanup are tested only against exact files created by the run.
- No pre-existing Drive files/folders are changed.

### WP-SUB-3 — Deployed TEST API / LIFF / Browser E2E (future separate stage)

Do not claim this stage from direct handler calls. It requires current GAS deployment and Worker/API routing to be confirmed, deployed TEST URL/version, controlled synthetic LIFF identities/tokens, allowed request envelope and body-size limits, CORS/authentication checks, and a browser test. README currently warns that Worker deployment may lag source and that new database sheets have not been migrated. Do not deploy or migrate as part of this plan.

## 5. Required test harness controls

- TEST-only guard checks both `SNC_ITR_ENVIRONMENT=TEST` and exact active Spreadsheet ID.
- Reuse Core Fixture manifest; never create a fake SYSTEM_ADMIN or real student.
- Use unique synthetic run prefix and an extension manifest stored outside business tables. Do not expose raw IDs in reports.
- Persistent entry point requires an exact confirmation phrase and uses DocumentLock/ScriptLock appropriately.
- All application mutations must go through `handleGroupManagementAction_`, `handleAssignmentManagementAction_`, `handleFileManagementAction_` or `handleSubmissionManagementAction_`; no direct Sheet writes to create fixtures or bypass handlers.
- Capture generated primary IDs immediately after each operation. On any exception, stop dependent cases, save exact post-minus-pre ID deltas and do not auto-retry or auto-cleanup.
- Stub `notifySubmissionReceived_` before any Submission action and restore it in `finally`; verify identity restoration. Zero external calls are expected in WP-SUB-1.
- For the rollback case, inject a controlled failure by temporarily replacing only the audit append dependency in memory, restore it in `finally`, and verify all target tables and Group lock match the pre-call snapshot. If safe dependency replacement cannot be verified, mark SUB-25 BLOCKED rather than attempting an uncontrolled failure.
- Do not rely on requestId alone as proof of idempotency; verify the IdempotencyKeys row and exact returned response.
- Use one persistent write batch only after preflight and owner approval. Never rerun a completed/partially completed runner. Continuation must use verified per-case checkpoints.
- AuditLogs are retained as evidence and never included in cleanup.

## 6. Evidence and acceptance criteria

For every case record: case ID, source SHAs, TEST deployment/version where applicable, sanitized actor role, action, requestId (redacted or synthetic), sanitized payload, expected/actual API code, exact generated IDs in private manifest, before/after state, timestamp, audit delta, stub ledger, external-call expectation, status and evidence level.

Allowed statuses: PASS, FAIL, BLOCKED, NOT RUN, DEFERRED, REVIEW REQUIRED.

WP-SUB-1 is complete only when:
1. Every in-scope case has an execution result or a documented BLOCKED/DEFERRED rationale.
2. Individual and Group rules in DOC-02 are verified, including minimum/maximum, leader authorization, group-specific lock and Individual independence.
3. Revision chain and idempotency behavior are reconciled to persisted rows.
4. File URL metadata references are valid; binary Drive upload is either separately passed in WP-SUB-2 or explicitly marked deferred.
5. Submission and revision AuditLogs reconcile exactly; no untracked records exist.
6. Notification stub was restored and there were zero external LINE/UrlFetch calls.
7. Failure compensation is verified or explicitly BLOCKED with no retry.
8. Baseline rows, Core Fixture and all AuditLogs are preserved.
9. Cleanup is separately planned, exact-ID-only and separately authorized; no automatic cleanup is performed.

## 7. Known risks / source-level review points

- `smCreateRevision_` performs several writes across Submissions, SubmissionFiles, Groups and Drive permissions; rollback is compensating, not a true transaction. A rollback failure requires stop-and-reconcile, never automatic retry.
- Idempotency persistence occurs after the submission write. The injected failure case should explicitly assess the state when the business write succeeds but idempotency persistence fails; do not claim atomic idempotency without evidence.
- `file.upload` has Drive side effects and is not protected by the Submission handler's ScriptLock. Keep it in a separately gated work package.
- `file.access` is a backend authorization boundary and must be tested independently of Drive's inherited permissions.
- Direct handler tests do not verify `verifyLiffIdentity_`, Cloudflare Worker allowlists/body limits, deployed GAS version, CORS, or browser behavior.
- The current source contains group staged-file authorization unit tests, but those pure unit tests do not establish persisted file lifecycle or Drive permissions.
- The current source has no dedicated Submission Integration runner in the inspected test directory. No Submission integration runtime evidence is claimed.

## 8. Owner decisions requested

Please review and approve or amend these bounded decisions before implementation:

1. **WP-SUB-1 scope:** approve handler-level Submission Integration using the existing six synthetic Core Fixture users/offering/enrollments and new synthetic Group/Assignment fixtures only.
2. **Fixture creation:** approve the proposed Alpha (2), Beta (3), Solo (1) Groups and the Individual + Group Assignment set (max 3, max 2, no max), created only through existing business handlers. Exact IDs will be generated and recorded at runtime; no pre-existing rows are to be reused as test targets.
3. **WP-SUB-1 file scope:** approve Drive URL attachments and metadata only; defer binary upload/Drive permissions to WP-SUB-2.
4. **Failure injection:** approve a controlled in-memory audit-append failure test (SUB-25) with guaranteed restoration and exact rollback reconciliation; if restoration cannot be guaranteed, the case will be BLOCKED.
5. **External side effects:** approve mandatory in-memory stub of `notifySubmissionReceived_`; zero LINE pushes, UrlFetch, triggers, deployment and NotificationLog writes.
6. **Cleanup:** no cleanup is requested or authorized by this plan. Any cleanup requires a separate exact-ID preview and explicit execution authorization after test evidence is reconciled.

**Owner approval:** The project owner approved the plan on 24 November 2026, including all six decisions in Section 8: WP-SUB-1 handler-level scope; exact synthetic fixture topology; URL/metadata-only attachment scope for WP-SUB-1; controlled in-memory audit-append failure injection; mandatory notification stub with zero external calls; and separate approval for any cleanup. Approval authorizes implementation within these boundaries, not WP-SUB-2, WP-SUB-3, Drive uploads, deployment, migration, or cleanup. WP-SUB-0 read-only preflight must return READY before any persistent fixture creation.


## 9. Approval record and implementation checkpoint

- Owner approval: **APPROVED**, 24 November 2026.
- All six owner decisions in Section 8 are approved without amendment.
- WP-SUB-0 read-only preflight source: `backend/tests/SNC_SubmissionIntegrationPreflight_READONLY_TEST.gs`, version 1.0.0.
- Preflight verifies exact TEST identity, Core Fixture manifest, absence of prior Submission Integration manifest, required table headers, active offering/users/enrollments, existing SYSTEM_ADMIN role, required handler/hook functions, reserved-prefix collision, absence of existing Core Fixture submissions, and unique AuditLog IDs.
- Preflight reports expected GitHub source blob SHAs for owner comparison. It cannot independently read the GAS editor source; owner must confirm the inspected source files are synchronized before running it.
- Current stage: **WP-SUB-0 IMPLEMENTED IN SOURCE — OWNER-RUN READ-ONLY PREFLIGHT PENDING**. No persistent fixture or Submission handler has been run.


## 10. WP-SUB-0 owner runtime and WP-SUB-1 implementation checkpoint — 24 Nov 2026

- Owner confirmed that all five backend files in TEST GAS match the expected development blob SHAs listed in Section 2.
- Owner supplied the GAS Execution Log for SNC_SubmissionIntegrationPreflight_READONLY_TEST():
  - status=READY, 12 PASS / 0 BLOCKED.
  - Exact TEST identity, Core Fixture, absence of prior Submission Integration manifest, schemas, active Offering, six active Users and Enrollments, active SYSTEM_ADMIN, required handlers, reserved prefix, empty Core Fixture Submission baseline and unique AuditLog IDs all PASS.
  - Baseline counts: Users 24, Enrollments 6, Assignments 20, Groups 0, GroupMembers 0, Submissions 0, SubmissionFiles 0, IdempotencyKeys 0, AuditLogs 68.
  - Scope remained read-only; writesExpected=0 and externalCallsExpected=0.
- WP-SUB-0 is therefore OWNER-RUN RUNTIME READY — 12/12 PASS.
- Prepared backend/tests/SNC_SubmissionIntegrationRunner_TEST.gs v0.1.0 on development.
  - Latest blob SHA: a8e9864f88b18c368a689432535096c902dff583.
  - Includes SUB-01..SUB-26 case checkpoints, exact TEST guard, persistent manifest, immediate generated-ID capture, both notifyAssignmentOpened_ and notifySubmissionReceived_ in-memory hook stubs installed before any Assignment is opened and restored, controlled in-memory Audit append failure injection, and terminal reconciliation.
  - Uses only existing Core Fixture users/offering/enrollments and creates synthetic Groups/Assignments via application handlers.
  - Does not write directly to business sheets; does not call DriveApp, UrlFetchApp, triggers, LINE, deployment, migration or cleanup.
  - Exact persistent entry phrase: RUN SNC SUBMISSION INTEGRATION WP-SUB-1 2026-11-24.
  - Read-only runner preflight: SNC_SubmissionIntegrationRunnerPreflight_TEST().
  - Persistent runner: SNC_RunSubmissionIntegration_CONFIRMED_TEST('RUN SNC SUBMISSION INTEGRATION WP-SUB-1 2026-11-24').
  - Read-only manifest summary: SNC_SubmissionIntegrationManifestSummary_READONLY_TEST().
- Static source inspection confirms all 26 case IDs are present, safety guard and confirmation phrase are present, manifest checkpointing is present, both notification hook restorations are implemented before any Assignment open side effect, and no direct Sheet mutation, Drive/network call, broad delete, or cleanup function is present.
- Important evidence boundary: this is STATIC INSPECTION ONLY. The runner has not been copied into GAS and has not been executed. No WP-SUB-1 runtime result is claimed.
- Owner must sync the latest runner revision (blob SHA a8e9864f88b18c368a689432535096c902dff583) into the existing TEST GAS project, then run the read-only runner preflight again because the earlier READY log predates the dual-notification-stub safety fix. Share the complete sanitized log. If READY, execute the persistent runner exactly once using the phrase above. If it stops, returns anything other than a complete result, or execution is interrupted, do not rerun; share the full log and reconcile the manifest first.
- WP-SUB-2 Drive upload/access, WP-SUB-3 deployed API/LIFF/Browser E2E, and all cleanup remain outside this authorization.


### WP-SUB-1 additional safety correction — 24 Nov 2026
- Source review identified that opening an Assignment calls notifyAssignmentOpened_(), which can call ntSend_() and write NotificationLogs. Stubbing only notifySubmissionReceived_ was insufficient to guarantee zero LINE/external calls and no notification side effects.
- Updated the Runner to install in-memory stubs for both notifyAssignmentOpened_ and notifySubmissionReceived_ before creating/opening any Assignment. Both original function references are restored after the test and in the stop/error recovery path.
- SUB-24 now verifies six Assignment-open stub invocations, at least one Submission-received stub invocation, and restoration of both original hooks.
- Runner latest blob SHA: a8e9864f88b18c368a689432535096c902dff583.
- The earlier Runner Preflight READY log was generated before this source correction. It remains valid evidence for that earlier revision only. Owner must sync the latest runner and rerun SNC_SubmissionIntegrationRunnerPreflight_TEST() before any persistent execution.
- Persistent WP-SUB-1 execution remains NOT STARTED.
