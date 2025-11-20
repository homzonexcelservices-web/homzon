const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const auth = require("../middleware/auth");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const fs = require("fs");


// Get assigned employees with HR time-in for today
router.get("/today", auth, async (req, res) => {
    try {
        const supervisorId = req.user._id;
        const employees = await Employee.find({ supervisor: supervisorId });

        // Map each employee to attendance object for today
        const today = new Date();
        const attendanceList = await Promise.all(
            employees.map(async (emp) => {
                const existing = await Attendance.findOne({
                    employee: emp._id,
                    date: {
                        $gte: new Date(today.setHours(0, 0, 0, 0)),
                        $lte: new Date(today.setHours(23, 59, 59, 999))
                    }
                });
                return {
                    employeeId: emp._id,
                    name: emp.name,
                    company: emp.companyName || "N/A",
                    department: emp.department || "N/A",
                    designation: emp.designation || "N/A",
                    timeIn: emp.hrTimeIn || "09:00", // HR ne set kiya
                    status: existing ? existing.status : "Absent",
                    late: existing ? existing.late : false
                };
            })
        );

        res.json(attendanceList);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// routes/attendance.js
router.post("/submit", auth, async (req, res) => {
    try {
        const supervisorId = req.user._id;
        const records = req.body; // array of { employeeId, status }

        const today = new Date();
        const submissions = await Promise.all(
            records.map(async (rec) => {
                const emp = await Employee.findById(rec.employeeId);
                if (!emp) return null;

                // HR time-in
                const hrTime = new Date(emp.hrTimeIn);
                const now = new Date();

                // Calculate late
                const late = now - hrTime > 60000; // 1 min
                // Auto status update
                let status = rec.status;
                if (!rec.status || rec.status === "Absent") {
                    status = "Absent";
                } else if (late && rec.status === "Present") {
                    status = "HalfDay";
                }

                const attendance = new Attendance({
                    employee: emp._id,
                    supervisor: supervisorId,
                    date: today,
                    timeIn: now,
                    status,
                    late
                });
                return attendance.save();
            })
        );

        res.json({ message: "Attendance submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// routes/attendance.js
router.get("/summary/:month/:year", auth, async (req, res) => {
    try {
        const { month, year } = req.params; // month: 1-12, year: 2025
        const supervisorId = req.user._id;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Fetch all attendance for employees under this supervisor
        const employees = await Employee.find({ supervisor: supervisorId });

        const summary = await Promise.all(
            employees.map(async (emp) => {
                const records = await Attendance.find({
                    employee: emp._id,
                    date: { $gte: startDate, $lte: endDate }
                });

                const count = { Present: 0, Absent: 0, HalfDay: 0, PaidLeave: 0, Late: 0 };
                records.forEach(r => {
                    count[r.status] = (count[r.status] || 0) + 1;
                    if (r.late) count.Late += 1;
                });

                return {
                    employeeId: emp._id,
                    name: emp.name,
                    company: emp.companyName || "N/A",
                    department: emp.department || "N/A",
                    designation: emp.designation || "N/A",
                    ...count
                };
            })
        );

        res.json(summary);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/export/:month/:year", auth, async (req, res) => {
    // ... ye pura route wahi jo maine last message me diya
});


// Submit attendance
router.post("/submit", auth, async (req, res) => {
    try {
        const supervisorId = req.user._id;
        const records = req.body; // array of { employeeId, status }

        const today = new Date();
        const submissions = await Promise.all(
            records.map(async (rec) => {
                const emp = await Employee.findById(rec.employeeId);
                if (!emp) return null;

                // Calculate late
                const hrTime = new Date(emp.hrTimeIn);
                const now = new Date();
                const late = now - hrTime > 60000; // 1 min = 60000ms

                // Save attendance
                const attendance = new Attendance({
                    employee: emp._id,
                    supervisor: supervisorId,
                    date: today,
                    timeIn: now,
                    status: rec.status,
                    late
                });
                return attendance.save();
            })
        );

        res.json({ message: "Attendance submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/download/:month/:year", auth, async (req, res) => {

module.exports = router;
