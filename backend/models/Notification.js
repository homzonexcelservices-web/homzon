const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ["Leave", "Advance"], required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  seen: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
