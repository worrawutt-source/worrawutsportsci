# Duplicate Request & Concurrency Test — TEST only

## Purpose
Verify the deployed TEST API's current behavior for duplicate Offering creation and concurrent requests. This test intentionally creates one persistent, clearly marked TEST Offering and one corresponding Audit Log event. It does not delete or overwrite any existing row.

## Preconditions
- The Apps Script source containing the latest `CourseManagement.gs` is synchronized to the TEST Apps Script project and deployed as a TEST Web App.
- The active spreadsheet is the configured TEST spreadsheet, not Production.
- The signed-in LINE account has System Admin permission in TEST.
- The browser is on the Student Portal origin where `window.liff` is initialized.
- Run once only for a clean result. A second run creates a new uniquely marked fixture.

## Browser Console test
Paste the following into the browser console while signed in to the TEST LIFF portal:

```javascript
(async () => {
  const API = 'https://script.google.com/macros/s/AKfycbwIvdYeUa4IqFZVKAuwfc4ANtGUrLRBilXv51t2YPuSAOj3tFKi9HCBtGhWuN7HwTT0/exec';
  const idToken = window.liff && window.liff.getIDToken();
  if (!idToken) throw new Error('TEST_BLOCKED: LINE ID token unavailable.');

  async function call(action, payload, requestId) {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, requestId, payload: { ...payload, idToken } })
    });
    return response.json();
  }

  const [courses, semesters] = await Promise.all([
    call('course.list', {}, 'CONCURRENCY-PREFLIGHT-COURSES'),
    call('semester.list', {}, 'CONCURRENCY-PREFLIGHT-SEMESTERS')
  ]);
  if (!courses.success || !semesters.success) {
    throw new Error('TEST_BLOCKED: Could not read Course/Semester lists. Check TEST deployment and permissions.');
  }
  if (!courses.data.length || !semesters.data.length) {
    throw new Error('TEST_BLOCKED: An active Course and Semester are required.');
  }

  const course = courses.data.find(x => x.Status === 'ACTIVE');
  const semester = semesters.data.find(x => x.Status === 'ACTIVE');
  if (!course || !semester) throw new Error('TEST_BLOCKED: No active Course/Semester available.');

  const section = 'CONC-' + Date.now().toString(36).toUpperCase();
  const payload = { courseId: course.CourseID, semesterId: semester.SemesterID, section };
  const startedAt = performance.now();

  // Two independent requests are dispatched without awaiting either one.
  const results = await Promise.all([
    call('offering.create', payload, 'CONC-A-' + section),
    call('offering.create', payload, 'CONC-B-' + section)
  ]);

  const elapsedMs = Math.round(performance.now() - startedAt);
  const successCount = results.filter(x => x.success === true).length;
  const duplicateCount = results.filter(x => x.success === false && x.error && x.error.code === 'DUPLICATE').length;

  const verify = await call('offering.list', {}, 'CONC-VERIFY-' + section);
  const matching = verify.success
    ? verify.data.filter(x => x.offering && x.offering.Section === section)
    : [];

  const report = {
    mode: 'DEPLOYED_TEST_CONCURRENT_OFFERING_CREATE',
    section,
    elapsedMs,
    results: results.map(x => ({ success: x.success, error: x.error && x.error.code, requestId: x.requestId })),
    successCount,
    duplicateCount,
    matchingOfferingCount: matching.length,
    expected: 'one SUCCESS, one DUPLICATE, exactly one matching Offering'
  };
  report.result = successCount === 1 && duplicateCount === 1 && matching.length === 1 ? 'PASS' : 'FAIL';
  console.log(JSON.stringify(report, null, 2));
  return report;
})();
```

## Expected result
- Exactly one `offering.create` request succeeds.
- The other request returns `DUPLICATE`.
- A subsequent `offering.list` returns exactly one Offering with the generated Section.
- In the TEST spreadsheet, exactly one new CourseOfferings row and one `OFFERING_CREATED` AuditLogs row should exist for the created Offering.

## Safety and interpretation
- The generated Section starts with `CONC-` and is unique per run.
- The test intentionally leaves its fixture in TEST. Do not delete it as part of this test.
- If both requests succeed, more than one matching Offering exists, or neither request succeeds, mark the test FAIL and preserve the execution logs for investigation.
- A PASS demonstrates concurrent duplicate protection for this API path in the tested deployment. It does not establish general idempotency: a retry with the same Request ID is not guaranteed to return the original successful response.
- Do not run against Production.
