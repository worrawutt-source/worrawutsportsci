
function apiAdminCreateGroup(token,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN]); payload=payload||{};
  const name=String(payload.groupName||'').trim();
  if(!name) throw new Error('กรุณาระบุชื่อกลุ่ม');
  if(name.length>100) throw new Error('ชื่อกลุ่มต้องไม่เกิน 100 ตัวอักษร');
  const lock=LockService.getScriptLock(); lock.waitLock(60000);
  try{
    if(readObjects_('RESEARCH_GROUPS').some(g=>g.STATUS==='ACTIVE'&&String(g.GROUP_NAME).trim().toLowerCase()===name.toLowerCase())) throw new Error('มีชื่อกลุ่มนี้อยู่แล้ว');
    const id=Utilities.getUuid(), now=new Date();
    appendObject_('RESEARCH_GROUPS',{GROUP_ID:id,GROUP_NAME:name,TOPIC_TITLE_TH:String(payload.topicTh||''),TOPIC_TITLE_EN:String(payload.topicEn||''),STATUS:'ACTIVE',CREATED_BY:ctx.user.USER_ID,CREATED_AT:now,UPDATED_AT:now});
    logSystem_('RESEARCH_GROUP_CREATED','GROUP',id,{groupName:name},ctx.user.USER_ID);
    return {ok:true,groupId:id,message:'สร้างกลุ่มวิจัยแล้ว'};
  }finally{lock.releaseLock();}
}

function normalizeStudentId_(value){
  // Compare IDs as trimmed text; preserve leading zeros and avoid numeric coercion.
  return String(value===null||value===undefined?'':value).trim().replace(/\s+/g,'');
}

function findActiveStudentUserById_(studentId){
  const target=normalizeStudentId_(studentId);
  if(!target) return null;
  const matches=readObjects_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE'&&normalizeStudentId_(u.STUDENT_ID)===target);
  return matches.length===1?matches[0]:null;
}

function addStudentToGroup_(groupId,studentId,userId,actorId){
  const group=readObjects_('RESEARCH_GROUPS').find(g=>g.GROUP_ID===groupId&&g.STATUS==='ACTIVE');
  if(!group) throw new Error('ไม่พบกลุ่มวิจัย');
  const student=readObjects_('STUDENTS').find(s=>normalizeStudentId_(s.STUDENT_ID)===normalizeStudentId_(studentId)&&String(s.IS_ACTIVE).toUpperCase()!=='FALSE');
  if(!student) throw new Error('ไม่พบรหัสนักศึกษาในทะเบียนที่ใช้งานอยู่');
  if(readObjects_('GROUP_MEMBERS').some(m=>normalizeStudentId_(m.STUDENT_ID)===normalizeStudentId_(studentId)&&m.STATUS==='ACTIVE')) throw new Error('นักศึกษานี้อยู่ในกลุ่มอื่นแล้ว');
  const user=userId?readObjects_('SYS_USERS').find(u=>u.USER_ID===userId&&u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE'):findActiveStudentUserById_(studentId);
  appendObject_('GROUP_MEMBERS',{MEMBERSHIP_ID:Utilities.getUuid(),GROUP_ID:groupId,STUDENT_ID:String(studentId),USER_ID:user?user.USER_ID:'',STATUS:'ACTIVE',JOINED_AT:new Date(),UPDATED_AT:new Date()});
  logSystem_('GROUP_MEMBER_ADDED','GROUP',groupId,{studentId:String(studentId)},actorId);
  return {ok:true,message:'เพิ่มสมาชิกเข้ากลุ่มแล้ว'};
}

function apiAdminAddGroupMember(token,groupId,studentId){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{return addStudentToGroup_(String(groupId),String(studentId), '',ctx.user.USER_ID);}
  finally{lock.releaseLock();}
}

// Add multiple students to one research group in a single server request.
function apiAdminAddGroupMembers(token,groupId,studentIds){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const gid=String(groupId||'').trim();
  const ids=Array.isArray(studentIds)?studentIds.map(x=>normalizeStudentId_(x)).filter(Boolean):[];
  if(!gid) throw new Error('กรุณาเลือกกลุ่มวิจัย');
  if(!ids.length) throw new Error('กรุณาเลือกนักศึกษาอย่างน้อย 1 คน');
  if(ids.length>100) throw new Error('เลือกนักศึกษาได้ไม่เกิน 100 คนต่อครั้ง');
  if(new Set(ids).size!==ids.length) throw new Error('พบรหัสนักศึกษาซ้ำในรายการที่เลือก');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===gid&&g.STATUS==='ACTIVE');
    if(!group) throw new Error('ไม่พบกลุ่มวิจัยหรือกลุ่มไม่ได้อยู่ในสถานะใช้งาน');
    const roster=readObjectsFresh_('STUDENTS');
    const activeMembers=readObjectsFresh_('GROUP_MEMBERS').filter(m=>m.STATUS==='ACTIVE');
    const missing=ids.filter(id=>!roster.some(s=>normalizeStudentId_(s.STUDENT_ID)===id&&String(s.IS_ACTIVE).toUpperCase()!=='FALSE'));
    if(missing.length) throw new Error('ไม่พบรหัสนักศึกษาที่ใช้งานได้: '+missing.join(', '));
    const already=ids.filter(id=>activeMembers.some(m=>normalizeStudentId_(m.STUDENT_ID)===id));
    if(already.length) throw new Error('นักศึกษาต่อไปนี้อยู่ในกลุ่มแล้ว จึงไม่เพิ่มซ้ำ: '+already.join(', '));
    const users=readObjectsFresh_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE');
    const sh=sheet_('GROUP_MEMBERS');
    const now=new Date();
    const rows=ids.map(id=>{
      const matches=users.filter(u=>normalizeStudentId_(u.STUDENT_ID)===id);
      return {
        MEMBERSHIP_ID:Utilities.getUuid(),
        GROUP_ID:gid,
        STUDENT_ID:id,
        USER_ID:matches.length===1?matches[0].USER_ID:'',
        STATUS:'ACTIVE',
        JOINED_AT:now,
        UPDATED_AT:now
      };
    });
    rows.forEach(row=>appendObject_('GROUP_MEMBERS',row));
    logSystem_('GROUP_MEMBERS_BULK_ADDED','GROUP',gid,{studentIds:ids,count:ids.length},ctx.user.USER_ID);
    SpreadsheetApp.flush();
    return {ok:true,count:ids.length,studentIds:ids,message:'เพิ่มสมาชิกเข้ากลุ่ม '+group.GROUP_NAME+' สำเร็จ '+ids.length+' คน'};
  }finally{lock.releaseLock();}
}

function apiAdminRepairGroupMemberLinks(token){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>m.STATUS==='ACTIVE');
    const users=readObjectsFresh_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE');
    const studentIds=new Set(readObjectsFresh_('STUDENTS').map(s=>normalizeStudentId_(s.STUDENT_ID)));
    const sh=sheet_('GROUP_MEMBERS');
    let linked=0, alreadyLinked=0, unresolved=0;
    const details=[];
    members.forEach(m=>{
      const sid=normalizeStudentId_(m.STUDENT_ID);
      const matches=users.filter(u=>normalizeStudentId_(u.STUDENT_ID)===sid);
      if(!sid||!studentIds.has(sid)||matches.length!==1){
        unresolved++;
        details.push({studentId:String(m.STUDENT_ID||''),groupId:String(m.GROUP_ID||''),reason:!sid?'ไม่มีรหัสนักศึกษา':!studentIds.has(sid)?'รหัสไม่อยู่ในทะเบียน':matches.length===0?'ไม่พบบัญชี Student ที่ตรงกับรหัส':'พบบัญชี Student มากกว่าหนึ่งบัญชี'});
        return;
      }
      const user=matches[0];
      if(String(m.USER_ID||'')===String(user.USER_ID)){alreadyLinked++;return;}
      sh.getRange(m._row,4).setValue(user.USER_ID);
      linked++;
    });
    SpreadsheetApp.flush();
    logSystem_('GROUP_MEMBER_LINK_REPAIR','COURSE','4084901',{linked,alreadyLinked,unresolved},ctx.user.USER_ID);
    return {ok:true,linked,alreadyLinked,unresolved,details,message:'ตรวจสอบการเชื่อมบัญชีกับสมาชิกกลุ่มแล้ว: เชื่อมใหม่ '+linked+' รายการ · เชื่อมอยู่แล้ว '+alreadyLinked+' รายการ · ต้องตรวจสอบ '+unresolved+' รายการ'};
  }finally{lock.releaseLock();}
}

function apiAdminSetGroupLeader(token,groupId,leaderUserId,note){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const gid=String(groupId||'').trim();
  const uid=String(leaderUserId||'').trim();
  if(!gid) throw new Error('ไม่พบรหัสกลุ่มวิจัย');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===gid&&g.STATUS==='ACTIVE');
    if(!group) throw new Error('ไม่พบกลุ่มวิจัยที่ใช้งานอยู่');
    const members=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===gid&&m.STATUS==='ACTIVE');
    let newLeader='';
    if(uid){
      const activeStudentUsers=readObjectsFresh_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE');
      const user=activeStudentUsers.find(u=>String(u.USER_ID)===uid);
      if(!user) throw new Error('บัญชีหัวหน้ากลุ่มไม่อยู่ในสถานะใช้งาน');
      const sid=normalizeStudentId_(user.STUDENT_ID);
      const member=members.find(m=>normalizeStudentId_(m.STUDENT_ID)===sid && (!String(m.USER_ID||'').trim() || String(m.USER_ID).trim()===uid));
      if(!member) throw new Error('หัวหน้ากลุ่มต้องเป็นสมาชิกที่ยังอยู่ในกลุ่มนี้ และรหัสนักศึกษาต้องตรงกับบัญชี');
      // Repair the membership link atomically when the student's active account is uniquely identified.
      if(!String(member.USER_ID||'').trim()){
        const memberSheet=sheet_('GROUP_MEMBERS');
        const memberHeaders=memberSheet.getRange(1,1,1,memberSheet.getLastColumn()).getDisplayValues()[0];
        const userCol=memberHeaders.indexOf('USER_ID');
        if(userCol<0) throw new Error('ไม่พบคอลัมน์ USER_ID ใน GROUP_MEMBERS');
        memberSheet.getRange(member._row,userCol+1).setValue(uid);
      }
      newLeader=uid;
    }
    const oldLeader=String(group.GROUP_LEADER_USER_ID||'');
    if(oldLeader===newLeader) return {ok:true,message:newLeader?'หัวหน้ากลุ่มไม่มีการเปลี่ยนแปลง':'กลุ่มนี้ยังไม่ได้กำหนดหัวหน้ากลุ่ม'};
    const sh=sheet_('RESEARCH_GROUPS');
    const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
    const col=headers.indexOf('GROUP_LEADER_USER_ID');
    if(col<0) throw new Error('ยังไม่พบคอลัมน์ GROUP_LEADER_USER_ID กรุณารัน migration ก่อน');
    sh.getRange(group._row,col+1).setValue(newLeader);
    const hist={HISTORY_ID:Utilities.getUuid(),GROUP_ID:gid,OLD_LEADER_USER_ID:oldLeader,NEW_LEADER_USER_ID:newLeader,ACTION_BY:ctx.user.USER_ID,ACTION_AT:new Date(),NOTE:String(note||'').trim()};
    appendObject_('GROUP_LEADER_HISTORY',hist);
    logSystem_(newLeader?'GROUP_LEADER_ASSIGNED':'GROUP_LEADER_UNASSIGNED','GROUP',gid,{oldLeaderUserId:oldLeader,newLeaderUserId:newLeader,note:String(note||'').trim()},ctx.user.USER_ID);
    SpreadsheetApp.flush();
    return {ok:true,message:newLeader?'กำหนดหัวหน้ากลุ่มเรียบร้อยแล้ว':'ยกเลิกการกำหนดหัวหน้ากลุ่มแล้ว'};
  }finally{lock.releaseLock();}
}

function apiAdminRemoveGroupMember(token,membershipId){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const row=readObjects_('GROUP_MEMBERS').find(m=>m.MEMBERSHIP_ID===membershipId&&m.STATUS==='ACTIVE');
  if(!row) throw new Error('ไม่พบสมาชิกที่ต้องการนำออก');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    sheet_('GROUP_MEMBERS').getRange(row._row,5).setValue('REMOVED');
    sheet_('GROUP_MEMBERS').getRange(row._row,7).setValue(new Date());
    const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===String(row.GROUP_ID));
    if(group&&String(group.GROUP_LEADER_USER_ID||'')===String(row.USER_ID||'')){
      const gs=sheet_('RESEARCH_GROUPS'), headers=gs.getRange(1,1,1,gs.getLastColumn()).getDisplayValues()[0], col=headers.indexOf('GROUP_LEADER_USER_ID');
      if(col>=0)gs.getRange(group._row,col+1).setValue('');
      appendObject_('GROUP_LEADER_HISTORY',{HISTORY_ID:Utilities.getUuid(),GROUP_ID:row.GROUP_ID,OLD_LEADER_USER_ID:row.USER_ID||'',NEW_LEADER_USER_ID:'',ACTION_BY:ctx.user.USER_ID,ACTION_AT:new Date(),NOTE:'ยกเลิกหัวหน้ากลุ่มเนื่องจากถูกนำออกจากกลุ่ม'});
    }
    logSystem_('GROUP_MEMBER_REMOVED','GROUP',row.GROUP_ID,{studentId:row.STUDENT_ID},ctx.user.USER_ID);
  }finally{lock.releaseLock();}
  return {ok:true,message:'นำสมาชิกออกจากกลุ่มแล้ว โดยเก็บประวัติเดิมไว้'};
}

function apiAdminArchiveGroup(token,groupId){
  const ctx=requireSession_(token,[ROLE.ADMIN]);
  const row=readObjects_('RESEARCH_GROUPS').find(g=>g.GROUP_ID===groupId&&g.STATUS==='ACTIVE');
  if(!row) throw new Error('ไม่พบกลุ่มวิจัย');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    sheet_('RESEARCH_GROUPS').getRange(row._row,5).setValue('ARCHIVED');
    sheet_('RESEARCH_GROUPS').getRange(row._row,8).setValue(new Date());
    const memberSheet=sheet_('GROUP_MEMBERS');
    readObjects_('GROUP_MEMBERS').filter(m=>m.GROUP_ID===groupId&&m.STATUS==='ACTIVE').forEach(m=>{memberSheet.getRange(m._row,5).setValue('REMOVED');memberSheet.getRange(m._row,7).setValue(new Date());});
    const assignmentSheet=sheet_('ADVISOR_ASSIGNMENTS');
    readObjects_('ADVISOR_ASSIGNMENTS').filter(x=>x.GROUP_ID===groupId&&['APPROVED','PENDING'].includes(x.STATUS)).forEach(x=>assignmentSheet.getRange(x._row,4).setValue('REPLACED'));
    logSystem_('RESEARCH_GROUP_ARCHIVED','GROUP',groupId,{},ctx.user.USER_ID);
  }finally{lock.releaseLock();}
  return {ok:true,message:'เก็บกลุ่มเข้าคลังแล้ว ข้อมูลสมาชิกและประวัติยังคงอยู่'};
}

// Student-led group creation and membership. A student can belong to one active group only.
function apiGetStudentWorkspace(token){
  const ctx=requireSession_(token,[ROLE.STUDENT]);
  const user=readObjectsFresh_('SYS_USERS').find(u=>String(u.USER_ID)===String(ctx.user.USER_ID)&&u.STATUS==='ACTIVE');
  const userId=String(ctx.user.USER_ID||'');
  const studentId=normalizeStudentId_(user&&user.STUDENT_ID!==undefined?user.STUDENT_ID:ctx.user.STUDENT_ID);
  const members=readObjectsFresh_('GROUP_MEMBERS');
  // Prefer the immutable account link; fall back to the roster ID for memberships created before registration.
  let membership=members.find(m=>String(m.USER_ID||'')===userId&&m.STATUS==='ACTIVE');
  if(!membership&&studentId) membership=members.find(m=>normalizeStudentId_(m.STUDENT_ID)===studentId&&m.STATUS==='ACTIVE');
  // Self-heal the account link only when the student ID match is exact and unique.
  if(membership&&String(membership.USER_ID||'')!==userId){
    const matches=readObjectsFresh_('SYS_USERS').filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE'&&normalizeStudentId_(u.STUDENT_ID)===normalizeStudentId_(membership.STUDENT_ID));
    if(matches.length===1&&String(matches[0].USER_ID)===userId){
      sheet_('GROUP_MEMBERS').getRange(membership._row,4).setValue(userId);
      membership.USER_ID=userId;
      logSystem_('GROUP_MEMBER_ACCOUNT_LINKED','GROUP',membership.GROUP_ID,{studentId:String(membership.STUDENT_ID)},userId);
    }
  }
  const users=readObjectsFresh_('SYS_USERS');
  const advisors=users.filter(u=>u.ROLE_ID===ROLE.ADVISOR&&u.STATUS==='ACTIVE').map(u=>({userId:u.USER_ID,name:u.DISPLAY_NAME,email:u.EMAIL}));
  if(!membership) return {group:null,advisors,roster:readObjectsFresh_('STUDENTS').filter(s=>String(s.IS_ACTIVE).toUpperCase()!=='FALSE').map(s=>({studentId:String(s.STUDENT_ID),name:String(s.FULL_NAME||'')}))};
  const group=readObjectsFresh_('RESEARCH_GROUPS').find(g=>String(g.GROUP_ID)===String(membership.GROUP_ID)&&g.STATUS==='ACTIVE');
  if(!group) return {group:null,advisors,roster:[],message:'พบประวัติสมาชิก แต่กลุ่มไม่ได้อยู่ในสถานะใช้งาน กรุณาติดต่อ Admin'};
  const allMembers=members.filter(m=>String(m.GROUP_ID)===String(membership.GROUP_ID)&&m.STATUS==='ACTIVE');
  const students=readObjectsFresh_('STUDENTS');
  const roster=allMembers.map(m=>{const st=students.find(x=>normalizeStudentId_(x.STUDENT_ID)===normalizeStudentId_(m.STUDENT_ID));return {studentId:String(m.STUDENT_ID),name:st?String(st.FULL_NAME||''):String(m.STUDENT_ID),isMe:String(m.USER_ID||'')===userId||normalizeStudentId_(m.STUDENT_ID)===studentId};});
  const assignments=readObjectsFresh_('ADVISOR_ASSIGNMENTS').filter(a=>String(a.GROUP_ID)===String(membership.GROUP_ID));
  const advisor=assignments.find(a=>a.STATUS==='APPROVED'), pending=assignments.find(a=>a.STATUS==='PENDING');
  const advisorUser=advisor&&users.find(u=>u.USER_ID===advisor.ADVISOR_USER_ID);
  const pendingUser=pending&&users.find(u=>u.USER_ID===pending.ADVISOR_USER_ID);
  const advisorInvite=readObjectsFresh_('ADVISOR_INVITATIONS').filter(x=>String(x.GROUP_ID)===String(membership.GROUP_ID)).sort((a,b)=>new Date(b.CREATED_AT)-new Date(a.CREATED_AT))[0]||null;
  const assignedIds=new Set(members.filter(x=>x.STATUS==='ACTIVE').map(x=>normalizeStudentId_(x.STUDENT_ID)));
  const registeredIds=new Set(users.filter(u=>u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE').map(u=>normalizeStudentId_(u.STUDENT_ID)));
  const availableRoster=students.filter(st=>String(st.IS_ACTIVE).toUpperCase()!=='FALSE'&&registeredIds.has(normalizeStudentId_(st.STUDENT_ID))&&!assignedIds.has(normalizeStudentId_(st.STUDENT_ID))).map(st=>({studentId:String(st.STUDENT_ID),name:String(st.FULL_NAME||'')}));
  const designatedLeader=String(group.GROUP_LEADER_USER_ID||'');
  const leaderAssigned=!!designatedLeader&&allMembers.some(m=>String(m.USER_ID||'')===designatedLeader);
  const ethics=readObjectsFresh_('ETHICS_TRACKING').find(x=>String(x.GROUP_ID)===String(group.GROUP_ID));
  const ethicsSummary=ethics?{plan:ethics.ETHICS_PLAN,planDueWeek:ethics.ETHICS_PLAN_DUE_WEEK,submissionStatus:ethics.ETHICS_PLAN==='DURING_COURSE'?ethics.SUBMISSION_STATUS:'',approvalStatus:ethics.ETHICS_PLAN==='DURING_COURSE'?ethics.REC_APPROVAL_STATUS:'',approvalDate:ethics.ETHICS_PLAN==='DURING_COURSE'&&ethics.REC_APPROVAL_DATE?formatDateOnly_(ethics.REC_APPROVAL_DATE):'',reviewType:ethics.REVIEW_TYPE}:null;
  return sanitizeForClient_({group:{groupId:group.GROUP_ID,groupName:group.GROUP_NAME,topicTh:group.TOPIC_TITLE_TH,createdBy:group.CREATED_BY,isLeader:leaderAssigned&&designatedLeader===userId,leaderAssigned,leaderUserId:leaderAssigned?designatedLeader:'',members:roster,advisor:advisorUser?advisorUser.DISPLAY_NAME:'',pendingAdvisor:pendingUser?pendingUser.DISPLAY_NAME:'',advisorInvite:advisorInvite?{name:advisorInvite.ADVISOR_NAME,email:advisorInvite.ADVISOR_EMAIL,status:advisorInvite.STATUS}:null},ethicsSummary,advisors:[],roster:availableRoster});
}

function apiStudentCreateGroup(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);payload=payload||{};
  if(readObjects_('GROUP_MEMBERS').some(m=>(String(m.USER_ID||'')===String(ctx.user.USER_ID)||normalizeStudentId_(m.STUDENT_ID)===normalizeStudentId_(ctx.user.STUDENT_ID))&&m.STATUS==='ACTIVE')) throw new Error('คุณอยู่ในกลุ่มแล้ว');
  const name=String(payload.groupName||'').trim();if(!name)throw new Error('กรุณาระบุชื่อกลุ่ม');if(name.length>100)throw new Error('ชื่อกลุ่มต้องไม่เกิน 100 ตัวอักษร');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    if(readObjects_('RESEARCH_GROUPS').some(g=>g.STATUS==='ACTIVE'&&String(g.GROUP_NAME).trim().toLowerCase()===name.toLowerCase()))throw new Error('ชื่อกลุ่มนี้มีแล้ว กรุณาใช้ชื่ออื่น');
    const id=Utilities.getUuid(),now=new Date();
    appendObject_('RESEARCH_GROUPS',{GROUP_ID:id,GROUP_NAME:name,TOPIC_TITLE_TH:String(payload.topicTh||''),TOPIC_TITLE_EN:'',STATUS:'ACTIVE',CREATED_BY:ctx.user.USER_ID,CREATED_AT:now,UPDATED_AT:now});
    addStudentToGroup_(id,ctx.user.STUDENT_ID,ctx.user.USER_ID,ctx.user.USER_ID);
    logSystem_('STUDENT_GROUP_CREATED','GROUP',id,{},ctx.user.USER_ID);
    return {ok:true,message:'สร้างกลุ่มและเพิ่มคุณเป็นสมาชิกคนแรกแล้ว'};
  }finally{lock.releaseLock();}
}

function apiStudentAddGroupMember(token,studentId){
  const ctx=requireSession_(token,[ROLE.STUDENT]);
  const me=readObjects_('GROUP_MEMBERS').find(m=>(String(m.USER_ID||'')===String(ctx.user.USER_ID)||normalizeStudentId_(m.STUDENT_ID)===normalizeStudentId_(ctx.user.STUDENT_ID))&&m.STATUS==='ACTIVE');
  if(!me)throw new Error('กรุณาสร้างกลุ่มก่อน');
  const group=readObjects_('RESEARCH_GROUPS').find(g=>g.GROUP_ID===me.GROUP_ID&&g.STATUS==='ACTIVE');
  if(!group||String(group.GROUP_LEADER_USER_ID||'')!==String(ctx.user.USER_ID))throw new Error('เฉพาะหัวหน้ากลุ่มที่ Admin กำหนดเท่านั้นที่เพิ่มสมาชิกได้');
  const target=readObjects_('SYS_USERS').find(u=>String(u.STUDENT_ID)===String(studentId)&&u.ROLE_ID===ROLE.STUDENT&&u.STATUS==='ACTIVE');
  if(!target)throw new Error('นักศึกษาที่เลือกยังไม่ได้ลงทะเบียนหรือบัญชีไม่ได้เปิดใช้งาน');
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{return addStudentToGroup_(me.GROUP_ID,String(studentId),target.USER_ID,ctx.user.USER_ID);}
  finally{lock.releaseLock();}
}
