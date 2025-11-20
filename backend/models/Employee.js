// backend/models/Employee.js
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    empId: { type: String, required: true, unique: true },
    mobile: { type: String },
    department: { type: String },
    company: { type: String },
    designation: { type: String },
    shift: { type: String },
    timeIn: { type: String },
    timeOut: { type: String },
    password: { type: String },

    // 🔹 Supervisor linkage
    supervisorId: { type: String }, // example: "SP8125"
    supervisorName: { type: String },

    // 🔹 HR info
    hrName: { type: String },
    hrId: { type: String },

    // 🔹 Salary and benefits
    basicSalary: { type: Number },
    paidLeaves: { type: Number, default: 0 }, // 0-4
    specialAllowance: { type: Number },
    conveyance: { type: Number },
    epf: { type: String, enum: ["Yes", "No"], default: "No" },
    esic: { type: String, enum: ["Yes", "No"], default: "No" },

    // 🔹 Status flags
    disabled: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },

    // 🔹 Date
    date_of_joining: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
