// Middleware to enforce branch isolation
const branchScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { role, branchId } = req.user;

  if (role === 'SUPER_ADMIN') {
    // Super admins can request details for a specific branch or see all branches
    const queryBranchId = (req.query && req.query.branchId) || (req.body && req.body.branchId);
    req.branchFilter = queryBranchId ? { branchId: queryBranchId } : {};
  } else {
    // Normal users are strictly locked to their branch
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'User does not have an assigned branch' });
    }

    req.branchFilter = { branchId };

    // Prevent privilege escalation: if client sends a different branchId, reject it
    const reqBranchId = (req.query && req.query.branchId) || (req.body && req.body.branchId);
    if (reqBranchId && reqBranchId.toString() !== branchId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you cannot access data from another branch',
      });
    }
  }

  next();
};

module.exports = branchScope;
