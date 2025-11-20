import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:4000"; // Use your actual API base URL or VITE_API_BASE

export default function SupervisorAttendanceView() {
  const navigate = useNavigate();
  // Supervisor-specific details
  const supervisorName = localStorage.getItem("name") || "Supervisor User";
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  const [employees, setEmployees] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("en-GB", { hour12: false })
  );

  // 🕒 Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 🔒 Security Check
    if (!token || userRole !== 'supervisor') {
      Swal.fire("Access Denied", "Access denied or session expired. Please login again.", "error");
      navigate("/");
      return;
    }
    fetchEmployees();
    fetchAttendanceForDate(date);
    // Add date to dependencies to ensure attendance is refreshed when date is changed
  }, [token, userRole, navigate]);

  useEffect(() => {
    if (token && date) {
        fetchAttendanceForDate(date);
    }
  }, [date, token]);

  // ⭐ Fetch only assigned employees for the Supervisor role
  async function fetchEmployees() {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/supervisor/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) {
      // show backend error text if any
      throw new Error(data.error || "Failed to fetch assigned employees");
    }

    setEmployees(data.employees || []); // <-- IMPORTANT: use data.employees
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Unable to load assigned employees list: " + (err.message || ""), "error");
  } finally {
    setLoading(false);
  }
}


  async function fetchAttendanceForDate(dateISO) {
    setLoading(true);
    try {
      // ⭐ CRITICAL CHECK: Backend must ensure this route filters attendance 
      // ONLY for employees assigned to the requesting supervisor.
      const res = await fetch(`${API_BASE}/api/attendance?date=${dateISO}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load attendance data.");
      
      const data = await res.json();
      const map = {};
      if (Array.isArray(data)) {
        // Map attendance by employee ID
        data.forEach((a) => (map[a.employee?._id || a.employee] = a));
      }
      setAttendanceMap(map);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Unable to load attendance for selected date", "error");
    } finally {
      setLoading(false);
    }
  }

  function parseHHMMToDate(timeStr, dateISO) {
    const [h, m] = timeStr.split(":").map(Number);
    // Use the ISO date part to ensure the date is correct
    const d = new Date(dateISO + "T00:00:00"); 
    d.setHours(h, m || 0, 0, 0);
    return d;
  }

  function getCurrentTimeForDate(dateISO) {
    const now = new Date();
    const curr = new Date(dateISO + "T00:00:00"); 
    // Set current time on the selected date
    curr.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    return curr;
  }


  // Attendance Save Handler
  async function saveAttendance(emp, selectedStatus, overrideTime = null, timeOut = null) {
    const currentDateISO = date;
    const now = overrideTime
      ? parseHHMMToDate(overrideTime, currentDateISO)
      : getCurrentTimeForDate(currentDateISO); // Use current time on the selected date
    const timeInStr = now.toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5);

    let isLate = false;
    let lateMessage = "";

    if (emp.timeIn && selectedStatus === 'Present') { // Only check lateness for 'Present'
      const assigned = parseHHMMToDate(emp.timeIn, currentDateISO);
      const actual = now;
      const diffMinutes = Math.floor((actual - assigned) / (1000 * 60));

      if (diffMinutes > 5) { // 5 minute grace period
        isLate = true;
        lateMessage = `${emp.name} marked ${selectedStatus} at ${timeInStr}, but is ${diffMinutes} minute(s) late.`;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: emp._id,
          date: currentDateISO,
          timeIn: selectedStatus === 'Absent' || selectedStatus === 'Halfday' ? null : timeInStr, // Don't save TimeIn for Absent/Halfday
          timeOut: timeOut || null,
          status: selectedStatus,
          isLate,
          recordedBy: localStorage.getItem('userId'), // Log the Supervisor user ID
        }),
      });

      if (!res.ok) throw new Error("Failed to save attendance (Check Backend Attendance POST route)");
      const saved = await res.json();
      setAttendanceMap((m) => ({ ...m, [emp._id]: saved }));

      // Handle Late Warning
      if (isLate) {
        await Swal.fire({
          icon: "warning",
          title: "Late Arrival Confirmed",
          text: lateMessage,
          confirmButtonText: "OK",
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        Swal.fire("Saved", `${emp.name} marked ${selectedStatus} successfully.`, "success");
      } else {
        Swal.fire("Saved", `${emp.name} marked ${selectedStatus}`, "success");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not save attendance", "error");
    }
  }


  // ⭐ FIX: Status Change Logic (Handles Absent/Halfday properly)
  function onStatusChange(emp, e) {
    const value = e.target.value;
    const originalStatus = attendanceMap[emp._id]?.status || "";
    if (!value) return;

    // Allow modification now
    // if (attendanceMap[emp._id]?.status) {
    //     Swal.fire("Error", "Attendance already marked and cannot be modified.", "error");
    //     e.target.value = originalStatus;
    //     return;
    // }

    if (value === "Absent" || value === "Halfday") {
        return Swal.fire({
            title: `Mark ${emp.name} as ${value}`,
            text: `Confirm marking ${emp.name} as ${value}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Yes, Mark ${value}`,
        }).then((result) => {
            if (result.isConfirmed) {
                // For Absent/Halfday, save without a specific time prompt
                saveAttendance(emp, value, null); 
            } else {
                e.target.value = originalStatus;
            }
        });
    }

    // For Present status, prompt for Time-in
    Swal.fire({
      title: `Mark ${emp.name} as ${value}`,
      input: "text",
      inputLabel: "Time-in (HH:mm) — leave empty to use current time",
      inputPlaceholder: currentTime.slice(0, 5),
      showCancelButton: true,
      inputValidator: (v) => {
        if (!v) return null;
        const ok = /^\d{1,2}:\d{2}$/.test(v);
        if (!ok) return "Please use HH:mm format (e.g., 09:00 or 14:30)";
        const [hh, mm] = v.split(":").map(Number);
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59)
          return "Invalid hour or minute";
        return null;
      },
    }).then((result) => {
      if (result.isDismissed) {
        e.target.value = originalStatus;
        return;
      }
      const timeInput = result.value?.trim();
      saveAttendance(emp, value, timeInput || null);
    });
  }
  // --- End of Attendance Logic ---

  const handleBack = () => navigate("/supervisor"); 
  const handleLogout = () => {
    localStorage.clear();
    Swal.fire("Logged out", "Session closed successfully", "success");
    navigate("/");
  };

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "24px auto",
        fontFamily: "Segoe UI, sans-serif",
        padding: 20,
      }}
    >
      <h1 style={{ textAlign: "center", fontSize: 30, marginBottom: 6 }}>
        Supervisor Attendance View
      </h1>
      <p style={{ textAlign: "center", marginBottom: 12 }}>
        Welcome Supervisor (<strong>{supervisorName}</strong>)
      </p>

      {/* 🕒 Big Clock */}
      <div
        style={{
          textAlign: "center",
          fontSize: 48,
          fontWeight: "bold",
          color: "#0088AA", // Supervisor Accent Color
          marginBottom: 20,
        }}
      >
        {currentTime}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 12,
          alignItems: "center",
        }}
      >
        <div>
          <label style={{ marginRight: 8, fontWeight: 600 }}>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div>
          <button onClick={fetchEmployees} style={smallBtn}>
            Refresh Employees
          </button>
          <button
            onClick={() => fetchAttendanceForDate(date)}
            style={{ ...smallBtn, marginLeft: 8 }}
          >
            Refresh Attendance
          </button>
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          padding: 12,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f6f6f9" }}>
              <th style={th}>Name</th>
              <th style={th}>Company</th>
              <th style={th}>Designation</th>
              <th style={th}>Date</th>
              <th style={th}>Assigned Time-In</th>
              <th style={th}>Saved Time-In</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ padding: 20, textAlign: "center" }}>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && employees.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 20, textAlign: "center" }}>
                  No assigned employees found.
                </td>
              </tr>
            )}
            {!loading &&
              employees.map((emp) => {
                const att = attendanceMap[emp._id];
                const statusText = att?.status || 'N/A';
                const isLateWarning = att?.isLate ? ' ⚠️ Late' : '';

                return (
                  <tr key={emp._id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={td}>{emp.name}</td>
                    <td style={td}>{emp.company || "-"}</td>
                    <td style={td}>{emp.designation || "-"}</td> 
                    <td style={td}>
                      {new Date(date).toLocaleDateString("en-GB")}
                    </td>
                    <td style={td}>{emp.timeIn || "-"}</td>
                    <td style={td}>
                      {att?.status ? (
                        <span>{att?.timeIn || "-"}</span>
                      ) : (
                        <input
                          type="time"
                          defaultValue=""
                          onBlur={(e) => {
                            const time = e.target.value;
                            if (time) {
                              // Update timeIn
                              const updatedAtt = { ...att, timeIn: time };
                              setAttendanceMap((m) => ({ ...m, [emp._id]: updatedAtt }));
                            }
                          }}
                          style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      )}
                    </td>
                    <td style={td}>
                      {att?.status ? (
                        <span>{att?.timeOut || "-"}</span>
                      ) : (
                        <input
                          type="time"
                          defaultValue=""
                          onBlur={(e) => {
                            const time = e.target.value;
                            if (time) {
                              // Update timeOut
                              const updatedAtt = { ...att, timeOut: time };
                              setAttendanceMap((m) => ({ ...m, [emp._id]: updatedAtt }));
                            }
                          }}
                          style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      )}
                    </td>
                    <td style={td}>
                       {/* Display saved status or show select dropdown */}
                      {att?.status ? (
                        <span
                          style={{
                            fontWeight: "bold",
                            color: att.status === "Present" ? "green" : att.status === "Absent" ? "red" : "#ffa000",
                          }}
                        >
                          {statusText} {isLateWarning}
                        </span>
                      ) : (
                        <select
                          defaultValue=""
                          onChange={(e) => onStatusChange(emp, e)}
                          style={{ padding: 6, borderRadius: 6 }}
                        >
                          <option value="">--Select--</option>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Halfday">Halfday</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* 🔙 Back & Logout Buttons */}
      <div
        style={{
          marginTop: 30,
          display: "flex",
          justifyContent: "center",
          gap: 15,
        }}
      >
        <button onClick={handleBack} style={backBtn}>
          🔙 Back
        </button>
        <button onClick={handleLogout} style={logoutBtn}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

// Styles
const smallBtn = {
  padding: "8px 12px",
  backgroundColor: "#0088AA", 
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};
const th = { padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 14 };
const td = { padding: "10px 12px", fontSize: 14 };
const backBtn = {
  padding: "12px 25px",
  backgroundColor: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
};
const logoutBtn = {
  padding: "12px 25px",
  backgroundColor: "#d32f2f",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
};