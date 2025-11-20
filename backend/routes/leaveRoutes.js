const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const LeaveRequest = require("../models/LeaveRequest");
const Notification = require("../models/Notification");
const User = require("../models/User");

/* =====================================================
   🧾 APPLY FOR LEAVE  (EMPLOYEE)
===================================================== */
router.post("/apply", auth, async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      supervisorId,
      supervisorName,
      fromDate,
      toDate,
      reason,
    } = req.body;

    if (!employeeId || !fromDate || !toDate || !reason || !supervisorId) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all required fields" });
    }

    // Find supervisor by ObjectId (since supervisorId is ObjectId string from login)
    let supervisorUser = null;
    if (supervisorId) {
      supervisorUser = await User.findById(supervisorId);
      if (!supervisorUser || supervisorUser.role !== "supervisor") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid supervisor ID" });
      }
    }

    // ✅ Create new leave record
    const leave = new LeaveRequest({
      employee: req.user.id, // Use id from JWT
      supervisor: supervisorUser ? supervisorUser._id : null, // Use ObjectId from User model
      employeeId,
      employeeName,
      supervisorId,
      supervisorName,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: "Pending",
      isSeenBySupervisor: false, // 🔔 For supervisor notification
      createdAt: new Date(),
    });

    await leave.save();

    // ✅ If supervisor assigned, create notification
    if (supervisorId) {
      await Notification.create({
        userId: supervisorId,
        type: "Leave",
        message: `${employeeName} applied for leave (${fromDate} → ${toDate})`,
        relatedId: leave._id,
        seen: false,
        createdAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: "Leave applied successfully",
      leave,
    });
  } catch (err) {
    console.error("❌ Error applying leave:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🧾 GET LEAVE REQUESTS - SUPERVISOR VIEW
===================================================== */
router.get("/supervisor/:supervisorId", async (req, res) => {
  try {
    const { supervisorId } = req.params;

    const leaves = await LeaveRequest.find({ supervisorId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, leaves });
  } catch (err) {
    console.error("❌ Error fetching leave data:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🧾 GET LEAVE STATUS - EMPLOYEE VIEW
===================================================== */
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    const leaves = await LeaveRequest.find({ employeeId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, leaves });
  } catch (err) {
    console.error("❌ Error fetching employee leave data:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🧾 APPROVE / REJECT LEAVE REQUEST (Supervisor)
===================================================== */
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role, approverName } = req.body;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    // ✅ Update leave record for supervisor approval
    const updateData = {
      status,
      isSeenBySupervisor: true,
      supervisorApproved: status === "Approved",
    };

    const updated = await LeaveRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found" });
    }

    if (status === "Approved") {
      // Notify HR - Get actual HR user IDs
      const hrUsers = await User.find({ role: "hr" }).select('_id').lean();
      for (const hr of hrUsers) {
        await Notification.create({
          userId: hr._id.toString(),
          type: "Leave",
          message: `${updated.employeeName}'s leave (${updated.fromDate} → ${updated.toDate}) approved by supervisor. Pending HR approval.`,
          relatedId: updated._id,
          seen: false,
          createdAt: new Date(),
        });
      }
    }

    // ✅ Notify employee of supervisor update
    await Notification.create({
      userId: updated.employeeId,
      type: "Leave",
      message: `Your leave (${updated.fromDate} → ${updated.toDate}) was ${status.toLowerCase()} by supervisor ${
        approverName || role
      }.`,
      relatedId: updated._id,
      seen: false,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Leave ${status.toLowerCase()} by supervisor successfully`,
      updated,
    });
  } catch (err) {
    console.error("❌ Error updating leave:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🧾 GET LEAVES FOR HR (Approved by Supervisor)
===================================================== */
router.get("/hr", async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({
      supervisorApproved: true,
      hrApproved: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, leaves });
  } catch (err) {
    console.error("❌ Error fetching HR leaves:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🧾 HR APPROVE / REJECT LEAVE REQUEST
===================================================== */
router.put("/hr/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments, approverName } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const updateData = {
      hrApproved: status === "Approved",
      hrComments: comments,
      hrApprovedAt: new Date(),
    };

    if (status === "Rejected") {
      updateData.status = "Rejected";
    }

    const updated = await LeaveRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found" });
    }

    if (status === "Approved") {
      // Notify Admin
      await Notification.create({
        userId: "ADMIN", // Assuming Admin role
        type: "Leave",
        message: `${updated.employeeName}'s leave (${updated.fromDate} → ${updated.toDate}) approved by HR. Pending Admin approval.`,
        relatedId: updated._id,
        seen: false,
        createdAt: new Date(),
      });
    }

    // Notify employee
    await Notification.create({
      userId: updated.employeeId,
      type: "Leave",
      message: `Your leave (${updated.fromDate} → ${updated.toDate}) was ${status.toLowerCase()} by HR ${
        approverName
      }.${comments ? ` Comments: ${comments}` : ""}`,
      relatedId: updated._id,
      seen: false,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Leave ${status.toLowerCase()} by HR successfully`,
      updated,
    });
  } catch (err) {
    console.error("❌ Error updating leave by HR:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🧾 GET LEAVES FOR ADMIN (Approved by HR)
===================================================== */
router.get("/admin", async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({
      hrApproved: true,
      adminApproved: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, leaves });
  } catch (err) {
    console.error("❌ Error fetching Admin leaves:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🧾 ADMIN APPROVE / REJECT LEAVE REQUEST
===================================================== */
router.put("/admin/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments, approverName } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const updateData = {
      adminApproved: status === "Approved",
      adminComments: comments,
      adminApprovedAt: new Date(),
      status: status,
    };

    const updated = await LeaveRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found" });
    }

    // Notify employee of final decision
    await Notification.create({
      userId: updated.employeeId,
      type: "Leave",
      message: `Your leave (${updated.fromDate} → ${updated.toDate}) was ${status.toLowerCase()} by Admin ${
        approverName
      }.${comments ? ` Comments: ${comments}` : ""}`,
      relatedId: updated._id,
      seen: false,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Leave ${status.toLowerCase()} by Admin successfully`,
      updated,
    });
  } catch (err) {
    console.error("❌ Error updating leave by Admin:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

/* =====================================================
   🧾 MARK NOTIFICATION AS SEEN
===================================================== */
router.put("/seen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await LeaveRequest.findByIdAndUpdate(id, { isSeenBySupervisor: true });
    res.json({ success: true, message: "Notification marked as seen" });
  } catch (err) {
    console.error("❌ Error marking notification seen:", err);
    res
      .status(500)
      .json({ success: false, error: err.message || "Server error" });
  }
});

module.exports = router;
