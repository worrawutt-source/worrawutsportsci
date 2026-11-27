# Google Apps Script source — modular baseline

This folder is the canonical GitHub source for the 4084901 SPORT SCIENCE RESEARCH PROJECT backend. The backend was reorganized into numbered modules; `code.gs` is no longer the monolithic implementation.

## Source baseline

- Modular source branch: `refactor/phase2-code-modules`
- Modular source commit: `28203600734dd7fc48a334db0031cb9d2d94d335`
- Current bug-fix baseline: `fix/phase2-student-menu-admin-overview`
- Latest Course Coordinator Dashboard frontend commit: `25617c28ae48560f961f432acd1f9223c866cc22`
- Latest loader pin commit: `c0c3783542dbf0d0a6ef8ee11df8bbfdead30a37`
- Current source inventory and race-fix record: `project/STATUS.md` (see latest Phase 2 UI race fix entry)
- The bug-fix branch includes the modular source, Admin overview and Student topic-menu fixes, and the Course Coordinator Dashboard summary API. `apiAdminGetCoordinatorDashboard` returns operational status only and does not return report narratives, advisor feedback, meeting review comments, Drive URLs, or student personal details. It is a development branch; runtime TEST/UAT and deployment are not yet complete.

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
