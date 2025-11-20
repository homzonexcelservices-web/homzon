// checkEmployee.js
const mongoose = require("mongoose");

const mongoURI = "mongodb+srv://homzon_dev:Password@cluster0.0obe5eg.mongodb.net/homzon_db?retryWrites=true&w=majority&appName=Cluster0";

// 👇 yahan apne employee model ka naam dalna ho sakta hai "Employee", "User" ya "Staff"
const employeeSchema = new mongoose.Schema({
  empId: String,
  name: String,
  password: String,
  role: String
});

const Employee = mongoose.model("employees", employeeSchema);

(async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ Database connected");

    // yahan kisi ek known employee ID se check karo (jaise EMP001)
    const emp = await Employee.findOne({ empId: "EMP001" });

    if (emp) {
      console.log("✅ Employee found:", emp.name, "| Role:", emp.role);
    } else {
      console.log("❌ Employee not found");
    }

    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
