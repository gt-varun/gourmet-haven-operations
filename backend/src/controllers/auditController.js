const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs (SUPER_ADMIN only)
// @route   GET /api/audit-logs
// @access  Private (SUPER_ADMIN only)
const getAuditLogs = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only SUPER_ADMIN can view audit logs',
      });
    }

    // Populate branch details
    const logs = await AuditLog.find({})
      .populate('branchId', 'name')
      .populate('actorId', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAuditLogs,
};
