// routes/attendanceRoutes.js

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// ⭐ FIX 1: Require the controller to use the functions defined there
const attendanceController = require("../controllers/attendanceController"); 

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret"; 

// -----------------------------------------------------------
// ✅ Model Retrieval (Schema definition removed as it's in server.js)
// -----------------------------------------------------------
const Attendance = mongoose.models.Attendance || mongoose.model("Attendance");
const User = mongoose.models.User || mongoose.model("User");


// -----------------------------------------------------------
// ✅ Middleware (Authentication and Safe Wrapper)
// -----------------------------------------------------------
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header) return res.status(401).json({ error: "No token provided" });
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

const safe = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


// -----------------------------------------------------------
// 1. GET /api/attendance?date=yyyy-mm-dd (Daily List)
// -----------------------------------------------------------
// ⭐ FIX 2: Daily Attendance now calls the controller function
router.get("/", auth, safe(attendanceController.getAttendanceByDate));


// -----------------------------------------------------------
// 2. POST /api/attendance (Marking/Updating)
// -----------------------------------------------------------
// ⭐ FIX 3: Create/Update Attendance now calls the controller function
router.post("/", auth, safe(attendanceController.createOrUpdateAttendance));


// -----------------------------------------------------------
// 3. DELETE /api/attendance/:id (Delete Record - Only HR/Admin)
// NOTE: Logic moved inline as it's simple & role-specific
// -----------------------------------------------------------
router.delete(
    "/:id",
    auth,
    safe(async (req, res) => {
        if (!["hr", "admin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Only HR/Admin can delete attendance records." });
        }
        
        const { id } = req.params;
        const deletedAtt = await Attendance.findByIdAndDelete(id);

        if (!deletedAtt) {
            return res.status(404).json({ error: "Attendance record not found." });
        }

        res.json({ success: true, message: "Attendance record deleted successfully." });
    })
);


// -----------------------------------------------------------
// 📊 4. ATTENDANCE SUMMARY REPORT
// GET /api/attendance/reports/attendance-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// -----------------------------------------------------------
// ⭐ CRITICAL FIX 4: Call the controller function for the report
router.get("/reports/attendance-summary", auth, safe(attendanceController.getAttendanceSummaryReport));

// -----------------------------------------------------------
// 5. PUT /api/attendance/:id - Update attendance status (HR only)
// -----------------------------------------------------------
router.put("/:id", auth, safe(attendanceController.updateAttendance));


module.exports = router;
