import React, { useState } from "react";

export default function HRJoiningForm() {
  const [formData, setFormData] = useState({
    employeeName: "",
    dob: "",
    contact: "",
    companyName: "",
    designation: "",
    fatherName: "",
    fatherOccupation: "",
    motherName: "",
    motherOccupation: "",
    currentAddress1: "",
    currentAddress2: "",
    currentThana: "",
    currentDistrict: "",
    currentState: "",
    permanentAddress1: "",
    permanentAddress2: "",
    permanentThana: "",
    permanentDistrict: "",
    permanentState: "",
    altContact: "",
    relation: "",
    basicSalary: "",
    specialAllowance: "",
    conveyance: "",
    shift: "",
    epf: "",
    esic: "",
    accountNo: "",
    ifsc: "",
    photo: null,
    documents: null,
  });

  const states = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
    "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
    "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
    "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
    "Uttar Pradesh","Uttarakhand","West Bengal"
  ];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // ✅ Validation before printing
  const validateForm = () => {
    const required = ["employeeName", "dob", "contact", "companyName", "designation"];
    for (let field of required) {
      if (!formData[field]) {
        alert("⚠️ Please fill all required fields before printing!");
        return false;
      }
    }
    if (!formData.photo) {
      alert("⚠️ Please upload a passport photo before printing!");
      return false;
    }
    return true;
  };

  const handlePrint = () => {
    if (!validateForm()) return;
    window.print();
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "30px",
        maxWidth: "900px",
        margin: "0 auto",
        fontSize: "13px",
        position: "relative",
        lineHeight: "1.3",
      }}
    >
      {/* 🔹 Passport Photo - top right corner */}
      {formData.photo && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "40px",
            width: "120px",
            height: "150px",
            border: "1px solid #ccc",
            overflow: "hidden",
          }}
        >
          <img
            src={URL.createObjectURL(formData.photo)}
            alt="Passport"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* 🔹 Header */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h1 style={{ fontSize: "34px", margin: "0", color: "#0d6efd" }}>
          {formData.companyName || "Select Company Name"}
        </h1>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          640, Narsingh Ward, Above Bandhan Bank, Madan Mahal, Jabalpur (M.P.) - 482001
        </p>
        <h2 style={{ textDecoration: "underline", marginTop: "15px", fontSize: "18px" }}>
          Joining Form
        </h2>
      </div>

      <form>
        {/* 🔹 Basic Info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          <input type="text" name="employeeName" placeholder="Employee Name *" value={formData.employeeName} onChange={handleChange} />
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
          <input type="text" name="contact" placeholder="Contact No. *" value={formData.contact} onChange={handleChange} />
          <select name="companyName" value={formData.companyName} onChange={handleChange}>
            <option value="">Select Company *</option>
            <option>Homzon Excel Services</option>
            <option>Candid Jobs & Placement</option>
            <option>Aakaar Construction</option>
            <option>Home Care</option>
          </select>
          <input type="text" name="designation" placeholder="Designation *" value={formData.designation} onChange={handleChange} />
          <input type="text" name="fatherName" placeholder="Father's Name" onChange={handleChange} />
          <input type="text" name="fatherOccupation" placeholder="Father's Occupation" onChange={handleChange} />
          <input type="text" name="motherName" placeholder="Mother's Name" onChange={handleChange} />
          <input type="text" name="motherOccupation" placeholder="Mother's Occupation" onChange={handleChange} />
        </div>

        {/* 🔹 Current Address */}
        <h4 style={{ marginTop: "15px" }}>Current Address</h4>
        <input type="text" name="currentAddress1" placeholder="Address Line 1" onChange={handleChange} />
        <input type="text" name="currentAddress2" placeholder="Address Line 2" onChange={handleChange} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <input type="text" name="currentThana" placeholder="Thana" onChange={handleChange} />
          <input type="text" name="currentDistrict" placeholder="District" onChange={handleChange} />
          <select name="currentState" onChange={handleChange}>
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 🔹 Permanent Address */}
        <h4 style={{ marginTop: "15px" }}>Permanent Address</h4>
        <input type="text" name="permanentAddress1" placeholder="Address Line 1" onChange={handleChange} />
        <input type="text" name="permanentAddress2" placeholder="Address Line 2" onChange={handleChange} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <input type="text" name="permanentThana" placeholder="Thana" onChange={handleChange} />
          <input type="text" name="permanentDistrict" placeholder="District" onChange={handleChange} />
          <select name="permanentState" onChange={handleChange}>
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 🔹 Bank + Salary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
          <input type="text" name="accountNo" placeholder="Bank Account No" onChange={handleChange} />
          <input type="text" name="ifsc" placeholder="IFSC Code" onChange={handleChange} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "10px" }}>
          <input type="text" name="basicSalary" placeholder="Basic Salary" onChange={handleChange} />
          <input type="text" name="specialAllowance" placeholder="Special Allowance" onChange={handleChange} />
          <input type="text" name="conveyance" placeholder="Conveyance" onChange={handleChange} />
        </div>

        {/* 🔹 Shift, EPF, ESIC */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "10px" }}>
          <select name="shift" onChange={handleChange}>
            <option value="">Select Shift</option>
            <option>Shift 1</option>
            <option>Shift 2</option>
            <option>Shift 3</option>
          </select>
          <select name="epf" onChange={handleChange}>
            <option value="">EPF</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <select name="esic" onChange={handleChange}>
            <option value="">ESIC</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>

        {/* 🔹 Upload Section */}
        <div style={{ marginTop: "15px" }}>
          <label>Upload Passport Photo: </label>
          <input type="file" name="photo" accept="image/*" onChange={handleChange} />
          <br />
          <label>Upload Documents (PDF): </label>
          <input type="file" name="documents" accept="application/pdf" onChange={handleChange} />
        </div>

        {/* 🔹 Declaration */}
        <p style={{ fontSize: "13px", marginTop: "15px" }}>
          I hereby declare that all information given above is true.  
          If any information is found false, the company may terminate my employment.  
          <br />
          मैं यह घोषणा करता/करती हूं कि मेरे द्वारा दी गई सभी जानकारी सत्य है।  
          यदि कोई गलती पाई जाती है तो कंपनी को मुझे हटाने का अधिकार होगा।
        </p>

        {/* 🔹 Signatures Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "40px",
            textAlign: "center",
          }}
        >
          <div>
            <p>_________________________</p>
            <p>HR Signature</p>
          </div>
          <div>
            <p>_________________________</p>
            <p>Employee Signature</p>
          </div>
        </div>

        {/* 🔹 Date Footer */}
        <p style={{ textAlign: "right", marginTop: "10px", fontSize: "13px" }}>
          Date: {new Date().toLocaleDateString()}
        </p>

        {/* 🔹 Buttons */}
        <div style={{ textAlign: "center", marginTop: "20px" }} className="no-print">
          <button type="button" onClick={handlePrint} style={{ marginRight: "10px" }}>
            🖨️ Print
          </button>
          <button type="button" onClick={() => window.history.back()}>
            🔙 Back
          </button>
        </div>
      </form>
    </div>
  );
}
