import React, { useEffect, useState } from "react";

export default function AdminHRReport() {
  const [hrList, setHrList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch all HRs from backend
  useEffect(() => {
    const fetchHRs = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/admin/hr-list");
        const data = await res.json();
        setHrList(data);
      } catch (err) {
        console.error("Error fetching HR list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHRs();
  }, []);

  // 🔹 Disable HR (soft delete)
  const handleDisable = async (id) => {
    if (!window.confirm("Are you sure you want to disable this HR?")) return;
    try {
      const res = await fetch(`http://localhost:4000/api/admin/hr-disable/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        setHrList((prev) => prev.filter((hr) => hr._id !== id));
        alert("HR disabled successfully");
      } else {
        alert("Failed to disable HR");
      }
    } catch (err) {
      console.error("Error disabling HR:", err);
    }
  };

  // 🔹 Reset HR Password
  const handleResetPassword = async (id) => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;
    try {
      const res = await fetch(`http://localhost:4000/api/admin/hr-reset-password/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        alert("Password reset successfully");
      } else {
        alert("Failed to reset password");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
    }
  };

  // 🔹 Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600 text-lg">Loading HR list...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
        🏢 Company Name
      </h1>
      <h2 className="text-xl underline mb-6 text-center text-gray-700">
        HR List
      </h2>

      {hrList.length === 0 ? (
        <p className="text-center text-gray-500">No HR records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm shadow-lg rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Company</th>
                <th className="p-3 border">Designation</th>
                <th className="p-3 border">Contact No</th>
                <th className="p-3 border">HR ID</th>
                <th className="p-3 border">Password</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hrList.map((hr) => (
                <tr key={hr._id} className="hover:bg-gray-50">
                  <td className="p-2 border text-center">{hr.name}</td>
                  <td className="p-2 border text-center">{hr.company}</td>
                  <td className="p-2 border text-center">{hr.designation}</td>
                  <td className="p-2 border text-center">{hr.contact}</td>
                  <td className="p-2 border text-center">{hr.empId}</td>
                  <td className="p-2 border text-center">••••••••</td>
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => handleResetPassword(hr._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2 transition"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleDisable(hr._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                    >
                      Disable
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
