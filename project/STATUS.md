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


## 13. Code.gs Syntax Error Hotfix

- ตรวจพบข้อผิดพลาดจากภาพผู้ใช้: บรรทัด 130 มี comma ซ้ำหลังค่า `COMMIT_SHA` ทำให้ Apps Script แจ้ง `SyntaxError: Unexpected token ','`
- แก้ไขโดยลบ comma ที่เกินออกเพียง 1 ตัว
- ปรับ `FRONTEND_CONFIG.COMMIT_SHA` ให้ชี้ไปยัง immutable branch snapshot `a3926b5aac13b02a8ec14e679783c82e564519ef` ซึ่งมี Frontend files ที่เกี่ยวข้องอยู่ใน commit เดียวกัน
- Commit แก้ไขล่าสุด: `1f675b15bbbe4881a920c0c614f0b12d1a582a0a`
- ผลตรวจ: บรรทัด COMMIT_SHA เหลือ comma ปิด property เพียงตัวเดียว
- ข้อจำกัด: ยังไม่ได้รัน Apps Script deployment/runtime; ต้องวาง/ดึง Code.gs ล่าสุดและทดสอบ Syntax ใน Apps Script Editor ก่อน Deploy TEST


## 14. Styles.html Stray CSS Text Hotfix

- ตรวจพบจากภาพผู้ใช้ว่า CSS ของ Metric Cards ถูกวางอยู่นอก `</style>` ทำให้ Browser แสดง CSS เป็นข้อความด้านบน Workspace
- ย้าย CSS เข้าไปภายใน `<style>` และลบข้อความ CSS ที่ตกค้างหลัง closing tag
- Backend Frontend pin ปรับเป็น immutable commit `baa3d151e337c16d260ef19810147e21387cffa9`
- Commit Backend pin: `96ef79176a2e2d757d48f51c63d4b641b88c3924`
- ตรวจสอบ Source: ไม่มีข้อความหลัง `</style>` และ Metric CSS อยู่ก่อน closing tag
- Runtime/UI test หลัง Deploy: PENDING


## 14. Styles.html CSS Output Hotfix

- ผู้ใช้รายงานว่า CSS ของ Metric Cards ยังคงแสดงเป็นข้อความเหนือ Workspace
- ตรวจสอบ Source ล่าสุดพบว่า `Styles.html` มี `</style>` ปิดก่อนบล็อก Metric CSS และมี closing tag อีกตัวท้ายไฟล์
- แก้ไขโดยย้าย Metric CSS เข้าไปภายใน style element เดิม และเหลือ `<style>` / `</style>` อย่างละหนึ่งตัว
- ตรวจสอบ Frontend Snapshot ที่ Backend โหลดจริงแล้ว: `FRONTEND_CONFIG.COMMIT_SHA = 71230f41bd056d08c698533b02b18cb46cd7d632`
- Backend commit หลังปรับ pin: `a9138264d769037d5430441a570a001ec397a206`
- Static verification: CSS อยู่ก่อน closing style tag, จำนวน style opening/closing tag เท่ากับ 1/1, Styles.html ใน pinned snapshot ตรงกับไฟล์ที่แก้ไข
- Runtime/Browser verification หลัง Deploy: **PENDING**
- หมายเหตุ: ต้อง Deploy TEST version ใหม่เพื่อให้ Apps Script ใช้ Backend pin ใหม่; Cache เดิมของ Apps Script อาจทำให้เห็น Frontend รุ่นก่อนจนกว่าจะหมดอายุหรือมีการจัดการ Cache ตามกลไกของระบบ


## 15. Follow-up Code.gs line 130 correction

- ผู้ใช้พบว่า line 130 ยังมี comma ซ้ำหลัง `FRONTEND_CONFIG.COMMIT_SHA`.
- ตรวจสอบไฟล์จาก Branch ล่าสุดและยืนยันข้อผิดพลาดจริง: `...,',,`
- แก้ไขโดยลบ comma ส่วนเกินหนึ่งตัว
- ตรวจสอบไฟล์หลังบันทึกจาก GitHub ซ้ำแล้ว: line 130 เป็น `COMMIT_SHA: '71230f41bd056d08c698533b02b18cb46cd7d632',` และไม่พบ `,,` ในบรรทัดดังกล่าว
- Correction commit: `89f1ffd183039c8e7fd41592bcb7c2a3747d98a7`
- Runtime compile / deployment: ยังไม่ทดสอบ


## 16. Advisor Workspace Menu Alignment — Implementation

สถานะ: **Source implementation completed on feature branch; TEST runtime/UAT pending**

ขอบเขตที่ดำเนินการตามการอนุมัติของผู้ใช้: ปรับหน้าที่และการทำงานให้สอดคล้องกับเมนู Advisor ทั้ง 4 เมนู โดยไม่เปลี่ยน Schema, คะแนนที่อนุมัติ, Role model หรือ Workflow การแต่งตั้ง

### 1) ภาพรวมการให้คำปรึกษา (Advisor Dashboard)
- เพิ่ม Backend helper `advisorWorkspaceSummary_()` และ API `apiGetAdvisorWorkspaceSummary()`
- แสดงจำนวนกลุ่มที่ได้รับมอบหมาย, รายงานความก้าวหน้าที่รอตรวจ, หัวข้อวิจัยที่รอพิจารณา และจำนวนครั้งการพบอาจารย์ที่บันทึกแล้ว
- แสดงรายการหัวข้อ/รายงานที่ต้องดำเนินการ และภาพรวมสถานะรายกลุ่ม
- เพิ่มทางลัดไปยังกลุ่มที่ได้รับมอบหมาย, บันทึกการพบอาจารย์ และประเมิน A4
- แยกความล้มเหลวของ Notification panel ออกจากการโหลด Dashboard

### 2) กลุ่มที่ได้รับมอบหมาย (Assigned Groups)
- เปลี่ยนการแสดงผลให้ใช้ข้อมูลสรุปชุดเดียวจาก API Advisor Workspace
- แสดงหัวข้อวิจัย สมาชิก รายงานที่รอตรวจ จำนวนเอกสาร จำนวนครั้งการพบ และงานคงค้าง
- เพิ่มการเปิดดูรายละเอียดแบบ On-demand: ประวัติหัวข้อวิจัย, รายงานความก้าวหน้า, เอกสารโครงร่าง และข้อเสนอแนะ
- แสดงสรุปแผนจริยธรรมแบบอ่านอย่างเดียว พร้อมข้อความชัดเจนว่าความเห็นชอบของอาจารย์ไม่ใช่ REC Approval

### 3) บันทึกการพบอาจารย์ (Supervision Records)
- คงโครงสร้างเดิมที่รองรับ Advisor: ตรวจสอบ PDF ที่นักศึกษาส่ง, ยืนยัน/ส่งกลับแก้ไข และบันทึกการเข้าร่วมรายบุคคล
- แก้การตรวจสอบสิทธิ์กลุ่มให้ใช้ข้อมูลสดจากฐานข้อมูล (Fresh Read) และตรวจสอบ Assignment APPROVED
- ไม่เพิ่มตารางนัดหมายหรือบังคับการพบรายสัปดาห์

### 4) ประเมิน A4 (Advisor Assessment)
- ปรับการดึงรายชื่อกลุ่ม/สมาชิก/คะแนนให้ใช้ Fresh Read
- ใช้กลุ่มจาก Approved Advisor Assignments ชุดเดียวกับ Dashboard
- ปรับการตรวจสอบสิทธิ์ใน `assertGroupAccess_()` ให้ใช้ Fresh Read และ Normalize GROUP_ID, USER_ID, STATUS
- แสดงสถานะช่วงประเมิน A4; ปิดการแก้ไขเมื่อ Admin ยังไม่เปิด WINDOW_A4
- คงโครงสร้างข้อมูลและ validation คะแนนเดิม ไม่เปลี่ยนสัดส่วนคะแนน

### Files changed
- `project/gas-source/code.gs`
- `project/frontend/Client.html`

### New files
- **ไม่มีการสร้างไฟล์ใหม่** เพราะฟังก์ชันที่อนุมัติสามารถเพิ่มใน Backend/Frontend เดิมได้ การเพิ่มไฟล์ HTML ใหม่จะเพิ่มขั้นตอน include, asset pinning และ deployment โดยไม่ได้ลดจำนวนรอบเรียก API หรือทำให้ Runtime เร็วขึ้นอย่างมีนัยสำคัญ

### Static verification
- ตรวจสอบว่า API `apiGetAdvisorWorkspaceSummary` มีอยู่ใน Backend
- ตรวจสอบ Dashboard ใช้ตัวนับจาก Advisor Workspace Summary
- ตรวจสอบ Advisor Assessment ใช้ Fresh Read
- ตรวจสอบ `assertGroupAccess_()` ใช้ Fresh Read สำหรับ Group, Assignment และ Membership
- ตรวจสอบ Frontend มี render functions สำหรับ Advisor Dashboard, Assigned Groups และ A4
- เมนู Supervision ยังคงใช้ `renderMeetingAttendance()` ที่มี flow Advisor อยู่แล้ว
- ยังไม่ได้รัน Google Apps Script Runtime, Browser automation หรือ UAT กับ TEST deployment

**ข้อจำกัด:** การตรวจสอบสิทธิ์และข้อมูลจาก Source Code ผ่านการปรับแล้ว แต่ต้องทดสอบด้วยบัญชี Advisor ที่มี Assignment APPROVED จริง เพื่อยืนยันผลจาก TEST Database และการทำงานของ Drive PDF permissions ก่อนปิดงาน


### Advisor Workspace deployment pin follow-up
- Backend Frontend pin updated to immutable snapshot `9fd19148fed090fe06547a1935cd7664382d77b1`, which contains the latest Advisor `Client.html` and corrected `Styles.html`.
- Latest Backend correction commit: `16b71af4a8b31a2f06f79e209c2233b024ce4ff6`.
- Verified line 130 after save: `COMMIT_SHA: '9fd19148fed090fe06547a1935cd7664382d77b1',` (single trailing comma; no duplicate comma).


### A4 assessment-window freshness
- Added `assessmentSettingsFresh_()` and use it in the Advisor workspace summary and A4 save authorization.
- The displayed A4 window state and server-side save guard now read current settings rather than a potentially stale cached value.
- Backend commit: `7c5803e7a595c9d62032f8991d207d98d3edd340`.
- Frontend pin remains `9fd19148fed090fe06547a1935cd7664382d77b1`; no Frontend change was needed for this Backend-only correction.


## 17. F5 Workspace Restoration — Implementation

สถานะ ณ 25 พฤศจิกายน 2026: **แก้ไข Source Code บน feature branch แล้ว; รอ Runtime Test/UAT บน TEST**

วัตถุประสงค์:
- เมื่อผู้ใช้ Refresh (F5) ขณะมี Session ที่ยังไม่หมดอายุ ให้กลับเข้าสู่ Workspace โดยไม่แสดงหน้า Login คั่นระหว่างรอตรวจสอบ Session
- คืนค่าเมนูเดิมที่ผู้ใช้เปิดอยู่ก่อน Refresh

การเปลี่ยนแปลง:
1. เพิ่ม Early Boot Check ใน `Index.html` เพื่อตรวจ Token และเวลาหมดอายุจาก LocalStorage/SessionStorage ก่อน Browser แสดงหน้าเว็บ
2. เมื่อพบ Token และยังไม่หมดอายุ ให้ซ่อนหน้า Login ชั่วคราว และแสดงสถานะ “กำลังเรียกคืนการเข้าสู่ระบบ”
3. เมื่อ Backend ตรวจสอบ Session สำเร็จ จึงแสดง Workspace และซ่อนสถานะกำลังเรียกคืน
4. บันทึกชื่อเมนูที่เลือกไว้ใน LocalStorage และคืนค่าเมนูเดิมหลังสร้าง Dashboard; หากเมนูเดิมไม่อยู่ในสิทธิ์ของบัญชี ให้กลับไปเมนูแรก
5. เมื่อ Logout ให้ลบเมนูที่บันทึกไว้ และเมื่อ Session หมดอายุ/ถูกยกเลิกให้กลับหน้า Login ตามกระบวนการเดิม
6. หากเกิดปัญหาเครือข่าย/Server ชั่วคราว ยังคงรักษา Token ตาม Session Lifecycle Hotfix เดิม และแสดงข้อความให้ลอง Refresh ใหม่

ไฟล์ที่เปลี่ยน:
- `project/frontend/Index.html`
- `project/frontend/Client.html`
- `project/frontend/Styles.html`
- `project/gas-source/code.gs` (อัปเดต Frontend immutable SHA)

Frontend immutable SHA ที่ Backend pin:
- `6423b3852ec34d50dc70390f06d1fc1e04348122`

Backend commit:
- `83cae7c5668573d26930a910785827ce177d801c`

Static verification:
- ตรวจ Early Boot Check และ Restore Placeholder
- ตรวจการบันทึก/คืนค่าเมนู และ fallback เมื่อไม่พบเมนูเดิม
- ตรวจการล้างสถานะ Restore เมื่อ Session สำเร็จ, ผิดพลาด, หมดอายุ และ Logout
- ตรวจ CSS style opening/closing tags อย่างละหนึ่งชุด
- ตรวจ Backend Frontend SHA ตรงกับ immutable Frontend snapshot

ข้อจำกัด:
- ยังไม่ได้ทดสอบ Google Apps Script Runtime หรือ Browser จริง
- ยังไม่ได้ Deploy ไปยัง TEST Web App
- การคืนค่ารอบนี้ครอบคลุมระดับเมนู (Menu-level) ไม่รวมข้อมูลที่ยังไม่ได้บันทึกในฟอร์ม หรือรายละเอียดภายในหน้าที่เปิดค้าง เช่น กลุ่มที่เลือก/Modal/แท็บย่อย
- ไม่เปลี่ยน Session Policy, Password Hash, Database Schema, Role/Permission, Workflow หรือ Production Deployment
- Runtime Test/UAT: **PENDING**


## 18. Advisor Menu Routing Hardening — Implementation

สถานะ ณ 25 พฤศจิกายน 2026: **ปรับ Source Code บน feature branch แล้ว; รอ Runtime Test/UAT บน TEST**

เหตุผล:
- พบหน้า Advisor แสดงข้อความ fallback “เมนูนี้ยังไม่มีสิทธิ์หรือไม่มีข้อมูลสำหรับบัญชีนี้” ทั้งที่มีเมนูภาพรวมการให้คำปรึกษและมีฟังก์ชัน `renderOverview()` ใน Frontend snapshot
- ผู้ใช้ยืนยันว่า TEST Web App ใช้ Deployment Version ล่าสุดแล้ว
- ปรับ Menu Routing ให้ทนต่อช่องว่าง/อักขระ Unicode แฝง และมี Advisor index fallback สำหรับเมนูหลัก

การเปลี่ยนแปลง:
1. เพิ่ม `normalizeMenuLabel_()` เพื่อ Normalize Unicode (NFC), ตัด zero-width/BOM/non-breaking spaces และยุบช่องว่างก่อนเปรียบเทียบ
2. ใช้ `routeLabel` ที่ Normalize แล้วในเงื่อนไข Menu Routing ภายใน `renderDashboard()`
3. เพิ่ม Advisor fallback ตามลำดับเมนูที่ Backend ส่ง: index 0 Overview, index 1 Assigned Groups, index 2 Supervision Records, index 3 A4 Assessment
4. คงการจับคู่ด้วยชื่อเมนูเป็นหลัก; ใช้ index fallback สำหรับ Advisor เพื่อรองรับชื่อเมนูที่มีความคลาดเคลื่อน
5. อัปเดต Backend immutable Frontend SHA ให้ชี้ไปยัง Client snapshot ใหม่

ไฟล์ที่เปลี่ยน:
- `project/frontend/Client.html`
- `project/gas-source/code.gs` (อัปเดต Frontend SHA เท่านั้น)

Commit:
- Client: `91da1c393b4a515f6366cec14d09549a1703bb04`
- Backend: `64edc7deabeb1ea95c076f69d70d2f7ab466c8e5`
- Frontend SHA pinned: `91da1c393b4a515f6366cec14d09549a1703bb04`

Static verification:
- ตรวจพบ Normalize helper และการเรียกใช้ก่อน Menu Routing; ตรวจ regex สำหรับ zero-width/BOM/non-breaking space และ whitespace
- ตรวจเงื่อนไข fallback ของ Advisor ครบ 4 เมนูตามลำดับ
- ตรวจชื่อเมนู Overview ยังคง route ไป `renderOverview()`
- ตรวจ Backend Frontend SHA ตรงกับ Client snapshot ใหม่

ข้อจำกัด:
- ยังไม่ได้ทดสอบ Google Apps Script Runtime หรือ Browser จริง
- ยังไม่ได้ Deploy เวอร์ชันนี้ไปยัง TEST Web App
- Advisor index fallback อาศัยลำดับเมนูที่ Backend ส่งมา จึงต้องรักษาลำดับ 4 เมนูของ Advisor ให้ตรงกับที่กำหนด
- Runtime Test/UAT: **PENDING**


## 19. Student Research Topic Menu — Minor Feature

สถานะ ณ 26 พฤศจิกายน 2026: **Source Code committed บน feature branch; ยังไม่ Deploy และยังไม่ผ่าน Runtime Test/UAT**

ความต้องการ:
- เพิ่ม/แสดงเมนู “หัวข้องานวิจัย” ในฝั่งนักศึกษา
- วางเมนูต่อจาก “ข้อมูลของกลุ่ม” เพื่อให้เข้าถึงการเสนอหัวข้องานวิจัยได้ชัดเจน

การเปลี่ยนแปลง:
1. ปรับรายการเมนู Student ใน Backend ให้เรียง “ข้อมูลของกลุ่ม” → “หัวข้องานวิจัย” → “งานกลุ่ม”
2. เปลี่ยนชื่อเมนูเดิม “หัวข้อวิจัย” เป็น “หัวข้องานวิจัย” โดยใช้หน้าฟังก์ชันเดิม `renderStudentTopics()`; ไม่สร้างหน้าหรือ API ซ้ำ
3. เพิ่ม Client route ให้รองรับชื่อเมนูใหม่ และคงชื่อ “หัวข้อวิจัย” เดิมเป็น compatibility fallback
4. อัปเดต Backend immutable Frontend SHA ให้ตรงกับ Client snapshot

ไฟล์ที่เปลี่ยน:
- `project/frontend/Client.html`
- `project/gas-source/code.gs`
- `project/STATUS.md`

Commits:
- Client: `ead652204a7f13021e3ac0057a67838061a4222b`
- Backend: `fb1f3e8c3cb2bb0faf7802e7ae5daac4f87cda7d`
- Frontend SHA pinned: `ead652204a7f13021e3ac0057a67838061a4222b`

Static verification:
- ตรวจ Source ว่ามีเมนูใหม่ต่อจาก “ข้อมูลของกลุ่ม”
- ตรวจ Client route ใหม่เชื่อมไปยัง `renderStudentTopics()`
- ตรวจว่า Backend pin ชี้ไปยัง Client commit ที่ถูกต้อง

ข้อจำกัด:
- ยังไม่ได้ตรวจ Compile/Execute ใน Google Apps Script Runtime
- ยังไม่ได้ Deploy ไปยัง TEST Web App
- ยังไม่ได้ทดสอบการแสดงเมนูบนบัญชีนักศึกษาจริง
- Runtime Test/UAT: **PENDING**
- Production: **ไม่เปลี่ยนแปลง**
