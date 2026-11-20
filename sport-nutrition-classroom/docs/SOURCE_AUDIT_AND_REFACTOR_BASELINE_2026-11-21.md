# SPORT NUTRITION CLASSROOM — Source Audit & Development Baseline

**Date:** 2026-11-21  
**Repository:** `worrawutt-source/worrawutsportsci`  
**Branch:** `development`  
**Scope:** Five Google Apps Script source files under `sport-nutrition-classroom/backend/`

## 1. Source baseline

The five uploaded GAS source files were mapped by their source headers, not by their upload filenames:

| Repository file | GAS upload source |
|---|---|
| `Code.gs` | `course.txt` |
| `AssignmentManagement.gs` | `code.txt` |
| `CourseManagement.gs` | `ass.txt` |
| `EnrollmentManagement.gs` | `enroll(1).txt` |
| `setup.gs` | `enroll.txt` |

The duplicate upload `setup.txt` was a copy of Course Management, not the Setup module. Before refactoring, the five GitHub files matched the mapped GAS files in content (the only observed length differences were terminal-newline formatting).

## 2. Function ownership

| File | Primary ownership | Shared dependencies |
|---|---|---|
| `Code.gs` | Web App entry points (`doGet`, `doPost`), LINE LIFF token verification, API envelope/response handling, account linking and email-change OTP, account audit append | Exposes `rowsAsObjects_`, `apiError_`, `appendAudit_`, identity/account helpers |
| `AssignmentManagement.gs` | Assignment CRUD, assignment-level authorization, individual/group submission configuration, manual open/close, scheduled open/close and scheduler trigger | Uses Course Management data access/authorization helpers and shared audit append |
| `CourseManagement.gs` | Course, semester, offering and instructor management; role resolution; scoped authorization; course/semester/offering visibility | Uses account identity helpers, `rowsAsObjects_`, `apiError_`, `appendAudit_` |
| `EnrollmentManagement.gs` | Offering-scoped student import preview/execute/recovery, import job/errors, enrollment roster and enrollment status | Uses Course Management authorization/data helpers and shared row/audit helpers |
| `setup.gs` | Initial Account Linking schema setup and legacy staging import helper | Uses its own setup configuration and sheet-format helpers |

## 3. Duplicate and overlap findings

### Confirmed redundant wrappers removed

1. `amGet_(id)` in Assignment Management only forwarded to `cmGet_('Assignments', 'AssignmentID', id)`. The wrapper was removed and all call sites now invoke `cmGet_` directly.
2. `emCanOffering_(actor, offering)` in Enrollment Management only forwarded to `cmCanOffering_(actor, offering)`. The wrapper was removed and all call sites now invoke the shared authorization function directly.
3. `emRole_(actor, role)` had no call sites. The unused helper was removed.

### Similar helpers intentionally retained

- `accountSheet_`, `cmSheet_`, and `emSheet_` perform similar sheet lookup/availability checks, but each reports a module-specific database error. They remain separate to preserve diagnostic context and avoid changing error behavior.
- `cmRows_` and `emRows_` are thin module-specific wrappers around shared `rowsAsObjects_`; they remain because they use their respective sheet guards.
- `cmCanOffering_` remains the shared offering-scope authorization predicate. Assignment and Enrollment should call it rather than maintain forwarding wrappers.

### Code.gs and AssignmentManagement.gs

No duplicate top-level function or global declaration was found between these files. Their responsibilities are complementary: `Code.gs` authenticates and routes `assignment.*` actions; `AssignmentManagement.gs` executes the assignment business logic. They should remain separate.

## 4. Static structural checks

- No duplicate top-level function names were found across the five files.
- No duplicate top-level constant/variable declarations were found across the five files.
- The refactored versions of all five files passed Node.js syntax parsing (Node.js 22) using the uploaded GAS baseline plus the exact committed text transformations.
- Redundant helper references (`amGet_`, `emCanOffering_`, `emRole_`) were checked to be absent after refactoring.

## 5. Changes committed to development

| Commit | File | Change |
|---|---|---|
| `187a7a45cc9818e9fee365ece5d1501b42f2b0a6` | `AssignmentManagement.gs` | Removed `amGet_`; replaced its nine call sites with direct shared `cmGet_` calls |
| `2077336bce8b8dd70894b7e5af120e07e1403958` | `EnrollmentManagement.gs` | Removed unused `emRole_`; removed `emCanOffering_` and replaced its four call sites with `cmCanOffering_` |

## 6. Verification limits and next steps

This audit is static/source-level. It does **not** establish live Google Apps Script runtime success, spreadsheet schema integrity, authorization behavior against live data, trigger behavior, or end-to-end API success. No GAS project, spreadsheet data, `main`, or Production deployment was changed.

Next validation should run the existing module unit/preflight tests and approved TEST-only integration tests in the GAS TEST environment. After results are reviewed and approved, the GitHub `development` files can be copied to GAS as the deployment target. From this baseline onward, GitHub `development` is the development source of truth.
