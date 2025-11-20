// ✅ src/pages/ManageSupervisorList.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function ManageSupervisorList() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        if (!token) {
            Swal.fire("Session Expired", "Please login again.", "warning");
            navigate("/");
            return;
        }
        fetchSupervisors();
    }, [token, navigate]);

    // -------------------- Fetch Data --------------------

    const fetchSupervisors = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/employee/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch user list");
            const data = await res.json();
            // ✅ Only supervisors
            const supervisorList = data.filter(user => user.role === "supervisor");
            setSupervisors(supervisorList);
        } catch (err) {
            console.error("Error fetching supervisors:", err);
            Swal.fire("Error", err.message || "Unable to load supervisor list.", "error");
        } finally {
            setLoading(false);
        }
    };

    // -------------------- Core Actions --------------------

    const handleToggleActive = async (id, name, isActive) => {
        const newStatus = !isActive;
        const action = newStatus ? "Reactivate" : "Deactivate";

        const result = await Swal.fire({
            title: `Confirm ${action}`,
            text: `Are you sure you want to ${action.toLowerCase()} ${name}?`,
            icon: newStatus ? "question" : "warning",
            showCancelButton: true,
            confirmButtonText: `Yes, ${action}!`,
            cancelButtonText: "Cancel",
            confirmButtonColor: newStatus ? "#388e3c" : "#d33",
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/api/hr/${id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ isActive: newStatus }),
                });
                if (!res.ok) throw new Error("Failed to update supervisor status");

                setSupervisors((prev) =>
                    prev.map((sup) =>
                        sup._id === id ? { ...sup, isActive: newStatus } : sup
                    )
                );

                Swal.fire(
                    "Success",
                    `${name} has been ${action.toLowerCase()}d successfully.`,
                    "success"
                );
            } catch (err) {
                Swal.fire("Error", err.message || "Could not update status.", "error");
            }
        }
    };

    const handleEdit = async (sup) => {
        const { value: formValues } = await Swal.fire({
            title: `Edit ${sup.name} (${sup.empId})`,
            html: `
                <label>Name:</label>
                <input id="swal-name" class="swal2-input" value="${sup.name}" placeholder="Name">

                <label>Designation:</label>
                <input id="swal-designation" class="swal2-input" value="${sup.designation || ''}" placeholder="Designation">

                <label>Time In (HH:mm):</label>
                <input id="swal-timeIn" class="swal2-input" value="${sup.timeIn || ''}" placeholder="09:00">

                <label>Role:</label>
                <input class="swal2-input" value="${sup.role}" readonly style="background-color: #eee;">
            `,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const name = document.getElementById("swal-name").value;
                const designation = document.getElementById("swal-designation").value;
                const timeIn = document.getElementById("swal-timeIn").value;
                if (!name) {
                    Swal.showValidationMessage("Name is required");
                    return false;
                }
                if (timeIn && !/^\d{1,2}:\d{2}$/.test(timeIn)) {
                    Swal.showValidationMessage("Time In must be HH:mm");
                    return false;
                }
                return { name, designation, timeIn: timeIn || null };
            },
        });

        if (formValues) {
            try {
                const res = await fetch(`${API_BASE}/api/hr/${sup._id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: formValues.name,
                        designation: formValues.designation,
                        timeIn: formValues.timeIn,
                    }),
                });
                if (!res.ok) throw new Error("Failed to update supervisor");

                setSupervisors((prev) =>
                    prev.map((s) =>
                        s._id === sup._id ? { ...s, ...formValues } : s
                    )
                );

                Swal.fire("Updated!", `${formValues.name}'s details updated.`, "success");
            } catch (err) {
                Swal.fire("Error", err.message || "Could not save changes.", "error");
            }
        }
    };

    const handleReset = async (id, name) => {
        const result = await Swal.fire({
            title: `Reset Password for ${name}`,
            text: "A new temporary password will be generated.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Reset!",
            cancelButtonColor: "#d33",
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/api/hr/reset-password/${id}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to reset password");
                const data = await res.json();
                Swal.fire(
                    "Password Reset",
                    `New Password: <strong>${data.newPassword}</strong>`,
                    "success"
                );
            } catch (err) {
                Swal.fire("Error", err.message || "Could not reset password.", "error");
            }
        }
    };

    // -------------------- Filtering --------------------

    const filteredSupervisors = supervisors.filter((sup) => {
        if (!showInactive && !sup.isActive) return false;
        const q = searchTerm.toLowerCase();
        return (
            sup.name.toLowerCase().includes(q) ||
            (sup.empId && sup.empId.toLowerCase().includes(q)) ||
            (sup.designation && sup.designation.toLowerCase().includes(q))
        );
    });

    // -------------------- Render --------------------

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2>Manage Supervisors ({supervisors.length})</h2>
                <div>
                    <button onClick={() => navigate("/hr")} style={backBtn}>
                        🔙 HR Dashboard
                    </button>
                    <button onClick={() => navigate("/")} style={logoutBtn}>
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Search + Filter */}
            <div style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
                <input
                    type="text"
                    placeholder="Search by Name, EmpID or Designation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInputStyle}
                />
                <button
                    onClick={() => setShowInactive((prev) => !prev)}
                    style={{
                        padding: "10px 15px",
                        borderRadius: 6,
                        backgroundColor: showInactive ? "#2563eb" : "#9ca3af",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                    }}
                >
                    {showInactive ? "Show All" : "Hide Inactive"}
                </button>
            </div>

            {/* Table */}
            <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Emp ID</th>
                            <th style={thStyle}>Designation</th>
                            <th style={thStyle}>Time In</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
                                    Loading...
                                </td>
                            </tr>
                        )}
                        {!loading && filteredSupervisors.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
                                    No supervisors found.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            filteredSupervisors.map((sup) => (
                                <tr
                                    key={sup._id}
                                    style={{
                                        backgroundColor: sup.isActive ? "#fff" : "#fef2f2",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    <td style={tdStyle}>{sup.name}</td>
                                    <td style={tdStyle}>{sup.empId}</td>
                                    <td style={tdStyle}>{sup.designation}</td>
                                    <td style={tdStyle}>{sup.timeIn || "-"}</td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            color: sup.isActive ? "green" : "red",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {sup.isActive ? "Active" : "Inactive"}
                                    </td>
                                    <td style={tdStyle}>
                                        <button onClick={() => handleEdit(sup)} style={editBtn}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleReset(sup._id, sup.name)} style={resetBtn}>
                                            Reset PW
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(sup._id, sup.name, sup.isActive)}
                                            style={sup.isActive ? deactivateBtn : reactivateBtn}
                                        >
                                            {sup.isActive ? "Deactivate" : "Reactivate"}
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: "2px solid #eee",
};
const tableWrapperStyle = {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
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
    textTransform: "uppercase",
    borderBottom: "2px solid #ddd",
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
    marginBottom: 5,
};
const backBtn = { ...baseBtn, backgroundColor: "#6b7280", color: "white", fontSize: 14, padding: "10px 15px" };
const logoutBtn = { ...baseBtn, backgroundColor: "#d32f2f", color: "white", fontSize: 14, padding: "10px 15px" };
const editBtn = { ...baseBtn, backgroundColor: "#1976d2", color: "white" };
const resetBtn = { ...baseBtn, backgroundColor: "#f97316", color: "white" };
const deactivateBtn = { ...baseBtn, backgroundColor: "#ef4444", color: "white" };
const reactivateBtn = { ...baseBtn, backgroundColor: "#10b981", color: "white" };
