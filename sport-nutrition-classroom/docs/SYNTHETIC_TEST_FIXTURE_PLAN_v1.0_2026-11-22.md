# SPORT NUTRITION CLASSROOM — Synthetic Test Fixture Plan

- Document ID: SNC-TEST-FIXTURE-PLAN-001
- Version: 1.0
- Date: 22 November 2026 (Asia/Bangkok)
- Repository: `worrawutt-source/worrawutsportsci`
- Branch: `development` only
- Requirements baseline: DOC-01 v1.0 and DOC-02 v1.1 (Approved Baseline)
- Operating rules: SNC-WG-001 v1.0.0
- Current schema evidence: owner-run read-only inspection, schemaVersion 1.5.0; visible tables matched declared headers
- Status: **PLAN PREPARED — NOT EXECUTED; fixture creation and cleanup remain gated**

## 1. Purpose and boundaries

This plan defines isolated synthetic data for Functional Integration Tests of authentication-adjacent authorization, course offering, enrollment, Individual/Group Assignment, group membership lock, submission/revision, file handling, grading/review, notification logging, and audit behavior.

All work is restricted to the verified TEST Apps Script project, its TEST spreadsheet, and a private TEST Drive folder. No Production resource, real student account, real student personal data, real LINE push, migration, setup routine, or production deployment may be used.

The plan does not authorize changing the Database Schema, API contract, business rules, source code, or requirements. DOC-03 through DOC-08 are Draft/Pending Design Approval and are not used to override DOC-02. Where a draft workflow/API detail is not settled by DOC-02, the test is marked conditional or deferred.

## 2. Entry gates — all must pass before fixture creation

| Gate | Required evidence | If not met |
|---|---|---|
| G-01 Source synchronization | Fresh GAS export; confirm TEST GAS contains the approved versions of `Code.gs`, `setup.gs`, and `AssignmentManagement.gs`; add the read-only preflight file; retain existing integration runner safeguards | BLOCKED |
| G-02 Compile | All GAS files save and compile without duplicate global declarations (including `SNC_SETUP`) | BLOCKED |
| G-03 Environment identity | TEST Script Property, active Spreadsheet ID, TEST deployment/API URL and project identity all match the owner-approved TEST environment | BLOCKED |
| G-04 External separation | LINE TEST channel/LIFF and Worker/upstream are proven separate from Production; notification sender is disabled or replaced with a stub | BLOCKED |
| G-05 Drive isolation | `SNC_SUBMISSION_FOLDER_ID` points to a dedicated private TEST folder; confirm no inherited public sharing | BLOCKED |
| G-06 Data baseline | Export/read-only snapshot of row counts and all existing primary IDs for every affected table; preserve a copy outside the live spreadsheet | BLOCKED |
| G-07 Fixture authorization | Owner approves this exact fixture manifest, write scope, and cleanup method before any write | REVIEW REQUIRED |
| G-08 Recovery | Confirm the operator can restore the TEST spreadsheet/Drive state from the pre-test snapshot if exact cleanup fails | BLOCKED |

Do not create fixtures while any gate is BLOCKED. Do not run `setup()`, migration, scheduler installation, trigger installation, or any function that creates persistent data as a shortcut.

## 3. Synthetic actor manifest

Use reserved identifiers with prefix `SNC_TST_20261122_`. Use non-routable `.invalid` email addresses; never use real university/student addresses. These values are proposed test identifiers, not pre-existing records.

| Actor | Proposed UserID | Role / purpose | Notes |
|---|---|---|---|
| System Admin | `SNC_TST_20261122_ADMIN` | System-level setup/verification | Grant only the minimum role required; revoke during cleanup |
| Course Coordinator | `SNC_TST_20261122_COORD` | Scoped course/offering authorization | Scope only to the synthetic course |
| Instructor | `SNC_TST_20261122_INST` | Assignment, group, grading and notification tests | Assign only to synthetic offering |
| Student A | `SNC_TST_20261122_STU_A` | Group Alpha leader / individual submission | Synthetic email |
| Student B | `SNC_TST_20261122_STU_B` | Group Alpha member | Synthetic email |
| Student C | `SNC_TST_20261122_STU_C` | Group Beta member | Synthetic email |
| Student D | `SNC_TST_20261122_STU_D` | Group Beta member | Synthetic email |
| Student E | `SNC_TST_20261122_STU_E` | Group Beta member | Synthetic email |
| Student F | `SNC_TST_20261122_STU_F` | Enrolled student without a group | Synthetic email |

Do not bind these synthetic users to a real LINE account. Authentication through a real LINE LIFF token remains a separate deployed TEST E2E test and is not simulated by inserting LINE account records.

## 4. Proposed synthetic academic data

| Entity | Proposed ID | Purpose |
|---|---|---|
| Course | `SNC_TST_20261122_COURSE` | Isolated course scope |
| Semester | `SNC_TST_20261122_SEM` | Isolated semester |
| CourseOffering | `SNC_TST_20261122_OFFER` | One offering for all synthetic students |
| CourseInstructor | generated ID with test prefix | Assign synthetic Instructor |
| Enrollments | generated IDs with test prefix | Enroll Students A–F only |
| Assignment — Individual | `SNC_TST_20261122_ASG_IND` | Individual submission independent of group membership |
| Assignment — Group max 3 | `SNC_TST_20261122_ASG_GRP3` | Verify minimum 2 and maximum 3 |
| Assignment — Group max 2 | `SNC_TST_20261122_ASG_GRP2` | Verify rejection when a 3-member group exceeds assignment maximum |
| Assignment — Group no max | `SNC_TST_20261122_ASG_GRPN` | Verify null maximum means no system-level maximum |
| Groups | `SNC_TST_20261122_GRP_ALPHA`, `..._GRP_BETA`, `..._GRP_SOLO` | 2-member, 3-member, and 1-member boundary groups |
| Submissions | generated IDs with test prefix | First submissions and revision chain |
| SubmissionFiles | generated IDs with test prefix | Staged and attached file lifecycle |
| Grades / GradeReviews | generated IDs with test prefix | Grade history and basic review-state tests |
| NotificationLogs / AuditLogs | generated IDs or exact captured row IDs | Delivery result and audit verification |

### Group membership assignment

- Group Alpha: Students A and B (2 members).
- Group Beta: Students C, D and E (3 members).
- Student F: enrolled but not in a group.
- Group Solo: use Student F only for the negative minimum-member test, if the current implementation permits creation of a one-member group. If group creation itself rejects it, record that result and do not bypass validation by writing directly to the sheet.

All groups belong to the single synthetic CourseOffering. No real CourseOffering or real Enrollment may be reused.

## 5. Test scenarios and expected results

| ID | Scenario | Fixture | Expected result | Level |
|---|---|---|---|---|
| FX-01 | Role and course-scope boundary | Admin, Coordinator, Instructor, Students A–F | Authorized roles act only within assigned scope; unauthorized/cross-scope requests are denied | Handler/API |
| FX-02 | Student offering visibility | Students A–F and one offering | Only active enrolled synthetic students see the synthetic offering | API |
| FX-03 | Individual assignment without group | Student F; Individual Assignment | Student F can submit individually without joining any group | API/Integration |
| FX-04 | Group minimum boundary | Group Solo with one member, Group Assignment | Submission rejected; expected business condition is minimum 2 members | API/Integration |
| FX-05 | Group minimum valid | Group Alpha with 2 members | Group submission accepted when all other conditions are met | API/Integration |
| FX-06 | Group maximum valid | Group Beta with 3 members; max 3 | Submission accepted at maximum boundary | API/Integration |
| FX-07 | Group maximum exceeded | Group Beta with 3 members; max 2 | Submission rejected; no Submission row created | API/Integration |
| FX-08 | No maximum configured | Group Beta with 3 members; max null | No system-level maximum rejection | API/Integration |
| FX-09 | One student, one group per offering | Students A–F | A student cannot join a second group in the same offering | API/Integration |
| FX-10 | Membership lock is per group | Alpha submits first; Beta does not | Alpha membership becomes locked; Beta remains editable | API/Integration |
| FX-11 | Lock does not affect Individual | Student A after Alpha is locked | Student A can still submit Individual Assignment | API/Integration |
| FX-12 | Representative permission | Alpha leader and ordinary member | Only designated representative may create Group Submission; ordinary member cannot submit | API/Integration |
| FX-13 | Staged file authorization | Alpha members and non-member Student F | Authorized member/leader may attach permitted staged file; non-member or wrong-assignment file denied | API/Integration |
| FX-14 | Submission revision | Existing synthetic submission | Revision creates a linked revision record; previous submission remains traceable | API/Integration |
| FX-15 | Duplicate request | Same request replayed with supported idempotency mechanism | No duplicate submission if the implementation/API contract supports the tested idempotency key; otherwise mark REVIEW REQUIRED, do not infer idempotency from RequestID | API |
| FX-16 | Grade and feedback | Synthetic submission | Authorized Instructor can grade; student can see only own/group result | API |
| FX-17 | Grade change history | Existing synthetic grade | Old/new score, editor, timestamp and reason are auditable as required by DOC-02 BR-005 | API/Integration |
| FX-18 | Grade review | Synthetic student and grade | Basic request and authorized status changes tested only to the extent approved workflow is implemented; unresolved transitions REVIEW REQUIRED | API |
| FX-19 | Notification routing | Synthetic recipients | Notification intent/log is recorded; all outbound LINE delivery is stubbed; zero real pushes | Stub/Integration |
| FX-20 | Audit visibility | Admin and non-admin actor | Audit list restricted to System Admin; no cross-scope disclosure | API |
| FX-21 | File access boundary | Private TEST Drive file | Submitter/group members/assigned instructor access only; unrelated user denied | Drive/API |
| FX-22 | Cleanup integrity | All fixture IDs | Only exact manifest IDs and exact test Drive files are removed; baseline IDs and row counts remain unchanged | Data integrity |

## 6. Data creation order

1. Capture baseline snapshot: table row counts, existing primary IDs, TEST spreadsheet ID, Drive folder ID and current file IDs.
2. Confirm all synthetic IDs are unused across relevant tables. Abort on any collision.
3. Create synthetic Course and Semester.
4. Create CourseOffering and assign synthetic Instructor.
5. Create synthetic Users and required Role records; do not create LINE binding records.
6. Create active Enrollments for Students A–F.
7. Create the synthetic Groups and memberships through supported application handlers where possible; do not bypass validation with direct sheet edits.
8. Create Individual and Group Assignments with the values in Section 4.
9. Create only the minimum files needed for file tests in the private TEST Drive folder.
10. Run test cases in Section 5, recording each request/response and all created IDs.
11. Capture post-test snapshot before cleanup.

Every write must record the generated primary key immediately in the fixture manifest. If an operation partially succeeds, stop the dependent test cases and reconcile the exact rows/files before proceeding.

## 7. Cleanup manifest and deletion policy

Cleanup is a separate controlled operation after test evidence has been captured. It is not automatic and must never use broad filters such as deleting all rows with a status, all rows created on a date, or all rows in a table.

| Data / resource | Cleanup selector | Cleanup action | Order |
|---|---|---|---:|
| GradeReviews | Exact captured GradeReviewID values in manifest | Delete only fixture rows | 1 |
| Grades | Exact captured GradeID values | Delete only fixture rows | 2 |
| SubmissionFiles | Exact captured SubmissionFileID values | Delete exact metadata rows; trash only DriveFileID values created by this run | 3 |
| Submissions | Exact captured SubmissionID values | Delete only fixture rows | 4 |
| NotificationLogs | Exact captured NotificationID values | Delete only fixture logs; no LINE messages exist because stubbed | 5 |
| GroupMembers | Exact captured GroupMemberID values | Delete only fixture membership rows | 6 |
| Groups | Exact captured GroupID values | Delete only fixture groups | 7 |
| Assignments | Exact captured AssignmentID values | Delete only fixture assignments | 8 |
| Enrollments | Exact captured EnrollmentID values | Delete only fixture enrollments | 9 |
| CourseInstructors | Exact captured CourseInstructorID values | Delete only fixture assignments | 10 |
| UserRoles | Exact captured UserRoleID values | Delete/revoke only fixture role grants | 11 |
| Users | Exact captured UserID values | Delete only synthetic users created by this run | 12 |
| CourseOfferings | Exact captured OfferingID values | Delete only fixture offering | 13 |
| Semesters | Exact captured SemesterID values | Delete only fixture semester if no remaining references | 14 |
| Courses | Exact captured CourseID values | Delete only fixture course if no remaining references | 15 |
| AuditLogs | Exact captured AuditID values from fixture activity, only if policy permits | Prefer retain evidence; do not delete audit records unless explicit approval | Separate gate |

### Mandatory cleanup safeguards

- Preserve the manifest outside the TEST spreadsheet before cleanup.
- Verify every target row's primary key and synthetic prefix immediately before deletion.
- Never delete any ID that was present in the baseline snapshot.
- Never delete or modify the 18 existing Users or any existing records merely because they are in TEST.
- Do not delete AuditLogs by default; retain them as test evidence unless a separately approved retention/cleanup rule applies.
- Trash only Drive files whose IDs were captured as created by this run. Never delete the TEST folder or pre-existing files.
- If any reference, owner, timestamp, or ID does not match the manifest exactly, stop cleanup and mark BLOCKED.
- After cleanup, rerun read-only schema inspection and compare all baseline primary IDs and row counts. Any unexplained difference is FAIL and requires recovery.

## 8. Explicitly excluded from this fixture batch

- Real LINE LIFF authentication or account linking; requires separate controlled TEST identity/token setup.
- Real LINE push notifications; use a stub only.
- Production data, accounts, deployment, channel, LIFF ID, Worker or Drive folder.
- Schema migration, setup routines, trigger creation, scheduler execution or trigger installation.
- Bulk Student Import using real student data.
- Automatic group allocation, advanced analytics, advanced rubric, multi-level appeals or features excluded from MVP.
- Any test requiring an unresolved DOC-03–DOC-08 draft workflow to be treated as approved.
- Concurrency claims unless an isolated concurrency harness is explicitly prepared; sequential replay alone is not a concurrency test.

## 9. Evidence and reporting requirements

For each case retain: Test ID, source commit SHA, GAS deployment version, TEST spreadsheet identity (redacted in public reports), actor ID, action, sanitized request, response/error code, before/after exact record IDs, timestamp, expected result, actual result, status, and evidence reference.

Never log ID tokens, access tokens, channel secrets, full email addresses, file contents, or unnecessary personal information. Use only synthetic identifiers in evidence.

Status vocabulary: PASS, FAIL, BLOCKED, NOT RUN, DEFERRED, REVIEW REQUIRED. A test can be PASS only with actual execution evidence at the declared test level. Static inspection or pure unit tests cannot be relabeled as API integration or Browser/LIFF E2E.

## 10. Acceptance criteria for this fixture batch

The fixture batch is complete only when:
1. All entry gates G-01 through G-08 are satisfied.
2. Every fixture is synthetic and traceable to the manifest.
3. Individual and Group Assignment boundaries in DOC-02 FR-CL-001 through FR-CL-008 and BR-007 through BR-009 are verified.
4. No real LINE push or Production operation occurs.
5. Every created row/file is accounted for.
6. Cleanup removes only explicitly captured fixture records and files, or the fixture set is retained intentionally with owner approval.
7. Post-cleanup schema and baseline-ID comparison show no unrelated changes.
8. A test report distinguishes handler/API, deployed TEST API, and Browser/LIFF E2E evidence.

## 11. Current execution status

- Plan preparation: **PASS**
- Owner approval of exact fixture write/cleanup scope: **PASS**
- G-01 source synchronization: **PASS — owner confirmed all five controlled files match approved development source**
- G-02 GAS project save/load/syntax execution: **PASS — owner-provided `SNC_SystemPreflight_TEST` v1.0.1 execution completed without reported syntax/runtime load error**
- Preflight overall: **BLOCKED** — 11 checks PASS, 0 FAIL, 1 BLOCKED, 8 NOT RUN. This does not reverse G-02: the blocker is INT-08 and unrun integration suites, not project syntax/compile.
- G-03 environment identity: **PASS**
- G-04 external/LINE separation: **PASS WITH CAVEAT** — outbound LINE push suppressed while token remains absent; do not enable token or run notification paths
- G-05 Drive isolation: **PASS by owner confirmation**
- G-06 data baseline: **PASS — complete 22-table read-only baseline**
- G-07 fixture authorization: **PASS — exact v1.0 scope approved**
- G-08 recovery: **BLOCKED / PARTIAL** — separate TEST spreadsheet copy owner-confirmed complete; restore rehearsal and Drive-file recovery procedure not verified
- Fixture creation: **NOT RUN**
- Functional Integration Tests: **NOT RUN**
- Cleanup: **NOT RUN**

**Decision: HOLD — do not create fixtures or run the Integration Test Runner until G-08 recovery requirements are met.** The Preflight's integration NOT RUN/BLOCKED results remain open test work and must not be reported as PASS.
