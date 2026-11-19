# DOCS v1.3 — CR-001 Amendment
## Scheduled Assignment Opening and Closing

- Change ID: CR-001
- Approval: Project Owner approved replacement of BR-001 on 20 November 2026
- Effective branch: development
- Environment: TEST only until separately approved
- Source baseline: DOCS v1.3 (DOC-02, DOC-03, DOC-05, DOC-07, DOC-08, DOC-13)

This amendment is part of the approved DOCS v1.3 baseline. It supersedes only the conflicting manual-only Assignment opening/closing rule. Unrelated requirements remain unchanged.

## DOC-02 — Requirements Specification amendment

**Replace BR-001** with:

- BR-001A: Instructor may independently enable or disable automatic opening and automatic closing for each Assignment.
- BR-001B: If automatic opening is enabled, the Assignment becomes OPEN when the scheduled opening time is reached and the scheduler processes the event.
- BR-001C: If automatic closing is enabled, the Assignment becomes CLOSED when the scheduled closing time is reached and the scheduler processes the event.
- BR-001D: If either automation toggle is disabled, that transition remains under manual Instructor control.
- BR-001E: Due Date is independent from scheduled opening/closing and never changes Assignment status by itself.
- BR-001F: Manual Open/Close remains available and is authorized and audited.
- BR-001G: Each scheduled event is processed once. Repeated trigger execution must not repeat the transition or override a later manual action after that event has been processed.

BR-002 remains unchanged: Deadline is used for late-submission determination and reminders. A later scheduled close than Due Date is permitted to support a late-submission window.

## DOC-03 — System Workflow amendment

At Assignment creation/edit, Instructor configures:
1. Optional Scheduled Opening toggle + date/time.
2. Required Due Date + time.
3. Optional Scheduled Closing toggle + date/time.

Both automation toggles are independent. The workflow supports scheduled opening only, scheduled closing only, both, or neither. A one-minute time-driven backend process checks due events. It uses a lock, re-reads current Assignment state, marks each event processed, and writes a system Audit Log entry. Trigger execution is best-effort and may occur slightly after the target minute.

Manual status changes remain available. A manual action before a pending schedule does not silently delete that pending schedule. When the pending event later runs, it is processed once; if the Assignment already has the target status, no duplicate status transition is written.

## DOC-05 — Database Design amendment

Add six fields to Assignments (additive migration only):

| Field | Type | Meaning |
|---|---|---|
| AutoOpenEnabled | Boolean | Automatic opening toggle |
| ScheduledOpenAt | Datetime nullable | Opening instant, Asia/Bangkok |
| AutoOpenProcessedAt | Datetime nullable | One-shot processing marker |
| AutoCloseEnabled | Boolean | Automatic closing toggle |
| ScheduledCloseAt | Datetime nullable | Closing instant, Asia/Bangkok |
| AutoCloseProcessedAt | Datetime nullable | One-shot processing marker |

Keep existing Deadline unchanged. Existing rows receive both toggles disabled and blank schedule/processed fields. Migration must preserve all current values and rows.

## DOC-07 — UI/UX Specification amendment

The Assignment form must display the three independent settings in this order: Scheduled Opening, Due Date, Scheduled Closing. Each schedule toggle controls whether its date/time fields are enabled and required. Due Date remains required and separate.

Display and input use Thai locale, Buddhist Era (พ.ศ.) dates and 24-hour time. The client converts Buddhist Era dates to Gregorian CE ISO date-time values before calling the API. Backend interprets date-time input as Asia/Bangkok and validates it independently.

The Assignment list should distinguish current status from configured schedules and show whether opening/closing automation is enabled. It should not imply that Due Date closes the Assignment.

## DOC-08 — API Specification amendment

Existing authenticated actions remain:
- assignment.create
- assignment.update
- assignment.list
- assignment.get
- assignment.open
- assignment.close

Create/update accept:
- autoOpenEnabled (boolean)
- scheduledOpenAt (YYYY-MM-DDTHH:mm local Asia/Bangkok when enabled)
- autoCloseEnabled (boolean)
- scheduledCloseAt (YYYY-MM-DDTHH:mm local Asia/Bangkok when enabled)

List/get return all six persisted scheduling fields. Backend rejects enabled schedules without a valid date/time and rejects ScheduledCloseAt less than or equal to ScheduledOpenAt when both toggles are enabled. Disabled schedules are cleared/ignored. Client cannot set Status through create/update.

The scheduler is a server-side Apps Script time-driven trigger and is not exposed as a public API action. It is bound to the TEST spreadsheet in this implementation and uses ScriptLock, one-shot processed timestamps and system audit events.

## Scheduler and audit requirements

- Time zone: Asia/Bangkok.
- Trigger interval: every minute; Apps Script execution is best-effort, not second-accurate.
- TEST-only spreadsheet guard is mandatory.
- Scheduled actions: ASSIGNMENT_AUTO_OPENED and ASSIGNMENT_AUTO_CLOSED.
- Audit actor: SYSTEM; details include the configured scheduled instant.
- Duplicate trigger invocations must be idempotent.
- Trigger must re-read current row state while holding the script lock.

## Acceptance tests

1. Each toggle independently enables/disables its schedule.
2. Missing date/time with an enabled toggle is rejected by backend.
3. Closing time must be later than opening time when both are enabled.
4. Due Date does not trigger a status transition.
5. Scheduled opening changes status to OPEN.
6. Scheduled closing changes status to CLOSED.
7. Re-running scheduler does not repeat processed events or duplicate audit events.
8. Manual Open/Close works when automation is disabled.
9. Manual actions remain available with automation configured.
10. A pending scheduled event is processed once after an earlier manual action.
11. Existing Assignment rows and Deadline values are preserved by migration.
12. Scheduler refuses any spreadsheet other than the designated TEST spreadsheet.
13. UI date input/display uses Buddhist Era and 24-hour time.
14. Trigger delay and retry behavior are documented and tested.

## Change log entry

CR-001 — 20 November 2026 — Replaced manual-only Assignment status control with optional independent scheduled opening and closing; kept Due Date separate; added six Assignment fields, backend scheduler, API configuration and Instructor UI. Impacted documents: DOC-02, DOC-03, DOC-05, DOC-07, DOC-08, DOC-13. Status: Approved; implementation in development/TEST.
