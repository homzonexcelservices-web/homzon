import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EmployeeAdvanceApply() {
  const navigate = useNavigate();

  // ✅ Get employee info from localStorage
  const employeeId = localStorage.getItem("employeeId");
  const employeeName = localStorage.getItem("employeeName");
  const supervisorId = localStorage.getItem("supervisorId");
  const supervisorName = localStorage.getItem("supervisorName");

  const [form, setForm] = useState({
    amount: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);

  // ✅ Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // ✅ Submit advance request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.amount || !form.reason) {
      alert("⚠️ Please fill all fields before submitting.");
      return;
    }

    if (Number(form.amount) <= 0) {
      alert("⚠️ Please enter a valid amount greater than 0.");
      return;
    }

    const body = {
      employeeId,
      employeeName,
      supervisorId,
      supervisorName,
      amount: Number(form.amount),
      reason: form.reason.trim(),
    };

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:4000/api/advance/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("✅ Advance request submitted successfully!");
        navigate("/employee");
      } else {
        alert(`❌ Failed to apply for advance: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      alert("❌ Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Back button
  const handleBack = () => {
    navigate("/employee");
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        padding: "30px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#1e40af",
          fontWeight: 700,
          marginBottom: "20px",
        }}
      >
        💰 Apply for Salary Advance
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
        <label>
          <b>Amount (₹):</b>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            style={inputStyle}
            min="1"
            required
          />
        </label>

        <label>
          <b>Reason:</b>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="Enter reason for advance..."
            rows="3"
            style={{ ...inputStyle, resize: "none" }}
            required
          />
        </label>

        <button type="submit" style={btnPrimary} disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>

        <button type="button" style={btnSecondary} onClick={handleBack}>
          Back
        </button>
      </form>
    </div>
  );
}

// ------------------- Styles -------------------
const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  marginTop: 4,
  fontSize: "15px",
};

const btnPrimary = {
  backgroundColor: "#2563eb",
  color: "white",
  padding: "10px 16px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  transition: "0.2s",
};

const btnSecondary = {
  backgroundColor: "#6b7280",
  color: "white",
  padding: "10px 16px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  transition: "0.2s",
};
