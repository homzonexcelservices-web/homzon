// ✅ src/pages/HREmployeeCreator.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HREmployeeCreator() {
  const navigate = useNavigate();
  const hrName = localStorage.getItem("name") || "HR User";

  // 🔹 Supervisors list
  const [supervisors, setSupervisors] = useState([]);

  // 🔹 Form state
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    department: "",
    designation: "",
    supervisorId: "",
    shift: "",
    timeIn: "",
    timeOut: "",
    mobile: "",
    basicSalary: "",
    specialAllowance: "",
    conveyance: "",
    epf: "No",
    esic: "No",
    paidLeaves: "0",
    casualLeaves: "0",
    role: "employee",
  });

  const companies = ["Homzon Excel Services Pvt. Ltd."];

  // ✅ Fetch supervisors for dropdown
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // ✅ FIXED ENDPOINT — Correct plural form
        const res = await fetch("http://localhost:4000/api/supervisors", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load supervisors");
        const data = await res.json();

        if (Array.isArray(data)) {
          setSupervisors(data);
        } else {
          console.warn("Unexpected supervisor response:", data);
          setSupervisors([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch supervisors:", err);
        setSupervisors([]);
      }
    };
    fetchSupervisors();
  }, []);

  // ✅ Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // ✅ Submit new employee
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.company.trim()) {
      alert("⚠️ Please fill required fields (Name and Company).");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("⚠️ Session expired. Please login again.");
        navigate("/");
        return;
      }

      const res = await fetch("http://localhost:4000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          department: formData.department,
          designation: formData.designation,
          supervisorId: formData.supervisorId || null,
          shift: formData.shift,
          timeIn: formData.timeIn,
          timeOut: formData.timeOut,
          mobile: formData.mobile,
          basicSalary: parseFloat(formData.basicSalary) || 0,
          specialAllowance: parseFloat(formData.specialAllowance) || 0,
          conveyance: parseFloat(formData.conveyance) || 0,
          epf: formData.epf,
          esic: formData.esic,
          role: "employee",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server Error");

      alert(
        `✅ Employee Created Successfully!\n\nEmployee ID: ${data.empId}\nPassword: ${data.password}`
      );

      console.log("🟢 Employee Created:", data);

      // Reset form
      setFormData({
        name: "",
        company: "",
        department: "",
        designation: "",
        supervisorId: "",
        shift: "",
        timeIn: "",
        mobile: "",
        role: "employee",
      });
    } catch (error) {
      console.error("❌ Employee creation failed:", error);
      if (error.name === 'AbortError') {
        alert("❌ Request timed out. Please try again.");
      } else {
        alert(`❌ Error: ${error.message || "Unknown error"}`);
      }
    }
  };

  // ✅ Reset & Logout
  const resetForm = () =>
    setFormData({
      name: "",
      company: "",
      department: "",
      designation: "",
      supervisorId: "",
      shift: "",
      timeIn: "",
      timeOut: "",
      mobile: "",
      basicSalary: "",
      specialAllowance: "",
      conveyance: "",
      epf: "No",
      esic: "No",
      role: "employee",
    });

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "40px auto",
        background: "white",
        borderRadius: 12,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        padding: 30,
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 5 }}>
          <img src="/Homzon.PNG" alt="Homzon Logo" style={{ width: "50px", height: "auto", marginRight: "10px" }} />
          <h1 style={{ fontSize: "26px", fontWeight: "bold", margin: 0 }}>
            HOMZON EXCEL SERVICES PVT. LTD.
          </h1>
        </div>
        <p style={{ fontSize: 13 }}>
          640, Narsingh Ward, Above Bandhan Bank, Madan Mahal, Jabalpur (M.P.)
        </p>
        <h3 style={{ marginTop: 10, color: "#333" }}>
          Welcome HR, <span style={{ color: "#6A1B9A" }}>{hrName}</span>
        </h3>
      </header>

      <h2 style={{ color: "#2E7D32", marginBottom: 20 }}>Employee Creator</h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "12px", textAlign: "left", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
      >
        <label>
          Employee Name:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter employee name"
            required
            style={inputStyle}
          />
        </label>

        <label>
          Company Name:
          <select
            name="company"
            value={formData.company}
            onChange={handleChange}
            required
            style={inputStyle}
          >
            <option value="">-- Select Company --</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          Department:
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Enter department"
            style={inputStyle}
          />
        </label>

        <label>
          Designation:
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            placeholder="Enter designation"
            style={inputStyle}
          />
        </label>

        {/* ✅ Supervisor Dropdown */}
        <label>
          Supervisor (optional):
          <select
            name="supervisorId"
            value={formData.supervisorId}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">-- Select Supervisor (if any) --</option>
            {supervisors.length > 0 ? (
              supervisors.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.name} ({sup.empId || "No ID"})
                </option>
              ))
            ) : (
              <option disabled>No Supervisors Found</option>
            )}
          </select>
        </label>

        <label>
          Shift:
          <select
            name="shift"
            value={formData.shift}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">-- Select Shift --</option>
            <option value="Shift 1">Shift 1</option>
            <option value="Shift 2">Shift 2</option>
            <option value="Shift 3">Shift 3</option>
          </select>
        </label>

        <label>
          Time-In:
          <input
            type="time"
            name="timeIn"
            value={formData.timeIn}
            onChange={handleChange}
            style={inputStyle}
          />
        </label>

        <label>
          Time-Out:
          <input
            type="time"
            name="timeOut"
            value={formData.timeOut}
            onChange={handleChange}
            style={inputStyle}
          />
        </label>

        <label>
          Mobile Number:
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Enter mobile number"
            style={inputStyle}
          />
        </label>

        <label>
          Basic Salary:
          <input
            type="number"
            name="basicSalary"
            value={formData.basicSalary}
            onChange={handleChange}
            placeholder="Enter Basic Salary"
            style={inputStyle}
          />
        </label>

        <label>
          Special Allowance:
          <input
            type="number"
            name="specialAllowance"
            value={formData.specialAllowance}
            onChange={handleChange}
            placeholder="Enter Special Allowance"
            style={inputStyle}
          />
        </label>

        <label>
          Conveyance:
          <input
            type="number"
            name="conveyance"
            value={formData.conveyance}
            onChange={handleChange}
            placeholder="Enter Conveyance"
            style={inputStyle}
          />
        </label>

        <label>
          EPF:
          <select
            name="epf"
            value={formData.epf}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>

        <label>
          ESIC:
          <select
            name="esic"
            value={formData.esic}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>

        <label>
          Paid Leaves:
          <select
            name="paidLeaves"
            value={formData.paidLeaves}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 20,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <button type="submit" style={btnPrimary}>
            Submit
          </button>
          <button type="button" style={btnSecondary} onClick={resetForm}>
            Clear
          </button>
          <button type="button" style={btnSecondary} onClick={() => navigate("/hr")}>
            Back
          </button>
          <button type="button" style={btnDanger} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}

// 🔹 Inline Styles
const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  marginTop: 4,
};

const btnPrimary = {
  backgroundColor: "#2e7d32",
  color: "white",
  padding: "10px 18px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const btnSecondary = {
  backgroundColor: "#6a1b9a",
  color: "white",
  padding: "10px 18px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const btnDanger = {
  backgroundColor: "#d32f2f",
  color: "white",
  padding: "10px 18px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};
