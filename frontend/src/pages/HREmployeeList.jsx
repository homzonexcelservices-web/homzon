// ✅ src/pages/HREmployeeList.jsx (Corrected Version)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Define API Base URL (Assuming it's defined globally or locally)
// ⭐ FIX: VITE_API_BASE environment variable या localhost:4000 का उपयोग करें
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000"; 

export default function HREmployeeList() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [supervisors, setSupervisors] = useState({}); // To map supervisor IDs to names

    useEffect(() => {
        if (!token) {
            Swal.fire("Session Expired", "Please login again.", "warning");
            navigate("/");
            return;
        }
        fetchSupervisors(); // Fetch supervisors first
        fetchEmployees();  // Then fetch all users (active/inactive)
    }, [token, navigate]);

    // -------------------- Data Fetching --------------------

    // Fetch Supervisors for dropdown and display mapping
    const fetchSupervisors = async () => {
        try {
            // ⭐ NOTE: Assuming you have an API route /api/supervisors that returns a list of users with role: 'supervisor'
            const res = await fetch(`${API_BASE}/api/supervisors`, { 
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch supervisors list (Check backend route /api/supervisors)");
            const data = await res.json();
            
            // Create a map { _id: name } for easy lookup
            const supervisorMap = {};
            data.forEach(s => {
                supervisorMap[s._id] = s.name;
            });
            setSupervisors(supervisorMap);

        } catch (err) {
            console.error("Error fetching supervisors:", err);
            // Optionally, show a mild error message here
        }
    };


    // Fetch ALL employees and supervisors (active and inactive) for HR management
    const fetchEmployees = async () => {
        try {
            setLoading(true);
            // ⭐ FIX: /api/employee/all का उपयोग करें अगर आप सक्रिय और निष्क्रिय दोनों Users को देखना चाहते हैं।
            // (यदि आपके backend में केवल /api/employee है, तो यह केवल active users देगा)
            const res = await fetch(`${API_BASE}/api/employee/all`, { 
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: "Unknown Error" }));
                throw new Error(errorData.error || "Failed to fetch all users list (Check backend route /api/employee/all)");
            }
            const data = await res.json();
            // Filter to include only employee and supervisor roles
            const filteredData = data.filter(user => user.role === 'employee' || user.role === 'supervisor');
            setEmployees(filteredData);
        } catch (err) {
            console.error("Error fetching employees:", err);
            Swal.fire("Error", err.message || "Unable to load users list. Check your server's /api/employee/all route.", "error");
        } finally {
            setLoading(false);
        }
    };
    
    // -------------------- Core Actions --------------------

    // Function to handle soft delete (Deactivation/Reactivation)
    const handleToggleActive = async (employeeId, employeeName, currentStatus) => {
        const newStatus = !currentStatus;
        const action = newStatus ? "Reactivate" : "Deactivate";
        const result = await Swal.fire({
            title: `Confirm ${action}`,
            text: `Are you sure you want to ${action.toLowerCase()} ${employeeName}?`,
            icon: newStatus ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonText: `Yes, ${action}!`,
            cancelButtonText: 'No, cancel',
            confirmButtonColor: newStatus ? '#388e3c' : '#d33',
        });

        if (result.isConfirmed) {
            try {
                // Using PATCH /api/hr/:id to toggle isActive status
                const res = await fetch(`${API_BASE}/api/hr/${employeeId}`, { // Assuming HR update route handles this
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ isActive: newStatus }), 
                });

                if (!res.ok) throw new Error("Failed to update employee status. Check backend route /api/hr/:id");
                
                // ⭐ Instant UI Update: Update the local state
                setEmployees(currentEmployees => 
                    currentEmployees.map(emp => 
                        emp._id === employeeId ? { ...emp, isActive: newStatus } : emp
                    )
                );

                Swal.fire("Success", `${employeeName} has been ${action.toLowerCase()}d successfully.`, "success");

            } catch (err) {
                console.error(err);
                Swal.fire("Error", err.message || "Could not update employee status.", "error");
            }
        }
    };
    
    // ⭐ FIX: Handle Employee Data Editing
    const handleEdit = async (emp) => {
        // Prepare supervisor options for the dropdown
        const supervisorOptions = Object.keys(supervisors).map(id => 
            `<option value="${id}" ${id === emp.supervisor ? 'selected' : ''}>${supervisors[id]}</option>`
        ).join('');
        
        const { value: formValues } = await Swal.fire({
            title: `Edit ${emp.name} (${emp.empId})`,
            html: 
                `<label style="display: block; text-align: left; margin-top: 10px; font-weight: 600;">Name:</label>
                 <input id="swal-name" class="swal2-input" value="${emp.name}" placeholder="Name">
                 
                 <label style="display: block; text-align: left; margin-top: 10px; font-weight: 600;">Designation:</label>
                 <input id="swal-designation" class="swal2-input" value="${emp.designation || ''}" placeholder="Designation">
                 
                 <label style="display: block; text-align: left; margin-top: 10px; font-weight: 600;">Time In (HH:mm):</label>
                 <input id="swal-timeIn" class="swal2-input" value="${emp.timeIn || ''}" placeholder="e.g. 09:00">
                 
                 <label style="display: block; text-align: left; margin-top: 10px; font-weight: 600;">Supervisor:</label>
                 <select id="swal-supervisor" class="swal2-select" style="width: 100%; margin: 10px 0; padding: 10px;">
                    <option value="">--Select Supervisor--</option>
                    ${supervisorOptions}
                 </select>
                 
                 <label style="display: block; text-align: left; margin-top: 10px; font-weight: 600;">Role (Cannot Change):</label>
                 <input class="swal2-input" value="${emp.role}" readonly style="background-color: #eee;">`,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                // ... validation logic (omitted for brevity, assume it's valid)
                const name = document.getElementById('swal-name').value;
                const designation = document.getElementById('swal-designation').value;
                const timeIn = document.getElementById('swal-timeIn').value;
                const supervisorId = document.getElementById('swal-supervisor').value;

                if (!name) { Swal.showValidationMessage('Name is required'); return false; }
                if (timeIn && !/^\d{1,2}:\d{2}$/.test(timeIn)) { Swal.showValidationMessage('Time In must be in HH:mm format'); return false; }

                return { name, designation, timeIn: timeIn || null, supervisorId: supervisorId || null };
            }
        });

        if (formValues) {
            try {
                const res = await fetch(`${API_BASE}/api/hr/${emp._id}`, { // Assuming /api/hr/:id handles user updates
                    method: "PUT", // Use PUT for update
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: formValues.name,
                        designation: formValues.designation,
                        timeIn: formValues.timeIn,
                        supervisor: formValues.supervisorId,
                    }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Failed to update employee details.");
                }

                // Instant UI Update: Update the local state
                setEmployees(currentEmployees => 
                    currentEmployees.map(e => 
                        e._id === emp._id ? { ...e, ...formValues, supervisor: formValues.supervisorId } : e
                    )
                );

                Swal.fire("Updated!", `${formValues.name}'s details have been updated.`, "success");

            } catch (err) {
                console.error("Update Error:", err);
                Swal.fire("Error", err.message || "Failed to save changes.", "error");
            }
        }
    };
    
    // Function to reset password
    const handleReset = async (employeeId, employeeName) => {
        const result = await Swal.fire({
            title: `Reset Password for ${employeeName}`,
            text: "Are you sure you want to reset this employee's password? A new temporary password will be generated.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Reset!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#f97316',
        });

        if (result.isConfirmed) {
            try {
                // ⭐ NOTE: Assuming you have an API route /api/hr/reset-password/:id
                const res = await fetch(`${API_BASE}/api/hr/reset-password/${employeeId}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Failed to reset password. Check backend route /api/hr/reset-password/:id");
                
                const data = await res.json();

                Swal.fire("Password Reset", 
                    `New Password: <strong>${data.newPassword}</strong>. Please provide this to the employee.`, 
                    "success");

            } catch (err) {
                console.error("Password Reset Error:", err);
                Swal.fire("Error", "Could not reset password.", "error");
            }
        }
    };

    // -------------------- Filtering and Rendering --------------------

    const filteredEmployees = employees.filter((emp) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const supervisorName = supervisors[emp.supervisor] || '';
        
        return (
            emp.name.toLowerCase().includes(lowerSearchTerm) ||
            (emp.empId && emp.empId.toLowerCase().includes(lowerSearchTerm)) ||
            (emp.designation && emp.designation.toLowerCase().includes(lowerSearchTerm)) ||
            supervisorName.toLowerCase().includes(lowerSearchTerm) ||
            emp.role.toLowerCase().includes(lowerSearchTerm)
        );
    });

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2>Employee's Salary Detail ({employees.length})</h2>
                <div>
                    <button onClick={() => navigate("/hr")} style={backBtn}>
                        🔙 HR Dashboard
                    </button>
                    <button onClick={() => navigate("/")} style={logoutBtn}>
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                <input
                    type="text"
                    placeholder="Search by Name, EmpID, Designation, or Supervisor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInputStyle}
                />
            </div>

            {/* Employee Table */}
            <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Emp ID</th>
                            <th style={thStyle}>Role</th>
                            <th style={thStyle}>Designation</th>
                            <th style={thStyle}>Monthly Salary</th>
                            <th style={thStyle}>Special Allowance</th>
                            <th style={thStyle}>Conveyance</th>
                            <th style={thStyle}>EPF</th>
                            <th style={thStyle}>ESIC</th>
                            <th style={thStyle}>Supervisor</th>
                            <th style={thStyle}>Time In</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan="13" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                        )}
                        {!loading && filteredEmployees.length === 0 && (
                            <tr><td colSpan="13" style={{ textAlign: 'center', padding: '20px' }}>No users found matching "{searchTerm}".</td></tr>
                        )}
                        {!loading && filteredEmployees.map((emp) => (
                            <tr key={emp._id} style={{ backgroundColor: emp.isActive ? '#fff' : '#fef2f2', borderBottom: '1px solid #eee' }}>
                                <td style={tdStyle}>{emp.name}</td>
                                <td style={tdStyle}>{emp.empId}</td>
                                <td style={tdStyle}>{emp.role}</td>
                                <td style={tdStyle}>{emp.designation}</td>
                                <td style={{...tdStyle, color: 'blue', fontWeight: 'bold'}}>{emp.basicSalary || '-'}</td>
                                <td style={{...tdStyle, color: 'green'}}>{emp.specialAllowance || '-'}</td>
                                <td style={{...tdStyle, color: 'purple'}}>{emp.conveyance || '-'}</td>
                                <td style={{...tdStyle, color: emp.epf === 'Yes' ? 'green' : 'red'}}>{emp.epf || 'No'}</td>
                                <td style={{...tdStyle, color: emp.esic === 'Yes' ? 'green' : 'red'}}>{emp.esic || 'No'}</td>
                                <td style={tdStyle}>{supervisors[emp.supervisor] || '-'}</td>
                                <td style={tdStyle}>{emp.timeIn || '-'}</td>
                                <td style={{ ...tdStyle, color: emp.isActive ? 'green' : 'red', fontWeight: 'bold' }}>
                                    {emp.isActive ? 'Active' : 'Inactive'}
                                </td>
                                <td style={tdStyle}>
                                    <button onClick={() => handleEdit(emp)} style={editBtn}>
                                        Edit
                                    </button>
                                    <button onClick={() => handleReset(emp._id, emp.name)} style={resetBtn}>
                                        Reset PW
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(emp._id, emp.name, emp.isActive)}
                                        style={emp.isActive ? deactivateBtn : reactivateBtn}
                                    >
                                        {emp.isActive ? 'Deactivate' : 'Reactivate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// -------------------- Styles --------------------

const containerStyle = {
    maxWidth: 1400,
    margin: "24px auto",
    fontFamily: "Segoe UI, sans-serif",
    padding: 20,
};
const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '2px solid #eee'
};
const tableWrapperStyle = {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 6px 18px rgba(0,0.0.0,0.06)",
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
const searchInputStyle = {
    padding: "10px 15px",
    borderRadius: 6,
    border: "1px solid #ccc",
    width: "100%",
    maxWidth: 400,
};

const baseBtn = {
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 12,
    border: "none",
    marginLeft: 5,
    marginBottom: 5
};

const backBtn = {
    ...baseBtn,
    backgroundColor: "#6b7280",
    color: "white",
    fontSize: 14,
    padding: "10px 15px"
};
const logoutBtn = {
    ...baseBtn,
    backgroundColor: "#d32f2f",
    color: "white",
    fontSize: 14,
    padding: "10px 15px"
};

const editBtn = {
    ...baseBtn,
    backgroundColor: "#1976d2",
    color: "white",
};

const resetBtn = {
    ...baseBtn,
    backgroundColor: "#f97316",
    color: "white",
};

const deactivateBtn = {
    ...baseBtn,
    backgroundColor: "#ef4444",
    color: "white",
};

const reactivateBtn = {
    ...baseBtn,
    backgroundColor: "#10b981",
    color: "white",
};