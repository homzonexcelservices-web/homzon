const mongoose = require("mongoose");

/*
  🔹 LeaveRequest Model — Final Version (Updated)
  Includes:
   - employee + supervisor linkage (ObjectId refs)
   - status tracking (Pending / Approved / Rejected)
   - dual notification flags (for employee & supervisor)
   - clean timestamps for frontend sorting
*/

const leaveRequestSchema = new mongoose.Schema(
  {
    // 🔹 Relations
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 Employee & Supervisor details for quick display
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    supervisorId: { type: String, required: true },
    supervisorName: { type: String, required: true },

    // 🔹 Leave details
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },

    // 🔹 Leave status
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // 🔹 Notification flags
    isSeenByEmployee: { type: Boolean, default: false },
    isSeenBySupervisor: { type: Boolean, default: false },

    // 🔹 Approval flags
    supervisorApproved: { type: Boolean, default: false },
    hrApproved: { type: Boolean, default: false },
    adminApproved: { type: Boolean, default: false },

    // 🔹 Comments and timestamps
    hrComments: { type: String },
    adminComments: { type: String },
    hrApprovedAt: { type: Date },
    adminApprovedAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ Export safely (avoid OverwriteModelError)
module.exports =
  mongoose.models.LeaveRequest ||
  mongoose.model("LeaveRequest", leaveRequestSchema);
