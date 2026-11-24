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
