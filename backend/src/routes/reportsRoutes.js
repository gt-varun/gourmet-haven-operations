const express = require('express');
const { getDashboardMetrics } = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middleware/auth');
const branchScope = require('../middleware/branchScope');

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN')); // Only ADMIN and SUPER_ADMIN have access to reports

// Scoped dashboard metrics
router.get('/dashboard', branchScope, getDashboardMetrics);

module.exports = router;
