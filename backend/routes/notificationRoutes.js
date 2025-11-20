const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const User = require("../models/User");

/* =====================================================
   🔔 NOTIFICATION ROUTES
===================================================== */

/* =====================================================
   🔔 GET NOTIFICATIONS FOR SUPERVISOR
===================================================== */
router.get("/supervisor/:supervisorId", async (req, res) => {
  try {
    const { supervisorId } = req.params;

    const notifications = await Notification.find({
      userId: supervisorId,
      seen: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("❌ Error fetching supervisor notifications:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🔔 GET NOTIFICATIONS FOR EMPLOYEE
===================================================== */
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    const notifications = await Notification.find({
      userId: employeeId,
      seen: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("❌ Error fetching employee notifications:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🔔 GET NOTIFICATIONS FOR HR
===================================================== */
router.get("/hr", async (req, res) => {
  try {
    // Get all HR user IDs and fetch their notifications
    const hrUsers = await User.find({ role: "hr" }).select('_id').lean();
    const hrUserIds = hrUsers.map(hr => hr._id.toString());

    const notifications = await Notification.find({
      userId: { $in: hrUserIds },
      seen: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("❌ Error fetching HR notifications:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🔔 GET NOTIFICATIONS FOR ADMIN
===================================================== */
router.get("/admin", async (req, res) => {
  try {
    // Assuming Admin role is "ADMIN"
    const notifications = await Notification.find({
      userId: "ADMIN",
      seen: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("❌ Error fetching admin notifications:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🔔 MARK NOTIFICATION AS SEEN
===================================================== */
router.put("/seen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true, message: "Notification marked as seen" });
  } catch (err) {
    console.error("❌ Error marking notification seen:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

module.exports = router;
