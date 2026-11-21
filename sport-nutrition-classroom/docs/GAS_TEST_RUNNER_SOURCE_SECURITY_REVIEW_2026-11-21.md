# SPORT NUTRITION CLASSROOM — GAS Test Runner Source & Security Review

- Document ID: SNC-TEST-RUNNER-SSR-001
- Review date: 21 November 2026
- Review type: Static Source Code Review + Security Design Review
- Status: Review completed; design amendments required before implementation
- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development`
- Reviewed HEAD: `22f5a9f85ea5ba21a118769d37ac7ff4f371da46`
- No application source code, Worker deployment, GAS deployment or database was modified.

## 1. Executive conclusion

**Decision: Do not begin implementation from the current Design Specification unchanged.** The approved policy choices remain valid (Owner-only control, per-suite Write Test approval, reuse existing Cloudflare Worker), but the technical design needs specific amendments before code work.

The main blockers are:
1. The current Worker uses Origin/CORS checks but has no authenticated Runner caller identity.
2. The current GAS `doPost(e)` has no Runner-specific authentication or `test.run` dispatch.
3. HMAC/replay design needs an explicit server-side client integration, canonical signing format, replay-state strategy and GAS-side request-size/schema validation.
4. Several test functions described as read-only invoke mutation-capable handlers. They must be classified by failure-mode side effects, not only their expected successful path.
5. Runner concurrency control must not hold the Apps Script Script Lock while invoking tests that may acquire the same Script Lock.

The review is static. No GAS runtime tests, Cloudflare deployment settings, secret values, Worker bindings, live spreadsheet data or GAS deployment configuration were accessed. No runtime pass/fail is claimed.

## 2. Review baseline and source fingerprints

### 2.1 GitHub baseline

- `development` HEAD: `22f5a9f85ea5ba21a118769d37ac7ff4f371da46`
- Source of Truth: `development`
- `main` and Production: not accessed or modified.

### 2.2 Files reviewed

| File | Blob SHA | Review focus |
|---|---|---|
| `backend/Code.gs` | `845936d02880cf457d7f4e2bbb2ec466b0cb77c4` | doPost dispatch, request parsing, auth, errors, account-linking tests |
| `backend/AssignmentManagement.gs` | `25be673a0f56425d925f52b3ec979aee24672622` | Assignment handlers, locks, unit/schema/integration tests |
| `backend/CourseManagement.gs` | `52a7f4049ff51772226fe33369cc26a0acb02a1b` | role/scope handlers, test functions, negative authorization tests |
| `backend/EnrollmentManagement.gs` | `a4ccfc11c4825155aa0732de6460cc4ac1c705db` | import handlers, schema checks, pure tests |
| `backend/setup.gs` | `fc00c98986102a6ac0d19025f5f6cdbf82dbafb5` | schema creation/migration and staging import side effects |
| `proxy/worker.js` | `725c25b5b4a814fa11ee6d1223a3cd92d193a095` | Origin/CORS, action allowlist, request validation, GAS proxy |

Also reviewed:
- `WORKING_GUIDELINES.md` v1.0.0.
- DOCS v1.3 bundle: Project Charter, Requirements Specification, System Workflow, System Architecture, Database Design, Permission Matrix, UI/UX Specification, API Specification and Change Log.
- `GAS_TEST_REGRESSION_MODULE_TEST_PLAN_2026-11-21.md`.
- `GAS_TEST_RUNNER_DESIGN_SPEC_v1.0.md`.
- `GAS_TEST_RUNNER_IMPLEMENTATION_PLAN_v1.0.md`.

### 2.3 Governing project rules confirmed

- `development` is the development Source of Truth.
- No changes to `main` or Production.
- Do not change DOCS v1.3 requirements, Classroom API contract, business rules or database schema without an approved Change Request.
- Do not place student personal data or secrets in GitHub, Frontend or logs.
- Do not use real student accounts for testing without approval.
- Do not alter existing TEST/Production data without a bounded approved plan.
- Source changes require current SHA checks, scoped diffs, tests and traceable commits.

The extracted DOC-02 identifies the requirements baseline as approved. DOC-04, DOC-06 and DOC-08 display a “Draft — Pending Design Approval” status in their individual headers within the supplied bundle, while WORKING_GUIDELINES identifies DOCS v1.3 as the approved project baseline. This metadata inconsistency should be resolved in document governance; this review does not change product requirements based on it.

## 3. Findings by severity

### Critical — must resolve before any Runner endpoint is enabled

#### SSR-CRIT-01: Existing Worker Origin validation is not authentication

Evidence:
- `worker.js` checks `Origin === ALLOWED_ORIGIN` before accepting requests.
- It allows POST/OPTIONS and validates content type, body size, JSON and Classroom action regex.
- It has no caller identity verification, bearer token validation, HMAC client signature, OAuth/JWT verification or per-client authorization.
- Origin is a browser CORS signal, not a credential. Non-browser clients can set an Origin header themselves; CORS does not prevent direct HTTP clients from calling the endpoint.

Impact:
- Reusing the current Worker route as a Runner gateway without adding authentication would allow an unauthenticated caller to attempt Runner requests.
- Do not infer caller identity from the GitHub Pages Origin.

Required correction:
- Add a separate Runner path (for example `/runner/v1`) with independent authentication and authorization.
- Route selection must use the request URL pathname.
- Preserve the existing Classroom proxy behavior; do not broaden the existing `ALLOWED_ACTION` regex to include `test.run`.
- CORS should be applied only if a browser console is intentionally supported; it must not be the Runner security boundary.
- Client authentication must be verified before the Worker forwards anything to GAS.

#### SSR-CRIT-02: GAS has no Runner dispatch/authentication gate

Evidence:
- `Code.gs` `doPost(e)` parses JSON, extracts `requestId`, `action` and `payload`, and routes known Classroom actions.
- Authentication for current Classroom API action families uses `verifyLiffIdentity_(payload.idToken)`.
- Unknown actions return `NOT_IMPLEMENTED`.
- No `test.run` action, Runner signature verification or Runner permission check exists.
- `doGet()` returns a public READY/version response.
- The existing GAS Web App may be callable directly, bypassing the Worker. The actual deployment access setting was not inspected.

Impact:
- Worker-only authentication is insufficient. A direct caller could bypass the Worker route if the GAS Web App is publicly reachable.
- A Runner route without GAS-side authentication could become a privileged execution surface running as the deployment owner.

Required correction:
- GAS must independently authenticate the Worker-to-GAS request before any Test Registry lookup or test execution.
- The `test.run` branch must be explicit and narrowly scoped.
- The branch must not use LINE student authentication as Runner authentication.
- Enforce a GAS-side request size limit and strict envelope schema because direct calls to GAS may bypass Worker limits.
- Caller-supplied spreadsheet IDs, deployment IDs, GAS URLs, function names and environment overrides must be rejected.
- Keep the current Classroom API authentication and action behavior unchanged.

### High — resolve in detailed design before implementation

#### SSR-HIGH-01: Client-to-Worker credential cannot be held by browser or exposed to ChatGPT prompt

Evidence:
- The current Worker is designed for a browser frontend.
- The proposed Runner needs a privileged non-user operation.
- The current ChatGPT session has no verified generic authenticated HTTP tool for this Worker.

Impact:
- A shared secret placed in GitHub Pages JavaScript, a browser request, prompt text or client-side configuration can be extracted.
- Merely deploying a Worker route does not make it callable from ChatGPT.

Required correction:
- Use a server-side authenticated Test Client/MCP integration. Store its credential only in its server-side secret store.
- ChatGPT should invoke narrow typed operations exposed by that tool; it should not receive the Worker credential or GAS secret.
- If no supported authenticated tool integration can be configured, use a separately authenticated operator client for the pilot and mark ChatGPT automation as BLOCKED.
- Do not implement a generic arbitrary-URL HTTP proxy as a workaround.

#### SSR-HIGH-02: HMAC contract and canonicalization are underspecified

Evidence:
- GAS Web App event handling does not provide a dependable general request-header interface for this design; the supplied DOC-04 explicitly notes Apps Script Web App limitations for header-based webhook signature verification.
- The proposed design places signature metadata in the JSON body.
- No exact canonical serialization, field order, encoding, signature format or key version contract has yet been approved.

Required correction:
- Define a deterministic canonical string using a fixed ordered field list, not unconstrained JSON.stringify of arbitrary objects.
- Signature must cover at least protocol version, action, request ID, timestamp, nonce, suite ID, suite version, environment, approval ID and a digest of the exact validated parameters.
- Exclude the signature field itself from the signed content.
- Reject unknown fields and normalize types before signature verification.
- Use separate secrets for Client-to-Worker and Worker-to-GAS.
- Store Worker secrets in Cloudflare Secrets and GAS verification secret in Script Properties; never put either in GitHub or a response.
- Implement known-answer test vectors and constant-time signature comparison where supported.

#### SSR-HIGH-03: Replay protection and concurrency strategy is not sufficiently specified

Evidence:
- The design proposes nonce/request ID replay protection but does not yet specify the authoritative store, atomic claim, retention, duplicate result semantics or failure recovery.
- Several existing handlers call `LockService.getScriptLock()` and `waitLock(30000)`.

Impact:
- Cache-only or non-atomic replay checks can permit concurrent duplicate execution.
- Holding the Script Lock throughout a Runner execution can deadlock/time out when the invoked test calls a handler that also obtains the Script Lock.
- A timeout after a test begins can leave an execution marked as running.

Required correction:
- Define a concurrency-safe replay claim operation. A duplicate request must not start a second execution.
- Use a short critical section to claim nonce/request ID and create an execution lease; release the Script Lock before invoking any test.
- Never hold the Script Lock while calling registered test functions.
- Release/expire the execution lease in a finally path; define stale-lease recovery for abrupt timeouts.
- Define whether an identical request returns an existing execution status/result or a deterministic duplicate response.
- Evaluate the storage and quota implications of Script Properties, a separate Runner state store or a Cloudflare Durable Object/D1 binding. The existing Cloudflare account bindings were not inspectable, so no specific service is assumed available.
- Fail closed if replay state cannot be updated reliably.

#### SSR-HIGH-04: Existing “read-only” security tests can reach write-capable handlers

Evidence:
- `testSimulatedInstructorNegativeAuthorization()` calls `course.create`, `semester.create` and `offering.update` handlers expecting FORBIDDEN.
- `testInstructorDataScopeIsolation()` calls `offering.update` expecting FORBIDDEN.
- `testCourseCoordinatorScopeIsolation()` invokes negative `offering.update` handler paths.
- `testSystemAdminAuthorizationAndPermissionBoundary()` invokes `course.create`, `semester.create` and `offering.create` expecting FORBIDDEN.
- `testSecurityRevocationSpoofingAndAudit()` invokes `offering.update` and `course.create` paths expecting denial.
- `testDuplicateRequestAuditConsistencyReadOnly()` invokes `offering.create` three times using a known duplicate business key and expects DUPLICATE.

Impact:
- These tests may be non-mutating when authorization/duplicate guards work, but if the tested guard regresses, the request may write to the TEST spreadsheet.
- Calling a mutation-capable handler is not intrinsically read-only.

Required correction:
- Classify these tests as guarded negative-mutation tests (L3 / approval-gated), or refactor into pure predicate/handler tests using in-memory stubs that cannot write.
- Do not include them in the initial automatic L2 read-only suite.
- If retained as L3, require a dedicated fixture/target, a before/after integrity snapshot, an explicit per-suite Owner approval and a verified cleanup plan.
- For duplicate create tests, use a disposable isolated test fixture and ensure a failed duplicate guard cannot create a persistent uncontrolled record.

#### SSR-HIGH-05: TEST environment guard is inconsistent across test functions

Evidence:
- Assignment schema preflight explicitly checks the active spreadsheet ID.
- Course schema preflight checks headers but has no TEST spreadsheet ID check.
- Course live authorization data reads the active spreadsheet without its own TEST ID guard.
- Enrollment schema preflight calls `emSchemaPreflight_()` and reports active spreadsheet name; it has no TEST ID guard.
- Pure unit tests do not need to read a spreadsheet, but some test functions still call `getActiveSpreadsheet()` as a guard.

Required correction:
- Runner-level TEST environment guard must run before every database-backed test.
- For database-backed tests, use a configured TEST spreadsheet ID from trusted server-side configuration and verify the actual spreadsheet ID before reading.
- Do not trust a caller-provided spreadsheet ID.
- Prefer a TEST-specific explicit open/binding method that does not silently fall back to an active Production spreadsheet.
- Keep pure in-memory tests separable from database-backed tests, but still execute them only through the authenticated Runner project/deployment.
- Add independent TEST guards to database-backed test functions where practical; the Runner guard is not a substitute for defensive checks in high-risk tests.

#### SSR-HIGH-06: Script Properties are not isolated from trusted script editors

Evidence:
- Current modules use `PropertiesService.getScriptProperties()` for LINE channel ID, OTP pepper and scheduler configuration.
- Any person with sufficient Apps Script project edit access can add/run code in that project and may be able to read Script Properties through script execution.

Impact:
- HMAC secret in Script Properties is protected from ordinary API callers but not from an untrusted GAS Editor collaborator with code execution rights.

Required correction:
- Keep Runner Owner as the only GAS project editor unless a separate trusted editor is explicitly approved.
- Review current GAS project sharing and deployment execute-as/access settings before adding Runner secrets.
- Do not claim Script Properties protect secrets from project editors.
- Rotate any Runner secret if editor access is broadened or compromised.

### Medium — resolve before v1.0 release

#### SSR-MED-01: Test result contracts are inconsistent

Evidence:
- Assignment unit tests return objects with `success`, `passed`, `failed`, `total` and per-case `result`.
- Course authorization unit test returns per-case PASS/FAIL strings.
- Enrollment import unit test returns per-case booleans under `pass`.
- Enrollment authorization predicate unit test returns booleans under `pass`.
- Preflight tests may throw on missing sheets/schema instead of returning a structured BLOCKED/FAIL result.
- Some tests log results and return an object; a log line alone is not a machine-readable result.

Required correction:
- Create a static adapter for each approved test, mapping its exact return contract to the Runner result schema.
- Do not infer PASS from absence of exception or from a Logger message.
- If required fields are absent or ambiguous, return REVIEW REQUIRED/FAIL rather than PASS.
- Preserve case-level evidence and normalize booleans explicitly.

#### SSR-MED-02: Course test function names do not always reflect actual behavior

Evidence:
- `testSyntheticIdentityAndRoleRevocationFixtures()` uses in-memory synthetic objects and temporarily replaces `cmRows_` in memory; it does not append/update/delete Sheet rows. It does verify the configured TEST spreadsheet before running.
- `testCourseManagementReadEndpointsWithLinkedAdmin()` uses an existing active System Admin role and stored LINE account subject to exercise handler-level list paths. It does not call `doPost` or verify a LINE ID token.
- `testCourseManagementLiveAuthorizationData()` reads live role, course, semester, offering and instructor rows and reports aggregate counts.
- `testCourseManagementPreflight()` performs schema checks but has no explicit TEST ID guard.

Required correction:
- Classify by implementation and data dependency, not function name.
- The synthetic identity test is a candidate L1 in-memory test (subject to confirming all helper calls remain in-memory).
- The linked-admin read endpoint test is L2 and must not be described as full authentication or API E2E.
- Live authorization data is L2 and needs the Runner TEST guard.
- Course preflight needs the Runner TEST guard.

#### SSR-MED-03: Existing requestId is not an idempotency mechanism

Evidence:
- `doPost(e)` accepts caller-supplied `requestId` after length validation.
- DOC-08 describes both `requestId` and `idempotencyKey`.
- The existing duplicate request test explicitly reports that RequestID is logged but is not an idempotency key.
- No Runner replay protection exists.

Required correction:
- Runner requestId and nonce must have a dedicated security purpose and storage lifecycle.
- Do not claim the Classroom API is idempotent because it accepts RequestID.
- Do not change Classroom API idempotency behavior as part of Runner work unless separately approved.

#### SSR-MED-04: Worker forwards the upstream JSON response without a Runner-specific response schema

Evidence:
- Existing Worker parses upstream JSON and forwards `responseBody` directly on successful HTTP responses.
- Error diagnostics expose only limited metadata in the invalid-JSON case, which is appropriate for the existing proxy.
- Runner response must not blindly return logs, stack traces, credentials or personal data.

Required correction:
- Validate the Runner response envelope and sanitize all result/error fields at the Worker boundary.
- Bound result size and per-test detail count.
- Keep stack traces and sensitive diagnostics in restricted audit storage, not caller response.

#### SSR-MED-05: GAS request body size validation is absent in current dispatcher

Evidence:
- Worker enforces a 65,536-byte body limit.
- Current `doPost(e)` checks only that postData.contents exists and parses as JSON; it does not independently enforce a byte limit.

Required correction:
- Enforce a smaller Runner-specific byte limit at GAS before parsing/dispatch.
- Worker and GAS limits must be consistent.
- Direct GAS requests must not bypass the Runner limit.

#### SSR-MED-06: Setup functions are not eligible Runner tests

Evidence:
- `setupAccountLinkingSheets()` can create sheets, rename an empty Sheet1, add columns in specific migrations, format headers and update Script Properties.
- `importStudentsFromStaging()` reads staging data and can append user records.
- Both are setup/administrative operations, not tests.

Required correction:
- Do not register either function in the Test Registry.
- Keep setup/migration and data import out of Runner v1.0.

## 4. Test function side-effect classification

Classification is based on source implementation inspected at the reviewed commit. It is not runtime evidence.

### 4.1 Candidate initial L0/L1/L2 tests

| Function | Source behavior | Proposed level | Conditions |
|---|---|---:|---|
| `testAssignmentSubmissionConfigUnit()` | In-memory validation cases; no Sheets writes | L1 | Candidate after result adapter |
| `testAssignmentManagementSchemaPreflight()` | Reads schema/row count; explicit TEST spreadsheet guard | L0/L2 | Candidate; classify as L2 because it reads DB |
| `testAssignmentSchedulerLogicUnit()` | Logic/date cases; no database writes expected | L1 | Candidate after confirming utility dependencies |
| `testCourseManagementPreflight()` | Reads required sheet headers; no TEST ID guard | L2 | Candidate only behind Runner TEST guard |
| `testCourseManagementAuthorizationLogic()` | In-memory actor/scope cases; temporarily stubs and restores `cmRows_` | L1 | Candidate; ensure restoration remains in finally |
| `testCourseManagementLiveAuthorizationData()` | Reads live TEST role/course/semester/offering/instructor rows | L2 | Candidate behind TEST guard; aggregate output only |
| `testCourseManagementReadEndpointsWithLinkedAdmin()` | Uses existing linked admin identity and read handlers | L2 | Conditional on existing fixture; handler-level only, not LINE-token E2E |
| `testSyntheticIdentityAndRoleRevocationFixtures()` | In-memory synthetic user/account/role objects; temporary in-memory `cmRows_` override | L1 | Candidate; TEST guard currently present |
| `testDataIntegrityAuditLogReadOnly()` | Reads TEST schema, keys, references and audit metadata; explicit TEST ID guard | L2 | Candidate; confirm response remains aggregate and contains no identifiers |
| `testOfferingDuplicatePredicateUnit()` | In-memory duplicate predicate cases | L1 | Candidate |
| `testEnrollmentImportLogicUnit()` | In-memory normalization/conflict checks | L1 | Candidate |
| `testEnrollmentAuthorizationPredicatesUnit()` | In-memory role predicate checks | L1 | Candidate; adapt boolean `pass` values |
| `testEnrollmentSchemaPreflight()` | Reads active spreadsheet schema; no TEST ID guard | L2 | Candidate only behind Runner TEST guard |
| `testAccountLinkingPreflight()` | Reads account schemas, Script Property presence and aggregate counts/duplicate flags | L2 | Candidate only behind Runner TEST guard; never return IDs/emails/secret values |
| `testApiMissingTokenGuard()` | Calls local `doPost` with missing token; no external request or database write expected | L1 | Candidate for local dispatcher guard; ensure no test.run recursion |
| `testConfiguration()` | Reads whether LINE_CHANNEL_ID exists and logs boolean only | L0 | Optional configuration diagnostic; do not expose secret value |
| `testPostMissingToken()` | Calls deployed Web App URL via UrlFetchApp; no ID token, expected rejection | L2 | Separate smoke test only; requires deployed TEST URL and network/quota approval |

Note: L0 is used for configuration/schema preflight; database-reading preflights are classified L2 even if they do not mutate data.

### 4.2 Guarded negative-mutation tests — exclude from initial automatic L2

| Function | Mutation-capable call path | Proposed treatment |
|---|---|---|
| `testSimulatedInstructorNegativeAuthorization()` | course.create, semester.create, offering.update | L3 approval-gated or refactor to pure handler stubs |
| `testInstructorDataScopeIsolation()` | offering.update against unrelated offering | L3 approval-gated or refactor |
| `testCourseCoordinatorScopeIsolation()` | offering.update negative-scope paths | L3 approval-gated or refactor |
| `testSystemAdminAuthorizationAndPermissionBoundary()` | course.create, semester.create, offering.create | L3 approval-gated or refactor |
| `testSecurityRevocationSpoofingAndAudit()` | offering.update and course.create negative paths | L3 approval-gated or refactor |
| `testDuplicateRequestAuditConsistencyReadOnly()` | offering.create called three times using duplicate business key | L3 approval-gated; do not classify as strictly read-only |

### 4.3 Explicitly excluded persistent fixture/setup tests

| Function | Observed effect | Decision |
|---|---|---|
| `testAssignmentSchedulerIntegration()` | Appends three persistent Assignment fixtures; output says `fixturesPersistent:true`, `cleanupPerformed:false` | Exclude; no Runner registration |
| `createAssignmentSchedulerTriggerFixtures()` | Appends two Assignment fixtures and writes a Script Property marker | Exclude |
| `installAssignmentSchedulerTrigger()` | Writes Script Property, deletes existing matching trigger and creates a time-driven trigger | Prohibited in Runner v1.0 |
| `setupAccountLinkingSheets()` | Creates/renames/formats sheets, can migrate columns and sets Script Property | Prohibited |
| `importStudentsFromStaging()` | Can append student records from staging | Prohibited |
| Any cleanup/deletion function | Not approved or reviewed as part of this pass | Exclude until separately reviewed |

## 5. Detailed architecture review and required corrections

### 5.1 Recommended trust boundaries

1. **ChatGPT to Test Client:** ChatGPT invokes a narrow authenticated tool. No shared secret is placed in prompt, browser or GitHub Pages.
2. **Test Client to Worker:** server-to-server authentication; Worker validates identity and allowed operations.
3. **Worker to GAS:** Worker signs a deterministic, bounded request with a distinct secret.
4. **GAS Runner:** independently verifies signature, timestamp, nonce, TEST environment, static registry and approval.
5. **Test function:** only static references in an approved registry are callable.
6. **Result path:** GAS returns normalized result; Worker validates and redacts; client receives sanitized report.

### 5.2 Route design

- Keep existing Classroom proxy behavior and action allowlist unchanged.
- Route Runner by exact pathname, not by widening the existing action regex.
- The Runner route must authenticate before parsing/executing privileged operations.
- The Runner route must not require a browser Origin to be present; if a browser UI is later added, CORS is supplemental.
- GAS must not accept caller-selected upstream URL, deployment, spreadsheet, function or environment.
- GAS `doPost` should dispatch `test.run` only after Runner authentication; all other current action routes remain unchanged.

### 5.3 Lock design

- Use a short Script Lock critical section only for atomic replay/lease state transitions.
- Release Script Lock before invoking any test function.
- Use a Runner execution lease with expiry and explicit state (QUEUED/RUNNING/COMPLETED/FAILED/BLOCKED).
- Ensure all completion paths release/expire the lease.
- Add a test that invokes a test function which itself acquires Script Lock, proving no lock is held by Runner during dispatch.
- Do not assume a single Apps Script Lock can be nested or re-entered.

### 5.4 Test Registry and adapters

- Registry uses fixed Test IDs mapped in source to direct function references.
- Never use `eval`, `Function`, dynamic property lookup from caller input or global function-name invocation.
- Each entry records reviewed source commit, suite version, risk level, side effects, preconditions, timeout, result adapter and enabled flag.
- A test may be registered only after all direct/indirect calls are inspected.
- A test with unknown side effects is disabled.
- Adapter must validate structured return data and case-level outcomes; no result object means no PASS.

### 5.5 TEST isolation and secret custody

- Verify the GAS TEST deployment's project ID, deployment URL, execute-as identity and access setting.
- Verify actual active spreadsheet ID matches the trusted TEST ID.
- Do not rely solely on the Worker `GAS_API_URL` variable.
- Store HMAC key only in Worker Secrets and GAS Script Properties; no source-control values.
- Project Owner remains the only GAS editor unless additional trusted editors are approved.
- The Runner should not need permission to edit Classroom schema or use `setup.gs` operations.

### 5.6 Audit and replay storage decision

No existing Cloudflare Durable Object, D1, KV or audit binding was confirmed from the source code. Worker dashboard bindings and GAS deployment properties are outside repository source and were not accessible.

Before implementation, select and test a store that supports:
- atomic nonce claim,
- duplicate request lookup,
- bounded retention/cleanup,
- execution lease and stale lease expiry,
- restricted audit access.

Do not use eventual-consistency storage as the sole replay defense. Do not add a sheet to the Classroom database without a separate schema approval. A separate Runner-only data store is preferred, subject to verified availability and ownership.

## 6. Revised initial allowlist recommendation

For the first pilot, enable only after adding the global TEST guard and adapters:

**L1 pure/in-memory**
- `testAssignmentSubmissionConfigUnit()`
- `testAssignmentSchedulerLogicUnit()`
- `testCourseManagementAuthorizationLogic()`
- `testSyntheticIdentityAndRoleRevocationFixtures()`
- `testOfferingDuplicatePredicateUnit()`
- `testEnrollmentImportLogicUnit()`
- `testEnrollmentAuthorizationPredicatesUnit()`
- `testApiMissingTokenGuard()`

**L2 read-only data checks**
- `testAssignmentManagementSchemaPreflight()`
- `testCourseManagementPreflight()`
- `testCourseManagementLiveAuthorizationData()`
- `testCourseManagementReadEndpointsWithLinkedAdmin()` (conditional)
- `testDataIntegrityAuditLogReadOnly()`
- `testEnrollmentSchemaPreflight()`
- `testAccountLinkingPreflight()` (conditional; aggregate output only)

Do not enable L2 tests until Runner proves the exact TEST spreadsheet binding. Do not enable L3 negative-mutation tests or persistent fixture tests in the first pilot.

## 7. Security test matrix required before pilot

| ID | Test | Expected result |
|---|---|---|
| SEC-R01 | Request without Client credential | Worker rejects; GAS not called |
| SEC-R02 | Forged Origin only | Worker rejects |
| SEC-R03 | Invalid/expired Client credential | Worker rejects |
| SEC-R04 | Valid Client credential, invalid Worker-to-GAS signature | GAS rejects |
| SEC-R05 | Tampered suiteId/parameters after signing | GAS rejects |
| SEC-R06 | Expired timestamp | Reject |
| SEC-R07 | Reused nonce | Reject; no second execution |
| SEC-R08 | Reused requestId | Return existing status/result or deterministic duplicate; no second execution |
| SEC-R09 | Unknown suite/Test ID | Reject before function dispatch |
| SEC-R10 | Caller-supplied function name/eval payload | Reject |
| SEC-R11 | Caller-supplied spreadsheet/deployment/GAS URL | Reject |
| SEC-R12 | Wrong TEST spreadsheet ID | BLOCKED; no test function called |
| SEC-R13 | Production environment marker | Reject |
| SEC-R14 | Write Test without approval | Reject |
| SEC-R15 | Expired/reused/wrong-suite approval | Reject |
| SEC-R16 | Operator attempts to approve or change registry | Reject |
| SEC-R17 | Viewer attempts to execute | Reject |
| SEC-R18 | Oversized request directly to GAS | Reject before parse/dispatch |
| SEC-R19 | Worker route regression | Existing Classroom proxy tests unchanged |
| SEC-R20 | Runner invokes a test that uses Script Lock | Completes without lock deadlock |
| SEC-R21 | Test returns undefined/malformed object | Never PASS |
| SEC-R22 | Test exception/timeout | Sanitized FAIL/BLOCKED with audit |
| SEC-R23 | Result contains token/OTP/email/StudentID | Redacted or rejected |
| SEC-R24 | Concurrent duplicate request | At most one execution |
| SEC-R25 | GAS Script Properties secret access by non-owner editor | Verify sharing boundary; do not claim editor isolation |

## 8. Revised file impact plan

| File | Recommendation | Approval |
|---|---|---|
| `proxy/worker.js` | Add exact Runner route and server-side caller auth; preserve current proxy path | Requires Phase 2 approval |
| `backend/TestRunner.gs` | New isolated Runner core, static registry, auth, replay/lease, TEST guard, adapters and audit | Requires Phase 3 approval |
| `backend/Code.gs` | Add only explicit authenticated `test.run` dispatch and GAS-side body-size gate if needed | Requires Phase 3 approval |
| Existing test files | Prefer unchanged; add guards/adapters only when necessary and separately reviewed | Requires file-level diff approval |
| `backend/setup.gs` | No changes; setup/migration functions excluded | Not in scope |
| Classroom schema | No changes | Not authorized |
| Frontend/LIFF | No changes in Runner v1.0 | Not in scope |
| `main` / Production | No changes | Prohibited |

## 9. Unresolved implementation decisions

These cannot be determined from repository source alone:
1. Actual GAS Web App deployment access setting and execute-as identity.
2. Whether GAS TEST deployment URL and spreadsheet binding currently point to the recorded TEST environment.
3. Current Cloudflare Worker Secrets and bindings (values must not be disclosed; verify presence and names only).
4. Whether Cloudflare Durable Objects or D1 are available and already configured.
5. Whether a supported authenticated MCP/API tool can call the Worker from ChatGPT.
6. GAS Script Properties and project-sharing permissions.
7. Current GAS execution quota/time constraints for the deployment account.
8. Whether a separate Runner audit store already exists.

These require read-only configuration verification or Owner-provided access; do not guess values or expose secrets.

## 10. Required amendments to existing Runner Design Specification

Before implementation, revise the Design Specification to:
1. State explicitly that Origin/CORS is not authentication.
2. Define separate Client-to-Worker and Worker-to-GAS credentials and server-side Test Client integration.
3. Define the exact canonical HMAC format and request fields.
4. Add GAS-side byte-size and strict schema validation.
5. Specify atomic replay claim, execution lease and no Script Lock held during test execution.
6. Reclassify negative mutation tests as L3 or refactor them into non-mutating pure tests.
7. Correct initial allowlist to include reviewed pure tests and explicitly exclude guarded negative mutation paths.
8. Add explicit source-editor trust boundary for Script Properties.
9. Add Worker response sanitization and structured result adapters.
10. Record runtime/deployment verification as a release blocker until actual settings are inspected.

## 11. Review outcome and next gate

- Static source review: completed for the listed files and candidate tests.
- Security design review: completed; design amendments required.
- Critical findings: 2.
- High findings: 6.
- Medium findings: 6.
- Runtime verification: not performed.
- Cloudflare dashboard configuration: not inspected.
- GAS deployment configuration: not inspected.
- Source code changes: none.
- Worker deployment: none.
- GAS deployment: none.
- Database changes: none.
- Production/`main`: untouched.

**Next work package:** revise the Runner Design Specification and Implementation Plan to incorporate the findings, then submit the corrected file-level implementation package for Project Owner approval. This review does not authorize any application source-code changes or deployment.
