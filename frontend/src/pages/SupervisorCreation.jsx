import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function SupervisorCreation() {
  const navigate = useNavigate();
  const hrName = localStorage.getItem("name") || "HR User";

  // State for form fields
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    department: "",
    designation: "",
    timeIn: "",
    timeOut: "",
    paidLeaves: 0,
    basicSalary: "",
    specialAllowance: "",
    conveyance: "",
    epf: "No",
    esic: "No",
  });

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.company || !formData.department || !formData.designation) {
      Swal.fire("Missing Fields", "Please fill all required fields.", "warning");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire("Session Expired", "Please login again.", "error");
        navigate("/");
        return;
      }

      const payload = {
        supervisorName: formData.name,
        companyName: formData.company,
        department: formData.department,
        designation: formData.designation,
        timeIn: formData.timeIn,
        timeOut: formData.timeOut,
        hrName,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        specialAllowance: parseFloat(formData.specialAllowance) || 0,
        conveyance: parseFloat(formData.conveyance) || 0,
        epf: formData.epf,
        esic: formData.esic,
        paidLeaves: parseInt(formData.paidLeaves) || 0,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch("http://localhost:4000/api/hr/create-supervisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (res.ok) {
        Swal.fire("Success", `Supervisor created successfully! ID: ${data.supervisorId}, Password: ${data.password}`, "success");
        setFormData({
          name: "",
          company: "",
          department: "",
          designation: "",
          timeIn: "",
          timeOut: "",
          paidLeaves: 0,
          basicSalary: "",
          specialAllowance: "",
          conveyance: "",
          epf: "No",
          esic: "No",
        });
      } else {
        Swal.fire("Error", data.message || "Something went wrong while creating supervisor.", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      if (error.name === 'AbortError') {
        Swal.fire("Timeout", "Request timed out. Please try again.", "warning");
      } else {
        Swal.fire("Error", "Something went wrong while creating supervisor.", "error");
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    Swal.fire("Logged Out", "You have been logged out successfully.", "info");
    navigate("/");
  };

  const handleBack = () => {
    navigate("/hr");
  };

  return (
    <div style={pageBackground}>
      <div style={glassCard}>
        <h1 style={title}>Welcome HR ({hrName})</h1>
        <h2 style={subtitle}>Supervisor Creation Dashboard</h2>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroup}>
            <label style={label}>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Supervisor Name"
              style={input}
              required
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Company Name</label>
            <select
              name="company"
              value={formData.company}
              onChange={handleChange}
              style={input}
              required
            >
              <option value="">Select Company</option>
              <option>Homzon Excel Services</option>
              <option>Candid Jobs & Placement</option>
              <option>Aakaar Construction</option>
              <option>Home-Care</option>
            </select>
          </div>

          <div style={formGroup}>
            <label style={label}>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Enter Department"
              style={input}
              required
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Designation</label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="Enter Designation"
              style={input}
              required
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Time-In</label>
            <input
              type="time"
              name="timeIn"
              value={formData.timeIn}
              onChange={handleChange}
              style={input}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Time-Out</label>
            <input
              type="time"
              name="timeOut"
              value={formData.timeOut}
              onChange={handleChange}
              style={input}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Paid Leaves</label>
            <select
              name="paidLeaves"
              value={formData.paidLeaves}
              onChange={handleChange}
              style={input}
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>

          <div style={formGroup}>
            <label style={label}>Basic Salary</label>
            <input
              type="number"
              name="basicSalary"
              value={formData.basicSalary}
              onChange={handleChange}
              placeholder="Enter Basic Salary"
              style={input}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Special Allowance</label>
            <input
              type="number"
              name="specialAllowance"
              value={formData.specialAllowance}
              onChange={handleChange}
              placeholder="Enter Special Allowance"
              style={input}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Conveyance</label>
            <input
              type="number"
              name="conveyance"
              value={formData.conveyance}
              onChange={handleChange}
              placeholder="Enter Conveyance"
              style={input}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>EPF</label>
            <select
              name="epf"
              value={formData.epf}
              onChange={handleChange}
              style={input}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div style={formGroup}>
            <label style={label}>ESIC</label>
            <select
              name="esic"
              value={formData.esic}
              onChange={handleChange}
              style={input}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Buttons */}
          <div style={buttonContainer}>
            <button type="button" onClick={handleBack} style={btn("#6b7280")}>
              🔙 Back
            </button>
            <button type="submit" style={btn("#2563eb")}>
              ✅ Submit
            </button>
            <button type="button" onClick={handleLogout} style={btn("#dc2626")}>
              🚪 Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------- Styles --------------------

const pageBackground = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #c3d9ff, #e0e7ff, #f8fafc)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 15px",
};

const glassCard = {
  backdropFilter: "blur(16px)",
  background: "rgba(255, 255, 255, 0.3)",
  borderRadius: "20px",
  boxShadow: "0 8px 32px rgba(31, 38, 135, 0.3)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  width: "100%",
  maxWidth: "500px",
  padding: "40px 30px",
  textAlign: "center",
};

const title = {
  color: "#1e40af",
  fontSize: "24px",
  fontWeight: "700",
  marginBottom: "10px",
};

const subtitle = {
  color: "#334155",
  fontSize: "18px",
  marginBottom: "25px",
  fontWeight: "600",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const formGroup = {
  textAlign: "left",
};

const label = {
  display: "block",
  marginBottom: "6px",
  color: "#1f2937",
  fontWeight: "600",
  fontSize: "14px",
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.6)",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
};

const buttonContainer = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "25px",
};

const btn = (bg) => ({
  backgroundColor: bg,
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 20px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
  boxShadow: `0 4px 12px ${bg}55`,
  fontSize: "14px",
});
