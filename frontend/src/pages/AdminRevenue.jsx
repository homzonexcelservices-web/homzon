import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminRevenue() {
  const navigate = useNavigate();
  const [revenues, setRevenues] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); // agar login nahi hai tab hi redirect
      return;
    }

    fetch("http://localhost:4000/api/revenue/list", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setRevenues)
      .catch((err) => console.error("Error fetching revenue:", err));
  }, [navigate]);

  const totalAmountReceived = revenues.reduce(
    (sum, r) => sum + (r.amountReceived || 0),
    0
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Revenue Overview - Super Admin", 14, 15);
    const tableColumn = [
      "Site Name",
      "HR Name",
      "Contract",
      "GST",
      "SGST",
      "Total",
      "Received",
      "Received Date",
      "Mode",
      "Cheque Deposit",
      "Cheque Cash",
    ];
    const tableRows = revenues.map((r) => [
      r.siteName,
      r.hrName,
      r.contractAmount,
      r.gst9,
      r.sgst9,
      r.totalAmount,
      r.amountReceived,
      r.amountReceivedDate,
      r.amountReceivedMode,
      r.chequeDepositDate,
      r.chequeCashDate,
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 25 });
    doc.save("Revenue_Report.pdf");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f8ff",
        padding: "30px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          width: "95%",
          maxWidth: "1600px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#5e2ca5",
            fontWeight: "bold",
            marginBottom: "15px",
          }}
        >
          Revenue Overview – Super Admin
        </h2>

        <h4 style={{ textAlign: "center", marginBottom: "20px" }}>
          Total Amount Received: ₹{totalAmountReceived.toFixed(2)}
        </h4>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={exportPDF}
            style={{
              backgroundColor: "#00796b",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            📄 Export PDF
          </button>
        </div>

        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "center",
              minWidth: "1200px",
            }}
          >
            <thead>
              <tr style={{ background: "#e3baf6" }}>
                <th>Site Name</th>
                <th>HR Name</th>
                <th>Contract</th>
                <th>GST</th>
                <th>SGST</th>
                <th>Total</th>
                <th>Received</th>
                <th>Received Date</th>
                <th>Mode</th>
                <th>Cheque Deposit</th>
                <th>Cheque Cash</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {revenues.map((r, i) => (
                <tr key={i}>
                  <td>{r.siteName}</td>
                  <td>{r.hrName}</td>
                  <td>{r.contractAmount}</td>
                  <td>{r.gst9}</td>
                  <td>{r.sgst9}</td>
                  <td>{r.totalAmount}</td>
                  <td>{r.amountReceived}</td>
                  <td>{r.amountReceivedDate}</td>
                  <td>{r.amountReceivedMode}</td>
                  <td>{r.chequeDepositDate}</td>
                  <td>{r.chequeCashDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "25px",
          }}
        >
          {/* ✅ FIXED BACK BUTTON */}
          <button
            onClick={() => navigate("/AdminDashboard")}
            style={{
              backgroundColor: "#6a1b9a",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔙 Back
          </button>

          {/* ✅ LOGOUT BUTTON (clears token) */}
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            style={{
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
