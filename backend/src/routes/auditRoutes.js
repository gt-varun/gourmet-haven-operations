const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN')); // Only SUPER_ADMIN can view system audit logs

router.get('/', getAuditLogs);

module.exports = router;
