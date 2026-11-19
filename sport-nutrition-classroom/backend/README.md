# SPORT NUTRITION CLASSROOM — Backend

## Phase 1.1 — LINE student account linking and email change

Implemented in `Code.gs` on the `development` branch.

### API actions

| Action | Purpose | Required payload |
|---|---|---|
| `auth.verify` / `auth.me` | Verify LINE ID token and resolve linked account | `idToken` |
| `auth.requestLinkOtp` | Match Student ID + registered email and send OTP | `idToken`, `studentId`, `email` |
| `auth.linkStudent` | Verify OTP and link LINE subject to the existing UserID | `idToken`, `studentId`, `email`, `otp` |
| `auth.requestEmailChange` | Send OTP to a new email for the linked student | `idToken`, `newEmail` |
| `auth.confirmEmailChange` | Verify OTP and update the student's email | `idToken`, `newEmail`, `otp` |

### Account rules

- LINE identity is verified server-side against LINE's token verification endpoint on every protected request.
- Account linking requires an exact match of active `StudentID` and the email currently stored in `Users`.
- OTP is sent only to the registered email for account linking.
- A LINE subject can link to only one student account; an active student account can link to only one LINE subject.
- Email changes require an authenticated linked LINE identity and OTP sent to the proposed new email.
- New email uniqueness is checked before sending and again before updating.
- Student ID, FirstName and LastName are not accepted as mutable fields in student APIs.
- OTP expires after 10 minutes, is single-use, and has a maximum of five attempts. Only a salted/peppered SHA-256 hash is stored.
- Audit entries are written for account linking and email changes. ID tokens and OTP values are never logged.

## Database migration

The existing `EmailOTPChallenges` table had 12 columns. The additive migration adds:
- `Purpose`
- `UserID`
- `NewEmail`

No existing rows are cleared or rewritten. Run `setupAccountLinkingSheets()` once from the container-bound Apps Script project. It verifies the existing sheets and adds these columns when the old 12-column schema is detected.

## Script Properties

Set these in Apps Script > Project Settings > Script Properties:

- `LINE_CHANNEL_ID`: LINE Login channel ID associated with the LIFF application.
- `SNC_OTP_PEPPER`: a long, random server-only secret (at least 32 random characters). Do not commit it to GitHub or expose it to the browser.

The app sends OTP using `MailApp.sendEmail`; authorize the required Apps Script mail permission when prompted.

## Preflight and testing

1. Run `setupAccountLinkingSheets()`.
2. Set both Script Properties above.
3. Run `testAccountLinkingPreflight()`. It is read-only and reports schema/configuration checks and aggregate counts; it does not print student identifiers.
4. Run `testPostMissingToken()`; expected result is `TOKEN_MISSING`.
5. Deploy a TEST Web App version and update only the TEST frontend endpoint before browser testing.
6. Use a designated test student record and a LINE test account. Verify:
   - Correct Student ID + registered email receives OTP.
   - Incorrect Student ID/email is rejected and no OTP is sent.
   - Correct OTP links one LINE subject to the existing UserID.
   - Re-linking to a different student or linking a second LINE subject to the same student is rejected.
   - Expired, incorrect, consumed, and over-attempt OTPs are rejected.
   - Email change OTP goes to the new email; current email remains unchanged until successful confirmation.
   - Duplicate email is rejected.
   - Student APIs cannot modify StudentID, FirstName or LastName.
   - AuditLogs contains the link/email-change actions and old/new email values.
7. Review Apps Script execution logs and the TEST spreadsheet before considering production.

## Deployment and safety

- Do not deploy the TEST implementation over the production Web App.
- Do not run email delivery tests against real student accounts without an approved test account and authorization.
- Do not put channel secrets, OTP pepper, access tokens, ID tokens, or private student data in GitHub.
- The browser is untrusted; the backend verifies identity and performs all account matching and authorization.
- The student portal UI is in `student/index.html`; it uses the existing LIFF ID and API URL configuration currently present in the file. Change the API URL only when preparing a separate TEST deployment.


## Phase 1.2 — Course & Semester Management (development)

Added `CourseManagement.gs` with authenticated API actions:
`course.list/create/update`, `semester.list/create/update`,
`offering.list/create/update`, and `instructor.assign/unassign`.

The additive setup schema adds `UserRoles`, `Courses`, `Semesters`,
`CourseOfferings`, and `CourseInstructors`. DOC-05 defines these logical
entities and relationships but not all physical columns; the minimum field
mapping is declared in `setup.gs` and is an implementation detail.

All management API calls verify the LINE ID token and derive the actor from
the linked LINE account. Authorization is enforced on the backend. Instructors
can list only offerings assigned to them. Coordinator roles support SYSTEM,
COURSE, or SEMESTER scope in UserRoles. A one-time manual bootstrap function
uses Script Property `SNC_INITIAL_ADMIN_STUDENT_ID`; it is not exposed as an API.

TEST rollout only: update the TEST Apps Script source, confirm the TEST
spreadsheet is selected, run `setupAccountLinkingSheets()`, set the initial
admin Student ID property, run `bootstrapInitialAdminRole()` once, remove
that property, then run `testCourseManagementPreflight()`. Do not execute
schema setup or bootstrap against production.


## Phase 1.3 — Assignment Management (development)

Added `AssignmentManagement.gs` and authenticated API actions:
- `assignment.list` — list assignments only for CourseOfferings the actor can manage.
- `assignment.get` — retrieve one assignment after offering-scope authorization.
- `assignment.create` / `assignment.update` — manage title, instructions, score, deadline and approved submission rules.
- `assignment.open` / `assignment.close` — instructor-controlled manual status transitions.
- `assignment.create` / `assignment.update` also accept optional automatic opening/closing configuration.

The additive `Assignments` sheet uses:
`AssignmentID, OfferingID, Title, Description, Instructions, MaxScore, Deadline,
SubmissionType, MinGroupMembers, MaxGroupMembers, Status, OpenedAt, ClosedAt,
CreatedAt, UpdatedAt, CreatedByUserID, AutoOpenEnabled, ScheduledOpenAt,
AutoOpenProcessedAt, AutoCloseEnabled, ScheduledCloseAt, AutoCloseProcessedAt`.

For GROUP assignments, the backend enforces `MinGroupMembers=2`; `MaxGroupMembers`
may be empty (unlimited) or an integer >= 2. INDIVIDUAL assignments cannot carry
group-size limits. Assignment creation starts in `DRAFT`. Instructors may independently enable scheduled opening and scheduled closing; when a toggle is disabled, that transition remains manual. `Deadline` is separate and does not change Assignment status.

### TEST rollout for Assignment Management

1. Fetch the latest `development` backend files into the TEST Apps Script project:
   `Code.gs`, `CourseManagement.gs`, `AssignmentManagement.gs`, and `setup.gs`.
2. Confirm the active spreadsheet is the TEST spreadsheet.
3. Run `setupAccountLinkingSheets()` once. It creates the new `Assignments` sheet
   when missing and preserves all existing sheets/rows. Expected schema version: `1.4.0`. The setup migration adds six scheduling columns to the existing Assignments sheet without rewriting or deleting existing rows; existing assignments default to both automation toggles disabled.
4. Run `testAssignmentSubmissionConfigUnit()` (pure unit tests; no sheet writes).
5. Deploy a new TEST Web App version before testing Assignment APIs.
6. Use the Instructor Portal on TEST LIFF to create an assignment, edit it,
   open it, close it, and verify the resulting rows and AuditLogs.
7. Do not run setup or deployment against Production.

The current Assignment phase does not yet implement Student Import/Enrollment,
Group Management, Submission/File Upload, Grading, Grade Review, or notifications.
Those modules must enforce the DOC-02/DOC-05/DOC-06/DOC-08 rules before student use.

## Phase 1.4 — Scheduled Assignment Opening and Closing (CR-001)

CR-001 supersedes the former manual-only BR-001 rule. Due Date remains separate and is used for late-submission/reminder behavior only.

### API schedule fields

`assignment.create` and `assignment.update` accept:
- `autoOpenEnabled` (boolean)
- `scheduledOpenAt` (Asia/Bangkok local `YYYY-MM-DDTHH:mm`, required when enabled)
- `autoCloseEnabled` (boolean)
- `scheduledCloseAt` (Asia/Bangkok local `YYYY-MM-DDTHH:mm`, required when enabled)

`assignment.list` and `assignment.get` return the six schedule fields, including processed timestamps. Existing manual actions remain unchanged.

### Backend scheduler

- `runAssignmentScheduler()` processes due events under ScriptLock and writes `ASSIGNMENT_AUTO_OPENED` / `ASSIGNMENT_AUTO_CLOSED` AuditLogs as actor `SYSTEM`.
- One-shot processed timestamps make repeated trigger invocations idempotent.
- `installAssignmentSchedulerTrigger()` installs a one-minute time-driven trigger only when the active bound spreadsheet matches the hard-coded TEST spreadsheet ID. It records `SNC_ASSIGNMENT_SCHEDULER_SPREADSHEET_ID` and refuses mismatches.
- `testAssignmentSchedulerPreflight()` is read-only.
- `testAssignmentSchedulerLogicUnit()` is pure unit testing (11 cases).
- `testAssignmentSchedulerIntegration()` creates three marked TEST fixtures and verifies real Sheet transitions, duplicate invocation/audit idempotency and manual Open/Close. Fixtures are persistent; no cleanup is performed.
- `createAssignmentSchedulerTriggerFixtures()` creates two marked future-dated TEST records for the actual time-driven trigger; wait at least three minutes, then run `verifyAssignmentSchedulerTriggerFixtures()` (read-only).
- Apps Script triggers are best-effort and may run slightly after the scheduled minute.

### TEST rollout

1. Update TEST Apps Script with latest `Code.gs`, `CourseManagement.gs`, `AssignmentManagement.gs`, and `setup.gs`.
2. Confirm the container-bound spreadsheet is TEST ID `1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk`.
3. Run `setupAccountLinkingSheets()` once. The additive migration appends the six scheduling columns; existing assignment data is retained.
4. Run `testAssignmentSchedulerPreflight()` and `testAssignmentSchedulerLogicUnit()`.
5. Run `installAssignmentSchedulerTrigger()` once and verify exactly one trigger for `runAssignmentScheduler`.
6. Deploy a new TEST Web App version and update the TEST Instructor Portal source.
7. Verify schedule create/update, due-date independence, automatic opening/closing, duplicate trigger invocation, manual override and AuditLogs.
8. Do not install triggers, run setup or deploy this version against Production.