const express = require('express');
const router = express.Router();
const {
  createMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
} = require('../controllers/medication.controller');
const { protect } = require('../middleware/authMiddleware');

// All medication routes require valid JWT authentication
router.use(protect);

router.route('/')
  .post(createMedication)
  .get(getMedications);

router.route('/:id')
  .get(getMedicationById)
  .put(updateMedication)
  .delete(deleteMedication);

module.exports = router;
