import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ApplyLeave() {
  const navigate = useNavigate();
  const employeeId = localStorage.getItem("employeeId");
  const [supervisorId, setSupervisorId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch employee and supervisor details
  useEffect(() => {
    if (!employeeId) return;
    const token = localStorage.getItem("token");
    fetch(`http://localhost:4000/api/employee/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setEmployeeName(data.name || "");
        setSupervisorId(data.supervisorId || "");
        setSupervisorName(data.supervisorName || "");
      })
      .catch((err) => console.error("Error fetching employee details:", err));
  }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromDate || !toDate || !reason) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          employeeName,
          supervisorId,
          supervisorName,
          fromDate,
          toDate,
          reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Leave Applied Successfully!");
        setFromDate("");
        setToDate("");
        setReason("");
        navigate("/employee-dashboard");
      } else {
        alert(data.message || "Failed to apply leave");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error: Could not apply leave");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={formContainer}>
      <h2 style={{ textAlign: "center", color: "#1e40af" }}>📝 Apply Leave</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>From Date:</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>To Date:</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Reason:</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          placeholder="Enter reason for leave..."
          style={textareaStyle}
        />

        <div style={btnGroup}>
          <button type="submit" style={btnSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/employee-dashboard")}
            style={btnBack}
          >
            Back
          </button>
          <button type="button" onClick={handleLogout} style={btnLogout}>
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}

/* ===== STYLES ===== */
const formContainer = {
  maxWidth: "480px",
  margin: "50px auto",
  padding: "25px",
  background: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  fontFamily: "Arial, sans-serif",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const labelStyle = {
  fontWeight: 600,
  color: "#1e3a8a",
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const textareaStyle = {
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  minHeight: "80px",
  resize: "vertical",
};

const btnGroup = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "15px",
  gap: "10px",
};

const btnSubmit = {
  flex: 1,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnBack = {
  flex: 1,
  background: "#9ca3af",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
};

const btnLogout = {
  flex: 1,
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
};
