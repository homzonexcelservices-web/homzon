// backend/models/Supervisor.js
const mongoose = require("mongoose");

const supervisorSchema = new mongoose.Schema(
  {
    supervisorName: { type: String, required: true },
    supervisorId: { type: String, required: true, unique: true }, // e.g. SP8125
    companyName: { type: String },
    department: { type: String },
    designation: { type: String },
    password: { type: String }, // hashed password if supervisors login
    hrName: { type: String },   // who created this supervisor
    mobile: { type: String },
    email: { type: String },
    // Salary and benefits fields
    basicSalary: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    epf: { type: String, enum: ["Yes", "No"], default: "No" },
    esic: { type: String, enum: ["Yes", "No"], default: "No" },
    paidLeaves: { type: Number, default: 0 },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Supervisor || mongoose.model("Supervisor", supervisorSchema, "supervisors");
