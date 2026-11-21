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
function fmValidateFileSignature_(bytes,mime,name){
  function b(i){return (Number(bytes[i])||0)+256&255;}
  function starts(values){return values.every(function(v,i){return b(i)===v;});}
  var ok=false,lower=String(name||'').toLowerCase();
  if(mime==='application/pdf')ok=starts([37,80,68,70,45]);
  else if(mime==='application/msword')ok=starts([208,207,17,224,161,177,26,225]);
  else if(mime==='image/jpeg')ok=starts([255,216,255]);
  else if(mime==='image/png')ok=starts([137,80,78,71,13,10,26,10]);
  else if(mime==='text/plain'){
    ok=!bytes.some(function(v){return ((Number(v)||0)+256&255)===0;});
  }else if([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ].indexOf(mime)>=0){
    var ext=mime.indexOf('wordprocessing')>=0?'.docx':mime.indexOf('presentation')>=0?'.pptx':'.xlsx';
    if(!lower.endsWith(ext)||!starts([80,75,3,4]))throw apiError_('FILE_INVALID','File extension or ZIP signature does not match the declared Office format.');
    try{
      var entries=Utilities.unzip(Utilities.newBlob(bytes,'application/zip','upload.zip'));
      var paths=entries.map(function(x){return String(x.getName());});
      var required=mime.indexOf('wordprocessing')>=0?'word/document.xml':mime.indexOf('presentation')>=0?'ppt/presentation.xml':'xl/workbook.xml';
      var total=entries.reduce(function(sum,x){return sum+x.getBytes().length;},0);
      ok=paths.indexOf('[Content_Types].xml')>=0&&paths.indexOf(required)>=0&&total<=20*1024*1024;
    }catch(e){ok=false;}
  }else if(['application/vnd.ms-powerpoint','application/vnd.ms-excel'].indexOf(mime)>=0){
    ok=starts([208,207,17,224,161,177,26,225])&&
      (mime==='application/vnd.ms-powerpoint'?lower.endsWith('.ppt'):lower.endsWith('.xls'));
  }
  if(!ok)throw apiError_('FILE_INVALID','File content signature does not match the declared file type.');
}
function fmCanAccessSubmission_(actor,s){
  return smCanView_(actor,s);
}
function fmShareWithSubmissionActors_(file,actor,a,target){
  var ids=[actor.userId];
  if(target.type==='GROUP')gmMembers_(target.groupId).forEach(function(m){ids.push(String(m.UserID));});
  ntStaffForOffering_(a.OfferingID).forEach(function(id){ids.push(String(id));});
  var users=cmRows_('Users'),emails=[];
  ids.filter(function(id,i,all){return all.indexOf(id)===i;}).forEach(function(id){
    var u=users.filter(function(x){return String(x.UserID)===id;})[0];
    if(!u||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(u.Email||'')))
      throw apiError_('FILE_PERMISSION_FAILED','An authorized participant has no valid account email.');
    emails.push(String(u.Email).trim().toLowerCase());
  });
  var existing=file.getViewers().map(function(v){return String(v.getEmail()).toLowerCase();});
  var added=[];
  try{
    emails.filter(function(email,i,all){return all.indexOf(email)===i&&!existing.includes(email);}).forEach(function(email){
      file.addViewer(email);added.push(email);
    });
  }catch(e){
    added.forEach(function(email){try{file.removeViewer(email);}catch(_){}});
    throw apiError_('FILE_PERMISSION_FAILED','Unable to grant file access to every authorized participant.');
  }
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
    fmValidateFileSignature_(bytes,mime,name);
    var folderId=PropertiesService.getScriptProperties().getProperty('SNC_SUBMISSION_FOLDER_ID');
    if(!folderId)throw apiError_('CONFIGURATION_ERROR','Submission folder is not configured.');
    var folder;try{folder=DriveApp.getFolderById(folderId);}catch(e){throw apiError_('CONFIGURATION_ERROR','Submission folder is unavailable.');}
    try{if(folder.getSharingAccess()!==DriveApp.Access.PRIVATE)throw new Error('FOLDER_NOT_PRIVATE');}catch(e){throw apiError_('CONFIGURATION_ERROR','Submission folder must be private; inherited folder sharing is not allowed.');}
    var blob=Utilities.newBlob(bytes,mime,name),file=folder.createFile(blob);
    try{var owner=cmRows_('Users').filter(function(u){return String(u.UserID)===String(actor.userId);})[0];if(owner&&String(owner.Email||'').indexOf('@')>0)file.addViewer(String(owner.Email));}
    catch(e){try{file.setTrashed(true);}catch(_){}throw apiError_('FILE_PERMISSION_FAILED','Unable to set uploader access permissions.');}
    var fid=Utilities.getUuid(),now=new Date();
    try{
      var sh=cmSheet_('SubmissionFiles'),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],row=new Array(headers.length);
      row[headers.indexOf('SubmissionFileID')]=fid;row[headers.indexOf('SubmissionID')]='STAGED:'+actor.userId+':'+aid;
      row[headers.indexOf('FileName')]=name;row[headers.indexOf('MimeType')]=mime;row[headers.indexOf('FileSize')]=bytes.length;
      row[headers.indexOf('DriveFileID')]=file.getId();row[headers.indexOf('DriveUrl')]=file.getUrl();
      row[headers.indexOf('UploadedByUserID')]=actor.userId;row[headers.indexOf('CreatedAt')]=now;sh.appendRow(row);
    }catch(sheetError){
      try{file.setTrashed(true);}catch(cleanupError){console.error('ORPHAN_FILE_CLEANUP_FAILED');}
      throw apiError_('FILE_STORAGE_FAILED','Unable to register uploaded file; the temporary Drive file was removed when possible.');
    }
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
