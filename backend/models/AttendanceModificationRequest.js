const mongoose = require("mongoose");

const attendanceModificationRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Supervisor who requested
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Employee whose attendance to modify
  date: { type: Date, required: true }, // Date of attendance to modify
  requestedChanges: {
    status: { type: String, enum: ["Present", "Absent", "Halfday"] },
    timeIn: { type: String }, // "HH:mm"
    timeOut: { type: String }, // "HH:mm"
    isLate: { type: Boolean }
  },
  reason: { type: String, required: true }, // Reason for modification
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // HR who approved/rejected
  approvalNote: { type: String }, // Optional note from HR
}, { timestamps: true });

module.exports = mongoose.models.AttendanceModificationRequest || mongoose.model("AttendanceModificationRequest", attendanceModificationRequestSchema);
