const express = require("express");
const router = express.Router();
const LeaveRequest = require("../models/LeaveRequest");
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

// Employee applies for leave
router.post("/apply", auth, async (req, res) => {
  try {
    const { employeeId, employeeName, supervisorId, supervisorName, fromDate, toDate, reason } = req.body;

    if (!employeeId || !supervisorId || !fromDate || !toDate || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const leave = new LeaveRequest({
      employee: req.user.id,
      employeeId,
      employeeName,
      supervisor: supervisorId,
      supervisorId,
      supervisorName,
      fromDate,
      toDate,
      reason,
    });

    await leave.save();

    // Create notification for supervisor
    const notification = new Notification({
      userId: supervisorId,
      type: "Leave",
      message: `${employeeName} applied for leave from ${fromDate} to ${toDate}`,
      relatedId: leave._id,
    });
    await notification.save();

    res.status(201).json({ message: "Leave request submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Supervisor/HR/Admin updates leave status
router.put("/update/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, hrComments, adminComments } = req.body;
    const userRole = req.user.role;

    const leave = await LeaveRequest.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    // Update status based on role
    if (userRole === "supervisor" && status) {
      leave.status = status;
      leave.supervisorApproved = status === "Approved";
      if (status === "Approved") {
        // Create notification for HR
        const hrUsers = await User.find({ role: "hr", isActive: true });
        for (const hr of hrUsers) {
          const notification = new Notification({
            userId: hr._id.toString(),
            type: "Leave",
            message: `Supervisor approved leave request of ${leave.employeeName} from ${leave.fromDate} to ${leave.toDate}`,
            relatedId: leave._id,
          });
          await notification.save();
        }
      }
    } else if (userRole === "hr" && status) {
      leave.status = status;
      leave.hrApproved = status === "Approved";
      leave.hrComments = hrComments || "";
      leave.hrApprovedAt = new Date();
      if (status === "Approved") {
        // Create notification for Admin
        const adminUsers = await User.find({ role: "admin", isActive: true });
        for (const admin of adminUsers) {
          const notification = new Notification({
            userId: admin._id.toString(),
            type: "Leave",
            message: `HR approved leave request of ${leave.employeeName} from ${leave.fromDate} to ${leave.toDate}`,
            relatedId: leave._id,
          });
          await notification.save();
        }
      }
    } else if (userRole === "admin" && status) {
      leave.status = status;
      leave.adminApproved = status === "Approved";
      leave.adminComments = adminComments || "";
      leave.adminApprovedAt = new Date();
      if (status === "Approved") {
        // Clear all notifications for this request
        await Notification.deleteMany({ relatedId: leave._id, type: "Leave" });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized to update this status" });
    }

    await leave.save();
    res.json({ message: "Leave request updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Supervisor gets pending leaves
router.get("/supervisor/:supervisorId", auth, async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const leaves = await LeaveRequest.find({
      supervisorId,
      status: "Pending",
      supervisorApproved: false,
    }).sort({ createdAt: -1 });

    res.json({ leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// HR gets pending leaves
router.get("/hr", auth, async (req, res) => {
  try {
    if (req.user.role !== "hr") return res.status(403).json({ message: "Unauthorized" });

    const leaves = await LeaveRequest.find({
      supervisorApproved: true,
      hrApproved: false,
    }).sort({ createdAt: -1 });

    res.json({ leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin gets pending leaves
router.get("/admin", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized" });

    const leaves = await LeaveRequest.find({
      hrApproved: true,
      adminApproved: false,
    }).sort({ createdAt: -1 });

    res.json({ leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
