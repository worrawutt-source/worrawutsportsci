# CR-001 — Scheduled Assignment Opening and Closing

- Project: SPORT NUTRITION CLASSROOM
- Change ID: CR-001
- Status: Approved by Project Owner
- Approved: 19 November 2026
- Branch: development
- Replaces: DOC-02 BR-001 (manual-only opening/closing)
- Scope: Assignment Management, database schema, backend scheduler, Instructor Portal, API, workflow, tests and change log

## 1. Decision

Assignments support both scheduled and manual status control. The instructor may independently enable or disable automatic opening and automatic closing. When a schedule toggle is disabled, that transition remains under manual instructor control.

The due date remains a separate concept and does not itself open or close an assignment.

## 2. Instructor configuration

The Assignment form presents three separate date/time settings:

1. **Scheduled opening** — optional toggle. When enabled, the instructor must set the local date and time at which the assignment becomes OPEN automatically.
2. **Due date** — required date/time used to determine on-time/late submission and reminder behavior. It does not change assignment status.
3. **Scheduled closing** — optional toggle. When enabled, the instructor must set the local date and time at which the assignment becomes CLOSED automatically.

Both scheduling toggles are independent. The instructor can schedule opening only, closing only, both, or neither (manual control).

## 3. Status transition rules

- A newly created assignment starts as DRAFT.
- When enabled and due, the scheduled-open event changes DRAFT or CLOSED to OPEN.
- When enabled and due, the scheduled-close event changes DRAFT or OPEN to CLOSED.
- Each scheduled event is processed once. A processed event must not repeatedly override later instructor actions.
- Instructors retain manual Open and Close controls. A manual action changes the current status immediately and is audited.
- If a scheduled-open event has not yet been processed, a manual Close does not cancel it; the pending scheduled-open event will still occur at its configured time.
- If a scheduled-close event has already been processed, a later manual Open is allowed; the completed scheduled-close event does not close it again.
- If only scheduled opening is enabled, the assignment remains OPEN after opening until manually closed.
- If only scheduled closing is enabled, the assignment remains in its current state until the scheduled close event; the event ensures it is CLOSED at that time.
- Due Date may be earlier than Scheduled Closing to permit a late-submission window. No automatic relationship between those two times is imposed.

## 4. Time and execution

- All schedule values represent Asia/Bangkok local time.
- UI display and input use Thai locale, Buddhist Era (B.E.) dates and 24-hour time, consistent with the approved localization requirement.
- API and storage use ISO 8601 / Gregorian CE instants.
- Backend time-driven processing runs on a one-minute recurring trigger. Apps Script trigger execution is best-effort and may run slightly after the configured minute; the UI must not promise second-level precision.
- Backend processing must be idempotent, protected by ScriptLock, and re-check current row values before changing status.
- Scheduled transitions create AuditLogs with distinct actions ASSIGNMENT_AUTO_OPENED and ASSIGNMENT_AUTO_CLOSED, actor SYSTEM, and schedule timestamp/context.
- The scheduler must process only the configured TEST or PRODUCTION deployment's bound spreadsheet; TEST rollout must be verified against the TEST spreadsheet ID.

## 5. Validation

- When a scheduling toggle is enabled, its date/time is required and must be valid.
- When disabled, its schedule timestamp is cleared or ignored; stale timestamps must not trigger.
- If both scheduled opening and scheduled closing are enabled, closing must be later than opening.
- Duplicate/invalid date values are rejected by the backend, not only by the browser.
- Due Date remains independently required.
- Existing assignments migrate with both schedule toggles disabled and no scheduled timestamps. Their current status and Deadline are preserved.

## 6. Data model amendment

Add the following fields to Assignments:

- AutoOpenEnabled (boolean)
- ScheduledOpenAt (datetime, nullable)
- AutoOpenProcessedAt (datetime, nullable)
- AutoCloseEnabled (boolean)
- ScheduledCloseAt (datetime, nullable)
- AutoCloseProcessedAt (datetime, nullable)

The existing Deadline field remains unchanged. Existing rows receive disabled flags and blank schedule/processed timestamps.

## 7. API amendment

assignment.create and assignment.update accept autoOpenEnabled, scheduledOpenAt, autoCloseEnabled, and scheduledCloseAt.

assignment.list and assignment.get return the corresponding schedule configuration and processed timestamps. Existing assignment.open and assignment.close remain available for manual control.

The API must validate all schedule fields and must not trust client-side status changes.

## 8. Acceptance criteria

1. Both toggles can be enabled/disabled independently.
2. Enabled schedule requires its date/time.
3. Due Date remains separate and does not change status.
4. Scheduled open changes status to OPEN at/after its configured time.
5. Scheduled close changes status to CLOSED at/after its configured time.
6. A scheduled event is processed once and cannot repeatedly override later manual actions.
7. Manual Open/Close remains functional and authorized.
8. Schedule transitions are written to AuditLogs.
9. Existing Assignment rows remain intact after additive migration.
10. Scheduler and API cannot operate on an unintended spreadsheet.
11. UI uses Thai B.E. date display/input and 24-hour time.
12. Tests cover early/late trigger execution, duplicate trigger invocation, manual override, invalid schedule order, disabled toggles, and existing-row migration.

## 9. Impacted baseline documents

This approved amendment supersedes conflicting statements in DOC-02 (BR-001 and related assignment requirements), DOC-03 (Assignment workflow), DOC-05 (Assignments entity), DOC-07 (Instructor Assignment form), DOC-08 (Assignment API and scheduler behavior), and DOC-13 (Change Log).

Other requirements remain unchanged. In particular, BR-002 remains in force: Deadline is used for on-time/late status and reminders.

## 10. Rollout boundary

Implement and test on the development branch and TEST environment only. Do not merge to main, update Production schema, create Production triggers, or deploy Production without a separate explicit approval.