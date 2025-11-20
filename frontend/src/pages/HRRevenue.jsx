// ✅ src/pages/HRRevenue.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HRRevenue() {
  const navigate = useNavigate();
  const hrName = localStorage.getItem("name") || "HR User";
  const token = localStorage.getItem("token");

  // 🔹 Redirect to login only if NO token at all
  useEffect(() => {
    if (!token) {
      navigate("/hr/login");
    }
  }, [token, navigate]);

  const [form, setForm] = useState({
    siteName: "",
    contractAmount: "",
    gst9: "No",
    sgst9: "No",
    totalAmount: "",
    invoiceDate: "",
    amountReceived: "",
    amountReceivedDate: "",
    amountReceivedMode: "Not Received Yet",
    chequeDepositDate: "",
    chequeCashDate: "",
  });

  // 🔹 Auto Calculate Total Amount
  useEffect(() => {
    const contract = parseFloat(form.contractAmount) || 0;
    let total = contract;
    if (form.gst9 === "Yes") total += contract * 0.09;
    if (form.sgst9 === "Yes") total += contract * 0.09;
    setForm((prev) => ({ ...prev, totalAmount: total.toFixed(2) }));
  }, [form.contractAmount, form.gst9, form.sgst9]);

  // 🔹 Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 🔹 Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4000/api/revenue/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Revenue Added Successfully!");
        navigate("/hr/revenue-status");
      } else {
        alert(data.error || "❌ Failed to add revenue");
      }
    } catch (err) {
      alert("⚠️ Server error: " + err.message);
    }
  };

  // 🔹 Logout Function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    navigate("/hr/login");
  };

  // 🔹 Back Function (Dashboard par hi wapas jaaye)
  const handleBack = () => {
    // Normal navigate, replace: false (so token check re-runs properly)
    navigate("/HRDashboard");
  };

  // 🔹 Disable fields if "Not Received Yet"
  const disabledFields = form.amountReceivedMode === "Not Received Yet";

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        padding: 35,
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <h2 style={{ color: "#4A148C", textAlign: "center", marginBottom: 5 }}>
        Welcome, {hrName}
      </h2>
      <h3 style={{ textAlign: "center", color: "#333", marginBottom: 25 }}>
        🧾 Company Revenue Form
      </h3>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
        <label>
          Site Name:
          <input
            type="text"
            name="siteName"
            value={form.siteName}
            onChange={handleChange}
            placeholder="Enter Site Name"
            required
          />
        </label>

        <label>
          Contract Amount:
          <input
            type="number"
            name="contractAmount"
            value={form.contractAmount}
            onChange={handleChange}
            placeholder="Enter Contract Amount"
            required
          />
        </label>

        <label>
          GST 9%:
          <select name="gst9" value={form.gst9} onChange={handleChange}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </label>

        <label>
          SGST 9%:
          <select name="sgst9" value={form.sgst9} onChange={handleChange}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </label>

        <label>
          Total Amount (Auto Calculated):
          <input
            type="number"
            name="totalAmount"
            value={form.totalAmount}
            readOnly
          />
        </label>

        <label>
          Invoice Date:
          <input
            type="date"
            name="invoiceDate"
            value={form.invoiceDate}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Amount Received:
          <input
            type="number"
            name="amountReceived"
            value={form.amountReceived}
            onChange={handleChange}
            placeholder="Enter Received Amount"
            disabled={disabledFields}
          />
        </label>

        <label>
          Amount Received Date:
          <input
            type="date"
            name="amountReceivedDate"
            value={form.amountReceivedDate}
            onChange={handleChange}
            disabled={disabledFields}
          />
        </label>

        <label>
          Amount Received Mode:
          <select
            name="amountReceivedMode"
            value={form.amountReceivedMode}
            onChange={handleChange}
          >
            <option>Not Received Yet</option>
            <option>Cash</option>
            <option>Cheque</option>
            <option>Online</option>
          </select>
        </label>

        {form.amountReceivedMode === "Cheque" && !disabledFields && (
          <>
            <label>
              Cheque Deposit Date:
              <input
                type="date"
                name="chequeDepositDate"
                value={form.chequeDepositDate}
                onChange={handleChange}
              />
            </label>

            <label>
              Cheque Cash Date:
              <input
                type="date"
                name="chequeCashDate"
                value={form.chequeCashDate}
                onChange={handleChange}
              />
            </label>
          </>
        )}

        {/* 🔹 Buttons */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 15,
          }}
        >
          <button type="submit" style={btn("#2e7d32")}>
            ✅ Submit
          </button>

          <button type="button" onClick={handleBack} style={btn("#6a1b9a")}>
            ⬅️ Back
          </button>

          <button type="button" onClick={handleLogout} style={btn("#d32f2f")}>
            🚪 Logout
          </button>
        </div>
      </form>
    </div>
  );
}

// 🔹 Common Button Style
const btn = (bg) => ({
  padding: "10px 22px",
  backgroundColor: bg,
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 15,
  transition: "opacity 0.2s, transform 0.2s",
  opacity: 0.95,
});
