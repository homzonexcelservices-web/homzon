import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAccess = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      // ✅ Save route for back navigation
      localStorage.setItem("dashboardRoute", "/admin");

      // If token not yet stored (race condition), retry after short delay
      if (!token || !role) {
        setTimeout(verifyAccess, 300);
        return;
      }

      // ✅ Verify role
      if (role !== "admin") {
        alert("Access denied or session expired.");
        localStorage.clear();
        navigate("/");
      } else {
        setIsLoading(false);
      }
    };

    verifyAccess();
  }, [navigate]);

  // ✅ Prevent navigating back to login
  useEffect(() => {
    const preventBack = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", preventBack);
    return () => window.removeEventListener("popstate", preventBack);
  }, []);

  // Navigation functions
  const goToRegisterHR = () => navigate("/admin/register-hr");
  const goToHRReport = () => navigate("/admin/hr-report");
  const goToRevenue = () => navigate("/admin/revenue");
  const goToLiabilities = () => alert("Liabilities module coming soon...");
  const goToAdvance = () => alert("Advance Management module coming soon...");
  const goToEmployees = () => alert("Employees Profile module coming soon...");

  const handleLogout = () => {
    localStorage.clear();
    alert("You have been logged out successfully.");
    navigate("/");
  };

  const buttonStyle = {
    color: "white",
    border: "none",
    padding: "14px 28px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    transition: "0.3s",
    flex: "1 1 180px",
    minWidth: "180px",
    maxWidth: "200px",
  };

  if (isLoading) return <p style={{ textAlign: "center" }}>Checking session...</p>;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f0f7ff, #ffffff)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
          <img src="/Homzon.PNG?v=3" alt="Homzon Logo" style={{ width: "288px", height: "192px", marginBottom: "10px" }} />
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "900",
              color: "#1e3a8a",
              margin: 0,
            }}
          >
            HOMZON EXCEL SERVICES PVT. LTD.
          </h1>
        </div>
        <p
          style={{
            fontSize: "18px",
            color: "#475569",
          }}
        >
          640, Narsingh Ward, Above Bandhan Bank, Madan Mahal, Jabalpur (M.P.) – 482001
        </p>
      </div>

      {/* Buttons Section */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "20px",
          maxWidth: "900px",
        }}
      >
        <button
          onClick={goToRegisterHR}
          style={{ ...buttonStyle, background: "#2563eb" }}
          onMouseOver={(e) => (e.target.style.background = "#1d4ed8")}
          onMouseOut={(e) => (e.target.style.background = "#2563eb")}
        >
          Register / Disable HR
        </button>

        <button
          onClick={goToHRReport}
          style={{ ...buttonStyle, background: "#0ea5e9" }}
          onMouseOver={(e) => (e.target.style.background = "#0284c7")}
          onMouseOut={(e) => (e.target.style.background = "#0ea5e9")}
        >
          HR Report
        </button>

        <button
          onClick={goToRevenue}
          style={{ ...buttonStyle, background: "#16a34a" }}
          onMouseOver={(e) => (e.target.style.background = "#15803d")}
          onMouseOut={(e) => (e.target.style.background = "#16a34a")}
        >
          Revenue
        </button>

        <button
          onClick={goToLiabilities}
          style={{ ...buttonStyle, background: "#eab308" }}
          onMouseOver={(e) => (e.target.style.background = "#ca8a04")}
          onMouseOut={(e) => (e.target.style.background = "#eab308")}
        >
          Liabilities
        </button>

        <button
          onClick={() => navigate("/admin/leave-management")}
          style={{ ...buttonStyle, background: "#ff9800" }}
          onMouseOver={(e) => (e.target.style.background = "#f57c00")}
          onMouseOut={(e) => (e.target.style.background = "#ff9800")}
        >
          Leave Management
        </button>

        <button
          onClick={() => navigate("/admin/advance-management")}
          style={{ ...buttonStyle, background: "#9333ea" }}
          onMouseOver={(e) => (e.target.style.background = "#7e22ce")}
          onMouseOut={(e) => (e.target.style.background = "#9333ea")}
        >
          Advance Management
        </button>

        <button
          onClick={goToEmployees}
          style={{ ...buttonStyle, background: "#db2777" }}
          onMouseOver={(e) => (e.target.style.background = "#be185d")}
          onMouseOut={(e) => (e.target.style.background = "#db2777")}
        >
          Employees Profile
        </button>
      </div>

      {/* Back & Logout */}
      <div style={{ marginTop: "50px", display: "flex", gap: "20px" }}>
        <button
          onClick={() => {
            const route = localStorage.getItem("dashboardRoute") || "/";
            navigate(route);
          }}
          style={{
            background: "#6b7280",
            color: "white",
            border: "none",
            padding: "14px 30px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
            transition: "0.3s",
            width: "200px",
          }}
          onMouseOver={(e) => (e.target.style.background = "#4b5563")}
          onMouseOut={(e) => (e.target.style.background = "#6b7280")}
        >
          Back
        </button>

        <button
          onClick={handleLogout}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "14px 30px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
            transition: "0.3s",
            width: "200px",
          }}
          onMouseOver={(e) => (e.target.style.background = "#dc2626")}
          onMouseOut={(e) => (e.target.style.background = "#ef4444")}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
