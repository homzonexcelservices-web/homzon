const express = require("express");
const router = express.Router();
const AdvanceRequest = require("../models/AdvanceRequest");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Middleware to check auth
const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header) return res.status(401).json({ error: "No token provided" });
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;
  try {
    const jwt = require("jsonwebtoken");
    const data = jwt.verify(token, process.env.JWT_SECRET || "change_this_secret");
    req.user = data;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Employee applies for advance
router.post("/apply", auth, async (req, res) => {
  try {
    const { employeeId, employeeName, supervisorId, supervisorName, amount, reason } = req.body;

    if (!employeeId || !supervisorId || !amount || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const advance = new AdvanceRequest({
      employee: req.user.id,
      employeeId,
      employeeName,
      supervisor: supervisorId,
      supervisorId,
      supervisorName,
      amount,
      reason,
    });

    await advance.save();

    // Create notification for supervisor
    const notification = new Notification({
      userId: supervisorId,
      type: "Advance",
      message: `${employeeName} applied for advance of ₹${amount}`,
      relatedId: advance._id,
    });
    await notification.save();

    res.status(201).json({ message: "Advance request submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Supervisor/HR/Admin updates advance status
router.put("/update/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, hrComments, adminComments, modifiedAmount } = req.body;
    const userRole = req.user.role;

    const advance = await AdvanceRequest.findById(id);
    if (!advance) return res.status(404).json({ message: "Advance request not found" });

    // Update status based on role
    if (userRole === "supervisor" && status) {
      advance.status = status;
      advance.supervisorApproved = status === "Approved";
      if (status === "Approved") {
        // Create notification for HR
        const hrUsers = await User.find({ role: "hr", isActive: true });
        for (const hr of hrUsers) {
          const notification = new Notification({
            userId: hr._id.toString(),
            type: "Advance",
            message: `Supervisor approved advance request of ${advance.employeeName} for ₹${advance.amount}`,
            relatedId: advance._id,
          });
          await notification.save();
        }
      }
    } else if (userRole === "hr" && status) {
      advance.status = status;
      advance.hrApproved = status === "Approved";
      advance.hrComments = hrComments || "";
      advance.modifiedAmount = modifiedAmount || advance.amount;
      advance.hrApprovedAt = new Date();
      if (status === "Approved") {
        // Create notification for Admin
        const adminUsers = await User.find({ role: "admin", isActive: true });
        for (const admin of adminUsers) {
          const notification = new Notification({
            userId: admin._id.toString(),
            type: "Advance",
            message: `HR approved advance request of ${advance.employeeName} for ₹${advance.modifiedAmount}`,
            relatedId: advance._id,
          });
          await notification.save();
        }
      }
    } else if (userRole === "admin" && status) {
      advance.status = status;
      advance.adminApproved = status === "Approved";
      advance.adminComments = adminComments || "";
      advance.adminApprovedAt = new Date();
      if (status === "Approved") {
        // Clear all notifications for this request
        await Notification.deleteMany({ relatedId: advance._id, type: "Advance" });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized to update this status" });
    }

    await advance.save();
    res.json({ message: "Advance request updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Supervisor gets pending advances
router.get("/supervisor/:supervisorId", auth, async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const advances = await AdvanceRequest.find({
      supervisorId,
      status: "Pending",
      supervisorApproved: false,
    }).sort({ createdAt: -1 });

    res.json({ advances });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// HR gets pending advances
router.get("/hr", auth, async (req, res) => {
  try {
    if (req.user.role !== "hr") return res.status(403).json({ message: "Unauthorized" });

    const advances = await AdvanceRequest.find({
      supervisorApproved: true,
      hrApproved: false,
    }).sort({ createdAt: -1 });

    res.json({ advances });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin gets pending advances
router.get("/admin", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized" });

    const advances = await AdvanceRequest.find({
      hrApproved: true,
      adminApproved: false,
    }).sort({ createdAt: -1 });

    res.json({ advances });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
