/**
 * SPORT NUTRITION CLASSROOM — Closed Assignment Edit Regression
 * Read-only verification of the DOC-02 CLOSED edit guard.
 *
 * Preconditions:
 * - TEST environment and approved TEST spreadsheet.
 * - Existing Assignment/Group synthetic manifest.
 * - The manifest's individual Assignment exists and is CLOSED.
 *
 * This test invokes the handler with a request that must be rejected before
 * any Assignment or AuditLogs mutation. It does not create fixtures or clean up.
 */
function SNC_TestClosedAssignmentEditGuard_READONLY_TEST(){
  var env=sncAGR_env_TEST_();
  if(!env.ok)throw new Error('SAFETY_STOP: '+env.reason);
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var manifestResult=SNC_GetAssignmentGroupManifest_TEST();
  if(!manifestResult||!manifestResult.success||!manifestResult.assignmentGroup)
    throw new Error('PREFLIGHT_BLOCKED: Assignment/Group manifest is unavailable.');
  var assignmentId=manifestResult.assignmentGroup.assignments&&manifestResult.assignmentGroup.assignments.individual;
  if(!assignmentId)throw new Error('PREFLIGHT_BLOCKED: individual Assignment ID is missing from manifest.');
  var current=cmGet_('Assignments','AssignmentID',String(assignmentId));
  if(!current)throw new Error('PREFLIGHT_BLOCKED: manifest Assignment does not resolve exactly.');
  if(String(current.Status||'').toUpperCase()!=='CLOSED')
    throw new Error('PREFLIGHT_BLOCKED: target Assignment must already be CLOSED; no changes were made.');

  var admin=sncAGR_admin_TEST_(ss);
  var sh=cmSheet_('Assignments');
  var beforeRow=sh.getRange(current._row,1,1,sh.getLastColumn()).getDisplayValues()[0];
  var beforeAuditIds=sncAGR_ids_TEST_(ss).AuditLogs.slice().sort();
  var resultCode='SUCCESS';
  try{
    handleAssignmentManagementAction_('assignment.update',admin,{
      assignmentId:String(assignmentId),
      title:'SNC_TST_REGRESSION_MUST_NOT_APPLY'
    },Utilities.getUuid());
  }catch(e){
    resultCode=String(e&&e.apiCode||'UNCLASSIFIED_ERROR');
  }

  var afterCurrent=cmGet_('Assignments','AssignmentID',String(assignmentId));
  var afterRow=afterCurrent?sh.getRange(afterCurrent._row,1,1,sh.getLastColumn()).getDisplayValues()[0]:null;
  var afterAuditIds=sncAGR_ids_TEST_(ss).AuditLogs.slice().sort();
  var rowUnchanged=JSON.stringify(beforeRow)===JSON.stringify(afterRow);
  var auditUnchanged=JSON.stringify(beforeAuditIds)===JSON.stringify(afterAuditIds);
  var passed=resultCode==='CONFLICT'&&rowUnchanged&&auditUnchanged;
  var out={
    success:passed,
    evidenceLevel:'HANDLER_LEVEL_READ_ONLY_REGRESSION',
    test:'CLOSED_ASSIGNMENT_EDIT_REJECTED_WITHOUT_MUTATION',
    expectedErrorCode:'CONFLICT',
    actualErrorCode:resultCode,
    assignmentUnchanged:rowUnchanged,
    auditLogIdsUnchanged:auditUnchanged,
    writesExpected:0,
    externalCallsExpected:0
  };
  Logger.log('SNC_CLOSED_ASSIGNMENT_EDIT_REGRESSION='+JSON.stringify(out));
  if(!passed)throw new Error('REGRESSION_FAILED: '+JSON.stringify(out));
  return out;
}
