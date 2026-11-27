# Google Apps Script source — modular baseline

This folder is the canonical GitHub source for the 4084901 SPORT SCIENCE RESEARCH PROJECT backend. The backend was reorganized into numbered modules; `code.gs` is no longer the monolithic implementation.

## Source baseline

- Modular source branch: `refactor/phase2-code-modules`
- Modular source commit: `28203600734dd7fc48a334db0031cb9d2d94d335`
- Current bug-fix baseline: `fix/phase2-student-menu-admin-overview`
- Latest Advisor Workspace TEST frontend commit: `251f1f5b64c397f1eed37fca589b5e8c1e302d82`
- Latest loader pin commit: `e1ab17ffba0fe286a671c83a244ef290bef960b0`
- Current source inventory and race-fix record: `project/STATUS.md` (see latest Phase 2 UI race fix entry)
- The bug-fix branch includes the modular source, Admin overview and Student topic-menu fixes, and the Course Coordinator Dashboard summary API. `apiAdminGetCoordinatorDashboard` returns operational status only and does not return report narratives, advisor feedback, meeting review comments, Drive URLs, or student personal details. The coordinator summary reads existing sheets without invoking workflow sheet auto-creation/seeding and returns only operational status. It is a development branch; runtime TEST/UAT and deployment are not yet complete.

## Backend file inventory

All `.gs` files in this project share one Apps Script global namespace. Number prefixes are for organization only; do not depend on file load order. Keep global function and constant names unique.

| File | Responsibility |
|---|---|
| `00_AppConfigAndEntry.gs` | Application/course configuration, `SCHEMA` and `ROLE` constants, `doGet`/`doPost`, frontend rendering and immutable GitHub asset loader. `FRONTEND_CONFIG.COMMIT_SHA` is maintained here. |
| `05_TestBootstrapAndRosterImport.gs` | TEST bootstrap helper and student roster import from Excel. Use only in an approved TEST environment. |
| `10_AuthAndUserAdministration.gs` | Student registration/OTP, login/logout, dashboard and role-specific workspace summary, user/invitation administration, password and account status, roster import and audit/user listing. |
| `20_GroupManagement.gs` | Group creation and administration, membership management/repair, leader selection, archive, student workspace and student-led group formation. |
| `30_AdvisorManagement.gs` | Advisor nomination and approval, invitation lifecycle, advisor email/magic-link authentication and assignment. |
| `40_MeetingManagement.gs` | Meeting attendance/report submission, advisor review, PDF upload/listing, meeting monitoring and additive meeting metadata migration. |
| `50_Assessment.gs` | Assessment windows, Advisor A4, peer assessment, core score entry, assessment reports and research assessment data. |
| `60_ProgressManagement.gs` | Course milestone/week plan, progress-week settings, coordinator progress monitoring/review and progress workflow migration. |
| `70_ResearchTopicProposal.gs` | Research-topic draft read/save/submit, group-leader/editability checks, advisor topic review, topic notifications and proposal PDF upload. |
| `80_WorkspaceFeedbackAndMigrations.gs` | Collaborative group progress draft/submission, advisor feedback, additive Phase 2 migrations, revision deadlines/extensions and date/time formatting helpers. |
| `90_TasksNotificationsMonitoring.gs` | Group tasks/comments, notification queue and digest, notification trigger, early-warning rules, grade release, ethics tracking and advisor-feedback status. |
| `95_SystemSettingsAndAccess.gs` | System settings, registration open/close, research workflow migration, group access checks, assessment settings and group/individual score persistence helpers. |
| `99_DatabaseAndSecurityCore.gs` | Spreadsheet/database access, schema-aware sheet helpers, object reads/writes and cache invalidation, user creation, password/token hashing, email/OTP validation, sessions and system audit logging. |
| `code.gs` | Short module note only. Backend logic must not be moved back here without an approved architecture change. |
| `setup.gs` | Safety guard and read-only system diagnostics. `setup()`, `setupTestDatabase()`, and `recoverAdminAccess()` are intentionally disabled; do not edit or run them to initialize data. |

## Frontend assets

The frontend source is in `project/frontend/`:
- `Index.html` — shell and insertion markers.
- `Styles.html` — styles.
- `Client.html` — browser-side JavaScript and navigation/rendering.
- `README.md` — frontend loader contract.

The Apps Script loader fetches these three files from `raw.githubusercontent.com` using an immutable commit SHA and a filename whitelist. The pin is `FRONTEND_CONFIG.COMMIT_SHA` in `00_AppConfigAndEntry.gs`, **not** in `code.gs`. Update the pin only after the frontend commit exists, and pin the exact tested commit rather than a branch name.

## Change and deployment workflow

1. Inspect the current branch, commit, relevant module, callers, API/permission checks and STATUS before editing.
2. Make minimal changes in a development/TEST branch. Keep module boundaries; do not duplicate API functions or global constants.
3. For a new Apps Script project, include all 13 numbered backend modules plus `code.gs` and the protected `setup.gs`. For an existing TEST project, sync the changed module(s) while retaining every other module.
4. Keep the existing `appsscript.json`; add `https://www.googleapis.com/auth/script.external_request` only as required by the approved loader configuration.
5. For frontend changes, commit frontend assets first, then update the exact SHA in `00_AppConfigAndEntry.gs`. Preserve the prior SHA for rollback.
6. Save and authorize in the TEST Apps Script project, deploy a new TEST version, and test login, each role/dashboard, registration/OTP, advisor invitation, group and meeting workflows, topic draft, progress, assessment, uploads and notifications as applicable.
7. Record static checks, runtime tests, TEST/UAT and deployment separately. Do not infer that GitHub source updates automatically change the deployed Apps Script version.

## Data and security safety

- Do not run `setup()`, `setupTestDatabase()`, `recoverAdminAccess()`, role seeding or an unapproved migration.
- `setup.gs` is protected/read-only unless explicitly approved.
- Do not change production data, `DB_ID`, `APP_SECRET`, passwords, tokens or other secrets.
- Do not deploy production without explicit approval.
## 2026-11-27 — Advisor Workspace redesign (TEST source)

- Advisor navigation is organized into five task-based menus: Overview, My Tasks, Advisor Groups, Supervision, and Assessment.
- Client.html includes the Advisor overview, task inbox, full progress-report list, direct group-to-review action, and red/amber/green workflow states.
- Styles.html adds responsive professional Advisor dashboard and review workspace styling.
- 50_Assessment.gs adds apiGetAdvisorReviewQueue(token), a batch endpoint that returns only assigned groups' topics, proposal files, and progress reports (Feedback history is loaded separately in the group workspace). It replaces frontend per-group sequential API calls with one queue API call.
- 60_ProgressManagement.gs adds apiAdvisorReviewProgressReport(token, reportId, decision, comment). It requires Advisor role, checks approved group assignment, accepts only existing APPROVED / REVISION_REQUIRED statuses, records review metadata and comment, logs the action, and notifies the group.
- 10_AuthAndUserAdministration.gs updates Advisor menu and workspace summary; exposes actual overdue group tasks and revision reports using existing due dates. No new due dates are generated.
- 00_AppConfigAndEntry.gs pins the frontend to the immutable TEST frontend commit above.
- No spreadsheet schema or setup changes. setup.gs remains protected and unchanged. Production data/deployment unchanged.
- Static syntax/API/permission checks: PASS. GAS runtime compile, Spreadsheet execution, browser TEST, regression and UAT: NOT TESTED.
- TEST GAS files to sync: 00_AppConfigAndEntry.gs, 10_AuthAndUserAdministration.gs, 50_Assessment.gs, 60_ProgressManagement.gs. Frontend Client.html and Styles.html are loaded from the pinned GitHub commit and are not copied into GAS as source files.

## 2026-11-27 — Advisor task layout and numeric menu badges (TEST source)

- Fixed the duplicate “งานของฉัน” heading in the Advisor review workspace; the outer section title remains the single page title.
- Improved review card wrapping for long Thai/English text, status labels, and feedback inputs; added narrow-screen summary layout to prevent overlap.
- Restored role-scoped red outlined numeric menu badges. Badge counts are hidden at zero, show a compact 99+ label above 99, and expose the exact count in the tooltip/accessible label. Advisor “งานของฉัน” counts pending topic/report items; “กลุ่มที่ปรึกษา” counts groups.
- Menu selection restoration now uses `data-menu-label`, so badge text does not break the saved-menu match.
- Added `apiGetMenuTaskCounts(token)` to `90_TasksNotificationsMonitoring.gs`. The API is session-protected, returns aggregate counts by role, reads each sheet once per request, and uses a direct read-only sheet reader that does not auto-create workflow sheets.
- Badge refresh runs at dashboard load and is debounced after successful mutation API calls.
- Frontend immutable commit: `6f0b213c3d79709b8ff47dff7afe1660d9e36267`; loader pin updated in `00_AppConfigAndEntry.gs`.
- No schema/migration, scoring, role permission, setup, or production-data changes. `setup.gs` unchanged.
- Static source checks: PASS (API single definition/session guard, role mapping, stable menu labels, zero-hide badge, immutable frontend pin, no auto-create sheet path). GAS runtime, browser TEST, regression, UAT, and deployment: NOT TESTED / NOT PERFORMED.

## 2026-11-27 — Responsive workspace width and typography (TEST source)

- Expanded the shared frontend shell from a 1240px maximum to a 1680px maximum, so desktop/notebook workspaces use more available viewport width while retaining responsive page padding.
- Increased dashboard sidebar sizing and menu readability; metric labels/value sizes and content headings now scale better on notebook displays.
- Improved Advisor review summary, card, feedback, status, and table typography for readability.
- Refined tablet and mobile breakpoints: 2-column metrics where appropriate, stacked dashboard layout, adjusted menu spacing, and a single-column fallback on narrow phones.
- Implemented as additive CSS overrides in `project/frontend/Styles.html`; existing rules and `Client.html` behavior remain intact.
- Frontend immutable commit: `d3666d978fc8f3447d67ca8edf2f59ea258d540f`; loader pin updated in `00_AppConfigAndEntry.gs`.
- No API, schema, role, workflow, scoring, or production data changes. `setup.gs` unchanged.
- Static CSS/source checks: PASS; visual browser QA across notebook/iPad/mobile and GAS runtime/UAT: NOT TESTED.

## TEST Release Candidate — 2026-11-27

- Candidate branch: `release/phase2-test-rc-2026-11-27`
- Source base: `feat/responsive-workspace-layout` @ `abd6a7127c589fc6869277e54f4fa692209c84c6`
- Backend: 13 numbered modules + `code.gs`; `setup.gs` remains protected and unchanged.
- Frontend immutable pin: `d3666d978fc8f3447d67ca8edf2f59ea258d540f` (Client, Index, Styles verified identical to pin).
- Static JS/API checks: PASS. GAS runtime, spreadsheet tests, browser UAT and deployment: NOT TESTED / NOT PERFORMED.
- To validate RC, use a separate TEST Apps Script project/copy. Add the numbered modules and `code.gs`; retain `appsscript.json`, TEST Script Properties and the protected `setup.gs`. Verify the DB ID/environment points only to TEST before deployment.
- Do not include or run the separate `MEETING_SUBMISSIONS` migration from the divergent meeting migration branch. Current modular source uses `MEETING_REPORTS`; any existing TEST sheet must remain untouched.
- This is a source candidate, not a deployed release.


## Current operating model (confirmed 2026-11-27)

The project is developed and used concurrently in the existing Apps Script and Spreadsheet environment. There is no separate TEST GAS or TEST Sheet, and none should be created by default. GitHub branches are used for source review and validation only; a branch is not a deployment.

The current Source Integration Candidate is `release/phase2-test-rc-2026-11-27`. It has not been confirmed as the deployed source. This RC contains TEST-only build/comment strings and the frontend currently displays a TEST environment label; verify the actual Apps Script deployment, pinned frontend SHA, Script Properties and database target with the system owner before any release. Do not change these markers or deploy without approval.
