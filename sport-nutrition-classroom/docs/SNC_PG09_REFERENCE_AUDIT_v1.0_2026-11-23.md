# SNC PG-09 Reference Audit v1.0

**Date:** 23 November 2026  
**Branch:** `development`  
**Status:** STATIC SOURCE AUDIT COMPLETE — LIVE TEST DATA SCAN REQUIRED  
**Purpose:** Identify known application-level references to the 14 exact Assignment / Group / GroupMember cleanup candidates.

## 1. Scope and evidence boundary

This audit inspects the current GitHub `development` source modules listed below. It does not inspect live TEST Spreadsheet rows, does not enumerate every deployed GAS file, and does not claim that runtime dependencies are absent.

Static source findings are not a substitute for a read-only scan of the actual TEST tables. The owner-provided Exact-ID Inventory v1.0 runtime log checked Submissions references only. PG-09 therefore remains **BLOCKED pending live TEST data inspection**.

## 2. Source files inspected

| File | Blob SHA | Relevance |
|---|---|---|
| `backend/AssignmentManagement.gs` | `460c7a0eb244fa5a85239d0e2f531404d58601d8` | Assignment operations and direct Submission lookup by AssignmentID |
| `backend/GroupManagement.gs` | `9dc280d88bcee8e346d028082cae725fe2d88ee8` | Groups/GroupMembers relationship and group membership writes |
| `backend/SubmissionManagement.gs` | `ef4b86678e8c1feeea425ba578501846129a229c` | Submissions reference AssignmentID and GroupID; SubmissionFiles link to SubmissionID |
| `backend/FileManagement.gs` | `86cd29160dd00207c9a575ce801da09e643911cb` | Staged SubmissionFiles encode AssignmentID in a `STAGED:<userId>:<assignmentId>` SubmissionID marker |
| `backend/GradingManagement.gs` | `12bd34c5dd857250c7d6ccd76e28b5da7f4507f8` | Grades link to SubmissionID; GradeHistory and GradeReviewRequests link to GradeID |
| `backend/NotificationManagement.gs` | `875b60d90f4599ee0f9bdf0f60dcea31e215de7b` | NotificationLogs store RelatedEntityType and RelatedEntityID; group reminders use compound AssignmentID|GroupID |
| `backend/CourseManagement.gs` | `52a7f4049ff51772226fe33369cc26a0acb02a1b` | CourseOffering context and generic table access helpers |

## 3. Identified reference paths

### 3.1 Assignment references

| Table | Reference field | Source behavior | Required live check |
|---|---|---|---|
| Submissions | `AssignmentID` | Submission rows directly reference the Assignment | Already checked by Exact-ID Inventory; recheck immediately before cleanup |
| NotificationLogs | `RelatedEntityType`, `RelatedEntityID` | Assignment notifications use type `Assignment` and the AssignmentID; group deadline reminders use `AssignmentID|GroupID` | Scan all rows with RelatedEntityType = Assignment; parse exact and compound IDs |
| SubmissionFiles | `SubmissionID` | Staged upload rows encode the AssignmentID in `STAGED:<userId>:<assignmentId>`; committed rows reference a SubmissionID | Scan all rows for staged markers whose third segment exactly equals an allowlisted AssignmentID; do not treat arbitrary text matches as references |
| AuditLogs | `EntityType`, `EntityID` | Assignment actions are audited against Assignment IDs | Preserve all AuditLogs; read-only evidence only, no cleanup |

### 3.2 Group references

| Table | Reference field | Source behavior | Required live check |
|---|---|---|---|
| Submissions | `GroupID` | Group submissions directly reference GroupID | Already checked by Exact-ID Inventory; recheck immediately before cleanup |
| NotificationLogs | `RelatedEntityType`, `RelatedEntityID` | Group deadline notifications use `AssignmentID|GroupID` while RelatedEntityType is `Assignment` | Parse compound IDs and match the second segment against allowlisted GroupIDs; inspect any other entity types that encode GroupID |
| GroupMembers | `GroupID` | Each GroupMember is a child of one Group | Exact seven GroupMember rows are included in the allowlist; ensure no non-allowlisted member row points to one of the three Groups |
| AuditLogs | `EntityType`, `EntityID` | Group membership/representative actions are audited against Group IDs | Preserve all AuditLogs |

### 3.3 GroupMember references

The inspected application modules do not show another persisted table directly storing GroupMemberID. GroupMembers are read through GroupID and UserID in GroupManagement and SubmissionManagement. This is a static finding only; the complete deployed codebase and live schema must still be checked before concluding no other consumer exists.

### 3.4 Transitive Submission dependencies

The following tables link to SubmissionID or GradeID rather than directly to AssignmentID/GroupID:

- `SubmissionFiles.SubmissionID`
- `Grades.SubmissionID`
- `GradeHistory.GradeID`
- `GradeReviewRequests.GradeID`

If no Submission references any candidate AssignmentID or GroupID, these tables should not have a normal committed dependency on those candidate records through the inspected code path. However, live rows still need a read-only consistency scan for:
- SubmissionFiles with SubmissionID equal to any SubmissionID referencing a candidate;
- SubmissionFiles with staged AssignmentID markers;
- Grades whose SubmissionID belongs to a candidate;
- GradeHistory and GradeReviewRequests whose GradeID belongs to those Grades.

Do not delete any of these tables' records under the 14-ID cleanup allowlist.

## 4. Revised PG-09 live data scan requirements

Before cleanup can be considered, run a read-only scan in the exact TEST Spreadsheet and report each check independently:

| Check | Table | Required match | Pass criterion |
|---|---|---|---|
| PG09-01 | Submissions | AssignmentID in 4 Assignment IDs OR GroupID in 3 Group IDs | 0 rows |
| PG09-02 | NotificationLogs | RelatedEntityType = Assignment and RelatedEntityID equals any AssignmentID | 0 rows |
| PG09-03 | NotificationLogs | RelatedEntityID compound token second segment equals any GroupID; include exact parsing of `AssignmentID|GroupID` | 0 rows |
| PG09-04 | SubmissionFiles | SubmissionID starts with `STAGED:` and third token equals any AssignmentID | 0 rows |
| PG09-05 | SubmissionFiles | SubmissionID equals any SubmissionID found by PG09-01 | 0 rows; this should be zero if PG09-01 passes |
| PG09-06 | Grades | SubmissionID equals any SubmissionID found by PG09-01 | 0 rows |
| PG09-07 | GradeHistory | GradeID equals any GradeID found by PG09-06 | 0 rows |
| PG09-08 | GradeReviewRequests | GradeID equals any GradeID found by PG09-06 | 0 rows |
| PG09-09 | GroupMembers | GroupID equals one of the 3 candidate Groups, but GroupMemberID is NOT one of the 7 allowlisted IDs | 0 rows |
| PG09-10 | AuditLogs | EntityType/EntityID intersects candidate IDs | Report only; preserve every row and ID |
| PG09-11 | Other current tables | Inspect headers and known source consumers for fields that store AssignmentID, GroupID or GroupMemberID, including encoded/composite identifiers | No unreviewed references; otherwise BLOCK |
| PG09-12 | Schema completeness | Confirm all current TEST sheet names/headers against the current setup/schema source and deployed GAS modules | All sheets accounted for; unknown table/schema means BLOCK |

For PG09-02/03, include all NotificationLogs rows whose RelatedEntityType is `Assignment`; a compound ID may contain both a candidate AssignmentID and candidate GroupID. These rows are dependencies for the purposes of this review even though NotificationLogs are not in the deletion allowlist.

## 5. PG-09 status

**STATIC SOURCE REVIEW:** Complete for the seven modules listed in §2.  
**LIVE TEST TABLE SCAN:** Not run.  
**PG-09:** BLOCKED — do not authorize cleanup yet.

The next technical artifact should be a read-only TEST-only reference scan utility. It must:
- enforce the exact TEST Spreadsheet ID and `SNC_ITR_ENVIRONMENT=TEST`;
- read the exact 14-ID allowlist from the approved preview or validated manifest, never derive candidates from prefix alone;
- inspect the tables and fields in §4 and emit matched row IDs plus counts;
- enumerate current sheet names and headers, report unrecognized tables/headers, and fail closed if schema completeness cannot be established;
- make zero writes to Sheets, Properties, Drive, triggers, LINE or deployment;
- preserve all AuditLogs and all non-allowlisted records;
- never call business handlers or delete APIs.

Only after the owner runs that read-only utility and every required reference check passes should a final cleanup dry-run be prepared. This audit itself does not authorize cleanup.

## 6. Safety state

- Exact-ID allowlist remains the 14 IDs documented in Cleanup Preview v1.1.
- AuditLogs remain `PRESERVE_ALL`.
- Core Users, Enrollments, Course, Semester and CourseOffering remain excluded.
- No deletion utility has been created or executed.
- No live TEST Spreadsheet rows were read or changed by this static source audit.
- Cleanup remains **NOT STARTED**.
