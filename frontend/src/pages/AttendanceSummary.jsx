// src/pages/AttendanceSummary.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const AttendanceSummary = () => {
    const [summary, setSummary] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    const fetchSummary = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get(
                `http://localhost:5000/attendance/summary/${month}/${year}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSummary(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

        <div className="mt-4 flex gap-2">
    <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={() => window.open(`http://localhost:5000/attendance/export/${month}/${year}?type=excel`, "_blank")}
    >
        Export Excel
    </button>
    <button
        className="bg-red-500 text-white px-4 py-2 rounded"
        onClick={() => window.open(`http://localhost:5000/attendance/export/${month}/${year}?type=pdf`, "_blank")}
    >
        Export PDF
    </button>
</div>


    useEffect(() => { fetchSummary(); }, [month, year]);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Monthly Attendance Summary</h1>

            <div className="mb-4 flex gap-2">
                <input
                    type="number"
                    value={month}
                    min="1"
                    max="12"
                    onChange={e => setMonth(e.target.value)}
                    className="border px-2 py-1"
                />
                <input
                    type="number"
                    value={year}
                    min="2000"
                    max="2100"
                    onChange={e => setYear(e.target.value)}
                    className="border px-2 py-1"
                />
                <button onClick={fetchSummary} className="bg-blue-500 text-white px-4 py-1 rounded">
                    Fetch
                </button>
            </div>

            {loading && <p>Loading...</p>}
            {!loading && summary.length === 0 && <p>No records found.</p>}

            {!loading && summary.length > 0 && (
                <table className="min-w-full border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">Company</th>
                            <th className="p-2 border">Department</th>
                            <th className="p-2 border">Designation</th>
                            <th className="p-2 border">Present</th>
                            <th className="p-2 border">HalfDay</th>
                            <th className="p-2 border">Absent</th>
                            <th className="p-2 border">Paid Leave</th>
                            <th className="p-2 border">Late</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.map(emp => (
                            <tr key={emp.employeeId}>
                                <td className="p-2 border">{emp.name}</td>
                                <td className="p-2 border">{emp.company}</td>
                                <td className="p-2 border">{emp.department}</td>
                                <td className="p-2 border">{emp.designation}</td>
                                <td className="p-2 border">{emp.Present}</td>
                                <td className="p-2 border">{emp.HalfDay}</td>
                                <td className="p-2 border">{emp.Absent}</td>
                                <td className="p-2 border">{emp.PaidLeave}</td>
                                <td className="p-2 border">{emp.Late}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AttendanceSummary;
