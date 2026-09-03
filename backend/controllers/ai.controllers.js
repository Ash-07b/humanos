const AIHistory = require('../models/AIhistory');
const HealthRecord = require('../models/HealthRecord');
const Medication = require('../models/Medication');
const Goal = require('../models/Goal');
const Task = require('../models/Task');
const aiService = require('../services/aiService');

/**
 * 1. Health & Vitality AI Recommendation
 * @route POST /api/ai/health-recommendation
 * @access Private
 */
exports.getHealthRecommendation = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for personalized AI recommendations',
      });
    }

    const { prompt } = req.body || {};

    // 1. Retrieve user's actual health data from MongoDB
    const [healthRecords, medications, goals] = await Promise.all([
      HealthRecord.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10),
      Medication.find({ userId: req.user._id, status: 'Active' }),
      Goal.find({ userId: req.user._id, category: { $in: ['Health', 'Health & Vitality', 'Fitness'] } }),
    ]);

    // 2. Generate personalized recommendation via AI service
    const result = await aiService.generateHealthRecommendation({
      user: req.user,
      healthRecords,
      medications,
      goals,
      customPrompt: prompt,
    });

    // 3. Save recommendation to user's AI history in MongoDB
    let savedHistoryItem = null;
    try {
      savedHistoryItem = await AIHistory.create({
        userId: req.user._id,
        text: result.text,
        category: 'Health',
        source: result.source,
      });
    } catch (err) {
      console.error('Error persisting AI recommendation:', err.message);
    }

    // 4. Retrieve recent health history for user
    const history = await AIHistory.find({ userId: req.user._id, category: 'Health' })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      recommendation: result.text,
      model: result.model,
      source: result.source,
      timestamp: new Date().toISOString(),
      history: history.map((h) => ({
        id: h._id,
        text: h.text,
        category: h.category,
        date: h.createdAt ? h.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI health recommendation',
      error: error.message,
    });
  }
};

/**
 * Get AI Recommendation History
 * @route GET /api/ai/health-recommendations or GET /api/ai/history
 * @access Private
 */
exports.getAiHistory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { category, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (category) {
      query.category = category;
    }

    const history = await AIHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      count: history.length,
      history: history.map((item) => ({
        id: item._id,
        text: item.text,
        category: item.category,
        source: item.source,
        date: item.createdAt ? item.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch AI history',
      error: error.message,
    });
  }
};

/**
 * 2. Goal Strategy & Execution AI Review
 * @route POST /api/ai/goal-recommendation
 */
exports.getGoalRecommendation = async (req, res) => {
  try {
    let goals = [];
    if (req.user && req.user._id) {
      goals = await Goal.find({ userId: req.user._id });
    }

    const currentProgress = goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
      : (req.body?.currentProgress || 0);

    const result = await aiService.generateGoalRecommendation({
      goals,
      currentProgress,
    });

    if (req.user && req.user._id) {
      try {
        await AIHistory.create({
          userId: req.user._id,
          text: result.text,
          category: 'Goals',
          source: result.source,
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      recommendation: result.text,
      model: result.model,
      source: result.source,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Daily Task Prioritization & Schedule AI
 * @route POST /api/ai/task-recommendation
 */
exports.getTaskRecommendation = async (req, res) => {
  try {
    let tasks = [];
    if (req.user && req.user._id) {
      tasks = await Task.find({ userId: req.user._id });
    }

    const result = await aiService.generateTaskRecommendation({ tasks });

    return res.status(200).json({
      success: true,
      recommendation: result.text,
      model: result.model,
      source: result.source,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Finance & Wealth Advisory AI
 * @route POST /api/ai/finance-recommendation
 */
exports.getFinanceRecommendation = async (req, res) => {
  try {
    const { totalBalance, monthlyIncome, monthlyExpenses, currency } = req.body || {};
    const result = await aiService.generateFinanceRecommendation({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      currency,
    });

    return res.status(200).json({
      success: true,
      recommendation: result.text,
      model: result.model,
      source: result.source,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Smart Note Assistant & Summarizer
 * @route POST /api/ai/note-assistant
 */
exports.getNoteAssistant = async (req, res) => {
  try {
    const { noteTitle, noteContent, action } = req.body || {};
    const result = await aiService.generateNoteAssistant({
      noteTitle,
      noteContent,
      action,
    });

    return res.status(200).json({
      success: true,
      result: result.text,
      model: result.model,
      source: result.source,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Universal / General AI Assistant
 * @route POST /api/ai/assistant
 */
exports.getGeneralAssistant = async (req, res) => {
  try {
    const { prompt, context, module } = req.body || {};
    const result = await aiService.generateGeneralAssistant({
      prompt,
      context,
      module,
    });

    return res.status(200).json({
      success: true,
      reply: result.text,
      model: result.model,
      source: result.source,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
