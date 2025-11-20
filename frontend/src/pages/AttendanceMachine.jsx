import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Define API Base URL (if not using environment variables)
const API_BASE = "http://localhost:4000";

export default function AttendanceMachine() {
  const navigate = useNavigate();
  const hrName = localStorage.getItem("name") || "HR User";
  const token = localStorage.getItem("token");

  const [employees, setEmployees] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("en-GB", { hour12: false })
  );
  const [searchTerm, setSearchTerm] = useState("");

  // 🕒 Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------- Data Fetching --------------------

  // Initial load and token check
  useEffect(() => {
    if (!token) {
      alert("Session expired. Please login again.");
      navigate("/");
      return;
    }
    fetchEmployees();
    // Initial attendance fetch will run via the second useEffect hook below
  }, [token, navigate]); // Added token and navigate to dependency array

  // Re-fetch attendance when the date changes
  useEffect(() => {
    // Only fetch if token exists
    if (token && date) {
      fetchAttendanceForDate(date);
    }
  }, [date, token]);


  // Fetch the combined list of Employees and Supervisors (The /api/employee route handles this)
  async function fetchEmployees() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      // Backend now filters for isActive: true, so no need for client-side soft-delete filter
      setEmployees(data); 
    } catch (err) {
      console.error("Error fetching employees:", err);
      Swal.fire("Error", "Unable to load employees list", "error");
    } finally {
      setLoading(false);
    }
  }

  // Fetch attendance records for the selected date
  async function fetchAttendanceForDate(dateISO) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/attendance?date=${dateISO}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // This error most likely means the backend route is not ready or failed.
        throw new Error("Backend route for attendance is not ready or failed to respond.");
      }
      const data = await res.json();
      const map = {};
      if (Array.isArray(data)) {
        // ⭐ FIX: Ensure we use the employee ID as key to map the attendance record
        data.forEach((a) => (map[a.employee?._id || a.employee] = a));
      }
      setAttendanceMap(map);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      Swal.fire("Error", `Unable to load attendance: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }


  // -------------------- Helper Functions --------------------

  // Utility to convert HH:MM string to a Date object on the selected date
  function parseHHMMToDate(timeStr, dateISO) {
    const [h, m] = timeStr.split(":").map(Number);
    // Create a Date object for the selected date at midnight (local time)
    const d = new Date(dateISO + "T00:00:00"); 
    // Set the required time
    d.setHours(h, m || 0, 0, 0); 
    return d;
  }

  // Utility to get current time on the selected date
  function getCurrentTimeForDate(dateISO) {
    const now = new Date();
    // Create a Date object for the selected date at the current time
    const curr = new Date(dateISO + "T00:00:00"); 
    curr.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    return curr;
  }

  // -------------------- Core Logic: Save Attendance --------------------

  async function saveAttendance(emp, selectedStatus, overrideTime = null) {
    const currentDateISO = date;
    
    // Determine the actual Time-in based on input or current time
    const now = overrideTime
      ? parseHHMMToDate(overrideTime, currentDateISO)
      : getCurrentTimeForDate(currentDateISO); // Use current time on the selected date
    
    // Time string for backend (HH:MM format)
    const timeInStr = now.toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5);

    let isLate = false;
    if (emp.timeIn) {
      const assigned = parseHHMMToDate(emp.timeIn, currentDateISO);
      // Use the 'now' variable for comparison
      const actual = now;

      const diffMinutes = Math.floor((actual - assigned) / (1000 * 60));

      // Check for late arrival only if the status is Present or Halfday (not Absent)
      if (selectedStatus !== 'Absent' && diffMinutes > 5) { // Allow 5 minutes grace period
        isLate = true;
        Swal.fire({
          icon: "warning",
          title: "Late Arrival",
          text: `${emp.name} is ${diffMinutes} minute(s) late.`,
          showConfirmButton: false,
          timer: 3000,
        });
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
          timeIn: timeInStr,
          status: selectedStatus,
          isLate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown Error" }));
        throw new Error(errorData.message || "Failed to save attendance");
      }
      
      const saved = await res.json();
      
      // ⭐ CRITICAL FIX/FEATURE: Instant UI Update (User requirement 2)
      // Update the map with the newly saved record
      setAttendanceMap((m) => ({ ...m, [emp._id]: saved }));
      Swal.fire("Saved", `${emp.name} marked ${selectedStatus}`, "success");

    } catch (err) {
      console.error(err);
      Swal.fire("Error", `Could not save attendance: ${err.message}`, "error");
    }
  }

  // Handle Status Change via dropdown
  function onStatusChange(emp, e) {
    const value = e.target.value;
    // Get the original status to reset the dropdown if the user cancels or action fails
    const originalStatus = attendanceMap[emp._id]?.status || ""; 
    
    if (!value) return;
    
    // Absent/Halfday can be marked without time, only Present requires time
    if (value === "Absent" || value === "Halfday") {
      return Swal.fire({
        title: `Mark ${emp.name} as ${value}`,
        text: `Confirm marking ${emp.name} as ${value}? Time-in will be marked as ${currentTime.slice(0, 5)} (Current Time).`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `Yes, Mark ${value}`,
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed) {
          saveAttendance(emp, value, currentTime.slice(0, 5)); // Use current time for Absent/Halfday marking
        } else {
          e.target.value = originalStatus; // Reset dropdown on cancel
        }
      });
    }
    
    // For Present status, prompt for Time-in
    Swal.fire({
      title: `Mark ${emp.name} as ${value}`,
      input: "text",
      inputLabel: "Time-in (HH:mm) — leave empty to use current time",
      inputPlaceholder: "09:00",
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
        e.target.value = originalStatus; // Reset dropdown on cancel
        return;
      }
      const timeInput = result.value?.trim();
      saveAttendance(emp, value, timeInput || null);
    });
  }

  // Soft Delete Function
  async function onSoftDelete(employeeId, employeeName) {
    const result = await Swal.fire({
      title: `Confirm Deactivation`,
      text: `Are you sure you want to deactivate (soft delete) ${employeeName}? This user will be set to inactive and removed from this list.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Deactivate!',
      cancelButtonText: 'No, cancel',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        // Using PATCH /api/employee/:id for soft delete (setting isActive: false)
        const res = await fetch(`${API_BASE}/api/employee/${employeeId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: false }), 
        });

        if (!res.ok) throw new Error("Failed to deactivate employee");
        
        // Remove employee from the local list to hide them immediately (User requirement 1)
        setEmployees(currentEmployees => 
          currentEmployees.filter(emp => emp._id !== employeeId)
        );

        Swal.fire("Deactivated!", `${employeeName} has been set to inactive (removed from list).`, "success");

      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Could not deactivate employee", "error");
      }
    }
  }
  
  const handleBack = () => navigate("/hr");
  const handleLogout = () => {
    localStorage.clear();
    Swal.fire("Logged out", "Session closed successfully", "success");
    navigate("/");
  };
  
  // Filter employees based on search term
  const filteredEmployees = employees.filter((emp) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(lowerSearchTerm) ||
      (emp.company && emp.company.toLowerCase().includes(lowerSearchTerm)) ||
      (emp.designation && emp.designation.toLowerCase().includes(lowerSearchTerm)) ||
      (emp.empId && emp.empId.toLowerCase().includes(lowerSearchTerm)) // Also search by empId
    );
  });

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
        Attendance Machine
      </h1>
      <p style={{ textAlign: "center", marginBottom: 12 }}>
        Welcome HR (<strong>{hrName}</strong>)
      </p>

      {/* 🕒 Big Clock */}
      <div
        style={{
          textAlign: "center",
          fontSize: 48,
          fontWeight: "bold",
          color: "#1976d2",
          marginBottom: 20,
        }}
      >
        {currentTime}
      </div>
      
      {/* Search Input */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search by Name, Company, Designation, or EmpID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px 15px",
              borderRadius: 6,
              border: "1px solid #ccc",
              width: "100%",
              maxWidth: 400,
            }}
          />
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
              <th style={th}>Role</th> {/* Added Role */}
              <th style={th}>Company</th>
              <th style={th}>Designation</th>
              <th style={th}>Assigned Time-In</th>
              <th style={th}>Saved Time-In</th>
              <th style={th}>Status</th>
              <th style={th}>Recorder</th> {/* Added Recorder Info */}
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
            {!loading && filteredEmployees.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 20, textAlign: "center" }}>
                  No active employees or supervisors found{searchTerm ? ` matching "${searchTerm}"` : ""}.
                </td>
              </tr>
            )}
            {!loading &&
              filteredEmployees.map((emp) => {
                const att = attendanceMap[emp._id];
                // Display helper for status (e.g., green dot, late warning)
                const statusText = att?.status || 'N/A';
                const isLateWarning = att?.isLate ? ' ⚠️ Late' : '';

                // Display helper for recorder name (assuming the backend populates 'recordedBy.name')
                const recorderName = att?.recordedBy?.name || '-';

                return (
                  <tr key={emp._id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={td}>{emp.name}</td>
                    <td style={td}>{emp.role}</td> {/* Display Role */}
                    <td style={td}>{emp.company || "-"}</td>
                    <td style={td}>{emp.designation || "-"}</td>
                    <td style={td}>{emp.timeIn || "-"}</td>
                    <td style={td}>{att?.timeIn || "-"}</td>
                    <td style={td}>
                      <select
                        defaultValue={att?.status || ""}
                        onChange={(e) => onStatusChange(emp, e)}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          backgroundColor: statusText === 'Present' ? '#e8f5e9' : statusText === 'Absent' ? '#ffebee' : statusText === 'Halfday' ? '#fff8e1' : 'white',
                          color: statusText === 'Present' ? '#388e3c' : statusText === 'Absent' ? '#d32f2f' : statusText === 'Halfday' ? '#ffa000' : 'black',
                          fontWeight: 600
                        }}
                      >
                        <option value="" disabled>--Select--</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Halfday">Halfday</option>
                      </select>
                      {isLateWarning}
                    </td>
                    <td style={td}>{recorderName}</td> {/* Display Recorder Name */}
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
  backgroundColor: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};
const th = { padding: "12px 12px", textAlign: "left", fontWeight: 700, fontSize: 14, textTransform: 'uppercase' };
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
const softDeleteBtn = {
  padding: "6px 10px",
  backgroundColor: "#d32f2f", // Changed to match logoutBtn color for consistency
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 12
};