import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function EmployeeApplyLeave() {
  const navigate = useNavigate();
  const employeeId = localStorage.getItem("employeeId");
  const employeeName = localStorage.getItem("employeeName");
  const role = localStorage.getItem("role");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Check if logged in
  useEffect(() => {
    if (!employeeId || role !== "employee") {
      alert("Access denied or session expired.");
      navigate("/");
      return;
    }
    localStorage.setItem("dashboardRoute", "/employee");
  }, [employeeId, role, navigate]);

  // ✅ Submit leave request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromDate || !toDate || !reason) {
      alert("⚠️ Please fill all fields");
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
          fromDate,
          toDate,
          reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Leave request submitted successfully!");
        navigate("/employee"); // Back to dashboard
      } else {
        alert(data.error || "❌ Failed to submit leave request");
      }
    } catch (err) {
      console.error("Error submitting leave:", err);
      alert("🚫 Server error while submitting leave");
    }
    setLoading(false);
  };

  // ✅ Back button
  const handleBack = () => {
    navigate("/employee");
  };

  return (
    <div style={container}>
      <h2 style={{ color: "#1e3a8a", textAlign: "center" }}>
        Apply for Leave
      </h2>
      <p style={{ textAlign: "center", color: "#6b7280" }}>
        Employee: <b>{employeeName}</b> (ID: {employeeId})
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label>
          From Date:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          To Date:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Reason:
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for leave"
            style={{ ...inputStyle, height: "80px", resize: "none" }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...btnPrimary,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit Leave Request"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button onClick={handleBack} style={btnSecondary}>
          ⬅️ Back to Dashboard
        </button>
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const container = {
  maxWidth: "500px",
  margin: "40px auto",
  padding: "20px",
  background: "white",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  fontFamily: "Arial, sans-serif",
};
const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  marginTop: "20px",
};
const inputStyle = {
  marginTop: 5,
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
  width: "100%",
};
const btnPrimary = {
  background: "#2563eb",
  color: "white",
  padding: "10px 16px",
  borderRadius: 6,
  border: "none",
  fontSize: "16px",
  fontWeight: "bold",
};
const btnSecondary = {
  background: "#6b7280",
  color: "white",
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
};
