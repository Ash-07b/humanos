const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getReports,
  getSystemSettings,
  updateSystemSettings,
  getActivityLogs,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Enforce JWT authentication and strict ADMIN role authorization
router.use(protect);
router.use(authorizeRoles('ADMIN'));

router.get('/dashboard', getDashboardOverview);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);
router.get('/reports', getReports);
router.get('/settings', getSystemSettings);
router.patch('/settings', updateSystemSettings);
router.get('/activity', getActivityLogs);

module.exports = router;
