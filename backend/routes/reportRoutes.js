// ✅ src/routes/reportRoutes.js

const express = require('express');
const router = express.Router();
// 💡 सुनिश्चित करें कि आपने reportController फ़ाइल सही जगह पर बनाई है
const { getMonthlyAttendanceReport } = require('../controllers/reportController');
const auth = require('../middleware/auth'); // यह मानकर चल रहा हूँ कि आपके पास ये middleware हैं

// 💰 Monthly Salary Attendance Report Route
// Endpoint: /api/reports/attendance-monthly?year=YYYY&month=MM
router.route('/attendance-monthly').get(
    auth,
    getMonthlyAttendanceReport
);

module.exports = router;
