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
