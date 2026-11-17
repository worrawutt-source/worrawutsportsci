# SPORT NUTRITION CLASSROOM — Backend

## Current implementation
Phase 1 backend foundation is implemented in Google Apps Script.

- `doGet`: non-sensitive API health response.
- `doPost`: JSON request envelope and common response envelope.
- `auth.verify` / `auth.me`: verifies a LINE LIFF ID token against LINE's official token verification endpoint.
- No application role is assigned by token verification.
- No user is auto-created or linked at this stage.
- Other API actions return `NOT_IMPLEMENTED`.

## Required Script Property
Set this in Apps Script > Project Settings > Script Properties:

- `LINE_CHANNEL_ID`: the LINE Login channel ID associated with the LIFF application.

Do not put channel secrets, access tokens, or other credentials in GitHub or frontend files. The ID token is supplied per request and is verified server-side.

## Deployment outline
1. Create a standalone or repository-linked Apps Script project for the backend.
2. Add `Code.gs`.
3. Set `LINE_CHANNEL_ID` in Script Properties.
4. Deploy as a Web App with execution as the deploying account and access limited according to the approved deployment plan.
5. Test `doGet` health response.
6. From the LIFF client, obtain a fresh LIFF ID token and POST an `auth.verify` request.
7. Confirm invalid, expired, wrong-channel, and missing tokens are rejected.

## Request example
```json
{
  "action": "auth.verify",
  "requestId": "client-generated-id",
  "idempotencyKey": "optional-operation-key",
  "payload": {
    "idToken": "LINE_LIFF_ID_TOKEN"
  }
}
```

## Security and scope notes
- A verified LINE subject is an identity-provider identifier, not an application UserID.
- This module intentionally returns `role: null` and `accountStatus: LINKING_REQUIRED`.
- User lookup, account linking, role resolution, authorization scopes, session lifecycle, and Google Sheets persistence must be implemented only after finalizing the physical column schema and account provisioning rules.
- Do not treat a successful identity verification as permission to access course or student data.
- Browser-to-GAS redirect/CORS behavior must be tested from the deployed GitHub Pages and LIFF origins before production use.
