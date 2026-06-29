const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Hierarchical roles mapping
const ROLE_HIERARCHY = {
  CASHIER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

// Authenticate middleware (JWT verify)
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }
};

// Hierarchical authorize middleware
const authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRoleValue = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredRoleValue = ROLE_HIERARCHY[requiredRole] || 0;

    if (userRoleValue < requiredRoleValue) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${requiredRole}' or higher required.`,
      });
    }

    next();
  }
};

// Cache control middleware for back-button safety (FR-4)
const cacheControl = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// Check permission for ingredients access
const checkIngredientsAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { role, hasIngredientsAccess } = req.user;

  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || hasIngredientsAccess === true) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: You do not have permission to access ingredients.',
  });
};

module.exports = {
  authenticate,
  authorize,
  cacheControl,
  checkIngredientsAccess,
  ROLE_HIERARCHY,
};
