const mongoose = require("mongoose");

/*
  🔹 AdvanceRequest Model — Final Version (Updated)
  Includes:
   - employee + supervisor linkage (ObjectId refs)
   - amount + reason tracking
   - status (Pending / Approved / Rejected)
   - dual notification flags for both employee & supervisor
   - timestamps for sorting
*/

const advanceRequestSchema = new mongoose.Schema(
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

    // 🔹 Employee & Supervisor details for quick access
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    supervisorId: { type: String, required: true },
    supervisorName: { type: String, required: true },

    // 🔹 Advance details
    amount: { type: Number, required: true },
    reason: { type: String, required: true },

    // 🔹 Status tracking
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // 🔹 Notification system (dual flags)
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
    modifiedAmount: { type: Number },
  },
  { timestamps: true }
);

// ✅ Safe export — prevents OverwriteModelError during hot reload
module.exports =
  mongoose.models.AdvanceRequest ||
  mongoose.model("AdvanceRequest", advanceRequestSchema);
