/**
 * SPORT NUTRITION CLASSROOM — Consolidated TEST Preflight Runner
 * Version: 1.0.0
 *
 * READ-ONLY SAFETY:
 * - Requires SNC_ITR_ENVIRONMENT=TEST and exact TEST spreadsheet binding.
 * - Performs read-only schema inspection and pure in-memory unit checks.
 * - Inspects dispatcher source; it does not execute application API handlers.
 * - Does not create fixtures, mutate Sheets/Drive, install triggers, or call LINE.
 * - A present route is NOT an integration-test PASS.
 */

var SNC_PREFLIGHT_CONFIG_TEST = Object.freeze({
  VERSION: '1.0.0',
  TEST_SPREADSHEET_ID: '1Do67tJgV-e6mPUD1DF3Rjdl5lCYiLp7ytkaMbdYeWFk'
});

function SNC_SystemPreflight_TEST() {
  var report = {
    runner: 'SNC_SystemPreflight_TEST',
    version: SNC_PREFLIGHT_CONFIG_TEST.VERSION,
    mode: 'READ_ONLY_SCHEMA_STATIC_AND_PURE_UNIT',
    writesExpected: 0,
    externalCallsExpected: 0,
    checks: [],
    unitTests: [],
    apiRoutes: [],
    integrationSuites: [],
    summary: {}
  };

  var gate = sncPreflight_validateEnvironment_TEST_();
  report.checks.push({
    id: 'ENV-01',
    status: gate.ok ? 'PASS' : 'BLOCKED',
    detail: gate.ok ? 'TEST environment and active spreadsheet identity verified.' : gate.reason
  });
  if (!gate.ok) {
    report.environment = gate.environment || 'UNVERIFIED';
    report.overallStatus = 'BLOCKED';
    report.summary = { PASS: 0, FAIL: 0, BLOCKED: 1, 'NOT RUN': 0 };
    Logger.log(JSON.stringify(report, null, 2));
    return report;
  }

  report.environment = 'TEST';
  report.spreadsheetName = gate.spreadsheetName;
  report.spreadsheetIdSuffix = gate.spreadsheetIdSuffix;

  try {
    if (typeof inspectSNCDatabaseSchema !== 'function') {
      throw new Error('inspectSNCDatabaseSchema is unavailable.');
    }
    var schema = inspectSNCDatabaseSchema();
    report.checks.push({
      id: 'DB-01',
      status: schema && schema.success === true ? 'PASS' : 'FAIL',
      detail: schema && schema.success === true
        ? 'Read-only schema inspection passed for the declared SNC_SETUP.TABLES.'
        : 'Read-only schema inspection reported missing tables or header mismatches.'
    });
    report.schemaSummary = schema && schema.summary ? schema.summary : null;
  } catch (schemaError) {
    report.checks.push({
      id: 'DB-01',
      status: 'FAIL',
      detail: sncPreflight_safeError_TEST_(schemaError)
    });
  }

  var tests = [
    ['UNIT-ASSIGNMENT-CONFIG', 'Assignment SubmissionType and group-size configuration', function(){ return testAssignmentSubmissionConfigUnit(); }],
    ['UNIT-ASSIGNMENT-MANUAL', 'Manual assignment open/close control', function(){ return testAssignmentSchedulerLogicUnit(); }],
    ['UNIT-COURSE-AUTH', 'Course and offering authorization predicates', function(){ return testCourseManagementAuthorizationLogic(); }],
    ['UNIT-OFFERING-DUPLICATE', 'CourseOffering duplicate predicate', function(){ return testOfferingDuplicatePredicateUnit(); }],
    ['UNIT-IMPORT-VALIDATION', 'Student import row validation and conflict checks', function(){ return testEnrollmentImportLogicUnit(); }],
    ['UNIT-IMPORT-AUTH', 'Student import authorization predicates', function(){ return testEnrollmentAuthorizationPredicatesUnit(); }],
    ['UNIT-GROUP-REP', 'Group representative submission authorization', function(){ return testGroupSubmissionRepresentativeUnit(); }],
    ['UNIT-GROUP-FILE', 'Group staged-file ownership authorization', function(){ return testGroupStagedFileAuthorizationUnit(); }],
    ['UNIT-GRADE-REVIEW', 'Grade Review state transitions', function(){ return testGradeReviewTransitionUnit(); }]
  ];

  tests.forEach(function(item) {
    try {
      var result = item[2]();
      var passed = result && (result.success === true ||
        (Number(result.failed) === 0 && Number(result.passed) === Number(result.total)));
      report.unitTests.push({
        id: item[0],
        name: item[1],
        status: passed ? 'PASS' : 'FAIL',
        result: result || null
      });
    } catch (testError) {
      report.unitTests.push({
        id: item[0],
        name: item[1],
        status: 'FAIL',
        detail: sncPreflight_safeError_TEST_(testError)
      });
    }
  });

  var dispatcher = typeof doPost === 'function' ? String(doPost) : '';
  var routeSpecs = [
    {id:'INT-02',name:'Group Management',route:'/^group\\./',handler:'handleGroupManagementAction_',actions:['group.create','group.join','group.leave','group.selectRepresentative']},
    {id:'INT-03',name:'Group Authorization',route:'/^group\\./',handler:'handleGroupManagementAction_',actions:['group.addMember','group.removeMember','group.members']},
    {id:'INT-04',name:'Submission / Revision / Idempotency',route:'/^submission\\./',handler:'handleSubmissionManagementAction_',actions:['submission.create','submission.revise','submission.list','submission.get']},
    {id:'INT-05',name:'File Upload / Access',route:'/^file\\./',handler:'handleFileManagementAction_',actions:['file.upload','file.access']},
    {id:'INT-06',name:'Grading / Grade Review',route:'/^(grade|gradeReview)\\./',handler:'handleGradingAction_',actions:['grade.create','grade.update','grade.get','grade.history','gradeReview.create','gradeReview.update']},
    {id:'INT-07',name:'Notifications',route:'/^notification\\./',handler:'handleNotificationAction_',actions:['notification.send','notification.log','notification.retry']},
    {id:'INT-07A',name:'Audit',route:'/^audit\\./',handler:'handleAuditAction_',actions:['audit.list']}
  ];

  routeSpecs.forEach(function(spec) {
    var handler = typeof globalThis !== 'undefined' ? globalThis[spec.handler] : null;
    var handlerSource = handler ? String(handler) : '';
    var routePresent = dispatcher.indexOf(spec.route) >= 0;
    var handlerPresent = Boolean(handlerSource);
    var actionsPresent = spec.actions.every(function(action) {
      return handlerSource.indexOf("'" + action + "'") >= 0;
    });
    var found = routePresent && handlerPresent && actionsPresent;
    report.apiRoutes.push({
      id: spec.id,
      name: spec.name,
      status: found ? 'PRESENT — NOT RUN' : 'BLOCKED',
      dispatcherRoutePresent: routePresent,
      handlerPresent: handlerPresent,
      expectedActionsPresent: actionsPresent
    });
    report.integrationSuites.push({
      id: spec.id,
      name: spec.name,
      status: found ? 'NOT RUN' : 'BLOCKED',
      detail: found
        ? 'Dispatcher route, handler and expected action names are present; no database-backed integration procedure was executed.'
        : 'Dispatcher route, handler or one or more expected action names are missing.'
    });
  });

  report.integrationSuites.unshift({
    id: 'INT-01',
    name: 'Users / Roles / Enrollment',
    status: 'NOT RUN',
    detail: 'Requires an explicitly approved synthetic TEST actor and offering fixture manifest.'
  });
  report.integrationSuites.push({
    id: 'INT-08',
    name: 'Browser / LIFF End-to-End / Failure Recovery',
    status: 'BLOCKED',
    detail: 'Requires verified deployed TEST endpoint, browser/LIFF execution and cross-module recovery evidence.'
  });

  var counts = { PASS:0, FAIL:0, BLOCKED:0, 'NOT RUN':0 };
  report.checks.concat(report.unitTests).forEach(function(x) {
    if (Object.prototype.hasOwnProperty.call(counts, x.status)) counts[x.status]++;
  });
  report.integrationSuites.forEach(function(x) {
    if (Object.prototype.hasOwnProperty.call(counts, x.status)) counts[x.status]++;
  });
  report.summary = counts;
  report.overallStatus = counts.FAIL > 0 ? 'FAIL' :
    (counts.BLOCKED > 0 ? 'BLOCKED' :
    (counts['NOT RUN'] > 0 ? 'NOT RUN' : 'PASS'));

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function sncPreflight_validateEnvironment_TEST_() {
  var props = PropertiesService.getScriptProperties();
  var environment = String(props.getProperty('SNC_ITR_ENVIRONMENT') || '').trim().toUpperCase();
  var expectedId = String(props.getProperty('SNC_ITR_TEST_SPREADSHEET_ID') || '').trim();
  var productionId = String(props.getProperty('SNC_ITR_PRODUCTION_SPREADSHEET_ID') || '').trim();

  if (environment !== 'TEST') {
    return {ok:false,environment:environment || 'UNSET',reason:'SNC_ITR_ENVIRONMENT must be explicitly set to TEST.'};
  }
  if (!expectedId || expectedId !== SNC_PREFLIGHT_CONFIG_TEST.TEST_SPREADSHEET_ID) {
    return {ok:false,environment:environment,reason:'SNC_ITR_TEST_SPREADSHEET_ID does not match the approved TEST spreadsheet ID.'};
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return {ok:false,environment:environment,reason:'No active spreadsheet is available.'};
  var actualId = ss.getId();
  if (actualId !== expectedId) {
    return {ok:false,environment:environment,reason:'Active spreadsheet does not match SNC_ITR_TEST_SPREADSHEET_ID.'};
  }
  if (productionId && actualId === productionId) {
    return {ok:false,environment:environment,reason:'Active spreadsheet matches the configured PRODUCTION spreadsheet ID.'};
  }
  return {ok:true,environment:'TEST',spreadsheetName:ss.getName(),spreadsheetIdSuffix:actualId.slice(-6)};
}

function sncPreflight_safeError_TEST_(error) {
  var message = error && error.message ? String(error.message) : 'Unknown error';
  return message.replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[REDACTED]')
    .replace(/(idToken["':= ]+)[^,\s}]+/gi, '$1[REDACTED]')
    .slice(0, 500);
}
