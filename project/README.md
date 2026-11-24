# SPORT SCIENCE RESEARCH LAB

This project directory separates the Google Apps Script application source into frontend assets and server-side Apps Script source.

## Directory layout

- `frontend/` — HTML/CSS/JavaScript assets fetched by the Apps Script web app from this public repository.
- `gas-source/` — canonical source copies of Apps Script `.gs` files. Edit these files in GitHub first; then copy the complete updated file into the matching file in the Apps Script editor.

## Source-of-truth workflow

1. Make changes in GitHub.
2. Commit the change and review the commit diff.
3. Test the change in the TEST Apps Script deployment.
4. For every changed `.gs` file, provide the exact path and instruct the maintainer to copy the entire file into Apps Script, replacing the matching file.
5. For frontend changes, update the pinned frontend commit used by the Apps Script configuration only after the commit has been reviewed and tested.

Do not edit the production spreadsheet, database schema, Script Properties, roles, credentials, or deployment settings as part of a source-only change unless separately approved.

## Version pinning

The frontend must be loaded from a full immutable Git commit SHA, never from the moving `main` branch. Record the active SHA in the Apps Script Script Properties or the approved server configuration. A release should identify the exact SHA and changed files.

## Security

This repository is public. Never commit passwords, password hashes, APP_SECRET, OAuth tokens, session tokens, private participant documents, spreadsheet IDs, personal data, or other secrets. Keep `appsscript.json` in the Apps Script project unless separately approved.
