# Frontend assets

The frontend is hosted in this folder and loaded by the Google Apps Script web app from an immutable Git commit SHA.

Files:
- `Index.html` — application shell and frontend insertion markers.
- `Styles.html` — CSS wrapped in a `<style>` element.
- `Client.html` — browser JavaScript wrapped in a `<script>` element.

## Runtime contract

The Apps Script loader fetches only these three whitelisted filenames from `raw.githubusercontent.com`. It replaces:
- `<!-- SSRL_STYLES -->` with the contents of `Styles.html`.
- `<!-- SSRL_CLIENT -->` with the contents of `Client.html`.
- `__SSRL_MAGIC_SESSION_JSON__` with a JSON-escaped session token.

Do not reintroduce Apps Script template tags such as `<?!= include(...) ?>`. These files are no longer stored in the Apps Script project.

## Publishing

1. Commit frontend changes to GitHub.
2. Test the exact commit in the TEST deployment.
3. Update `FRONTEND_CONFIG.COMMIT_SHA` in `project/gas-source/code.gs` to the frontend commit SHA.
4. Copy the changed `.gs` file into Apps Script and test.
5. Keep the previous commit SHA for rollback.

Never use a moving branch name such as `main` in the runtime loader. Do not commit secrets or personal data.
