import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function HREmployeeSalaryDetails() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      Swal.fire("Session Expired", "Please login again.", "warning");
      navigate("/");
      return;
    }
    fetchEmployees();
  }, [token, navigate]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/employee/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown Error" }));
        throw new Error(errorData.error || "Failed to fetch employees");
      }
      const data = await res.json();
      const filteredData = data.filter(user => user.role === 'employee' || user.role === 'supervisor');
      setEmployees(filteredData.map(emp => ({
        ...emp,
        basicSalary: emp.basicSalary || '',
        specialAllowance: emp.specialAllowance || '',
        conveyance: emp.conveyance || '',
        epf: emp.epf || 'No',
        esic: emp.esic || 'No'
      })));
    } catch (err) {
      console.error("Error fetching employees:", err);
      Swal.fire("Error", err.message || "Unable to load employees list.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id, field, value) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp._id === id ? { ...emp, [field]: value } : emp
      )
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const updates = employees.map(emp => ({
        employeeId: emp._id,
        basicSalary: parseFloat(emp.basicSalary) || 0,
        specialAllowance: parseFloat(emp.specialAllowance) || 0,
        conveyance: parseFloat(emp.conveyance) || 0,
        epf: emp.epf,
        esic: emp.esic
      }));

      const promises = updates.map(update =>
        fetch(`${API_BASE}/api/employee/update-salary`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(update),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(res => !res.ok);

      if (failed.length > 0) {
        throw new Error("Some updates failed");
      }

      Swal.fire("Success", "All salary details updated successfully!", "success");
      fetchEmployees(); // Refresh data
    } catch (err) {
      console.error("Error updating salaries:", err);
      Swal.fire("Error", "Failed to update salary details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/hr");
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>Employee Salary Details Management</h2>
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Designation</th>
              <th style={thStyle}>Basic Salary</th>
              <th style={thStyle}>Special Allowance</th>
              <th style={thStyle}>Conveyance</th>
              <th style={thStyle}>EPF</th>
              <th style={thStyle}>ESIC</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            )}
            {!loading && employees.map((emp) => (
              <tr key={emp._id}>
                <td style={tdStyle}>{emp.name}</td>
                <td style={tdStyle}>{emp.designation}</td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    value={emp.basicSalary}
                    onChange={(e) => handleInputChange(emp._id, 'basicSalary', e.target.value)}
                    style={inputStyle}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    value={emp.specialAllowance}
                    onChange={(e) => handleInputChange(emp._id, 'specialAllowance', e.target.value)}
                    style={inputStyle}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    value={emp.conveyance}
                    onChange={(e) => handleInputChange(emp._id, 'conveyance', e.target.value)}
                    style={inputStyle}
                  />
                </td>
                <td style={tdStyle}>
                  <select
                    value={emp.epf}
                    onChange={(e) => handleInputChange(emp._id, 'epf', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <select
                    value={emp.esic}
                    onChange={(e) => handleInputChange(emp._id, 'esic', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={buttonContainerStyle}>
        <button onClick={handleSubmit} style={submitBtn} disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button onClick={handleBack} style={backBtn}>
          Back
        </button>
        <button onClick={handleLogout} style={logoutBtn}>
          Logout
        </button>
      </div>
    </div>
  );
}

const containerStyle = {
  maxWidth: 1400,
  margin: "24px auto",
  fontFamily: "Segoe UI, sans-serif",
  padding: 20,
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: 20,
  paddingBottom: 10,
  borderBottom: '2px solid #eee'
};

const tableWrapperStyle = {
  overflowX: "auto",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  marginBottom: 20,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const thStyle = {
  padding: "12px 15px",
  background: "#f3f4f6",
  fontWeight: 700,
  fontSize: 14,
  textTransform: 'uppercase',
  borderBottom: '2px solid #ddd'
};

const tdStyle = {
  padding: "10px 15px",
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
};

const selectStyle = {
  width: "100%",
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
};

const buttonContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "20px",
};

const submitBtn = {
  padding: "12px 25px",
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 16,
};

const backBtn = {
  padding: "12px 25px",
  backgroundColor: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 16,
};

const logoutBtn = {
  padding: "12px 25px",
  backgroundColor: "#d32f2f",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 16,
};
