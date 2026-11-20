# Engineering Audit & Gap Register — SPORT NUTRITION CLASSROOM
วันที่ตรวจสอบ: 20 พฤศจิกายน 2569
Branch: `development`
Baseline: DOCS v1.3 + approved CR-001 + approved CR-002
Audited HEAD before this report: `ff1b073e327f9f9f232cfcca889f62f280007c8b`

## 1. Executive result

The current repository is a working foundation for authentication/account linking, course/semester/offering administration, assignment management (including the approved CR-001 scheduler), and student import/enrollment (CR-002). It is not yet an end-to-end MVP implementation.

The audit confirms:
- JavaScript parser checks passed for the five backend files, four HTML inline scripts, two shared JavaScript files and the Worker source (Worker export normalized for the parser).
- Isolated source-level unit harness: 68/68 checks passed across authentication guard, course authorization, duplicate-offering predicate, assignment configuration, scheduler logic, enrollment import and enrollment authorization.
- The owner-provided real-time scheduler evidence remains PASS 2/2 and cleanup PASS, as recorded in the existing scheduler evidence file.
- No deployed TEST spreadsheet, LINE LIFF, Cloudflare Worker, Drive or LINE Messaging API integration test was performed during this audit.
- No schema migration, live data write, deployment, Production action or fixture creation was performed.

**Readiness assessment:** Source foundation and selected pure business rules are internally consistent at the tested level. The MVP is not ready for end-to-end UAT or Production because several core MVP modules and their data/API/UI layers are not implemented in the current repository.

## 2. Source inventory and traceability

### Backend files

| File | Current blob SHA | Observed responsibility |
|---|---|---|
| `backend/Code.gs` | `845936d02880cf457d7f4e2bbb2ec466b0cb77c4` | API router, LINE ID token verification, account linking and email change |
| `backend/CourseManagement.gs` | `52a7f4049ff51772226fe33369cc26a0acb02a1b` | Course, semester, offering, instructor and role/scope checks |
| `backend/AssignmentManagement.gs` | `66d16e04708a3eac41b94bfca24b252f37d47cb1` | Assignment CRUD, manual open/close, schedule rules and TEST scheduler |
| `backend/EnrollmentManagement.gs` | `8c487d5e09d80c567de157fcf6885bbe1c7155fe` | Preview/execute/result, enrollment listing/status and import recovery |
| `backend/setup.gs` | `fc00c98986102a6ac0d19025f5f6cdbf82dbafb5` | Spreadsheet setup and legacy staging import |

### Frontend and proxy

| File | Current blob SHA | Observed responsibility |
|---|---|---|
| `index.html` | `2e727e07d47725343619f5b5e70807f3469620ec` | Landing page and LIFF initialization |
| `student/index.html` | `8a9275ebe27cd63cbdae8290c2237d94403adc31` | LINE identity, account linking and email change UI |
| `instructor/index.html` | `87c11f7478fe84d7fc6187897adc02a96b082e49` | Offering list and assignment management UI |
| `admin/index.html` | `f4ebbfe3ca2a7ba2b518ca0a24c81b22686063bc` | Course, semester, offering and instructor assignment UI |
| `assets/js/app.js` | `8df572065c86e29149a9474c5b92974aaacc3d56` | Shared frontend helpers |
| `assets/js/config.example.js` | `581ef7e40ba8ca8423a2f4edbccc01fdd6d1bc4f` | Example frontend configuration |
| `proxy/worker.js` | `725c25b5b4a814fa11ee6d1223a3cd92d193a095` | Cloudflare Worker API proxy source; not deployed/verified |

## 3. Requirement-to-implementation assessment

Status meanings:
- IMPLEMENTED IN SOURCE: relevant backend/frontend source exists; does not imply deployed E2E verification.
- PARTIAL: only a subset of the workflow is present.
- NOT IMPLEMENTED IN CURRENT REPOSITORY: no corresponding module/API/UI implementation was found in the audited project tree.
- NOT VERIFIED: environment or evidence required.

| MVP area (DOC-01 / DOC-02) | Backend/API | Frontend | Assessment |
|---|---|---|---|
| LINE authentication and account binding | Present in Code.gs | Student portal present | PARTIAL; live LINE token/LIFF verification pending |
| User and Role Management | Role resolution and bootstrap code present | No complete user/role administration UI found | PARTIAL |
| Course/Semester/Offering | Present | Admin UI present | IMPLEMENTED IN SOURCE; deployed scope tests pending |
| Instructor assignment | Present | Admin UI present | IMPLEMENTED IN SOURCE; deployed scope tests pending |
| Student Import/Enrollment | CR-002 backend present | No Import Preview/Execute UI or Excel/CSV parser found in Admin UI | PARTIAL |
| Assignment Management | Present | Instructor UI present | IMPLEMENTED IN SOURCE; deployed regression pending |
| Assignment scheduled open/close | CR-001 backend/trigger present | Schedule UI exists in Instructor source | IMPLEMENTED IN SOURCE; trigger evidence recorded, browser E2E pending |
| Group Management | No GroupManagement backend file/API routing | No functional Group UI found | NOT IMPLEMENTED IN CURRENT REPOSITORY |
| Individual/Group Submission | No Submission API routing/module | No submit workflow in Student portal | NOT IMPLEMENTED IN CURRENT REPOSITORY |
| File Upload / Drive access | No file API module | No file submission UI | NOT IMPLEMENTED IN CURRENT REPOSITORY |
| Submission Tracking / Revision History | No module/schema in setup | No student history UI | NOT IMPLEMENTED IN CURRENT REPOSITORY |
| Grading / Feedback / Grade History | No grade API module | No grading UI | NOT IMPLEMENTED IN CURRENT REPOSITORY |
| Grade Review Request | No API/module | No student/reviewer UI | NOT IMPLEMENTED IN CURRENT REPOSITORY |
| LINE notifications / notification logs | No notification API/module in router | No notification management UI | NOT IMPLEMENTED IN CURRENT REPOSITORY |
| Audit Log | appendAudit_ used in current modules | No complete audit viewer found | PARTIAL; read-only integrity audit exists |
| Cross-module UAT | No complete integration suite | Not demonstrated | NOT VERIFIED |

The absence finding is limited to the current repository tree and inspected files; it does not claim that no separate unpublished implementation exists elsewhere.

## 4. Findings and risk register

### F-01 — MVP core modules absent from current repository
Severity: HIGH
Evidence: backend directory currently contains Code.gs, CourseManagement.gs, AssignmentManagement.gs, EnrollmentManagement.gs and setup.gs only. API router dispatches auth, course/semester/offering/instructor, import/enrollment and assignment actions. No group, submission, file, grade, grade-review or notification route is present.
Impact: Core acceptance criteria in DOC-01/DOC-02 cannot be demonstrated end-to-end.
Recommendation: Keep these modules as separate implementation work packages. Use DOC-02 and approved clarifications as requirement basis; do not treat DOC-03–DOC-08 draft workflows as independently approved policy where they conflict or leave decisions unresolved.

### F-02 — CR-002 has backend but no Import UI/file parser
Severity: HIGH
Evidence: CR-002 explicitly states file parsing and Admin/Coordinator UI are separate implementation tasks. Admin frontend currently calls course/semester/offering/instructor APIs, not import.preview/import.execute/import.result.
Impact: Student import cannot be completed through the current user interface.
Recommendation: Implement the approved CR-002 UI/parser only after the existing TEST backend and schema preflight pass. Preserve normalized payload and 1–500 row limit.

### F-03 — Legacy staging import path is not equivalent to CR-002
Severity: HIGH
Evidence: `setup.gs` still contains `importStudentsFromStaging()`, which reads EMAIL/DISPLAY_NAME/STUDENT_ID and appends Users directly. It does not create Enrollments, ImportJobs, ImportErrors or the CR-002 audit trail. It parses Thai name prefixes and has a separate duplicate/skip rule.
Impact: Running this legacy function could create Users without offering enrollment and bypass the approved CR-002 workflow.
Recommendation: Do not run this function. Retain for now to avoid an unapproved deletion/change; mark it legacy/deprecated in operational instructions. A future removal/disable change should be isolated and approved if required.

### F-04 — Idempotency Key contract is not implemented in the API router
Severity: HIGH
Evidence: DOC-08 describes optional `idempotencyKey`; current `doPost` reads `requestId` and `action` but does not read or enforce `idempotencyKey`. Course Management's read-only duplicate test explicitly reports that RequestID is logged, not an idempotency key, and that duplicate business keys are rejected.
Impact: Repeating a non-duplicate state-changing request may execute more than once; duplicate business-key validation is not general idempotency.
Recommendation: Do not claim idempotent API behavior. Treat this as a design/implementation gap requiring an approved IdempotencyKeys storage/retention/replay policy before code/schema changes. No schema was changed in this audit.

### F-05 — Frontend/API coverage is limited to implemented modules
Severity: HIGH
Evidence: Student portal currently invokes auth/account-linking actions; Instructor portal invokes auth.me, offering.list and assignment actions; Admin portal invokes auth.me and course/semester/offering/instructor actions. No Group, Submission, Grading, Grade Review or Notification UI calls exist.
Impact: Core student/instructor workflows are not available in the current frontend.
Recommendation: Build module UI only after corresponding backend APIs and authorization tests are complete.

### F-06 — Cloudflare Worker proxy is source-only
Severity: MEDIUM
Evidence: Worker source and deployment instructions exist. Proxy README states Cloudflare account access is not connected and deployment URL must be obtained from Cloudflare Dashboard. Frontend source has not been switched to a verified Worker URL.
Impact: CORS/redirect behavior and actual LIFF-to-GAS transport remain unverified.
Recommendation: Do not change frontend endpoints or claim proxy availability until a TEST Worker is deployed, configured with a TEST GAS URL, and smoke-tested for allowed/denied origins, request body limits, redirects and JSON response behavior.

### F-07 — TEST editor project synchronization must be checked
Severity: HIGH
Evidence: GitHub source contains `verifyAssignmentSchedulerTriggerFixtures()` in AssignmentManagement.gs. The previous editor workflow described a renamed `verifyAssignmentSchedulerTriggerFixtures_ReadOnly`; the repository does not currently contain that renamed function. Current repository audit found no duplicate top-level function names across the five backend files.
Impact: Apps Script editor code may differ from the GitHub source. Deploying without reconciliation could run stale or conflicting functions.
Recommendation: Compare each Apps Script editor file against the repository blob SHAs before TEST deployment. Do not run fixture creation again; the prior scheduler batch has been cleaned up and recorded.

### F-08 — Data Integrity checks cover only current implemented tables
Severity: MEDIUM
Evidence: `testDataIntegrityAuditLogReadOnly()` checks schema, selected unique keys, selected foreign-key references and AuditLogs metadata for Users, LINEAccounts, UserRoles, Courses, Semesters, CourseOfferings, CourseInstructors and AuditLogs. Enrollment-specific schema preflight exists, but live execution has not been evidenced in this audit.
Impact: Group, Submission, Grade, File, Notification and Idempotency integrity constraints are not testable until those modules/tables exist.
Recommendation: Extend integrity test cases only when the relevant approved schema is implemented. Do not create tables in this work package.

### F-09 — API/Design documents DOC-03–DOC-08 carry Draft status
Severity: REVIEW REQUIRED
Evidence: DOC-03 System Workflow, DOC-04 System Architecture, DOC-05 Database Design, DOC-06 Permission Matrix, DOC-07 UI/UX and DOC-08 API Specification in the DOCS v1.3 package are labelled Draft — Pending Design Approval. DOC-02 is the approved requirements baseline; CR-001 and CR-002 are separately approved changes.
Impact: Some workflow, role, data retention, grade-review and notification details remain open and cannot be silently treated as approved implementation policy.
Recommendation: Use the requirements and explicitly approved CRs for work. For unresolved policies, produce a decision register rather than inventing behavior.

### F-10 — Enrollment preflight does not independently enforce TEST spreadsheet identity
Severity: MEDIUM
Evidence: `testEnrollmentSchemaPreflight()` calls `emSchemaPreflight_()` and returns the active spreadsheet name; unlike several other test helpers, it does not compare the active spreadsheet ID with the known TEST spreadsheet ID.
Impact: A user could accidentally run a read-only schema inspection against another bound spreadsheet. The test itself performs no writes, but environment labeling is weaker.
Recommendation: Before any live Apps Script test, verify the active spreadsheet ID manually. Consider adding a TEST ID guard to the preflight helper in a separate safe code change; no live environment was available to validate that change in this audit.

## 5. Security and data integrity review

Positive controls observed in source:
- LINE ID token is verified server-side against LINE's verify endpoint using configured channel ID.
- Client-supplied role is not used as the source of authorization; backend resolves linked account and effective roles.
- Course/Offering access uses backend scope predicates.
- Enrollment and assignment mutating handlers use ScriptLock.
- Student import revalidates current Users/Enrollments under ScriptLock and attempts compensating recovery for created IDs.
- Error responses avoid returning stack traces; doPost logs safe diagnostic metadata rather than request payloads or ID tokens.
- Worker source uses an explicit allowed Origin and action allowlist, caps request body size, validates upstream GAS URL host/path and avoids logging request bodies.

Limitations:
- Static inspection does not establish correct deployed Script Properties, bound spreadsheet, Drive permissions, LINE channel configuration, Worker deployment or quota behavior.
- The Worker CORS allowlist is not authentication; backend ID token and role/scope checks remain mandatory.
- A code-pattern secret scan is not a full secret-scanning service or proof that no credential was ever committed.
- No actual Drive file-access control was tested because file APIs are absent.

## 6. Work performed and not performed

Performed:
- Source inventory and branch/HEAD verification.
- DOCS v1.3 and CR-001/CR-002 requirement review.
- Backend/frontend API coverage inventory.
- Duplicate top-level function declaration audit across five backend files.
- JavaScript parser checks.
- Isolated source-level unit harness described in the companion evidence file.
- Gap/risk register and test plan preparation.

Not performed:
- No TEST spreadsheet reads/writes from Apps Script runtime.
- No setup/migration function execution.
- No deployed TEST API call or Browser/LINE LIFF E2E.
- No Cloudflare deployment or GAS deployment.
- No Production access/change.
- No schema, permission, API or business-rule changes.
- No scheduler fixture creation or cleanup rerun.

## 7. Recommended next work sequence

1. Confirm Apps Script editor source matches GitHub `development` SHAs.
2. Run TEST-only read-only schema/preflight and authorization/data-integrity functions.
3. Run synthetic deployed TEST API cases for authentication, course scope, assignment and import preview.
4. Complete CR-002 Import UI/parser.
5. Implement Group and Submission/File modules against approved requirements, with group-specific lock semantics and individual-submission independence.
6. Implement submission history/tracking and group status.
7. Implement Grade/Grade History and basic Grade Review only after unresolved role/status decisions are resolved.
8. Implement Notification sending/logging/retry and verify quota/failure recovery.
9. Implement API idempotency only after its storage/replay policy is approved.
10. Complete Browser/LIFF E2E, security regression and cross-module tests before any Production gate.

## 8. Git and delivery

This audit report is source/documentation work only. It does not change application runtime code or database schema. It is committed to `development`; see the Git commit containing this file.
