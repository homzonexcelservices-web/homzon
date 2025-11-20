// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  designation: { type: String },
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String },
  role: { type: String, enum: ["hr", "supervisor", "employee"], default: "employee" },
  timeIn: { type: String }, // "HH:mm" — assigned by HR when registering the employee
  basicSalary: { type: Number },
  paidLeaves: { type: Number, default: 0 }, // 0-4
  specialAllowance: { type: Number },
  conveyance: { type: Number },
  epf: { type: String, enum: ["Yes", "No"], default: "No" },
  esic: { type: String, enum: ["Yes", "No"], default: "No" },
  empId: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
