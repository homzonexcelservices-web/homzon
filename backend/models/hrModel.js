const mongoose = require("mongoose");

const hrSchema = new mongoose.Schema({
  name: String,
  company: String,
  designation: String,
  contact: String,
  empId: String,
  password: String,
  isDisabled: { type: Boolean, default: false }, // 🔹 Added field
});

module.exports = mongoose.model("HR", hrSchema);
