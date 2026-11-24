# SPORT SCIENCE RESEARCH LAB

This project separates the application into GitHub-hosted frontend assets and Google Apps Script backend source.

## Directory layout

- `frontend/` — `Index.html`, `Client.html`, and `Styles.html`; fetched by the Apps Script loader from a pinned immutable commit.
- `gas-source/` — `code.gs` and `setup.gs`; canonical backend source files to copy into the Apps Script editor.
- The Apps Script project retains `appsscript.json`; it is not deleted when the HTML files are removed.

## Source-of-truth workflow

1. Make changes in GitHub.
2. Review the commit and source changes.
3. Copy every changed `.gs` file in full into Apps Script.
4. Keep the existing Script Properties and database unchanged.
5. Delete the three legacy HTML files from Apps Script after the updated backend is saved.
6. Ensure the existing manifest includes `https://www.googleapis.com/auth/script.external_request`.
7. Deploy a new TEST version and complete the acceptance checks before user access.

## Safety rules

- Do not run legacy database setup, seeding, recovery, or migration routines without a separately approved plan.
- Do not reset or replace `DB_ID` or `APP_SECRET`.
- Do not point TEST code at production data.
- Keep the frontend loader pinned to an immutable commit SHA, never `main`.
- The course workflow remains subject to the approved course structure, assessment rules, access controls, and research ethics requirements.
