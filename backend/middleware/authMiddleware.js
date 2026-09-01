const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Middleware to verify JWT token and authenticate user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id from decoded token (exclude password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: User no longer exists',
        });
      }

      // Check if user account is active
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          message: 'Account is disabled. Please contact administrator.',
        });
      }

      // Attach user to request object
      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: Token has expired',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Invalid token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No token provided',
    });
  }
};

/**
 * Middleware for Role-Based Authorization
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'CLIENT')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] role(s)`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
