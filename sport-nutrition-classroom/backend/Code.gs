/**
 * SPORT NUTRITION CLASSROOM — Apps Script API foundation
 * Phase: Authentication foundation (LINE LIFF ID token verification)
 * No roles or database records are granted by this module.
 */

const SNC = Object.freeze({
  LINE_VERIFY_URL: 'https://api.line.me/oauth2/v2.1/verify',
  MAX_TOKEN_LENGTH: 12000,
  API_VERSION: '1.0.0'
});

function doGet() {
  return jsonResponse_({
    success: true,
    requestId: Utilities.getUuid(),
    data: { service: 'SPORT NUTRITION CLASSROOM API', status: 'READY', version: SNC.API_VERSION },
    error: null
  });
}

function doPost(e) {
  var requestId = Utilities.getUuid();

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_(failure_(requestId, 'VALIDATION_ERROR', 'Request body is required.'));
    }

    var request;
    try {
      request = JSON.parse(e.postData.contents);
    } catch (_) {
      return jsonResponse_(failure_(requestId, 'VALIDATION_ERROR', 'Request body must be valid JSON.'));
    }

    if (!request || typeof request !== 'object' || Array.isArray(request)) {
      return jsonResponse_(failure_(requestId, 'VALIDATION_ERROR', 'Invalid request envelope.'));
    }

    requestId = safeString_(request.requestId, 100) || requestId;
    var action = safeString_(request.action, 80);
    var payload = request.payload && typeof request.payload === 'object' && !Array.isArray(request.payload)
      ? request.payload : {};

    if (!action) {
      return jsonResponse_(failure_(requestId, 'VALIDATION_ERROR', 'action is required.'));
    }

    if (action === 'auth.verify' || action === 'auth.me') {
      var auth = verifyLiffIdentity_(payload.idToken);
      return jsonResponse_({
        success: true,
        requestId: requestId,
        data: {
          authenticated: true,
          identityProvider: 'LINE',
          lineSubject: auth.sub,
          displayName: auth.name || null,
          pictureUrl: auth.picture || null,
          email: auth.email || null,
          accountStatus: 'LINKING_REQUIRED',
          role: null,
          message: 'Identity verified. Application account and role authorization are not yet configured.'
        },
        error: null
      });
    }

    return jsonResponse_(failure_(requestId, 'NOT_IMPLEMENTED', 'This API action is not implemented yet.'));
  } catch (err) {
    console.error('API failure [' + requestId + ']: ' + (err && err.message ? err.message : 'unknown'));
    return jsonResponse_(failure_(requestId, 'INTERNAL_ERROR', 'The request could not be completed.'));
  }
}

function verifyLiffIdentity_(idToken) {
  if (typeof idToken !== 'string' || !idToken.trim() || idToken.length > SNC.MAX_TOKEN_LENGTH) {
    throw apiError_('UNAUTHENTICATED', 'A valid LINE LIFF ID token is required.');
  }

  var props = PropertiesService.getScriptProperties();
  var channelId = props.getProperty('LINE_CHANNEL_ID');
  if (!channelId) {
    throw apiError_('INTERNAL_ERROR', 'LINE_CHANNEL_ID is not configured in Script Properties.');
  }

  var response;
  try {
    response = UrlFetchApp.fetch(SNC.LINE_VERIFY_URL, {
      method: 'post',
      payload: {
        id_token: idToken,
        client_id: channelId
      },
      muteHttpExceptions: true
    });
  } catch (err) {
    throw apiError_('INTERNAL_ERROR', 'LINE identity verification service is unavailable.');
  }

  var status = response.getResponseCode();
  var body;
  try {
    body = JSON.parse(response.getContentText());
  } catch (_) {
    throw apiError_('UNAUTHENTICATED', 'LINE returned an invalid verification response.');
  }

  if (status !== 200 || !body || !body.sub) {
    throw apiError_('UNAUTHENTICATED', 'LINE ID token verification failed.');
  }

  // LINE verifies signature, issuer, audience, expiry and token validity.
  return {
    sub: String(body.sub),
    name: safeString_(body.name, 200),
    picture: safeHttpsUrl_(body.picture),
    email: safeString_(body.email, 254)
  };
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function failure_(requestId, code, message) {
  return {
    success: false,
    requestId: requestId,
    data: null,
    error: { code: code, message: message }
  };
}

function apiError_(code, message) {
  var err = new Error(message);
  err.apiCode = code;
  return err;
}

function safeString_(value, maxLength) {
  if (typeof value !== 'string') return null;
  var result = value.trim();
  return result && result.length <= maxLength ? result : null;
}

function safeHttpsUrl_(value) {
  var url = safeString_(value, 2048);
  return url && /^https:\/\//i.test(url) ? url : null;
}

/**
 * Run manually once in Apps Script to confirm project access.
 * Set LINE_CHANNEL_ID separately in Project Settings > Script Properties.
 */
function testConfiguration() {
  var channelId = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ID');
  console.log(JSON.stringify({
    apiVersion: SNC.API_VERSION,
    lineChannelIdConfigured: Boolean(channelId)
  }));
}
