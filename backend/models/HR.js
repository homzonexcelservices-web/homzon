const mongoose = require("mongoose");

const HRSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    company: { type: String },
    role: { type: String, default: "hr" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HR", HRSchema);
