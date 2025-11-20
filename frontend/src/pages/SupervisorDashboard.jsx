import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  // view state is now only for "leaves" and "advances", no longer "attendance"
  const [view, setView] = useState(""); // "", "leaves", "advances"
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [advanceRequests, setAdvanceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leaveNotifications, setLeaveNotifications] = useState(false);
  const [advanceNotifications, setAdvanceNotifications] = useState(false);

  const token = localStorage.getItem("token") || "";
  const supervisorId =
    localStorage.getItem("supervisorId") ||
    sessionStorage.getItem("supervisorId");
  const supervisorName =
    localStorage.getItem("supervisorName") ||
    sessionStorage.getItem("supervisorName") ||
    "Supervisor";

  // ✅ Verify login and role
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!token || role !== "supervisor") {
      alert("Access denied or session expired.");
      navigate("/");
      return;
    }
    checkNotifications();
  }, []);

  // ✅ Fetch unseen requests for red-dot notification
  const checkNotifications = async () => {
    try {
      const leaveRes = await fetch(
        `http://localhost:4000/api/leave/supervisor/${supervisorId}`
      );
      const advanceRes = await fetch(
        `http://localhost:4000/api/advance/supervisor/${supervisorId}`
      );

      const leaveData = await leaveRes.json();
      const advanceData = await advanceRes.json();

      if (leaveData?.leaves) {
        const hasUnseenLeave = leaveData.leaves.some(
          (l) => l.status === "Pending" && !l.notificationSeen
        );
        setLeaveNotifications(hasUnseenLeave);
      }

      if (advanceData?.advances) {
        const hasUnseenAdvance = advanceData.advances.some(
          (a) => a.status === "Pending" && !a.notificationSeen
        );
        setAdvanceNotifications(hasUnseenAdvance);
      }
    } catch (err) {
      console.error("Notification check error:", err);
    }
  };

  // ✅ Fetch leave/advance requests
  const fetchData = async (type) => {
    setLoading(true);
    const endpoint =
      type === "leaves"
        ? `http://localhost:4000/api/leave/supervisor/${supervisorId}`
        : `http://localhost:4000/api/advance/supervisor/${supervisorId}`;

    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (type === "leaves" && data?.leaves) setLeaveRequests(data.leaves);
      if (type === "advances" && data?.advances)
        setAdvanceRequests(data.advances);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  // ✅ Approve / Reject Handler
  const handleAction = async (type, id, status) => {
    const endpoint =
      type === "leave"
        ? `http://localhost:4000/api/leave/update/${id}`
        : `http://localhost:4000/api/advance/update/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          role: "Supervisor",
          approverName: supervisorName,
        }),
      });
      const data = await res.json();
      alert(data.message || "Status updated successfully");
      fetchData(type === "leave" ? "leaves" : "advances");
      checkNotifications(); // refresh notification dots
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update status");
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    alert("You have been logged out successfully.");
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #eef2ff, #f8faff)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "900px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "5px" }}>
          <img src="/logo.png" alt="Homzon Logo" style={{ width: "50px", height: "auto", marginRight: "10px" }} />
          <h2 style={{ color: "#1e40af", margin: 0 }}>
            HOMZON EXCEL SERVICES PVT. LTD.
          </h2>
        </div>
        <h3 style={{ color: "#1e3a8a", marginTop: "5px" }}>
          Supervisor Dashboard
        </h3>
        <p style={{ marginTop: "5px", fontWeight: "500", color: "#374151" }}>
          Welcome, {supervisorName}
        </p>
      </div>

      {/* Main Menu */}
      {view === "" && (
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "900px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "15px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* Leave Requests */}
            <button
              onClick={() => {
                setView("leaves");
                fetchData("leaves");
              }}
              style={{ ...mainBtn, position: "relative" }}
            >
              📝 Leave Requests
              {leaveNotifications && (
                <span style={notifDot}></span>
              )}
            </button>

            {/* Advance Requests */}
            <button
              onClick={() => {
                setView("advances");
                fetchData("advances");
              }}
              style={{ ...mainBtn, position: "relative" }}
            >
              💰 Advance Requests
              {advanceNotifications && (
                <span style={notifDot}></span>
              )}
            </button>

            {/* Attendance (⭐ FIXED: Navigate to the dedicated route) */}
            <button
              onClick={() => navigate("/supervisor/attendance")}
              style={mainBtn}
            >
              📋 Attendance
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button onClick={handleLogout} style={logoutBtn}>
              🚪 Logout
            </button>
          </div>
        </div>
      )}

      {/* LEAVE REQUESTS */}
      {view === "leaves" && (
        <div style={contentBox}>
          <h3 style={{ color: "#1e3a8a" }}>Leave Requests</h3>
          {loading ? (
            <p>Loading...</p>
          ) : leaveRequests.length === 0 ? (
            <p>No leave requests found.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "#e0e7ff" }}>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>From</th>
                  <th style={thStyle}>To</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((l) => (
                  <tr key={l._id}>
                    <td style={tdStyle}>{l.employeeName}</td>
                    <td style={tdStyle}>{l.fromDate}</td>
                    <td style={tdStyle}>{l.toDate}</td>
                    <td style={tdStyle}>{l.reason}</td>
                    <td style={tdStyle}>{l.status}</td>
                    <td style={tdStyle}>
                      {l.status === "Pending" ? (
                        <>
                          <button
                            onClick={() =>
                              handleAction("leave", l._id, "Approved")
                            }
                            style={approveBtn}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAction("leave", l._id, "Rejected")
                            }
                            style={rejectBtn}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span>{l.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={() => setView("")} style={backBtn}>
              ⬅️ Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ADVANCE REQUESTS */}
      {view === "advances" && (
        <div style={contentBox}>
          <h3 style={{ color: "#1e3a8a" }}>Advance Requests</h3>
          {loading ? (
            <p>Loading...</p>
          ) : advanceRequests.length === 0 ? (
            <p>No advance requests found.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "#e0e7ff" }}>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {advanceRequests.map((a) => (
                  <tr key={a._id}>
                    <td style={tdStyle}>{a.employeeName}</td>
                    <td style={tdStyle}>₹{a.amount}</td>
                    <td style={tdStyle}>{a.reason}</td>
                    <td style={tdStyle}>{a.status}</td>
                    <td style={tdStyle}>
                      {a.status === "Pending" ? (
                        <>
                          <button
                            onClick={() =>
                              handleAction("advance", a._id, "Approved")
                            }
                            style={approveBtn}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAction("advance", a._id, "Rejected")
                            }
                            style={rejectBtn}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span>{a.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={() => setView("")} style={backBtn}>
              ⬅️ Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ATTENDANCE PLACEHOLDER SECTION REMOVED */}
    </div>
  );
}

/* === Styles === */
const notifDot = {
  position: "absolute",
  top: "-6px",
  right: "-6px",
  background: "red",
  width: "12px",
  height: "12px",
  borderRadius: "50%",
};

const mainBtn = {
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "15px",
};

const logoutBtn = {
  backgroundColor: "#ef4444",
  color: "white",
  padding: "10px 25px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
};

const contentBox = {
  backgroundColor: "white",
  padding: "25px",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "900px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  textAlign: "center",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
};
const thStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  background: "#f3f4f6",
};
const tdStyle = { border: "1px solid #ddd", padding: "8px" };
const approveBtn = {
  backgroundColor: "green",
  color: "white",
  marginRight: "10px",
  padding: "6px 12px",
  borderRadius: "5px",
  border: "none",
  cursor: "pointer",
};
const rejectBtn = {
  backgroundColor: "red",
  color: "white",
  padding: "6px 12px",
  borderRadius: "5px",
  border: "none",
  cursor: "pointer",
};
const backBtn = {
  backgroundColor: "#6b7280",
  color: "white",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
};