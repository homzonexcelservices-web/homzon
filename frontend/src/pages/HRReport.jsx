import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HRReport() {
  const navigate = useNavigate();
  const [hrList, setHrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch HR data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Only Admin allowed
    if (!token || role !== "admin") {
      alert("Access denied or session expired.");
      navigate("/");
      return;
    }

    const fetchHRReport = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/hr/list", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch HR list");
        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received");
        }

        setHrList(data);
      } catch (err) {
        console.error("Error fetching HR list:", err);
        setError(err.message || "Something went wrong while loading HR list");
      } finally {
        setLoading(false);
      }
    };

    fetchHRReport();
  }, [navigate]);

  // ✅ Back button (Admin Dashboard)
  const handleBack = () => {
    navigate("/AdminDashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f0f9ff, #ffffff)",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "38px",
          color: "#1e3a8a",
          fontWeight: "bold",
          marginBottom: "10px",
        }}
      >
        HR Report
      </h1>

      {loading ? (
        <p>Loading HR details...</p>
      ) : error ? (
        <p style={{ color: "red" }}>⚠️ {error}</p>
      ) : hrList.length === 0 ? (
        <p>No HRs registered yet.</p>
      ) : (
        <>
          <p
            style={{
              fontSize: "18px",
              color: "#475569",
              marginBottom: "40px",
            }}
          >
            Total HRs: <b>{hrList.length}</b>
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "25px",
              justifyItems: "center",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            {hrList.map((hr, index) => (
              <div
                key={index}
                style={{
                  background: "white",
                  borderRadius: "15px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: "25px",
                  width: "100%",
                  maxWidth: "340px",
                  textAlign: "left",
                  transition: "0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 6px 18px rgba(0,0,0,0.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.1)")
                }
              >
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1e3a8a",
                    marginBottom: "8px",
                  }}
                >
                  {hr.name || "N/A"}
                </h3>

                <p style={{ margin: "6px 0", color: "#374151" }}>
                  <b>Employee ID:</b> {hr.empId || "N/A"}
                </p>
                <p style={{ margin: "6px 0", color: "#374151" }}>
                  <b>Company:</b> {hr.company || "N/A"}
                </p>
                <p style={{ margin: "6px 0", color: "#374151" }}>
                  <b>Mobile:</b> {hr.mobile || "N/A"}
                </p>

                <p
                  style={{
                    marginTop: "10px",
                    fontWeight: "bold",
                    color: hr.isActive ? "#16a34a" : "#dc2626",
                  }}
                >
                  Status: {hr.isActive ? "Active 🟢" : "Disabled 🔴"}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        onClick={handleBack}
        style={{
          marginTop: "50px",
          background: "#2563eb",
          color: "white",
          border: "none",
          padding: "14px 30px",
          borderRadius: "10px",
          cursor: "pointer",
          fontSize: "16px",
          transition: "0.3s",
        }}
        onMouseOver={(e) => (e.target.style.background = "#1d4ed8")}
        onMouseOut={(e) => (e.target.style.background = "#2563eb")}
      >
        ⬅ Back to Dashboard
      </button>
    </div>
  );
}
