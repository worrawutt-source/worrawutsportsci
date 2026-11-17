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

## Current status

The initial Classroom landing page and homepage Teaching links are present on the `development` branch. The module cards are navigation placeholders only; no backend workflow is represented as operational until its API is implemented and tested.
