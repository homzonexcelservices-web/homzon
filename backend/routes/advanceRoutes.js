const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const AdvanceRequest = require("../models/AdvanceRequest");
const Notification = require("../models/Notification");
const User = require("../models/User");

/* =====================================================
   💰 ADVANCE REQUEST ROUTES
   - Employee applies for advance
   - Supervisor views and updates requests
   - Notification for supervisor + employee
===================================================== */

/* =====================================================
   🧾 APPLY FOR ADVANCE (Employee)
===================================================== */
router.post("/apply", auth, async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      supervisorId,
      supervisorName,
      amount,
      reason,
    } = req.body;

    if (!employeeId || !amount || !reason || !supervisorId) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Find supervisor by ObjectId (since supervisorId is ObjectId string from login)
    let supervisorUser = null;
    if (supervisorId) {
      supervisorUser = await User.findById(supervisorId);
      if (!supervisorUser || supervisorUser.role !== "supervisor") {
        return res.status(400).json({
          success: false,
          message: "Invalid supervisor ID",
        });
      }
    }

    // ✅ Create new advance request
    const adv = new AdvanceRequest({
      employee: req.user.id, // Use id from JWT
      supervisor: supervisorUser ? supervisorUser._id : null, // Use ObjectId from User model
      employeeId,
      employeeName,
      supervisorId,
      supervisorName,
      amount,
      reason,
      status: "Pending",
      isSeenBySupervisor: false, // 🔔 Supervisor alert
      createdAt: new Date(),
    });

    await adv.save();

    // ✅ Notify supervisor (if assigned)
    if (supervisorId) {
      await Notification.create({
        userId: supervisorId,
        type: "Advance",
        message: `${employeeName} applied for ₹${amount} advance.`,
        relatedId: adv._id,
        seen: false,
        createdAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: "Advance applied successfully",
      adv,
    });
  } catch (err) {
    console.error("❌ Error while applying advance:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   🧾 GET ALL ADVANCE REQUESTS (Supervisor)
===================================================== */
router.get("/supervisor/:supervisorId", async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const advances = await AdvanceRequest.find({ supervisorId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, advances });
  } catch (err) {
    console.error("❌ Error fetching advance requests:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   🧾 GET ALL ADVANCE REQUESTS (Employee View)
===================================================== */
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const advances = await AdvanceRequest.find({ employeeId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, advances });
  } catch (err) {
    console.error("❌ Error fetching employee advances:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   🧾 UPDATE STATUS (Supervisor Approve / Reject)
===================================================== */
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role, approverName } = req.body;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updateData = {
      status,
      isSeenBySupervisor: true,
      supervisorApproved: status === "Approved",
    };

    const updated = await AdvanceRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Advance request not found",
      });
    }

    if (status === "Approved") {
      // Notify HR - Get actual HR user IDs
      const hrUsers = await User.find({ role: "hr" }).select('_id').lean();
      for (const hr of hrUsers) {
        await Notification.create({
          userId: hr._id.toString(),
          type: "Advance",
          message: `${updated.employeeName}'s advance request of ₹${updated.amount} approved by supervisor. Pending HR approval.`,
          relatedId: updated._id,
          seen: false,
          createdAt: new Date(),
        });
      }
    }

    // ✅ Notify employee about supervisor update
    await Notification.create({
      userId: updated.employeeId,
      type: "Advance",
      message: `Your advance request of ₹${updated.amount} was ${status.toLowerCase()} by supervisor ${
        approverName || role
      }.`,
      relatedId: updated._id,
      seen: false,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Advance ${status.toLowerCase()} by supervisor successfully`,
      updated,
    });
  } catch (err) {
    console.error("❌ Error updating advance request:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   🧾 GET ADVANCES FOR HR (Approved by Supervisor)
===================================================== */
router.get("/hr", async (req, res) => {
  try {
    const advances = await AdvanceRequest.find({
      supervisorApproved: true,
      hrApproved: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, advances });
  } catch (err) {
    console.error("❌ Error fetching HR advances:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   🧾 HR APPROVE / REJECT / MODIFY ADVANCE REQUEST
===================================================== */
router.put("/hr/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, modifiedAmount, comments, approverName } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updateData = {
      hrApproved: status === "Approved",
      hrComments: comments,
      hrApprovedAt: new Date(),
    };

    if (modifiedAmount && modifiedAmount > 0) {
      updateData.modifiedAmount = modifiedAmount;
    }

    if (status === "Rejected") {
      updateData.status = "Rejected";
    }

    const updated = await AdvanceRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Advance request not found",
      });
    }

    if (status === "Approved") {
      // Notify Admin
      await Notification.create({
        userId: "ADMIN",
        type: "Advance",
        message: `${updated.employeeName}'s advance request of ₹${updated.modifiedAmount || updated.amount} approved by HR. Pending Admin approval.`,
        relatedId: updated._id,
        seen: false,
        createdAt: new Date(),
      });
    }

    // Notify employee
    const amountText = updated.modifiedAmount ? `₹${updated.modifiedAmount} (modified from ₹${updated.amount})` : `₹${updated.amount}`;
    await Notification.create({
      userId: updated.employeeId,
      type: "Advance",
      message: `Your advance request of ${amountText} was ${status.toLowerCase()} by HR ${
        approverName
      }.${comments ? ` Comments: ${comments}` : ""}`,
      relatedId: updated._id,
      seen: false,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Advance ${status.toLowerCase()} by HR successfully`,
      updated,
    });
  } catch (err) {
    console.error("❌ Error updating advance by HR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   🧾 GET ADVANCES FOR ADMIN (Approved by HR)
===================================================== */
router.get("/admin", async (req, res) => {
  try {
    const advances = await AdvanceRequest.find({
      hrApproved: true,
      adminApproved: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, advances });
  } catch (err) {
    console.error("❌ Error fetching Admin advances:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   🧾 ADMIN APPROVE / REJECT ADVANCE REQUEST
===================================================== */
router.put("/admin/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments, approverName } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updateData = {
      adminApproved: status === "Approved",
      adminComments: comments,
      adminApprovedAt: new Date(),
      status: status,
    };

    const updated = await AdvanceRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Advance request not found",
      });
    }

    // Notify employee of final decision
    const amountText = updated.modifiedAmount ? `₹${updated.modifiedAmount} (modified from ₹${updated.amount})` : `₹${updated.amount}`;
    await Notification.create({
      userId: updated.employeeId,
      type: "Advance",
      message: `Your advance request of ${amountText} was ${status.toLowerCase()} by Admin ${
        approverName
      }.${comments ? ` Comments: ${comments}` : ""}`,
      relatedId: updated._id,
      seen: false,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Advance ${status.toLowerCase()} by Admin successfully`,
      updated,
    });
  } catch (err) {
    console.error("❌ Error updating advance by Admin:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   🧾 MARK NOTIFICATION AS SEEN
===================================================== */
router.put("/seen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await AdvanceRequest.findByIdAndUpdate(id, { isSeenBySupervisor: true });
    res.json({ success: true, message: "Notification marked as seen" });
  } catch (err) {
    console.error("❌ Error marking notification seen:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
