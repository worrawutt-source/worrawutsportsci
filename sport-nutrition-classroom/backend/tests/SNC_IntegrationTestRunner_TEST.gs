/**
 * SPORT NUTRITION CLASSROOM — Integration Test Runner (TEST)
 * Version: 1.1.0
 * Baseline: DOCS v1.3 / SNC-WG-001 v1.0.0
 *
 * READ-ONLY SAFETY:
 * - Strict TEST environment and exact spreadsheet identity guard.
 * - Reads Script Properties and active spreadsheet identity only.
 * - Does not read or write application rows, Drive, triggers, or LINE.
 * - Does not create fixtures or execute application API handlers.
 * - Route presence is NOT an integration-test PASS.
 * - INT-01..INT-07 remain NOT RUN until approved suite procedures/fixtures exist.
 * - INT-08 remains BLOCKED pending deployed TEST browser/LIFF E2E and recovery.
 *
 * Required Script Properties:
 *   SNC_ITR_ENVIRONMENT = TEST
 *   SNC_ITR_TEST_SPREADSHEET_ID = exact TEST spreadsheet ID
 * Optional:
 *   SNC_ITR_PRODUCTION_SPREADSHEET_ID = production spreadsheet ID
 */

var SNC_ITR_CONFIG_TEST = Object.freeze({
  VERSION: '1.1.0',
  TEST_SPREADSHEET_ID: '1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk',
  SUITE_IDS: ['INT-01','INT-02','INT-03','INT-04','INT-05','INT-06','INT-07','INT-08']
});

function SNC_IntegrationTestRunner_TEST() {
  var report = {
    runner: 'SNC_IntegrationTestRunner_TEST',
    version: SNC_ITR_CONFIG_TEST.VERSION,
    mode: 'READ_ONLY_TEST_GUARD_AND_STATIC_DISPATCH_INSPECTION',
    evidenceLevel: 'STATIC_CODE_INSPECTION',
    writesExpected: 0,
    externalCallsExpected: 0,
    suites: [],
    checks: [],
    summary: {}
  };

  var gate = sncITR_validateEnvironment_TEST_();
  report.checks.push({
    id: 'ENV-01',
    status: gate.ok ? 'PASS' : 'BLOCKED',
    detail: gate.ok ? 'TEST environment and active spreadsheet identity verified.' : gate.reason
  });
  if (!gate.ok) {
    report.environment = gate.environment || 'UNVERIFIED';
    SNC_ITR_CONFIG_TEST.SUITE_IDS.forEach(function(id) {
      report.suites.push({id:id,status:'BLOCKED',detail:'TEST safety gate did not pass; no application source or records were inspected.'});
    });
    sncITR_finalizeReport_TEST_(report);
    Logger.log(JSON.stringify(report,null,2));
    return report;
  }

  report.environment = 'TEST';
  report.spreadsheetName = gate.spreadsheetName;
  report.spreadsheetIdSuffix = gate.spreadsheetIdSuffix;

  var dispatcher = typeof doPost === 'function' ? String(doPost) : '';
  report.checks.push({
    id: 'STATIC-01',
    status: dispatcher ? 'PASS' : 'FAIL',
    detail: dispatcher ? 'doPost dispatcher source is available for static inspection.' : 'doPost dispatcher is unavailable.'
  });

  var specs = [
    {id:'INT-02',name:'Group Management',route:'/^group\\./',handler:'handleGroupManagementAction_'},
    {id:'INT-03',name:'Group Authorization',route:'/^group\\./',handler:'handleGroupManagementAction_'},
    {id:'INT-04',name:'Submission / Revision / Idempotency',route:'/^submission\\./',handler:'handleSubmissionManagementAction_'},
    {id:'INT-05',name:'File Upload / Attach / Access / Rollback',route:'/^file\\./',handler:'handleFileManagementAction_'},
    {id:'INT-06',name:'Grading / Grade Review',route:'/^(grade|gradeReview)\\./',handler:'handleGradingAction_'},
    {id:'INT-07',name:'Notifications / Audit',route:'/^notification\\./',handler:'handleNotificationAction_'}
  ];

  report.suites.push({
    id:'INT-01',
    name:'Users / Roles / Enrollment',
    status:'NOT RUN',
    evidenceLevel:'SYNTHETIC_FIXTURE_REQUIRED',
    detail:'Requires the approved synthetic TEST actor/offering fixture batch; this runner does not use legacy actor IDs or read application rows.'
  });

  specs.forEach(function(spec) {
    var routePresent = dispatcher.indexOf(spec.route) >= 0;
    var handler = (typeof globalThis !== 'undefined') ? globalThis[spec.handler] : null;
    var handlerPresent = typeof handler === 'function';
    var found = routePresent && handlerPresent;
    report.suites.push({
      id:spec.id,
      name:spec.name,
      status:found ? 'NOT RUN' : 'BLOCKED',
      evidenceLevel:'STATIC_CODE_INSPECTION',
      routePresent:routePresent,
      handlerPresent:handlerPresent,
      detail:found
        ? 'Dispatcher route and handler are present; the suite-specific integration procedure has not been executed.'
        : 'Expected dispatcher route or handler was not found in the active source.'
    });
  });

  report.suites.push({
    id:'INT-08',
    name:'Browser / LIFF End-to-End / Failure Recovery',
    status:'BLOCKED',
    evidenceLevel:'DEPLOYED_TEST_E2E_REQUIRED',
    detail:'Requires verified deployed TEST endpoint, browser/LIFF execution, and cross-module recovery evidence.'
  });

  var detector = sncITR_routeDetectorUnit_TEST_();
  report.checks.push({id:'STATIC-02',status:detector.success?'PASS':'FAIL',detail:detector.detail});
  sncITR_finalizeReport_TEST_(report);
  Logger.log(JSON.stringify(report,null,2));
  return report;
}

function sncITR_validateEnvironment_TEST_() {
  var props = PropertiesService.getScriptProperties();
  var environment = String(props.getProperty('SNC_ITR_ENVIRONMENT') || '').trim().toUpperCase();
  var expectedId = String(props.getProperty('SNC_ITR_TEST_SPREADSHEET_ID') || '').trim();
  var productionId = String(props.getProperty('SNC_ITR_PRODUCTION_SPREADSHEET_ID') || '').trim();

  if (environment !== 'TEST') return {ok:false,environment:environment||'UNSET',reason:'SNC_ITR_ENVIRONMENT must be explicitly set to TEST.'};
  if (expectedId !== SNC_ITR_CONFIG_TEST.TEST_SPREADSHEET_ID) return {ok:false,environment:environment,reason:'SNC_ITR_TEST_SPREADSHEET_ID does not match the approved TEST spreadsheet ID.'};

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return {ok:false,environment:environment,reason:'No active spreadsheet is available.'};
  var actualId = ss.getId();
  if (actualId !== expectedId) return {ok:false,environment:environment,reason:'Active spreadsheet does not match SNC_ITR_TEST_SPREADSHEET_ID.'};
  if (productionId && actualId === productionId) return {ok:false,environment:environment,reason:'Active spreadsheet matches the configured PRODUCTION spreadsheet ID.'};

  return {ok:true,environment:'TEST',spreadsheetName:ss.getName(),spreadsheetIdSuffix:actualId.slice(-6)};
}

function sncITR_routeDetector_TEST_(dispatcherSource,routeLiteral,handlerName,handlerAvailable) {
  if (typeof dispatcherSource !== 'string' || !dispatcherSource || !routeLiteral || !handlerName) return false;
  return dispatcherSource.indexOf(routeLiteral) >= 0 && handlerAvailable === true;
}

function sncITR_routeDetectorUnit_TEST_() {
  var sample = 'function doPost(e) { if (/^group\\./.test(action)) return handleGroupManagementAction_(); }';
  var positive = sncITR_routeDetector_TEST_(sample,'/^group\\./','handleGroupManagementAction_',true);
  var negative = !sncITR_routeDetector_TEST_(sample,'/^submission\\./','handleSubmissionManagementAction_',false);
  return {success:positive&&negative,detail:positive&&negative?'Static route detector identifies present and absent route literals correctly.':'Static route detector self-test failed.'};
}

function sncITR_finalizeReport_TEST_(report) {
  var counts = {PASS:0,FAIL:0,BLOCKED:0,'NOT RUN':0};
  (report.checks||[]).concat(report.suites||[]).forEach(function(item) {
    if (Object.prototype.hasOwnProperty.call(counts,item.status)) counts[item.status]++;
  });
  report.summary = counts;
  report.overallStatus = counts.FAIL>0?'FAIL':(counts.BLOCKED>0?'BLOCKED':(counts['NOT RUN']>0?'NOT RUN':'PASS'));
  return report;
}
