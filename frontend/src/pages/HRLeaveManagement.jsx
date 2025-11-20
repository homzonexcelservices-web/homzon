import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HRLeaveManagement() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [comments, setComments] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "hr") {
      alert("Access denied");
      navigate("/");
      return;
    }
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/leave/hr");
      const data = await res.json();
      if (data.success) setLeaves(data.leaves);
    } catch (err) {
      console.error("Error fetching leaves:", err);
    }
    setLoading(false);
  };

  const handleAction = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:4000/api/leave/hr/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          comments,
          approverName: localStorage.getItem("name") || "HR",
        }),
      });
      const data = await res.json();
      alert(data.message);
      setSelectedLeave(null);
      setComments("");
      fetchLeaves();
    } catch (err) {
      console.error("Error updating leave:", err);
      alert("Failed to update");
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

  return (
    <div style={{ maxWidth: "1000px", margin: "20px auto", padding: "20px" }}>
      <h2 style={{ color: "#1e3a8a", textAlign: "center" }}>
        HR Leave Management
      </h2>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr style={{ background: "#e0e7ff" }}>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Employee</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>From</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>To</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Reason</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Status</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length > 0 ? (
            leaves.map((l) => (
              <tr key={l._id}>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{l.employeeName}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{formatDate(l.fromDate)}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{formatDate(l.toDate)}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{l.reason}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{l.status}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  <button
                    onClick={() => setSelectedLeave(l)}
                    style={{ padding: "4px 8px", background: "#007bff", color: "white", border: "none", borderRadius: 4 }}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                No leaves pending HR approval
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedLeave && (
        <div style={{ marginTop: 20, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
          <h3>Review Leave Request</h3>
          <p><strong>Employee:</strong> {selectedLeave.employeeName}</p>
          <p><strong>From:</strong> {formatDate(selectedLeave.fromDate)}</p>
          <p><strong>To:</strong> {formatDate(selectedLeave.toDate)}</p>
          <p><strong>Reason:</strong> {selectedLeave.reason}</p>
          <textarea
            placeholder="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            style={{ width: "100%", height: 60, marginTop: 10 }}
          />
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => handleAction(selectedLeave._id, "Approved")}
              style={{ padding: "8px 16px", background: "green", color: "white", border: "none", borderRadius: 4, marginRight: 10 }}
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(selectedLeave._id, "Rejected")}
              style={{ padding: "8px 16px", background: "red", color: "white", border: "none", borderRadius: 4, marginRight: 10 }}
            >
              Reject
            </button>
            <button
              onClick={() => setSelectedLeave(null)}
              style={{ padding: "8px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: 4 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          onClick={() => navigate("/hr")}
          style={{ padding: "10px 20px", background: "#6b7280", color: "white", border: "none", borderRadius: 6 }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
