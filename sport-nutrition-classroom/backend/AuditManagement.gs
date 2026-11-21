/**
 * SPORT NUTRITION CLASSROOM — Restricted audit log read API
 */
function handleAuditAction_(action,actor,p){
  if(action==='audit.list'){
    if(!cmSystem_(actor,'SYSTEM_ADMIN'))throw apiError_('FORBIDDEN','System Admin permission is required.');
    var limit=Number(p.limit||100);if(!Number.isInteger(limit)||limit<1||limit>200)throw apiError_('VALIDATION_ERROR','limit must be 1 to 200.');
    var rows=cmRows_('AuditLogs').sort(function(a,b){return new Date(b.CreatedAt)-new Date(a.CreatedAt);}).slice(0,limit);
    return rows.map(function(r){return {auditId:r.AuditID,actorUserId:r.ActorUserID,action:r.Action,entityType:r.EntityType,entityId:r.EntityID,detailsJson:r.DetailsJson,createdAt:r.CreatedAt,requestId:r.RequestID};});
  }
  throw apiError_('NOT_IMPLEMENTED','Audit action is not implemented.');
}
