// routes/supervisorRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = mongoose.models.User || mongoose.model("User");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// ✅ Middleware
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header) return res.status(401).json({ error: "No token" });
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ✅ Get all supervisors for HR’s company
router.get("/", auth, async (req, res) => {
  try {
    const hr = await User.findById(req.user.id);
    if (!hr) return res.status(404).json({ error: "HR not found" });

    const supervisors = await User.find({
      role: "supervisor",
      company: hr.company,
      isActive: true,
    })
      .select("_id name company designation empId")
      .lean();

    res.json(supervisors);
  } catch (err) {
    console.error("Error fetching supervisors:", err);
    res.status(500).json({ error: "Unable to fetch supervisors" });
  }
});

module.exports = router;
