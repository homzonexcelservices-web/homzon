// backend/models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // FIX: 'Date' type is used for reliable date comparisons and aggregations (e.g., Monthly Reports).
  date: { type: Date, required: true }, 
  timeIn: { type: String }, // "HH:mm"
  timeOut: { type: String }, // "HH:mm" - Added for completeness
  status: { type: String, enum: ["Present", "Absent", "Halfday"], default: "Present" },
  isLate: { type: Boolean, default: false },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // HR/Supervisor who recorded it
}, { timestamps: true });

// Ensures only one attendance record per employee per day.
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);