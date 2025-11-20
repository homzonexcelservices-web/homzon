import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// API Base URL (Use your actual base URL, ensuring this matches your environment)
const API_BASE = "http://localhost:4000"; 

export default function SalaryManagement() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Default to current month/year for the filter
    const today = new Date();
    // Month is 0-indexed in JS, so add 1 for 1-12
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());

    useEffect(() => {
        if (!token) {
            Swal.fire("Session Expired", "Please login again.", "error");
            navigate("/");
            return;
        }

        const controller = new AbortController();
        // Fetch report data based on selected year and month (1-12)
        fetchMonthlyReport(year, month, controller.signal);

        return () => controller.abort();
    }, [year, month, token, navigate]); 

    // 💰 API Call Function: Fetches aggregated monthly attendance summary
    async function fetchMonthlyReport(selectedYear, selectedMonth, signal) {
        setLoading(true);
        // Backend endpoint should provide aggregated data for payroll
        const apiUrl = `${API_BASE}/api/reports/attendance-monthly?year=${selectedYear}&month=${selectedMonth}`;
        
        try {
            const res = await fetch(apiUrl, {
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                },
                signal
            });

            if (res.status === 401) {
                localStorage.removeItem("token");
                Swal.fire("Session Expired", "Please login again.", "error");
                navigate("/");
                return;
            }

            const contentType = res.headers.get("content-type") || "";
            let body;
            if (contentType.includes("application/json")) {
                body = await res.json();
            } else {
                body = await res.text();
            }

            if (!res.ok) {
                console.error("Monthly report fetch failed:", {
                    url: apiUrl,
                    status: res.status,
                    body
                });

                const serverMsg = (body && (body.message || body.error)) || (typeof body === "string" ? body : `HTTP ${res.status}`);
                Swal.fire("Error", `Failed to load Monthly Salary Report: ${serverMsg}`, "error");
                setReportData([]);
                return;
            }

            // Success -> normalize payload
            const payload = Array.isArray(body) ? body : (body && body.data) ? body.data : [];
            const normalized = Array.isArray(payload) ? payload.map(r => ({
                employeeId: r.employeeId || r._id || r.id || null,
                name: r.name || `${r.firstName || ""} ${r.lastName || ""}`.trim() || "Unknown",
                department: r.department || r.company || "-",
                designation: r.designation || r.role || "-",
                // Ensure default to 0 if null/undefined
                presentDays: (r.presentDays ?? r.present ?? 0),
                absentDays: (r.absentDays ?? r.absent ?? 0),
                halfDays: (r.halfDays ?? r.halfDay ?? 0),
                lateMarkings: (r.lateMarkings ?? r.lates ?? 0),
                // New salary fields
                remainingPaidLeaves: r.remainingPaidLeaves ?? 0,
                grossSalary: r.grossSalary ?? 0,
                deductions: r.deductions ?? 0,
                netSalary: r.netSalary ?? 0,
                overtime: r.overtime ?? 0,
                raw: r
            })) : [];

            setReportData(normalized);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error("Fetch error for Monthly Salary Report:", err);
            Swal.fire("Error", "Unable to load Monthly Salary Report. Check backend is running.", "error");
            setReportData([]);
        } finally {
            setLoading(false);
        }
    }

    // REMOVED: onSoftDelete function (Soft Delete logic removed as it belongs to Employee Management)

    const handleBack = () => navigate("/hr");

    // Navigate to Payroll generate page with current report + month/year
    const handleGeneratePayroll = () => {
        if (!reportData.length) {
            Swal.fire("No Data", "No attendance records found for this month to generate payroll.", "info");
            return;
        }
        // Navigate to the payroll generation page, passing the required data (month, year, reportData)
        navigate("/payroll/generate", { state: { month, year, reportData } });
    };

    // 📈 UI Rendering Logic
    return (
        <div style={styles.container}>
            {/* --- Header updated for Salary Management --- */}
            <h1 style={styles.header}>💰 Salary Management</h1>
            
            {/* --- Month and Year Filters & Search --- */}
            <div style={styles.filterContainer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <label style={styles.label}>Select Month:</label>
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={styles.input}>
                        {/* Map months 1 to 12 */}
                        {[...Array(12).keys()].map(i => (
                            <option key={i + 1} value={i + 1}>{new Date(year, i, 1).toLocaleString('en-US', { month: 'long' })}</option>
                        ))}
                    </select>

                    <label style={{ ...styles.label }}>Select Year:</label>
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        style={{ ...styles.input, maxWidth: 100 }}
                        min="2020"
                        max={new Date().getFullYear()}
                    />

                    {/* Generate Payroll Button */}
                    <button
                        onClick={handleGeneratePayroll}
                        style={{ ...styles.actionBtn, backgroundColor: "#00b894" }} // Green color for action
                    >
                        💰 Generate Payroll
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search by Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {/* --- Report Table --- */}
            <div style={styles.tableWrapper}>
                {loading ? (
                    <p style={{textAlign: 'center', padding: '20px'}}>Loading report data...</p>
                ) : reportData.length === 0 ? (
                    <p style={{textAlign: 'center', padding: '20px'}}>No attendance records found for the selected month.</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.theadRow}>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Department</th>
                                <th style={styles.th}>Designation</th>
                                <th style={styles.th}>Present</th>
                                <th style={styles.th}>Absent</th>
                                <th style={styles.th}>Half-Day</th>
                                <th style={styles.th}>Late Count</th>
                                <th style={styles.th}>Paid Leaves Remaining</th>
                                <th style={styles.th}>Gross Salary</th>
                                <th style={styles.th}>Deductions</th>
                                <th style={styles.th}>Net Salary</th>
                                <th style={styles.th}>Overtime</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData
                                .filter(record => record.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((record) => (
                                <tr key={record.employeeId || record.name} style={styles.tr}>
                                    <td style={styles.td}>{record.name}</td>
                                    <td style={styles.td}>{record.department}</td>
                                    <td style={styles.td}>{record.designation}</td>
                                    <td style={{...styles.td, color: '#28a745', fontWeight: 'bold'}}>{record.presentDays || 0}</td>
                                    <td style={{...styles.td, color: '#dc3545', fontWeight: 'bold'}}>{record.absentDays || 0}</td>
                                    <td style={{...styles.td, color: '#ffc107', fontWeight: 'bold'}}>{record.halfDays || 0}</td>
                                    <td style={{...styles.td, color: '#007bff', fontWeight: 'bold'}}>{record.lateMarkings || 0}</td>
                                    <td style={styles.td}>{record.remainingPaidLeaves || 0}</td>
                                    <td style={styles.td}>{record.grossSalary || 0}</td>
                                    <td style={styles.td}>{record.deductions || 0}</td>
                                    <td style={styles.td}>{record.netSalary || 0}</td>
                                    <td style={styles.td}>{record.overtime || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* --- Back Button --- */}
            <div style={{ marginTop: 30, textAlign: 'center' }}>
                <button onClick={handleBack} style={styles.backBtn}>
                    🔙 Back to HR Dashboard
                </button>
            </div>
        </div>
    );
}


const styles = {
    container: {
        maxWidth: 1100,
        margin: "24px auto",
        fontFamily: "Segoe UI, sans-serif",
        padding: 20,
    },
    header: {
        textAlign: "center",
        fontSize: 30,
        marginBottom: 20,
        color: '#4A148C', // HR Purple
    },
    filterContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        padding: 15,
        border: '1px solid #eee',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
    },
    label: {
        fontWeight: 600,
        marginRight: 8,
    },
    input: {
        padding: "8px 10px",
        borderRadius: 6,
        border: "1px solid #ccc",
        minWidth: 150
    },
    tableWrapper: {
        overflowX: "auto",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        padding: 12,
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    theadRow: {
        background: "#e1bee7", // Light purple for header
    },
    th: { 
        padding: "12px", 
        textAlign: "left", 
        fontWeight: 700, 
        fontSize: 14,
        borderBottom: '2px solid #ce93d8'
    },
    tr: {
        borderBottom: "1px solid #eee",
    },
    td: { 
        padding: "10px 12px", 
        fontSize: 14 
    },
    backBtn: {
        padding: "12px 25px",
        backgroundColor: "#6b7280",
        color: "white",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: "bold",
    },
    // Style for action buttons (like Generate Payroll)
    actionBtn: {
        padding: "10px 15px",
        color: "white",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: 14
    }
};