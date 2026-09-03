const express = require('express');
const router = express.Router();
const {
  createHealthRecord,
  getHealthRecords,
  getHealthRecordById,
  updateHealthRecord,
  deleteHealthRecord,
} = require('../controllers/health.controller');
const { protect } = require('../middleware/authMiddleware');

// All health record routes require valid JWT authentication
router.use(protect);

router.route('/')
  .post(createHealthRecord)
  .get(getHealthRecords);

router.route('/:id')
  .get(getHealthRecordById)
  .put(updateHealthRecord)
  .delete(deleteHealthRecord);

module.exports = router;
