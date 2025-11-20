import React, { useState } from "react";

export default function MarkAttendance() {
  const [mobile, setMobile] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMarkAttendance = async () => {
    if (!mobile) {
      alert("Please enter mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(data);
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      alert("Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom right, #e3f2fd, #ffffff)",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          width: "400px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#0d6efd", marginBottom: "20px" }}>
          Mark Attendance
        </h2>

        <input
          type="text"
          placeholder="Enter Employee Mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "15px",
          }}
        />

        <button
          onClick={handleMarkAttendance}
          disabled={loading}
          style={{
            backgroundColor: "#0d6efd",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            width: "100%",
            fontWeight: "bold",
          }}
        >
          {loading ? "Marking..." : "Mark Attendance"}
        </button>

        {status && (
          <div
            style={{
              marginTop: "20px",
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              textAlign: "left",
            }}
          >
            <p>
              <strong>Name:</strong> {status.name}
            </p>
            <p>
              <strong>Shift:</strong> {status.shift}
            </p>
            <p>
              <strong>Scheduled Time:</strong> {status.scheduledTime}
            </p>
            <p>
              <strong>Current Time:</strong> {status.currentTime}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color: status.status === "Late" ? "red" : "green",
                  fontWeight: "bold",
                }}
              >
                {status.status}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
