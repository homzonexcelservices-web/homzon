// ✅ src/pages/HRRevenueStatus.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HRRevenueStatus() {
  const [data, setData] = useState([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const hrName = localStorage.getItem("name") || "HR User";

  // 🔹 Redirect to login only if no token
  useEffect(() => {
    if (!token) {
      navigate("/hr/login");
    }
  }, [token, navigate]);

  // 🔹 Fetch Revenue Data
  useEffect(() => {
    fetch("http://localhost:4000/api/revenue/list", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setData(d);
          const total = d.reduce(
            (sum, item) => sum + (parseFloat(item.amountReceived) || 0),
            0
          );
          setTotalReceived(total.toFixed(2));
        } else {
          alert(d.error || "Failed to load revenue data");
        }
      })
      .catch((err) => alert("Error: " + err.message));
  }, [token]);

  // 🔹 Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB");
  };

  // 🔹 Export to PDF (replaces CSV)
  const exportToPDF = () => {
    const printContent = document.getElementById("revenueTable").outerHTML;
    const newWin = window.open("", "_blank");
    newWin.document.write(`
      <html><head><title>Revenue Report</title></head>
      <body>
        <h2 style="text-align:center;">Revenue Report - ${hrName}</h2>
        ${printContent}
        <script>window.print();</script>
      </body></html>
    `);
    newWin.document.close();
  };

  // 🔹 Back and Logout
  const handleBack = () => navigate("/hr/dashboard", { replace: true });
  const handleLogout = () => {
    localStorage.clear();
    navigate("/hr/login");
  };

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        padding: 25,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#4A148C" }}>
        Revenue Status - {hrName}
      </h2>

      <div
        style={{
          marginTop: 15,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4>Total Amount Received: ₹{totalReceived}</h4>
        <button onClick={exportToPDF} style={btn("#00796b")}>
          Export PDF
        </button>
      </div>

      <table
        id="revenueTable"
        border="1"
        cellPadding="8"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20,
          textAlign: "center",
          fontSize: 14,
        }}
      >
        <thead style={{ background: "#e1bee7" }}>
          <tr>
            <th>Site Name</th>
            <th>Contract</th>
            <th>GST</th>
            <th>SGST</th>
            <th>Total</th>
            <th>Received</th>
            <th>Received Date</th>
            <th>Mode</th>
            <th>Cheque Deposit</th>
            <th>Cheque Cash</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((r) => (
              <tr key={r._id}>
                <td>{r.siteName}</td>
                <td>{r.contractAmount}</td>
                <td>{r.gst9}</td>
                <td>{r.sgst9}</td>
                <td>{r.totalAmount}</td>
                <td>{r.amountReceived || "-"}</td>
                <td>{formatDate(r.amountReceivedDate)}</td>
                <td>{r.amountReceivedMode}</td>
                <td>{formatDate(r.chequeDepositDate)}</td>
                <td>{formatDate(r.chequeCashDate)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" style={{ padding: 20 }}>
                No revenue records found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div
        style={{
          textAlign: "center",
          marginTop: 25,
          display: "flex",
          justifyContent: "center",
          gap: 15,
        }}
      >
        <button onClick={handleBack} style={btn("#6a1b9a")}>
          Back
        </button>
        <button onClick={handleLogout} style={btn("#d32f2f")}>
          Logout
        </button>
      </div>
    </div>
  );
}

// 🔹 Button Style
const btn = (bg) => ({
  padding: "10px 20px",
  backgroundColor: bg,
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
});
