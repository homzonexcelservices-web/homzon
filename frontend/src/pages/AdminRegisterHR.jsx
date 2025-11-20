import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminRegisterHR() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [company, setCompany] = useState("");
  const [users, setUsers] = useState([]);

  // ✅ HR Register Function
  const registerHR = async (e) => {
    e.preventDefault();

    if (!name || !mobile || !company) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token"), // ✅ Token added
        },
        body: JSON.stringify({
          name,
          mobile,
          role: "hr",
          company,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Backend se jo password mila wahi dikhayenge
        alert(
          `✅ HR Registered Successfully!\nName: ${name}\nCompany: ${company}\nID: ${data.empId}\nPassword: ${data.password}`
        );
        setName("");
        setMobile("");
        setCompany("");
        fetchUsers();
      } else {
        alert("❌ Registration failed. Check backend logs.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please check backend.");
    }
  };

  // ✅ Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/users", {
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token"), // ✅ Token added
        },
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Reset Password
  const resetPassword = async (id) => {
    if (!window.confirm("Are you sure you want to reset password?")) return;

    try {
      const res = await fetch(`http://localhost:4000/api/reset-password/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token"),
        },
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Password Reset Successfully!\nNew Password: ${data.newPassword}`);
        fetchUsers();
      } else {
        alert("❌ Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  };

  // ✅ Disable user
  const disableUser = async (id) => {
    if (!window.confirm("Disable this user?")) return;
    try {
      const res = await fetch(`http://localhost:4000/api/disable-user/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token"),
        },
      });
      const data = await res.json();
      if (data.success) {
        alert("🚫 User Disabled Successfully!");
        fetchUsers();
      } else {
        alert("❌ Failed to disable user.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div
      style={{
        padding: "30px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate("/admin")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          backgroundColor: "#0d6efd",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      {/* 🏢 Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "5px" }}>
        <img src="/Homzon.PNG" alt="Homzon Logo" style={{ width: "50px", height: "auto", marginRight: "10px" }} />
        <h1 style={{ fontSize: "26px", fontWeight: "bold", margin: 0 }}>
          HOMZON EXCEL SERVICES PVT. LTD.
        </h1>
      </div>
      <p style={{ marginTop: "0", marginBottom: "20px", fontSize: "15px" }}>
        640, Narsingh Ward, Above Bandhan Bank, Madan Mahal, Jabalpur (M.P.) - 482001
      </p>

      <h2
        style={{
          textDecoration: "underline",
          marginBottom: "30px",
          color: "#0d6efd",
        }}
      >
        Register HR
      </h2>

      {/* 🧾 Form */}
      <form
        onSubmit={registerHR}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          maxWidth: "400px",
          margin: "0 auto",
          backgroundColor: "#f8f9fa",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <input
          type="text"
          placeholder="Enter HR name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textAlign: "center",
          }}
        />
        <input
          type="number"
          placeholder="Enter Mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textAlign: "center",
          }}
        />

        {/* 🏢 Company Dropdown */}
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <option value="">Select Company</option>
          <option value="Homzon Excel Services">Homzon Excel Services</option>
          <option value="Candid Jobs & Placement">Candid Jobs & Placement</option>
          <option value="Aakaar Construction">Aakaar Construction</option>
          <option value="Home Care">Home Care</option>
        </select>

        <button
          type="submit"
          style={{
            backgroundColor: "#0d6efd",
            color: "white",
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Register HR
        </button>
      </form>

      {/* 🧑‍💼 Users Table */}
      {users.length > 0 && (
        <table
          style={{
            marginTop: "30px",
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#0d6efd", color: "white" }}>
              <th style={{ padding: "8px" }}>Name</th>
              <th>Role</th>
              <th>Company</th>
              <th>ID</th>
              <th>Password</th>
              <th>Reset Password</th>
              <th>Disable</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((u) => u.role === "hr")
              .map((u) => (
                <tr key={u._id} style={{ borderBottom: "1px solid #ccc" }}>
                  <td>{u.name}</td>
                  <td>{u.role}</td>
                  <td>{u.company}</td>
                  <td>{u.empId}</td>
                  <td>{u.passwordPlain || "******"}</td>
                  <td>
                    <button
                      onClick={() => resetPassword(u._id)}
                      style={{
                        backgroundColor: "#ffc107",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Reset
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => disableUser(u._id)}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Disable
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
