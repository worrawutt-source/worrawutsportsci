# SPORT NUTRITION CLASSROOM — TEST API Proxy

## Purpose

Cloudflare Worker provides a same-origin-policy-compatible CORS boundary between the GitHub Pages frontend and the Google Apps Script TEST Web App. It does not replace authentication or authorization. The GAS backend remains authoritative and must verify the LINE ID Token and every role/scope on each protected action.

## Current deployment state

- Source: `worker.js`
- Target: TEST only
- Allowed browser origin: `https://worrawutt-source.github.io`
- Upstream: the existing TEST GAS Web App URL
- Previously deployed TEST Worker URL: `https://snc-test-api-proxy.worrawutt.workers.dev/` (deployment reported 20 Nov 2026; version `eb60ed3b`).
- Student, Instructor and Admin frontend source now point to this Worker URL.
- **Important:** the Worker source has since been expanded in `development`; the deployed Worker has not been redeployed in this work session. New Group, Submission, File, Grading, Grade Review, Notification, Student Portal and Audit actions will remain unavailable until the updated Worker source is deployed.
- Production: not configured and must not be changed

## Cloudflare setup

1. In Cloudflare Dashboard, open **Workers & Pages** and create a Worker named `snc-test-api-proxy`.
2. Replace the starter Worker source with the complete contents of `worker.js`.
3. In Worker Settings > Variables, add a plain-text variable:
   - Name: `GAS_API_URL`
   - Value: the existing TEST GAS Web App URL ending in `/exec`
4. Deploy the Worker.
5. Record its HTTPS URL, normally `https://snc-test-api-proxy.<account-subdomain>.workers.dev`.
6. Do not add LINE channel secrets, ID tokens, OTP values, or student data to Worker variables or logs.

## Security behavior

- Exact Origin allowlist; all other origins are rejected.
- Only POST and CORS preflight OPTIONS are accepted.
- Only action names explicitly listed in `ALLOWED_ACTION` are forwarded. The development source allowlist includes Authentication, Course/Enrollment/Import, Assignment, Group, Submission, File, Grading, Grade Review, Notification, Student Portal and restricted Audit read actions.
- Current repository source request size limit: 6 MiB (supports up to 4 MiB file payloads encoded as Base64). The currently deployed Worker may still enforce the previous 64 KiB limit until redeployed.
- No cookies or credentialed CORS.
- No request body, LINE ID Token, OTP, or student data is logged or persisted.
- Upstream is restricted to HTTPS Google Apps Script Web App URL shape.
- Apps Script ContentService redirects are followed only to the Google Apps Script content host.
- The Worker does not decide user identity, roles, course scope, or permissions.

## Smoke tests after deployment

Use the Worker URL as `WORKER_URL`.

### Health-shaped POST (expected application-level TOKEN_MISSING)

Send a POST with:
```json
{"action":"auth.me","requestId":"proxy-smoke-no-token","payload":{}}
```
Expected: HTTP 200 JSON from GAS with `success:false` and `error.code:"TOKEN_MISSING"`. This confirms CORS/proxy transport and that the request reached the backend; it does not prove LINE login.

### Browser CORS preflight

An OPTIONS request with:
- Origin: `https://worrawutt-source.github.io`
- Access-Control-Request-Method: `POST`
- Access-Control-Request-Headers: `content-type`

Expected: HTTP 204, `Access-Control-Allow-Origin` exactly equal to the allowed origin, methods `POST, OPTIONS`, header `Content-Type`.

### Negative origin test

Repeat OPTIONS with a different Origin. Expected: HTTP 403 and no `Access-Control-Allow-Origin` header.

### End-to-end TEST

Only after the proxy smoke tests pass:
1. Deploy the updated `worker.js` to the existing TEST Worker and verify its deployed version.
2. Confirm `GAS_API_URL` still points to the TEST GAS Web App only.
3. Deploy the completed `development` frontend through the approved TEST hosting path.
4. Test LINE LIFF authentication and all actions for Student, Instructor and Admin.
5. Test read-only import preview before any import execute.
6. Do not use Production data or credentials.

## Limitations

Cloudflare account deployment access is not connected to the development tools. The TEST Worker URL was previously supplied in the project conversation, but redeployment of the updated source must be performed in Cloudflare Dashboard by an authorized operator. Do not consider the new API allowlist or 6 MiB request limit active until the deployed version is verified.
