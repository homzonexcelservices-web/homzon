const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header) return res.status(401).json({ error: "No token provided" });
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch (err) {
    console.error("Auth verify error:", err && err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = auth;
