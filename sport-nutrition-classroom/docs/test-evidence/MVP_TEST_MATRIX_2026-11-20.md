# MVP Test Matrix — SPORT NUTRITION CLASSROOM
วันที่จัดทำ: 20 พฤศจิกายน 2569
Baseline: DOCS v1.3; approved CR-001 and CR-002
Branch: `development`

## 1. Test execution policy

- Use TEST spreadsheet, TEST Apps Script deployment, TEST LINE configuration and synthetic accounts only.
- Verify active spreadsheet ID and deployment URL before any write-capable test.
- No actual student roster, real student account, Production data or Production credentials.
- Tests that create persistent fixtures require a named fixture marker and a separate cleanup plan.
- Do not run `createAssignmentSchedulerTriggerFixtures()` again. The prior scheduler fixture batch was cleaned up and evidence is recorded.
- A local/isolated unit harness is not Apps Script integration or Browser/LIFF E2E.
- DOC-03–DOC-08 are marked Draft — Pending Design Approval in the supplied DOCS v1.3 archive. Test expectations below follow approved DOC-02 and approved CR-001/CR-002 where available. Unresolved workflow policies are marked REVIEW REQUIRED.

## 2. Current test evidence summary

| Level | Result | Interpretation |
|---|---|---|
| JavaScript syntax/parser | PASS for 12 source/script units | Parser check only |
| Isolated source-level unit harness | 68 PASS / 0 FAIL | Extracted current source functions executed with controlled stubs |
| Scheduler deployed TEST trigger | 2/2 PASS, owner-supplied evidence | Real-time trigger fixture test previously executed |
| Scheduler cleanup | PASS, owner-supplied evidence | Two fixtures and two audits removed; one trigger preserved |
| TEST spreadsheet schema/integrity | NOT RUN in this audit | Requires Apps Script TEST environment |
| Deployed TEST API | NOT RUN | Requires synchronized/deployed TEST Web App |
| Browser/LINE LIFF E2E | NOT RUN | Requires actual browser/LIFF session |
| Production verification | NOT RUN / not authorized | Separate approval gate |

## 3. Test cases — Authentication and account linking

| ID | Scenario | Expected result | Preconditions | Status |
|---|---|---|---|---|
| AUTH-001 | Missing ID token on auth.verify | TOKEN_MISSING; no identity granted | None; local doPost guard harness | PASS (4 guard routes) |
| AUTH-002 | Missing token on course.list, semester.list, offering.list | TOKEN_MISSING before action handler | None; local doPost guard harness | PASS |
| AUTH-003 | Invalid signature/token | Backend rejects; no account data returned | TEST LIFF and invalid synthetic token | NOT RUN |
| AUTH-004 | Expired token | TOKEN_EXPIRED / authentication failure | TEST LIFF token expired | NOT RUN |
| AUTH-005 | Token audience/channel mismatch | Reject; no linked role returned | Wrong-channel synthetic token | NOT RUN |
| AUTH-006 | Active LINE link to active User | Resolve linked account and effective roles | Synthetic TEST account | NOT RUN |
| AUTH-007 | Inactive LINE link | No linked account resolved | Inactive TEST record | NOT RUN |
| AUTH-008 | Active LINE link to inactive User | Reject identity resolution | Inactive TEST user | NOT RUN |
| AUTH-009 | Revoked/inactive role | Role absent from effective permissions | Inactive TEST UserRole | NOT RUN |
| AUTH-010 | Duplicate LINE subject linked to another user | Reject with LINE_ALREADY_LINKED | Synthetic TEST identities | NOT RUN |
| AUTH-011 | StudentID/email mismatch during linking | Reject; do not issue successful link | Synthetic TEST account | NOT RUN |
| AUTH-012 | OTP wrong/expired/reused/max attempts | Reject; challenge remains unusable after expiry/consumption | TEST email mailbox | NOT RUN |
| AUTH-013 | Email change confirmation | Only verified linked account email changes; audit written | TEST email mailbox | NOT RUN |

## 4. Test cases — Course, Semester, Offering and Authorization

| ID | Scenario | Expected result | Status |
|---|---|---|---|
| CM-001 | System Admin manages any Course/Semester | Allowed within system role | PASS (pure unit) |
| CM-002 | Course-scoped Coordinator manages assigned Course | Allowed | PASS (pure unit) |
| CM-003 | Course-scoped Coordinator accesses other Course | FORBIDDEN / excluded from list | PASS (pure unit) |
| CM-004 | Semester-scoped Coordinator manages assigned Semester | Allowed | PASS (pure unit) |
| CM-005 | Semester-scoped Coordinator accesses other Semester | FORBIDDEN / excluded from list | PASS (pure unit) |
| CM-006 | Instructor manages Course/Semester | Denied | PASS (pure unit) |
| CM-007 | Instructor sees assigned Offering only | Other Offering excluded | PASS (pure unit) |
| CM-008 | Student sees no administrative Offerings by default | Empty result | PASS (pure unit) |
| CM-009 | Duplicate CourseCode | DUPLICATE | NOT RUN (TEST API) |
| CM-010 | Duplicate Semester AcademicYear/Term | DUPLICATE | NOT RUN (TEST API) |
| CM-011 | Duplicate Offering business key | DUPLICATE; no second Offering | PASS (7 pure predicate cases); deployed test NOT RUN |
| CM-012 | Cross-offering Instructor update | FORBIDDEN; row and audit unchanged | NOT RUN (requires TEST fixture) |
| CM-013 | Unassign Instructor | Status becomes INACTIVE; audit recorded | NOT RUN (TEST API) |
| CM-014 | Suspended user or revoked role calls management API | FORBIDDEN | NOT RUN (TEST API) |

## 5. Test cases — Student Import and Enrollment (CR-002)

| ID | Scenario | Expected result | Status |
|---|---|---|---|
| IMP-001 | Valid normalized row | Accepted in Preview | PASS (pure unit) |
| IMP-002 | Missing StudentID | INVALID_STUDENT_ID | PASS |
| IMP-003 | Missing FirstName | INVALID_FIRST_NAME | PASS |
| IMP-004 | Missing LastName | INVALID_LAST_NAME | PASS |
| IMP-005 | Invalid email | INVALID_EMAIL | PASS |
| IMP-006 | Email normalization | Trim/lowercase consistently | PASS |
| IMP-007 | Existing StudentID with different Email | STUDENT_ID_EMAIL_CONFLICT | PASS |
| IMP-008 | Existing Email with different StudentID | EMAIL_STUDENT_ID_CONFLICT | Logic present; integration NOT RUN |
| IMP-009 | Inactive User | USER_INACTIVE | PASS |
| IMP-010 | Already active Enrollment in same Offering | ALREADY_ENROLLED | PASS |
| IMP-011 | Duplicate StudentID within file | DUPLICATE_STUDENT_ID_IN_FILE | NOT RUN (unit case not currently explicit) |
| IMP-012 | Duplicate Email within file | DUPLICATE_EMAIL_IN_FILE | NOT RUN (unit case not currently explicit) |
| IMP-013 | Preview | Zero writes to Users/Enrollments/ImportJobs/ImportErrors | NOT RUN (deployed TEST API) |
| IMP-014 | Execute with any invalid row | Reject whole batch; no partial business import | NOT RUN |
| IMP-015 | Execute revalidates under ScriptLock | Concurrent duplicate enrollment cannot be created | NOT RUN |
| IMP-016 | Execute creates missing User + Enrollment + ImportJob | Counts and audit match successful rows | NOT RUN |
| IMP-017 | Import Result | Only authorized import operator sees scoped job result | NOT RUN |
| IMP-018 | Cross-offering import/result/roster | FORBIDDEN | NOT RUN |
| IMP-019 | Injected write failure and compensation | FAILED_RECOVERED or RECOVERY_REQUIRED with exact created IDs reconciled | NOT RUN |
| IMP-020 | Instructor without grant imports | FORBIDDEN | PASS (6 pure authorization cases) |
| IMP-021 | Import UI reads Excel/CSV and normalizes rows | Preview payload matches CR-002 contract | NOT IMPLEMENTED / NOT RUN |
| IMP-022 | Legacy staging import is not used | Do not run `importStudentsFromStaging()`; it does not implement CR-002 enrollment workflow | OPERATIONAL HOLD |

Schema checks `testEnrollmentSchemaPreflight()` are read-only but have not been run in the Apps Script TEST runtime for this audit.

## 6. Test cases — Assignment and Scheduler

| ID | Scenario | Expected result | Status |
|---|---|---|---|
| ASN-001 | Individual Assignment has no group limits | SubmissionType INDIVIDUAL; group fields blank | PASS (10 config cases) |
| ASN-002 | Group Assignment enforces MinGroupMembers=2 | Minimum fixed at 2 | PASS |
| ASN-003 | Group max blank means unlimited | Accepted | PASS |
| ASN-004 | Group max below 2, fractional, negative | VALIDATION_ERROR | PASS |
| ASN-005 | Group max supplied to Individual | VALIDATION_ERROR | PASS |
| ASN-006 | Unknown/missing SubmissionType | VALIDATION_ERROR | PASS |
| ASN-007 | Due Date independent of scheduled open/close | Deadline does not change Status | Source rule present; deployed test NOT RUN |
| ASN-008 | Manual Open/Close | Authorized instructor changes status and audit is recorded | NOT RUN (deployed TEST API) |
| ASN-009 | Unauthorized Instructor changes Assignment | FORBIDDEN | NOT RUN |
| SCH-001 | Disabled schedule does not run | No transition | PASS (13 scheduler unit cases) |
| SCH-002 | Enabled past schedule runs | Due event detected | PASS |
| SCH-003 | Future schedule waits | No early transition | PASS |
| SCH-004 | Processed schedule cannot run twice | No repeated transition | PASS |
| SCH-005 | Bangkok local date-time converts correctly | Correct UTC instant | PASS |
| SCH-006 | Invalid calendar date or close <= open | VALIDATION_ERROR | PASS |
| SCH-007 | Changing processed schedule rearms that event only | Processed timestamp cleared for changed event | PASS |
| SCH-008 | Real Auto-Open fixture | OPEN + one audit | PASS (owner-supplied trigger evidence) |
| SCH-009 | Real Auto-Close fixture | CLOSED + one audit | PASS (owner-supplied trigger evidence) |
| SCH-010 | Scheduler fixture cleanup | 2 assignments/2 audits removed; 1 trigger/config preserved | PASS (owner-supplied cleanup evidence) |
| SCH-011 | Manual override after scheduled event | Per CR-001 transition rules | NOT RUN in this audit |
| SCH-012 | Trigger best-effort timing / late execution | Transition occurs at or after due time without promising second-level precision | NOT RUN |
| SCH-013 | TEST scheduler cannot access non-TEST spreadsheet | SAFETY_STOP | Source guard present; no negative live test |

Do not rerun scheduler fixture creation or cleanup. The completed trigger batch is already recorded.

## 7. Test cases — Group Management (not implemented)

| ID | Scenario | Expected result | Status |
|---|---|---|---|
| GRP-001 | Student creates group in enrolled Offering | Group is bound to exactly one CourseOffering | NOT IMPLEMENTED |
| GRP-002 | Non-enrolled Student creates/joins group | ENROLLMENT_REQUIRED / FORBIDDEN | NOT IMPLEMENTED |
| GRP-003 | Student joins a second group in same Offering | Reject; one membership per Student per Offering | NOT IMPLEMENTED |
| GRP-004 | Student leaves group before first submission | Allowed under approved group rules | NOT IMPLEMENTED |
| GRP-005 | Student changes membership after that group's first submission | GROUP_MEMBERSHIP_LOCKED | NOT IMPLEMENTED |
| GRP-006 | One group submits first Assignment | Only that Group becomes locked | NOT IMPLEMENTED |
| GRP-007 | Another group in same Offering has not submitted | Other Group remains editable | NOT IMPLEMENTED |
| GRP-008 | Group has one member and attempts Group Submission | GROUP_MIN_MEMBERS_NOT_MET | NOT IMPLEMENTED |
| GRP-009 | Group has exactly two members | Meets minimum | NOT IMPLEMENTED |
| GRP-010 | Group exceeds Assignment MaxGroupMembers | GROUP_MAX_MEMBERS_EXCEEDED | NOT IMPLEMENTED |
| GRP-011 | MaxGroupMembers is blank | No system-level maximum | NOT IMPLEMENTED |
| GRP-012 | Student without group views Individual Assignment | Individual submission remains available | NOT IMPLEMENTED |
| GRP-013 | Student without group views Group Assignment | Cannot submit Group Assignment; clear explanation | NOT IMPLEMENTED |
| GRP-014 | Non-member tries to select representative or submit | FORBIDDEN | NOT IMPLEMENTED |
| GRP-015 | Concurrent join requests for same Student | No duplicate membership / no multi-group membership | NOT IMPLEMENTED |
| GRP-016 | Group member views group status | Only authorized group members see shared group status | NOT IMPLEMENTED |
| GRP-017 | Representative changes before first submission | Only permitted group members can select representative | NOT IMPLEMENTED |
| GRP-018 | Group membership snapshot at submission | Historical members are traceable | REVIEW REQUIRED against schema draft |

## 8. Test cases — Submission, File Handling and Tracking (not implemented)

| ID | Scenario | Expected result | Status |
|---|---|---|---|
| SUB-001 | Individual Submission | Backend derives StudentUserID from verified identity; ignores spoofed client UserID | NOT IMPLEMENTED |
| SUB-002 | Individual Submission by student without group | Allowed | NOT IMPLEMENTED |
| SUB-003 | Individual Submission by member of locked group | Allowed; independent of Group lock | NOT IMPLEMENTED |
| SUB-004 | Group Submission by valid representative | One group-level Submission | NOT IMPLEMENTED |
| SUB-005 | Group Submission with wrong SubmissionType | INVALID_SUBMISSION_TYPE | NOT IMPLEMENTED |
| SUB-006 | Group Submission by non-member | GROUP_MEMBERSHIP_REQUIRED / FORBIDDEN | NOT IMPLEMENTED |
| SUB-007 | Group Submission with invalid member count | Min/Max validation errors | NOT IMPLEMENTED |
| SUB-008 | Group first submission locks only target Group | Membership lock and Submission write are concurrency-safe | NOT IMPLEMENTED |
| SUB-009 | Duplicate submit request with same Idempotency Key | Original result returned or deterministic duplicate response; no second Submission | REVIEW REQUIRED: policy not implemented |
| SUB-010 | Concurrent submission from two members | At most one initial submission/revision sequence per operation | NOT IMPLEMENTED |
| SUB-011 | Submission after Deadline while Assignment Open | Late/revised status per approved rule | NOT IMPLEMENTED |
| SUB-012 | Submission while Assignment Closed | ASSIGNMENT_CLOSED | NOT IMPLEMENTED |
| SUB-013 | Revision history | RevisionNumber increments; previous submission remains immutable | NOT IMPLEMENTED |
| SUB-014 | SubmittedByUserID and SubmittedAt | Actual authenticated sender and server timestamp recorded | NOT IMPLEMENTED |
| FIL-001 | Valid file type/size upload | Accepted within approved limits | NOT IMPLEMENTED; limits require confirmation |
| FIL-002 | Disallowed MIME/extension or oversized file | FILE_INVALID / reject | NOT IMPLEMENTED |
| FIL-003 | Unauthorized file access | Denied; no public Drive link leakage | NOT IMPLEMENTED |
| FIL-004 | File upload succeeds but metadata write fails | Compensating cleanup or recoverable state | NOT IMPLEMENTED |
| FIL-005 | Drive file sharing | Only authorized owner/group/instructor access | NOT IMPLEMENTED |

## 9. Test cases — Grading and Grade Review (not implemented)

| ID | Scenario | Expected result | Status |
|---|---|---|---|
| GRD-001 | Instructor grades Individual Submission in assigned Offering | Allowed | NOT IMPLEMENTED |
| GRD-002 | Instructor grades Submission outside assigned Offering | FORBIDDEN | NOT IMPLEMENTED |
| GRD-003 | Instructor assigns score outside 0..MaxScore | VALIDATION_ERROR | NOT IMPLEMENTED |
| GRD-004 | Group Assignment grading | Grade applies at group level; members see shared result | NOT IMPLEMENTED |
| GRD-005 | Feedback visibility | Only authorized Student/group and instructor can view | NOT IMPLEMENTED |
| GRD-006 | Grade update | Existing grade history preserved | NOT IMPLEMENTED |
| GRD-007 | Grade change | Old/new score, editor, timestamp and reason recorded | NOT IMPLEMENTED |
| GRD-008 | Student attempts to change grade | FORBIDDEN | NOT IMPLEMENTED |
| GRD-009 | Grade history access by another student | FORBIDDEN | NOT IMPLEMENTED |
| GRV-001 | Student requests review of own grade | Request recorded with reason/time | NOT IMPLEMENTED |
| GRV-002 | Student requests review for another user | FORBIDDEN | NOT IMPLEMENTED |
| GRV-003 | Duplicate active review request | Deterministic duplicate/conflict response | REVIEW REQUIRED |
| GRV-004 | Reviewer status transition | Only authorized role can change status | REVIEW REQUIRED: DOC-03 says final workflow pending |
| GRV-005 | Grade changes after review resolution | GradeHistory and AuditLog consistent | NOT IMPLEMENTED |
| GRV-006 | Reviewer access across offerings | Scope enforced | NOT IMPLEMENTED |

## 10. Test cases — Notifications and Audit

| ID | Scenario | Expected result | Status |
|---|---|---|---|
| NTF-001 | Assignment announced | Eligible enrolled users notified | NOT IMPLEMENTED |
| NTF-002 | 24-hour reminder | Only students without complete submission notified | NOT IMPLEMENTED |
| NTF-003 | Group submission notification | Instructor notified once per group submission | NOT IMPLEMENTED |
| NTF-004 | Instructor submission alert | Correct offering instructor(s) receive alert | NOT IMPLEMENTED |
| NTF-005 | LINE push failure | Submission/grade transaction remains valid; failure logged and retryable | NOT IMPLEMENTED |
| NTF-006 | Duplicate trigger/retry | No duplicate logical notification | REVIEW REQUIRED: idempotency design |
| NTF-007 | LINE quota/rate limit | Retry/backoff and failure state recorded | NOT IMPLEMENTED |
| NTF-008 | Sensitive data in LINE message | No unnecessary personal/grade data disclosed | NOT IMPLEMENTED |
| AUD-001 | Successful state change | Audit event records actor/action/entity/time/request | PARTIAL; existing modules append audit |
| AUD-002 | Denied request | No business data mutation; denial behavior captured | NOT RUN in deployed TEST |
| AUD-003 | Audit DetailsJson malformed | Integrity audit reports failure | NOT RUN in TEST |
| AUD-004 | Audit history edited/deleted | Tamper resistance is not currently proven | REVIEW REQUIRED |

## 11. Security, data integrity and regression cases

| ID | Scenario | Expected result | Status |
|---|---|---|---|
| SEC-001 | Missing token | Rejected before protected handler | PASS (local guard harness) |
| SEC-002 | Client supplies SYSTEM_ADMIN role/UserID | Ignored; server-resolved identity/scope governs | NOT RUN deployed |
| SEC-003 | Instructor accesses unrelated Offering | FORBIDDEN | Pure predicate PASS; deployed NOT RUN |
| SEC-004 | Student changes another StudentID in payload | No data disclosure/change | NOT RUN |
| SEC-005 | Suspended account / revoked role | Denied | Synthetic helper exists; TEST runtime NOT RUN |
| SEC-006 | Error response contains stack trace/token | Must not disclose | Source inspection only |
| SEC-007 | CORS allowed origin | Worker returns configured CORS headers | NOT RUN; Worker not deployed |
| SEC-008 | CORS disallowed origin | HTTP 403, no allow-origin header | NOT RUN |
| SEC-009 | Proxy body exceeds 64 KiB | HTTP 413 | NOT RUN |
| SEC-010 | Proxy upstream invalid/non-JSON | Safe 502 error without body/token logging | NOT RUN |
| DAT-001 | Schema header exact match | Preflight PASS | NOT RUN in Apps Script TEST |
| DAT-002 | Unique primary keys | No duplicate/blank IDs | Source helper exists; TEST runtime NOT RUN |
| DAT-003 | Foreign-key references | All checked references resolve | Source helper exists; TEST runtime NOT RUN |
| DAT-004 | StudentID/email uniqueness | No duplicates | Source preflight exists; TEST runtime NOT RUN |
| DAT-005 | Enrollment unique Offering/User | At most one active Enrollment | API logic present; TEST runtime NOT RUN |
| DAT-006 | Import recovery | Only IDs created by the failed job are compensated | TEST failure-injection NOT RUN |
| REG-001 | Course/Offering CRUD after auth changes | Existing admin/instructor flows remain functional | NOT RUN |
| REG-002 | Manual Assignment Open/Close after scheduler changes | Still authorized and audited | Scheduler evidence covers fixtures; full API regression NOT RUN |
| REG-003 | Due Date remains independent from scheduler | No unintended status transition | Source review only |
| REG-004 | Student account linking after import changes | Existing link workflow remains functional | NOT RUN deployed |

## 12. Next TEST execution order

1. Confirm Apps Script editor files match the GitHub blob SHAs in the audit report.
2. Confirm TEST spreadsheet ID, TEST GAS Web App URL, TEST Script Properties and TEST LINE configuration.
3. Run read-only preflights: account linking, course management, assignment schema/scheduler, enrollment schema.
4. Run pure unit tests in Apps Script and compare against the isolated harness evidence.
5. Run read-only TEST data integrity and live authorization checks.
6. Run deployed API tests using synthetic accounts and a dedicated TEST Offering.
7. Run Import Preview first; verify zero writes before Execute.
8. Only then run controlled import Execute/concurrency/failure-injection tests with a documented fixture and cleanup plan.
9. Complete browser/LIFF tests after proxy/endpoint configuration is verified.
10. Keep unimplemented module cases NOT IMPLEMENTED/NOT RUN until their backend, schema and UI are built.

## 13. Explicit stop conditions

Stop the affected test only if:
- Active spreadsheet ID cannot be confirmed as TEST.
- Script Properties/LINE channel/endpoint cannot be confirmed as TEST.
- Test would use real student data or modify Production.
- A fixture already exists and the test is not idempotent.
- A test's cleanup could delete pre-existing data.
- Expected behavior requires a decision not contained in approved requirements/CRs.

Do not convert BLOCKED, NOT RUN, NOT IMPLEMENTED or REVIEW REQUIRED into PASS.
