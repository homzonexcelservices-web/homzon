import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ✅ LIVE API URL को Environment Variable से प्राप्त करें
const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:4000"; 
// Note: VITE_API_BASE should be set to https://homzon-live-api.onrender.com in your .env file

export default function Login() {
  const [role, setRole] = useState("admin");
  const [mobileOrId, setMobileOrId] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const navigate = useNavigate();

  // ✅ Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const dashboardRoute = localStorage.getItem("dashboardRoute");
    if (token && dashboardRoute) {
      navigate(dashboardRoute);
    }
  }, [navigate]);

  // ✅ Disable "Back" navigation once logged in
  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, null, window.location.href);
    };
    window.addEventListener("popstate", preventBack);
    return () => {
      window.removeEventListener("popstate", preventBack);
    };
  }, []);

  // ✅ Send OTP (Admin only)
  async function sendOtp() {
    if (!mobileOrId) {
      alert("⚠️ Enter admin mobile number to send OTP");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobileOrId }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        alert("✅ OTP sent successfully! (Check console for demo OTP)");
        console.log("Demo OTP:", data.otp);
      } else {
        alert(data.error || "❌ Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      // alert("🚫 Error connecting to backend"); // Keeping this alert logic as you designed
      alert("🚫 Error connecting to backend");
    }
  }

  // ✅ Handle Login
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      let payload = {};

      if (role === "admin") {
        if (!mobileOrId || !otpValue) {
          alert("⚠️ Enter both mobile number and OTP");
          return;
        }
        payload = { role, mobileOrId, otp: otpValue };
      } else {
        if (!mobileOrId || !password) {
          alert("⚠️ Enter ID and Password");
          return;
        }
        payload = { role, mobileOrId, password };
      }

      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "❌ Login failed");
        return;
      }

      alert(`✅ Login successful as ${data.role}`);

      // ✅ Store login info
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);
      localStorage.setItem("empId", data.empId);

      let dashboardRoute = "/";

      // ✅ Assign dashboard routes per role
      switch (data.role) {
        case "admin":
          dashboardRoute = "/admin";
          break;
        case "hr":
          localStorage.setItem("hrName", data.name);
          dashboardRoute = "/hr";
          break;
        case "supervisor":
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("supervisorId", data.supervisorId);

          dashboardRoute = "/supervisor";
          break;
        case "employee":
          if (data.employee) {
            localStorage.setItem("employeeId", data.employee._id);
            localStorage.setItem("employeeName", data.employee.name);
            localStorage.setItem("supervisorId", data.employee.supervisorId || "");
            localStorage.setItem("supervisorName", data.employee.supervisorName || "");
          }
          dashboardRoute = "/employee";
          break;
        default:
          dashboardRoute = "/";
      }

      // ✅ Save dashboard route for re-login
      localStorage.setItem("dashboardRoute", dashboardRoute);

      // ✅ Redirect user
      navigate(dashboardRoute);
    } catch (err) {
      console.error("Login error:", err);
      // alert("🚫 Error connecting to backend"); // Keeping this alert logic as you designed
      alert("🚫 Error connecting to backend");
    }
  }

  return (
    <div
      className="container"
      style={{
        maxWidth: 450,
        margin: "0 auto",
        marginTop: 40,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <header style={{ textAlign: "center" }}>
        <div
          style={{
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            padding: 20,
            borderRadius: 8,
            color: "white",
            boxShadow: "0 8px 30px rgba(100,80,160,0.2)",
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
          >
            <rect
              x="2"
              y="3"
              width="20"
              height="18"
              rx="2"
              ry="2"
              strokeWidth="1.2"
            />
            <path d="M16 3v18" strokeWidth="1.2" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "6px 0 0" }}>
            <img src="/Homzon.PNG?v=2" alt="Homzon Logo" style={{ width: "200px", height: "auto", marginBottom: "10px" }} />
            <h1
              style={{
                fontSize: 24,
                margin: 0,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              HOMZON EXCEL SERVICES PVT. LTD.
            </h1>
          </div>
          <p style={{ margin: "6px 0 0", opacity: 0.9, fontSize: 14 }}>
            Address-640, Narsingh Ward, Above Bandhan Bank, Madan Mahal,
            Jabalpur (M.P.)-482001
          </p>
        </div>
      </header>

      {/* Login Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <div className="form-row" style={{ marginBottom: 10 }}>
          <label>Login as</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setOtpSent(false);
              setOtpValue("");
              setPassword("");
              setMobileOrId("");
            }}
          >
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="supervisor">Supervisor</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {/* Conditional Inputs */}
        {role === "admin" ? (
          <>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <label>Mobile</label>
              <input
                value={mobileOrId}
                onChange={(e) => setMobileOrId(e.target.value)}
                placeholder="Enter admin mobile"
              />
            </div>

            {!otpSent && (
              <div className="form-row" style={{ marginBottom: 10 }}>
                <button type="button" onClick={sendOtp}>
                  Send OTP
                </button>
              </div>
            )}

            {otpSent && (
              <div className="form-row" style={{ marginBottom: 10 }}>
                <label>Enter OTP</label>
                <input
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="6-digit OTP"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <label>ID</label>
              <input
                value={mobileOrId}
                onChange={(e) => setMobileOrId(e.target.value)}
                placeholder={`Enter ${role.toUpperCase()} ID`}
              />
            </div>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            marginTop: 10,
            padding: "10px",
            backgroundColor: "#0d6efd",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}