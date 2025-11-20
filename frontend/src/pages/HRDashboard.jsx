import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HRDashboard() {
  const navigate = useNavigate();
  const hrName = localStorage.getItem("name") || "HR User";
  const [leaveNotifications, setLeaveNotifications] = useState(false);
  const [advanceNotifications, setAdvanceNotifications] = useState(false);

  // ✅ On mount: verify access and check notifications
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "hr") {
      alert("Access denied or session expired.");
      navigate("/");
      return;
    }

    checkNotifications();
  }, [navigate]);

  // ✅ Check for unseen notifications
  const checkNotifications = async () => {
    try {
      const leaveRes = await fetch("http://localhost:4000/api/leave/hr", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const advanceRes = await fetch("http://localhost:4000/api/advance/hr", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const leaveData = await leaveRes.json();
      const advanceData = await advanceRes.json();

      if (leaveData) {
        const hasUnseenLeave = leaveData.some((l) => !l.isSeenByEmployee && l.supervisorApproved);
        setLeaveNotifications(hasUnseenLeave);
      }

      if (advanceData) {
        const hasUnseenAdvance = advanceData.some((a) => !a.isSeenByEmployee && a.supervisorApproved);
        setAdvanceNotifications(hasUnseenAdvance);
      }
    } catch (err) {
      console.error("Notification check error:", err);
    }
  };

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.clear();
    alert("You have been logged out successfully.");
    navigate("/");
  };

  return (
    <div
      style={{
        maxWidth: 750,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
        padding: 30,
        textAlign: "center",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      {/* 🔹 Header Section */}
      <header style={{ marginBottom: 25 }}>
        <h1 style={{ color: "#4A148C", fontSize: 26, marginBottom: 5 }}>
          HOMZON EXCEL SERVICES PVT. LTD.
        </h1>
        <p style={{ fontSize: 13, marginBottom: 0, lineHeight: "1.4em" }}>
          640, Narsingh Ward, Above Bandhan Bank, Madan Mahal, <br />
          Jabalpur (M.P.) - 482001
        </p>
        <h3 style={{ marginTop: 15, color: "#333" }}>
          Welcome, <span style={{ color: "#6A1B9A" }}>{hrName}</span>
        </h3>
      </header>

      {/* 🔹 Dashboard Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 15,
          marginTop: 25,
        }}
      >
        <button onClick={() => navigate("/hr/supervisor-creator")} style={btn("#1976d2")}>
          ➕ Supervisor Creator
        </button>

        <button onClick={() => navigate("/hr/employee-creator")} style={btn("#2e7d32")}>
          👤 Employee Creator
        </button>

        {/* 🕒 Attendance Button (Attendance Machine) */}
        <button onClick={() => navigate("/hr/attendance")} style={btn("#f57c00")}>
          🕒 Attendance
        </button>

        {/* ⭐ NEW: Daily Attendance List (List ke roop mai) */}
        <button onClick={() => navigate("/hr/daily-attendance")} style={btn("#00b894")}>
          📋 Daily Attendance List
        </button>
        
        {/* ⭐ NEW: Monthly Attendance Report (For Salary) */}
        <button onClick={() => navigate("/hr/monthly-report")} style={btn("#6a1b9a")}>
          🧾 Monthly Salary Report
        </button>

        <button onClick={() => navigate("/hr/revenue")} style={btn("#ef6c00")}>
          💰 Company Revenue
        </button>

        <button onClick={() => navigate("/hr/revenue-status")} style={btn("#7b1fa2")}>
          📈 Revenue Status
        </button>

        {/* 🧾 Employee's Salary Detail Button */}
        <button onClick={() => navigate("/hr/employees-list")} style={btn("#0097a7")}>
          🧾 Employee's Salary Detail
        </button>

        <button onClick={() => navigate("/hr/leave-management")} style={btn("#ff9800")}>
          📝 Leave Management
        </button>

        <button onClick={() => navigate("/hr/advance-management")} style={btn("#9c27b0")}>
          💰 Advance Management
        </button>
      </div>

      {/* 🔹 Logout Button */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            padding: "12px 25px",
            backgroundColor: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 15,
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

// 🔹 Common Button Style
const btn = (bg) => ({
  padding: "14px 10px",
  backgroundColor: bg,
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 15,
  transition: "transform 0.2s, opacity 0.2s",
  boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
  opacity: 0.95,
  outline: "none",
  textTransform: "capitalize",
  width: "100%",
});
