# SNC Synthetic Fixture Cleanup Preview v1.2

**Date:** 23 November 2026  
**Repository branch:** `development`  
**Status:** 14-ROW SCOPE APPROVED — FINAL READ-ONLY DRY-RUN REQUIRED — NOT AUTHORIZED FOR EXECUTION  
**Scope:** Exact-ID candidates limited to Assignment, Group and GroupMember records (14 rows total)

## 1. Purpose and decision boundary

This v1.2 preview carries forward the exact-ID allowlist from v1.1 and incorporates the owner-supplied runtime result of `SNC_PG09ReferenceScan_READONLY_TEST()` to close the prior PG-09 evidence gap. It remains a review artifact and does not implement or authorize deletion.

It is a review artifact only. It does not implement a deletion function, execute cleanup, authorize deletion, or authorize changes to any other records. Cleanup remains **NOT STARTED**.

## 2. Evidence basis

Owner-provided TEST GAS execution log for `SNC_ExactIdInventory_READONLY_TEST()`:

- Runner version: 1.0.0
- Evidence level: `READ_ONLY_EXACT_PRIMARY_ID_AND_DEPENDENCY_INVENTORY`
- Mode: `READ_ONLY`
- Result: `PASS`; 8 checks passed, 0 blocked
- Exact TEST environment and active Spreadsheet identity: PASS
- Core, Assignment/Group and continuation manifests: PASS
- Post-baseline primary IDs: exactly 4 Assignments, 3 Groups and 7 GroupMembers
- Each allowlisted primary ID resolves to exactly one row
- Assignment/Group OfferingID relationships and GroupMember-to-Group references: PASS
- Submission references to candidate Assignments/Groups: none
- Synthetic naming prefix: PASS
- Post-baseline AuditLog IDs: 19 present; disposition `PRESERVE_ALL`
- Current AuditLogs row count: 68
- Core fixture disposition: `NOT_INCLUDED_IN_THIS_INVENTORY`

Owner-provided TEST GAS execution log for `SNC_PG09ReferenceScan_READONLY_TEST()`:

- Runner version: 1.0.0
- Evidence level: `READ_ONLY_ALL_SHEET_EXACT_ID_REFERENCE_SCAN`
- Mode: `READ_ONLY`; writesExpected=0; externalCallsExpected=0
- Result: `PASS`; 6 checks passed, 0 blocked
- Exact TEST Spreadsheet identity and core/Assignment-Group manifest: PASS
- Literal 4/3/7 allowlist matches persisted Assignment/Group manifest IDs: PASS
- All 23 current Spreadsheet tabs enumerated and readable: PASS
- All 14 allowlisted primary IDs present in the expected target sheets: PASS
- No exact allowlisted ID token found outside the 14 target rows and preserved AuditLogs: PASS
- Unexpected reference count: 0
- AuditLogs: 19 matching rows classified `PRESERVE_AUDITLOG`; disposition `PRESERVE_ALL`
- Current sheet counts reported: Assignments 24 data rows, Groups 3, GroupMembers 7, AuditLogs 68; dependency sheets including Submissions, SubmissionFiles, Grades, GradeHistory, GradeReviewRequests and NotificationLogs were readable and had 0 data rows at scan time.

The scan result is owner-supplied runtime evidence. It establishes the absence of exact allowlisted ID tokens in the current contents of all 23 readable tabs at the time of execution. It does not prove that future writes cannot create references, nor does it replace the mandatory immediate pre-deletion re-scan.

The execution log is owner-supplied runtime evidence. It is not an independent live re-query by this document. The values below are transcribed from the owner-supplied execution logs. The exact-ID inventory evidence is retained from v1.1; the PG-09 scan evidence is new in v1.2.

## 3. Exact-ID Allowlist

**Total candidate rows: 14**  
These are the only primary IDs that may be considered by a future, separately approved cleanup operation.

### 3.1 Assignments — 4 IDs

CourseOffering ID for all four records:  
`807e157d-436b-4f27-acfb-bc084a625637`

| # | Table | Primary-key column | Exact ID | Synthetic title | Type | Status | MaxGroupMembers |
|---:|---|---|---|---|---|---|---|
| A-01 | Assignments | AssignmentID | `b018a6df-5ae3-4304-8573-6d0a90890534` | `SNC_TST_20261122_ASG_IND` | INDIVIDUAL | CLOSED | blank |
| A-02 | Assignments | AssignmentID | `e405c32f-852a-4493-a2c1-2b83c8838296` | `SNC_TST_20261122_ASG_GRP3_UPDATED` | GROUP | DRAFT | 3 |
| A-03 | Assignments | AssignmentID | `e98a8ff4-0c65-47b4-baee-bcfb81924de5` | `SNC_TST_20261122_ASG_GRP2` | GROUP | DRAFT | 2 |
| A-04 | Assignments | AssignmentID | `3c140d03-2cc6-4378-b054-97254aefcf4b` | `SNC_TST_20261122_ASG_GRPN` | GROUP | DRAFT | blank |

### 3.2 Groups — 3 IDs

| # | Table | Primary-key column | Exact ID | Synthetic group name | OfferingID | Status | MembershipLocked |
|---:|---|---|---|---|---|---|---|
| G-01 | Groups | GroupID | `6590bfca-b632-4051-a26b-319af25f382d` | `SNC_TST_20261122_GRP_ALPHA` | `807e157d-436b-4f27-acfb-bc084a625637` | ACTIVE | false |
| G-02 | Groups | GroupID | `31597565-51c6-4684-89b1-d75da8ddf870` | `SNC_TST_20261122_GRP_BETA` | `807e157d-436b-4f27-acfb-bc084a625637` | ACTIVE | false |
| G-03 | Groups | GroupID | `b5b6896b-4d80-49c9-87e5-b179a2d6eb46` | `SNC_TST_20261122_GRP_SOLO` | `807e157d-436b-4f27-acfb-bc084a625637` | ACTIVE | false |

### 3.3 GroupMembers — 7 IDs

| # | Table | Primary-key column | Exact ID | GroupID | UserID | Role | Status | LeftAt |
|---:|---|---|---|---|---|---|---|---|
| M-01 | GroupMembers | GroupMemberID | `dc5afafa-27e2-407d-bd43-337c7bc3e14f` | `6590bfca-b632-4051-a26b-319af25f382d` | `USR_34dbfc6a-e893-48c6-960b-f83af2324a4a` | MEMBER | LEFT | true |
| M-02 | GroupMembers | GroupMemberID | `61c8b2a1-f130-463d-9045-c18d34e453c1` | `6590bfca-b632-4051-a26b-319af25f382d` | `USR_69ddcc23-59fc-40fa-a91d-1b8b2fdb977b` | LEADER | ACTIVE | false |
| M-03 | GroupMembers | GroupMemberID | `d6575a39-4164-4441-afeb-0887183f211a` | `6590bfca-b632-4051-a26b-319af25f382d` | `USR_34dbfc6a-e893-48c6-960b-f83af2324a4a` | MEMBER | ACTIVE | false |
| M-04 | GroupMembers | GroupMemberID | `67a6977d-4ba0-4ad1-a0ae-940cd735404c` | `31597565-51c6-4684-89b1-d75da8ddf870` | `USR_fff7b26d-cb3e-479c-b53c-5e5fe203b555` | LEADER | ACTIVE | false |
| M-05 | GroupMembers | GroupMemberID | `6ea007f2-1763-403a-98db-1e4ba0878003` | `31597565-51c6-4684-89b1-d75da8ddf870` | `USR_5a197484-c631-4874-b04d-65fc623ca5c8` | MEMBER | ACTIVE | false |
| M-06 | GroupMembers | GroupMemberID | `9bf0497f-3410-44b0-97e1-4d4f91fd0be6` | `31597565-51c6-4684-89b1-d75da8ddf870` | `USR_a3a78e50-d733-4b90-a494-34c496545dc4` | MEMBER | ACTIVE | false |
| M-07 | GroupMembers | GroupMemberID | `92d06156-ee86-410f-9b3a-8aaf78151e80` | `b5b6896b-4d80-49c9-87e5-b179a2d6eb46` | `USR_428efbae-91ad-44d8-8de4-eb9309445850` | LEADER | ACTIVE | false |

**GroupMember history note:** M-01 is a historical `LEFT` row. The same UserID appears in M-03 as an `ACTIVE` row. Both are distinct exact primary IDs in the verified manifest and are listed separately. Do not deduplicate by UserID or delete by GroupID/UserID predicates; only exact primary IDs may be considered.

## 4. Explicit exclusions and preservation list

The following are outside the allowlist and must not be modified or deleted by this cleanup scope:

| Data | Current evidence | Required disposition |
|---|---|---|
| All AuditLogs (68 current rows) | 19 post-baseline IDs verified present | **PRESERVE ALL 68**; no row, cell, or ID mutation |
| Core Users | 6 synthetic users in core fixture | Exclude; retain |
| Enrollments | 6 synthetic enrollments in core fixture | Exclude; retain |
| Course | Core fixture record | Exclude; retain |
| Semester | Core fixture record | Exclude; retain |
| CourseOffering | `807e157d-436b-4f27-acfb-bc084a625637` | Exclude; retain |
| Submissions | No rows reference candidate Assignment/Group IDs | No action; recheck at execution time |
| Drive files | Not created by this Assignment/Group test scope | No action |
| Script Properties and manifests | Required for evidence and provenance | Preserve unchanged |
| Triggers, deployments, LINE bindings | Outside test-runner scope | Preserve unchanged |
| All other/baseline rows | Not in exact allowlist | Preserve unchanged |

The 19 test-related AuditLogs are evidence of the operations performed. They must remain available even if the 14 application rows are later removed.

## 5. Pre-deletion Guard — mandatory fail-closed checks

A future cleanup implementation, if separately approved, must perform all checks below immediately before its first mutation. A failed, missing, ambiguous, or unreadable check must abort the entire operation before any deletion. It must not skip a failed check, infer a value, retry with a broader predicate, or partially continue.

| Guard | Required assertion | Abort condition |
|---|---|---|
| PG-01 Environment | `SNC_ITR_ENVIRONMENT=TEST`; configured TEST Spreadsheet ID and active Spreadsheet ID both equal the approved TEST ID | Any mismatch, missing property, or inability to read identity |
| PG-02 Branch/source | Cleanup code and reviewed allowlist are the approved versions on `development`; no production deployment/action is involved | Source/version mismatch or target not TEST |
| PG-03 Manifest | Core and Assignment/Group manifests resolve; continuation remains `COMPLETE_WITH_HISTORICAL_FAILURE`; historical ASG-13 failure remains preserved | Missing, malformed, changed, or inconsistent manifest |
| PG-04 Exact allowlist | Runtime candidate ID sets equal the 4 Assignment, 3 Group and 7 GroupMember IDs in §3 exactly; no extra IDs, missing IDs, duplicates, or substitutions | Any set difference or duplicate |
| PG-05 Unique row resolution | Each of the 14 exact primary IDs resolves to exactly one row in its named table | Zero or multiple matching rows |
| PG-06 Record identity | Every row still matches its expected synthetic title/name, expected OfferingID and expected key relationship in §3; reserved prefix is necessary but not sufficient | Any field mismatch, non-synthetic value, or unexpected change |
| PG-07 Parent/child integrity | Every GroupMember points to one of the three allowlisted Groups; every Group points to the expected Offering; Assignment OfferingIDs match the expected Offering | Orphan, foreign, or changed relationship |
| PG-08 Submission dependencies | Re-read the complete Submissions table and verify no row references any allowlisted AssignmentID or GroupID | Any reference, unreadable table, missing schema, or uncertain reference mapping |
| PG-09 Other references | Re-scan every current Spreadsheet tab and all used cells for exact allowlisted ID tokens, including delimited/composite references. Confirm all tabs are readable and no match exists outside the 14 target rows and preserved AuditLogs. Owner-run v1.0 scan passed across 23 tabs with 0 unexpected references. Repeat this scan immediately before deletion. | Any dependent row, unreadable/new tab, missing schema, unexpected match, or incomplete scan |
| PG-10 Audit preservation | Snapshot all current AuditID values and count immediately before cleanup; verify all 68 current rows (including the 19 post-baseline IDs) remain present and unchanged after cleanup | Any missing, added, duplicate, or changed AuditLog row/ID |
| PG-11 Baseline protection | Compare current primary IDs against the preserved pre-batch baseline and prove that no baseline ID appears in the allowlist or deletion set | Baseline overlap, unreadable baseline, or unexpected delta |
| PG-12 Backup/recovery | Confirm a current, owner-accessible backup/recovery point for the TEST Spreadsheet and verify the approved recovery procedure is available before mutation | No current backup, inaccessible backup, or unverified recovery path |
| PG-13 Approval | Record explicit owner approval for this exact v1.1 allowlist, operation order, TEST target and execution window | Approval absent, ambiguous, or scope differs |
| PG-14 Dry-run report | Produce a final read-only dry-run immediately before execution showing all 14 exact IDs, row matches, dependencies, preserved counts and zero unintended targets | Any discrepancy or dry-run not reviewed |

**PG-09 evidence update:** The owner-run `SNC_PG09ReferenceScan_READONLY_TEST()` passed 6/6 checks. It enumerated all 23 current tabs and scanned their used cells for exact allowlisted ID tokens, including compound/delimited references. It found the 14 target rows, 19 preserve-only AuditLog matches, and zero unexpected references. This closes the previously documented live-data scan gap for the spreadsheet state at scan time. The static source audit remains relevant to future changes; the pre-deletion guard must repeat the all-tab scan immediately before mutation and abort on any changed or unreadable state.

## 6. Proposed operation order — not approved for execution

If and only if every guard passes and separate execution approval is recorded, the proposed order is:

1. Remove the seven exact GroupMember rows (M-01 through M-07) by `GroupMemberID`.
2. Re-read and verify all seven exact GroupMember IDs are absent; verify all non-allowlisted GroupMember IDs remain unchanged.
3. Remove the three exact Group rows (G-01 through G-03) by `GroupID`.
4. Re-read and verify all three exact Group IDs are absent; verify all non-allowlisted Group IDs remain unchanged.
5. Remove the four exact Assignment rows (A-01 through A-04) by `AssignmentID`.
6. Re-read and verify all four exact Assignment IDs are absent; verify all non-allowlisted Assignment IDs remain unchanged.
7. Reconcile all preserved records and AuditLogs; stop on the first mismatch.

This ordering removes child membership rows before their Group parents. Assignments are listed after Groups for a simple, explicit sequence; no direct Assignment-to-Group foreign key is asserted by the current inventory. The implementation must follow actual schema constraints and must not cascade-delete.

No batch-wide delete, range clear, prefix search delete, row-number delete, or deletion by status/date is permitted. If the approved execution mechanism cannot target and verify exact IDs safely, do not execute cleanup.

## 7. Expected post-cleanup state — conditional projection only

These are expected counts only if the approved 14 exact rows are the sole rows removed and every guard passes. They are not observed results.

| Table | Pre-cleanup count of relevant records | Candidate removals | Expected post-cleanup state |
|---|---:|---:|---|
| Assignments | 4 post-baseline candidates | 4 | Those 4 IDs absent; all baseline/other rows unchanged |
| Groups | 3 post-baseline candidates | 3 | Those 3 IDs absent; all baseline/other rows unchanged |
| GroupMembers | 7 post-baseline candidates | 7 | Those 7 IDs absent; all baseline/other rows unchanged |
| AuditLogs | 68 total; 19 post-baseline | 0 | All 68 rows and all AuditIDs unchanged |
| Users | Core fixture contains 6 | 0 | Unchanged |
| Enrollments | Core fixture contains 6 | 0 | Unchanged |
| Course / Semester / CourseOffering | Core fixture records | 0 | Unchanged |
| Submissions | 0 references to candidate records at inventory time | 0 | Unchanged; must recheck before execution |

## 8. Execution and verification gates

- **Gate A — Exact inventory:** satisfied by owner-provided read-only runtime PASS (8/8).
- **Gate B — PG-09 all-sheet reference scan:** satisfied by owner-provided read-only runtime PASS (6/6) across 23 tabs; zero unexpected references. This is a point-in-time result and must be repeated immediately before cleanup.
- **Gate C — Preview review and exact 14-row scope:** OWNER APPROVED. Owner approved the scope of exactly 14 records in v1.2; this approval does not authorize execution.
- **Gate D — Explicit cleanup authorization:** not granted. Requires a separate, unambiguous instruction naming this v1.2 preview and TEST scope.
- **Gate E — Controlled cleanup:** not started; no cleanup code is included in this document.
- **Gate F — Post-cleanup reconciliation:** not started; must independently verify exact deletions and preservation of all other data.

Approval of the 14-row scope is not authorization to execute cleanup. After the fresh final read-only dry-run is reviewed, a separate explicit execution instruction is still required.

## 9. Current disposition

**Owner scope approval:** 14 exact rows in v1.2 approved; no expansion or substitution.
**Final pre-deletion dry-run:** PENDING.
**Execution authorization:** NOT GRANTED.
**Cleanup status: NOT STARTED.**  
**Deletion utility: NOT IMPLEMENTED.**  
**Exact allowlist: documented for review only.**  
**AuditLogs and core fixture: explicitly excluded and preserved.**

The next action is owner review of this preview. Any change to the 14 IDs or the scope requires a new read-only inventory and a revised preview version. The 23-tab PG-09 scan is point-in-time evidence only; it does not authorize deletion.
