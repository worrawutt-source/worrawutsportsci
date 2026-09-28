/**
 * Worrawut Academic Portal Configuration
 * Centralized endpoint mapping for Google Apps Script Web Apps and routes
 */

const APP_CONFIG = {
  // URLs สำหรับ Google Apps Script Web Apps
  webApps: {
    labBooking: "https://script.google.com/macros/s/AKfycbzcK0F-MyKMDsIf-7wG2_--lvi2nXg6My2cryzFCH3Y74CkjmDZvaJVCn5XPa05w4ODZw/exec",
    fitnessAthlete: "https://script.google.com/macros/s/AKfycbwLoiLPVnLndSG8ema3ezaF-9duE2hEXI8d_zy8aTtUKGDn7c-E_BCblBa1HuqxfcsoQA/exec",
    fitnessGeneral: "https://script.google.com/macros/s/AKfycbyrgUBx4_SFQFfHvzPlgBr6X7hQp0mpaz-qx7suc7SobP_OZKyZXj0UM-U-o_khGsFf/exec",
    onlineExam: "https://script.google.com/macros/s/AKfycbzDVjKZPapwjRTH5lEJWQOFxY7ZXqRNo60mFZM_zRCIa-SmuqUrMwTXBctV6MrJd6E/exec",
    attendance: "" // รอนำมาใส่เพิ่มเติมภายหลัง
  },

  // ข้อมูลเมตาและลิงก์ติดต่อ
  siteMeta: {
    facultyName: "Sport & Exercise Science, Uttaradit Rajabhat University",
    departmentUrl: "https://sci.uru.ac.th"
  }
};
