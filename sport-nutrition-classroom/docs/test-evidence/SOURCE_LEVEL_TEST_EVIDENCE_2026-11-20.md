# Source-Level Test Evidence — 20 November 2026

Project: SPORT NUTRITION CLASSROOM
Branch: development
Audited source HEAD: `ff1b073e327f9f9f232cfcca889f62f280007c8b`
Execution type: Isolated JavaScript harness using source fetched from the current GitHub branch.

## 1. Result summary

<badge>PASS 68 / FAIL 0</badge>

| Suite | Cases | PASS | FAIL | Evidence level |
|---|---:|---:|---:|---|
| Missing-token API guard | 4 | 4 | 0 | Isolated handler harness; no network call |
| Course authorization logic | 19 | 19 | 0 | Isolated source-level unit harness |
| Offering duplicate predicate | 7 | 7 | 0 | Isolated source-level unit harness |
| Assignment SubmissionType/Group limits | 10 | 10 | 0 | Isolated source-level unit harness |
| Assignment Scheduler logic | 13 | 13 | 0 | Isolated source-level unit harness |
| Enrollment import validation/revalidation | 9 | 9 | 0 | Isolated source-level unit harness |
| Enrollment import authorization | 6 | 6 | 0 | Isolated source-level unit harness |
| **Total** | **68** | **68** | **0** | **Isolated source-level unit harness** |

## 2. Harness method and limitations

- Current source files were fetched from GitHub `development` at the blob SHAs recorded in the companion Engineering Audit report.
- The selected pure functions were executed in a fresh JavaScript function context.
- Minimal stubs were supplied only for external GAS globals required by the tested functions (for example, `apiError_`, `Utilities.formatDate`, `console`, `ContentService`, and a controlled role predicate).
- No Google Sheets, Drive, MailApp, UrlFetchApp, LINE, Cloudflare or deployed Apps Script runtime was called by these tests.
- No database rows, trigger, file or notification were created or modified.
- Therefore these results are not Apps Script runtime integration, deployed TEST API, Browser/LINE LIFF E2E or Production evidence.

## 3. Selected test details

### Missing-token API guard — 4/4
- `auth.verify` returns TOKEN_MISSING.
- `course.list` returns TOKEN_MISSING before course handler.
- `semester.list` returns TOKEN_MISSING before semester handler.
- `offering.list` returns TOKEN_MISSING before offering handler.
- No LINE verification endpoint was called because the token was absent.

### Course authorization — 19/19
Covered system admin and system-scoped coordinator access, course/semester-scoped coordinator access and denial outside scope, instructor/student denial, list filtering, assigned-offering visibility and system-level guard behavior.

### Offering duplicate predicate — 7/7
Covered duplicate active/inactive business key, different course/semester/section, deleted key reuse and empty rows. This is a business-key duplicate predicate test, not proof of general idempotency.

### Assignment submission config — 10/10
Covered Individual with no group limits, Group minimum=2, unlimited maximum, instructor-configured maximum, rejection below 2, fractional/negative maximum, group maximum on Individual, unknown and missing SubmissionType.

### Assignment scheduler logic — 13/13
Covered disabled/past/future/processed schedules, boolean normalization, missing schedule validation, Asia/Bangkok conversion, invalid calendar date, close-before/equal-open, stale timestamp clearing and re-arming behavior.

### Enrollment import logic — 9/9
Covered valid row, missing StudentID/FirstName/LastName, invalid email, email normalization, StudentID/email conflict, inactive User and existing active Enrollment.

### Enrollment authorization — 6/6
Covered System Admin, scoped Course Coordinator, semester-scoped Coordinator, Instructor denial, out-of-scope Coordinator denial and Student denial.

## 4. Additional parser checks

JavaScript parser checks passed for:
- Backend: Code.gs, CourseManagement.gs, AssignmentManagement.gs, EnrollmentManagement.gs, setup.gs.
- Frontend inline scripts: landing page, Student portal, Instructor portal, Admin portal.
- Shared JavaScript: app.js and config.example.js.
- Cloudflare Worker: source parsed after normalizing its ES module `export default` wrapper for the syntax parser.

These checks establish syntax only; they do not establish browser rendering, network behavior, GAS service behavior or Worker runtime behavior.

## 5. Separate owner-supplied Scheduler evidence

The previous real-time trigger test remains separately recorded in:
`docs/test-evidence/ASSIGNMENT_SCHEDULER_TEST_EVIDENCE_2026-11-20.md`

That record contains owner-supplied execution logs:
- Auto-Open fixture PASS.
- Auto-Close fixture PASS.
- Cleanup PASS.
- Trigger count remained 1 and scheduler config was preserved.

This is deployed TEST trigger-level evidence, not included in the 68 isolated harness checks.

## 6. Not run in this work package

- `testAccountLinkingPreflight()` — requires active TEST spreadsheet and Script Properties.
- `testCourseManagementPreflight()` — requires active TEST spreadsheet.
- `testAssignmentManagementSchemaPreflight()` / `testAssignmentSchedulerPreflight()` — requires active TEST spreadsheet and trigger service.
- `testEnrollmentSchemaPreflight()` — requires active Apps Script spreadsheet.
- `testDataIntegrityAuditLogReadOnly()` — requires TEST spreadsheet ID guard to pass.
- `testCourseManagementLiveAuthorizationData()` — requires actual TEST data.
- `testSecurityRevocationSpoofingAndAudit()` — not run because a failed authorization guard could mutate a TEST row; requires snapshot and controlled test preconditions.
- `testDuplicateRequestAuditConsistencyReadOnly()` — requires pre-existing TEST fixture and System Admin record.
- Import Execute, injected write failures, Browser/LIFF E2E, Worker deployment and Production verification.

## 7. Conclusion

The 68/68 result supports only the tested pure logic paths in the fetched source. It does not establish complete MVP acceptance, live TEST database integrity, idempotent API behavior, Group/Submission/Grading/Notification functionality or Production readiness.
