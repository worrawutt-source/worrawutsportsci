function initializeTestDatabase() {
  throw new Error('การ initialize ฐานข้อมูลถูกปิดเพื่อป้องกันข้อมูลเดิม กรุณาตรวจสอบ Script Properties DB_ID และใช้ฐานข้อมูล TEST ที่มีอยู่');
}

/**
 * Import student roster from an Excel .xlsx file stored in Google Drive.
 * Requires Advanced Google Service: Drive API v3 enabled.
 * Expected columns: student ID + first name + last name OR full name.
 */
function importStudentRosterFromExcel_(fileId, sheetName, actorUserId) {
  requireDatabase_();
  if (!fileId) throw new Error('กรุณาระบุ File ID ของไฟล์ Excel');
  const sourceFile = DriveApp.getFileById(String(fileId));
  const mime = sourceFile.getMimeType();
  if (!/spreadsheet|excel|officedocument/i.test(mime) && !/\.xlsx?$/i.test(sourceFile.getName())) {
    throw new Error('ไฟล์ที่เลือกไม่ใช่ Excel หรือ Spreadsheet ที่รองรับ');
  }

  let convertedId = '';
  try {
    const converted = Drive.Files.create(
      {name: 'TEMP_IMPORT_' + sourceFile.getName(), mimeType: 'application/vnd.google-apps.spreadsheet'},
      sourceFile.getBlob(),
      {fields: 'id'}
    );
    convertedId = converted.id;
    const xss = SpreadsheetApp.openById(convertedId);
    const sh = sheetName ? xss.getSheetByName(sheetName) : xss.getSheets()[0];
    if (!sh) throw new Error('ไม่พบ Sheet ในไฟล์ Excel: ' + sheetName);
    const values = sh.getDataRange().getDisplayValues();
    const norm = v => String(v || '').trim().toLowerCase().replace(/\s+/g,'').replace(/[：:]/g,'');
    const idKeys = ['student_id','รหัสนักศึกษา','รหัสนิสิต','รหัสประจำตัวนักศึกษา'].map(norm);
    const fullKeys = ['full_name','ชื่อ-สกุล','ชื่อสกุล','ชื่อ-นามสกุล'].map(norm);
    const firstKeys = ['first_name','firstname','ชื่อ','ชื่อตัว'].map(norm);
    const lastKeys = ['last_name','lastname','surname','นามสกุล'].map(norm);
    const titleKeys = ['title','prefix','คำนำหน้า','คำนำหน้าชื่อ'].map(norm);
    let hr=-1, ci={};
    for (let r=0; r<Math.min(values.length,20); r++) {
      const h=values[r].map(norm);
      const id=h.findIndex(x=>idKeys.includes(x));
      const full=h.findIndex(x=>fullKeys.includes(x));
      const first=h.findIndex(x=>firstKeys.includes(x));
      const last=h.findIndex(x=>lastKeys.includes(x));
      const title=h.findIndex(x=>titleKeys.includes(x));
      if (id>=0 && ((first>=0 && last>=0) || full>=0)) { hr=r; ci={id,full,first,last,title}; break; }
    }
    if (hr<0) throw new Error('ไม่พบหัวคอลัมน์รหัสนักศึกษาและชื่อ-นามสกุลใน 20 แถวแรก');
    const records=values.slice(hr+1).filter(r=>String(r[ci.id]||'').trim()).map(r=>{
      let first=ci.first>=0?String(r[ci.first]||'').trim():'';
      let last=ci.last>=0?String(r[ci.last]||'').trim():'';
      let title=ci.title>=0?String(r[ci.title]||'').trim():'';
      let full=ci.full>=0?String(r[ci.full]||'').trim():[title,first,last].filter(Boolean).join(' ').trim();
      if (!full) full=[title,first,last].filter(Boolean).join(' ').trim();
      if (ci.full>=0 && !first && !last && full) {
        const titleRegex = /^(นางสาว|น\.ส\.|นาย|นาง|ดร\.|ผศ\.ดร\.|รศ\.ดร\.|ศ\.ดร\.|ผศ\.|รศ\.|ศ\.)\s*(.+)$/;
        const match = full.match(titleRegex);
        let remaining = full;
        if (match) { title = title || match[1]; remaining = match[2].trim(); }
        const parts=remaining.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) { last=parts.pop(); first=parts.join(' '); }
        else { first=remaining; }
      }
      const studentId = String(r[ci.id]).trim();
      return [studentId,full,APP.COURSE_CODE,String(APP.TERM),String(APP.SECTION),String(APP.COHORT),true,'EXCEL:'+sourceFile.getName(),first,last,title];
    });
    if (!records.length) throw new Error('ไม่พบข้อมูลนักศึกษาหลังแถวหัวตาราง');
    const ids=records.map(r=>r[0]);
    if (new Set(ids).size!==ids.length) throw new Error('พบรหัสนักศึกษาซ้ำในไฟล์ Excel');
    const target=sheet_('STUDENTS');
    const existing=readObjects_('STUDENTS');
    const existingIds=new Set(existing.map(r=>String(r.STUDENT_ID)));
    const add=records.filter(r=>!existingIds.has(r[0]));
    if (add.length) { const range=target.getRange(target.getLastRow()+1,1,add.length,SCHEMA.STUDENTS.length); range.setNumberFormat('@'); range.setValues(add); }
    logSystem_('ROSTER_IMPORTED_FROM_EXCEL','STUDENT_ROSTER',APP.COURSE_CODE+'-'+APP.TERM,{fileName:sourceFile.getName(),sourceRows:records.length,imported:add.length,skipped:records.length-add.length},actorUserId || 'SYSTEM');
    return {ok:true,fileName:sourceFile.getName(),sourceRows:records.length,imported:add.length,alreadyPresent:records.length-add.length,total:readObjects_('STUDENTS').length};
  } finally {
    if (convertedId) {
      try { Drive.Files.delete(convertedId); } catch (cleanupError) { console.warn('Temporary conversion cleanup failed: '+cleanupError.message); }
    }
  }
}

/** Public client API: student registration begins with roster validation and email OTP. */
