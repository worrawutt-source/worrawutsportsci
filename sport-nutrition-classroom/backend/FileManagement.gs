/**
 * SPORT NUTRITION CLASSROOM — Private Google Drive file handling
 * Set SNC_SUBMISSION_FOLDER_ID in Script Properties. Files remain private
 * and are shared only with submitter/group members and assigned instructors.
 */
const FM_ALLOWED_MIME_=['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
'text/plain','image/jpeg','image/png'];
const FM_MAX_BYTES_=4*1024*1024;
function fmCanAccessSubmission_(actor,s){
  return smCanView_(actor,s);
}
function fmShareWithSubmissionActors_(file,actor,a,target){
  var ids=[actor.userId];
  if(target.type==='GROUP')gmMembers_(target.groupId).forEach(function(m){ids.push(String(m.UserID));});
  ntStaffForOffering_(a.OfferingID).forEach(function(id){ids.push(String(id));});
  var users=cmRows_('Users');
  ids.filter(function(id,i,all){return all.indexOf(id)===i;}).forEach(function(id){
    var u=users.filter(function(x){return String(x.UserID)===id;})[0];
    if(u&&String(u.Email||'').indexOf('@')>0){try{file.addViewer(String(u.Email));}catch(e){console.error('FILE_VIEWER_SHARE_FAILED');}}
  });
}
function handleFileManagementAction_(action,actor,p,requestId){
  if(action==='file.upload'){
    var aid=cmText_(p.assignmentId,100,'assignmentId',true),a=smAssignment_(aid),target=smValidateTarget_(actor,a,p);
    var name=cmText_(p.fileName,180,'fileName',true),mime=cmText_(p.mimeType,120,'mimeType',true).toLowerCase();
    if(FM_ALLOWED_MIME_.indexOf(mime)<0)throw apiError_('FILE_INVALID','File type is not allowed.');
    if(typeof p.base64!=='string'||!p.base64||p.base64.length>Math.ceil(FM_MAX_BYTES_*4/3)+16)throw apiError_('FILE_INVALID','File payload is missing or too large.');
    var bytes;
    try{bytes=Utilities.base64Decode(p.base64);}catch(e){throw apiError_('FILE_INVALID','File encoding is invalid.');}
    if(!bytes.length||bytes.length>FM_MAX_BYTES_)throw apiError_('FILE_INVALID','File size must be between 1 byte and 4 MB.');
    var folderId=PropertiesService.getScriptProperties().getProperty('SNC_SUBMISSION_FOLDER_ID');
    if(!folderId)throw apiError_('CONFIGURATION_ERROR','Submission folder is not configured.');
    var folder;try{folder=DriveApp.getFolderById(folderId);}catch(e){throw apiError_('CONFIGURATION_ERROR','Submission folder is unavailable.');}
    var blob=Utilities.newBlob(bytes,mime,name),file=folder.createFile(blob);
    try{fmShareWithSubmissionActors_(file,actor,a,target);}catch(e){try{file.setTrashed(true);}catch(_){}throw apiError_('FILE_PERMISSION_FAILED','Unable to set file access permissions.');}
    var sh=cmSheet_('SubmissionFiles'),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],row=new Array(headers.length),fid=Utilities.getUuid(),now=new Date();
    row[headers.indexOf('SubmissionFileID')]=fid;row[headers.indexOf('SubmissionID')]='STAGED:'+actor.userId;
    row[headers.indexOf('FileName')]=name;row[headers.indexOf('MimeType')]=mime;row[headers.indexOf('FileSize')]=bytes.length;
    row[headers.indexOf('DriveFileID')]=file.getId();row[headers.indexOf('DriveUrl')]=file.getUrl();
    row[headers.indexOf('UploadedByUserID')]=actor.userId;row[headers.indexOf('CreatedAt')]=now;sh.appendRow(row);
    appendAudit_(actor.userId,'SUBMISSION_FILE_UPLOADED','SubmissionFile',fid,{assignmentId:aid,fileSize:bytes.length,mimeType:mime},requestId);
    return {fileId:fid,fileName:name,mimeType:mime,fileSize:bytes.length};
  }
  if(action==='file.access'){
    var fid2=cmText_(p.fileId,100,'fileId',true),record=cmGet_('SubmissionFiles','SubmissionFileID',fid2);
    if(!record||String(record.SubmissionID).indexOf('STAGED:')===0)throw apiError_('NOT_FOUND','Attached submission file not found.');
    var submission=cmGet_('Submissions','SubmissionID',record.SubmissionID);
    if(!submission||!fmCanAccessSubmission_(actor,submission))throw apiError_('FORBIDDEN','File access denied.');
    if(!record.DriveFileID)return {fileName:record.FileName,driveUrl:record.DriveUrl};
    var driveFile;try{driveFile=DriveApp.getFileById(String(record.DriveFileID));}catch(e){throw apiError_('NOT_FOUND','Stored file is unavailable.');}
    return {fileName:record.FileName,mimeType:record.MimeType,fileSize:Number(record.FileSize),driveUrl:driveFile.getUrl()};
  }
  throw apiError_('NOT_IMPLEMENTED','File action is not implemented.');
}
