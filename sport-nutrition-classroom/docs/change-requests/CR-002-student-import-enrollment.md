# CR-002 — Student Import & Enrollment

- Project: SPORT NUTRITION CLASSROOM
- Branch: development
- Approval: User approved the proposed schema and implementation scope on 20 November 2026.
- Baseline: DOCS v1.3, especially DOC-02, DOC-05, DOC-06 and DOC-08.

## Approved additive schema (v1.5.0)

### Enrollments
`EnrollmentID, OfferingID, UserID, Status, EnrolledAt, CreatedAt, UpdatedAt`

### ImportJobs
`ImportJobID, OfferingID, FileName, Status, TotalRows, SuccessCount, ErrorCount, CreatedByUserID, CreatedAt, CompletedAt`

### ImportErrors
`ImportErrorID, ImportJobID, RowNumber, StudentID, ErrorCode, ErrorMessage, CreatedAt`

The migration is additive. Existing Users, CourseOfferings, Assignments, and other sheet data must remain unchanged.

## Approved functional scope

- Import Preview, server-side validation, Import Execute, Import Result.
- Required student fields: Student ID, First Name, Last Name, Email.
- One import job targets one CourseOffering.
- Detect duplicate StudentID, Email, existing identity conflicts and duplicate active enrollment.
- Reuse an existing User only when StudentID and Email identify the same account; otherwise reject conflicting identity pairs.
- Create missing Users as ACTIVE; LINE account linking remains separate.
- Enrollments are unique per Offering/User.
- Roster listing is scoped to authorized offering managers; students can view their own enrollments.
- Enrollment status mutation is limited to ACTIVE/INACTIVE pending an approved withdrawal policy.
- ImportJobs and ImportErrors retain import outcome; successful changes are audited.
- Backend authorization is mandatory. System Admin and scoped Course Coordinator may import. Instructor import remains disabled until a separate grant mechanism is approved and implemented.

## API actions

- `import.preview`
- `import.execute`
- `import.result`
- `enrollment.list`
- `enrollment.update`

Import payload uses normalized rows:
`{ offeringId, fileName, rows: [{ studentId, firstName, lastName, email }] }`

The backend accepts 1–500 rows per request. File parsing and the Admin/Coordinator user interface remain separate implementation tasks.

## Acceptance and test gates

- Preview has zero writes.
- Invalid rows are identified before execution.
- Execute revalidates under ScriptLock.
- Existing Users are not overwritten.
- Duplicate active Enrollment is rejected.
- Import result is visible only within authorized Offering scope.
- Cross-offering access is denied.
- Audit log is written for import and enrollment status changes.
- TEST schema preflight and synthetic-account integration tests must pass before TEST deployment.
- No Production setup, data import, or deployment is authorized by this CR.
