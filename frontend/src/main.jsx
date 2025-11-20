// ✅ src/main.jsx
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 🔹 Core Pages
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRegisterHR from "./pages/AdminRegisterHR";
// import AttendanceReport from "./pages/AttendanceReport"; // ⭐ OLD IMPORT: इसे Monthly Report के लिए इस्तेमाल करेंगे
import HRDashboard from "./pages/HRDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import HRJoiningForm from "./pages/HRJoiningForm";
import HREmployeeManagement from "./pages/HREmployeeManagement";
import HREmployeeCreator from "./pages/HREmployeeCreator";
import SupervisorCreation from "./pages/SupervisorCreation";
import MarkAttendance from "./pages/MarkAttendance";

// 🔹 Attendance Page for HR
import AttendanceMachine from "./pages/AttendanceMachine";
import SupervisorAttendanceView from "./pages/SupervisorAttendanceView"; 

// ⭐ NEW IMPORT: Daily Attendance List के लिए (जो हमने पिछले स्टेप में बनाया था)
import HRDailyAttendanceView from "./pages/HRDailyAttendanceView"; 
// ⭐ MONTHLY REPORT: AttendanceReport को Monthly Report के लिए इस्तेमाल कर रहा हूँ
import AttendanceReport from "./pages/AttendanceReport"; 


// 🔹 Employee Pages
import ApplyLeave from "./pages/ApplyLeave";
import ApplyAdvance from "./pages/ApplyAdvance";

// 🔹 Revenue Pages
import HRRevenue from "./pages/HRRevenue";
import HRRevenueStatus from "./pages/HRRevenueStatus";
import AdminRevenue from "./pages/AdminRevenue";

// 🔹 HR Employee Management (New)
import HREmployeeList from "./pages/HREmployeeList";

// 🔹 Leave and Advance Management
import HRLeaveManagement from "./pages/HRLeaveManagement";
import HRAdvanceManagement from "./pages/HRAdvanceManagement";
import AdminLeaveManagement from "./pages/AdminLeaveManagement";
import AdminAdvanceManagement from "./pages/AdminAdvanceManagement";

// 🔹 Global CSS
import "./styles.css";

// 🔹 Simple Placeholder for Under-Construction Pages
function LazyPlaceholder({ name }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "100px 20px",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <h2 style={{ color: "#4A148C" }}>{name} Page Coming Soon 🚧</h2>
    </div>
  );
}

// 🔹 Main App Routing
function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div style={{ textAlign: "center", padding: 80 }}>
            <h3>Loading...</h3>
          </div>
        }
      >
        <Routes>
          {/* ✅ Default Route */}
          <Route path="/" element={<Login />} />

          {/* ✅ Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/register-hr" element={<AdminRegisterHR />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />

          {/* Leave and Advance Management */}
          <Route path="/admin/leave-management" element={<AdminLeaveManagement />} />
          <Route path="/admin/advance-management" element={<AdminAdvanceManagement />} />

          {/* ✅ HR Routes */}
          <Route path="/hr" element={<HRDashboard />} />
          <Route path="/hr/joining-form" element={<HRJoiningForm />} />
          <Route
            path="/hr/supervisor-creator"
            element={<SupervisorCreation />}
          />
          <Route path="/hr/employee-creator" element={<HREmployeeCreator />} />
          <Route path="/hr/revenue" element={<HRRevenue />} />
          <Route path="/hr/revenue-status" element={<HRRevenueStatus />} />
          <Route path="/hr/attendance" element={<AttendanceMachine />} />
          <Route path="/hr/employees-list" element={<HREmployeeList />} />

          {/* ⭐ FIX 1: Daily Attendance List Route */}
          <Route
              path="/hr/daily-attendance"
              element={<HRDailyAttendanceView />}
          />

          {/* ⭐ FIX 2: Monthly Salary Report Route (AttendanceReport component का उपयोग किया गया है) */}
          <Route
              path="/hr/monthly-report"
              element={<AttendanceReport />}
          />

          {/* Leave and Advance Management */}
          <Route path="/hr/leave-management" element={<HRLeaveManagement />} />
          <Route path="/hr/advance-management" element={<HRAdvanceManagement />} />

          {/* ❌ REMOVED: यह पुराना/भ्रामक Route था, जिसे नए Monthly Report Route से बदल दिया गया है */}
          {/* <Route path="/hr/attendance-report" element={<AttendanceReport />} /> */}

          {/* ✅ Supervisor Routes */}
          <Route path="/supervisor" element={<SupervisorDashboard />} />
          <Route 
            path="/supervisor/attendance"
            element={<SupervisorAttendanceView />}
          />

          {/* ✅ Employee Routes */}
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/apply-leave" element={<ApplyLeave />} />
          <Route path="/employee/apply-advance" element={<ApplyAdvance />} />

          {/* ✅ Attendance Page */}
          <Route path="/mark-attendance" element={<MarkAttendance />} />

          {/* ✅ Placeholder Pages (Coming Soon) */}
          <Route
            path="/hr/salary-management"
            element={<LazyPlaceholder name="Salary Management" />}
          />
          {/* Leave and Advance Management routes added above */}
          <Route
            path="/hr/warning-letter"
            element={<LazyPlaceholder name="Warning Letter" />}
          />
          <Route
            path="/hr/offer-letter"
            element={<LazyPlaceholder name="Offer Letter" />}
          />
          <Route
            path="/hr/termination-letter"
            element={<LazyPlaceholder name="Termination Letter" />}
          />
          <Route
            path="/hr/goods-management"
            element={<LazyPlaceholder name="Goods Management" />}
          />
          <Route
            path="/hr/employee-profile"
            element={<LazyPlaceholder name="Employee Profile" />}
          />

          {/* ✅ Catch-All: Redirect to Login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// ✅ Mount App to DOM
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("❌ Root element not found in index.html");
}