# Frontend assets

This folder is reserved for the web app HTML assets currently maintained by Google Apps Script:

- `Index.html`
- `Client.html`
- `Styles.html`

The Apps Script web app will fetch these assets from `raw.githubusercontent.com` using an immutable commit SHA. Do not reference `main` or another moving branch in the runtime loader.

## Publishing procedure

1. Commit reviewed HTML changes.
2. Test the exact commit in the TEST deployment.
3. Update the configured frontend commit SHA only after successful testing.
4. Keep the prior SHA available for rollback.

Do not add secrets or personal data. The runtime loader must whitelist the expected filenames and must escape template data such as session tokens before inserting it into HTML.
