const express = require('express');
const router = express.Router();
const {
  getHealthRecommendation,
  getGoalRecommendation,
  getTaskRecommendation,
  getFinanceRecommendation,
  getNoteAssistant,
  getGeneralAssistant,
  getAiHistory,
} = require('../controllers/ai.controllers');
const { protect } = require('../middleware/authMiddleware');

// All AI recommendation and history routes are protected with JWT
router.use(protect);

router.post('/health-recommendation', getHealthRecommendation);
router.get('/health-recommendations', getAiHistory);
router.get('/history', getAiHistory);

router.post('/goal-recommendation', getGoalRecommendation);
router.post('/task-recommendation', getTaskRecommendation);
router.post('/finance-recommendation', getFinanceRecommendation);
router.post('/note-assistant', getNoteAssistant);
router.post('/assistant', getGeneralAssistant);

module.exports = router;
