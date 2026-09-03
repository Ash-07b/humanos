const express = require('express');
const router = express.Router();
const {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  addMilestone,
  toggleMilestone,
  completeGoal,
} = require('../controllers/goal.controllers');
const { protect } = require('../middleware/authMiddleware');

// All goal routes require valid JWT authentication
router.use(protect);

router.route('/')
  .post(createGoal)
  .get(getGoals);

router.route('/:id')
  .get(getGoalById)
  .put(updateGoal)
  .delete(deleteGoal);

router.patch('/:id/progress', updateGoalProgress);
router.patch('/:id/complete', completeGoal);
router.post('/:id/milestones', addMilestone);
router.patch('/:id/milestones/:milestoneId/toggle', toggleMilestone);

module.exports = router;
