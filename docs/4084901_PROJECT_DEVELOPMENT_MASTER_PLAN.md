# 4084901 SPORT SCIENCE RESEARCH PROJECT
# แผนพัฒนาและติดตามระบบฉบับหลัก (Development Master Plan)

- Version: 1.0 | วันที่: 26 พฤศจิกายน 2569
- สถานะ: Working Baseline — แผนกำกับงาน ยังไม่ใช่การอนุมัติให้เปลี่ยนระบบทุกส่วน
- Repository: worrawutt-source/worrawutsportsci
- Branch: feature/meeting-submissions-migration

> **หลักการ:** รายวิชากำลังสอน ระบบต้องมีส่วนที่ใช้งานได้จริงให้นักศึกษาและอาจารย์ใช้ระหว่างพัฒนา ไม่หยุดการใช้งานเพื่อรอให้ระบบสมบูรณ์ ส่งมอบเป็นชุดเล็กที่ใช้งานได้ (Incremental Development with Continuous Usable Release)

## 1. วัตถุประสงค์
ใช้เป็นแผนหลักสำหรับทบทวนและติดตามการพัฒนาตลอดโครงการ ระบุขอบเขต ลำดับงาน ผลส่งมอบ เกณฑ์ตรวจสอบ สถานะจริง และประวัติการเพิ่ม/เปลี่ยน/เลื่อน/ยกเลิกฟังก์ชัน ทุกครั้งที่เริ่มงานให้เปิดเอกสารนี้ ตรวจ Change Log/Release Log และตรวจ branch/commit/TEST ล่าสุด ห้ามใช้แผนแทนการตรวจ code ปัจจุบัน

## 2. หลักการพัฒนา
### Teaching-first
- รักษาฟังก์ชันที่นักศึกษาใช้อยู่ เลือกงานที่ช่วยให้ทำ milestone ปัจจุบันได้ก่อน
- ทุกชุดงานต้องส่งมอบฟังก์ชันที่ใช้ได้ ไม่รอทุกโมดูล
- ถ้าฟังก์ชันยังไม่พร้อม ให้ระบุข้อจำกัดและวิธีทำงานชั่วคราวอย่างตรงไปตรงมา
- ปรับลำดับตามปฏิทินการสอนและบันทึกเหตุผล

### Minimal Change / Feature Integration
- ตรวจเฉพาะ code/data ที่เกี่ยวข้อง; ระบุไฟล์และผลกระทบก่อนแก้
- แก้เท่าที่จำเป็น ไม่ refactor ทั้งระบบโดยไม่มีเหตุผล
- ห้ามเปลี่ยน baseline, schema, workflow, production data หรือคะแนนที่อนุมัติแล้วโดยพลการ
- setup.gs เป็น read-only diagnostics ห้ามแก้ เว้นแต่ได้รับอนุมัติแยก
- ห้ามเปลี่ยน Password Hash, GPS/Exam Entry หรือ Clean Setup ของระบบอื่นนอกขอบเขต

### Release safety
พัฒนาใน branch → ตรวจ diff → TEST → regression test ส่วนเดิมที่เกี่ยวข้อง → user review → release ตามขั้นตอนจริง ต้องไม่อ้างว่า test/deploy ผ่านหากไม่มีหลักฐาน

## 3. เป้าหมายและผู้ใช้งาน
- STUDENT: เห็นงาน ทำ draft/submit อ่าน feedback แก้ไขและส่งใหม่
- ADVISOR: เห็นกลุ่มที่รับผิดชอบ ตรวจงาน ให้ feedback/endorsement ติดตามความก้าวหน้า
- COURSE COORDINATOR/ADMIN: จัดการงาน ติดตามทุกกลุ่ม ประสาน Advisor ตรวจ submission และให้ feedback ตามสิทธิ์

รายวิชามุ่งให้นักศึกษาจัดทำ proposal บทที่ 1–3 และเครื่องมือวิจัย/แผนตรวจสอบคุณภาพ ไม่ได้กำหนดให้เก็บข้อมูลจนได้ผลวิจัยในรายวิชานี้

## 4. System Scope
1. Authentication, role access, session/password
2. Group/member/account linking
3. Advisor nomination and approval
4. Assignment/Task/Milestone
5. Submission/version history/duplicate protection
6. Advisor review/endorsement/revision feedback
7. Course-level monitoring and feedback
8. Action Queue, dashboard counts, direct links, notifications/email tracking
9. Advisor supervision records
10. Research templates: Concept, Chapter 1, Chapter 2, Chapter 3, Instruments
11. Final proposal compilation and DOCX/PDF export
12. Assessment Module
13. Admin, audit, backup/restore, error monitoring, privacy/security

**Out of scope now:** Full REC submission/approval workflow. Proposal data should be reusable for future REC preparation, but course approval is not REC Approval; no data collection before required ethics approval.

## 5. Release prioritization
Priority: (1) students cannot work/submit, (2) data lost/duplicated/status mismatch, (3) reviewer cannot receive/review, (4) user cannot see next action, (5) manual tracking burden, (6) enhancement.

Each release records problem, users, scope/files, user outcome, tests, known limitations, recovery/rollback, status and evidence. Status: Planned / In Progress / In TEST / Accepted / Released / Deferred / Blocked. Released requires evidence, not merely a commit.

## 6. Workstreams

### A — System Stabilization
A1 Authentication/Role: student/advisor/admin login; server-side role checks; session/logout/expiry; password setup/change; invitation acceptance; prevent cross-role API access.
A2 Group/account linking: group/member consistency, duplicate membership, wrong group link, authorized member changes and audit.
A3 Advisor nomination: student nomination, Coordinator approve/reject, consistent status across roles, duplicate approval protection.
A4 Email Delivery Tracking: recipient/type/time/status/error; admin view of sent/failed/pending; safe resend without duplicate approval/action; no credentials or unnecessary personal data in logs.
A5 Duplicate submission/response consistency: double-click/retry protection; server guard/idempotency; success UI reflects actual DB result; timeout checks current status before retry; failure never shows success.
**Release A:** critical usage blockers fixed; related regression tests pass.

### B — Assignment & Review Workflow (teaching-critical)
B1 Assignment fields: ID, course/group target, title/instructions, creator, due date, task type/template, status, optional attachment. Coordinator creates/assigns; student sees own tasks; assignment edits do not damage old submissions.
B2 Submission: Draft, Submit actor/time, duplicate guard, submitted version locked, Revision Required editable, resubmit creates new version, history/status/date shown clearly.
B3 Advisor review: only assigned groups; review submitted version; Approve/Endorse or Revision Required as task requires; feedback/reviewer/time/version recorded; student notified; old feedback retained.
B4 Course Coordinator monitoring: sees student submissions and advisor endorsement; inspect/feedback by permission; course feedback is separate from advisor endorsement; revision notifies student and advisor.
B5 Action Queue/Notification: first pending list/count/badge/direct link; then email when core workflow stable. Student: assignment/feedback/revision. Advisor: new submission/resubmission. Coordinator: submitted/endorsed/pending review. Track delivery and safe resend.
**Release B:** student submit → advisor review/feedback → revise/resubmit works; Coordinator can monitor, even if advanced email is still pending.

### C — Research Task Templates
Use one assignment/submission/review engine with structured task-specific forms, not one generic text blob.
C1 Concept: Thai/English title, rationale/concept, objectives, research question if required, target/site preliminary, advisor feedback/endorsement.
C2 Chapter 1: sections from confirmed Course Outline/format (e.g. background, problem, objectives, scope, definitions, significance). This list is not an approved template until checked against source document.
C3 Chapter 2: sections, related studies, bibliography metadata, citations/references, edit history.
C4 Chapter 3: design, population/sample, inclusion/exclusion, variables/operational definitions, instruments/quality checks, procedure, analysis, ethics/privacy.
C5 Instruments: files/version, quality-check plan/evidence; do not claim validity/reliability without evidence.
C6 Template versioning: each template has version; prior submissions immutable; changes apply to new tasks or approved migration; test template update against old records.
**Release C:** enable templates one by one according to teaching milestones.

### D — Advisor Supervision
D1 Dashboard: assigned groups, milestone progress, pending submissions, revisions, overdue, direct links.
D2 Supervision Record: date/mode/participants, discussion, feedback/decision, student next tasks, optional next follow-up, history.
D3 Milestones: Concept → Ch1 → Ch2 → Ch3 → Instruments → Final Proposal. Status based on submission/review evidence; student cannot self-mark approved; Advisor endorsement gates only where required.
**Release D:** advisor can track progress and record supervision; milestone-based, not compulsory weekly meetings.

### E — Final Proposal Compilation & Export
Compile approved/current versions of Ch1–3, references and instruments according to confirmed format; generate editable DOCX and fixed PDF; test Thai fonts/page breaks/TOC/headings/tables/figures/references; record export date/template version/history; never overwrite source submission.
**Release E:** export proposal to DOCX/PDF.

### F — Assessment Module
Preserve approved 100 points:
- A1 Progress presentation: 10
- A2 Proposal presentation: 30
- A3 Final proposal report: 20
- A4 Advisor assessment: 30
- A5 Peer assessment: 10
Functions: approved rubric, group/individual scores separated, evaluator/time, range/total validation, permission, preview before publication, audit score changes, peer assessment confidentiality.
**Release F:** assessment components work and are auditable; no weight changes without approval.

### G — Administration, Security & Privacy (continuous)
Admin dashboard; group/advisor/status filters; audit log; backup and tested restore; error monitoring; file access control; session/password; XSS/HTML injection/input validation; IDOR/cross-group access tests; data minimization; privacy in email/log/export; retention/deletion policy. Security/regression review every release.
**Release G:** operational and privacy/security controls suitable for live use.

## 7. Teaching-first roadmap
These are flexible increments, not sequential gates that block all development:
- R0 Preserve current usable system; document existing functions
- R1 Critical reliability: login/role/group/duplicate submission/response mismatch
- R2 Basic Assignment & Submission: task, draft, submit, status
- R3 Advisor Review: feedback, revision, version history
- R4 Coordinator Monitoring: submitted/endorsed/pending visibility
- R5 Action Queue/Notification: counts, direct links, email tracking/resend
- R6 Concept + currently needed template
- R7 Chapter 1–3 and instruments, one template at a time
- R8 Advisor supervision dashboard/records
- R9 Final proposal compilation/export
- R10 Assessment Module
- R11 Admin/security hardening
Move work earlier when teaching requires it; record change and retain data/permission/security standards.

## 8. Starting status (context only; verify current code)
- Student submission UI lock/revision behavior was developed in prior branch work; verify current code/tests before calling Released.
- MEETING_SUBMISSIONS table: user confirmed successful creation in TEST; **do not rerun migration without checking first**.
- database_migrations.gs commit: b295941c94231d1c5281c8580273b84dc7be7446; TEST-gated; setup.gs unchanged.
- Full Assignment/Review, templates, supervision, export, assessment: deliver by usable increments; verify current branch/PR first.
This is project context, not live repository audit.

## 9. Definition of Done
1. Requirement matches approved scope
2. Server-side permissions verified
3. UI/status matches actual data
4. Duplicate/retry/error behavior tested
5. Data preserved; migration/rollback documented if needed
6. Happy path and critical failures tested
7. Related regression passes
8. TEST review/acceptance evidence where required
9. Known limitations recorded
10. Commit/PR/test evidence linked
11. Plan, Release Log, Change Log updated
12. No unsupported claim of test/deploy/acceptance

## 10. Change Control
For each new/changed feature: record request; reason/user/teaching impact; database/API/role/workflow/UI/notification/test/data impact; check approved baseline; propose scope/files; obtain approval before schema/workflow/production/assessment/security baseline changes; implement minimal change and test; update plan/status/evidence; preserve history.

Change types:
- A Bug Fix: no intended behavior change
- B Minor Feature: no major schema/permission/workflow change
- C Workflow/Data Change: status/approval/schema; impact analysis + approval
- D Baseline/Security/Assessment: approved scope, production, security or scores; explicit approval required

## 11. Change Log (append new entries; never erase history)
| Date | ID | Type | Change | Reason/Impact | Status/Evidence |
|---|---|---|---|---|---|
| 2026-11-26 | CHG-002 | Planning | Master Plan becomes continuously updated source of truth | Continuity across work sessions | v1.0 |
| 2026-11-26 | CHG-001 | Planning | Adopt usable incremental releases | Course is in progress; students need system now | v1.0 |
| 2026-11-26 | CHG-003 | C Workflow/Data Change (approved) | Add structured online advisor meeting report form; retain legacy PDF records; distinguish upcoming meetings from due reports | Replace student PDF upload with in-system form and prevent false pending counts; implementation branch `perf/perf-01-advisor-dashboard-load`, TEST/UAT pending | Approved; source implementation committed on feature branch, not deployed |
| 2026-11-26 | CHG-004 | UI/Workflow correction (approved by user request) | Fix missing input controls; remove Student group dropdown; use Thai Buddhist date picker; show submitted state without disabled form; allow partial drafts | Screenshot review found local field controls were not appended; correct scoped DOM rendering and draft/submission UX | Source committed on feature branch; static checks PASS; TEST/UAT pending |

## 12. Release Log (actual delivery only)
| Release | Date | Scope | Test evidence | User acceptance | Deployment | Status |
|---|---|---|---|---|---|
| R0 | — | Current usable baseline | — | — | To verify |
| R1+ | — | Teaching readiness review | — | — | Planned |

## 13. Risk Register
| ID | Risk | Mitigation | Status |
|---|---|---|---|
| K01 | DB save succeeds but UI shows error/status mismatch | response consistency, idempotency, check status before retry | verify/fix |
| K02 | users cannot find pending work | action queue, count, direct link | planned |
| K03 | template update damages old submission | immutable versions/template versioning | planned |
| K04 | development lags teaching calendar | teaching-first usable releases | active |
| K05 | cross-group data exposure | server authorization, access tests, audit | continuous |
| K06 | email failure/resend duplicates action | delivery tracking, safe resend | planned/verify |

## 14. Next action — Teaching Readiness Review
Check only what students need for the current milestone: login; correct group/member; task visible; draft/submit and accurate status; Advisor can open/feedback; Coordinator sees submission/advisor status. Use findings to select the next release; do not wait for a full-system audit.

## 15. Internal sources
- แผน.txt — System Stabilization, Research Workflow, Advisor Supervision, Assessment, Administration/Security
- Phase 1 System Analysis & Design Revised Draft v1.1 — accepted design baseline
- Confirmed Course Outline/course documents — authority for course structure and scores
- Repository: worrawutt-source/worrawutsportsci

If this plan conflicts with a user-approved Course Outline or baseline, the approved source takes precedence; document the reconciliation in Change Log.


## 16. CHG-003 — Online Advisor Meeting Report (Approved 2026-11-26)

Approved scope:
- Replace student PDF upload UI for advisor meeting records with structured in-system fields based on the prior meeting record: meeting date; work completed before meeting; 3 Agenda items; problems/barriers; advisor consultation summary; 3 follow-up actions with due dates.
- Student group representative may save draft and submit; advisor reviews/approves or returns for revision; Course Coordinator monitors status.
- Add new additive sheet `MEETING_REPORTS`; retain existing `MEETING_FILES` and PDF records as read-only historical entries. Do not delete or migrate old PDF content into fields.
- Monitoring marks sessions UPCOMING until an actual meeting attendance record exists; only recorded meetings without a report count as NOT_SUBMITTED. Submitted reports remain visible regardless of attendance entry.
- Preserve role and group authorization, audit logging, and use batched row updates. Do not edit `setup.gs`.

Implementation evidence (latest UI correction):
- Implementation branch: `perf/perf-01-advisor-dashboard-load`
- Backend pin commit: `76f1185a25076d8c0bae2306cb007a60843f4984`
- Client commit / immutable Frontend pin: `59d0e43697fdc339b8c5d1e068e53972d8867cfc`
- Styles commit: `0e9c0c2eede8fa59d7e90035ab2da743f98159a5`
- Static cross-file and JavaScript syntax checks: PASS
- GAS runtime, TEST deployment, and UAT: NOT TESTED / PENDING
- Production: unchanged

Note: The plan's earlier starting-status reference to `MEETING_SUBMISSIONS` reflects its earlier project context. This implementation branch's inspected baseline uses `MEETING_FILES`; the additive `MEETING_REPORTS` schema is separate and preserves that legacy sheet. Confirm the actual TEST database before any schema setup or deployment.


## 17. CHG-004 — Meeting Report UI Correction (2026-11-26)

After reviewing the student screenshots, the user requested these corrections:
- Do not show the group selector to Students; show their assigned group name and research/advisor/member context as static information. Advisor group selection remains available.
- The prior form fields were not interactive because the local `el()` helper accepts one text argument and ignored additional child controls. Scope the fix to the meeting report form using a DOM builder that explicitly appends controls; do not alter the global helper and risk unrelated screens.
- Render visible textareas with clear labels/placeholders and separate Agenda 1–3 and follow-up action 1–3 fields.
- Use explicit day/month/Buddhist Era year selects; convert selected dates to ISO Gregorian for the existing backend date schema. Display report and due dates in Thai Buddhist Era.
- After SUBMITTED or VERIFIED, show submitted/review status and the saved record, and hide the edit form instead of leaving disabled controls on screen. Keep DRAFT and REVISION_REQUIRED editable as permitted.
- Save Draft may persist partial content; Submit must validate required content and all dates on both client and server.

Verification: Client and GAS JavaScript syntax compile PASS; static cross-file checks PASS; GAS runtime/browser, TEST deployment, and UAT remain pending. Production is unchanged.
