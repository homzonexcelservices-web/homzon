// backend/controllers/attendanceController.js

const mongoose = require('mongoose');

// **FIX:** Models को Mongoose Registry से प्राप्त करें क्योंकि वे server.js में define किए गए हैं।
const Attendance = mongoose.model('Attendance');
const User = mongoose.model('User');
const AttendanceModificationRequest = mongoose.model('AttendanceModificationRequest');


// 🎯 FIX: Implement Role-based Filtering Logic
// GET /api/attendance?date=yyyy-mm-dd or ?startDate=yyyy-mm-dd&endDate=yyyy-mm-dd
exports.getAttendanceByDate = async (req, res) => {
    try {
        const { date: dateString, startDate, endDate } = req.query;

        // 1. JWT Middleware से प्राप्त User Details
        const user = req.user; // Assuming auth middleware attaches { id, role, name }
        const userId = new mongoose.Types.ObjectId(user.id); // Convert from string ID in token to ObjectId

        // 2. Date Handling for Single Date or Range
        let query = {};
        if (startDate && endDate) {
            // Date range query - handle both string and Date formats
            const start = new Date(startDate);
            const end = new Date(endDate);
            query.date = { $gte: start, $lte: end };
        } else if (dateString) {
            // Single date query
            const date = new Date(dateString);
            query.date = date;
        } else {
            // Default to today's date (YYYY-MM-DD at midnight UTC)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const date = new Date(`${year}-${month}-${day}`);
            query.date = date;
        }

        // 3. Role-Based Filtering
        if (user.role === 'supervisor') {
            // 4a. Find employees assigned to this supervisor
            const assignedEmployees = await User.find({ supervisor: userId }).select('_id').lean();
            const employeeIds = assignedEmployees.map(emp => emp._id);

            // If supervisor has no assigned employees, return empty array
            if (employeeIds.length === 0) {
                return res.json([]);
            }

            // Filter attendance records for these specific employees
            query.employee = { $in: employeeIds };

        } else if (user.role === 'employee') {
            // 4b. Employee can only see their own attendance
            query.employee = userId;
        }
        // 4c. HR/Admin role is allowed to view ALL (no additional filtering needed)

        // 5. Execute Query
        // Populate 'employee' and 'recordedBy' fields for frontend display
        const records = await Attendance.find(query)
            .populate({ path: "employee", select: "name empId role timeIn designation" })
            .populate({ path: "recordedBy", select: "name role" })
            .sort({ date: 1, employee: 1 }) // Sort by date then employee
            .lean();

        res.status(200).json(records);

    } catch (err) {
        console.error("Error fetching attendance:", err);
        res.status(500).json({ message: "Failed to fetch attendance data.", error: err.message });
    }
};

// POST /api/attendance
// body: { employeeId, date (yyyy-mm-dd), timeIn (HH:mm), status, isLate }
exports.createOrUpdateAttendance = async (req, res) => {
    
    try {
        const hrUserId = req.user?.id || null; // assuming auth middleware sets req.user
        const { employeeId, date, timeIn, timeOut, status, isLate } = req.body;
        
        if (!employeeId || !date) return res.status(400).json({ message: "employeeId and date required" });

        // Ensure date is a Date object for consistent storage and querying
        const dateObject = new Date(date);

        // Check if attendance already exists for this date and employee (using unique index is better)
        const existingAttendance = await Attendance.findOne({ 
            employee: employeeId, 
            date: dateObject 
        });

        // ⭐ Prevent marking if it already exists (This is a simple POST, not PUT)
        // If the frontend logic ensures this is only called once per day, this check is crucial.
        if (existingAttendance && req.method === 'POST') {
             return res.status(400).json({ message: "Attendance already marked for this date. Cannot re-mark." });
        }

        // Define update fields
        const updateFields = { recordedBy: hrUserId };
        
        // ⭐ Logic for setting timeIn/status based on Frontend needs:
        if (status === 'Absent' || status === 'Halfday') {
            updateFields.timeIn = null; // Do not save timeIn for Absent/Halfday
            updateFields.status = status;
        } else if (status === 'Present' && timeIn) {
            updateFields.timeIn = timeIn;
            updateFields.status = 'Present';
        } else if (status) {
             updateFields.status = status;
        }


        if (timeOut) updateFields.timeOut = timeOut; // Allow updating timeOut
        if (typeof isLate === 'boolean') updateFields.isLate = isLate;

        // upsert: create or update existing (Though logic above prevents re-creation in POST)
        const saved = await Attendance.findOneAndUpdate(
            { employee: employeeId, date: dateObject }, // Use dateObject for matching
            { $set: updateFields },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).populate({ path: "employee", select: "name empId role timeIn designation" });

        return res.json(saved);
    } catch (err) {
        console.error("Error in createOrUpdateAttendance:", err);
        // handle duplicate key (if index exists)
        if (err.code === 11000) {
            return res.status(409).json({ message: "Attendance already exists" });
        }
        return res.status(500).json({ message: "Server error" });
    }
};


// PUT /api/attendance/:id - Update attendance status (HR only)
exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, timeIn, timeOut, isLate } = req.body;

        // Only HR can modify attendance
        if (req.user.role !== 'hr' && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only HR can modify attendance records" });
        }

        // Validate status
        const validStatuses = ['Present', 'Absent', 'Halfday'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be Present, Absent, or Halfday" });
        }

        // Find and update the attendance record
        const updateFields = {};
        if (status) updateFields.status = status;
        if (timeIn !== undefined) updateFields.timeIn = timeIn;
        if (timeOut !== undefined) updateFields.timeOut = timeOut;
        if (typeof isLate === 'boolean') updateFields.isLate = isLate;

        const updatedAttendance = await Attendance.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true }
        ).populate({ path: "employee", select: "name empId role timeIn designation" });

        if (!updatedAttendance) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        res.status(200).json(updatedAttendance);

    } catch (err) {
        console.error("Error updating attendance:", err);
        res.status(500).json({ message: "Failed to update attendance record", error: err.message });
    }
};

// -----------------------------------------------------------------
// 📊 Attendance Summary Report Logic (Updated for date range)
// -----------------------------------------------------------------
exports.getAttendanceSummaryReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Expects startDate and endDate (yyyy-mm-dd)

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate query parameters are required.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // 1. Fetch all ACTIVE Employees (Filtered by isActive: true)
        const activeEmployees = await User.find(
            { isActive: true, role: { $in: ['employee', 'supervisor'] } },
            '_id name empId designation department company'
        ).lean();

        const employeeIds = activeEmployees.map(emp => emp._id);

        // 2. Aggregate Attendance records for the selected date range
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
                    date: { $gte: start, $lte: end }
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

        // 3. Combine Employee details with Attendance Summary
        const reportData = activeEmployees.map(employee => {
            const summary = attendanceSummary.find(s => s._id.equals(employee._id));

            return {
                employeeId: employee._id,
                name: employee.name,
                designation: employee.designation,
                department: employee.department || employee.company || "-",

                presentDays: summary ? summary.presentDays : 0,
                absentDays: summary ? summary.absentDays : 0,
                halfDays: summary ? summary.halfDays : 0,
                lateMarkings: summary ? summary.lateMarkings : 0,
            };
        });

        res.status(200).json(reportData);

    } catch (err) {
        console.error("Error fetching attendance summary report:", err);
        res.status(500).json({ error: "Server error while generating report." });
    }
};

// -----------------------------------------------------------------
// Attendance Modification Request Functions
// -----------------------------------------------------------------

// POST /api/attendance/request-modification - Supervisor creates a request
exports.createModificationRequest = async (req, res) => {
    try {
        const user = req.user; // From auth middleware

        // Only supervisors can create requests
        if (user.role !== 'supervisor') {
            return res.status(403).json({ message: "Only supervisors can request attendance modifications" });
        }

        const { employeeId, date, requestedChanges, reason } = req.body;

        if (!employeeId || !date || !reason) {
            return res.status(400).json({ message: "employeeId, date, and reason are required" });
        }

        // Check if the employee is assigned to this supervisor
        const employee = await User.findById(employeeId);
        if (!employee || employee.supervisor.toString() !== user.id) {
            return res.status(403).json({ message: "You can only request modifications for your assigned employees" });
        }

        // Check if attendance record exists
        const attendanceRecord = await Attendance.findOne({ employee: employeeId, date: new Date(date) });
        if (!attendanceRecord) {
            return res.status(404).json({ message: "Attendance record not found for the specified date" });
        }

        // Create the request
        const request = new AttendanceModificationRequest({
            requestedBy: user.id,
            employee: employeeId,
            date: new Date(date),
            requestedChanges,
            reason
        });

        await request.save();

        res.status(201).json({ message: "Modification request submitted successfully", request });

    } catch (err) {
        console.error("Error creating modification request:", err);
        res.status(500).json({ message: "Failed to create request", error: err.message });
    }
};

// GET /api/attendance/modification-requests - HR views all pending requests
exports.getModificationRequests = async (req, res) => {
    try {
        const user = req.user;

        // Only HR can view requests
        if (user.role !== 'hr' && user.role !== 'admin') {
            return res.status(403).json({ message: "Only HR can view modification requests" });
        }

        const requests = await AttendanceModificationRequest.find({ status: 'pending' })
            .populate('requestedBy', 'name empId')
            .populate('employee', 'name empId designation')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);

    } catch (err) {
        console.error("Error fetching modification requests:", err);
        res.status(500).json({ message: "Failed to fetch requests", error: err.message });
    }
};

// PUT /api/attendance/modification-requests/:id - HR approves or rejects request
exports.approveModificationRequest = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { action, approvalNote } = req.body; // action: 'approve' or 'reject'

        // Only HR can approve/reject
        if (user.role !== 'hr' && user.role !== 'admin') {
            return res.status(403).json({ message: "Only HR can approve or reject requests" });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
        }

        const request = await AttendanceModificationRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: "Request has already been processed" });
        }

        if (action === 'approve') {
            // Update the attendance record
            const updateFields = {};
            if (request.requestedChanges.status) updateFields.status = request.requestedChanges.status;
            if (request.requestedChanges.timeIn !== undefined) updateFields.timeIn = request.requestedChanges.timeIn;
            if (request.requestedChanges.timeOut !== undefined) updateFields.timeOut = request.requestedChanges.timeOut;
            if (request.requestedChanges.isLate !== undefined) updateFields.isLate = request.requestedChanges.isLate;

            await Attendance.findOneAndUpdate(
                { employee: request.employee, date: request.date },
                { $set: updateFields },
                { new: true }
            );

            request.status = 'approved';
        } else {
            request.status = 'rejected';
        }

        request.approvedBy = user.id;
        request.approvalNote = approvalNote;
        await request.save();

        res.status(200).json({ message: `Request ${action}d successfully`, request });

    } catch (err) {
        console.error("Error processing modification request:", err);
        res.status(500).json({ message: "Failed to process request", error: err.message });
    }
};
