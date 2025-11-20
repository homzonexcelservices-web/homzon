// routes/supervisor.js
const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const auth = require("../middleware/auth");

// Fetch assigned employees
router.get("/employees", auth, async (req, res) => {
    try {
        const supervisorId = req.user._id;
        const employees = await Employee.find({ supervisor: supervisorId });

        if (employees.length === 0) {
            return res.json({ message: "No employee assigned for you" });
        }

        res.json(employees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
