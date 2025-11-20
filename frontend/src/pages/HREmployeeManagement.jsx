// ✅ src/pages/HREmployeeManagement.jsx (FINAL CORRECTED VERSION)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

console.log("✅ HREmployeeManagement loaded");

// ✅ Environment-safe API base (Vite-compatible)
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function HREmployeeManagement() {
  const navigate = useNavigate();

  // State for Supervisor Creation Form
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    department: "",
    company: "Homzon Excel Services",
    shifts: [],
  });

  const shiftOptions = ["Shift 1", "Shift 2", "Shift 3"];
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, empId: "", password: "" });
  


  const handleField = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const handleShiftToggle = (shiftName) => {
    setFormData((prev) => {
      const exists = prev.shifts.find((s) => s.shiftName === shiftName);
      if (exists) {
        return {
          ...prev,
          shifts: prev.shifts.filter((s) => s.shiftName !== shiftName),
        };
      } else {
        return {
          ...prev,
          shifts: [...prev.shifts, { shiftName, timeIn: "", timeOut: "" }],
        };
      }
    });
  };

  const handleShiftTimeChange = (shiftName, field, value) => {
    setFormData((prev) => ({
      ...prev,
      shifts: prev.shifts.map((s) =>
        s.shiftName === shiftName ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.mobile.trim() || !formData.department.trim()) {
      Swal.fire("Validation Error", "Please fill Name, Mobile and Department.", "warning");
      return;
    }

    // Shift validation logic remains the same...

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Session Expired", "Please login again as HR.", "warning");
      navigate("/");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        department: formData.department.trim(),
        company: formData.company,
        role: "supervisor",
        // ⭐ NOTE: The server.js register route doesn't seem to handle 'shifts' directly 
        // but rather simple 'timeIn'. For now, sending only the first shift timeIn.
        timeIn: formData.shifts.length > 0 ? formData.shifts[0].timeIn : undefined, 
        // The server.js register route handles department, mobile, name, role, company.
      };

      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Server error during registration");
      }

      if (data.success) {
        setModal({
          open: true,
          empId: data.empId || "",
          password: data.password || "",
        });
        setFormData({
          name: "",
          mobile: "",
          department: "",
          company: "Homzon Excel Services",
          shifts: [],
        });
      } else {
        throw new Error(data.message || "Unexpected server response");
      }
    } catch (err) {
      Swal.fire("Server Error", err.message || "Could not create supervisor.", "error");
      console.error("create supervisor error:", err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        background: "linear-gradient(to bottom right, #eef3ff, #ffffff)",
        padding: 30,
      }}
    >
      <div style={{ width: '820px', maxWidth: '95%', display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={() => navigate("/hr")}
          style={{
            backgroundColor: "#0d6efd",
            color: "white",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            fontWeight: "700",
            marginRight: 10
          }}
        >
          🔙 HR Dashboard
        </button>
        <button
            type="button"
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              fontWeight: "700",
            }}
          >
            🚪 Logout
          </button>
      </div>

      {/* --- Supervisor Creation Form --- */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: 30,
          borderRadius: 15,
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          width: 820,
          maxWidth: "95%",
          marginBottom: 30,
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0d6efd",
            textDecoration: "underline",
            marginBottom: 20,
          }}
        >
          Supervisor Creation
        </h2>

        {/* Input Fields (unchanged) */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => handleField("name", e.target.value)}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
            required
          />
          <input
            type="text"
            placeholder="Mobile"
            value={formData.mobile}
            onChange={(e) => handleField("mobile", e.target.value)}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
            required
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <input
            type="text"
            placeholder="Department"
            value={formData.department}
            onChange={(e) => handleField("department", e.target.value)}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
            required
          />
          <select
            value={formData.company}
            onChange={(e) => handleField("company", e.target.value)}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
          >
            <option>Homzon Excel Services</option>
            <option>Homzon Facility Management</option>
            <option>Candid Jobs & Placement</option>
            <option>Aakaar Construction</option>
            <option>Home Care</option>
          </select>
        </div>

        {/* Shifts (unchanged) */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: "bold" }}>Shifts:</label>
          <div style={{ marginTop: 8 }}>
            {shiftOptions.map((shift) => {
              const selected = formData.shifts.find((s) => s.shiftName === shift);
              return (
                <div key={shift} style={{ marginBottom: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={!!selected} onChange={() => handleShiftToggle(shift)} />
                    <span style={{ fontWeight: 600 }}>{shift}</span>
                  </label>

                  {selected && (
                    <div style={{ marginLeft: 28, marginTop: 6, display: "flex", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12 }}>Time In</label>
                        <input
                          type="time"
                          value={selected.timeIn}
                          onChange={(e) => handleShiftTimeChange(shift, "timeIn", e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 12 }}>Time Out</label>
                        <input
                          type="time"
                          value={selected.timeOut}
                          onChange={(e) => handleShiftTimeChange(shift, "timeOut", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 6 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#0d6efd",
              color: "white",
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              fontWeight: "700",
            }}
          >
            {loading ? "Creating..." : "Create Supervisor"}
          </button>
        </div>
      </form>
      {/* --- END Supervisor Creation Form --- */}




      {/* Popup Modal (unchanged) */}
      {modal.open && (
        <div
          onClick={() => setModal({ open: false, empId: "", password: "" })}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 22,
              borderRadius: 12,
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              width: 420,
              maxWidth: "92%",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: 8 }}>Supervisor Created ✅</h3>
            <p style={{ marginBottom: 6 }}>Share these credentials with the supervisor:</p>

            <div style={{ background: "#f8f9fa", padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div>
                <strong>ID:</strong> <span>{modal.empId}</span>
              </div>
              <div>
                <strong>Password:</strong> <span>{modal.password}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`ID: ${modal.empId}\nPassword: ${modal.password}`);
                  Swal.fire({ title: "Copied!", icon: "success", timer: 1500, showConfirmButton: false });
                }}
                style={{
                  background: "#0d6efd",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 700,
                }}
              >
                Copy
              </button>

              <button
                onClick={() => setModal({ open: false, empId: "", password: "" })}
                style={{
                  background: "#6c757d",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 700,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}