const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Middleware to check auth
const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header) return res.status(401).json({ error: "No token provided" });
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;
  try {
    const jwt = require("jsonwebtoken");
    const data = jwt.verify(token, process.env.JWT_SECRET || "change_this_secret");
    req.user = data;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Get notifications for user
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
      seen: false,
    }).sort({ createdAt: -1 });

    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notification as seen
router.put("/:id/seen", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    notification.seen = true;
    await notification.save();

    res.json({ message: "Notification marked as seen" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
