# Google Apps Script source files

This folder is the canonical GitHub location for the server-side Apps Script source files (`.gs`).

Expected files:

- `Code.gs`
- `setup.gs`

## Required maintenance workflow

All server-side code changes must be made and committed here first. After review and testing, the maintainer must copy the entire content of each changed `.gs` file from this folder and paste it over the matching file in the Google Apps Script editor.

The Apps Script project retains its required `appsscript.json` manifest. This manifest is not a `.gs` file and is not replaced by this folder.

Do not run database initialization, setup, role-seeding, or migration functions merely because source files were updated. Any schema or data migration requires a separate explicit plan and approval.

Never commit Script Properties, APP_SECRET, passwords, session tokens, database IDs, OAuth tokens, or user data.
