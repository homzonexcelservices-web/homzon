// ✅ src/pages/HRAttendanceReportView.jsx (Modified for Monthly Salary Report)

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// API Base URL (Use your actual API base URL or VITE_API_BASE)
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

// Helper function to get the current year and month (1-based)
const getCurrentMonthYear = () => {
    const today = new Date();
    return {
        year: today.getFullYear().toString(),
        month: (today.getMonth() + 1).toString().padStart(2, '0') // 01 to 12
    };
};

export default function HRAttendanceReportView() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const hrName = localStorage.getItem("name") || "HR User";

    const { year: currentYear, month: currentMonth } = getCurrentMonthYear();

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [salaryInputs, setSalaryInputs] = useState({});

    // -------------------- Data Fetching --------------------

    async function fetchMonthlyReport(year, month) {
        setLoading(true);
        setReportData([]); // Clear previous data
        
        // Month must be 1-12. The format is year=YYYY&month=M
        const monthNumber = parseInt(month, 10);
        
        try {
            // ⭐ Backend Endpoint: /api/reports/attendance-monthly
            // यह endpoint सभी कर्मचारियों का मासिक summary देता है, जो सैलरी के लिए आवश्यक है।
            const res = await fetch(`${API_BASE}/api/reports/attendance-monthly?year=${year}&month=${monthNumber}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (!res.ok) throw new Error("Failed to fetch monthly report. (Check Backend /api/attendance/monthly-report route)");
            
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            console.error("Error fetching report:", err);
            Swal.fire("Error", err.message || "Unable to load monthly attendance report.", "error");
        } finally {
            setLoading(false);
        }
    }

    // ⭐ Initial load and when month/year changes
    useEffect(() => {
        if (!token) {
            Swal.fire("Session Expired", "Please login again.", "warning");
            navigate("/");
            return;
        }
        fetchMonthlyReport(selectedYear, selectedMonth);
    }, [token, navigate, selectedYear, selectedMonth]);


    // -------------------- UI Helpers --------------------
    
    // Generate options for the last 3 years
    const yearOptions = Array.from({ length: 3 }, (_, i) => (currentYear - i).toString());

    const monthOptions = [
        { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
        { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
        { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
        { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
    ];
    
    // Calculate total working days in the selected month
    const getDaysInMonth = (year, month) => {
        // month is 1-based, new Date(year, month, 0) gives the last day of month
        return new Date(year, parseInt(month, 10), 0).getDate();
    };

    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

    const handleBack = () => navigate("/hr");
    const handleLogout = () => {
        localStorage.clear();
        Swal.fire("Logged out", "Session closed successfully", "success");
        navigate("/");
    };
    
    // Placeholder for Export function
    const handleExport = () => {
        Swal.fire('Export Feature', 'Data export to CSV/Excel functionality will be implemented here.', 'info');
        // You would typically use a library like 'sheetjs' or generate a CSV file here
    };

    const handleUpdateSalary = async (employeeId) => {
        const inputs = salaryInputs[employeeId];
        if (!inputs) {
            Swal.fire('Error', 'Please fill in salary details', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/employee/update-salary`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    employeeId,
                    year: selectedYear,
                    month: selectedMonth,
                    basicSalary: parseFloat(inputs.basicSalary) || 0,
                    specialAllowance: parseFloat(inputs.specialAllowance) || 0,
                    conveyance: parseFloat(inputs.conveyance) || 0,
                    epf: inputs.epf,
                    esic: inputs.esic,
                }),
            });

            if (!response.ok) throw new Error('Failed to update salary');

            Swal.fire('Success', 'Salary updated successfully', 'success');
            fetchMonthlyReport(selectedYear, selectedMonth); // Refresh data
        } catch (err) {
            console.error('Error updating salary:', err);
            Swal.fire('Error', err.message || 'Failed to update salary', 'error');
        }
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2>Monthly Attendance Summary Report (For Salary)</h2>
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
                Welcome HR (<strong>{hrName}</strong>). Select month and year to view aggregated attendance data for salary processing.
            </p>

            {/* Selector and Refresh */}
            <div style={controlsStyle}>
                <div style={dropdownGroupStyle}>
                    <label style={labelStyle}>Select Month:</label>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        style={selectStyle}
                    >
                        {monthOptions.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                
                <div style={dropdownGroupStyle}>
                    <label style={labelStyle}>Select Year:</label>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)} 
                        style={selectStyle}
                    >
                        {yearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                
                <button 
                    onClick={() => fetchMonthlyReport(selectedYear, selectedMonth)} 
                    style={refreshBtn}
                >
                    Generate Report
                </button>

                <button 
                    onClick={handleExport} 
                    style={exportBtn}
                >
                    ⬇️ Export to Excel
                </button>
            </div>

            {/* Report Table */}
            <div style={tableWrapperStyle}>
                <p style={{ padding: '10px 0', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>
                    Report for: {monthOptions.find(m => m.value === selectedMonth)?.label}, {selectedYear} (Total Days in Month: {daysInMonth})
                </p>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Employee Name (ID)</th>
                            <th style={thStyle}>Designation</th>
                            <th style={thStyle}>Department/Company</th>
                            <th style={thStyle}>Basic Salary</th>
                            <th style={thStyle}>Special Allowance</th>
                            <th style={thStyle}>Conveyance</th>
                            <th style={thStyle}>EPF</th>
                            <th style={thStyle}>ESIC</th>
                            <th style={thStyle}>Gross Salary</th>
                            <th style={thStyle}>Deductions</th>
                            <th style={thStyle}>Net Salary</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>Loading Data...</td></tr>
                        )}
                        {!loading && reportData.length === 0 && (
                            <tr><td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>No attendance records found for this month.</td></tr>
                        )}
                        {!loading && reportData.map((data) => {
                            const handleInputChange = (field, value) => {
                                setSalaryInputs(prev => ({
                                    ...prev,
                                    [data.employeeId]: {
                                        ...prev[data.employeeId],
                                        [field]: value
                                    }
                                }));
                            };

                            return (
                                <tr key={data.employeeId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>{data.name} ({data.empId || 'N/A'})</td>
                                    <td style={tdStyle}>{data.designation || '-'}</td>
                                    <td style={tdStyle}>{data.department || data.company || '-'}</td>
                                    <td style={tdStyle}>
                                        <input
                                            type="number"
                                            value={salaryInputs[data.employeeId]?.basicSalary || data.proratedBasic || ''}
                                            onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                                            style={{ width: '80px', padding: '4px' }}
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        <input
                                            type="number"
                                            value={salaryInputs[data.employeeId]?.specialAllowance || data.proratedSpecialAllowance || ''}
                                            onChange={(e) => handleInputChange('specialAllowance', e.target.value)}
                                            style={{ width: '80px', padding: '4px' }}
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        <input
                                            type="number"
                                            value={salaryInputs[data.employeeId]?.conveyance || data.proratedConveyance || ''}
                                            onChange={(e) => handleInputChange('conveyance', e.target.value)}
                                            style={{ width: '80px', padding: '4px' }}
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        <select
                                            value={salaryInputs[data.employeeId]?.epf || data.epf || 'No'}
                                            onChange={(e) => handleInputChange('epf', e.target.value)}
                                            style={{ width: '60px', padding: '4px' }}
                                        >
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </td>
                                    <td style={tdStyle}>
                                        <select
                                            value={salaryInputs[data.employeeId]?.esic || data.esic || 'No'}
                                            onChange={(e) => handleInputChange('esic', e.target.value)}
                                            style={{ width: '60px', padding: '4px' }}
                                        >
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </td>
                                    <td style={{...tdStyle, color: 'blue', fontWeight: 'bold'}}>{data.grossSalary}</td>
                                    <td style={{...tdStyle, color: 'orange'}}>{data.deductions}</td>
                                    <td style={{...tdStyle, color: 'green', fontWeight: 'bold'}}>{data.netSalary}</td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => handleUpdateSalary(data.employeeId)}
                                            style={{...baseBtn, backgroundColor: '#28a745', color: 'white', fontSize: '12px', padding: '6px 10px'}}
                                        >
                                            Update
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
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
const controlsStyle = {
    display: 'flex',
    gap: 20,
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};
const dropdownGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
};
const labelStyle = {
    fontWeight: 600,
    minWidth: 100
};
const selectStyle = {
    padding: "10px 15px",
    borderRadius: 6,
    border: "1px solid #ccc",
    minWidth: 150
};
const tableWrapperStyle = {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 6px 18px rgba(0,0.0.0,0.06)",
    padding: 12,
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

// Button Styles (from previous components)
const baseBtn = {
    padding: "10px 15px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    border: "none",
};

const backBtn = {
    ...baseBtn,
    backgroundColor: "#6b7280",
    color: "white",
    fontSize: 14,
    marginLeft: 10
};
const logoutBtn = {
    ...baseBtn,
    backgroundColor: "#d32f2f",
    color: "white",
    fontSize: 14,
    marginLeft: 10
};
const refreshBtn = {
    ...baseBtn,
    backgroundColor: "#007bff",
    color: "white",
};
const exportBtn = {
    ...baseBtn,
    backgroundColor: "#388e3c", // Green for Export
    color: "white",
};