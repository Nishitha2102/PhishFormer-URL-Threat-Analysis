const express = require('express');
const router = express.Router();
const { getSummary, getTrend } = require('../controllers/analyticsController');

// Public access for dashboard aggregate stats
router.get('/summary', getSummary);
router.get('/trend', getTrend);

module.exports = router;
