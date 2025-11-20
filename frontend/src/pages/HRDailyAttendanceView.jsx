// ✅ src/pages/HRDailyAttendanceView.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Modal Component for editing attendance status
const EditAttendanceModal = ({ isOpen, onClose, attendanceRecord, onSave }) => {
    const [selectedStatus, setSelectedStatus] = useState(attendanceRecord?.status || 'Present');
    const [selectedTimeIn, setSelectedTimeIn] = useState(attendanceRecord?.timeIn || '');
    const [selectedTimeOut, setSelectedTimeOut] = useState(attendanceRecord?.timeOut || '');

    useEffect(() => {
        if (attendanceRecord) {
            setSelectedStatus(attendanceRecord.status);
        }
    }, [attendanceRecord]);

    const handleSave = () => {
        onSave(attendanceRecord._id, selectedStatus, selectedTimeIn, selectedTimeOut);
        onClose();
    };

    if (!isOpen || !attendanceRecord) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                minWidth: '300px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h3>Edit Attendance Status</h3>
                <p><strong>Employee:</strong> {attendanceRecord.employee?.name}</p>
                <p><strong>Date:</strong> {new Date(attendanceRecord.date).toLocaleDateString()}</p>

                <label style={{ display: 'block', marginBottom: '10px' }}>
                    Status:
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '5px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Halfday">Halfday</option>
                    </select>
                </label>

                <label style={{ display: 'block', marginBottom: '10px' }}>
                    Time In:
                    <input
                        type="time"
                        value={selectedTimeIn}
                        onChange={(e) => setSelectedTimeIn(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '5px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                </label>

                <label style={{ display: 'block', marginBottom: '10px' }}>
                    Time Out:
                    <input
                        type="time"
                        value={selectedTimeOut}
                        onChange={(e) => setSelectedTimeOut(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '5px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                </label>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button
                        onClick={handleSave}
                        style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Save
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// API Base URL (Use your actual base URL)
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function HRDailyAttendanceView() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const hrName = localStorage.getItem("name") || "HR User";

    // Default date range from 1st of current month to today (local dates)
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [attendanceRecords, setAttendanceRecords] = useState([]); // Individual records
    const [activeEmployees, setActiveEmployees] = useState([]); // Active employees
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state for editing attendance
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // -------------------- Initial Setup --------------------

    useEffect(() => {
        if (!token) {
            Swal.fire("Session Expired", "Please login again.", "warning");
            navigate("/");
            return;
        }
        fetchData(startDate, endDate); // Fetch data on load
    }, [token, navigate]);

    useEffect(() => {
        if (token && startDate && endDate) {
            fetchData(startDate, endDate); // Fetch data whenever date range changes
        }
    }, [startDate, endDate, token]);

    // -------------------- Data Fetching --------------------

    // Fetch active employees and attendance records for the selected date range
    async function fetchData(start, end) {
        setLoading(true);
        try {
            // Fetch active employees
            const empRes = await fetch(`${API_BASE}/api/employees`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!empRes.ok) throw new Error("Failed to load employees.");
            const employees = await empRes.json();
            setActiveEmployees(employees);

            // Fetch attendance records
            const attRes = await fetch(`${API_BASE}/api/attendance?startDate=${start}&endDate=${end}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!attRes.ok) throw new Error("Failed to load attendance records.");
            const records = await attRes.json();
            setAttendanceRecords(records);
        } catch (err) {
            console.error("Error fetching data:", err);
            Swal.fire("Error", "Unable to load data for selected date range", "error");
        } finally {
            setLoading(false);
        }
    }

    // Handle employee deletion
    async function handleDeleteEmployee(employeeId) {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete the employee from the system. This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d32f2f",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete",
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/api/employee/${employeeId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to delete employee.");

                Swal.fire("Deleted!", "Employee has been deleted.", "success");
                // Refresh the data to remove the deleted employee
                fetchData(startDate, endDate);
            } catch (err) {
                console.error("Error deleting employee:", err);
                Swal.fire("Error", "Unable to delete employee.", "error");
            }
        }
    }

    // Handle attendance status modification
    const handleEditAttendance = (record) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const handleSaveAttendance = async (recordId, newStatus) => {
        try {
            const res = await fetch(`${API_BASE}/api/attendance/${recordId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to update attendance");
            }

            Swal.fire("Success!", "Attendance status updated successfully.", "success");
            // Refresh data to show updated status
            fetchData(startDate, endDate);
        } catch (err) {
            console.error("Error updating attendance:", err);
            Swal.fire("Error", err.message || "Unable to update attendance status.", "error");
        }
    };

    // -------------------- Filtering and Rendering --------------------

    // Generate list of dates in the range
    const getDatesInRange = (start, end) => {
        const dates = [];
        const startDate = new Date(start);
        const endDate = new Date(end);
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
        }
        return dates;
    };

    const datesInRange = getDatesInRange(startDate, endDate);

    // Group records by date
    const recordsByDate = attendanceRecords.reduce((acc, record) => {
        const date = new Date(record.date).toISOString().split('T')[0]; // Convert to yyyy-mm-dd format
        if (!acc[date]) acc[date] = [];
        acc[date].push(record);
        return acc;
    }, {});

    // Filtered employees based on search
    const filteredEmployees = activeEmployees.filter((emp) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
            emp.name.toLowerCase().includes(lowerSearchTerm) ||
            (emp.designation && emp.designation.toLowerCase().includes(lowerSearchTerm)) ||
            (emp.company && emp.company.toLowerCase().includes(lowerSearchTerm))
        );
    });

    const handleBack = () => navigate("/hr");
    const handleLogout = () => {
        localStorage.clear();
        Swal.fire("Logged out", "Session closed successfully", "success");
        navigate("/");
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2>Daily Attendance View ({activeEmployees.length} Employees)</h2>
                <div>
                    <button onClick={handleBack} style={backBtn}>
                        🔙 HR Dashboard
                    </button>
                    <button onClick={handleLogout} style={logoutBtn}>
                        🚪 Logout
                    </button>
                </div>
            </div>

            <p style={{ textAlign: "center", marginBottom: 15 }}>
                Welcome HR (<strong>{hrName}</strong>). View daily attendance for active employees over the selected date range.
            </p>

            {/* Date Range Selector & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 10, alignItems: 'center', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <label style={{ fontWeight: 600 }}>Start Date:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={dateInputStyle}
                    />
                    <label style={{ fontWeight: 600 }}>End Date:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={dateInputStyle}
                    />
                    <button onClick={() => fetchData(startDate, endDate)} style={refreshBtn}>
                        Refresh Data
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search by Name, Designation, or Company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInputStyle}
                />
            </div>

            {/* Attendance Table with Employees as Rows and Dates as Columns */}
            {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading Attendance Data...</div>}
            {!loading && (
                <div style={tableWrapperStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Department</th>
                                <th style={thStyle}>Designation</th>
                                {datesInRange.map((date) => {
                                    const day = new Date(date).getDate();
                                    return (
                                        <th key={date} style={thStyle}>
                                            {String(day).padStart(2, '0')}
                                        </th>
                                    );
                                })}
                                <th style={thStyle}>Present Days</th>
                                <th style={thStyle}>Absent Days</th>
                                <th style={thStyle}>Half-day Days</th>
                                <th style={thStyle}>Late Days</th>
                                <th style={thStyle}>Other Days</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp) => {
                                // Calculate summary counts for the employee
                                let presentCount = 0;
                                let absentCount = 0;
                                let halfdayCount = 0;
                                let lateCount = 0;
                                let otherCount = 0;

                                datesInRange.forEach((date) => {
                                    const dayRecords = recordsByDate[date] || [];
                                    const record = dayRecords.find(r => r.employee && r.employee._id === emp._id);
                                    const status = record ? record.status : 'Absent';
                                    const isLate = record ? record.isLate : false;
                                    if (status === 'Present') {
                                        if (isLate) lateCount++;
                                        else presentCount++;
                                    } else if (status === 'Absent') absentCount++;
                                    else if (status === 'Halfday') halfdayCount++;
                                    else otherCount++;
                                });

                                return (
                                    <tr key={emp._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>{emp.name}</td>
                                        <td style={tdStyle}>{emp.company || '-'}</td>
                                        <td style={tdStyle}>{emp.designation || '-'}</td>
                                        {datesInRange.map((date) => {
                                            const dayRecords = recordsByDate[date] || [];
                                            const record = dayRecords.find(r => r.employee && r.employee._id === emp._id);
                                            const status = record ? record.status : 'Absent';
                                            const statusColor = status === 'Present' ? 'green' : status === 'Absent' ? 'red' : status === 'Halfday' ? 'orange' : status === 'Late' ? 'purple' : 'blue';
                                            return (
                                                <td
                                                    key={date}
                                                    style={{ ...tdStyle, color: statusColor, fontWeight: 'bold', textAlign: 'center', cursor: record ? 'pointer' : 'default' }}
                                                    onClick={() => record && handleEditAttendance(record)}
                                                    title={record ? 'Click to edit attendance status' : 'No attendance record'}
                                                >
                                                    {status === 'Present' ? 'P' : status === 'Absent' ? 'A' : status === 'Halfday' ? 'H' : status === 'Late' ? 'L' : 'O'}
                                                </td>
                                            );
                                        })}
                                        <td style={tdStyle}>{presentCount}</td>
                                        <td style={tdStyle}>{absentCount}</td>
                                        <td style={tdStyle}>{halfdayCount}</td>
                                        <td style={tdStyle}>{lateCount}</td>
                                        <td style={tdStyle}>{otherCount}</td>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={() => handleDeleteEmployee(emp._id)}
                                                style={deactivateBtn}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Attendance Modal */}
            <EditAttendanceModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedRecord(null);
                }}
                attendanceRecord={selectedRecord}
                onSave={handleSaveAttendance}
            />
        </div>
    );
}

// -------------------- Styles --------------------

const containerStyle = {
    maxWidth: 1600,
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
    borderBottom: '2px solid #0088AA'
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
    background: "#e0f7fa", // Light blue background for header
    fontWeight: 700,
    fontSize: 14,
    textTransform: 'uppercase',
    borderBottom: '2px solid #b2ebf2'
};
const tdStyle = {
    padding: "10px 15px",
    fontSize: 14,
};
const searchInputStyle = {
    padding: "10px 15px",
    borderRadius: 6,
    border: "1px solid #ccc",
    maxWidth: 350,
};
const dateInputStyle = {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
};

// Button Styles
const baseBtn = {
    padding: "10px 15px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    border: "none",
    marginLeft: 10,
};

const backBtn = {
    ...baseBtn,
    backgroundColor: "#6b7280",
    color: "white",
    fontSize: 14,
};
const logoutBtn = {
    ...baseBtn,
    backgroundColor: "#d32f2f",
    color: "white",
    fontSize: 14,
};
const refreshBtn = {
    ...baseBtn,
    backgroundColor: "#007bff",
    color: "white",
    fontSize: 14,
    padding: "8px 12px",
    marginLeft: 0,
};
const deactivateBtn = {
    ...baseBtn,
    backgroundColor: "#ff9800",
    color: "white",
    fontSize: 12,
    padding: "6px 10px",
    marginLeft: 0,
};
