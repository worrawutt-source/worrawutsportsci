# SPORT NUTRITION CLASSROOM — Source Reconciliation Decision

- Date: 22 November 2026 (Asia/Bangkok)
- Repository: `worrawutt-source/worrawutsportsci`
- Working branch: `development` only
- Verified branch HEAD at preparation: `f4cc4c0c93fc9521ca3f6263e22ded3e68e2de32`
- Baseline: DOCS v1.3 and SNC-WG-001 v1.0.0
- GAS comparison snapshot: `SNC_GAS_BACKUP_2026-11-22(2).zip`
- Decision status: **PROVISIONAL — no backend file is approved for direct replacement in GAS yet**

## 1. Executive decision

1. GitHub `development` is the canonical, reviewable source repository for application code and technical documentation.
2. GAS is the execution/runtime environment. It receives only an explicitly approved, versioned set of files from GitHub after semantic review and TEST validation.
3. Neither the archive nor GitHub should be bulk-copied over the other. The 13 backend file hashes differ, but hash mismatch is not proof that either version is behaviorally correct.
4. No GAS source replacement is authorized by this decision. The exact GAS replacement list is therefore currently **NONE**. This is intentional risk control, not a claim that the GAS code is correct.
5. The integration test runner requires a targeted reconciliation. Do not replace the GAS runner wholesale with GitHub v1.0.1 until the existing environment guard and INT-01 read-only behavior have been preserved or demonstrably superseded.

## 2. Source authority and synchronization model

| Artifact / concern | Canonical authority | Runtime location | Synchronization decision |
|---|---|---|---|
| Business requirements and approved behavior | DOCS v1.3 | Not runtime code | GitHub documentation is the review baseline; changes require owner approval |
| Backend business logic | GitHub `development` | GAS .gs files | One-way controlled release GitHub → GAS TEST after semantic review |
| API dispatcher and response contract | GitHub `development` plus DOC-08 | GAS `Code.gs` | Reconcile route-by-route; no blind replacement |
| Database schema definition | DOC-05 and approved schema baseline | GAS `setup.gs` / `SNC_SETUP.TABLES` | Treat as high risk; no schema changes without explicit approval |
| Permission model | DOC-06 and approved requirements | GAS authorization functions | Reconcile role × action × ownership checks; no permission broadening by inference |
| TEST-only helpers and runner | GitHub `development` test sources | GAS TEST project only | Controlled copy after static and GAS runtime validation |
| Manifest / runtime settings | Versioned manifest in GitHub | Apps Script project settings | Compare explicitly; deployment settings are not changed by source-file sync alone |
| Credentials, tokens, IDs, peppers | Secret store / GAS Script Properties / Worker environment | Runtime properties | Never commit values to GitHub; synchronize names and configuration contract only |
| Spreadsheet data | TEST spreadsheet is the designated test data store | Google Sheets | Never synchronize data through source control |
| Deployment and endpoint mapping | Deployment record and environment configuration | GAS deployment / Worker | Manual, separately verified release step; never inferred from source code |

**Direction:** GitHub → GAS TEST is the only approved source-release direction. GAS → GitHub is an evidence/backup intake only and must be reviewed as a change proposal, not automatically treated as canonical. Production deployment remains out of scope.

## 3. Backend file disposition

The following files are known to differ by normalized Git blob hash between the supplied GAS snapshot and GitHub at the reviewed HEAD. Because a complete function-by-function semantic diff has not yet been evidenced, every disposition below is HOLD — DO NOT REPLACE IN GAS.

| GAS file | GitHub source | Risk focus for semantic reconciliation | Current decision | GAS replacement |
|---|---|---|---|---|
| `Code.gs` | `backend/Code.gs` | API routes, authentication/token guard, request validation, response/error contract, account linking, audit logging | HOLD — highest priority | NONE |
| `setup.gs` | `backend/setup.gs` | `SNC_SETUP.TABLES`, headers, schema version, setup side effects, migration/import behavior | HOLD — schema-critical | NONE |
| `AssignmentManagement.gs` | `backend/AssignmentManagement.gs` | assignment visibility, scheduling, due-state transitions, submission constraints, owner/teacher authorization | HOLD | NONE |
| `AuditManagement.gs` | `backend/AuditManagement.gs` | audit event coverage, actor identity, sensitive-field redaction, append-only behavior | HOLD | NONE |
| `CourseManagement.gs` | `backend/CourseManagement.gs` | course offering lifecycle, instructor/coordinator authorization, enrollment dependencies | HOLD | NONE |
| `EnrollmentManagement.gs` | `backend/EnrollmentManagement.gs` | import validation, duplicate handling, rollback/recovery, student/course association | HOLD — data integrity | NONE |
| `FileManagement.gs` | `backend/FileManagement.gs` | file ownership, access checks, sharing, URL validation, rollback/deletion | HOLD — privacy/security | NONE |
| `GradingManagement.gs` | `backend/GradingManagement.gs` | grader authority, grade/review transitions, visibility, grade mutation rules | HOLD — high impact | NONE |
| `GroupManagement.gs` | `backend/GroupManagement.gs` | group formation, assignment-scoped membership, maximum members, lock-on-first-submission rule | HOLD — requirement-critical | NONE |
| `NotificationManagement.gs` | `backend/NotificationManagement.gs` | recipient authorization, notification payload privacy, LINE/email side effects, retry behavior | HOLD — external side effects | NONE |
| `StudentPortalManagement.gs` | `backend/StudentPortalManagement.gs` | student identity scoping, read permissions, exposed fields, portal API contract | HOLD — privacy/security | NONE |
| `SubmissionManagement.gs` | `backend/SubmissionManagement.gs` | individual/group submission rules, membership checks, staged files, revisions, idempotency | HOLD — requirement-critical | NONE |
| `UserRoleManagement.gs` | `backend/UserRoleManagement.gs` | role assignment, administrator protection, authorization boundaries, privilege escalation | HOLD — security-critical | NONE |

A HOLD disposition does not mean the file should remain permanently on the GAS version. It means that the exact change set and its impact must be reviewed before a replacement instruction is issued.

## 4. Required semantic reconciliation checklist

For each backend file, compare the GAS snapshot with GitHub `development` at function level. Record the function name, behavior in each source, requirement/document reference, API route/action affected, permission check, database tables/columns touched, external side effects, security/privacy implications, decision, and test evidence.

Minimum domain checks:

- **Business Logic:** individual assignment versus group assignment; group size per assignment; membership lock after first submission; submission/revision/idempotency; grading and review state transitions; assignment schedule behavior.
- **API:** route/action names, HTTP method handling, required fields, authentication/token requirements, response envelope, error codes, backward compatibility, and client/Worker callers.
- **Permission:** role × action matrix against DOC-06; course offering scope; student ownership; group membership; teacher/coordinator/admin boundaries; direct API calls that bypass UI restrictions.
- **Database:** table names, headers/order, keys, uniqueness assumptions, migration version, read/write/delete operations, rollback behavior, and compatibility with the inspected schema version 1.5.0.
- **Security:** authentication bypass, IDOR/object ownership, privilege escalation, input validation, HTML/script injection, file URL and sharing exposure, secrets/PII in logs, audit coverage, and unintended external notifications.

A hash mismatch is only a file-level difference signal. It must not be translated directly into ADDED/MODIFIED/REMOVED business behavior without a diff.

## 5. Integration Test Runner reconciliation

Known evidence:
- The supplied GAS archive runner version 1.0.0 tests anchored route expressions against `String(doPost)`. This compares an action-name pattern to the entire function source and was reproduced as false for the five tested route families.
- GitHub contains runner version 1.0.1 with static dispatcher inspection and positive/negative route-detector unit checks.
- The two runners have different designs. The archived GAS runner includes a strict environment guard and INT-01 read-only handler test. These must not be discarded.

Decision:
- Do **not** replace `SNC_IntegrationTestRunner_TEST.gs` in GAS with GitHub v1.0.1 as a whole at this stage.
- Prepare a merged runner in GitHub that preserves the GAS environment guard and INT-01 read-only preconditions, adopts the corrected static route/handler inspection and pure positive/negative unit tests, and keeps suites NOT RUN unless an executable suite-specific procedure exists.
- INT-08 remains blocked until browser/LIFF failure-recovery evidence exists.
- After review, the intended GAS target is only `SNC_IntegrationTestRunner_TEST.gs` in the TEST GAS project. This is a **future candidate**, not an instruction to replace the current file now.

## 6. Configuration and controlled synchronization

Never copy these values into GitHub source or documentation: LINE channel secrets/tokens, OTP pepper, deployment URLs containing credentials, private student identifiers, or Script Property values.

Keep configuration responsibilities separate:
- GAS Script Properties: GAS-side secrets and TEST-only identifiers.
- Worker environment: `GAS_API_URL` and Worker-side secrets/configuration.
- Student web client: public LIFF ID and public API base URL only; TEST and Production values must be separated by deployment/environment.
- Apps Script manifest: versioned runtime metadata only; it does not prove deployment target or runtime property values.

Controlled sync sequence:
1. Freeze the reviewed GitHub `development` commit SHA and capture a fresh GAS project export.
2. Generate per-file unified diffs and a function-level decision log.
3. Approve each file individually; reject any change that conflicts with DOCS v1.3 or alters schema/API/permission contracts without owner approval.
4. Apply approved files to the verified TEST GAS project only. Do not edit Production or deploy a new public endpoint as part of source sync.
5. Run syntax checks, pure unit tests, environment guard, read-only schema inspection, then the approved isolated integration test batch.
6. Capture logs and compare database state before/after. Confirm no unintended writes, notifications, or external messages.
7. Update the release manifest with GitHub commit SHA, exact GAS files changed, test results, operator, and rollback version.
8. Only after all gates pass may a separate Production release proposal be prepared. Production release requires separate explicit authorization.

Rollback: restore the exact pre-sync GAS exports for only the files changed in the approved batch. Do not restore spreadsheets from source backups or run schema rollback unless separately planned and approved.

## 7. Current evidence and limitations

- Latest reviewed `development` HEAD: `f4cc4c0c93fc9521ca3f6263e22ded3e68e2de32`.
- All 13 backend file hashes differ between the supplied GAS archive and GitHub at the compared revision.
- The archive's 16 JavaScript/Apps Script source files passed Node syntax parsing; this is not Apps Script runtime validation.
- Owner confirmed `SNC_ITR_ENVIRONMENT=TEST`.
- Owner-provided read-only schema inspection returned `success:true`, `mode:READ_ONLY_SCHEMA_INSPECTION`, schema version `1.5.0`, and the designated TEST spreadsheet ID. This supports the active spreadsheet binding and the inspector's table/header checks for that execution.
- Deployment/API URL mapping and LINE TEST/PRODUCTION separation remain unverified.
- No GAS write/sync, deployment, schema migration, fixture creation/cleanup, spreadsheet write, or Production access was performed.
- A direct GAS project write connector is not available in this workflow. GAS file replacement must therefore be performed by the Project Owner/operator using the exact approved file list after this report is updated with a per-file approval status.

## 8. Gate decision

**System Testing Step 4: NOT CLEARED.**

Remaining gates:
1. Complete semantic diff and file-level decisions for all 13 backend modules.
2. Produce and review the merged TEST runner.
3. Verify TEST deployment/API URL mapping.
4. Verify LINE TEST/PRODUCTION separation.
5. Approve the isolated test fixture plan and exact test batch.
6. Issue a new explicit GAS replacement list only for files whose reconciliation and validation are complete.

## 9. Immediate GAS instruction

**Do not replace any of the 13 backend modules yet. Do not replace the TEST runner yet.** The current exact GAS replacement list is empty. The next GitHub work package is the semantic diff, starting with `Code.gs`, `setup.gs`, `UserRoleManagement.gs`, then the assignment/group/submission modules. After each batch, this document must be updated with exact filenames, GitHub commit SHA, reason, compatibility impact, test evidence, and the corresponding GAS replacement instruction.
