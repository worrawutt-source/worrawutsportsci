/**
 * SPORT NUTRITION CLASSROOM — Apps Script API foundation
 * Phase: Authentication foundation (LINE LIFF ID token verification)
 * No roles or database records are granted by this module.
 */

const SNC = Object.freeze({
  LINE_VERIFY_URL: 'https://api.line.me/oauth2/v2.1/verify',
  MAX_TOKEN_LENGTH: 12000,
  API_VERSION: '1.1.0'
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
      var linked = findLineAccountBySubject_(auth.sub);
      return jsonResponse_({
        success: true, requestId: requestId,
        data: {
          authenticated: true, identityProvider: 'LINE',
          lineSubject: auth.sub, displayName: auth.name || null,
          pictureUrl: auth.picture || null, email: auth.email || null,
          accountStatus: linked ? 'LINKED' : 'LINKING_REQUIRED',
          role: linked ? getPrimaryRoleForUser_(linked.user.UserID) : null,
          roles: linked ? getEffectiveRolesForUser_(linked.user.UserID) : [],
          user: linked ? publicUser_(linked.user) : null
        }, error: null
      });
    }

    if (action === 'auth.requestLinkOtp') {
      var linkIdentity = verifyLiffIdentity_(payload.idToken);
      return jsonResponse_(success_(requestId, requestStudentLinkOtp_(linkIdentity, payload, requestId)));
    }
    if (action === 'auth.linkStudent') {
      var confirmIdentity = verifyLiffIdentity_(payload.idToken);
      return jsonResponse_(success_(requestId, confirmStudentLink_(confirmIdentity, payload, requestId)));
    }
    if (action === 'auth.requestEmailChange') {
      var emailIdentity = verifyLiffIdentity_(payload.idToken);
      return jsonResponse_(success_(requestId, requestEmailChangeOtp_(emailIdentity, payload, requestId)));
    }
    if (action === 'auth.confirmEmailChange') {
      var changeIdentity = verifyLiffIdentity_(payload.idToken);
      return jsonResponse_(success_(requestId, confirmEmailChange_(changeIdentity, payload, requestId)));
    }

    if (/^(course|semester|offering|instructor)\./.test(action)) {
      var managementIdentity = verifyLiffIdentity_(payload.idToken);
      return jsonResponse_(success_(requestId, handleCourseManagementAction_(action, managementIdentity, payload, requestId)));
    }

    return jsonResponse_(failure_(requestId, 'NOT_IMPLEMENTED', 'This API action is not implemented yet.'));
  } catch (err) {
    var code = err && err.apiCode ? err.apiCode : 'INTERNAL_ERROR';
    // Never log ID tokens or request payloads. Log only safe diagnostic metadata.
    console.error(JSON.stringify({
      event: 'API_FAILURE',
      requestId: requestId,
      errorCode: code,
      message: safeLogText_(err && err.message ? err.message : 'unknown')
    }));
    var isTokenError = /^TOKEN_/.test(code);
    var message = isTokenError
      ? 'Authentication failed. Please sign in with LINE again.'
      : 'The request could not be completed.';
    return jsonResponse_(failure_(requestId, code, message));
  }
}

function verifyLiffIdentity_(idToken) {
  var tokenLength = typeof idToken === 'string' ? idToken.length : 0;
  console.log(JSON.stringify({
    event: 'LINE_TOKEN_RECEIVED',
    tokenLength: tokenLength,
    tokenPresent: typeof idToken === 'string' && Boolean(idToken.trim())
  }));

  if (typeof idToken !== 'string' || !idToken.trim()) {
    throw apiError_('TOKEN_MISSING', 'LINE ID token is missing.');
  }
  if (idToken.length > SNC.MAX_TOKEN_LENGTH) {
    throw apiError_('TOKEN_INVALID', 'LINE ID token exceeds the accepted length.');
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
  var responseText = response.getContentText();
  var body;
  try {
    body = JSON.parse(responseText);
  } catch (_) {
    console.error(JSON.stringify({
      event: 'LINE_VERIFY_RESPONSE',
      httpStatus: status,
      parseableJson: false,
      responseLength: responseText ? responseText.length : 0
    }));
    throw apiError_('TOKEN_INVALID', 'LINE returned an invalid verification response.');
  }

  if (status !== 200 || !body || !body.sub) {
    var lineError = safeLogText_(body && body.error ? body.error : 'unknown');
    var lineDescription = safeLogText_(body && body.error_description ? body.error_description : '');
    console.error(JSON.stringify({
      event: 'LINE_VERIFY_REJECTED',
      httpStatus: status,
      lineError: lineError,
      errorDescription: lineDescription,
      tokenLength: tokenLength
    }));

    var diagnosticText = (String(lineError) + ' ' + String(lineDescription)).toLowerCase();
    if (/expir|expired/.test(diagnosticText)) {
      throw apiError_('TOKEN_EXPIRED', 'LINE ID token has expired.');
    }
    if (/audience|client.?id|channel.?id/.test(diagnosticText)) {
      throw apiError_('TOKEN_AUDIENCE_MISMATCH', 'LINE ID token audience does not match the configured channel.');
    }
    throw apiError_('TOKEN_INVALID', 'LINE ID token verification failed.');
  }

  console.log(JSON.stringify({
    event: 'LINE_VERIFY_SUCCESS',
    httpStatus: status,
    tokenLength: tokenLength
  }));

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

function safeLogText_(value) {
  if (typeof value !== 'string') return '';
  // Redact any JWT-shaped value defensively before writing provider diagnostics to logs.
  return value.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED]')
    .replace(/[\r\n\t]/g, ' ')
    .slice(0, 500);
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


/**
 * Calls the deployed Web App without an ID token.
 * Expected result: success=false and error.code=UNAUTHENTICATED.
 */
function testPostMissingToken() {
  var url = ScriptApp.getService().getUrl();
  if (!url) throw new Error('Deploy this project as a Web App before running this test.');

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      action: 'auth.verify',
      requestId: Utilities.getUuid(),
      payload: {}
    }),
    muteHttpExceptions: true
  });

  var result = JSON.parse(response.getContentText());
  console.log(JSON.stringify({
    httpStatus: response.getResponseCode(),
    success: result.success,
    errorCode: result.error && result.error.code,
    expected: 'UNAUTHENTICATED',
    pass: result.success === false && result.error && result.error.code === 'UNAUTHENTICATED'
  }));
}


/* ===================== Account linking and email change ===================== */

function success_(requestId, data) {
  return { success: true, requestId: requestId, data: data, error: null };
}

function accountSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss && ss.getSheetByName(name);
  if (!sh) throw apiError_('DATABASE_NOT_READY', 'Required account table is unavailable.');
  return sh;
}

function rowsAsObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(String);
  return values.slice(1).map(function(row, i) {
    var obj = { _row: i + 2 };
    headers.forEach(function(h, j) { obj[h] = row[j]; });
    return obj;
  });
}

function findLineAccountBySubject_(subject) {
  var accounts = rowsAsObjects_(accountSheet_('LINEAccounts'));
  var match = accounts.filter(function(a) {
    return String(a.Provider) === 'LINE' &&
      String(a.ProviderSubject) === String(subject) &&
      String(a.Status).toUpperCase() === 'ACTIVE';
  })[0];
  if (!match) return null;
  var user = rowsAsObjects_(accountSheet_('Users')).filter(function(u) {
    return String(u.UserID) === String(match.UserID) &&
      String(u.Status).toUpperCase() === 'ACTIVE';
  })[0];
  return user ? { account: match, user: user } : null;
}

function publicUser_(u) {
  return {
    userId: String(u.UserID), studentId: String(u.StudentID),
    firstName: String(u.FirstName), lastName: String(u.LastName),
    email: String(u.Email)
  };
}

function normalizeEmail_(value) {
  var email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw apiError_('VALIDATION_ERROR', 'Please provide a valid email address.');
  }
  return email;
}

function normalizeStudentId_(value) {
  var id = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  if (!/^\d{6,20}$/.test(id)) throw apiError_('VALIDATION_ERROR', 'Student ID format is invalid.');
  return id;
}

function makeOtp_() {
  var raw = Utilities.getUuid().replace(/[^0-9]/g, '');
  while (raw.length < 6) raw += String(Math.floor(Math.random() * 10));
  return raw.slice(0, 6);
}

function otpHash_(otp, challengeId) {
  var pepper = PropertiesService.getScriptProperties().getProperty('SNC_OTP_PEPPER');
  if (!pepper) throw apiError_('CONFIGURATION_ERROR', 'OTP service is not configured.');
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(challengeId) + ':' + String(otp) + ':' + pepper,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    var v = (b + 256) % 256;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function createOtpChallenge_(data) {
  var sh = accountSheet_('EmailOTPChallenges');
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  var required = ['ChallengeID','StudentID','Email','LINEProvider','LINEProviderSubject',
    'OTPHash','ExpiresAt','AttemptCount','MaxAttempts','ConsumedAt','CreatedAt',
    'RequestID','Purpose','UserID','NewEmail'];
  if (headers.length !== required.length || !required.every(function(h,i){return headers[i] === h;})) {
    throw apiError_('SCHEMA_MISMATCH', 'Email OTP schema is not migrated. Run setupAccountLinkingSheets() first.');
  }
  var challengeId = Utilities.getUuid();
  var otp = makeOtp_();
  var now = new Date();
  var expires = new Date(now.getTime() + 10 * 60 * 1000);
  sh.appendRow([
    challengeId, data.studentId || '', data.email, 'LINE', data.subject,
    otpHash_(otp, challengeId), expires, 0, 5, '', now, data.requestId,
    data.purpose, data.userId || '', data.newEmail || ''
  ]);
  try {
    MailApp.sendEmail({
      to: data.email,
      subject: data.purpose === 'STUDENT_LINK' ? 'รหัสยืนยันการเชื่อมบัญชีนักศึกษา' : 'รหัสยืนยันการเปลี่ยนอีเมล',
      body: 'รหัส OTP ของคุณคือ ' + otp + '\nรหัสนี้ใช้ได้ 10 นาที และใช้ได้เพียงครั้งเดียว หากคุณไม่ได้ร้องขอสามารถละเว้นอีเมลนี้ได้'
    });
  } catch (err) {
    sh.getRange(sh.getLastRow(), 10).setValue(new Date());
    throw apiError_('EMAIL_DELIVERY_FAILED', 'Unable to send verification email. Please try again later.');
  }
  return { challengeId: challengeId, expiresInSeconds: 600, destination: maskEmail_(data.email) };
}

function maskEmail_(email) {
  var p = String(email).split('@');
  if (p.length !== 2) return '';
  return (p[0].slice(0, 2) + '***@' + p[1]);
}

function requestStudentLinkOtp_(identity, payload, requestId) {
  var studentId = normalizeStudentId_(payload.studentId);
  var email = normalizeEmail_(payload.email);
  var users = rowsAsObjects_(accountSheet_('Users'));
  var user = users.filter(function(u) {
    return String(u.StudentID).trim() === studentId &&
      String(u.Email).trim().toLowerCase() === email &&
      String(u.Status).toUpperCase() === 'ACTIVE';
  })[0];
  if (!user) throw apiError_('ACCOUNT_NOT_VERIFIED', 'Student ID and registered email could not be verified.');
  var existing = findLineAccountBySubject_(identity.sub);
  if (existing && String(existing.user.UserID) !== String(user.UserID)) {
    throw apiError_('LINE_ALREADY_LINKED', 'This LINE account is already linked to another student account.');
  }
  var accounts = rowsAsObjects_(accountSheet_('LINEAccounts'));
  if (accounts.some(function(a) {
    return String(a.UserID) === String(user.UserID) &&
      String(a.Status).toUpperCase() === 'ACTIVE' &&
      String(a.ProviderSubject) !== String(identity.sub);
  })) throw apiError_('STUDENT_ALREADY_LINKED', 'This student account is already linked to a different LINE account.');
  var result = createOtpChallenge_({
    studentId: studentId, email: email, subject: identity.sub,
    purpose: 'STUDENT_LINK', requestId: requestId
  });
  return { status: 'OTP_SENT', challengeId: result.challengeId,
    destination: result.destination, expiresInSeconds: result.expiresInSeconds };
}

function confirmStudentLink_(identity, payload, requestId) {
  var studentId = normalizeStudentId_(payload.studentId);
  var email = normalizeEmail_(payload.email);
  var otp = typeof payload.otp === 'string' ? payload.otp.trim() : '';
  if (!/^\d{6}$/.test(otp)) throw apiError_('VALIDATION_ERROR', 'OTP must contain six digits.');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var challenge = consumeOtpChallenge_({
      purpose: 'STUDENT_LINK', subject: identity.sub, studentId: studentId,
      email: email, otp: otp
    });
    var users = rowsAsObjects_(accountSheet_('Users'));
    var user = users.filter(function(u) {
      return String(u.StudentID).trim() === studentId &&
        String(u.Email).trim().toLowerCase() === email &&
        String(u.Status).toUpperCase() === 'ACTIVE';
    })[0];
    if (!user) throw apiError_('ACCOUNT_NOT_VERIFIED', 'Student account is no longer eligible for linking.');
    var linked = findLineAccountBySubject_(identity.sub);
    if (linked && String(linked.user.UserID) !== String(user.UserID)) {
      throw apiError_('LINE_ALREADY_LINKED', 'This LINE account is already linked elsewhere.');
    }
    var accounts = rowsAsObjects_(accountSheet_('LINEAccounts'));
    var existing = accounts.filter(function(a) {
      return String(a.UserID) === String(user.UserID) &&
        String(a.Provider) === 'LINE' && String(a.Status).toUpperCase() === 'ACTIVE';
    })[0];
    var now = new Date();
    if (!existing) {
      accountSheet_('LINEAccounts').appendRow([
        Utilities.getUuid(), user.UserID, 'LINE', identity.sub,
        identity.name || '', identity.picture || '', 'ACTIVE', now, now, now
      ]);
    }
    appendAudit_(String(user.UserID), 'STUDENT_ACCOUNT_LINKED', 'User', user.UserID, {
      provider: 'LINE', studentId: studentId
    }, requestId);
    return { accountStatus: 'LINKED', role: 'STUDENT', user: publicUser_(user) };
  } finally {
    lock.releaseLock();
  }
}

function requestEmailChangeOtp_(identity, payload, requestId) {
  var linked = findLineAccountBySubject_(identity.sub);
  if (!linked) throw apiError_('LINKING_REQUIRED', 'Link your student account before changing email.');
  var newEmail = normalizeEmail_(payload.newEmail);
  var users = rowsAsObjects_(accountSheet_('Users'));
  if (users.some(function(u) {
    return String(u.Email).trim().toLowerCase() === newEmail &&
      String(u.UserID) !== String(linked.user.UserID);
  })) throw apiError_('EMAIL_ALREADY_USED', 'This email address is already registered.');
  if (String(linked.user.Email).trim().toLowerCase() === newEmail) {
    throw apiError_('EMAIL_UNCHANGED', 'The new email is the same as the current email.');
  }
  var result = createOtpChallenge_({
    studentId: String(linked.user.StudentID), email: newEmail,
    subject: identity.sub, purpose: 'EMAIL_CHANGE',
    userId: String(linked.user.UserID), newEmail: newEmail, requestId: requestId
  });
  return { status: 'OTP_SENT', destination: result.destination,
    challengeId: result.challengeId, expiresInSeconds: result.expiresInSeconds };
}

function confirmEmailChange_(identity, payload, requestId) {
  var otp = typeof payload.otp === 'string' ? payload.otp.trim() : '';
  var newEmail = normalizeEmail_(payload.newEmail);
  if (!/^\d{6}$/.test(otp)) throw apiError_('VALIDATION_ERROR', 'OTP must contain six digits.');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var linked = findLineAccountBySubject_(identity.sub);
    if (!linked) throw apiError_('LINKING_REQUIRED', 'Student account is not linked.');
    consumeOtpChallenge_({
      purpose: 'EMAIL_CHANGE', subject: identity.sub,
      studentId: String(linked.user.StudentID), email: newEmail,
      userId: String(linked.user.UserID), newEmail: newEmail, otp: otp
    });
    var users = accountSheet_('Users');
    var all = rowsAsObjects_(users);
    if (all.some(function(u) {
      return String(u.Email).trim().toLowerCase() === newEmail &&
        String(u.UserID) !== String(linked.user.UserID);
    })) throw apiError_('EMAIL_ALREADY_USED', 'This email address is already registered.');
    var headers = users.getRange(1,1,1,users.getLastColumn()).getDisplayValues()[0];
    var emailCol = headers.indexOf('Email') + 1;
    var updatedCol = headers.indexOf('UpdatedAt') + 1;
    if (!emailCol || !updatedCol) throw apiError_('SCHEMA_MISMATCH', 'Users schema is invalid.');
    var oldEmail = String(linked.user.Email);
    users.getRange(linked.user._row, emailCol).setValue(newEmail);
    users.getRange(linked.user._row, updatedCol).setValue(new Date());
    appendAudit_(String(linked.user.UserID), 'STUDENT_EMAIL_CHANGED', 'User',
      linked.user.UserID, { oldEmail: oldEmail, newEmail: newEmail }, requestId);
    linked.user.Email = newEmail;
    return { status: 'EMAIL_UPDATED', user: publicUser_(linked.user) };
  } finally {
    lock.releaseLock();
  }
}

function consumeOtpChallenge_(criteria) {
  var sh = accountSheet_('EmailOTPChallenges');
  var rows = rowsAsObjects_(sh);
  var now = new Date();
  var candidate = rows.filter(function(r) {
    return String(r.Purpose) === criteria.purpose &&
      String(r.LINEProvider) === 'LINE' &&
      String(r.LINEProviderSubject) === String(criteria.subject) &&
      String(r.StudentID) === String(criteria.studentId) &&
      String(r.Email).toLowerCase() === String(criteria.email).toLowerCase() &&
      (!criteria.userId || String(r.UserID) === String(criteria.userId)) &&
      (!criteria.newEmail || String(r.NewEmail).toLowerCase() === String(criteria.newEmail).toLowerCase()) &&
      !r.ConsumedAt && new Date(r.ExpiresAt).getTime() > now.getTime() &&
      Number(r.AttemptCount) < Number(r.MaxAttempts)
  }).sort(function(a,b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); })[0];
  if (!candidate) throw apiError_('OTP_INVALID_OR_EXPIRED', 'OTP is invalid or expired. Request a new code.');
  var headers = sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
  var attemptCol = headers.indexOf('AttemptCount') + 1;
  var consumedCol = headers.indexOf('ConsumedAt') + 1;
  sh.getRange(candidate._row, attemptCol).setValue(Number(candidate.AttemptCount) + 1);
  var expected = otpHash_(criteria.otp, candidate.ChallengeID);
  if (expected !== String(candidate.OTPHash)) {
    if (Number(candidate.AttemptCount) + 1 >= Number(candidate.MaxAttempts)) {
      sh.getRange(candidate._row, consumedCol).setValue(new Date());
    }
    throw apiError_('OTP_INVALID_OR_EXPIRED', 'OTP is invalid or expired. Request a new code.');
  }
  sh.getRange(candidate._row, consumedCol).setValue(new Date());
  return candidate;
}

function appendAudit_(actorUserId, action, entityType, entityId, details, requestId) {
  accountSheet_('AuditLogs').appendRow([
    Utilities.getUuid(), actorUserId || '', action, entityType, entityId,
    JSON.stringify(details || {}), new Date(), requestId || ''
  ]);
}


/**
 * Read-only preflight for the account-linking phase.
 * Does not send email, alter rows, or print student identifiers.
 */
function testAccountLinkingPreflight() {
  var required = {
    Users: ['UserID','StudentID','FirstName','LastName','Email','Status','CreatedAt','UpdatedAt'],
    LINEAccounts: ['LINEAccountID','UserID','Provider','ProviderSubject','DisplayName','PictureUrl','Status','LinkedAt','CreatedAt','UpdatedAt'],
    EmailOTPChallenges: ['ChallengeID','StudentID','Email','LINEProvider','LINEProviderSubject','OTPHash','ExpiresAt','AttemptCount','MaxAttempts','ConsumedAt','CreatedAt','RequestID','Purpose','UserID','NewEmail'],
    AuditLogs: ['AuditID','ActorUserID','Action','EntityType','EntityID','DetailsJson','CreatedAt','RequestID']
  };
  var report = { success: true, checks: {}, userCount: 0, activeLineLinks: 0 };
  Object.keys(required).forEach(function(name) {
    var sh = accountSheet_(name);
    var actual = sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
    var ok = actual.length === required[name].length &&
      required[name].every(function(h,i) { return actual[i] === h; });
    report.checks[name] = ok ? 'PASS' : 'FAIL';
    if (!ok) report.success = false;
  });
  var props = PropertiesService.getScriptProperties();
  report.checks.LINE_CHANNEL_ID = props.getProperty('LINE_CHANNEL_ID') ? 'PASS' : 'MISSING';
  report.checks.SNC_OTP_PEPPER = props.getProperty('SNC_OTP_PEPPER') ? 'PASS' : 'MISSING';
  if (!props.getProperty('LINE_CHANNEL_ID') || !props.getProperty('SNC_OTP_PEPPER')) report.success = false;
  var users = rowsAsObjects_(accountSheet_('Users'));
  var links = rowsAsObjects_(accountSheet_('LINEAccounts'));
  report.userCount = users.length;
  report.activeLineLinks = links.filter(function(a) {
    return String(a.Provider) === 'LINE' && String(a.Status).toUpperCase() === 'ACTIVE';
  }).length;
  var ids = {}, emails = {}, duplicates = [];
  users.forEach(function(u) {
    var id = String(u.StudentID).trim();
    var email = String(u.Email).trim().toLowerCase();
    if (id && ids[id]) duplicates.push('DUPLICATE_STUDENT_ID');
    if (email && emails[email]) duplicates.push('DUPLICATE_EMAIL');
    if (id) ids[id] = true;
    if (email) emails[email] = true;
  });
  report.checks.uniqueStudentIdAndEmail = duplicates.length ? 'FAIL' : 'PASS';
  if (duplicates.length) report.success = false;
  console.log(JSON.stringify(report, null, 2));
  return report;
}
