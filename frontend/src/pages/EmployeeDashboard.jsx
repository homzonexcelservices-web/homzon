import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EmployeeDashboard() {
  const navigate = useNavigate();

  const employeeId = localStorage.getItem("employeeId");
  const employeeName = localStorage.getItem("employeeName");
  const role = localStorage.getItem("role");

  const [attendance, setAttendance] = useState([]);
  const [advanceDue, setAdvanceDue] = useState(0);
  const [leaveStatus, setLeaveStatus] = useState([]);
  const [advanceStatus, setAdvanceStatus] = useState([]);
  const [monthSummary, setMonthSummary] = useState({});
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [view, setView] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔔 Notification flags
  const [hasNewLeave, setHasNewLeave] = useState(false);
  const [hasNewAdvance, setHasNewAdvance] = useState(false);

  useEffect(() => {
    if (!employeeId || role !== "employee") {
      alert("Access denied or session expired.");
      navigate("/");
      return;
    }
    localStorage.setItem("dashboardRoute", "/employee");
    fetchNotifications(); // initial notification check

    // Auto-refresh notifications every 20s
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [employeeId]);

  const fetchNotifications = async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(`http://localhost:4000/api/notifications/employee/${employeeId}`);
      const data = await res.json();

      if (data.success) {
        const leaves = data.notifications.filter(
          (n) => n.type === "Leave" && !n.seen
        );
        const advs = data.notifications.filter(
          (n) => n.type === "Advance" && !n.seen
        );
        setHasNewLeave(leaves.length > 0);
        setHasNewAdvance(advs.length > 0);
      }
    } catch (err) {
      console.error("Notification fetch error:", err);
    }
  };

  const fetchAllData = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      // Attendance - Calculate start and end date for the month
      const startDate = `${filterYear}-${filterMonth.toString().padStart(2, '0')}-01`;
      const endDateObj = new Date(filterYear, filterMonth, 0);
      const endDate = endDateObj.toISOString().split('T')[0];

      const attendanceRes = await fetch(
        `http://localhost:4000/api/attendance?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const attendanceData = await attendanceRes.json();
      const allRecords = Array.isArray(attendanceData)
        ? attendanceData
        : attendanceData.attendance || [];

      // Filter records for current employee only
      const records = allRecords.filter(record => record.employee && record.employee._id === employeeId);
      setAttendance(records);
      const summary = { present: 0, absent: 0, late: 0, halfday: 0 };
      records.forEach((a) => {
        const status = a.status.toLowerCase();
        if (status === 'present') {
          summary.present += 1;
          if (a.isLate) {
            summary.late += 1;
          }
        } else if (status === 'absent') {
          summary.absent += 1;
        } else if (status === 'halfday') {
          summary.halfday += 1;
        }
      });
      setMonthSummary(summary);

      // Advance due - temporarily set to 0 since endpoint doesn't exist
      setAdvanceDue(0);

      // Leave Status
      const leaveRes = await fetch(
        `http://localhost:4000/api/leave/employee/${employeeId}`
      );
      const leaveData = await leaveRes.json();
      setLeaveStatus(leaveData.leaves || []);

      // Advance Status
      const advStatusRes = await fetch(
        `http://localhost:4000/api/advance/employee/${employeeId}`
      );
      const advStatusData = await advStatusRes.json();
      setAdvanceStatus(advStatusData.advances || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setLoading(false);
  };

  const markLeaveSeen = async () => {
    try {
      await fetch(
        `http://localhost:4000/api/notifications/seen/${employeeId}`,
        { method: "PUT" }
      );
      setHasNewLeave(false);
      fetchNotifications(); // refresh
    } catch (err) {
      console.error("Error marking leave seen:", err);
    }
  };

  const markAdvanceSeen = async () => {
    try {
      await fetch(
        `http://localhost:4000/api/notifications/seen/${employeeId}`,
        { method: "PUT" }
      );
      setHasNewAdvance(false);
      fetchNotifications();
    } catch (err) {
      console.error("Error marking advance seen:", err);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB") : "—";

  const handleLogout = () => {
    localStorage.clear();
    alert("You have been logged out successfully.");
    navigate("/");
  };

  const goBackToMain = () => setView("");

  return (
    <div style={container}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src="/logo.png" alt="Homzon Logo" style={{ width: "50px", height: "auto", marginRight: "10px" }} />
        <h2 style={{ color: "#1e3a8a", margin: 0 }}>
          HOMZON EXCEL SERVICES PVT. LTD.
        </h2>
      </div>
      <p style={{ textAlign: "center", color: "#6b7280" }}>
        Welcome, <b>{employeeName}</b> (ID: {employeeId})
      </p>

      {/* ===== MAIN DASHBOARD ===== */}
      {view === "" && (
        <div style={{ textAlign: "center" }}>
          <div style={btnGroup}>
            <button
              style={btnPrimary}
              onClick={() => navigate("/employee/apply-leave")}
            >
              📝 Apply Leave
            </button>
            <button
              style={btnPrimary}
              onClick={() => navigate("/employee/apply-advance")}
            >
              💰 Apply Advance
            </button>

            <button
              style={btnSecondary}
              onClick={() => {
                setView("attendance");
                fetchAllData();
              }}
            >
              Attendance
            </button>

            <div style={{ position: "relative" }}>
              <button
                style={btnSecondary}
                onClick={() => {
                  setView("leave");
                  fetchAllData();
                  markLeaveSeen();
                }}
              >
                Leave Status
              </button>
              {hasNewLeave && <span style={notifDot}></span>}
            </div>

            <div style={{ position: "relative" }}>
              <button
                style={btnSecondary}
                onClick={() => {
                  setView("advance");
                  fetchAllData();
                  markAdvanceSeen();
                }}
              >
                Advance Status
              </button>
              {hasNewAdvance && <span style={notifDot}></span>}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button onClick={handleLogout} style={btnLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      )}

      {/* ===== VIEWS ===== */}
      {loading && <p style={{ textAlign: "center" }}>Loading data...</p>}

      {/* Attendance */}
      {view === "attendance" && (
        <div>
          <h3 style={{ color: "#1e40af" }}>Monthly Attendance Summary</h3>

          <div style={filterRow}>
            <label>
              Month:{" "}
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                style={{ marginLeft: 6 }}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Year:{" "}
              <input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                style={{ width: 100, marginLeft: 6 }}
              />
            </label>
            <button
              onClick={fetchAllData}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                background: "#2563eb",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Show
            </button>
          </div>

          <div style={summaryBox}>
            <span>
              Present: <b>{monthSummary.present || 0}</b>
            </span>
            <span>
              Absent: <b>{monthSummary.absent || 0}</b>
            </span>
            <span>
              Late: <b>{monthSummary.late || 0}</b>
            </span>
            <span>
              Halfday: <b>{monthSummary.halfday || 0}</b>
            </span>
          </div>

          <h4 style={{ color: "#1e40af" }}>Daily Attendance</h4>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length > 0 ? (
                attendance.map((a, i) => (
                  <tr key={i}>
                    <td>{formatDate(a.date)}</td>
                    <td>{a.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2}>No attendance record found</td>
                </tr>
              )}
            </tbody>
          </table>

          <h4 style={{ color: "#1e40af", marginTop: 20 }}>
            💰 Current Advance Due: ₹{advanceDue}
          </h4>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={goBackToMain} style={backBtn}>
              ⬅️ Back
            </button>
          </div>
        </div>
      )}

      {/* Leave Status */}
      {view === "leave" && (
        <div>
          <h3 style={{ color: "#1e40af" }}>Leave Applications</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaveStatus.length > 0 ? (
                leaveStatus.map((l, i) => (
                  <tr key={i}>
                    <td>{formatDate(l.createdAt)}</td>
                    <td>{l.reason}</td>
                    <td>{formatDate(l.fromDate)}</td>
                    <td>{formatDate(l.toDate)}</td>
                    <td
                      style={{
                        color:
                          l.status === "Approved"
                            ? "green"
                            : l.status === "Rejected"
                            ? "red"
                            : "orange",
                        fontWeight: "bold",
                      }}
                    >
                      {l.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>No leave applications found</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={goBackToMain} style={backBtn}>
              ⬅️ Back
            </button>
          </div>
        </div>
      )}

      {/* Advance Status */}
      {view === "advance" && (
        <div>
          <h3 style={{ color: "#1e40af" }}>Advance Requests</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount (₹)</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {advanceStatus.length > 0 ? (
                advanceStatus.map((a, i) => (
                  <tr key={i}>
                    <td>{formatDate(a.createdAt)}</td>
                    <td>{a.amount}</td>
                    <td>{a.reason}</td>
                    <td
                      style={{
                        color:
                          a.status === "Approved"
                            ? "green"
                            : a.status === "Rejected"
                            ? "red"
                            : "orange",
                        fontWeight: "bold",
                      }}
                    >
                      {a.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>No advance requests found</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={goBackToMain} style={backBtn}>
              ⬅️ Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== STYLES ===== */
const container = {
  maxWidth: "900px",
  margin: "20px auto",
  padding: "20px",
  background: "white",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  fontFamily: "Arial, sans-serif",
};
const btnGroup = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  justifyContent: "center",
  margin: "20px 0",
};
const btnPrimary = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: 6,
  cursor: "pointer",
};
const btnSecondary = {
  background: "#9ca3af",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: 6,
  cursor: "pointer",
  position: "relative",
};
const notifDot = {
  position: "absolute",
  top: -3,
  right: -3,
  width: 10,
  height: 10,
  background: "red",
  borderRadius: "50%",
};
const btnLogout = {
  background: "#dc2626",
  color: "white",
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
};
const backBtn = {
  background: "#6b7280",
  color: "white",
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
};
const summaryBox = {
  display: "flex",
  justifyContent: "space-around",
  background: "#f9fafb",
  borderRadius: 8,
  padding: "10px 0",
  marginBottom: 12,
};
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 10,
};
const filterRow = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
  flexWrap: "wrap",
};
