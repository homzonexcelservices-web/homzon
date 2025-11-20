const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Employee = require("../models/Employee");
const HR = require("../models/HR");
const Supervisor = require("../models/Supervisor");

// ✅ HR creates an employee
router.post("/create-employee", async (req, res) => {
  try {
    const {
      name,
      empId,
      supervisorId,
      password,
      hrName,
      hrId,
      ...rest
    } = req.body;const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const Supervisor = require("../models/Supervisor");

// HR assigns employee to a supervisor
router.post("/assign-employee", async (req, res) => {
    try {
        const { employeeId, supervisorId } = req.body;

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).json({ message: "Employee not found" });

        // Check if supervisor exists
        const supervisor = await Supervisor.findById(supervisorId);
        if (!supervisor) return res.status(404).json({ message: "Supervisor not found" });

        // Assign supervisor
        employee.supervisor = supervisor._id;
        await employee.save();

        res.json({ message: `Employee assigned to Supervisor ${supervisor.name}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;


    if (!name || !empId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔍 Check for duplicate employee ID
    const existing = await Employee.findOne({ empId });
    if (existing) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    // 🔗 Fetch supervisor if provided
    let supervisor = null;
    if (supervisorId) {
      supervisor = await Supervisor.findOne({ supervisorId });
      if (!supervisor) {
        return res.status(404).json({ message: "Supervisor not found for given ID" });
      }
    }

    // 🔐 Hash password
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // ✅ Create employee
    const newEmployee = new Employee({
      name,
      empId,
      password: hashedPassword,
      hrName,
      hrId: hrId || null,
      supervisor_id: supervisor ? supervisor._id : null,
      supervisorName: supervisor ? supervisor.supervisorName : null,
      ...rest
    });

    await newEmployee.save();

    console.log(`✅ Employee Created: ${name} (${empId}) under ${supervisor?.supervisorName || "No Supervisor"}`);
    res.status(201).json({ message: "Employee created successfully" });
  } catch (err) {
    console.error("❌ Error creating employee:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get all supervisors for dropdown (used in HR panel)
router.get("/get-supervisors", async (req, res) => {
  try {
    const { hrName } = req.query;
    const filter = hrName ? { hrName } : {};
    const supervisors = await Supervisor.find(filter).select("supervisorName supervisorId");
    res.json(supervisors);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all employees created by HR
router.get("/get-employees", async (req, res) => {
  try {
    const { hrName } = req.query;
    const filter = hrName ? { hrName } : {};
    const employees = await Employee.find(filter);
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Error fetching employees", error: err.message });
  }
});

module.exports = router;