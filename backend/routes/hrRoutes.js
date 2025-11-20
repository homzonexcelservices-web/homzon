// backend/routes/hrRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const HR = require("../models/HR");
const Supervisor = require("../models/Supervisor");

// ✅ HR creates an employee
router.post("/create-employee", async (req, res) => {
  try {
    const data = req.body;
    const { name, empId, supervisorId, supervisorName, password, hrName } = data;

    if (!name || !empId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // If supervisorId provided, try to find supervisor to attach names; otherwise allow null supervisor
    let supervisor = null;
    if (supervisorId) {
      supervisor = await Supervisor.findOne({ supervisorId });
      if (!supervisor) {
        return res.status(404).json({ message: "Supervisor not found for given supervisorId" });
      }
    } else if (supervisorName) {
      supervisor = await Supervisor.findOne({ supervisorName });
      // if supervisorName provided but not found, we will ignore and continue (optional)
    }

    // 🔍 Check duplicate employeeId
    const existing = await Employee.findOne({ empId });
    if (existing) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    // 🔐 Hash password before saving
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // ✅ Create employee with supervisor & HR info
    const newEmployee = new Employee({
      ...data,
      supervisorId: supervisor ? supervisor.supervisorId : null,
      supervisorName: supervisor ? supervisor.supervisorName : null,
      hrName,
      hrId: data.hrId || null,
      password: hashedPassword,
    });

    await newEmployee.save();

    // Also create user entry for login
    const User = require("../models/User");
    const newUser = new User({
      name,
      role: "employee",
      empId,
      passwordHash: hashedPassword,
      company: data.company,
      department: data.department,
      designation: data.designation,
      mobile: data.mobile,
      email: data.email,
      supervisor: supervisor ? supervisor._id : null,
      timeIn: data.timeIn,
      basicSalary: data.basicSalary,
      specialAllowance: data.specialAllowance,
      conveyance: data.conveyance,
      epf: data.epf,
      esic: data.esic,
      paidLeaves: data.paidLeaves,
      isActive: true,
    });
    await newUser.save();

    console.log(`✅ Employee Created: ${name} (${empId}) under ${supervisorName}`);
    res.status(201).json({ message: "Employee created successfully" });
  } catch (err) {
    console.error("❌ Error creating employee:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get all supervisors for dropdown (used in HR panel)
router.get("/get-supervisors", async (req, res) => {
  try {
    const { hrName } = req.query; // optional filter by HR
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

// ✅ HR creates a supervisor
router.post("/create-supervisor", async (req, res) => {
  try {
    const data = req.body;
    const { supervisorName, companyName, department, designation, password, hrName, mobile, email, basicSalary, specialAllowance, conveyance, epf, esic, paidLeaves } = data;

    if (!supervisorName || !companyName) {
      return res.status(400).json({ message: "Missing required fields: supervisorName and companyName" });
    }

    // Generate unique supervisorId (e.g., SP8125)
    const generateSupervisorId = () => {
      const num = Math.floor(1000 + Math.random() * 9000);
      return `SP${num}`;
    };
    let supervisorId = generateSupervisorId();
    while (await Supervisor.findOne({ supervisorId })) {
      supervisorId = generateSupervisorId();
    }

    // 🔐 Generate password if not provided, hash it
    const plainPassword = password || `P${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // ✅ Create supervisor with HR info
    const newSupervisor = new Supervisor({
      supervisorName,
      supervisorId,
      companyName,
      department,
      designation,
      password: hashedPassword,
      hrName,
      mobile,
      email,
      basicSalary: basicSalary || 0,
      specialAllowance: specialAllowance || 0,
      conveyance: conveyance || 0,
      epf: epf || "No",
      esic: esic || "No",
      paidLeaves: paidLeaves || 0,
    });

    await newSupervisor.save();

    // Also create user entry for login
    const User = require("../models/User");
    const newUser = new User({
      name: supervisorName,
      role: "supervisor",
      empId: supervisorId,
      passwordHash: hashedPassword,
      company: companyName,
      department,
      designation,
      mobile,
      email,
      isActive: true,
    });
    await newUser.save();

    console.log(`✅ Supervisor Created: ${supervisorName} (${supervisorId}) by ${hrName}`);
    res.status(201).json({ message: "Supervisor created successfully", supervisorId, password: plainPassword });
  } catch (err) {
    console.error("❌ Error creating supervisor:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
