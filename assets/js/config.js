/**
 * Worrawut Academic Portal Configuration
 * Centralized endpoint mapping for Google Apps Script Web Apps and routes
 */

const APP_CONFIG = {
  // URLs สำหรับ Google Apps Script Web Apps
  webApps: {
    labBooking: "https://script.google.com/macros/s/YOUR_LAB_BOOKING_ID/exec",
    fitnessAthlete: "https://script.google.com/macros/s/YOUR_FITNESS_ATHLETE_ID/exec",
    fitnessGeneral: "https://script.google.com/macros/s/YOUR_FITNESS_GENERAL_ID/exec",
    onlineExam: "https://script.google.com/macros/s/YOUR_EXAM_ID/exec",
    attendance: "https://script.google.com/macros/s/YOUR_ATTENDANCE_ID/exec"
  },

  // ข้อมูลเมตาและลิงก์ติดต่อ
  siteMeta: {
    facultyName: "Sport & Exercise Science, Uttaradit Rajabhat University",
    departmentUrl: "https://sci.uru.ac.th"
  }
};
