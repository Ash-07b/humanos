const express = require('express');
const router = express.Router();
const {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleHabit,
} = require('../controllers/habit.controllers');
const { protect } = require('../middleware/authMiddleware');

// All habit routes require valid JWT authentication
router.use(protect);

router.route('/')
  .post(createHabit)
  .get(getHabits);

router.route('/:id')
  .get(getHabitById)
  .put(updateHabit)
  .delete(deleteHabit);

router.patch('/:id/toggle', toggleHabit);

module.exports = router;
