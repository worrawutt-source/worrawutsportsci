# SNC Synthetic Fixture Cleanup Plan v1.0 — DRAFT

**Date:** 23 November 2026  
**Repository branch:** development  
**Status:** Draft for owner review only — NOT AUTHORIZED FOR EXECUTION

## 1. Purpose

Define a fail-closed, exact-ID-only disposition process for synthetic records created during the SPORT NUTRITION CLASSROOM Assignment/Group integration tests. This document does not authorize deletion and does not claim that cleanup has started.

## 2. Verified starting state

The owner-provided read-only terminal reconciliation for SNC_GroupContinuationTerminalReconciliation_READONLY_TEST() v1.0.1 reported:
- Overall PASS: 10 checks passed, 0 blocked.
- TEST Spreadsheet identity verified.
- Four synthetic Assignments, three synthetic Groups and seven synthetic GroupMembers reconcile to the existing manifest.
- Six synthetic Users and their fixture context remain part of the existing core fixture.
- Sixty-eight AuditLogs exist; exactly 19 are post-baseline records associated with this test sequence.
- No Submission references the synthetic Assignment/Group fixtures.
- Parent Assignment/Group manifest remains IN_PROGRESS; continuation status is COMPLETE_WITH_HISTORICAL_FAILURE.
- Cleanup status is NOT STARTED.

The terminal reconciliation output provides counts, not the complete primary-key allowlist. Therefore, this plan intentionally does not invent or transcribe IDs.

## 3. Non-negotiable safeguards

1. Run only in the exact TEST Spreadsheet identified by the configured TEST Script Property. Any identity mismatch must stop the process.
2. Build the deletion allowlist from the persisted synthetic fixture manifest and independently reconciled pre/post-baseline ID sets. Never infer IDs from row position, naming patterns alone, or counts.
3. Require every target record to match both its exact primary key and expected synthetic ownership/context. A missing, duplicate, unexpected, or ambiguous record blocks cleanup.
4. Never use broad table clearing, range clearing, deleteAll, prefix-wide deletion, or deletion by status/date.
5. Preserve all non-synthetic/baseline records.
6. Preserve the complete AuditLogs table, including all 19 test-related events. Audit history must not be erased as a side effect of fixture cleanup.
7. Do not delete or modify Script Properties, manifests, triggers, deployments, Drive files, LINE bindings, or user accounts as part of this plan unless a later separately reviewed plan explicitly covers them.
8. Do not run cleanup automatically after a test or as a finally/rollback action.
9. Before execution, produce a read-only preview containing exact table names, primary-key column names, exact IDs, row counts, dependency order, and expected post-cleanup counts. Owner must approve that preview separately.
10. If any row has a reference from a non-target record, stop and report the dependency. Do not cascade-delete without explicit review.

## 4. Candidate record inventory — pending exact-ID extraction

The following are candidate synthetic fixture categories, not an approved deletion list:

| Category | Candidate records | Current evidence | Cleanup decision |
|---|---|---|---|
| Assignment | 4 synthetic Assignment rows | Terminal reconciliation confirms count and manifest reconciliation | Pending exact IDs and dependency check |
| Group | 3 synthetic Group rows | Terminal reconciliation confirms count and terminal state | Pending exact IDs and dependency check |
| GroupMember | 7 synthetic GroupMember rows | Terminal reconciliation confirms count and manifest reconciliation | Pending exact IDs and dependency check |
| User | 6 synthetic User rows | Core fixture manifest; exact current state must be re-read | Do not include without separate owner decision |
| Enrollment | 6 synthetic Enrollment rows | Core fixture manifest; exact current state must be re-read | Do not include without separate owner decision |
| Course / Semester / CourseOffering | Synthetic core fixture records | Exact IDs exist in core manifest; current references must be inspected | Do not include without separate owner decision |
| AuditLogs | 19 post-baseline test events within 68 current rows | Exact delta reconciliation passed | **Preserve; no deletion** |
| Submission | 0 related rows | Terminal reconciliation confirms absence | No action |
| Drive files | None created by the Assignment/Group runners | Runner scope excluded Drive | No action |

The six synthetic Users, Enrollments and core Course/Semester/CourseOffering may be shared dependencies for future tests. Their removal is not assumed. A separate decision is required on whether to retain the core fixture for Submission Integration or retire it after all dependent stages are complete.

## 5. Required read-only preparation before any cleanup proposal is finalized

A future read-only inventory must:
- Re-verify exact TEST Spreadsheet identity and environment.
- Read the core and Assignment/Group manifests without changing them.
- Reconcile each candidate primary key against the current table.
- Confirm that no baseline row is included.
- Inspect foreign-key/reference relationships among Course, Semester, CourseOffering, Users, Enrollments, Assignments, Groups and GroupMembers.
- Confirm the absence of Submission references and any other downstream references.
- Identify the exact AuditID set for preservation; do not delete or rewrite AuditLogs.
- Emit a redacted summary for discussion, while making the full exact-ID allowlist available only for the owner’s review in the TEST environment.
- Stop if the manifest is missing, inconsistent, or does not uniquely identify every candidate record.

## 6. Dependency and deletion-order considerations

No deletion order is approved yet. If the owner later approves retirement of the core fixture, the implementation must first inspect the actual schema and reference constraints. Child records must not be removed until their exact IDs and dependencies are verified. Do not assume that application-level handlers expose a safe delete operation; any cleanup mechanism must be reviewed against authorization, audit, and referential-integrity rules.

AuditLogs remain preserved regardless of the disposition of the synthetic application records.

## 7. Approval gates

- **Gate A — Inventory:** read-only exact-ID inventory and dependency report completed.
- **Gate B — Owner review:** owner reviews exact allowlist, preserved records, expected counts, and recovery limitations.
- **Gate C — Explicit execution approval:** owner explicitly authorizes the specific cleanup operation in TEST.
- **Gate D — Controlled execution:** execute only the approved exact-ID list; stop on first mismatch or unexpected result.
- **Gate E — Post-cleanup reconciliation:** read-only verify that only approved IDs are absent, all baseline IDs remain, AuditLogs are unchanged, and no unrelated rows/files/properties changed.

Approval of this document, if given, means approval of the plan only unless the owner explicitly states otherwise. It must not be interpreted as permission to execute cleanup.

## 8. Current disposition

**No cleanup has been performed. No deletion utility has been implemented or executed.**

Recommended immediate next action: decide whether the six-user core fixture and its Course/Semester/CourseOffering/Enrollment records should be retained for the upcoming Submission Integration stage. If retained, cleanup scope should be limited to exact Assignment, Group and GroupMember synthetic records only after their exact IDs and references are revalidated. If the core fixture is to be retired, prepare a separate expanded dependency-removal proposal.
