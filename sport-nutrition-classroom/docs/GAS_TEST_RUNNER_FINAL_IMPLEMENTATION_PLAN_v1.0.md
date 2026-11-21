# SPORT NUTRITION CLASSROOM
## GAS Test Runner v1.0 — Final Implementation Plan

- Document ID: SNC-TEST-RUNNER-IMP-002
- Version: 1.0.0
- Status: Final Proposed Plan — implementation requires explicit Project Owner approval
- Prepared: 21 November 2026
- Repository: `worrawutt-source/worrawutsportsci`
- Target branch: `development`
- Gateway: Cloudflare Worker `snc-test-api-proxy`
- GAS Script ID: `1SL2JzGAsz625HiyLjmjmS_v-j3C9Htoc2UIKVsT8zDCIJc4VRITIUyYO`
- GCP Project: Default (Google-managed Apps Script project)
- Cloudflare dashboard environment observed: Production

> This document is a development plan. It does not authorize source changes, configuration changes, test execution, or deployment. Each implementation phase remains subject to the approval gates below.

---

## 1. Purpose

Develop a controlled GAS Test Runner for SPORT NUTRITION CLASSROOM. The Runner will allow the Project Owner or an approved Test Operator to request only explicitly registered tests through an authenticated gateway. It must not expose GAS Editor access, arbitrary function invocation, arbitrary GAS actions, or unrestricted database operations.

The Runner is a separate operational component. It does not add or modify Classroom roles (System Admin, Course Coordinator, Instructor, Student), Classroom permissions, business rules, API contracts, or database schema.

## 2. Governing decisions and constraints

The following decisions are carried forward from the approved Runner policy and the user's latest environment direction:

1. Runner Owner is the Project Owner only.
2. Write Test requires explicit approval for each Test Suite and execution scope.
3. Reuse the existing Cloudflare Worker `snc-test-api-proxy`, subject to security verification.
4. The user has authorized using the currently configured Production Worker and GAS deployment as the development host while student usage is absent. This is an environment-use decision, not permission for uncontrolled writes.
5. Source of Truth remains GitHub branch `development`.
6. Do not modify `main` unless separately approved.
7. Do not change Classroom schema, API contract, role model, or business rules without a separate Change Request.
8. Preserve the existing Classroom Worker route and action allowlist. Do not add `test.run` to the existing public Classroom action allowlist.
9. No source or configuration change is made until the applicable phase is approved.
10. Runner is disabled by default and must fail closed.

### 2.1 Production-hosted development safety

Because the user has chosen to develop using the current Production environment, the plan must not mislabel Production as TEST or assume that a TEST spreadsheet is attached.

Before any test can run, the Project Owner must explicitly approve and record:
- the exact GAS deployment being targeted;
- the exact active spreadsheet ID and its intended data classification;
- whether the selected test is in-memory, read-only, or write-capable;
- the data scope and side-effect boundary;
- the rollback and recovery procedure.

Initial pilot is restricted to reviewed L1 in-memory tests. L2 tests that read live Classroom data require a separate environment/data-scope approval. L3 or write-capable tests remain disabled and require per-suite approval. No test may write to existing student, course, offering, enrollment, assignment, grade, submission, or account records unless a separate, explicit and technically enforced fixture scope is approved.

Absence of student usage reduces user-impact risk but does not eliminate data-integrity, credential, privacy, or availability risks.

## 3. Verified configuration baseline

### 3.1 GAS project

Verified from user-provided Apps Script Project Settings and deployment screenshots:
- Script ID: `1SL2JzGAsz625HiyLjmjmS_v-j3C9Htoc2UIKVsT8zDCIJc4VRITIUyYO`
- GCP: Default
- Time zone: GMT+07:00 Indochina Time – Bangkok
- Chrome V8 runtime: enabled
- Uncaught exception logging: enabled
- Web App deployment observed: Active
- Execute as: Me (project owner account)
- Who has access: Anyone

Security implications:
- The Web App is callable without Google sign-in, so the GAS endpoint must independently authenticate every Runner request.
- Execute as Me means calls execute with the deployer's authority. Runner authorization must therefore be strict and independent of caller-supplied identity.
- Do not change the GCP project from Default as part of this plan unless a documented technical dependency requires it and the Project Owner separately approves the change.
- Do not change deployment access or execute-as settings without impact analysis of the existing Classroom API.

The exact active deployment ID and the full deployment URL-to-Script-ID relationship still need to be recorded in the controlled implementation checklist. Do not publish deployment URLs or credentials in source files.

### 3.2 Existing GAS Script Properties

The following names were observed or confirmed in source:
- `LINE_CHANNEL_ID`
- `SNC_ACCOUNT_LINKING_SCHEMA_VERSION`
- `SNC_ASSIGNMENT_SCHEDULER_SPREADSHEET_ID`
- `SNC_INITIAL_ADMIN_STUDENT_ID`
- `SNC_OTP_PEPPER`
- `SNC_SCHEDULER_TRIGGER_TEST_TAG`

Rules:
- Preserve all existing properties and their meanings.
- Do not reuse `SNC_OTP_PEPPER` as a Runner credential.
- Do not reuse the Scheduler test tag for Runner state.
- New Runner properties, if required, must use the `SNC_TEST_RUNNER_` prefix and must be added only after the secret custody and state-storage design is approved.
- Never commit property values or secret values to GitHub.

Security incident precaution:
A screenshot supplied during configuration review visibly exposed the value of `SNC_OTP_PEPPER`. Treat that value as potentially disclosed. Before implementation, assess the OTP impact and prepare a controlled pepper rotation plan. Do not rotate it without an approved migration/compatibility plan; do not reuse the exposed value for any new purpose.

### 3.3 Cloudflare Worker

Verified from user-provided dashboard screenshots:
- Worker: `snc-test-api-proxy`
- Selected environment: Production
- workers.dev endpoint: `https://snc-test-api-proxy.worrawutt.workers.dev`
- Runtime Variable observed: `GAS_API_URL`
- Bindings shown: none connected
- Custom domain: none shown
- Additional route: none shown
- Workers Logs: enabled
- Workers Traces: disabled
- Git repository connection: not configured in the shown Builds section
- Cron triggers: none shown
- Queue consumers: none shown

Not yet verified:
- The actual value/target of `GAS_API_URL` (must confirm privately that it targets the intended GAS Script ID/deployment).
- Whether any Worker Secrets exist beyond the visible Variable row.
- Preview environment variables/secrets.
- Whether a Durable Object, D1, KV or other service can be provisioned and used under the account.
- The current deployed Worker source fingerprint versus the GitHub source.

Do not change `GAS_API_URL` during Runner work unless a separately reviewed change proves it is necessary. The existing Classroom route must continue to use its current upstream target.

## 4. Target architecture

```text
Project Owner / Approved Test Operator
                  |
                  v
       Authenticated Server-side Test Client
                  |
                  v
       Cloudflare Worker: dedicated Runner path
          |                       |
          | Client authentication |
          | schema/rate/size check |
          v                       |
       Worker-to-GAS HMAC         |
                  |               |
                  v               |
            GAS Web App           |
                  |               |
          GAS Runner verification |
          - HMAC                  |
          - timestamp / nonce     |
          - request ID            |
          - request size/schema   |
          - enabled state         |
          - environment/data guard|
          - approval / risk level |
                  |               |
                  v               |
          Static Test Registry    |
                  |               |
                  v               |
            Approved Test         |
                  |               |
                  v               |
       Result Adapter + Audit + Sanitization
                  |
                  v
       Authenticated Test Client / Operator
```

Trust boundaries:
1. Client-to-Worker and Worker-to-GAS credentials are separate.
2. No shared secret is placed in a ChatGPT prompt, browser, GitHub Pages, or repository.
3. Origin/CORS is not authentication.
4. GAS independently verifies Worker-to-GAS authentication.
5. Caller cannot choose the GAS URL, deployment, spreadsheet, environment, function name, or arbitrary action.
6. Only static registry entries can be invoked.
7. The Worker validates and sanitizes the GAS response before returning it.

## 5. Work packages

### WP-0 — Baseline, backup and target verification

Files: no application source changes.

Tasks:
1. Re-read the current `development` HEAD and confirm it has not changed unexpectedly.
2. Record the exact current blob SHAs for all files to be changed.
3. Back up the current GAS project source before any GAS modification.
4. Record the active deployment identity and rollback path in a restricted operational record.
5. Privately verify that `GAS_API_URL` points to the intended Script ID and deployment.
6. Confirm Worker Secret names/presence without revealing values.
7. Review GAS project Editor access; Script Properties are not protected from project editors who can modify and execute project code.
8. Verify the currently deployed Worker source against the reviewed GitHub source.
9. Document the approved spreadsheet/data scope for the initial pilot.

Exit criteria:
- Verified source and deployment backups exist.
- Worker upstream target is confirmed.
- Project editor trust boundary is accepted.
- No runtime behavior has changed.

### WP-1 — Cloudflare Runner Gateway

File:
- `sport-nutrition-classroom/proxy/worker.js`

Tasks:
1. Add an exact, dedicated Runner path (proposed: `/runner/v1`).
2. Preserve existing Classroom route behavior and action allowlist.
3. Authenticate the server-side Test Client independently.
4. Validate a strict request schema and fixed operation set.
5. Enforce timestamp, nonce, request ID, body-size and rate limits.
6. Implement replay/duplicate protection using a store with appropriate atomicity.
7. Sign Worker-to-GAS requests with a distinct credential.
8. Keep GAS upstream target fixed in server configuration; reject caller-supplied URLs.
9. Validate and sanitize GAS responses.
10. Redact secrets, signatures, tokens, OTPs and personal data from logs.
11. Fail closed when configuration, authentication, replay state, or upstream verification is unavailable.

Required regression:
- Existing Classroom allowed/rejected Origin cases.
- Existing method, content-type, payload-size and JSON checks.
- Existing action allowlist and upstream behavior.
- Runner valid/invalid client authentication.
- Wrong/expired signature, timestamp, nonce and duplicate request.
- Unknown path, action, fields and caller-supplied target.
- Rate/payload limits and response sanitization.
- Verify no request reaches GAS when Client authentication fails.

Exit criteria:
- Existing Classroom proxy regression passes.
- Runner path is isolated.
- No unauthenticated request can invoke GAS Runner.

### WP-2 — GAS Runner Core

New file:
- `sport-nutrition-classroom/backend/TestRunner.gs`

Potential minimal integration:
- `sport-nutrition-classroom/backend/Code.gs`, only if a minimal authenticated dispatch is required after source inspection.

Tasks:
1. Add a dedicated Runner dispatch path without broad refactoring of Classroom handlers.
2. Enforce a GAS-side request byte-size limit before JSON parsing.
3. Validate strict envelope/schema and reject unknown fields.
4. Verify HMAC, timestamp, nonce, request ID and key version.
5. Enforce replay and duplicate request policy.
6. Verify Runner enabled state and the exact approved deployment/data target.
7. Enforce approved operator/owner policy and suite-level approval.
8. Resolve tests only through static Test Registry references.
9. Enforce risk level, preconditions, timeout and concurrency.
10. Normalize results; missing/malformed/undefined results must never count as PASS.
11. Record minimal audit metadata without secrets or personal data.
12. Return a fixed, sanitized response envelope.

Lock rule:
- Use Script Lock only for short atomic replay/lease state transitions.
- Release Script Lock before invoking any test function.
- Never hold Script Lock while a test may acquire it.
- Implement bounded lease expiry and stale-lease recovery.
- Do not assume nested/re-entrant Script Lock behavior.

Exit criteria:
- GAS rejects unauthenticated, malformed, oversized, expired, replayed and wrong-target requests.
- Arbitrary function invocation is impossible.
- Duplicate execution is prevented.
- No Script Lock deadlock occurs.
- Audit and result responses are sanitized.

### WP-3 — Static Test Registry and result adapters

Each registry entry must include:
- stable Test ID;
- direct function reference;
- suite ID and version;
- reviewed source commit;
- risk level (L0/L1/L2/L3);
- side-effect classification;
- preconditions;
- timeout;
- result adapter;
- enabled/disabled state.

Initial L1 candidates for the first pilot, subject to final direct/indirect call review and adapters:
- `testAssignmentSubmissionConfigUnit()`
- `testAssignmentSchedulerLogicUnit()`
- `testCourseManagementAuthorizationLogic()`
- `testSyntheticIdentityAndRoleRevocationFixtures()`
- `testOfferingDuplicatePredicateUnit()`
- `testEnrollmentImportLogicUnit()`
- `testEnrollmentAuthorizationPredicatesUnit()`
- `testApiMissingTokenGuard()`

L0/L2 candidates, disabled until data-target guard and approval:
- `testAssignmentManagementSchemaPreflight()`
- `testCourseManagementPreflight()`
- `testCourseManagementLiveAuthorizationData()`
- `testCourseManagementReadEndpointsWithLinkedAdmin()` (conditional on valid existing fixture)
- `testDataIntegrityAuditLogReadOnly()`
- `testEnrollmentSchemaPreflight()`
- `testAccountLinkingPreflight()` (aggregate-only output; no identifiers or secret values)

Explicit exclusions from v1.0 initial registry:
- `testAssignmentSchedulerIntegration()` (persistent fixtures and no cleanup in reviewed source)
- `testSecurityRevocationSpoofingAndAudit()`
- `testSystemAdminAuthorizationAndPermissionBoundary()`
- `testSimulatedInstructorNegativeAuthorization()`
- `testInstructorDataScopeIsolation()`
- `testCourseCoordinatorScopeIsolation()`
- `testDuplicateRequestAuditConsistencyReadOnly()`
- setup, migration, student import, trigger-management and cleanup functions not separately reviewed.

Negative authorization tests that call mutation-capable handlers are L3 or excluded until refactored to prove no write path is reachable.

### WP-4 — Security verification

Minimum security test matrix:
1. Missing Client credential.
2. Forged Origin without credential.
3. Invalid Client credential.
4. Invalid Worker-to-GAS HMAC.
5. Tampered signed payload.
6. Expired timestamp.
7. Reused nonce.
8. Reused request ID.
9. Unknown Test ID.
10. Arbitrary function/eval injection.
11. Caller-supplied GAS URL, deployment, spreadsheet or environment.
12. Wrong target/data scope.
13. Runner disabled.
14. Write Test without valid approval.
15. Expired, reused or mismatched approval.
16. Operator attempts to approve/change registry.
17. Viewer attempts to execute.
18. Oversized direct GAS request.
19. Existing Classroom route regression.
20. Test function that acquires Script Lock.
21. Undefined or malformed test result.
22. Exception/timeout handling.
23. Secret/OTP/token/student-data leakage.
24. Concurrent duplicate request.
25. Project editor trust-boundary verification.

Expected behavior:
- Invalid requests are rejected before test dispatch.
- No unauthorized or duplicate execution occurs.
- No secret or personal data is returned or logged.
- No implicit PASS is generated.
- Existing Classroom API behavior remains unchanged.

### WP-5 — Read-only pilot

Pilot sequence:
1. Enable Runner only for Project Owner.
2. Enable only reviewed L1 tests.
3. Run one test at a time.
4. Compare Runner output with manual execution.
5. Verify audit completeness and redaction.
6. Inspect before/after state for Sheets, Drive, triggers, Script Properties and outbound notifications.
7. Record all results with source commit and suite version.
8. Treat precondition failures as BLOCKED, not PASS.

L2 tests require a separate approval specifying exact data target, data classification and read scope.

### WP-6 — Write Test capability

Default state: DISABLED.

Before any Write Test:
- define an isolated fixture namespace;
- use unique execution markers;
- constrain writes to fixtures created by that execution;
- define cleanup and prove it cannot target unmarked records;
- bind approval to suite ID/version, environment, data scope, fixture plan, cleanup plan, expiry and one-time execution;
- require explicit Project Owner approval for each execution batch.

No Write Test may modify existing student or Classroom business records merely because no students are currently logged in.

### WP-7 — Test Client / ChatGPT integration

Release dependency:
- A supported authenticated server-side MCP/API tool or approved Test Client must invoke the Worker.
- Do not place Client Secret in ChatGPT prompt or browser.
- Do not expose generic HTTP fetch, arbitrary URL, arbitrary GAS action or arbitrary function invocation.
- ChatGPT may operate only as Test Operator within Owner-approved policy.
- If a supported authenticated ChatGPT tool cannot be demonstrated, v1.0 pilot is limited to the separately authenticated Test Client and ChatGPT integration remains BLOCKED.

## 6. File impact matrix

| Path | Planned change | Approval |
|---|---|---|
| `sport-nutrition-classroom/proxy/worker.js` | Add isolated authenticated Runner route | Phase-specific approval |
| `sport-nutrition-classroom/backend/TestRunner.gs` | New Runner core, registry, guards, adapters and audit | Phase-specific approval |
| `sport-nutrition-classroom/backend/Code.gs` | Minimal Runner dispatch/body-size guard only if required | Phase-specific approval |
| Existing test modules | Prefer unchanged; narrowly scoped adapter/guard only if required | Separate file-level review |
| `backend/setup.gs` | No change | Out of scope |
| Frontend / LIFF | No change | Out of scope |
| Classroom database schema | No change | Prohibited without Change Request |
| `main` | No change | Out of scope |

## 7. Credential and storage design requirements

Before coding, finalize:
1. Separate Client-to-Worker and Worker-to-GAS credentials.
2. Deterministic HMAC canonicalization, signed fields and known-answer test vectors.
3. Key versioning and rotation procedure.
4. Atomic nonce claim and duplicate-request behavior.
5. Replay retention and stale-state cleanup.
6. Execution lease and stale-lease recovery.
7. Runner audit storage and access controls.

Do not assume Cloudflare Durable Objects, D1 or KV are available: dashboard screenshots showed no connected bindings. Verify service availability and account permissions before selecting a store. Do not add a Runner sheet to the Classroom database without separate schema approval. Eventual-consistency storage must not be the sole replay defense.

## 8. Rollback and incident response

### Worker
- Record last known-good deployment version before change.
- On Runner or Classroom route regression, disable Runner path or roll back to the last known-good Worker version.
- Verify existing Classroom route after rollback.

### GAS
- Back up current GAS source before every change.
- Record deployment baseline and rollback method.
- Restore only the verified source backup under Project Owner approval.
- Do not overwrite GitHub source with a GAS copy; GitHub `development` remains Source of Truth.

### Credential compromise
- Disable Runner route immediately.
- Rotate Client and Worker-to-GAS credentials independently.
- Review audit evidence and re-enable only after security verification.

### Unexpected data mutation
- Stop affected suite and all subsequent runs.
- Preserve audit evidence.
- Identify exact records/fixtures affected.
- Do not perform cleanup until ownership and recovery are reviewed and approved.

## 9. Release gates

| Gate | Required evidence |
|---|---|
| G0 | Current source/deployment backup and verified target |
| G1 | Threat model, route isolation and credential design approved |
| G2 | Worker security and Classroom regression tests pass |
| G3 | GAS authentication, strict schema and target guard pass |
| G4 | Static registry, replay protection, lock and result adapters pass |
| G5 | Security matrix passes; no secret/PII leakage |
| G6 | L1 read-only pilot passes with no unintended side effects |
| G7 | L2 enabled only after separate data-scope approval |
| G8 | L3/Write Test enabled only after per-suite approval and fixture/cleanup proof |
| G9 | Authenticated Test Client/ChatGPT integration demonstrated |

## 10. Outstanding configuration confirmations

These remain open and must be closed during WP-0:
1. Privately verify that Worker `GAS_API_URL` points to the GAS Script ID and intended active deployment recorded above.
2. Verify the complete names/presence of Worker Secrets for Production and Preview without disclosing values.
3. Verify GAS project Editor access and accept the Script Properties trust boundary.
4. Verify actual deployed Worker source matches the reviewed GitHub source.
5. Select a replay/audit store only after confirming available services and atomicity.
6. Confirm the exact spreadsheet/data target and risk scope for the first pilot.
7. Complete the OTP pepper exposure assessment and approved rotation plan.

## 11. Implementation authorization

This plan is a guide for implementation and a proposed work package. Creating this document on GitHub does not authorize code changes or deployment.

Before implementation:
- Project Owner must explicitly approve the file-level diff plan for the relevant phase.
- WP-0 must be completed and evidenced.
- Worker and GAS source backups must be verified.
- No code may be copied to GAS or deployed until the applicable source review and approval gate is passed.

**Current status:** Documentation prepared. Application source unchanged. Worker deployment unchanged. GAS deployment unchanged. No Runner runtime tests executed.
