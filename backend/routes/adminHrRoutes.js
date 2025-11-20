// backend/routes/adminHrRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

// 🟩 Proper Model Import
const User = require("../models/userModel");
const Attendance = require("../models/attendanceModel");

// 🟩 Proper Middlewares
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");


// ======================================================
// 🔵 CREATE HR
// POST /api/admin/hr/create
// ======================================================
router.post("/create", auth, adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      department,
      designation,
      company,
      shift,
      timeIn,
    } = req.body;

    if (!name || !mobile || !designation) {
      return res
        .status(400)
        .json({ error: "Name, mobile & designation required" });
    }

    // Auto HR ID Generate
    const hrPrefix = "HR";
    let empId;

    while (true) {
      const randomId = `${hrPrefix}${Math.floor(10000 + Math.random() * 90000)}`;
      const exists = await User.findOne({ empId: randomId });
      if (!exists) {
        empId = randomId;
        break;
      }
    }

    // Auto password
    const plainPassword = `P${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const newHR = new User({
      name,
      mobile,
      email,
      department,
      designation,
      company: company || "Homzon Excel Services Pvt. Ltd.",
      shift,
      timeIn,
      role: "hr",
      empId,
      passwordHash,
      isActive: true,
    });

    await newHR.save();

    res.json({
      success: true,
      message: "HR Created Successfully",
      hr: newHR,
      password: plainPassword,
    });
  } catch (error) {
    console.error("❌ HR Create Error:", error);
    res.status(500).json({ error: "Server Error While Creating HR" });
  }
});


// ======================================================
// 🔵 GET ALL HRs (Active + Inactive)
// GET /api/admin/hr/list
// ======================================================
router.get("/list", auth, adminMiddleware, async (req, res) => {
  try {
    const list = await User.find({ role: "hr" })
      .select("-passwordHash")
      .sort({ name: 1 });

    res.json(list);
  } catch (error) {
    console.error("❌ HR List Error:", error);
    res.status(500).json({ error: "Server Error Fetching HR List" });
  }
});


// ======================================================
// 🔵 SOFT DELETE HR (Deactivate)
// PATCH /api/admin/hr/soft-delete/:id
// ======================================================
router.patch("/soft-delete/:id", auth, adminMiddleware, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select("-passwordHash");

    if (!updated) return res.status(404).json({ error: "HR Not Found" });

    res.json({ success: true, hr: updated });
  } catch (error) {
    console.error("❌ Soft Delete Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});


// ======================================================
// 🔵 RE-ACTIVATE HR
// PATCH /api/admin/hr/reactivate/:id
// ======================================================
router.patch("/reactivate/:id", auth, adminMiddleware, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select("-passwordHash");

    if (!updated) return res.status(404).json({ error: "HR Not Found" });

    res.json({ success: true, hr: updated });
  } catch (error) {
    console.error("❌ Reactivate Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});


// ======================================================
// 🔴 PERMANENT DELETE HR
// DELETE /api/admin/hr/delete/:id
// ======================================================
router.delete("/delete/:id", auth, adminMiddleware, async (req, res) => {
  try {
    const hr = await User.findById(req.params.id);

    if (!hr) return res.status(404).json({ error: "HR Not Found" });

    if (hr.role === "admin") {
      return res.status(403).json({ error: "Admin Cannot Be Deleted" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "HR Deleted Successfully" });
  } catch (error) {
    console.error("❌ Permanent Delete Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});


// ======================================================
// 🔵 DAILY ATTENDANCE FOR ALL HR (Admin View)
// GET /api/admin/hr/attendance/today
// ======================================================
router.get("/attendance/today", auth, adminMiddleware, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const hrs = await User.find({ role: "hr" })
      .select("_id name empId timeIn company department designation mobile isActive");

    const hrIds = hrs.map((h) => h._id);

    const attendanceList = await Attendance.find({
      employee: { $in: hrIds },
      date: { $gte: start, $lte: end },
    });

    const map = {};
    attendanceList.forEach((a) => (map[a.employee] = a));

    const result = hrs.map((hr) => ({
      ...hr.toObject(),
      attendance: map[hr._id] || null,
    }));

    res.json(result);
  } catch (error) {
    console.error("❌ Attendance Fetch Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});


// ======================================================
// 🔵 ADMIN MARKS TIME-IN MANUALLY
// POST /api/admin/hr/attendance/mark/:hrId
// ======================================================
router.post(
  "/attendance/mark/:hrId",
  auth,
  adminMiddleware,
  async (req, res) => {
    try {
      const { hrId } = req.params;
      const { timeIn } = req.body;

      if (!timeIn) return res.status(400).json({ error: "TimeIn Required" });

      const hr = await User.findById(hrId);
      if (!hr) return res.status(404).json({ error: "HR Not Found" });

      const toMin = (t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      const scheduled = hr.timeIn ? toMin(hr.timeIn) : null;
      const actual = toMin(timeIn);

      const isLate =
        scheduled !== null && actual > scheduled + 1 ? true : false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let record = await Attendance.findOne({
        employee: hrId,
        date: { $gte: today, $lte: new Date() },
      });

      if (record) {
        record.timeIn = timeIn;
        record.isLate = isLate;
        await record.save();
      } else {
        record = new Attendance({
          employee: hrId,
          date: new Date(),
          timeIn,
          status: "Present",
          isLate,
        });
        await record.save();
      }

      res.json({ success: true, attendance: record, late: isLate });
    } catch (error) {
      console.error("❌ Manual Mark Error:", error);
      res.status(500).json({ error: "Server Error" });
    }
  }
);

module.exports = router;
