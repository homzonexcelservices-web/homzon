// server.js
// HOMZON COMPLETE BACKEND (Admin + HR + Supervisor + Employee + Leave + Advance + Revenue)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// ---------------- MIDDLEWARE (MUST BE LOADED FIRST) ----------------
// FRONTEND_ORIGIN को Environment Variables से लें (जो Render पर सेट है)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// CORS: अब केवल LIVE Frontend को अनुमति दें (यदि FRONTEND_ORIGIN सेट है)
app.use(
  cors({
    origin: FRONTEND_ORIGIN, // LIVE Frontend URL
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // OPTIONS/preflight के लिए ज़रूरी
    allowedHeaders: "Content-Type,Authorization", // Custom headers के लिए ज़रूरी
  })
);

app.use(express.json());

// ---------------- MONGO CONNECTION ----------------
// ... (MONGO CONNECTION CODE यहाँ अपरिवर्तित है)
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/homzon_db";
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ MongoDB Connected");
    // Fix duplicate key error on supervisors email index
    try {
      await mongoose.connection.db.collection('supervisors').dropIndex('email_1');
      console.log("✅ Dropped old email index");
      await mongoose.connection.db.collection('supervisors').createIndex({ email: 1 }, { unique: true, sparse: true });
      console.log("✅ Created sparse unique index on email");
    } catch (e) {
      console.log("ℹ️ Email index handling:", e.message);
    }
  })
  .catch((err) => console.error("❌ Mongo connection error:", err));
// ... (MODELS CODE यहाँ अपरिवर्तित है)
const UserSchema = new mongoose.Schema(
  {
    name: String,
    role: {
      type: String,
      enum: ["admin", "hr", "supervisor", "employee"],
      required: true,
    },
    username: String,
    company: String,
    mobile: String,
    email: String,
    designation: String,
    department: String,
    shift: String,
    timeIn: String, // assigned time-in (HH:mm)
    timeOut: String,
    basicSalary: Number,
    paidLeaves: { type: Number, default: 0 }, // 0-4
    specialAllowance: Number,
    conveyance: Number,
    epf: { type: String, enum: ["Yes", "No"], default: "No" },
    esic: { type: String, enum: ["Yes", "No"], default: "No" },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    empId: String,
    passwordHash: String,
    disabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const AttendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    timeIn: String,
    timeOut: String,
    status: { type: String, enum: ["Present", "Absent", "Halfday"], default: "Present" },
    isLate: { type: Boolean, default: false },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // HR who recorded
  },
  { timestamps: true }
);
const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

const RevenueSchema = new mongoose.Schema(
  {
    hr: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hrName: String,
    siteName: String,
    contractAmount: Number,
    gst9: { type: String, enum: ["Yes", "No"], default: "No" },
    sgst9: { type: String, enum: ["Yes", "No"], default: "No" },
    totalAmount: Number,
    amountReceived: Number,
    amountReceivedDate: String,
    amountReceivedMode: {
      type: String,
      enum: ["Cash", "Cheque", "Online", "Not Received Yet"],
      default: "Not Received Yet",
    },
    chequeDepositDate: String,
    chequeCashDate: String,
  },
  { timestamps: true }
);
const Revenue = mongoose.models.Revenue || mongoose.model("Revenue", RevenueSchema);

// Models are imported from separate files
const LeaveRequest = require("./models/LeaveRequest");
const AdvanceRequest = require("./models/AdvanceRequest");
const Notification = require("./models/Notification");
const AttendanceModificationRequest = require("./models/AttendanceModificationRequest");

// ---------------- HELPERS ----------------
const adminOtps = {};
function setAdminOtp(mobile, code) {
  adminOtps[mobile] = { code: String(code), expiresAt: Date.now() + 5 * 60 * 1000 };
}
function verifyAdminOtp(mobile, code) {
  const rec = adminOtps[mobile];
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) return false;
  const ok = String(rec.code) === String(code);
  if (ok) delete adminOtps[mobile];
  return ok;
}

async function generateEmpId(role) {
  const prefix =
    role === "hr" ? "HR" : role === "admin" ? "AD" : role === "supervisor" ? "SP" : "EMP";
  for (let i = 0; i < 6; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${prefix}${num}`;
    const existing = await User.findOne({ empId: candidate }).lean();
    if (!existing) return candidate;
  }
  return `${prefix}${Date.now().toString().slice(-6)}`;
}

// ---------------- AUTH + SAFE WRAPPER ----------------
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
const safe = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


// ---------------- ROUTES (APIs) ----------------

// ---------------- API: Health Check (Base URL) ----------------
app.get("/", (req, res) => {
  res.send(`Homzon API is Live and Running! Frontend Origin: ${FRONTEND_ORIGIN}`);
});

// ---------------- ROUTE HOOKS (optional external files) ----------------
try {
  app.use("/api/hr", require("./routes/hrRoutes"));
} catch (e) {
  console.warn("hrRoutes not found:", e.message);
}
try {
  app.use("/api/attendance", require("./routes/attendanceRoutes"));
} catch (e) {
  console.warn("attendanceRoutes not found:", e.message);
}
try {
  app.use("/api/employee", require("./routes/employeeRoutes"));
} catch (e) {
  console.warn("employeeRoutes not found:", e.message);
}
try {
  app.use("/api/leave", require("./routes/leaveRoutes"));
} catch (e) {
  console.warn("leaveRoutes not found:", e.message);
}
try {
  app.use("/api/advance", require("./routes/advance"));
} catch (e) {
  console.warn("advance not found:", e.message);
}
try {
  app.use("/api/notifications", require("./routes/notificationRoutes"));
} catch (e) {
  console.warn("notificationRoutes not found:", e.message);
}
try {
  app.use("/api/supervisor", require("./routes/supervisorRoutes"));
} catch (e) {
  console.warn("supervisorRoutes not found:", e.message);
}
try {
  app.use("/api/reports", require("./routes/reportRoutes"));
} catch (e) {
  console.warn("reportRoutes not found:", e.message);
}

// ---------------- API: Supervisors (for HR dropdown) ----------------
app.get(
  "/api/supervisors",
  auth,
  safe(async (req, res) => {
    if (req.user.role !== "hr" && req.user.role !== "admin")
      return res.status(403).json({ error: "Unauthorized" });

    const supervisors = await User.find({ role: "supervisor", isActive: true })
      .select("_id name empId company designation")
      .sort({ name: 1 })
      .lean();

    res.json(supervisors);
  })
);

// ---------------- API: Companies (for HR dropdown) ----------------
app.get(
  "/api/companies",
  auth,
  safe(async (req, res) => {
    if (req.user.role !== "hr" && req.user.role !== "admin")
      return res.status(403).json({ error: "Unauthorized" });

    const companies = await User.distinct("company");
    res.json(companies);
  })
);

// ---------------- API: Employees list (for attendance page) ----------------
app.get(
  "/api/employees",
  auth,
  safe(async (req, res) => {
    const employees = await User.find({ role: { $in: ["employee", "supervisor"] }, isActive: true })
      .select("_id name company designation timeIn empId supervisor")
      .sort({ name: 1 })
      .lean();
    res.json(employees);
  })
);

// ---------------- API: Get specific employee by empId (for apply leave/advance) ----------------
app.get(
  "/api/employees/:empId",
  auth,
  safe(async (req, res) => {
    const { empId } = req.params;
    const employee = await User.findOne({ empId, role: "employee", isActive: true })
      .populate("supervisor", "name empId")
      .lean();

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({
      empId: employee.empId,
      name: employee.name,
      supervisorId: employee.supervisor ? String(employee.supervisor._id) : null,
      supervisorName: employee.supervisor ? employee.supervisor.name : null,
    });
  })
);

// ---------------- API: Attendance GET / POST / PUT ----------------
app.get(
  "/api/attendance",
  auth,
  safe(async (req, res) => {
    const { startDate, endDate } = req.query; // yyyy-mm-dd
    if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });

    const attendances = await Attendance.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
      .populate("employee", "name empId company designation timeIn")
      .populate("recordedBy", "name empId")
      .lean();

    res.json(attendances);
  })
);

app.post(
  "/api/attendance",
  auth,
  safe(async (req, res) => {
    // HR (or supervisor) records attendance
    if (!["hr", "supervisor", "admin"].includes(req.user.role))
      return res.status(403).json({ error: "Only HR/Supervisor/Admin can record attendance" });

    const { employeeId, date, timeIn, timeOut, status, isLate } = req.body;
    if (!employeeId || !date) return res.status(400).json({ error: "employeeId and date required" });

    // upsert: if attendance exists for that employee+date, update; else create
    let att = await Attendance.findOne({ employee: employeeId, date: new Date(date) });
    if (att) {
      att.timeIn = timeIn || att.timeIn;
      if (timeOut) att.timeOut = timeOut;
      if (status) att.status = status;
      if (typeof isLate === "boolean") att.isLate = isLate;
      att.recordedBy = req.user.id;
      await att.save();
    } else {
      att = new Attendance({
        employee: employeeId,
        date: new Date(date),
        timeIn,
        timeOut,
        status: status || "Present",
        isLate: !!isLate,
        recordedBy: req.user.id,
      });
      await att.save();
    }

    // return with populated employee
    const result = await Attendance.findById(att._id).populate("employee", "name empId company designation timeIn").lean();
    res.json(result);
  })
);

app.put(
  "/api/attendance/:id",
  auth,
  safe(async (req, res) => {
    const { id } = req.params;
    const { status, timeIn, timeOut, isLate } = req.body;

    // Find the attendance record
    const attendance = await Attendance.findById(id).populate('employee');
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Check permissions: HR/Admin can modify any, Supervisors only their assigned employees
    if (req.user.role === 'hr' || req.user.role === 'admin') {
      // HR/Admin can modify any attendance
    } else if (req.user.role === 'supervisor') {
      // Supervisors can only modify attendance for their assigned employees
      if (attendance.employee.supervisor.toString() !== req.user.id) {
        return res.status(403).json({ message: "You can only modify attendance for your assigned employees" });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized to modify attendance records" });
    }

    // Validate status
    const validStatuses = ['Present', 'Absent', 'Halfday'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be Present, Absent, or Halfday" });
    }

    // Find and update the attendance record
    const updateFields = {};
    if (status) updateFields.status = status;
    if (timeIn !== undefined) updateFields.timeIn = timeIn;
    if (timeOut !== undefined) updateFields.timeOut = timeOut;
    if (typeof isLate === 'boolean') updateFields.isLate = isLate;

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).populate({ path: "employee", select: "name empId role timeIn designation" });

    if (!updatedAttendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json(updatedAttendance);
  })
);

// ---------------- API: send admin OTP (for OTP flow) ----------------
app.post(
  "/api/send-otp",
  safe(async (req, res) => {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: "mobile required" });

    const adminUser = await User.findOne({ role: "admin", mobile }).lean();
    if (!adminUser) return res.status(404).json({ error: "Admin not registered" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    setAdminOtp(mobile, otp);
    console.log(`📩 ADMIN OTP for ${mobile}: ${otp} (dev only)`);

    // In production send via SMS gateway; here we just return success for dev
    res.json({ success: true, message: "OTP sent (demo)" });
  })
);

// ---------------- API: Register (single consolidated route) ----------------
app.post(
  "/api/register",
  auth,
  safe(async (req, res) => {
    // This single route handles:
    // - Admin creating HR (if creator is admin)
    // - HR creating supervisor/employee (if creator is hr)
    // - General creation with proper checks
    const creatorRole = req.user && req.user.role;
    const {
      name,
      role,
      mobile,
      designation,
      company,
      department,
      shift,
      supervisorId,
      email,
      timeIn,
      timeOut,
      basicSalary,
      paidLeaves,
      specialAllowance,
      conveyance,
      epf,
      esic,
    } = req.body;

    if (!name || !role) return res.status(400).json({ error: "name and role required" });

    // Role rules
    if (creatorRole === "admin" && role !== "hr") {
      return res.status(400).json({ error: "Admin can only create HR" });
    }
    if (creatorRole === "hr" && !["supervisor", "employee"].includes(role)) {
      return res.status(400).json({ error: "HR can create supervisor or employee" });
    }

    // If somehow creatorRole is something else (shouldn't happen due to auth),
    // only allow creation if creator is admin or hr
    if (!["admin", "hr"].includes(creatorRole)) {
      return res.status(403).json({ error: "Only Admin or HR may create users" });
    }

    // Create user
    const empId = await generateEmpId(role);
    const plainPassword = `P${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = new User({
      name,
      role,
      mobile,
      email,
      designation,
      company: company || "Homzon Excel Services Pvt. Ltd.",
      department,
      shift,
      supervisor: supervisorId || null,
      timeIn: timeIn || "",
      basicSalary: basicSalary || 0,
      paidLeaves: paidLeaves || 0,
      specialAllowance: specialAllowance || 0,
      conveyance: conveyance || 0,
      epf: epf || "No",
      esic: esic || "No",
      empId,
      passwordHash,
      isActive: true,
    });

    await user.save();

    res.json({
      success: true,
      empId,
      password: plainPassword,
      message: `${role.toUpperCase()} registered successfully`,
    });
  })
);

// ---------------- API: Login ----------------
app.post(
  "/api/login",
  safe(async (req, res) => {
    const { role, password, otp, mobileOrId } = req.body;
    if (!role || !mobileOrId) return res.status(400).json({ error: "role and mobileOrId required" });

    const user = await User.findOne({
      role,
      $or: [{ empId: mobileOrId }, { mobile: mobileOrId }, { email: mobileOrId }],
    });

    if (!user) return res.status(401).json({ error: "user not found" });

    // Admin login handling:
    // - In development (NODE_ENV !== 'production') allow login without OTP (convenience)
    // - In production require OTP and verify it
    if (role === "admin") {
      if (process.env.NODE_ENV !== "production") {
        // Bypass OTP locally for convenience
        console.log("⚙️ Admin login bypass active (development mode)");
      } else {
        // production: require OTP
        if (!otp || !verifyAdminOtp(mobileOrId, otp))
          return res.status(401).json({ error: "invalid or missing otp" });
      }
    } else {
      // Non-admin login use password
      const ok = await bcrypt.compare(password || "", user.passwordHash || "");
      if (!ok) return res.status(401).json({ error: "invalid password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, {
      expiresIn: "8h",
    });

    const baseResp = {
      token,
      role: user.role,
      name: user.name,
      empId: user.empId,
      company: user.company,
    };

    if (user.role === "employee") {
      let supervisor = null;
      if (user.supervisor) supervisor = await User.findById(user.supervisor).lean();
      return res.json({
        ...baseResp,
        employee: {
          _id: user._id,
          empId: user.empId,
          name: user.name,
          supervisorId: supervisor ? String(supervisor._id) : null,
          supervisorName: supervisor ? supervisor.name : null,
        },
      });
    }

    // inside your existing /api/login handler, after token & baseResp created
if (user.role === "supervisor") {
  return res.json({
    ...baseResp,
    userId: String(user._id),        // ADD THIS
    supervisorId: String(user._id),  // OPTIONAL duplicate
    supervisor: {
      _id: String(user._id),
      empId: user.empId,
      name: user.name,
    },
  });
}

    res.json(baseResp);
  })
);

// ---------------- API: Simple revenue add/list (example) ----------------
app.post(
  "/api/revenue/add",
  auth,
  safe(async (req, res) => {
    if (req.user.role !== "hr") return res.status(403).json({ error: "Only HR can add revenue" });
    const hr = await User.findById(req.user.id);
    if (!hr) return res.status(404).json({ error: "HR not found" });
    const revenue = new Revenue({ hr: hr._id, hrName: hr.name, ...req.body });
    await revenue.save();
    res.json({ success: true, message: "Revenue added successfully", revenueId: revenue._id });
  })
);

app.get(
  "/api/revenue/list",
  auth,
  safe(async (req, res) => {
    const query = req.user.role === "hr" ? { hr: req.user.id } : req.user.role === "admin" ? {} : null;
    if (!query) return res.status(403).json({ error: "Unauthorized" });
    const revenues = await Revenue.find(query).sort({ createdAt: -1 }).lean();
    res.json(revenues);
  })
);

// ---------------- DEFAULT ADMIN ----------------
async function ensureAdminUser() {
  const adminMobile = process.env.ADMIN_MOBILE || "9229493420";
  const adminPassword = process.env.ADMIN_PASSWORD || "123456";
  const existing = await User.findOne({ role: "admin", mobile: adminMobile });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await new User({
      name: "Super Admin",
      role: "admin",
      mobile: adminMobile,
      empId: "ADM001",
      company: "Homzon Excel Services Pvt. Ltd.",
      passwordHash,
    }).save();
    console.log(`✅ Default Admin Created: ${adminMobile} / ${adminPassword}`);
  } else console.log("✅ Admin already exists");
}
ensureAdminUser();

app.get("/debug/employees", async (req, res) => {
  const employees = await User.find({ role: "employee" }).lean();
  res.json(employees);
});


// ---------------- API: Supervisor – Assigned Employees ----------------
app.get(
  "/api/supervisor/employees",
  auth,
  safe(async (req, res) => {
    // Only supervisor is allowed
    if (req.user.role !== "supervisor")
      return res.status(403).json({ error: "Only supervisors can access assigned employees" });

    const supervisorId = req.user.id;

    const employees = await User.find({
      role: "employee",
      supervisor: req.user.id,
      isActive: true
    })
      .select("_id name empId company designation department shift timeIn")
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, employees });
  })
);

// ---------------- SUPERVISOR: Get Assigned Employees ----------------
app.get(
  "/api/supervisor/employees",
  auth,
  safe(async (req, res) => {
    // Only supervisors allowed
    if (req.user.role !== "supervisor") {
      return res.status(403).json({ error: "Only supervisors can access this" });
    }

    const employees = await User.find({
      role: "employee",
      supervisor: req.user.id,
      isActive: true,
    })
      .select("_id name empId company designation shift timeIn")
      .sort({ name: 1 })
      .lean();

    return res.json({
      success: true,
      employees,
    });
  })
);


// ---------------- HEALTH + SIMPLE TEST ----------------
app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, message: "Internal server error", error: err.message });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));