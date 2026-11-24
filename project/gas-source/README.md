# Google Apps Script source files

This folder is the canonical GitHub location for the server-side Apps Script source files.

Files:
- `code.gs` — complete application backend and GitHub frontend loader.
- `setup.gs` — read-only diagnostics and deliberately disabled legacy destructive setup entry points.

## Deployment workflow

1. Make and review all source changes in GitHub first.
2. Copy the complete content of each changed `.gs` file into the matching file in the Google Apps Script editor.
3. Keep `appsscript.json` in the Apps Script project. Do not delete it.
4. Add the OAuth scope `https://www.googleapis.com/auth/script.external_request` to the existing manifest because the loader uses `UrlFetchApp`.
5. Delete the old `Index.html`, `Client.html`, and `Styles.html` files from the Apps Script project only after both updated `.gs` files have been saved.
6. Save, authorize the external request scope when prompted, and deploy a new TEST version.
7. Test login, student registration/OTP, advisor invitation and magic link, each dashboard role, file uploads, notifications, and progress workflows.

## Database safety

Do not run `setup()`, `setupTestDatabase()`, `recoverAdminAccess()`, role seeding, or any unapproved migration. The legacy setup routine was replaced with safe diagnostics because it contained data-clearing and role-reseeding operations. The current `setup.gs` does not initialize or modify the database.

Do not change Script Properties such as `DB_ID` or `APP_SECRET` during frontend deployment. Never commit database IDs, Script Properties, passwords, session tokens, or other secrets.

The GitHub frontend loader uses an immutable commit SHA and a filename whitelist. A frontend change requires updating the pinned SHA in `code.gs` after the frontend commit has been created.
