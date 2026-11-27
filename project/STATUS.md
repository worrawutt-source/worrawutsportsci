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

## 19. PERF-01 — Advisor Dashboard Initial Load Optimization

สถานะ ณ 26 พฤศจิกายน 2026: **Implementation committed on TEST feature branch; static verification completed; Runtime/TEST/UAT pending**

อนุมัติขอบเขต: ลดการอ่านข้อมูลซ้ำและ API call ระหว่าง Advisor Dashboard bootstrap กับ Overview โดยไม่เปลี่ยน Schema, Role/Permission หรือ Workflow

การเปลี่ยนแปลง:
- รวมการสร้าง Advisor Overview data ใน helper `advisorWorkspaceDetails_()` เพื่อให้ Dashboard bootstrap ได้ Summary, pending items และ group status ใน request เดียว
- `apiGetAdvisorWorkspaceSummary()` ใช้ helper เดียวกันเพื่อรักษา fallback/API compatibility
- Frontend `renderOverview()` ใช้ Summary ที่ได้จาก `apiGetDashboard` ก่อน และคง API fallback เมื่อ bootstrap summary ไม่มี
- อัปเดต immutable Frontend pin ให้ตรงกับ Client snapshot ที่แก้ไขแล้ว
- ไม่มีการแก้ Database Schema, setup.gs หรือ Production deployment

ไฟล์ที่เปลี่ยน:
- `project/gas-source/code.gs`
- `project/frontend/Client.html`

Branch:
- `perf/perf-01-advisor-dashboard-load`
- Base: `3037bac4f8b73b3e57f47fd4525096296e66d731`
- PERF-01 implementation commit before UI refinement: `4caa18a1312b212cf736e1805ecf07d94609296f`

Static Performance Analysis:
- ก่อนแก้ เส้นทาง Dashboard → Overview มีการอ่านข้อมูล Fresh Read ประมาณ 22 sheet reads ตาม call path (Dashboard summary 8 + Overview API 14)
- หลังแก้ เส้นทางเดียวกันมีประมาณ 10 sheet reads (Advisor assignments/groups/members/students 4 + Overview tables 6)
- ลดลงเชิงโครงสร้าง 12 Spreadsheet reads หรือประมาณ 54.5% ใน call path นี้ และตัด Overview summary API call ซ้ำ 1 ครั้ง
- ตัวเลขนี้เป็น Static call-path count ไม่ใช่ Runtime timing; ยังไม่มีผลวัดเวลา Response หรือ Browser load

Static Verification:
- Backend Dashboard ใช้ `advisorWorkspaceDetails_()` และแนบ `advisorWorkspaceSummary`
- Frontend Overview เลือกใช้ bootstrap summary และยังคง fallback API
- Backend immutable Frontend SHA ตรงกับ Client commit `bf38214c4588b29f26839c433846c044f18275e1`
- Main branch ไม่ถูกแก้ไข; งานทั้งหมดอยู่ใน feature branch

Test status:
- Static source checks: **PASS**
- Runtime / Browser test: **NOT TESTED**
- TEST deployment: **NOT DEPLOYED**
- UAT: **PENDING**
- Production: **UNCHANGED**

Next Action:
- Deploy approved branch to TEST only, then compare Dashboard → Overview API count, Spreadsheet operations, payload size and response timing against the baseline; run Advisor regression tests before UAT.


## 20. UI-02 — Compact Course Coordinator Meeting Monitoring

สถานะ ณ 26 พฤศจิกายน 2026: **Source Code ปรับแล้วบน branch เดิม; Static checks ผ่าน; Runtime/TEST/UAT pending**

เหตุผล:
- หน้า Admin/ผู้รับผิดชอบรายวิชาวาง Summary, Filter และข้อมูลรายกลุ่มเรียงลงแนวตั้ง ทำให้ใช้พื้นที่แนวนอนไม่คุ้มและต้องเลื่อนหน้าจอมาก
- Summary เดิมใช้ `stats-grid` ที่ไม่มี layout เฉพาะ จึงแสดงตัวเลขเป็นรายการแนวตั้ง

การเปลี่ยนแปลง:
1. Summary 6 รายการจัดเป็น Grid 3 คอลัมน์บน Desktop และ 2 คอลัมน์บน Mobile
2. Search และ Status filter จัดวางแนวนอนบนจอที่มีพื้นที่เพียงพอ
3. เปลี่ยนรายการติดตามเป็น Status Matrix: 1 แถวต่อกลุ่ม และ 7 คอลัมน์ตามครั้ง/สัปดาห์ที่กำหนด
4. แต่ละช่องแสดงสถานะ วันที่ส่ง และลิงก์เปิด PDF เมื่อมีเอกสาร
5. Status filter ใช้กรองกลุ่มที่มีรายการตรงเงื่อนไข และเน้นช่องสถานะที่ตรงกับ filter
6. ไม่เปลี่ยน API, Schema, Role/Permission, ข้อมูล หรือ workflow; หน้านี้ยังคง workflow PDF ตาม Source ปัจจุบัน การเปลี่ยนเป็นแบบฟอร์มออนไลน์เป็นงานแยกต่างหาก

ไฟล์ที่เปลี่ยน:
- `project/frontend/Styles.html`
- `project/frontend/Client.html`
- `project/gas-source/code.gs` (อัปเดต immutable Frontend pin)

Commits:
- Styles: `bbee3735790ad8fb655eeaf0cc31d8deb8b88c16`
- Client: `4585d4d23d0e6fa9cb49f09aee68dd1c9ba63f8d`
- Backend pin: `74040a4b311e973a9891cda310b669c1e11bce43`
- Frontend immutable pin: `4585d4d23d0e6fa9cb49f09aee68dd1c9ba63f8d`

Static verification:
- ตรวจพบ Summary Grid และ Status Matrix ใหม่
- ตรวจว่า stats-grid แบบเดิมถูกแทนที่
- ตรวจ status mapping/filter สำหรับ SUBMITTED และ ACTIVE
- ตรวจ 7 meeting weeks: 2, 4, 6, 8, 10, 12, 14
- ตรวจ CSS responsive rules และ status styles
- ตรวจ Backend immutable Frontend pin ตรงกับ Client commit

Test status:
- Static source checks: **PASS**
- Runtime / Browser test: **NOT TESTED**
- TEST deployment: **NOT DEPLOYED**
- UAT: **PENDING**
- Production: **UNCHANGED**

Next Action:
- Deploy branch to TEST only after approval; verify summary, search/status filters, table overflow on desktop/mobile, links and current meeting statuses; then run UAT. Do not claim runtime/performance improvement before measuring.


## 21. MEETING-ONLINE — Structured Online Advisor Meeting Report

สถานะ ณ 26 พฤศจิกายน 2026: **UI correction implementation committed on feature branch; Static cross-file checks and syntax compile PASS; Runtime/TEST/UAT pending**

อนุมัติจากผู้ใช้: เพิ่ม Schema แบบ additive สำหรับแบบบันทึกการเข้าพบออนไลน์ โดยเก็บข้อมูล PDF เดิมไว้ ไม่ลบหรือแก้ข้อมูลย้อนหลัง

ขอบเขตที่ดำเนินการ:
- เพิ่ม Schema `MEETING_REPORTS` สำหรับบันทึกเนื้อหาแบบ structured fields; เพิ่มชื่อชีตใน `AUTO_CREATE_WORKFLOW_SHEETS_` เพื่อสร้าง/ตรวจ schema แบบ additive เมื่อเรียกใช้ครั้งแรก โดยไม่แตะ `setup.gs`
- นักศึกษากรอกวันที่, ความก้าวหน้าก่อนพบ, Agenda 3 ประเด็น, ปัญหา/อุปสรรค, สรุปคำปรึกษา, งานต่อ 3 รายการและกำหนดส่ง โดยทุกช่องสร้าง DOM controls จริงและแสดงพื้นที่พิมพ์ชัดเจน
- Student UI แสดงชื่อกลุ่มเป็นข้อความคงที่ ไม่ใช้ dropdown; Advisor ยังคงเลือกกลุ่มที่รับผิดชอบได้
- ซ่อน section title ซ้ำบนหน้า meeting เพื่อคงหัวข้อย่อยที่อธิบายชัดกว่า
- ใช้ date picker วัน/เดือน/ปี พ.ศ. ทั้งวันที่เข้าพบและกำหนดส่ง; แปลงเป็น ISO Gregorian ก่อนส่ง Backend และแสดงวันที่ประวัติเป็น พ.ศ.
- เมื่อ SUBMITTED/VERIFIED ซ่อนแบบฟอร์มแก้ไขและแสดงสถานะ/ข้อมูลที่ส่ง; DRAFT และ REVISION_REQUIRED ยังแก้ไขได้ตามสิทธิ์
- Save Draft รองรับข้อมูลบางส่วน; Submit ตรวจ required fields และวันที่ครบถ้วนฝั่ง Client และ Server
- รองรับ Save Draft และ Submit; นักศึกษาแก้ไขได้เฉพาะ DRAFT/REVISION_REQUIRED
- Advisor อ่านบันทึก, ยืนยันตรวจ หรือส่งกลับแก้ไขพร้อม comment; server-side session, role และ group access checks ใช้ API authorization เดิม
- Admin monitoring อ่านสถานะออนไลน์และ PDF legacy; แสดง UPCOMING เมื่อยังไม่มี attendance record ของครั้งนั้น และนับ NOT_SUBMITTED เฉพาะครั้งที่มีการบันทึกการเข้าพบจริงแต่ยังไม่มีรายงาน
- คง API/ชีต PDF เดิมไว้สำหรับอ่านประวัติ ไม่แสดงตัวเลือกอัปโหลด PDF ใน Student UI ใหม่
- ใช้ batch setValues สำหรับ update row ของ draft/review เพื่อลด Spreadsheet write operations

ไฟล์ที่เปลี่ยน:
- `project/gas-source/code.gs`
- `project/frontend/Client.html`
- `project/frontend/Styles.html`
- `project/STATUS.md`

Frontend immutable pin:
- Client snapshot: `8252ee9dd9136b57699640fc92895d6e3d0ae420`
- Backend pin commit: `890c749c27f9950ae247c5c41ecc992cc97ca627`

Static checks planned/completed:
- Schema and auto-create list contain `MEETING_REPORTS`
- API endpoints present: `apiListMeetingReports`, `apiSaveMeetingReport`, `apiAdvisorReviewMeetingReport`
- Student UI uses online report API and no longer calls `apiUploadMeetingPdf`
- Admin status distinguishes `UPCOMING` from `NOT_SUBMITTED` based on `MEETING_RECORDS`
- Frontend immutable pin must match exact Client snapshot

Test status:
- Static source consistency: **PASS**
- JavaScript syntax compile (GAS backend and Client script): **PASS**
- Schema declaration and safe auto-create allowlist: **PASS**
- Student UI calls online report APIs; no PDF upload input/API call in meeting form: **PASS**
- Advisor review API and UI actions present: **PASS**
- Server validation requires complete Agenda 3 items, 3 next actions, and valid dates on SUBMIT; permits partial DRAFT: **PASS**
- Student group dropdown and duplicate page title removed; Thai Buddhist date controls and submitted-state form hiding: **PASS**
- Local field builder explicitly appends child controls (root cause of missing input controls): **PASS**
- Admin monitoring distinguishes UPCOMING from NOT_SUBMITTED using recorded meeting attendance: **PASS**
- Immutable Frontend pin matches Client snapshot `59d0e43697fdc339b8c5d1e068e53972d8867cfc`: **PASS**
- GAS runtime / browser test: **NOT TESTED**
- TEST deployment: **NOT DEPLOYED**
- UAT: **PENDING**
- Production: **UNCHANGED**

Risks/notes:
- `MEETING_REPORTS` is auto-created by the existing safe workflow-sheet mechanism on first API read/write; confirm sheet headers and permissions in TEST.
- Legacy PDF records remain visible as historical entries; they are not migrated into structured report fields.
- The online form is a course workflow record and does not represent REC approval or authorization to collect research data.

Next Action:
- Perform static cross-file verification, deploy approved branch to TEST only, confirm new sheet schema, test Student draft/submit/revision, Advisor review, Admin monitoring counts, access control, duplicate/concurrent save, mobile layout and legacy PDF read-only history; then complete UAT. No production deployment without separate approval.


Latest UI correction source references:
- Backend pin commit: `76f1185a25076d8c0bae2306cb007a60843f4984`
- Client commit / immutable frontend pin: `59d0e43697fdc339b8c5d1e068e53972d8867cfc`
- Styles commit: `0e9c0c2eede8fa59d7e90035ab2da743f98159a5`
- STATUS update is recorded in its latest commit; Master Plan update is recorded separately on its existing documentation branch because the Master Plan file is not present in this implementation branch.


UI correction review note (2026-11-26): The screenshots exposed that the existing `el()` helper accepts only one text argument and ignores nested controls passed as additional arguments. The meeting-report form now uses a local DOM builder/field helper that appends each control explicitly. This fix is scoped to the meeting-report workflow; the global helper was not changed to avoid unrelated UI regression.

Latest Client commit after duplicate heading removal: `8252ee9dd9136b57699640fc92895d6e3d0ae420`.

## 23. MEETING-ONLINE — Consolidate agenda and next actions; rename menu (2026-11-26)

Approved UI refinement from user screenshots:
- Remove Agenda 2 and Agenda 3; provide one full-width “ประเด็นที่ต้องการปรึกษา” textarea for all consultation points.
- Replace numbered next-action cards 1–3 with one full-width “งานที่ต้องดำเนินการ” textarea and one Thai Buddhist Era due-date picker.
- Rename the menu item for Student, Advisor, and Admin to “บันทึกการเข้าพบที่ปรึกษา”; retain legacy route labels in Client for saved-menu compatibility.
- Backend validates one agenda field and one next-action field on Submit, writes the values to existing first columns and clears unused legacy columns 2/3. No schema migration or new sheet.
- When loading legacy reports, combine prior agenda entries into the single textarea and combine prior action entries with their dates in the single action textarea to retain their text. The first existing due date is preselected in the single due-date picker.

Implementation refs:
- Client commit / immutable Frontend pin: `ad55f12d49832a347ff8d8a20a94af618cb6a3ae`
- Backend single-field behavior commit: `e99dc4f05cf7c6ff6fe1bc380fb7e0c67426e037`
- Backend pin commit: `17c9279e47ac410a9a18d58c2402c9e2bc027f01`
- JavaScript syntax and static cross-file/legacy compatibility checks: PASS
- GAS Runtime, browser test, TEST deployment and UAT: NOT TESTED / PENDING
- Production: unchanged



## 22. MEETING-ONLINE — Full-width form fields and meeting-specific data behavior (2026-11-26)

User requested wider writing fields and clarified behavior when changing meeting number.

Implemented on `perf/perf-01-advisor-dashboard-load`:
- Form uses a single-column layout; each topic's textarea spans the full available content width.
- Textareas have a 150px minimum height and increased padding/line-height for readability.
- Follow-up tasks are stacked vertically; each task description occupies full width, with its due-date selector below.
- Each meeting report is retrieved and saved by the composite key `GROUP_ID + MEETING_NO`; switching meeting number loads the saved report for that specific meeting. If no report exists, the fields are cleared to a new blank form. Existing saved reports are not copied between meetings.
- Unsaved edits are detected before changing meeting number; browser confirmation warns that unsaved content will be discarded if the user proceeds. Cancel restores the previous meeting selection.

Source refs:
- Client commit / immutable Frontend pin: `81215bae9ffabdf59eca7b0d52e5082f1bdf8e19`
- Backend pin commit: `ea6ac4e227ca51762b8d5e8a67aa66beb3d85ae1`
- Styles commit: `65e4729baef41f67cd2e647c891fef78141ad383`
- Client and GAS syntax checks: PASS
- Static CSS/data-key/pin checks: PASS
- GAS Runtime, browser behavior, TEST deployment and UAT: NOT TESTED / PENDING
- Production: unchanged


## 24. STUDENT-MENU — Reorder student navigation (2026-11-26)

Approved menu order for STUDENT:
1. ข้อมูลของกลุ่ม
2. เอกสารโครงร่าง
3. บันทึกการเข้าพบที่ปรึกษา
4. รายงานความก้าวหน้า
5. งานกลุ่ม
6. ข้อเสนอแนะ
7. ประเมินเพื่อน

Removed `หัวข้อวิจัย` and `ผลการประเมิน` from the student navigation menu only; their existing frontend functionality/API has not been deleted. `ความก้าวหน้า` was renamed in the menu to `รายงานความก้าวหน้า`; `ประเมินเพื่อน A5` was shortened to `ประเมินเพื่อน`. Client retains old route labels as compatibility aliases.

Source refs:
- Backend menu order commit: `19217e33427d3028ff0fe910f5113e5d45f259dd`
- Client route/label commit / immutable Frontend pin: `bc52450ace9fa702ebafe42781b902c9d8da8171`
- Backend pin commit: `33a39fb1a1a43c10aa26bdfb2e053d96b9e475c3`
- Static menu order, route alias, and pin checks: PASS
- GAS Runtime, browser behavior, TEST deployment and UAT: NOT TESTED / PENDING
- Production: unchanged


## 25. ADVISOR-MEETING-DETAIL — Click to read submitted meeting reports (2026-11-26)

สถานะ: Implemented on PERF-01 branch; static validation PASS; GAS Runtime / TEST / UAT pending.

Source inspection findings:
- `MEETING_REPORTS` already stores the structured report content and review metadata; no new sheet/schema was required.
- Existing `apiListMeetingReports(token, groupId, meetingNo)` returns the latest report for the selected group and meeting number.
- That read API calls `requireSession_()` and `assertGroupAccess_()`. For ADVISOR, group access requires an active group and an approved `ADVISOR_ASSIGNMENTS` row matching the authenticated advisor user ID.
- Existing Advisor page already supported selecting group/meeting and rendering the report; the new matrix adds direct navigation from status cells.

Implementation:
- Added `apiAdvisorGetMeetingMonitoring(token)` as an Advisor-only, status-metadata endpoint. It returns only groups from `getAdvisorAssignedGroups_()` and status metadata for 7 planned meeting numbers; report content is not duplicated in this endpoint.
- Advisor page displays a compact status matrix. Statuses with an online report or legacy PDF are clickable; clicking selects the group and meeting, then loads details using the existing `apiListMeetingReports` and legacy PDF read API.
- Existing Student form, save/submit workflow, Advisor review actions, Admin-only monitoring API and schema remain unchanged.
- No database migration, new sheet, or production data change.

Files changed:
- `project/gas-source/code.gs`
- `project/frontend/Client.html`
- `project/frontend/Styles.html`

Commits:
- Advisor status API: `1fc654a831282ab4a26f75675228e429063d5c01`
- Client status matrix: `4c5ab251c2c1a2ac66f413b454f468111f2bd371`
- Styles: `f6c5594930d603e21a4a87ffa9c32dbafa34d211`
- Backend frontend-pin update: `21a82537ae71950c40edd9107a70c10281a8d1e7`
- Immutable Frontend pin: `4c5ab251c2c1a2ac66f413b454f468111f2bd371`

Verification:
- GAS backend syntax compile: PASS
- Client script syntax compile: PASS
- Static source checks for Advisor-only role gate, assigned-group source, status metadata only, click handler, reuse of existing report API and frontend pin: PASS
- GAS Runtime / Browser test: NOT TESTED
- TEST deployment: NOT DEPLOYED
- UAT: PENDING
- Production: UNCHANGED

Next Action: deploy approved branch to TEST only, verify Advisor sees only assigned groups, click each status and confirm report content, legacy PDF behavior, review controls, role denial for non-Advisor, and regression of Student save/submit and Admin monitoring; then UAT.


## Integration Checkpoint — Phase 2 Source Base

ปรับปรุงล่าสุด: 27 พฤศจิกายน 2026

### Source Base
- Integration branch: `integration/phase2-perf-topic-fixes`
- Technical base: `perf/perf-01-advisor-dashboard-load`
- Base commit: `87915a7a69ee636d22fa66080271e95e3f6e1d17`
- Integrated topic fix source: `feature/research-topic-lock-review`
- Research Topic source commit: `efc9a97b722081a6923a37738267c5796e634137`
- Integration commits: `765221fe9fea362ba02198222287463d12834354` (backend), `af655243ea8982fd9288e7a8f88899d137deca40` (frontend)

### Integrated Changes
- Backend: ported only `apiGetResearchTopicDraft` and `apiSaveResearchTopicDraft` from the Research Topic lock/review branch into the perf technical base.
- Draft timestamp fields are converted to serializable millisecond/string values before returning through `google.script.run`.
- Draft save now verifies persisted row identity/status and reads back saved values; response distinguishes verified save from mismatch.
- Frontend: ported verified-save handling and a read-back fallback to `apiGetResearchTopicDraft` when the save response is missing or not successful.
- Preserved the performance branch's Advisor/Meeting code; did not merge the topic branch wholesale.

### Validation
- Static source checks: PASS — one definition each for draft get/save functions; timestamp serialization and read-back verification present; frontend success/fallback handling present; Advisor Meeting and Topic review APIs remain present.
- Branch comparison against technical base: 3 commits ahead, 0 behind (2 source commits + 1 STATUS checkpoint); source changes are limited to `project/gas-source/code.gs` and `project/frontend/Client.html`.
- Runtime tests: NOT TESTED.
- TEST deployment / UAT: NOT STARTED.
- Production: NOT changed; no deployment performed.

### Next Action
1. Review the two-file diff on the integration branch.
2. Run syntax/static checks and regression tests against a TEST spreadsheet and TEST deployment.
3. Verify draft create/update, reload/read-back, duplicate save, invalid payload, leader-only permissions, and topic submit/review regression.
4. Complete UAT before proposing merge or deployment.


## CODE-MODULE-REFACTOR — Backend source organization (2026-11-27)

สถานะ: แยกไฟล์ Backend ใน branch เฉพาะเพื่อให้ดูแลรักษาง่ายขึ้น; ยังไม่ผ่าน GAS Runtime / TEST / UAT และยังไม่ merge หรือ deploy

### Source Base
- Base branch: `integration/phase2-perf-topic-fixes`
- Base commit: `802e5974a4ac9fe2efed61d4c6381cdcfab39957`
- Refactor branch: `refactor/phase2-code-modules`
- Branch comparison: 17 commits ahead, 0 behind (14 source-file commits + 3 STATUS checkpoint commits); source changes are `project/gas-source/code.gs` and 13 new numbered `.gs` modules, plus this STATUS update.

### Change Scope
- Replaced `project/gas-source/code.gs` implementation with a module-structure note.
- Split the original 2,775-line Backend source into 13 numbered `.gs` files by contiguous source ranges.
- Kept all 176 function definitions and all 84 API endpoint definitions; source slices reconstruct the original source exactly.
- No API names, schema, Spreadsheet structure, permissions, workflow, or function logic intentionally changed.
- `project/gas-source/setup.gs`, `project/frontend/Client.html`, `Index.html`, and `Styles.html` are unchanged (blob SHA comparison PASS).
- All `.gs` files share the Apps Script global namespace; function and global names must remain unique. File splitting is organizational and does not itself improve runtime performance.

### Static Validation
- Module source slices match the original source ranges exactly: PASS.
- Function inventory: 176 original / 176 split; duplicate function names: 0 — PASS.
- API inventory: 84 original / 84 split — PASS.
- Frontend literal `callApi()` references: 74; missing backend API definitions: 0 — PASS.
- JavaScript syntax parse for all 13 modules: PASS (each module parsed independently).
- GAS project compile / Runtime / TEST deployment / browser regression / UAT: NOT TESTED / NOT STARTED.
- Production data and deployment: UNCHANGED.

### Next Action
1. Pull this branch into a separate TEST Apps Script project or TEST copy; add all numbered `.gs` files while preserving the same project-wide global scope.
2. Run GAS syntax validation and verify `doGet`, `doPost`, authentication, group/advisor workflows, meetings, topic draft save/read-back, progress, assessment, tasks/notifications, and Admin endpoints.
3. Complete TEST regression and UAT before merge or deployment.


## 2026-11-27 — Phase 2 modular source bug fixes

- Working branch: `fix/phase2-student-menu-admin-overview`, based on `refactor/phase2-code-modules` (modular GAS source), not `main`.
- `project/gas-source/10_AuthAndUserAdministration.gs`: restored Student menu item `เสนอชื่อเรื่องงานวิจัย` before `เอกสารโครงร่าง`.
- `project/frontend/Client.html`: mapped the new menu label to existing `renderStudentTopics()`; Admin/System Admin overview now renders from dashboard metrics without calling the Advisor-only API.
- `project/gas-source/00_AppConfigAndEntry.gs`: updated immutable frontend pin to `24e5d56c2f56b214d74c93f0fb52b6b3ff203e4e`.
- `project/gas-source/code.gs` remains the small modular entry file; no monolithic backend logic was added there. `setup.gs` unchanged.
- Static validation: PASS for menu definition/order, route mapping, Admin branch before Advisor API, and matching pinned frontend commit.
- Runtime browser TEST/UAT: NOT TESTED. Apps Script TEST deployment/synchronization is still required before confirming behavior in the GitHub Pages embedded Web App.
- Database/schema changes: none. Production deployment: not performed.


## SOURCE BASELINE — Modular Backend Inventory (2026-11-27)

This section is the current file-organization baseline for continuing Phase 2 work. Use the exact branch and source snapshot below; do not reconstruct the module structure from older chat messages.

### Baseline refs
- Repository: `worrawutt-source/worrawutsportsci`
- Modular split branch: `refactor/phase2-code-modules`
- Modular split commit: `28203600734dd7fc48a334db0031cb9d2d94d335`
- Base integration commit recorded by the refactor: `802e5974a4ac9fe2efed61d4c6381cdcfab39957`
- Current working branch with the two UI fixes and updated source documentation: `fix/phase2-student-menu-admin-overview`
- Source snapshot after README corrections: `f9d390fc4dc7495b0d3e8e3ab07869a98c3b3c8a`
- This is a development branch; it is not merged to `main` or the integration branch and is not deployed.

### Backend inventory — `project/gas-source/`

There are 13 numbered backend modules plus `code.gs` and `setup.gs` (15 script files). All files share the Apps Script global namespace. Prefixes indicate logical responsibility only; do not rely on file load order. The following blob SHAs identify the source snapshot.

| File | Responsibility | Blob SHA |
|---|---|---|
| `00_AppConfigAndEntry.gs` | APP/SCHEMA/ROLE configuration, doGet/doPost, frontend rendering and GitHub loader; contains `FRONTEND_CONFIG` | `13704ef3af9d656b640a426fe3e1a8af31435a62` |
| `05_TestBootstrapAndRosterImport.gs` | TEST bootstrap and roster import helper | `e1268337190155973233adee1945e867d5dd143a` |
| `10_AuthAndUserAdministration.gs` | Registration/OTP, login/session API, dashboard, user and invitation administration, account status/password and audit/user administration | `6db12688c2734a465379386c879b1988345045b7` |
| `20_GroupManagement.gs` | Group and membership administration, leader, archive, student workspace and student-led group creation | `dc63b83e8cdb1fabcb751a1a977fdbe98960d17a` |
| `30_AdvisorManagement.gs` | Advisor nomination/approval, invitation and magic-link lifecycle, advisor assignment | `c653d7b9cff7967bbe0cb37ef579c63d603a8e4b` |
| `40_MeetingManagement.gs` | Meeting attendance/reports, advisor review, PDF upload/list, monitoring and meeting migration | `77589e1fb0bdc5c252c5729c00c194d4524c687b` |
| `50_Assessment.gs` | Assessment window, A4, peer assessment, core score entry and reports | `8e1a02e15d9b545af155bc35b68009f4a0488be9` |
| `60_ProgressManagement.gs` | Milestone/week plan, progress-week settings, admin monitoring/review and migration | `d767b899382c5d4e63895f038bb9e5e8f571536a` |
| `70_ResearchTopicProposal.gs` | Research-topic draft/read/save/submit, advisor topic review, notifications and proposal PDF | `3ca6fefa041cc3b85edb80c50700669028c5cc59` |
| `80_WorkspaceFeedbackAndMigrations.gs` | Collaborative progress draft/submission, advisor feedback, Phase 2 additive migrations, revision deadlines/extensions and date formatting | `62eb5abeeabe9d7fb1557e00a04ee3fb90ef999c` |
| `90_TasksNotificationsMonitoring.gs` | Group tasks/comments, notification queue/digest, triggers, early warnings, grade release and ethics tracking | `dfacf92142a6cba1c33e9e725d5fccbc2f455447` |
| `95_SystemSettingsAndAccess.gs` | System settings, registration toggle, workflow migration, access checks, assessment settings and score persistence helpers | `48b1f6a9ace6cd11a1168e60794a3b2459cf086e` |
| `99_DatabaseAndSecurityCore.gs` | Spreadsheet access/read/write/cache helpers, user creation, password/token hashing, OTP/email validation, sessions and audit logging | `a928d8ced9c8538af3bad57e65a7f0d18becce66` |
| `code.gs` | Module structure note only; no backend function definitions | `bedaec5330aba961c87f694b655d545f569a1012` |
| `setup.gs` | Protected safety guard and read-only configuration diagnostics; do not modify or run disabled setup/recovery routines | `299203df5478e0a220c7dda6c2b57f7df7c4ca23` |

### Frontend inventory — `project/frontend/`

| File | Responsibility | Blob SHA |
|---|---|---|
| `Index.html` | HTML application shell and insertion markers | `0f5399fd256f845a1125522bd96e181e89c4a03b` |
| `Styles.html` | CSS/style definitions | `4d06d0092f6540a17630d5674449e1209dfec46a` |
| `Client.html` | Browser-side API caller, dashboard navigation and UI rendering; contains the Admin overview and Student topic-menu fixes | `8255aac2dab6273ac4915b69d7876d7886b119d9` |
| `README.md` | Frontend loader contract and publish notes; corrected to identify the modular loader file | `99542c02d6b55db60bda09461dda9e1c06bbea19` |

### Loader and deployment relationship
- `FRONTEND_CONFIG.COMMIT_SHA` is in `project/gas-source/00_AppConfigAndEntry.gs`, not `code.gs`.
- The pinned frontend commit for this snapshot is `24e5d56c2f56b214d74c93f0fb52b6b3ff203e4e`.
- The loader fetches the frontend by immutable commit SHA; GitHub edits alone do not update an existing Apps Script deployment.
- `project/gas-source/README.md` and `project/frontend/README.md` were corrected to match the modular structure and loader location.

### Current source fixes included in this baseline
- Student menu label `เสนอชื่อเรื่องงานวิจัย` is placed before `เอกสารโครงร่าง` in `10_AuthAndUserAdministration.gs` and routed to the existing `renderStudentTopics()`.
- Admin/System Admin overview renders from dashboard metrics and avoids the Advisor-only `apiGetAdvisorWorkspaceSummary` call in `Client.html`.
- No database/schema changes. `setup.gs` unchanged. No production deployment.

### Validation and limits
- Earlier modular refactor static validation recorded: 176 function definitions retained, 84 API definitions retained, no duplicate function names, 74 frontend `callApi()` references with no missing API definitions; source slices matched the original ranges.
- Current baseline rechecked: file inventory and blob SHAs fetched from GitHub; menu order, frontend route, Admin role guard and frontend pin verified by static source inspection.
- GAS runtime compile, TEST deployment, browser regression and UAT: NOT TESTED.
- Production data/deployment: unchanged.

### Next-work rule
Start from `fix/phase2-student-menu-admin-overview` and this snapshot. Before any change, inspect current branch/commit and the relevant module/caller. Preserve all modules, keep changes minimal, update this STATUS section only when the baseline changes, and do not treat static PASS as Runtime/UAT PASS.


## 2026-11-27 — Frontend render-race guard and TEST loader pin

### Change scope
- Branch: `fix/phase2-student-menu-admin-overview`
- Frontend source commit: `5e6e9f1760bf98490807e64da0fa87433def826b`
- Frontend file: `project/frontend/Client.html`
- Frontend blob SHA: `a538124565d691fc018ccc475806856aa1ff85fe`
- Loader source commit: `29ed43dd1bd35766e3ddeda39e6364717fcbd3cd`
- Loader module: `project/gas-source/00_AppConfigAndEntry.gs`
- Loader blob SHA: `57320856155b129da6762906cd3157b3fe2f8a3f`
- `FRONTEND_CONFIG.COMMIT_SHA` now pins exactly `5e6e9f1760bf98490807e64da0fa87433def826b`.

### Frontend race prevention
- Added a serialized menu-render queue and monotonically increasing request ID. If multiple menu clicks happen while a prior renderer awaits API responses, stale queued requests are skipped; the newest selected menu is rendered after the active render finishes.
- Added a dashboard-load request ID. A late dashboard response from an older login/session-restore request is ignored instead of replacing the current dashboard.
- Preserved existing menu dispatch and renderer functions; no new API, role, workflow or database behavior.
- Existing topic-menu route and Admin/System Admin overview guard remain in the pinned Frontend commit.

### Static checks
- Client source fetched from GitHub at the recorded commit and checked for balanced delimiters: PASS.
- Exactly one `renderDashboard()` and one `loadDashboard()` definition: PASS.
- Menu render queue and stale dashboard response guard present: PASS.
- Loader pin matches the immutable Frontend commit: PASS.
- Database/schema changes: none. `setup.gs`: unchanged.

### Apps Script TEST synchronization
- TEST Apps Script project source sync: BLOCKED / NOT PERFORMED in this chat. Available connected actions permit GitHub source edits but do not provide an Apps Script editor or TEST project write/deploy action. Do not report this source commit as synced or deployed.
- Exact file to sync into the existing TEST Apps Script project: `project/gas-source/00_AppConfigAndEntry.gs` from this branch. Keep all other modular `.gs` files and `setup.gs` unchanged.
- After saving that module in TEST, create a new TEST deployment and verify: Student topic menu does not show meeting attendance content; Admin/System Admin overview does not call Advisor-only API; rapidly switching menus does not allow stale content to overwrite the selected page.
- Runtime browser TEST/UAT and Apps Script deployment: NOT TESTED. Production unchanged.

### Next action
Sync the pinned loader module into the existing TEST Apps Script project, save and deploy TEST only, then run the above role/menu regression checks. Record the deployment version and test evidence here; do not promote to production without explicit approval.

## 2026-11-27 — Course Coordinator Dashboard summary implementation (TEST source only)

### Change scope
- Branch: `fix/phase2-student-menu-admin-overview`
- Purpose: replace the Admin overview's user/session metrics with a course operations dashboard using actual group, advisor, progress, meeting, task, warning, due-date, and assessment records.
- Frontend commit pinned by GAS: `25617c28ae48560f961f432acd1f9223c866cc22`
- Loader update commit: `c0c3783542dbf0d0a6ef8ee11df8bbfdead30a37`
- Backend summary API commit chain: `7d75bd6346f5a6e05abe55011903c08f5c48ec0a`, `220a3ad524efd53c2877f8d700cca562a4c02ddd`, `cd69b4670c03db31017b2922b0fa0f029a545cba`

### Files changed
- `project/frontend/Client.html` — replaced the Admin overview renderer with Course Coordinator Dashboard: actionable items, separate advisor nomination/approval states, activity 1 meeting and progress reporting, searchable group status, configured due-date calendar, and A1–A5 assessment completion summary.
- `project/frontend/Styles.html` — added responsive dashboard styles.
- `project/gas-source/90_TasksNotificationsMonitoring.gs` — added `apiAdminGetCoordinatorDashboard(token)`. It returns status-only operational fields and does not return progress narratives, advisor feedback, meeting review comments, Drive URLs, file metadata, or student personal details. The summary reads existing sheets and does not invoke the progress helper that can seed week settings.
- `project/gas-source/00_AppConfigAndEntry.gs` — updated `FRONTEND_CONFIG.COMMIT_SHA` to the immutable frontend commit above.
- `project/gas-source/README.md` — updated source/pin documentation.

### Static validation
- Backend `90_TasksNotificationsMonitoring.gs` JavaScript syntax: PASS.
- Frontend `Client.html` JavaScript syntax: PASS.
- Coordinator API definition count: 1.
- Frontend call to `apiAdminGetCoordinatorDashboard`: 1.
- Frontend pin in `00_AppConfigAndEntry.gs` matches the frontend commit: PASS.
- GAS runtime compile, Spreadsheet-backed execution, browser TEST, regression and UAT: NOT TESTED.
- Database/schema changes: none. `setup.gs`: unchanged. Production data and deployment: unchanged.

### GAS TEST synchronization
The following existing modular GAS files must be updated in the existing TEST Apps Script project:
1. `project/gas-source/90_TasksNotificationsMonitoring.gs` — add the coordinator summary API.
2. `project/gas-source/00_AppConfigAndEntry.gs` — update the immutable frontend loader pin.

Do not copy `Client.html` or `Styles.html` into GAS; the loader fetches them from GitHub at the pinned SHA. Keep all other modules and `setup.gs` unchanged. After saving the two modules, authorize the existing external-request scope if required, create a new TEST deployment, and run role/menu, action counts, due-date, assessment-window and privacy checks. Runtime TEST/UAT and deployment remain NOT TESTED / NOT PERFORMED.
