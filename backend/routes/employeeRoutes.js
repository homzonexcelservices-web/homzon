// routes/employeeRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose"); 

// Ensure the User model is registered
const User = mongoose.models.User || mongoose.model("User");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// Simple middleware for JWT authentication
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header) return res.status(401).json({ error: "No token" });
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------- API Routes ----------------

// GET all active employees AND supervisors (for HR/Admin) - /api/employee
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "hr" && req.user.role !== "admin")
      return res.status(403).json({ error: "Unauthorized. Requires HR or Admin access." });

    // Selecting necessary fields for the list/attendance machine.
    const employees = await User.find({
        role: { $in: ["employee", "supervisor"] },
        isActive: true
    })
      .select("_id name company designation department timeIn timeOut empId supervisor") // supervisor added for context
      .lean();

    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees and supervisors:", err);
    res.status(500).json({ error: "Unable to fetch list" });
  }
});

// GET all employees AND supervisors (active/inactive) for HR/Admin - /api/employee/all
router.get("/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "hr" && req.user.role !== "admin")
      return res.status(403).json({ error: "Unauthorized. Requires HR or Admin access." });

    // Fetch all employees and supervisors, including inactive ones
    const employees = await User.find({
        role: { $in: ["employee", "supervisor"] }
    })
      .select("_id name company designation department timeIn timeOut empId supervisor isActive") // include isActive
      .lean();

    res.json(employees);
  } catch (err) {
    console.error("Error fetching all employees and supervisors:", err);
    res.status(500).json({ error: "Unable to fetch list" });
  }
});

// PATCH Employee Status (Soft Delete/Deactivate) - /api/employee/:id
router.patch("/:id", auth, async (req, res) => {
    const employeeId = req.params.id; 
    try {
        // 1. Authorization Check: Only Admin or HR can perform status updates.
        // NOTE: Supervisor can also deactivate users in server.js, but this route limits it to HR/Admin for higher control.
        if (!["hr", "admin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Only Admin or HR can update employee status" });
        }
        
        const { isActive } = req.body; 

        if (typeof isActive === "undefined" || typeof isActive !== "boolean") {
            return res.status(400).json({ error: "Valid boolean 'isActive' status is required for update" });
        }

        // 2. Find Employee
        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // 3. Security check: Prevent HR from deactivating Admin or other HRs.
        if (req.user.role === "hr" && ["admin", "hr"].includes(employee.role)) {
            return res.status(403).json({ error: "HR cannot deactivate Admin or other HRs." });
        }
        
        // 4. Update and Save
        employee.isActive = isActive;
        // Using save() ensures schema validation runs correctly
        await employee.save({ validateBeforeSave: true }); 

        res.json({ success: true, message: `Employee status updated to isActive: ${isActive}`, user: employee });
        
    } catch (err) {
        // --- Detailed Error Handling ---
        if (err.name === 'CastError' && err.path === '_id') {
            console.error("CastError: Invalid employee ID provided:", employeeId);
            return res.status(400).json({ error: "Invalid employee ID format" });
        }
        
        if (err.name === 'ValidationError') {
            console.error(`Validation Error on update (ID: ${employeeId}):`, err.message);
            return res.status(400).json({ error: "Update failed due to data validation: " + err.message });
        }
        
        console.error(`Error soft-deleting employee (ID: ${employeeId}). Error Name: ${err.name}, Message: ${err.message}`);
        
        // Generic 500 error for all other server/database issues
        res.status(500).json({ error: "Unable to update employee status" }); 
    }
});


// DELETE Employee (Hard Delete) - /api/employee/:id
router.delete("/:id", auth, async (req, res) => {
    try {
        // Authorization Check: Only Admin or HR can perform hard delete.
        if (!["hr", "admin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Only Admin or HR can delete employees" });
        }

        const employee = await User.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json({ success: true, message: "Employee deleted successfully" });
    } catch (err) {
        console.error(`Error deleting employee (ID: ${req.params.id}):`, err.message);
        res.status(500).json({ error: "Unable to delete employee" });
    }
});

router.put('/update-salary', require('../controllers/reportController').updateEmployeeSalary);

module.exports = router;
