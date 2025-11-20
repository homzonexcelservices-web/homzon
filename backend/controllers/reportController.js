const mongoose = require('mongoose');

// **FIX:** Models को Mongoose Registry से प्राप्त करें क्योंकि वे server.js में define किए गए हैं।
const Attendance = mongoose.model('Attendance');
const User = mongoose.model('User');

// 💰 Monthly Salary Attendance Report Controller
// GET /api/reports/attendance-monthly?year=YYYY&month=MM
const getMonthlyAttendanceReport = async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ error: 'year and month query parameters are required.' });
        }

        // Convert to numbers and validate
        const selectedYear = parseInt(year);
        const selectedMonth = parseInt(month);

        if (isNaN(selectedYear) || isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
            return res.status(400).json({ error: 'Invalid year or month parameters.' });
        }

        // Calculate date range for the selected month as Date objects
        const startDate = new Date(selectedYear, selectedMonth - 1, 1); // First day of month
        const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999); // Last day of month

        // 1. Fetch all ACTIVE Employees (Filtered by isActive: true)
        const activeEmployees = await User.find(
            { isActive: true, role: { $in: ['employee', 'supervisor'] } },
            '_id name empId designation department company basicSalary specialAllowance conveyance epf esic paidLeaves'
        ).lean();

        const employeeIds = activeEmployees.map(emp => emp._id);

        // 2. Aggregate Attendance records for the selected month
        const attendanceSummary = await Attendance.aggregate([
            {
                $addFields: {
                    date: {
                        $cond: {
                            if: { $eq: [{ $type: "$date" }, "string"] },
                            then: { $dateFromString: { dateString: "$date" } },
                            else: "$date"
                        }
                    }
                }
            },
            {
                $match: {
                    employee: { $in: employeeIds },
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$employee',
                    presentDays: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'Present'] }, { $ne: ['$isLate', true] }] }, 1, 0] } },
                    absentDays: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                    halfDays: { $sum: { $cond: [{ $eq: ['$status', 'Halfday'] }, 1, 0] } },
                    lateMarkings: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'Present'] }, { $eq: ['$isLate', true] }] }, 1, 0] } },
                }
            }
        ]);

        // 3. Combine Employee details with Attendance Summary and Salary Calculations
        const reportData = activeEmployees.map(employee => {
            const summary = attendanceSummary.find(s => s._id.equals(employee._id));

            const presentDays = summary ? summary.presentDays : 0;
            const absentDays = summary ? summary.absentDays : 0;
            const halfDays = summary ? summary.halfDays : 0;
            const lateMarkings = summary ? summary.lateMarkings : 0;

            // Calculate payable days = present + 0.5 * halfdays
            const payableDays = presentDays + (halfDays * 0.5);

            // Salary Calculations (Prorated based on payable days, assuming 30 days/month)
            const proratedBasic = ((employee.basicSalary || 0) / 30) * payableDays;
            const proratedSpecialAllowance = ((employee.specialAllowance || 0) / 30) * payableDays;
            const proratedConveyance = ((employee.conveyance || 0) / 30) * payableDays;
            const remainingPaidLeaves = Math.max(0, (employee.paidLeaves || 0) - (absentDays + halfDays));

            // Overtime placeholder (assume 0 hours, can be added later)
            const overtimeHours = 0;
            const hourlyRate = (employee.basicSalary || 0) / 30 / 8; // Assuming 8 hours/day
            const overtimePay = overtimeHours * hourlyRate;

            const grossSalary = proratedBasic + proratedSpecialAllowance + proratedConveyance + overtimePay;

            // Deductions
            const epfDeduction = (employee.epf === 'Yes') ? (proratedBasic * 0.12) : 0;
            const esicDeduction = (employee.esic === 'Yes') ? (grossSalary * 0.0075) : 0;
            const totalDeductions = epfDeduction + esicDeduction;

            const netSalary = grossSalary - totalDeductions;

            return {
                employeeId: employee._id,
                name: employee.name,
                designation: employee.designation,
                department: employee.department || employee.company || "-",

                presentDays,
                absentDays,
                halfDays,
                lateMarkings,

                // New salary fields
                remainingPaidLeaves,
                proratedBasic: Math.round(proratedBasic * 100) / 100,
                proratedSpecialAllowance: Math.round(proratedSpecialAllowance * 100) / 100,
                proratedConveyance: Math.round(proratedConveyance * 100) / 100,
                grossSalary: Math.round(grossSalary * 100) / 100, // Round to 2 decimals
                deductions: Math.round(totalDeductions * 100) / 100,
                netSalary: Math.round(netSalary * 100) / 100,
                overtime: Math.round(overtimePay * 100) / 100,
            };
        });

        res.status(200).json(reportData);

    } catch (err) {
        console.error("Error fetching monthly attendance report:", err);
        res.status(500).json({ error: "Server error while generating report." });
    }
};

const updateEmployeeSalary = async (req, res) => {
    try {
        const { employeeId, year, month, basicSalary, specialAllowance, conveyance, epf, esic } = req.body;

        // Update the employee's salary fields
        await User.findByIdAndUpdate(employeeId, {
            basicSalary,
            specialAllowance,
            conveyance,
            epf,
            esic
        });

        res.status(200).json({ message: 'Salary updated successfully' });
    } catch (err) {
        console.error("Error updating salary:", err);
        res.status(500).json({ error: "Server error while updating salary." });
    }
};

module.exports = {
  getMonthlyAttendanceReport,
  updateEmployeeSalary,
  testReport(req, res) {
    res.json({ ok: true, message: "Report controller working" });
  }
};
