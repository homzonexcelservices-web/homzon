// ✅ src/pages/SupervisorAttendance.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const SupervisorAttendance = ({ onBack }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem("token");
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      try {
        const res = await axios.get(`${API_BASE_URL}/supervisor/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Mark late automatically based on timeIn comparison
        const employeesWithLate = res.data.map(emp => {
          const hrTimeIn = new Date(`1970-01-01T${emp.hrTimeIn}:00`);
          const employeeTimeIn = new Date(`1970-01-01T${emp.timeIn}:00`);
          const late = employeeTimeIn - hrTimeIn > 60000; // 1 minute late
          return { ...emp, late, status: "Present" };
        });

        setEmployees(employeesWithLate);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch employees.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();

    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (index, value) => {
    const copy = [...employees];
    copy[index].status = value;

    // Automatically mark HalfDay if late and status is Present
    if (copy[index].late && value === "Present") {
      copy[index].status = "HalfDay";
    }

    setEmployees(copy);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    try {
      await axios.post(
        `${API_BASE_URL}/attendance/submit`,
        employees.map(e => ({ employeeId: e.employeeId, status: e.status })),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Attendance submitted!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit attendance.");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Attendance</h1>
      <div className="text-3xl font-mono mb-4">{clock.toLocaleTimeString()}</div>

      {loading && <p>Loading...</p>}
      {!loading && employees.length === 0 && <p>No employees assigned.</p>}

      {!loading && employees.length > 0 && (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Company</th>
              <th className="p-2 border">Department</th>
              <th className="p-2 border">Designation</th>
              <th className="p-2 border">Time-In</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, idx) => (
              <tr key={emp.employeeId} className={emp.late ? "bg-red-200" : ""}>
                <td className="p-2 border">{emp.name}</td>
                <td className="p-2 border">{emp.company}</td>
                <td className="p-2 border">{emp.department}</td>
                <td className="p-2 border">{emp.designation}</td>
                <td className="p-2 border">{emp.timeIn}</td>
                <td className="p-2 border">
                  <select
                    value={emp.status}
                    onChange={e => handleStatusChange(idx, e.target.value)}
                    className="border px-2 py-1"
                  >
                    <option>Present</option>
                    <option>Absent</option>
                    <option>HalfDay</option>
                    <option>Paid Leave</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
          onClick={handleSubmit}
        >
          Submit
        </button>
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default SupervisorAttendance;
