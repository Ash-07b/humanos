const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
} = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (Requires valid JWT token)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.patch('/profile', protect, updateProfile);

// Role-restricted route for testing admin-only access
router.get('/admin-dashboard', protect, authorizeRoles('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Admin Dashboard. Authorized as ADMIN.',
    admin: req.user,
  });
});

module.exports = router;
