# SPORT NUTRITION CLASSROOM — GAS Test Runner Design Specification

- Document ID: SNC-TEST-RUNNER-DS-001
- Version: 1.0.0
- Status: Design baseline — implementation pending separate approval
- Target branch: `development`
- Project baseline: DOCS v1.3
- Policy approval: Runner Owner = Project Owner only; Write Test requires per-suite approval; Gateway = reuse existing Cloudflare Worker subject to security verification
- Prepared: 21 November 2026

## 1. Purpose

กำหนดสถาปัตยกรรม ข้อกำหนดด้านความปลอดภัย สิทธิ์ การทำงาน และแผนพัฒนา GAS Test Runner สำหรับ SPORT NUTRITION CLASSROOM เพื่อให้สามารถสั่งทดสอบ Backend บน GAS TEST และรับผลในรูปแบบมาตรฐานได้ โดยไม่ให้ผู้เรียกเข้าถึง GAS Editor หรือเรียกฟังก์ชันภายในได้อย่างอิสระ

เอกสารนี้เป็นข้อกำหนดของระบบทดสอบแยกจาก Classroom Runtime ไม่ใช่การเพิ่มบทบาทหรือสิทธิ์ให้ Student, Instructor, Course Coordinator หรือ System Administrator ใน Classroom

## 2. Approved decisions and governing constraints

### 2.1 Approved policy

1. Runner Owner: Project Owner เพียงคนเดียว เป็นผู้กำหนด Test Allowlist, Execution Policy และอนุมัติ Write Test
2. Test Operator: ChatGPT หรือ Test Client ทำได้เฉพาะคำสั่งที่ Owner อนุญาตและผ่านการยืนยันตัวตน
3. Write Test: ต้องได้รับอนุมัติเป็นราย Test Suite ก่อนทุก execution batch โดยการอนุมัติต้องผูกกับ suite/version, TEST environment, ขอบเขตข้อมูล, fixture strategy และ cleanup plan
4. Gateway: ใช้ Cloudflare Worker `snc-test-api-proxy` เดิมเป็นฐาน โดยเพิ่มเส้นทาง Runner ที่แยกจาก API Proxy ปกติ และต้องผ่าน Security Review ก่อนเปิดใช้งาน
5. Production และ branch `main` อยู่นอกขอบเขต
6. Source of Truth คือ GitHub branch `development`
7. ห้ามเปลี่ยน Database Schema, Classroom API Contract, Business Rules หรือ DOCS v1.3 โดยไม่มี Change Request ที่ได้รับอนุมัติ
8. การพัฒนา GAS Test Runner ต้องไม่ทำให้ GAS TEST หรือ Production ถูกแก้ไขก่อนการอนุมัติแผนและการส่งมอบ Source Code

### 2.2 Project baseline checked

- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development`
- HEAD checked for this specification: `d7a7f6619c720c8c4266ecaab00189d242eff33f`
- Existing Worker source: `sport-nutrition-classroom/proxy/worker.js`
- Existing Worker name/endpoint recorded in project context: `snc-test-api-proxy`; `https://snc-test-api-proxy.worrawutt.workers.dev`
- Existing Worker configuration includes `GAS_API_URL` targeting the TEST GAS `/exec` endpoint.
- Existing Worker is a browser-facing API proxy with Origin allowlisting, request size/content-type checks, action allowlisting, HTTPS GAS URL validation and redirect-following behavior.
- The current Worker does not yet implement a dedicated Test Runner authentication/authorization protocol. Origin/CORS validation is not authentication and must not be treated as proof of caller identity.
- GAS TEST spreadsheet ID recorded in the existing regression plan: `1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk`. This identifier must be verified against the active TEST GAS project at runtime; it must never be accepted from an untrusted request as the source of truth.

## 3. Goals and non-goals

### 3.1 Goals

- Execute only explicitly registered Test IDs and Test Suites.
- Enforce TEST-only environment checks before test execution.
- Separate read-only tests from tests that write data or create fixtures.
- Apply authentication, authorization, replay protection, request validation and execution limits.
- Return normalized test results with execution identifiers and audit metadata.
- Preserve existing Classroom API behavior and existing Worker route behavior.
- Support future ChatGPT invocation through a separately configured, authenticated tool/MCP/API integration.

### 3.2 Non-goals

- No general-purpose GAS function invocation, eval, dynamic function-name execution or arbitrary code execution.
- No GAS Editor access for ChatGPT.
- No production testing, production data mutation, production deployment or branch `main` changes.
- No automatic cleanup that deletes records unless the exact fixture ownership and cleanup operation are explicitly approved.
- No change to the Classroom user permission matrix.
- No change to existing student, instructor, coordinator or administrator authentication flows.
- No claim that ChatGPT can invoke the Worker until a supported authenticated tool integration has been configured and verified.

## 4. Architecture

### 4.1 Logical components

1. **ChatGPT Test Client / approved tool integration** — submits a Test Suite ID and approved execution parameters; it must not hold GAS credentials or the Worker-to-GAS signing secret.
2. **Existing Cloudflare Worker Gateway** — reuses `snc-test-api-proxy`; adds a dedicated Runner route (proposed path: `/runner/v1`) that is isolated from the existing Classroom proxy route.
3. **Runner Authentication Layer** — validates a signed caller request, timestamp, nonce, request ID and allowed operation.
4. **GAS Test Runner endpoint** — receives a narrowly scoped `test.run` request and performs independent signature, replay, environment, allowlist and policy checks.
5. **Test Registry** — static mapping of Test IDs to known test functions and metadata; no user-supplied function names.
6. **Existing test functions** — invoked only through registered adapters after source inspection confirms their side effects and result contract.
7. **Test Result Normalizer** — maps function outcomes to PASS, FAIL, BLOCKED, NOT RUN or REVIEW REQUIRED.
8. **Execution Audit** — records execution ID, actor, suite/test IDs, timestamps, environment, policy decision and summary without storing secrets or unnecessary personal data.

### 4.2 Request flow

1. Test Client submits a request to the dedicated Worker Runner route.
2. Worker validates caller authentication, request schema, timestamp/nonce, request size, rate limit and suite identifier.
3. Worker rejects any route or action not explicitly allowed.
4. Worker constructs a narrowly scoped upstream request and signs it using a separate Worker-to-GAS secret.
5. GAS verifies the signature and replay controls independently.
6. GAS confirms the script is configured for TEST and the active spreadsheet ID exactly matches the configured TEST ID.
7. GAS checks suite registration, risk level, approval token/policy record and execution limits.
8. GAS invokes only statically mapped functions in the Test Registry.
9. GAS normalizes results and records the execution audit.
10. Worker validates the upstream response envelope and returns the sanitized result to the Test Client.

### 4.3 Gateway route isolation

- Existing Classroom API proxy behavior must remain unchanged.
- Runner requests must use a dedicated route and a separate action namespace; do not add `test.run` to the existing public Classroom action allowlist.
- The Runner route must not depend on browser Origin as its authentication control. CORS is relevant only if a browser-based operator console is later approved.
- The Worker must not log request bodies, signatures, tokens, OTPs, student data, GAS URLs or secrets.
- The Worker must retain strict HTTPS and upstream-host/path validation. Runner routing must not allow caller-controlled upstream URLs.
- The Worker-to-GAS endpoint remains fixed to the TEST deployment configured in Worker environment settings. Caller input must never select a GAS URL, deployment ID, spreadsheet ID or environment.

### 4.4 ChatGPT connectivity dependency

The existing project context confirms a Cloudflare Worker but does not establish an available authenticated generic HTTP tool in the current ChatGPT session. Therefore, Worker deployment alone does not make the endpoint callable by ChatGPT. A supported MCP/API tool integration or another approved authenticated Test Client must be configured and verified before claiming end-to-end ChatGPT execution. This is an integration dependency, not a reason to expose the endpoint publicly.

## 5. Security design

### 5.1 Two trust boundaries

Use separate credentials for:
- **Client-to-Worker authentication:** proves the approved Test Client/tool is authorized to request a run.
- **Worker-to-GAS authentication:** proves the request originated from the trusted Worker and was not modified in transit.

Do not reuse the same secret for both boundaries.

### 5.2 Signed request envelope

Proposed canonical fields:
- protocolVersion
- requestId (unique)
- timestamp (UTC epoch seconds)
- nonce (cryptographically random)
- action (fixed value `test.run`)
- suiteId
- suiteVersion
- environment (fixed value `TEST`)
- approvalId (required for Write Test)
- parameters (strict schema; no code or function name)

Signature is calculated over a deterministic canonical representation of the approved fields using HMAC-SHA-256. The exact canonicalization and encoding must be specified in implementation tests before release. Compare signatures in constant-time where supported.

Because Apps Script Web App event handling does not provide a dependable general request-header interface for this design, the Worker-to-GAS signature metadata must be included in the validated JSON envelope and verified by GAS before dispatch. The secret itself must never be included in the request.

### 5.3 Replay and duplicate protection

- Reject timestamps outside a short configured window (initial proposal: ±5 minutes).
- Reject reused nonces and request IDs for the retention window.
- Use a concurrency-safe lock for replay-state updates.
- A duplicate request must return the original execution state/result or a deterministic duplicate response; it must not start a second execution.
- Do not assume the Classroom API's Request ID is an idempotency key. Runner replay protection is a separate mechanism.
- If replay-state storage cannot be guaranteed under Apps Script quotas/concurrency, fail closed rather than execute without replay protection.

### 5.4 Secret storage

- Worker secrets: Cloudflare Worker Secrets, never ordinary source-controlled variables.
- GAS secrets: Script Properties, restricted to the GAS project owner/editor.
- GitHub: no credentials, tokens, signatures, real student data or secret values.
- Logs and responses: redact credentials and personal data.
- Rotation: support key version identifiers and a controlled overlap period; document rotation and revocation.

### 5.5 Authentication and authorization

- Only the approved Client identity may call the Worker Runner route.
- Only Project Owner may change the Test Registry, approve Write Test suites, change risk policy or rotate/revoke Runner credentials.
- Test Operator may request only approved read-only suites and specifically approved Write Test executions.
- Test Viewer may read sanitized reports only.
- GAS independently enforces the same permission boundary; Worker authorization alone is insufficient.
- No Classroom role automatically grants Runner permission.

### 5.6 Input validation and abuse controls

- Accept only JSON with a fixed schema and known fields.
- Reject unknown fields, oversized payloads, invalid suite IDs, invalid versions, unsupported parameters and malformed signatures.
- Do not accept arbitrary GAS function names, JavaScript, SQL, spreadsheet formulas, URLs, file IDs or arbitrary spreadsheet ranges.
- Apply rate limits, maximum execution duration, maximum test count per batch and bounded response size.
- Do not expose stack traces, Script Properties, spreadsheet contents or internal implementation details in public responses.

## 6. Environment safety and data protection

### 6.1 TEST-only invariant

Before any test function is invoked, all of the following must pass:
1. Runner configuration explicitly states `TEST`.
2. GAS project/deployment is the approved TEST deployment.
3. Active spreadsheet ID equals the configured TEST spreadsheet ID.
4. The TEST spreadsheet ID is not caller-supplied or overridable.
5. No Production URL, spreadsheet ID, deployment ID or secret is present in the execution request.
6. If any check is unavailable or inconsistent, execution is BLOCKED.

The current recorded TEST spreadsheet ID is a reference value only and must be verified in the actual GAS TEST deployment before enabling the Runner.

### 6.2 Data handling

- Prefer in-memory synthetic fixtures for Unit Tests.
- Read-only tests must not write Sheets, Drive files, triggers, properties or audit records in the Classroom data store. Runner execution metadata may be written to a separate, restricted Runner audit store if approved.
- Write Test must use explicitly identified synthetic records and must not use real student accounts or personal data.
- Never delete or overwrite pre-existing TEST data to make a test pass.
- Cleanup must target only records created by that execution and carrying a unique fixture marker.
- Cleanup is a separate, explicit approved operation unless the approved suite defines a tightly bounded transactional cleanup and proves ownership of every target record.
- Do not run the existing scheduler integration fixture test until a new plan is approved; the current regression plan documents persistent fixture creation and `cleanupPerformed:false`.
- Do not run synthetic identity/role revocation fixture tests until their exact implementation and cleanup behavior are reviewed.

## 7. Runner roles and permission matrix

| Capability | Runner Owner | Test Operator | Test Viewer | Runner Service |
|---|---:|---:|---:|---:|
| View Test Registry | Yes | Yes | Yes | Internal |
| Request approved Unit Test | Yes | Yes | No | Execute after checks |
| Request approved Read-only Integration Test | Yes | Yes | No | Execute after checks |
| Request Security Test | Yes | Only if suite policy permits | No | Execute after checks |
| Approve Write Test suite/execution | Yes | No | No | Enforce approval |
| Execute approved Write Test | Yes | Only with valid approval | No | Execute after checks |
| Add/remove Test Registry entries | Yes | No | No | No |
| Change risk classification/policy | Yes | No | No | No |
| Change TEST environment binding | Yes | No | No | No |
| View sanitized execution report | Yes | Yes | Yes | No |
| View security audit metadata | Yes | Yes | Yes | Internal |
| Change Classroom data/business rules | No | No | No | No |
| Access Production | No | No | No | No |

Runner Owner is the sole human policy authority. Runner Service is a technical identity, not a human role and not a source of additional approval authority.

## 8. Test risk levels and execution policy

| Level | Category | Data effect | Policy |
|---|---|---|---|
| L0 | Static/Preflight | No Classroom data writes | Allowed after authentication and TEST checks |
| L1 | Pure Unit Test | In-memory only | Allowed after authentication and TEST checks |
| L2 | Read-only Integration | Reads TEST data only | Allowed after TEST checks and per-test side-effect review |
| L3 | Write/Fixture Test | Creates or changes TEST data | Requires explicit per-suite approval and cleanup plan |
| L4 | Destructive/Production | Deletes uncontrolled data or touches Production | Prohibited through Runner v1.0 |

A test's risk level must be based on inspected implementation and observed side effects, not its name or documentation label. Tests with unknown side effects are BLOCKED until reviewed.

## 9. Test Registry

### 9.1 Registry requirements

Each registry entry must include:
- testId
- suiteId
- module
- function binding (static internal reference; never caller-supplied)
- suiteVersion
- riskLevel
- sideEffectClass
- preconditions
- expected result schema
- timeout
- approvalRequired
- cleanupPolicy
- enabled flag
- source file and reviewed source commit

Registry entries are code/configuration controlled by Runner Owner. No public API may add or modify entries.

### 9.2 Candidate initial allowlist

These are candidates from the current regression plan and are not yet authorized for execution until their source implementations and return contracts are reviewed.

| Module | Candidate function | Proposed level | Initial decision |
|---|---|---:|---|
| Assignment | `testAssignmentManagementSchemaPreflight()` | L0 | Candidate |
| Assignment | `testAssignmentSchedulerLogicUnit()` | L1 | Candidate |
| Course | `testCourseManagementPreflight()` | L0 | Candidate; add independent TEST guard |
| Course | `testCourseManagementAuthorizationLogic()` | L1 | Candidate |
| Course | `testCourseManagementLiveAuthorizationData()` | L2 | Candidate; verify read-only |
| Course | `testDataIntegrityAuditLogReadOnly()` | L2 | Candidate; verify TEST guard |
| Enrollment | `testEnrollmentImportLogicUnit()` | L1 | Candidate |
| Enrollment | `testEnrollmentAuthorizationPredicatesUnit()` | L1 | Candidate |
| Enrollment | `testEnrollmentSchemaPreflight()` | L0 | Candidate; add independent TEST guard |

### 9.3 Explicit exclusions from v1.0 first batch

- `testAssignmentSchedulerIntegration()`: excluded because the existing plan identifies persistent fixture creation and `cleanupPerformed:false`.
- `testSyntheticIdentityAndRoleRevocationFixtures()`: excluded pending source and cleanup review.
- `testDuplicateRequestAuditConsistencyReadOnly()`: excluded pending source review; despite its name, the existing plan reports that it invokes create requests and requires a special fixture.
- Any test that creates, updates, deletes, changes triggers, changes Script Properties or sends notifications is excluded until separately reviewed and approved.

## 10. Test execution lifecycle

1. **Request:** receive suiteId, suiteVersion, requestId and bounded parameters.
2. **Authenticate:** validate client signature and identity.
3. **Authorize:** confirm role, suite permission and any required approval.
4. **Validate:** schema, timestamp, nonce, request size, rate limit and duplicate request.
5. **Preflight:** verify TEST project, deployment and spreadsheet ID.
6. **Resolve:** load the static registry entry; never resolve caller-provided function names.
7. **Policy gate:** confirm risk level, side effects, preconditions and approval record.
8. **Execute:** run within timeout and concurrency limits.
9. **Normalize:** map results to standard status; missing/invalid return data must never be assumed PASS.
10. **Audit:** store minimal metadata and sanitized summary.
11. **Respond:** return the result envelope with executionId and status.

If any security or environment gate fails, do not invoke the test function.

## 11. Standard API contract

### 11.1 Request (illustrative)

```json
{
  "protocolVersion": "1.0",
  "action": "test.run",
  "requestId": "unique-request-id",
  "timestamp": 1795262400,
  "nonce": "random-one-time-value",
  "suiteId": "assignment-unit",
  "suiteVersion": "1.0.0",
  "environment": "TEST",
  "approvalId": null,
  "parameters": {},
  "keyId": "runner-key-v1",
  "signature": "HMAC-SHA-256"
}
```

The example is a schema illustration, not a valid signed request. For L3 suites, `approvalId` is mandatory and must resolve to an active Owner approval record.

### 11.2 Response (illustrative)

```json
{
  "success": true,
  "requestId": "unique-request-id",
  "executionId": "SNC-TEST-...",
  "environment": "TEST",
  "suiteId": "assignment-unit",
  "status": "PASS",
  "summary": {
    "total": 13,
    "passed": 13,
    "failed": 0,
    "blocked": 0,
    "notRun": 0
  },
  "results": [],
  "startedAt": "ISO-8601",
  "completedAt": "ISO-8601",
  "durationMs": 0,
  "error": null
}
```

### 11.3 Standard result statuses

- PASS: actual result matches expected result and has sufficient evidence.
- FAIL: actual result differs from expected result.
- BLOCKED: security, environment or precondition prevented execution.
- NOT RUN: included in the plan but not executed.
- DEFERRED: intentionally postponed with a documented reason.
- REVIEW REQUIRED: requires Owner decision or manual verification.

BLOCKED, NOT RUN, DEFERRED and REVIEW REQUIRED are never counted as PASS. If a test function returns no structured result, the Runner must not infer PASS from a log line or lack of exception; return an explicit invalid/unreportable result and mark the suite non-passing.

## 12. Audit and observability

Audit fields:
- executionId, requestId, suiteId, suiteVersion, testId
- caller identity and effective Runner role
- approvalId and policy decision
- environment label and verified TEST spreadsheet fingerprint (do not disclose full identifiers to untrusted callers)
- start/end timestamps and duration
- status and summary counts
- sanitized error code and safe diagnostic message
- source commit and registry version

Do not store:
- HMAC secrets, raw signatures where unnecessary, LINE tokens, OTPs, passwords, student personal data, full request payloads or full spreadsheet rows.

Audit storage must be restricted to Runner Owner. Test Viewer receives only sanitized reports. Retention duration and storage location must be decided before implementation; do not silently add a new Classroom database sheet or alter existing schema.

## 13. Operational limits and failure behavior

Initial values below are proposed defaults and must be validated against GAS/Worker quotas before implementation:
- Maximum request body: 16 KB for Runner requests.
- Timestamp tolerance: ±5 minutes.
- Maximum tests per suite execution: 25.
- Maximum concurrent Runner executions: 1 initially.
- Maximum suite execution duration: 4 minutes, subject to actual GAS execution limits.
- Rate limit: 10 requests per minute per authenticated client, with tighter limits for Write Test.
- Response payload: 64 KB maximum; large logs must be summarized and stored in restricted audit storage.

Fail closed on:
- invalid/missing signature
- expired timestamp or replayed nonce/requestId
- unknown/disabled suite
- invalid approval or approval for a different suite/version/environment
- environment mismatch or unverified spreadsheet ID
- unknown side effects
- timeout or concurrency lock failure
- malformed/oversized request or response

The system must distinguish Runner/Gateway errors from test assertion failures.

## 14. Existing test plan integration

The initial read-only batch should align with `GAS_TEST_REGRESSION_MODULE_TEST_PLAN_2026-11-21.md`. Before adding each function to the Registry:
1. Fetch its current implementation from `development`.
2. Inspect all direct and indirect calls for writes, triggers, notifications, external requests and property changes.
3. Confirm whether it returns structured data or only logs to Execution Log.
4. Add/verify a TEST spreadsheet guard where required.
5. Define exact preconditions and expected result schema.
6. Run static tests locally before any GAS execution.
7. Only then enable the registry entry.

The existing plan is not proof that the functions have passed in GAS runtime. No runtime execution is claimed by this specification.

## 15. Development plan on branch development

### Phase 0 — Design and source verification (current phase; documentation only)

- Confirm current branch HEAD and Worker source.
- Review current GAS dispatch, doPost/doGet, test functions, Script Properties usage and deployment configuration.
- Verify actual Worker deployment settings and TEST GAS target without exposing secrets.
- Review available ChatGPT tool integration options; do not assume a generic HTTP caller exists.
- Produce this Design Specification and an implementation plan.
- No application source code, Worker source, GAS source, deployment or database changes.

**Exit criteria:** Owner approves this specification and the detailed implementation work package.

### Phase 1 — Security and interface design

- Finalize client-to-Worker and Worker-to-GAS signature formats.
- Define nonce/replay storage and concurrency strategy.
- Define Runner API schema, registry metadata, approval record and audit retention.
- Confirm GAS runtime constraints and response handling.
- Decide the supported authenticated ChatGPT/Test Client integration.
- Threat-model cross-route access, credential theft, replay, confused-deputy, arbitrary function execution and environment misconfiguration.

**Deliverables:** Security Design Review, API Contract, Threat Model, test cases.

### Phase 2 — Gateway extension (Worker only)

- Add a dedicated Runner route to the existing Worker.
- Preserve existing Classroom proxy route behavior and action allowlist.
- Add independent caller authentication, rate limiting, strict schema validation and Worker-to-GAS signing.
- Add safe diagnostics without logging secrets or request bodies.
- Verify TEST-only upstream binding and redirect handling.
- Run Worker unit/security tests and regression tests for existing Classroom proxy behavior.

**Approval gate:** Owner approval of the Worker diff and security test results before deployment.

### Phase 3 — GAS Runner core

- Add a dedicated Runner module (proposed file: `TestRunner.gs`) without changing existing Classroom business modules unless source inspection proves a minimal dispatch integration is required.
- Implement request authentication, replay protection, TEST environment guard, static registry, risk policy, execution lock, result normalization and audit.
- Keep existing test functions unchanged where possible; use explicit adapters only after confirming their return contracts.
- Ensure missing structured results never become PASS.
- Do not add or alter Classroom database tables/sheets without a separate approved design.

**Approval gate:** Owner approval of GAS source diff and a verified backup of current GAS TEST source before any GAS deployment/update.

### Phase 4 — Controlled read-only pilot

- Enable only reviewed L0/L1 and selected L2 tests.
- Confirm exact TEST spreadsheet ID and deployment.
- Execute one suite at a time.
- Compare Runner result against manual GAS Editor execution for a small set of tests.
- Verify no Classroom rows, Drive files, triggers, Script Properties or notifications are changed.
- Validate audit records and failure modes.

**Exit criteria:** All security gates pass; results match manual evidence; no unauthorized side effects.

### Phase 5 — Write Test capability (disabled by default)

- Implement approval records and per-suite approval validation.
- Define fixture namespace/marker, ownership and cleanup plan.
- Test cleanup only against records created by the same execution.
- Require explicit Owner approval for each Write Test suite/version and target TEST dataset.
- Keep L3 disabled until separate acceptance.

### Phase 6 — ChatGPT/Test Client integration and v1.0 release

- Configure the approved authenticated tool/MCP/API integration.
- Verify ChatGPT can list permitted suites, request runs, poll/read results and handle errors.
- Verify Viewer cannot execute and Operator cannot approve or change policy.
- Complete security, regression and operational documentation.
- Release Runner v1.0 only after Owner acceptance.

## 16. Work packages and planned file scope

Proposed documentation:
- `sport-nutrition-classroom/docs/GAS_TEST_RUNNER_DESIGN_SPEC_v1.0.md` (this document)
- `sport-nutrition-classroom/docs/GAS_TEST_RUNNER_IMPLEMENTATION_PLAN_v1.0.md` (phase gates, file impact, acceptance criteria and test matrix)

Potential implementation files (not authorized for modification at this stage):
- `sport-nutrition-classroom/proxy/worker.js` — dedicated authenticated Runner route; preserve current proxy route.
- `sport-nutrition-classroom/backend/TestRunner.gs` — Runner core and static registry.
- `sport-nutrition-classroom/backend/Code.gs` — only if the current dispatch architecture requires a minimal explicit `test.run` route; exact impact to be established by source inspection.
- Tests and docs under `sport-nutrition-classroom/tests/` and `docs/` as appropriate.

No existing Classroom module, schema, frontend, production deployment or main branch is in the planned initial scope.

## 17. Acceptance criteria for Runner v1.0

1. Only authenticated approved callers can reach the Runner route.
2. Existing Classroom Worker proxy behavior passes regression tests unchanged.
3. Worker and GAS independently authenticate the request.
4. Replay, duplicate and invalid approval requests are rejected.
5. Runner cannot select arbitrary GAS URL, spreadsheet, deployment or function.
6. Every execution proves TEST environment and exact configured TEST spreadsheet before dispatch.
7. Only enabled static registry entries can execute.
8. L0-L2 tests run only after side-effect review and preflight.
9. L3 tests require a valid Owner approval tied to suite/version/environment and cleanup plan.
10. L4/Production operations are rejected.
11. Results use standard statuses and missing result data never counts as PASS.
12. Audit logs are useful but contain no secrets or unnecessary personal data.
13. Runner limits, timeout, concurrency and failure behavior are tested.
14. ChatGPT integration is demonstrated through a supported authenticated tool; Worker availability alone is not accepted as proof.
15. No changes to Classroom schema, business rules, Production or `main`.

## 18. Risks and unresolved design decisions

| Issue | Risk | Required resolution |
|---|---|---|
| ChatGPT tool connectivity | Worker may not be callable from current ChatGPT session | Identify/configure supported MCP/API tool integration |
| GAS header access | Web App event does not provide a reliable general header interface | Verify body-envelope signature implementation and canonicalization |
| Replay state | GAS concurrency/quotas may affect nonce persistence | Select durable restricted store and fail-closed behavior |
| Existing test return values | Some tests may only write to Logger | Inspect each function; add adapters or revise test contract under approval |
| Worker route regression | Shared Worker serves Classroom API | Separate route and comprehensive regression testing |
| TEST target drift | Worker variable/deployment could point to wrong GAS | Verify fixed target and enforce independent GAS spreadsheet guard |
| Audit persistence | Existing schema must not be altered casually | Select separate restricted storage or approved existing mechanism |
| Runtime quotas | Long suites may exceed GAS limits | Execute bounded batches and measure actual duration |
| Approval workflow | Approval must be unforgeable and scoped | Owner-only approval record with expiry and single-use execution binding |

## 19. Change control and current status

This document records approved policy decisions and proposes the technical design. It does not authorize implementation, deployment or execution of tests.

Current status:
- Design specification: prepared.
- Development implementation plan: prepared as the next documentation deliverable.
- Source code changes: not started and not authorized.
- GAS TEST changes/deployment: none.
- Production/main changes: none.
- Runtime tests through Runner: not available until implementation and authenticated tool integration are approved and completed.

Implementation may begin only after Project Owner reviews and explicitly approves the implementation work package, including exact files, security controls, test plan and deployment gates.


---

## Review Amendment v1.0.1 — 21 November 2026

This amendment is normative and supersedes conflicting statements in the original v1.0 text. It is based on `GAS_TEST_RUNNER_SOURCE_SECURITY_REVIEW_2026-11-21.md`. It changes design documentation only; it does not authorize implementation.

### A. Authentication and route isolation

1. Origin/CORS is not authentication. A non-browser HTTP client can set an Origin header; the Runner must never infer identity from Origin.
2. The existing Worker Classroom proxy route and `ALLOWED_ACTION` regex must remain unchanged. Do not add `test.run` to the existing public Classroom action allowlist.
3. Route Runner requests using an exact dedicated pathname (proposed `/runner/v1`) and authenticate before forwarding.
4. Client-to-Worker authentication must be server-to-server through an approved Test Client/MCP integration. No client credential may be placed in GitHub Pages, browser JavaScript, prompt text or a user-visible response.
5. Worker-to-GAS authentication uses a separate secret from Client-to-Worker authentication.
6. GAS independently verifies the Worker signature before Test Registry lookup or execution. The current GAS `doPost(e)` has no Runner action or Runner authentication.
7. GAS must independently enforce Runner request byte-size and strict schema limits; Worker-side limits alone can be bypassed by direct calls to the GAS Web App.
8. Caller input must never select GAS URL, deployment, spreadsheet, environment or function name.

### B. HMAC request contract

Before implementation, finalize a deterministic canonical string with a fixed ordered field list. At minimum sign:
- protocolVersion
- action
- requestId
- timestamp
- nonce
- suiteId
- suiteVersion
- environment
- approvalId
- digest of the exact validated parameters

The signature field itself is excluded from the signed content. Reject unknown fields and invalid types before signature verification. Specify UTF-8 encoding, digest encoding, keyId/key version, and constant-time comparison behavior. Add known-answer signature test vectors. Never sign arbitrary JSON serialization without a stable canonicalization contract.

### C. Replay and execution lease

1. Replay protection must use an atomic nonce/request claim and a defined retention policy.
2. Duplicate request IDs must not start another execution; return the existing execution state/result or a deterministic duplicate response.
3. Use Script Lock only for short atomic state transitions. Release it before invoking a Test Function.
4. Do not hold Script Lock across test execution: existing Assignment/Course/Enrollment handlers may acquire the same Script Lock and otherwise time out.
5. Use an execution lease with expiry and stale-lease recovery. Define state transitions and cleanup after exceptions/timeouts.
6. Select a replay/audit store only after verifying availability and consistency guarantees. Eventual-consistency storage alone is not sufficient for replay defense. No Cloudflare Durable Object/D1/KV binding is assumed to exist.

### D. Test Registry and risk reclassification

Test Registry entries must map Test IDs to static function references. No eval, dynamic function-name invocation or caller-provided code is permitted. Each entry must record reviewed source commit, risk, side effects, preconditions, result adapter and enabled status.

The following are candidate L1/L2 tests only after adapters and global TEST guard are in place:
- L1: `testAssignmentSubmissionConfigUnit()`, `testAssignmentSchedulerLogicUnit()`, `testCourseManagementAuthorizationLogic()`, `testSyntheticIdentityAndRoleRevocationFixtures()`, `testOfferingDuplicatePredicateUnit()`, `testEnrollmentImportLogicUnit()`, `testEnrollmentAuthorizationPredicatesUnit()`, `testApiMissingTokenGuard()`.
- L2: `testAssignmentManagementSchemaPreflight()`, `testCourseManagementPreflight()`, `testCourseManagementLiveAuthorizationData()`, conditional `testCourseManagementReadEndpointsWithLinkedAdmin()`, `testDataIntegrityAuditLogReadOnly()`, `testEnrollmentSchemaPreflight()`, conditional `testAccountLinkingPreflight()`.

The following call mutation-capable handlers and must not be automatically classified as L2 read-only:
- `testSimulatedInstructorNegativeAuthorization()`
- `testInstructorDataScopeIsolation()`
- `testCourseCoordinatorScopeIsolation()`
- `testSystemAdminAuthorizationAndPermissionBoundary()`
- `testSecurityRevocationSpoofingAndAudit()`
- `testDuplicateRequestAuditConsistencyReadOnly()`

Treat these as L3 approval-gated negative-mutation tests or refactor them into in-memory/non-mutating tests before registration. `testAssignmentSchedulerIntegration()`, `createAssignmentSchedulerTriggerFixtures()`, `installAssignmentSchedulerTrigger()`, `setupAccountLinkingSheets()` and `importStudentsFromStaging()` are excluded from Runner v1.0.

### E. Environment, secrets and result handling

1. Runner-level TEST guard is mandatory before every database-backed test. It must use trusted server-side configuration and verify the actual spreadsheet ID; never trust a caller-supplied ID.
2. Add defensive TEST checks to database-backed tests where practical. Current Course and Enrollment preflight tests do not independently check the TEST spreadsheet ID.
3. Script Properties do not protect secrets from untrusted Apps Script project editors who can execute code. Project Owner remains the only GAS Editor unless additional trusted editors are explicitly approved.
4. Result adapters must validate each test's actual return shape. Assignment/Course tests use PASS/FAIL strings; Enrollment tests include boolean `pass`; preflights may throw. Missing/malformed results must never count as PASS.
5. Worker must validate and sanitize the Runner response envelope and cap output size. Do not forward arbitrary stack traces, credentials or personal data.
6. Audit/replay storage must be Runner-only and separate from Classroom schema unless a separate schema Change Request is approved.

### F. Release blocker

ChatGPT connectivity is not established merely because a Worker endpoint exists. Runner v1.0 cannot claim ChatGPT automation until an approved authenticated MCP/API tool integration is configured and demonstrated. If unavailable, use an authenticated operator Test Client for the pilot and mark ChatGPT automation BLOCKED.

