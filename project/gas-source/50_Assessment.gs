
function apiAdminSetAssessmentWindow(token,type,isOpen){
  const ctx=requireSession_(token,[ROLE.ADMIN]);if(isOpen)assertGradeEditable_(); if(!['A4','A5'].includes(type)) throw new Error('ประเภทการประเมินไม่ถูกต้อง');
  setAssessmentSetting_('WINDOW_'+type,isOpen?'OPEN':'CLOSED',ctx.user.USER_ID);
  logSystem_('ASSESSMENT_WINDOW_CHANGED','ASSESSMENT',type,{status:isOpen?'OPEN':'CLOSED'},ctx.user.USER_ID); return {ok:true,message:(isOpen?'เปิด':'ปิด')+'การประเมิน '+type+' แล้ว'};
}
function apiAdvisorSaveA4(token,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN,ROLE.ADVISOR]);assertGradeEditable_(); payload=payload||{}; const groupId=String(payload.groupId||''); assertGroupAccess_(ctx,groupId);
  if(ctx.user.ROLE_ID===ROLE.ADVISOR && assessmentSettingsFresh_().WINDOW_A4!=='OPEN') throw new Error('Admin ยังไม่ได้เปิดช่วงประเมิน A4');
  const groupScore=Number(payload.groupScore); if(!Number.isFinite(groupScore)||groupScore<0||groupScore>10) throw new Error('คะแนน A4 ระดับกลุ่มต้องอยู่ระหว่าง 0–10');
  const members=readObjects_('GROUP_MEMBERS').filter(m=>m.GROUP_ID===groupId&&m.STATUS==='ACTIVE'); const individual=payload.individualScores||{};
  const validated=members.map(m=>{const v=Number(individual[String(m.STUDENT_ID)]);if(!Number.isFinite(v)||v<0||v>10)throw new Error('กรุณากรอกคะแนน A4 รายบุคคล 0–10 ให้ครบ: '+m.STUDENT_ID);return {studentId:m.STUDENT_ID,score:v};});
  const lock=LockService.getScriptLock(); lock.waitLock(60000);
  try{
    const oldGroup=readObjectsFresh_('GROUP_SCORES').find(x=>String(x.GROUP_ID)===groupId)||{};
    const oldIndividuals=readObjectsFresh_('INDIVIDUAL_SCORES').filter(x=>members.some(m=>String(m.STUDENT_ID)===String(x.STUDENT_ID))).map(x=>({studentId:x.STUDENT_ID,score:x.A4_INDIVIDUAL_SCORE}));
    const before={A4_GROUP_SCORE:oldGroup.A4_GROUP_SCORE??'',individual:oldIndividuals};
    upsertGroupScore_(groupId,{A4_GROUP_SCORE:groupScore,A4_ADVISOR_USER_ID:ctx.user.USER_ID},ctx.user.USER_ID);
    validated.forEach(x=>{upsertIndividualScore_(x.studentId,groupId,{A4_INDIVIDUAL_SCORE:x.score},ctx.user.USER_ID);});
    appendObject_('GROUP_SCORE_AUDIT',{AUDIT_ID:Utilities.getUuid(),GROUP_ID:groupId,BEFORE_JSON:JSON.stringify(before),AFTER_JSON:JSON.stringify({A4_GROUP_SCORE:groupScore,individual:validated}),REASON:'Advisor A4 assessment update',ACTOR_USER_ID:ctx.user.USER_ID,CREATED_AT:new Date()});
    logSystem_('A4_SCORES_SAVED','GROUP',groupId,{before,after:{groupScore,individual:validated},memberCount:members.length},ctx.user.USER_ID); return {ok:true,message:'บันทึก A4 ระดับกลุ่มและรายบุคคลแล้ว'};
  }finally{lock.releaseLock();}
}
function apiGetPeerTargets(token){
  const ctx=requireSession_(token,[ROLE.STUDENT]);
  if(assessmentSettings_().WINDOW_A5!=='OPEN') throw new Error('Admin ยังไม่ได้เปิดช่วงประเมินเพื่อน A5');
  const me=readObjects_('GROUP_MEMBERS').find(m=>(m.USER_ID===ctx.user.USER_ID||String(m.STUDENT_ID)===String(ctx.user.STUDENT_ID))&&m.STATUS==='ACTIVE');
  if(!me) throw new Error('ยังไม่ได้อยู่ในกลุ่มวิจัย');
  const members=readObjects_('GROUP_MEMBERS').filter(m=>m.GROUP_ID===me.GROUP_ID&&m.STATUS==='ACTIVE'&&String(m.STUDENT_ID)!==String(me.STUDENT_ID));
  const peers=findObjectsByColumnValue_('PEER_ASSESSMENTS','GROUP_ID',me.GROUP_ID).filter(p=>String(p.EVALUATOR_STUDENT_ID)===String(me.STUDENT_ID));
  return {groupId:me.GROUP_ID,evaluatorStudentId:String(me.STUDENT_ID),targets:members.map(m=>{const p=peers.find(x=>String(x.EVALUATEE_STUDENT_ID)===String(m.STUDENT_ID));return {studentId:String(m.STUDENT_ID),submitted:!!p,scores:p?{responsibility:p.RESPONSIBILITY,deadline:p.DEADLINE,workQuality:p.WORK_QUALITY,collaboration:p.COLLABORATION,communication:p.COMMUNICATION}:null};})};
}
function apiSubmitPeerAssessment(token,payload){
  const ctx=requireSession_(token,[ROLE.STUDENT]);assertGradeEditable_();payload=payload||{};
  if(assessmentSettings_().WINDOW_A5!=='OPEN')throw new Error('Admin ยังไม่ได้เปิดช่วงประเมินเพื่อน A5');
  const me=readObjects_('GROUP_MEMBERS').find(m=>(m.USER_ID===ctx.user.USER_ID||String(m.STUDENT_ID)===String(ctx.user.STUDENT_ID))&&m.STATUS==='ACTIVE');
  if(!me)throw new Error('ยังไม่ได้เป็นสมาชิกกลุ่มวิจัย');
  const groupId=me.GROUP_ID,target=String(payload.evaluateeStudentId||'');
  if(target===String(me.STUDENT_ID))throw new Error('ไม่สามารถประเมินตนเองได้');
  const targetMember=readObjects_('GROUP_MEMBERS').find(m=>m.GROUP_ID===groupId&&String(m.STUDENT_ID)===target&&m.STATUS==='ACTIVE');
  if(!targetMember)throw new Error('เลือกสมาชิกในกลุ่มเดียวกันเท่านั้น');
  const scores=payload.scores||{},keys=['responsibility','deadline','workQuality','collaboration','communication'];
  keys.forEach(k=>{const n=Number(scores[k]);if(!Number.isInteger(n)||n<0||n>2)throw new Error('คะแนนแต่ละด้านต้องเป็นจำนวนเต็ม 0–2');});
  const lock=LockService.getScriptLock();lock.waitLock(60000);
  try{
    // Recheck the assessment window under the lock so a closed window cannot accept a late submission.
    if(assessmentSettings_().WINDOW_A5!=='OPEN')throw new Error('Admin ปิดช่วงประเมินเพื่อน A5 แล้ว');
    const sh=sheet_('PEER_ASSESSMENTS');
    const old=findObjectsByColumnValue_('PEER_ASSESSMENTS','GROUP_ID',groupId).find(r=>String(r.EVALUATOR_STUDENT_ID)===String(me.STUDENT_ID)&&String(r.EVALUATEE_STUDENT_ID)===target);
    const row=[old?old.PEER_ID:Utilities.getUuid(),groupId,String(me.STUDENT_ID),target,Number(scores.responsibility),Number(scores.deadline),Number(scores.workQuality),Number(scores.collaboration),Number(scores.communication),new Date()];
    if(old)sh.getRange(old._row,1,1,row.length).setValues([row]);else sh.appendRow(row);
    invalidateReadCache_('PEER_ASSESSMENTS');
    logSystem_('PEER_ASSESSMENT_SUBMITTED','STUDENT',me.STUDENT_ID,{evaluatee:target},ctx.user.USER_ID);
    return {ok:true,message:'ส่งแบบประเมินเพื่อนแล้ว'};
  }finally{lock.releaseLock();}
}

function apiAdminSaveCoreScores(token,payload){
  const ctx=requireSession_(token,[ROLE.ADMIN]);assertGradeEditable_(); payload=payload||{}; const groupId=String(payload.groupId||'');
  if(!readObjects_('RESEARCH_GROUPS').some(g=>g.GROUP_ID===groupId&&g.STATUS==='ACTIVE')) throw new Error('ไม่พบกลุ่มวิจัย');
  const vals={}; [['A1',10],['A2',30],['A3',20]].forEach(([k,max])=>{if(payload[k]===undefined||String(payload[k]).trim()==='')throw new Error('กรุณากรอกคะแนน '+k);const v=Number(payload[k]);if(!Number.isFinite(v)||v<0||v>max)throw new Error(k+' ต้องอยู่ระหว่าง 0–'+max);vals[k+'_SCORE']=v;});
  const reason=String(payload.reason||'').trim();if(reason.length<5)throw new Error('กรุณาระบุเหตุผลการบันทึก/แก้ไขคะแนนอย่างน้อย 5 ตัวอักษร');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const current=readObjectsFresh_('GROUP_SCORES').find(r=>String(r.GROUP_ID)===groupId)||{};
    const before={A1_SCORE:current.A1_SCORE??'',A2_SCORE:current.A2_SCORE??'',A3_SCORE:current.A3_SCORE??''};
    upsertGroupScore_(groupId,vals,ctx.user.USER_ID);
    appendObject_('GROUP_SCORE_AUDIT',{AUDIT_ID:Utilities.getUuid(),GROUP_ID:groupId,BEFORE_JSON:JSON.stringify(before),AFTER_JSON:JSON.stringify(vals),REASON:reason,ACTOR_USER_ID:ctx.user.USER_ID,CREATED_AT:new Date()});
    logSystem_('CORE_SCORES_SAVED','GROUP',groupId,{before,after:vals,reason},ctx.user.USER_ID);
  }finally{lock.releaseLock();}
  return {ok:true,message:'บันทึกคะแนน A1–A3 แล้ว'};
}
function apiGetAssessmentReport(token){
  const ctx=requireSession_(token,null); const role=ctx.user.ROLE_ID;
  const allGroups=readObjectsFresh_('RESEARCH_GROUPS'), allMembers=readObjectsFresh_('GROUP_MEMBERS'), assignments=readObjectsFresh_('ADVISOR_ASSIGNMENTS');
  let groups=allGroups.filter(g=>String(g.STATUS||'').trim().toUpperCase()==='ACTIVE');
  if(role===ROLE.ADVISOR){
    const ids=new Set(getAdvisorAssignedGroups_(ctx.user.USER_ID).map(g=>String(g.groupId)));
    groups=groups.filter(g=>ids.has(String(g.GROUP_ID)));
  }
  let studentMember=null;
  if(role===ROLE.STUDENT){
    studentMember=allMembers.find(x=>(String(x.USER_ID||'')===String(ctx.user.USER_ID||'')||String(x.STUDENT_ID||'')===String(ctx.user.STUDENT_ID||''))&&String(x.STATUS||'').trim().toUpperCase()==='ACTIVE');
    groups=groups.filter(g=>studentMember&&String(g.GROUP_ID)===String(studentMember.GROUP_ID));
  }
  const gs=readObjectsFresh_('GROUP_SCORES'), individual=readObjectsFresh_('INDIVIDUAL_SCORES'), meetings=readObjectsFresh_('MEETING_RECORDS'), peers=readObjectsFresh_('PEER_ASSESSMENTS'), students=readObjectsFresh_('STUDENTS'), users=readObjectsFresh_('SYS_USERS');
  const releaseStatus=gradeReleaseStatus_(),studentCanSeeScores=role!=='STUDENT'||releaseStatus==='RELEASED';
  return sanitizeForClient_(groups.map(g=>{
    const ms=allMembers.filter(m=>String(m.GROUP_ID)===String(g.GROUP_ID)&&String(m.STATUS||'').trim().toUpperCase()==='ACTIVE');
    const assignment=assignments.find(x=>String(x.GROUP_ID)===String(g.GROUP_ID)&&String(x.STATUS||'').trim().toUpperCase()==='APPROVED');
    const advisor=assignment&&users.find(x=>x.USER_ID===assignment.ADVISOR_USER_ID);
    const groupScore=studentCanSeeScores?(gs.find(x=>x.GROUP_ID===g.GROUP_ID)||{}):{};
    let outputMembers=ms;
    if(role===ROLE.STUDENT) outputMembers=ms.filter(m=>String(m.STUDENT_ID)===String(studentMember.STUDENT_ID));
    return {groupId:g.GROUP_ID,groupName:g.GROUP_NAME,topicTh:g.TOPIC_TITLE_TH,advisor:advisor?advisor.DISPLAY_NAME:'',groupScore,gradeReleaseStatus:releaseStatus,scoresReleased:studentCanSeeScores, members:outputMembers.map(m=>{
      const person=individual.find(x=>String(x.STUDENT_ID)===String(m.STUDENT_ID))||{};
      const meetingRowsRaw=meetings.filter(x=>x.GROUP_ID===g.GROUP_ID&&String(x.STUDENT_ID)===String(m.STUDENT_ID));
      const meetingByNo=new Map();meetingRowsRaw.forEach(x=>{const key=String(x.MEETING_NO);const old=meetingByNo.get(key);if(!old||new Date(x.UPDATED_AT||0)>new Date(old.UPDATED_AT||0))meetingByNo.set(key,x);});const meetingRows=[...meetingByNo.values()];
      const attendance=meetingRows.filter(x=>x.ATTENDANCE_STATUS==='PRESENT').length;
      const peerRows=peers.filter(x=>x.GROUP_ID===g.GROUP_ID&&String(x.EVALUATEE_STUDENT_ID)===String(m.STUDENT_ID));
      const peerAvg=peerRows.length?peerRows.reduce((sum,x)=>sum+Number(x.RESPONSIBILITY)+Number(x.DEADLINE)+Number(x.WORK_QUALITY)+Number(x.COLLABORATION)+Number(x.COMMUNICATION),0)/peerRows.length:null;
      const a5Complete=peerRows.length>=Math.max(0,ms.length-1);
      const a6=meetingRows.length>=7?Math.round((attendance/7*10)*100)/100:null;
      // Final total is intentionally not calculated until A1-A3 group/individual allocation is formally approved.
      const total=null;
      const student=students.find(x=>String(x.STUDENT_ID)===String(m.STUDENT_ID));
      const meetingStatuses={};
      meetingRows.forEach(x=>meetingStatuses[String(x.MEETING_NO)]=x.ATTENDANCE_STATUS);
      const a4=person.A4_INDIVIDUAL_SCORE;const groupComplete=['A1_SCORE','A2_SCORE','A3_SCORE','A4_GROUP_SCORE'].every(k=>groupScore[k]!==''&&groupScore[k]!==null&&groupScore[k]!==undefined);const complete=studentCanSeeScores&&groupComplete&&a4!==''&&a4!==null&&a4!==undefined&&a5Complete&&meetingRows.length>=7;const suppressA5=role!=='ADMIN'&&ms.length<3;
      return {studentId:String(m.STUDENT_ID),studentName:student?student.FULL_NAME:'',a4Individual:studentCanSeeScores?a4:null,a5:studentCanSeeScores&&!suppressA5&&a5Complete?peerAvg:null,a5Responses:studentCanSeeScores&&!suppressA5?peerRows.length:null,a5PrivacySuppressed:suppressA5,a6:studentCanSeeScores?a6:null,attendance,total,meetingStatuses,gradeCompleteness:studentCanSeeScores?(complete?'COMPLETE':'INCOMPLETE'):'HIDDEN',gradeReleaseStatus:releaseStatus};
    })};
  }));
}

/* ---------------- Student research workflow APIs (v0.3.12) ---------------- */
function apiGetStudentResearchData(token,requestedGroupId){
  const ctx=requireSession_(token,[ROLE.STUDENT,ROLE.ADVISOR,ROLE.ADMIN]);
  let groupId='';
  if(ctx.user.ROLE_ID===ROLE.STUDENT){
    const m=readObjects_('GROUP_MEMBERS').find(x=>(String(x.USER_ID)===String(ctx.user.USER_ID)||String(x.STUDENT_ID)===String(ctx.user.STUDENT_ID))&&x.STATUS==='ACTIVE');
    if(!m)return {group:null,topics:[],files:[],progress:[],feedback:[],milestones:studentMilestonePlan_()};
    groupId=m.GROUP_ID;
  } else if(ctx.user.ROLE_ID===ROLE.ADVISOR){
    const assigned=getAdvisorAssignedGroups_(ctx.user.USER_ID);
    groupId=String(requestedGroupId|| (assigned.length?assigned[0].groupId:''));
    if(!groupId)return {group:null,topics:[],files:[],progress:[],feedback:[],milestones:studentMilestonePlan_()};
  } else {
    groupId=String(requestedGroupId||'');
  }
  if(!groupId) throw new Error('กรุณาระบุกลุ่มผ่านพื้นที่ทำงานหรือรายการกลุ่มที่ได้รับมอบหมาย');
  assertGroupAccess_(ctx,groupId);
  const group=readObjectsFresh_('RESEARCH_GROUPS').find(x=>String(x.GROUP_ID)===String(groupId)&&String(x.STATUS||'').trim().toUpperCase()==='ACTIVE');
  const groupExtensions=readObjectsFresh_('GROUP_DEADLINE_EXTENSIONS');
  const progressWeeks=progressWeekSettings_().map(w=>{const ext=groupExtensions.filter(x=>String(x.GROUP_ID)===String(groupId)&&Number(x.WEEK_NO)===Number(w.week)&&x.STATUS==='APPROVED').sort((a,b)=>new Date(b.APPROVED_AT)-new Date(a.APPROVED_AT))[0];return {...w,effectiveDueDate:ext?formatDateOnly_(ext.NEW_DUE_DATE):w.dueDate};});
  const activeGroupMembers=readObjectsFresh_('GROUP_MEMBERS').filter(m=>String(m.GROUP_ID)===String(groupId)&&m.STATUS==='ACTIVE');
  const groupLeader=String(group.GROUP_LEADER_USER_ID||'');
  const leaderIsActiveMember=!!groupLeader&&activeGroupMembers.some(m=>String(m.USER_ID)===groupLeader);
  const effectiveLeader=leaderIsActiveMember?groupLeader:'';
  return sanitizeForClient_({
    group:{groupId,groupName:group.GROUP_NAME,topicTh:group.TOPIC_TITLE_TH||'',topicEn:group.TOPIC_TITLE_EN||'',isLeader:!!effectiveLeader&&String(ctx.user.USER_ID)===effectiveLeader,leaderUserId:effectiveLeader,leaderAssigned:!!effectiveLeader,members:activeGroupMembers.map(m=>({studentId:m.STUDENT_ID,userId:m.USER_ID}))},
    topics:findObjectsByColumnValue_('RESEARCH_TOPIC_VERSIONS','GROUP_ID',groupId).sort((a,b)=>Number(b.VERSION_NO)-Number(a.VERSION_NO)).map(x=>({versionId:x.VERSION_ID,versionNo:x.VERSION_NO,titleTh:x.TITLE_TH,titleEn:x.TITLE_EN,problem:x.PROBLEM_STATEMENT,objectives:x.OBJECTIVES,significance:x.RESEARCH_SIGNIFICANCE,status:x.STATUS,reviewStatus:x.REVIEW_STATUS,submittedAt:x.SUBMITTED_AT,reviewComment:x.REVIEW_COMMENT})),
    files:findObjectsByColumnValue_('PROPOSAL_FILES','GROUP_ID',groupId).filter(x=>x.STATUS==='ACTIVE').sort((a,b)=>new Date(b.UPLOADED_AT)-new Date(a.UPLOADED_AT)).map(x=>({fileId:x.FILE_RECORD_ID,chapter:x.CHAPTER,fileName:x.FILE_NAME,url:x.DRIVE_URL,size:Number(x.FILE_SIZE)||0,uploadedAt:x.UPLOADED_AT,notes:x.NOTES})),
    progress:findObjectsByColumnValue_('PROGRESS_REPORTS','GROUP_ID',groupId).sort((a,b)=>Number(b.WEEK_NO)-Number(a.WEEK_NO)||new Date(b.SUBMITTED_AT||0)-new Date(a.SUBMITTED_AT||0)).map(x=>({reportId:x.REPORT_ID,weekNo:x.WEEK_NO,milestone:x.MILESTONE,workCompleted:x.WORK_COMPLETED,problems:x.PROBLEMS,nextActions:x.NEXT_ACTIONS,submittedAt:x.SUBMITTED_AT instanceof Date?x.SUBMITTED_AT.toISOString():String(x.SUBMITTED_AT||''),status:x.STATUS,reviewComment:x.REVIEW_COMMENT||'',timelinessStatus:x.TIMELINESS_STATUS||'',revisionDueAt:x.REVISION_DUE_AT||'',extensionId:x.EXTENSION_ID||''})),
    feedback:findObjectsByColumnValue_('ADVISOR_FEEDBACK','GROUP_ID',groupId).filter(x=>x.STATUS!=='DELETED').sort((a,b)=>new Date(b.CREATED_AT)-new Date(a.CREATED_AT)).map(x=>({feedbackId:x.FEEDBACK_ID,relatedType:x.RELATED_TYPE,relatedId:x.RELATED_ID,comment:x.COMMENT,createdBy:x.CREATED_BY,createdAt:x.CREATED_AT})),
    milestones:studentMilestonePlan_(),
    progressWeeks:progressWeeks,
    openProgressWeeks:progressWeeks.filter(w=>w.isOpen)
  });
}


/**
 * Advisor review queue: batch-load only the assigned groups' submitted research
 * content. Keeps the browser from issuing one research-data request per group.
 */
function apiGetAdvisorReviewQueue(token){
  const ctx=requireSession_(token,[ROLE.ADVISOR]);
  const groups=getAdvisorAssignedGroups_(ctx.user.USER_ID);
  if(!groups.length)return {groups:[]};
  const ids=new Set(groups.map(g=>String(g.groupId)));
  const topics=readObjectsFresh_('RESEARCH_TOPIC_VERSIONS').filter(x=>ids.has(String(x.GROUP_ID||'')));
  const files=readObjectsFresh_('PROPOSAL_FILES').filter(x=>ids.has(String(x.GROUP_ID||''))&&String(x.STATUS||'').toUpperCase()==='ACTIVE');
  const progress=readObjectsFresh_('PROGRESS_REPORTS').filter(x=>ids.has(String(x.GROUP_ID||'')));
  const feedback=readObjectsFresh_('ADVISOR_FEEDBACK').filter(x=>ids.has(String(x.GROUP_ID||''))&&String(x.STATUS||'').toUpperCase()!=='DELETED');
  const result=groups.map(g=>{
    const groupId=String(g.groupId);
    return {
      group:{groupId,groupName:g.groupName,topicTh:g.topicTh||'',topicEn:g.topicEn||''},
      topics:topics.filter(x=>String(x.GROUP_ID)===groupId).sort((a,b)=>Number(b.VERSION_NO||0)-Number(a.VERSION_NO||0)).map(x=>({versionId:x.VERSION_ID,versionNo:x.VERSION_NO,titleTh:x.TITLE_TH,titleEn:x.TITLE_EN,problem:x.PROBLEM_STATEMENT,objectives:x.OBJECTIVES,significance:x.RESEARCH_SIGNIFICANCE,status:x.STATUS,reviewStatus:x.REVIEW_STATUS,submittedAt:x.SUBMITTED_AT,reviewComment:x.REVIEW_COMMENT||''})),
      files:files.filter(x=>String(x.GROUP_ID)===groupId).sort((a,b)=>new Date(b.UPLOADED_AT||0)-new Date(a.UPLOADED_AT||0)).map(x=>({fileId:x.FILE_RECORD_ID,chapter:x.CHAPTER,fileName:x.FILE_NAME,url:x.DRIVE_URL,size:Number(x.FILE_SIZE)||0,uploadedAt:x.UPLOADED_AT,notes:x.NOTES})),
      progress:progress.filter(x=>String(x.GROUP_ID)===groupId).sort((a,b)=>Number(b.WEEK_NO||0)-Number(a.WEEK_NO||0)||new Date(b.SUBMITTED_AT||0)-new Date(a.SUBMITTED_AT||0)).map(x=>({reportId:x.REPORT_ID,weekNo:x.WEEK_NO,milestone:x.MILESTONE,workCompleted:x.WORK_COMPLETED,problems:x.PROBLEMS,nextActions:x.NEXT_ACTIONS,submittedAt:x.SUBMITTED_AT instanceof Date?x.SUBMITTED_AT.toISOString():String(x.SUBMITTED_AT||''),status:x.STATUS,reviewComment:x.REVIEW_COMMENT||'',timelinessStatus:x.TIMELINESS_STATUS||'',revisionDueAt:x.REVISION_DUE_AT||'',extensionId:x.EXTENSION_ID||''})),
      feedback:feedback.filter(x=>String(x.GROUP_ID)===groupId).sort((a,b)=>new Date(b.CREATED_AT||0)-new Date(a.CREATED_AT||0)).map(x=>({feedbackId:x.FEEDBACK_ID,relatedType:x.RELATED_TYPE,relatedId:x.RELATED_ID,comment:x.COMMENT,createdBy:x.CREATED_BY,createdAt:x.CREATED_AT}))
    };
  });
  return sanitizeForClient_({groups:result});
}
