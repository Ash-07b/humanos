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

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.post('/health-recommendation', optionalAuth, getHealthRecommendation);
router.post('/goal-recommendation', optionalAuth, getGoalRecommendation);
router.post('/task-recommendation', optionalAuth, getTaskRecommendation);
router.post('/finance-recommendation', optionalAuth, getFinanceRecommendation);
router.post('/note-assistant', optionalAuth, getNoteAssistant);
router.post('/assistant', optionalAuth, getGeneralAssistant);
router.get('/history', protect, getAiHistory);

module.exports = router;
