# SPORT NUTRITION CLASSROOM — TEST API Proxy

## Purpose

Cloudflare Worker provides a same-origin-policy-compatible CORS boundary between the GitHub Pages frontend and the Google Apps Script TEST Web App. It does not replace authentication or authorization. The GAS backend remains authoritative and must verify the LINE ID Token and every role/scope on each protected action.

## Current deployment state

- Source: `worker.js`
- Target: TEST only
- Allowed browser origin: `https://worrawutt-source.github.io`
- Upstream: the existing TEST GAS Web App URL
- Frontend API URL migration: **pending Worker deployment URL**
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
- Only the currently implemented SNC API action names are forwarded.
- Request size is limited to 64 KiB.
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
1. Update TEST frontend API URL constants in student, instructor, and admin portals to the deployed Worker URL.
2. Deploy GitHub Pages from `development` as currently configured.
3. Test LINE LIFF authentication and `auth.me`, then `offering.list`.
4. Test read-only import preview before any import execute.
5. Do not use Production data or credentials.

## Limitations

The repository cannot deploy the Worker into a Cloudflare account. Cloudflare account access is not connected to the development tools. The Worker source is prepared in this repository; its actual deployment and assigned `workers.dev` URL must be obtained from Cloudflare Dashboard before frontend URLs can be safely changed.
