# SPORT NUTRITION CLASSROOM — GAS Test Runner Implementation Plan

- Document ID: SNC-TEST-RUNNER-IMP-001
- Version: 1.0.0
- Status: Proposed — implementation requires separate Project Owner approval
- Target branch: `development`
- Design reference: `GAS_TEST_RUNNER_DESIGN_SPEC_v1.0.md`
- Prepared: 21 November 2026

## 1. Purpose and authorization boundary

This plan converts the approved Runner policy and Design Specification into bounded implementation work packages. It is a plan only. It does not authorize source-code changes, Worker deployment, GAS deployment, database changes or execution of new tests.

Approved policy:
- Runner Owner: Project Owner only.
- Write Test: explicit approval required for each suite/version and execution scope.
- Gateway: reuse existing Cloudflare Worker `snc-test-api-proxy`, conditional on security review.
- Development source of truth: GitHub `development`.
- `main`, Production and Classroom database schema are out of scope.

## 2. Current baseline and known constraints

- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development`
- Baseline checked before this document: `d7a7f6619c720c8c4266ecaab00189d242eff33f`
- Existing Worker file: `sport-nutrition-classroom/proxy/worker.js`
- Existing Worker: `snc-test-api-proxy`
- Existing Worker uses `GAS_API_URL` for the TEST GAS deployment.
- Existing Worker validates browser Origin, method, content type, body size, JSON envelope and a Classroom action allowlist. It does not yet implement Runner caller authentication or a dedicated Runner route.
- Existing GAS regression plan identifies TEST spreadsheet ID `1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk`; verify actual active deployment before execution.
- Current ChatGPT session does not have a verified generic authenticated HTTP action to call this Worker. A supported MCP/API tool integration is a release dependency.
- Existing safe-first-pass test candidates are listed in the Design Specification and regression plan. They are not yet Runner-authorized.
- Do not run `testAssignmentSchedulerIntegration()`; the current test plan documents persistent fixtures and `cleanupPerformed:false`.
- Do not run `testSyntheticIdentityAndRoleRevocationFixtures()` or `testDuplicateRequestAuditConsistencyReadOnly()` until their source and side effects are reviewed.

## 3. Phase plan and approval gates

### Phase 0 — Documentation and baseline (completed in this work package)

Tasks:
1. Verify current `development` HEAD.
2. Inspect DOCS v1.3 Architecture, Permission Matrix and API Specification.
3. Inspect `worker.js` and current GAS test plan.
4. Record approved policy, current limitations, architecture, security requirements and implementation phases.
5. Add the Design Specification and this Implementation Plan to `development`.

Files:
- Added: `docs/GAS_TEST_RUNNER_DESIGN_SPEC_v1.0.md`
- Added: `docs/GAS_TEST_RUNNER_IMPLEMENTATION_PLAN_v1.0.md`

Exit:
- Documentation exists on `development`.
- No application source code or deployment has changed.

### Phase 1 — Detailed source and security review (requires approval to begin implementation preparation)

Tasks:
1. Inspect current GAS `doPost` request parsing and action dispatch.
2. Inspect the existing API envelope, authentication, authorization and error handling in `Code.gs`.
3. Inspect every candidate test function and all direct/indirect calls.
4. Determine which tests return structured objects and which only use Logger.
5. Identify any test side effects: Sheets writes, Drive files, trigger changes, Script Properties, outbound LINE/API requests, locks and audit writes.
6. Verify GAS TEST deployment identity, active spreadsheet binding and script properties without exposing secret values.
7. Review Cloudflare Worker deployment configuration, route behavior, secrets capability and current `GAS_API_URL` target.
8. Decide the authenticated ChatGPT/Test Client integration mechanism.
9. Finalize HMAC canonicalization, nonce storage, replay retention and execution concurrency.
10. Produce threat model and security test cases.

Expected deliverables:
- Source Inspection Report.
- Final Runner API Contract.
- Threat Model and Security Test Matrix.
- File-level implementation diff plan.
- Confirmed ChatGPT/Test Client connectivity approach.

Approval gate:
- Project Owner approves the final file-level plan and security design before any source changes.

### Phase 2 — Worker Gateway extension (Worker source only)

Proposed file:
- `sport-nutrition-classroom/proxy/worker.js`

Implementation tasks:
1. Add an isolated Runner route (proposed `/runner/v1`).
2. Preserve current Classroom proxy route and its behavior.
3. Add independent client authentication for Runner requests.
4. Add strict request schema validation and fixed `test.run` operation.
5. Add timestamp, nonce, requestId and replay/duplicate protection.
6. Add rate limits and request/response size limits.
7. Sign the upstream GAS request using a distinct Worker-to-GAS secret.
8. Keep the upstream GAS URL fixed to the TEST deployment; reject caller-supplied URLs.
9. Do not log request bodies, secrets, signatures, tokens, OTPs or student data.
10. Add safe diagnostics and deterministic error responses.

Required tests:
- Existing Classroom proxy regression (allowed and rejected Origin, methods, content types, body sizes, JSON validation, action allowlist, redirect handling).
- Runner valid/invalid authentication.
- Wrong signature, expired timestamp, duplicate nonce/requestId.
- Unknown path/action and unknown fields.
- Rate limit and payload limit.
- Upstream URL tampering and TEST target enforcement.
- Secret/log redaction.
- Existing Classroom API behavior unchanged.

Approval gate:
- Review Worker diff and test report before deploying Worker changes.

### Phase 3 — GAS Runner core (GAS source in development only)

Proposed new file:
- `sport-nutrition-classroom/backend/TestRunner.gs`

Potential minimal dispatch integration:
- `sport-nutrition-classroom/backend/Code.gs` only if inspection proves an explicit `test.run` dispatch is necessary. Avoid broad refactoring.

Implementation tasks:
1. Validate fixed request envelope and signature.
2. Enforce timestamp, nonce, requestId and replay policy.
3. Verify Runner role/authorization and approval record.
4. Verify TEST environment and exact configured TEST spreadsheet ID before dispatch.
5. Resolve suite/test IDs only from a static registry.
6. Enforce risk level and side-effect policy.
7. Acquire execution lock and apply bounded timeout/test count.
8. Invoke only statically bound function references.
9. Normalize results; undefined, malformed or unverified results must never become PASS.
10. Record minimal execution audit metadata.
11. Return sanitized JSON response.
12. Fail closed on any authentication, authorization, environment or policy error.

Required tests:
- Signature validation and canonicalization vectors.
- Replay and duplicate execution.
- TEST spreadsheet mismatch and missing configuration.
- Unknown/disabled suite and arbitrary function-name injection.
- Missing/invalid approval for L3.
- L0/L1/L2 allow/deny matrix.
- Result normalization for PASS, FAIL, BLOCKED, NOT RUN, DEFERRED and REVIEW REQUIRED.
- No secret or personal-data leakage.
- Concurrency lock and timeout.
- Audit completeness and redaction.

Approval gate:
- Review GAS source diff, test report and verified backup of current GAS TEST source before any GAS deployment/update.

### Phase 4 — Read-only pilot

Initial candidate suites:
- Assignment schema preflight and scheduler logic unit.
- Course schema preflight and authorization logic unit.
- Course live authorization data and read-only data integrity checks after side-effect review.
- Enrollment import logic unit, authorization predicates and schema preflight.

Tasks:
1. Confirm TEST project and spreadsheet binding.
2. Enable only inspected L0/L1 tests and selected L2 tests.
3. Run one suite at a time.
4. Compare Runner output with manual GAS execution.
5. Verify no Classroom Sheet rows, Drive files, triggers, Script Properties or notifications changed.
6. Verify sanitized audit and report.
7. Document BLOCKED preconditions without counting them as PASS.

Acceptance:
- Runner and manual result agree.
- All executed tests have traceable evidence.
- No unauthorized side effects.
- No route regression.

### Phase 5 — Write Test capability (disabled by default)

Tasks:
1. Define fixture ownership and unique marker.
2. Define approved data scope and preconditions.
3. Define cleanup operation and prove it can only target fixtures created by that execution.
4. Define per-suite approval record with suiteId, suiteVersion, environment, allowed fixture scope, expiry and one-time execution binding.
5. Require Project Owner approval before each Write Test execution.
6. Keep Write Test disabled unless approval is valid and cleanup is reviewed.

Acceptance:
- Invalid, expired, reused or mismatched approval is rejected.
- Write test cannot target existing unmarked data.
- Cleanup cannot affect records outside the execution's fixture namespace.
- No production endpoint or spreadsheet can be selected.

### Phase 6 — ChatGPT/Test Client integration and release

Tasks:
1. Configure a supported authenticated MCP/API tool or approved Test Client.
2. Expose only narrow operations such as list permitted suites, run approved suite, get execution result and read sanitized report.
3. Do not expose generic HTTP fetch, arbitrary URL, arbitrary GAS action or arbitrary function invocation.
4. Verify the caller cannot approve Write Test or change policy.
5. Verify Viewer cannot execute.
6. Run end-to-end authentication and authorization tests.
7. Publish operational runbook and recovery procedure.

Acceptance:
- A supported tool can execute the approved Runner workflow end-to-end.
- Identity, permissions and audit evidence are correct.
- All v1.0 acceptance criteria in the Design Specification pass.

## 4. Proposed file impact matrix

| Path | Planned change | Phase | Current authorization |
|---|---|---:|---|
| `docs/GAS_TEST_RUNNER_DESIGN_SPEC_v1.0.md` | New design document | 0 | Approved documentation work |
| `docs/GAS_TEST_RUNNER_IMPLEMENTATION_PLAN_v1.0.md` | New implementation plan | 0 | Approved documentation work |
| `proxy/worker.js` | Dedicated authenticated Runner route | 2 | Not authorized |
| `backend/TestRunner.gs` | New Runner module | 3 | Not authorized |
| `backend/Code.gs` | Minimal dispatch only if required | 3 | Not authorized |
| Existing test modules | Prefer no changes; adapters only if needed | 3 | Not authorized |
| Classroom database schema | No change planned | — | Prohibited without separate approval |
| Frontend / LIFF | No change planned | — | Out of scope |
| `main` / Production | No change | — | Out of scope |

## 5. Test and acceptance matrix

| Area | Required evidence | Release condition |
|---|---|---|
| Worker route isolation | Existing proxy regression | No existing behavior regression |
| Client authentication | Valid/invalid signature tests | Invalid requests rejected |
| Worker-to-GAS authentication | HMAC test vectors | GAS independently verifies |
| Replay protection | Reused nonce/requestId tests | No duplicate execution |
| TEST-only guard | Wrong/missing spreadsheet tests | Fail closed |
| Static registry | Unknown function/suite injection tests | Arbitrary calls impossible |
| Permission boundary | Owner/Operator/Viewer tests | Least privilege enforced |
| Write approval | Valid/invalid/expired/reused approval tests | Only approved suite executes |
| Side effects | Before/after data and trigger checks | No unintended mutation |
| Result contract | Status normalization tests | No implicit PASS |
| Audit | Required fields and redaction | Traceable, no secrets/PII |
| Runtime | Timeout/concurrency/quota tests | Bounded and deterministic |
| ChatGPT integration | Authenticated end-to-end tool test | Tool connectivity proven |

## 6. Rollback and incident handling

- Worker rollback: restore the last known-good Worker deployment version; do not modify GAS or Classroom data during rollback.
- GAS rollback: restore only the verified GAS TEST source backup and only after Project Owner approval. Never copy TEST rollback artifacts into Production.
- Credential compromise: disable Runner route or revoke the relevant key immediately; rotate client and Worker-to-GAS keys independently.
- Replay or unexpected writes: disable affected suite, preserve audit evidence, stop further executions, identify exact fixture ownership and obtain Owner approval before cleanup.
- Route regression: restore prior Worker version and confirm existing Classroom proxy behavior.
- Do not delete execution logs or audit evidence during incident response.

## 7. Required decisions before Phase 2

The following are implementation details to finalize during Phase 1, not policy changes:
1. Which supported MCP/API tool integration will invoke the Worker.
2. Exact client authentication method and key rotation method.
3. Exact HMAC canonicalization and key version format.
4. Replay nonce storage and retention.
5. Runner audit storage location and retention.
6. Whether existing GAS dispatcher supports a safe isolated action or requires a minimal explicit route.
7. Which initial test functions return structured results and require adapters.
8. Actual GAS execution timeout and concurrency limits under the deployed account.

## 8. Current status

- Design Specification: documented.
- Implementation Plan: documented.
- Documentation changes: permitted on `development`.
- Application Source Code changes: none.
- Worker deployment: none.
- GAS TEST source/deployment changes: none.
- Database changes: none.
- Production or `main` changes: none.
- Runner runtime tests: not executed; Runner has not been implemented.

**Next approval required:** Project Owner approval of Phase 1 source/security review and the final implementation work package. No source-code implementation begins before that approval.


---

## Review Amendment v1.0.1 — 21 November 2026

This amendment is normative and supersedes conflicting statements in the original plan. See `GAS_TEST_RUNNER_SOURCE_SECURITY_REVIEW_2026-11-21.md`. Documentation only; no source implementation or deployment is authorized by this amendment.

### Phase 1 must produce these additional deliverables

1. Exact Worker route/auth design proving Origin/CORS is not used as authentication.
2. Server-side Test Client/MCP authentication approach; no shared secret in ChatGPT prompt or browser.
3. Deterministic HMAC canonicalization contract and known-answer test vectors.
4. Atomic replay/duplicate request strategy, execution lease and stale-lease recovery.
5. Proof that Runner never holds Script Lock while invoking test functions.
6. GAS-side byte-size and strict request schema validation.
7. Exact result adapter for every initial Test Registry entry.
8. Confirmed trust boundary for GAS Script Properties and project editor access.
9. Verified Runner-only replay/audit storage choice; no assumed Cloudflare binding.
10. Explicit plan for direct GAS Web App access and independent GAS signature verification.

### Corrected test risk classification

- L1 pure/in-memory candidates include Assignment submission/scheduler unit tests, Course authorization logic, synthetic identity/role fixtures (in-memory), Offering duplicate predicate, Enrollment import/authorization unit tests and local API missing-token guard.
- L2 candidates include schema preflights and live read-only TEST data checks only after the Runner-level TEST guard is verified.
- Negative tests that invoke create/update handlers are L3 approval-gated unless refactored to prove no mutation path is reachable.
- Persistent fixture, trigger-management, setup/migration and student import functions are excluded from Runner v1.0.

### Revised implementation dependencies

- Worker route isolation must be based on exact pathname and must not broaden the existing Classroom action allowlist.
- Client-to-Worker and Worker-to-GAS credentials must be separate.
- GAS independently validates HMAC, timestamp, nonce, request ID, schema, byte size and TEST environment before dispatch.
- Replay state claim must be atomic. Script Lock may protect short state changes only and must be released before test invocation.
- Worker validates/sanitizes Runner response; no raw stack traces or personal data.
- The current ChatGPT session has no verified generic authenticated HTTP action for this Worker. Phase 6 remains BLOCKED until a supported authenticated tool integration is proven; an approved server-side Test Client may be used for a controlled pilot.

### Revised release gates

1. Source and configuration review complete.
2. Threat model and security tests approved.
3. Worker route regression passes without changing existing Classroom behavior.
4. GAS rejects unauthenticated, malformed, oversized, replayed and wrong-environment requests.
5. Static Registry prevents arbitrary function invocation.
6. L0/L1/L2 result adapters pass and no unexpected side effects occur.
7. L3 approval workflow passes negative tests before any Write Test is enabled.
8. ChatGPT tool connectivity is demonstrated, or release is explicitly limited to a separately authenticated operator client.

