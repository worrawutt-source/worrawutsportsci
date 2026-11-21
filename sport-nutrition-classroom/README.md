# SPORT NUTRITION CLASSROOM — Frontend Architecture

Branch: `development`  
Hosting: GitHub Pages  
Frontend: HTML, CSS, Vanilla JavaScript  
Backend: Google Apps Script Web App (HTTPS)  
Database: Google Sheets  
File storage: Google Drive  
Student access: LINE LIFF  
Instructor/Admin access: Web Dashboard

## Architecture rules

1. GitHub Pages contains public frontend assets only. Never place LINE channel secrets, access tokens, GAS secrets, service credentials, or private student data in this repository.
2. The browser is an untrusted client. It must not decide a user's role, identity, enrollment, course scope, submission ownership, or permission.
3. All authorization and business rules are enforced by Google Apps Script on every API action.
4. Frontend requests use the API envelope defined in DOC-08: `action`, `requestId`, optional `idempotencyKey`, and `payload`. Responses use `success`, `requestId`, `data`, and `error`.
5. Student pages are entered through LINE LIFF. Instructor/Admin pages use the approved authentication flow. Do not treat a URL parameter or local storage value as proof of identity or role.
6. Thai is the primary interface language. Dates use Thai Buddhist Era display and times use 24-hour format.
7. Responsive design is mobile-first. Shared components must support keyboard use, visible labels, clear validation, and readable contrast.
8. TEST and PRODUCTION endpoints/configuration must remain separate. Do not hard-code production endpoints in shared source.

## Planned frontend structure

```text
sport-nutrition-classroom/
├── index.html                 # Classroom entry / module overview
├── README.md                  # Architecture and development notes
├── assets/
│   ├── css/
│   │   ├── tokens.css         # Design tokens
│   │   └── app.css            # Shared layout and components
│   └── js/
│       ├── config.example.js  # Safe configuration template; no secrets
│       └── app.js             # Shared presentation utilities
├── student/                   # LINE LIFF student portal
├── instructor/                # Instructor dashboard
├── admin/                     # Admin management
└── docs/                       # Implementation notes and test records
```

## Student navigation

- รายวิชาของฉัน
- งานที่ได้รับมอบหมาย
- ประวัติการส่ง
- คะแนน/ข้อเสนอแนะ
- ข้อมูลกลุ่ม

## Instructor navigation

- Dashboard
- รายวิชา
- นักศึกษา
- งาน
- กลุ่ม
- ตรวจงาน/คะแนน
- รายงาน/บันทึก

## Admin navigation

- User/Role Management
- Semester/Course Setup
- System Settings

## Implementation sequence

1. Shared design system and responsive application shell.
2. Authentication integration and backend session verification.
3. Course and enrollment views.
4. Assignment and group workflows.
5. Submission, file access, grading, and grade review.
6. Notification logs and audit views.
7. Integration, security, accessibility, and regression tests.

## Current development status (21 November 2026)

The `development` branch now contains backend modules for:
- Authentication and LINE account linking
- Course, Semester, Course Offering and Instructor assignment
- Student import and enrollment
- Assignment lifecycle and scheduler
- Group management scoped to CourseOffering
- Individual and Group Submission, revisions and Drive URL attachment
- Private Google Drive file upload/access
- Grading, Grade History and Grade Review
- LINE notification delivery, logs and 24-hour deadline reminder worker
- Student Portal read models
- Restricted System Admin audit log reads

The Student Portal source now includes course selection, group creation/join/leave, assignment display, file/Drive URL submission, revision submission and grade review request controls. The Instructor Portal source now includes submission review, file links, grading and grade review handling. The Admin Portal source includes Excel/CSV import preview and execution controls. All three portal source files point to the TEST Cloudflare Worker URL.

**These are source-level development changes, not a completed or deployed MVP.** The Worker source has been expanded but has not been redeployed in this work session; the deployed Worker may still have the older action allowlist and 64 KiB body limit. New database sheets are defined in `setup.gs` but no schema migration has been run. No new browser/LIFF E2E or live integration tests have been performed. Do not use the new modules with live student data until the backend GAS deployment, Worker deployment, database migration and internal verification are completed.

The uploaded GAS files from 21 November have different Git blob hashes from the corresponding files currently in this repository. This establishes source divergence, but does not by itself identify semantic differences. Reconcile the uploaded GAS source and repository before any GAS deployment or manual replacement.
