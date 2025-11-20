import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HRAdvanceManagement() {
  const navigate = useNavigate();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [comments, setComments] = useState("");
  const [modifiedAmount, setModifiedAmount] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "hr") {
      alert("Access denied");
      navigate("/");
      return;
    }
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/advance/hr");
      const data = await res.json();
      if (data.success) setAdvances(data.advances);
    } catch (err) {
      console.error("Error fetching advances:", err);
    }
    setLoading(false);
  };

  const handleAction = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:4000/api/advance/hr/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          modifiedAmount: modifiedAmount ? parseFloat(modifiedAmount) : undefined,
          comments,
          approverName: localStorage.getItem("name") || "HR",
        }),
      });
      const data = await res.json();
      alert(data.message);
      setSelectedAdvance(null);
      setComments("");
      setModifiedAmount("");
      fetchAdvances();
    } catch (err) {
      console.error("Error updating advance:", err);
      alert("Failed to update");
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

  return (
    <div style={{ maxWidth: "1000px", margin: "20px auto", padding: "20px" }}>
      <h2 style={{ color: "#1e3a8a", textAlign: "center" }}>
        HR Advance Management
      </h2>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr style={{ background: "#e0e7ff" }}>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Employee</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Amount</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Reason</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Status</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {advances.length > 0 ? (
            advances.map((a) => (
              <tr key={a._id}>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{a.employeeName}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>₹{a.amount}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{a.reason}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{a.status}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  <button
                    onClick={() => setSelectedAdvance(a)}
                    style={{ padding: "4px 8px", background: "#007bff", color: "white", border: "none", borderRadius: 4 }}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                No advances pending HR approval
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedAdvance && (
        <div style={{ marginTop: 20, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
          <h3>Review Advance Request</h3>
          <p><strong>Employee:</strong> {selectedAdvance.employeeName}</p>
          <p><strong>Amount:</strong> ₹{selectedAdvance.amount}</p>
          <p><strong>Reason:</strong> {selectedAdvance.reason}</p>
          <div style={{ marginTop: 10 }}>
            <label>Modified Amount (optional): </label>
            <input
              type="number"
              value={modifiedAmount}
              onChange={(e) => setModifiedAmount(e.target.value)}
              placeholder="Leave empty to keep original"
              style={{ width: "200px", marginLeft: 10 }}
            />
          </div>
          <textarea
            placeholder="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            style={{ width: "100%", height: 60, marginTop: 10 }}
          />
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => handleAction(selectedAdvance._id, "Approved")}
              style={{ padding: "8px 16px", background: "green", color: "white", border: "none", borderRadius: 4, marginRight: 10 }}
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(selectedAdvance._id, "Rejected")}
              style={{ padding: "8px 16px", background: "red", color: "white", border: "none", borderRadius: 4, marginRight: 10 }}
            >
              Reject
            </button>
            <button
              onClick={() => setSelectedAdvance(null)}
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
