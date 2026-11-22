/**
 * SPORT NUTRITION CLASSROOM — Integration Test Runner (TEST)
 * Version: 1.0.1
 * Evidence level: static source/dispatcher inspection only.
 *
 * SAFETY: This runner is read-only. It does not access Sheets, Drive, LINE,
 * Script Properties, triggers, or external services. It does not execute
 * application handlers. Route presence is NOT an integration test PASS.
 *
 * INT-01..INT-07 remain NOT RUN until suite-specific procedures are implemented
 * and separately reviewed. INT-08 remains BLOCKED pending deployed browser/LIFF
 * E2E and cross-module failure-recovery evidence.
 */

var SNC_ITR_CONFIG_TEST = Object.freeze({
  VERSION: '1.0.1',
  SUITE_IDS: ['INT-01','INT-02','INT-03','INT-04','INT-05','INT-06','INT-07','INT-08']
});

function SNC_IntegrationTestRunner_TEST() {
  var report = {
    runner: 'SNC_IntegrationTestRunner_TEST',
    version: SNC_ITR_CONFIG_TEST.VERSION,
    mode: 'READ_ONLY_STATIC_DISPATCH_INSPECTION',
    evidenceLevel: 'STATIC_CODE_INSPECTION',
    writesExpected: 0,
    externalCallsExpected: 0,
    suites: [],
    checks: [],
    summary: {}
  };

  var source = (typeof doPost === 'function') ? String(doPost) : '';
  var routes = [
    {id:'INT-02',name:'Group Management',route:'/^group\\./',handler:'handleGroupManagementAction_'},
    {id:'INT-03',name:'Group Authorization',route:'/^group\\./',handler:'handleGroupManagementAction_'},
    {id:'INT-04',name:'Submission / Revision / Idempotency',route:'/^submission\\./',handler:'handleSubmissionManagementAction_'},
    {id:'INT-05',name:'File Upload / Attach / Access / Rollback',route:'/^file\\./',handler:'handleFileManagementAction_'},
    {id:'INT-06',name:'Grading / Grade Review',route:'/^(grade|gradeReview)\\./',handler:'handleGradingAction_'},
    {id:'INT-07',name:'Notifications / Audit',route:'/^notification\\./',handler:'handleNotificationAction_'}
  ];

  report.checks.push({
    id:'STATIC-01',
    status: source ? 'PASS' : 'FAIL',
    detail: source ? 'doPost source is available for inspection.' : 'doPost is unavailable.'
  });

  routes.forEach(function(item) {
    var routePresent = source.indexOf(item.route) >= 0 &&
      source.indexOf(item.handler) >= 0;
    report.suites.push({
      id:item.id,
      name:item.name,
      status:routePresent ? 'NOT RUN' : 'BLOCKED',
      evidenceLevel:'STATIC_CODE_INSPECTION',
      routePresent:routePresent,
      detail:routePresent
        ? 'Dispatcher route and handler reference found. Suite-specific integration procedure has not been executed.'
        : 'Expected dispatcher route or handler reference was not found in doPost source.'
    });
  });

  report.suites.unshift({
    id:'INT-01',
    name:'Users / Roles / Enrollment',
    status:'NOT RUN',
    evidenceLevel:'NOT RUN',
    detail:'This runner revision does not execute database-backed actor or enrollment checks.'
  });
  report.suites.push({
    id:'INT-08',
    name:'Browser / LIFF End-to-End / Failure Recovery',
    status:'BLOCKED',
    evidenceLevel:'DEPLOYED_TEST_E2E_REQUIRED',
    detail:'Requires verified deployed TEST source, browser/LIFF execution, and cross-module recovery evidence.'
  });

  var detectorTest = sncITR_routeDetectorUnit_TEST_();
  report.checks.push({
    id:'STATIC-02',
    status:detectorTest.success ? 'PASS' : 'FAIL',
    detail:detectorTest.detail
  });

  var counts = {PASS:0,FAIL:0,BLOCKED:0,'NOT RUN':0};
  report.suites.forEach(function(suite) {
    if (Object.prototype.hasOwnProperty.call(counts,suite.status)) counts[suite.status]++;
  });
  report.summary = counts;
  report.summary.checksPASS = report.checks.filter(function(x){return x.status==='PASS';}).length;
  report.summary.checksFAIL = report.checks.filter(function(x){return x.status==='FAIL';}).length;
  report.overallStatus = counts.FAIL > 0 ? 'FAIL' :
    (counts.BLOCKED > 0 ? 'BLOCKED' :
    (counts['NOT RUN'] > 0 ? 'NOT RUN' : 'PASS'));

  Logger.log(JSON.stringify(report,null,2));
  return report;
}

/**
 * Route detection uses the actual dispatcher source and exact route literal.
 * It does not apply a route-anchored regex to the complete function source.
 */
function sncITR_routePresent_TEST_(dispatcherSource, routeLiteral, handlerName) {
  if (typeof dispatcherSource !== 'string' || !dispatcherSource) return false;
  return dispatcherSource.indexOf(routeLiteral) >= 0 &&
    dispatcherSource.indexOf(handlerName) >= 0;
}

function sncITR_routeDetectorUnit_TEST_() {
  var sample = [
    'function doPost(e) {',
    '  if (/^group\\./.test(action)) {',
    '    return handleGroupManagementAction_(action, actor, payload, requestId);',
    '  }',
    '}'
  ].join('\\n');
  var positive = sncITR_routePresent_TEST_(sample,'/^group\\./','handleGroupManagementAction_');
  var negative = !sncITR_routePresent_TEST_(sample,'/^submission\\./','handleSubmissionManagementAction_');
  return {
    success:positive && negative,
    detail:(positive && negative)
      ? 'Route detector correctly identifies a present route and rejects an absent route.'
      : 'Route detector unit check failed.'
  };
}
