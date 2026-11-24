# SPORT SCIENCE RESEARCH LAB — Project Status & Handover

> **เอกสารส่งมอบสถานะโครงการ (Living Handover Document)**  
> ปรับปรุงล่าสุด: 24 พฤศจิกายน 2026  
> Repository: `worrawutt-source/worrawutsportsci`  
> Branch: `main`

เอกสารนี้เป็นจุดเริ่มต้นสำหรับผู้พัฒนาหรือผู้ช่วย AI ที่เข้ามารับช่วงงานต่อ ให้อ่านเอกสารนี้ก่อนแก้ไขโค้ดทุกครั้ง และตรวจสอบ Source Code บน branch `main` อีกครั้งก่อนดำเนินการ เพราะสถานะในเอกสารอาจล้าหลังการเปลี่ยนแปลงล่าสุดได้

---

## 1. สถานะโดยสรุป

**Phase 1 รายการ 1–7: ผู้รับผิดชอบโครงการยอมรับแล้ว (Accepted for Real-world Use / Monitoring).**

ณ วันที่ปรับปรุงเอกสาร ผู้ใช้ระบุว่าส่วนที่ดำเนินการผ่านแล้ว และให้รอการใช้งานจริง หากพบปัญหาจึงกลับมาวิเคราะห์และแก้ไข ไม่ต้องเปิดประเด็นเดิมหรือปรับปรุงระบบเพิ่มเติมโดยไม่มีเหตุจำเป็น

แนวทางปัจจุบันคือ **Freeze การเปลี่ยนแปลงที่ไม่จำเป็น และเข้าสู่ช่วงติดตามปัญหาจากการใช้งาน (Operational Monitoring)**

- ไม่ปรับ Code.gs หรือ Frontend เพียงเพื่อปรับปรุงเชิงความสวยงามหรือ refactor โดยไม่มีเหตุจำเป็น
- ไม่เปลี่ยนโครงสร้างฐานข้อมูล (Database Schema) หรือแก้ไขข้อมูลเดิม
- เมื่อพบปัญหา ให้ทำซ้ำและเก็บหลักฐาน วิเคราะห์สาเหตุ เสนอแนวทางแก้ไข และประเมินผลกระทบก่อนลงมือ
- เมื่อได้รับอนุมัติให้แก้ไข ให้ใช้แนวทาง Minimal Change และบันทึกการเปลี่ยนแปลงเป็น Git commit
- ห้ามถือว่าการทดสอบเฉพาะ Source Code เท่ากับผ่าน UAT ในระบบที่ Deploy แล้ว

## 2. ข้อมูล Repository และโครงสร้างระบบ

Repository หลัก: [worrawutt-source/worrawutsportsci](https://github.com/worrawutt-source/worrawutsportsci)

โครงสร้างที่เกี่ยวข้อง:

- `project/gas-source/code.gs` — Backend หลักของ Google Apps Script และตัวโหลด Frontend จาก GitHub
- `project/gas-source/setup.gs` — เครื่องมือวินิจฉัยและส่วน setup เดิมที่ถูกจำกัดการทำงาน
- `project/frontend/Index.html` — โครงหน้าเว็บ
- `project/frontend/Client.html` — Client-side logic
- `project/frontend/Styles.html` — CSS และรูปแบบการแสดงผล
- `project/README.md` — ภาพรวมโครงสร้างและแนวทางทำงาน
- `project/gas-source/README.md` — แนวทางดูแล Source Code ฝั่ง Apps Script

สถาปัตยกรรมปัจจุบันแยก Backend ไว้ใน Google Apps Script และเก็บ Frontend ไว้ใน GitHub โดย Backend โหลด Frontend จาก **Immutable Commit SHA** ไม่ใช่จาก branch `main` โดยตรง

### Frontend Commit SHA ที่ Backend อ้างอิง

`ada41b9f2ce321d3f190ed092a1629c497ebeff0`

หากมีการแก้ไข Frontend และสร้าง commit ใหม่ ต้องปรับ SHA ที่ Backend อ้างอิงให้ตรงกับ commit ที่ต้องการใช้งาน การแก้ไข Frontend บน `main` อย่างเดียวไม่ได้ทำให้ Web App เปลี่ยนตามโดยอัตโนมัติ หาก Backend ยัง pin SHA เดิม

## 3. สถานะ Source Code ล่าสุดที่ตรวจสอบได้

| รายการ | สถานะ/ข้อมูล |
|---|---|
| Backend | `project/gas-source/code.gs` |
| Backend blob SHA ที่ตรวจสอบล่าสุด | `d94ff2e3b15c0656437a77d51c451ba43b435971` |
| Build string ในหัวไฟล์ | `0.4.0.2-MEETING-MONITORING-TEST` |
| Frontend pinned SHA | `ada41b9f2ce321d3f190ed092a1629c497ebeff0` |
| API functions ที่ตรวจนับได้ | 78 |
| ชื่อ API ซ้ำ | ไม่พบจากการตรวจครั้งล่าสุด |
| Frontend callApi ที่ไม่มี API รองรับ | ไม่พบจากการตรวจครั้งล่าสุด |

หมายเหตุ: Build string เป็นข้อความที่ระบุใน Source Code ไม่ใช่หลักฐานยืนยันว่า Deployment ที่กำลังเปิดใช้งานอยู่เป็น Build เดียวกัน ผู้รับช่วงต้องตรวจสอบ Apps Script Deployment ก่อนดำเนินการใด ๆ

## 4. รายการงานที่ดำเนินการแล้วใน Phase 1 (ข้อ 1–7)

การเปลี่ยนแปลงต่อไปนี้ได้ดำเนินการใน GitHub แล้ว:

1. **แก้ไขการบันทึกประวัติหัวหน้ากลุ่ม**  
   แก้ไขการเรียก `appendObject_()` ที่ผิดรูปแบบ 2 จุด ใน `apiAdminSetGroupLeader()` และ `apiAdminRemoveGroupMember()` เพื่อให้บันทึกลง `GROUP_LEADER_HISTORY` ด้วยรูปแบบที่ถูกต้อง

2. **จำกัด Diagnostic Wrapper สำหรับตรวจสอบคำเชิญอาจารย์**  
   เปลี่ยนชื่อฟังก์ชัน Wrapper ที่เปิดให้เรียกจากภายนอกเป็นฟังก์ชัน private (ลงท้ายด้วย underscore) เพื่อไม่ให้เรียกผ่าน Web App โดยตรงโดยไม่มีการควบคุมสิทธิ์

3. **จำกัดฟังก์ชันนำเข้าข้อมูลและ Migration**  
   เปลี่ยนชื่อฟังก์ชันนำเข้ารายชื่อนักศึกษาและฟังก์ชัน Migration ที่เป็นงานภายในให้เป็น private helper ได้แก่:
   - `importStudentRosterFromExcel_`
   - `migrateAdvisorMagicLinkSchema_`
   - `migrateAdvisorPasswordSetupSchema_`
   - `migrateMeetingFilesSchema_`
   - `migrateProgressWorkflowSchema_`
   - `migrateResearchTopicDraftSchema_`
   - `migrateCollaborativeWorkspaceSchema_`
   - `migrateResearchWorkflowSchema_`

4. **ตรวจสอบความสอดคล้องระหว่าง Frontend และ Backend**  
   ตรวจนับ API ได้ 78 รายการ ไม่พบชื่อ API ซ้ำ และไม่พบชื่อที่ Frontend เรียกผ่าน `callApi()` แต่ไม่มีฟังก์ชัน API รองรับ จากการตรวจครั้งล่าสุด

5. **ตรวจสอบ API ที่ไม่มี requireSession_()**  
   พบ 7 endpoints ซึ่งเป็นกลุ่ม Authentication/Onboarding ที่คาดหมาย ได้แก่:
   - `apiStartStudentRegistration`
   - `apiVerifyStudentRegistration`
   - `apiLogin`
   - `apiLogout`
   - `apiStartInvitedRegistration`
   - `apiVerifyInvitedRegistration`
   - `apiRequestAdvisorMagicLink`

6. **ตรวจสอบการจำกัดฟังก์ชันภายใน**  
   ไม่พบ Diagnostic Wrapper แบบ public และไม่พบชื่อฟังก์ชัน Manual Migration/Import เดิมที่ยังเปิดเป็น public จากการตรวจครั้งล่าสุด

7. **ตรวจสอบองค์ประกอบประกอบการทำงาน**  
   ตรวจพบ Schema ของ `GROUP_LEADER_HISTORY` และตรวจสอบว่า Frontend SHA ที่ Backend pin ไว้ตรงกับ SHA ที่กำหนดในสถานะโครงการ

### Git commits ที่เกี่ยวข้อง

- `0226f902682b8eba23ce101cc7a169ef70929b99` — Fix group leader history append calls
- `92ea9b7a7be8adc5ef0c1247fc652a23d0c9a121` — Restrict invitation diagnostics to Apps Script editor only
- `af4abe1b0ef12053c84b9225f29ca4e3a080ee9f` — Restrict manual migration and roster import helpers from public web invocation

รายการ commit ข้างต้นเป็นประวัติการเปลี่ยนแปลงที่เกี่ยวข้องกับ Phase 1 ไม่ใช่การยืนยันว่าเป็น commit ล่าสุดของ branch ในปัจจุบัน

## 5. ผลการตรวจสอบและขอบเขตของหลักฐาน

ผลตรวจจาก Source Code ในรอบล่าสุด:

- API count: 78
- ไม่พบชื่อ API ซ้ำ
- ไม่พบ Frontend `callApi()` ที่ไม่มี Backend API รองรับ
- API ที่ไม่มี `requireSession_()` มี 7 รายการ และเป็นกลุ่ม Authentication/Onboarding ที่ระบุไว้ข้างต้น
- ไม่พบ public diagnostic wrapper
- ไม่พบ public manual migration/import helper ชื่อเดิม
- พบ `GROUP_LEADER_HISTORY` ใน Schema
- Frontend SHA ใน Backend ตรงกับ SHA ที่กำหนด

**ข้อจำกัดที่ต้องทราบ:** การตรวจครั้งดังกล่าวไม่ได้ยืนยันการ Compile/Execute ใน Apps Script Runtime และไม่ได้ทำ UAT ใหม่ใน Deployment ที่ใช้งานจริง จึงไม่ควรอ้างว่าการตรวจ Source Code เป็นการรับรอง Runtime หรือ UAT ทั้งระบบ สถานะการยอมรับ Phase 1 เป็นการตัดสินใจของผู้รับผิดชอบโครงการตามผลการดำเนินงานและการพิจารณา ณ เวลานั้น

## 6. ข้อกำหนดด้านความปลอดภัยและการรักษาฐานข้อมูล

ข้อกำหนดเหล่านี้เป็นข้อห้ามสำคัญสำหรับผู้รับช่วง:

- ห้ามรัน `setup()`, `setupTestDatabase()`, `recoverAdminAccess()`, การ seed roles หรือ Migration ใด ๆ โดยไม่มีแผนและการอนุมัติแยกต่างหาก
- ห้ามล้าง สร้างใหม่ แทนที่ หรือปรับโครงสร้างฐานข้อมูลโดยพลการ
- ห้ามเปลี่ยน Script Properties เช่น `DB_ID` และ `APP_SECRET`
- ห้ามนำข้อมูลจริง ข้อมูลส่วนบุคคล รหัสผ่าน Session Token หรือ Secret ขึ้น GitHub
- ห้ามชี้ TEST Code ไปยัง Production Database
- ก่อนดำเนินการกับข้อมูล ต้องตรวจสอบ Environment และปลายทางของฐานข้อมูลให้ชัดเจน
- การเปลี่ยนแปลงที่มีความเสี่ยงต่อข้อมูลต้องมีแผนสำรองและได้รับอนุมัติก่อนเสมอ

## 7. แนวทางการทำงานของผู้พัฒนาที่เข้ามารับช่วง

ให้ดำเนินการตามลำดับต่อไปนี้:

1. อ่านเอกสารนี้ให้ครบ
2. อ่าน `project/README.md` และ `project/gas-source/README.md`
3. ตรวจสอบ branch, commit ล่าสุด และไฟล์ Source Code ปัจจุบันบน GitHub
4. ตรวจสอบ Apps Script Deployment และ Environment โดยไม่แก้ไขข้อมูล
5. ทำความเข้าใจปัญหาจากหลักฐาน เช่น ขั้นตอนที่ทำให้เกิดปัญหา ข้อความ Error เวลาเกิดเหตุ Role ที่ใช้งาน และผลลัพธ์ที่คาดหวัง
6. วิเคราะห์ Root Cause และระบุไฟล์/ฟังก์ชัน/ข้อมูลที่ได้รับผลกระทบ
7. เสนอแผนแก้ไขพร้อมประเมินความเสี่ยงและผลกระทบ รอการอนุมัติก่อนแก้ไข
8. เมื่ออนุมัติแล้ว จึงแก้ไขแบบ Minimal Change และตรวจสอบผลกระทบที่เกี่ยวข้อง
9. Commit การเปลี่ยนแปลงใน GitHub พร้อมข้อความที่สื่อความหมาย
10. ปรับปรุงเอกสารสถานะนี้ทุกครั้งที่มีการเปลี่ยนแปลงสำคัญ โดยบันทึกวันที่ รายละเอียด commit ผลการทดสอบ และข้อจำกัดที่ยังเหลือ

**ห้ามเริ่มต้นด้วยการเขียนระบบใหม่หรือ Refactor ขนาดใหญ่** ให้ถือ Source Code ปัจจุบันและข้อตกลงที่ผู้ใช้ยืนยันเป็น Baseline

## 8. ขั้นตอน Deploy ที่ต้องระมัดระวัง

แนวทางเฉพาะของโครงการที่ผู้ใช้ยืนยัน:

- Backend: หากมีการเปลี่ยนแปลง `.gs` ให้ส่งมอบไฟล์ `Code.gs` ฉบับเต็มที่แก้ไขแล้ว เพื่อให้ผู้ใช้นำไปวางใน Apps Script
- Frontend: เก็บไฟล์ไว้ใน GitHub และให้ Backend โหลดตาม Immutable SHA ไม่ต้องให้ผู้ใช้คัดลอกไฟล์ HTML ไปวางใน Apps Script
- หากแก้ Frontend ต้องสร้าง commit และอัปเดต SHA ใน Backend ตามลำดับ
- หลังแก้ Backend ให้ตรวจสอบ Script Properties, OAuth scopes และการตั้งค่าเดิมก่อน Deploy
- การ Deploy ต้องสร้าง Version ใหม่ผ่าน Manage deployments โดยไม่เปลี่ยน Web App URL โดยไม่จำเป็น
- ต้องยืนยัน Environment ก่อน Deploy ทุกครั้ง

**ข้อสังเกตที่ต้องตรวจสอบก่อน Production:** หัวไฟล์ `code.gs` ที่ตรวจล่าสุดระบุ `Build: 0.4.0.2-MEETING-MONITORING-TEST` และมีข้อความ `Deploy TEST only` จึงต้องตรวจสอบกับผู้รับผิดชอบว่า Deployment ที่จะใช้งานเป็น TEST หรือ Production และได้รับอนุมัติให้ใช้ Environment ใดแล้ว ห้ามตีความการยอมรับ Phase 1 ว่าเป็นการอนุมัติเปลี่ยน Environment โดยอัตโนมัติ

## 9. บันทึกการเปลี่ยนแปลงหลังการส่งมอบ

| วันที่ | รายการ | ผล |
|---|---|---|
| 24 พ.ย. 2026 | จัดทำเอกสารสถานะและแนวทางส่งมอบโครงการ | บันทึกสถานะ Phase 1 ข้อ 1–7 และแนวทางรับช่วงงาน |

เพิ่มรายการใหม่ในตารางนี้ทุกครั้งที่มีการเปลี่ยนแปลง Source Code, Database, Deployment, Workflow หรือข้อกำหนดที่ได้รับอนุมัติ

---

## 10. คำสั่งเริ่มต้นสำหรับผู้รับช่วงงาน

หากเป็น AI หรือผู้พัฒนารายใหม่ ให้เริ่มด้วยคำสั่งนี้:

> อ่าน `project/STATUS.md`, `project/README.md` และ `project/gas-source/README.md` ก่อนดำเนินงาน ตรวจสอบ Source Code ปัจจุบันจาก branch `main` และยึดสถานะ/ข้อกำหนดในเอกสารเป็น Baseline ห้ามแก้ไขโค้ด ฐานข้อมูล Script Properties หรือ Deployment ก่อนวิเคราะห์ปัญหาและเสนอแผนเพื่อรออนุมัติ หากพบความไม่สอดคล้องระหว่างเอกสารกับ Source Code ให้รายงานความแตกต่างก่อน ห้ามเดาหรือปรับแก้เอง

## 11. Phase 2 — RW-01 Research Topic (Implementation Branch)

สถานะ ณ 24 พฤศจิกายน 2026: **พัฒนา Source Code ตาม Implementation Plan RW-01 v1.0 ใน Branch แยกแล้ว; รอ Runtime Test และ UAT บน TEST**

- Branch: `feature/rw-01-research-topic`
- Baseline: `main` ณ commit `acfc95b8cbf4e71797b60deeb86bbaac6f705a86`
- Files changed: `project/gas-source/code.gs`, `project/frontend/Client.html`
- Frontend immutable SHA ที่ Backend pin: `0eb0e8db1f45e737d56c3ac7ad1cada889a4a4e4`
- Schema: ใช้ `RESEARCH_TOPIC_DRAFTS` และ `RESEARCH_TOPIC_VERSIONS` เดิม ไม่มีการเพิ่มตารางหรือคอลัมน์
- Database/Deployment: ไม่มีการเชื่อมต่อหรือเปลี่ยนแปลงฐานข้อมูลจริง, ไม่มีการรัน Migration/Setup, ไม่มีการติดตั้ง Trigger และไม่มีการ Deploy

ขอบเขตการปรับปรุง:
1. โหลดข้อมูลฉบับล่าสุดที่มีสถานะ `REVISION_REQUIRED` กลับมาเป็นข้อมูลตั้งต้นสำหรับการแก้ไข โดยไม่แก้ไขข้อมูล Version เดิม
2. ป้องกันการส่งซ้ำเมื่อฉบับล่าสุดอยู่ระหว่างพิจารณา เห็นชอบ หรือไม่เห็นชอบ
3. อนุญาตให้ส่ง Version ใหม่เมื่อฉบับล่าสุดได้รับผล `REVISION_REQUIRED` เท่านั้น
4. ป้องกัน Advisor Review ซ้ำ/พร้อมกันด้วย ScriptLock และตรวจสถานะ `PENDING` ก่อนบันทึก
5. กำหนดให้มีข้อเสนอแนะอย่างน้อย 5 ตัวอักษรเมื่อเลือก `REVISION_REQUIRED` หรือ `REJECTED`
6. บันทึกการเห็นชอบของอาจารย์ที่ปรึกษาเป็น `STATUS=ADVISOR_APPROVED` และ `REVIEW_STATUS=APPROVED`; ไม่ใช่ Course Coordinator Approval หรือ REC Approval
7. เชื่อมการแจ้งเตือนเข้ากับชีต `NOTIFICATIONS` และ `NOTIFICATION_QUEUE` ที่มีอยู่แล้ว โดยไม่สร้างชีตหรือรัน Migration อัตโนมัติ
8. ปรับ Student/Advisor UI ให้เห็นข้อมูลฉบับเต็มและประวัติ Version รวมถึงข้อเสนอแนะ

ผลตรวจ Source Code:
- Backend function names ซ้ำ: ไม่พบ
- Frontend API calls ที่ไม่มี Backend API รองรับ: ไม่พบ (ตรวจพบ 71 ชื่อ API ที่เรียกผ่าน `callApi()`)
- Schema ของตาราง RW-01: คงเดิม
- Backend Frontend pin: ตรงกับ Frontend commit SHA
- เทียบกับ `main`: เปลี่ยนเฉพาะ 2 ไฟล์ข้างต้นในรอบ Implementation นี้

ข้อจำกัดของผลทดสอบ: ผลข้างต้นเป็น Static Source Inspection เท่านั้น ยังไม่ได้ Compile/Execute ใน Google Apps Script Runtime และยังไม่ได้ทดสอบกับ TEST Database/Deployment จริง จึงยังไม่ถือว่า RW-01 ผ่าน Runtime Test หรือ UAT และยังไม่อนุญาตให้ Deploy Production

Commits ใน Branch:
- `0eb0e8db1f45e737d56c3ac7ad1cada889a4a4e4` — Implement RW-01 student revision and advisor review UI
- `4fc3f6ac6af0704c659205efbb5b989def197ef7` — Implement RW-01 workflow validation, review locking and notifications
- `8ccde33e452bcc190fa6d8a64fc7b48e3b8d48a1` — Keep RW-01 notifications within pre-existing TEST tables



## 12. Session Lifecycle Hotfix — Implementation

สถานะ ณ 24 พฤศจิกายน 2026: **แก้ไข Source Code ใน Branch แยกจาก main แล้ว; รอ Runtime Test/UAT บน TEST**

- Branch: `feature/rw-01-research-topic`
- ขอบเขตไฟล์: `project/frontend/Client.html`, `project/gas-source/code.gs`
- Frontend immutable SHA ที่ Backend pin: `93f23210fd48fcac2ebc665b4babdf3df1b1ecd6`
- Commit ล่าสุดของ Backend: `10bb37e516172c34526516abe9ba26880d628cb7`

รายการแก้ไข:
1. เพิ่ม Session expiry timer ฝั่ง Client โดยอ้างอิง `expiresAt` ที่ Backend ส่งกลับ เพื่อเปลี่ยนจาก Workspace ไปหน้า Login เมื่อ Session หมดอายุ
2. เพิ่มการตรวจจับข้อผิดพลาด Session หมดอายุ/ถูกยกเลิก/บัญชีถูกระงับที่จุดกลาง `callApi()` เพื่อไม่ให้แต่ละ Module แสดง Error ค้างใน Workspace
3. เมื่อ Session ใช้ไม่ได้ ให้ล้าง Token และเวลา Expiry จาก LocalStorage/SessionStorage และแสดงหน้า Login พร้อมข้อความแจ้งเหตุผล
4. เมื่อ Refresh หน้าเว็บ ให้ใช้ Token เดิมตรวจสอบกับ `apiGetDashboard()`; หากยังใช้ได้ให้เปิด Workspace โดยตรง
5. หากการตรวจสอบ Session ล้มเหลวจากปัญหาเครือข่ายหรือ Server ชั่วคราว จะไม่ลบ Token โดยอัตโนมัติ เพื่อให้ผู้ใช้ Refresh แล้วลองคืน Session ใหม่ได้
6. Backend เพิ่ม `expiresAt` ในผลลัพธ์ `apiGetDashboard()` โดยอ่านจาก Session ที่ผ่านการตรวจสอบแล้ว
7. คงระยะเวลา Session เดิม 4 ชั่วโมง และไม่เปลี่ยน Schema/Workflow/Password Hash

ข้อจำกัดและความปลอดภัย:
- เป็นการแก้ไข Source Code เท่านั้น ยังไม่ได้ Deploy ไปยัง Web App TEST
- ยังไม่ได้ทดสอบกับ Google Apps Script Runtime หรือ Browser จริง
- การยกเลิก Session โดย Admin ระหว่างที่ผู้ใช้ไม่ได้ทำรายการใด ๆ จะถูกตรวจพบเมื่อมี API request ถัดไป; ไม่ได้เพิ่ม polling/heartbeat เพื่อหลีกเลี่ยงการเพิ่มภาระการเรียก API
- ไม่เปลี่ยนแปลง Google Sheets, Script Properties, Database ID หรือ Production Deployment
- ยังไม่ถือว่าผ่าน Runtime Test/UAT

ผลตรวจเบื้องต้น:
- ตรวจสอบจุดเรียกคืน Session จาก LocalStorage และการเรียก `apiGetDashboard()` แล้ว
- ตรวจสอบว่า Backend ส่ง `expiresAt` และ Frontend pin ไปยัง immutable SHA ใหม่แล้ว
- Runtime/Browser test: **PENDING**



## 13. Advisor Assigned Groups & Dashboard Metrics Hotfix

สถานะ ณ 25 พฤศจิกายน 2026: **แก้ไข Source Code ใน Branch แยกแล้ว; รอ Runtime Test/UAT บน TEST**

ปัญหาที่พบจากภาพหน้าจอ:
- Dashboard แสดงจำนวนกลุ่มที่ได้รับมอบหมายเป็น 1 แต่หน้า “กลุ่มที่ได้รับมอบหมาย” ไม่แสดงรายละเอียดกลุ่ม
- หน้า Advisor Overview แสดงข้อความ fallback ว่าเมนูไม่มีสิทธิ์/ไม่มีข้อมูล ทั้งที่มีข้อมูลกลุ่ม
- Metric card 4 รายการแสดง 3 รายการในแถวแรกและอีก 1 รายการตกลงแถวถัดไป ทำให้ใช้พื้นที่มากเกินจำเป็น

การแก้ไข:
1. เพิ่ม Backend API `apiGetAdvisorAssignedGroups(token)` สำหรับ Advisor โดยเฉพาะ
2. ใช้ `readObjectsFresh_()` อ่าน `ADVISOR_ASSIGNMENTS`, `RESEARCH_GROUPS`, `GROUP_MEMBERS`, `STUDENTS` เพื่อลดปัญหาข้อมูล Cache เก่าที่อาจทำให้ตัวเลข Dashboard กับรายการกลุ่มไม่ตรงกัน
3. Normalize User ID, Group ID และ Status ก่อนเปรียบเทียบ และเลือกเฉพาะรายการแต่งตั้งที่ APPROVED กับกลุ่ม ACTIVE
4. ส่งชื่อสมาชิกโดยใช้ FULL_NAME หรือประกอบ TITLE/FIRST_NAME/LAST_NAME เป็น fallback
5. เปลี่ยน Advisor group view ให้เรียก API ใหม่ และแยกข้อผิดพลาดการโหลด Ethics Summary ออกจากการแสดงรายละเอียดกลุ่ม เพื่อไม่ให้การโหลดข้อมูลย่อยทำให้กลุ่มหายทั้งรายการ
6. ปรับ Dashboard metrics เป็น 4 คอลัมน์บนหน้าจอกว้าง และ 2 คอลัมน์บนหน้าจอขนาดเล็ก พร้อมลด padding/ขนาดตัวเลข
7. ไม่เปลี่ยน Schema, Database, สิทธิ์, Workflow การแต่งตั้ง หรือสถานะการอนุมัติเดิม

ไฟล์ที่เปลี่ยน:
- `project/gas-source/code.gs`
- `project/frontend/Client.html`
- `project/frontend/Styles.html`

Frontend immutable SHA ที่ Backend pin:
- `0ebd54a8e8468f0b23e157a1236d3265bf5fac9d`

Backend commit:
- `ab8d98502c9678e18b132c04b7857578ef0021a3`

ข้อจำกัด:
- เป็น Source Code update เท่านั้น ยังไม่ได้ Deploy ไปยัง Web App TEST
- ยังไม่ได้ทดสอบ Runtime ด้วยข้อมูลจริงของบัญชี Advisor
- หากไม่พบกลุ่มหลัง Deploy ต้องตรวจสอบค่าจริงในแถว `ADVISOR_ASSIGNMENTS` (ADVISOR_USER_ID, GROUP_ID, STATUS) และ `RESEARCH_GROUPS` (GROUP_ID, STATUS) โดยไม่แก้ข้อมูลเอง
- Runtime Test/UAT: **PENDING**
