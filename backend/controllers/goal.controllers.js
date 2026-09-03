const mongoose = require('mongoose');
const Goal = require('../models/Goal');

/**
 * @desc    Create a new goal for authenticated user
 * @route   POST /api/goals
 * @access  Private (Protected by JWT)
 */
exports.createGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      targetDate,
      progress,
      status,
      milestones,
      progressHistory,
    } = req.body;

    // Validation: Title is required
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Goal title is required',
      });
    }

    const numericProgress = progress !== undefined ? Math.min(100, Math.max(0, parseInt(progress, 10) || 0)) : 0;
    const initialStatus = numericProgress >= 100 ? 'Completed' : (status || 'Active');
    const completedDate = numericProgress >= 100 ? (new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) : null;

    // Format initial milestones if not provided
    const formattedMilestones = Array.isArray(milestones) && milestones.length > 0
      ? milestones.map((m) => ({
          id: m.id || `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          text: typeof m === 'string' ? m.trim() : (m.text ? m.text.trim() : ''),
          completed: !!m.completed,
          completedAt: m.completed ? new Date() : null,
        })).filter(m => !!m.text)
      : [
          { id: `m_${Date.now()}_1`, text: 'Initial scoping & plan', completed: false, completedAt: null },
          { id: `m_${Date.now()}_2`, text: 'Execution phase 1', completed: false, completedAt: null },
        ];

    // Format initial progress history
    const initialHistory = Array.isArray(progressHistory) && progressHistory.length > 0
      ? progressHistory
      : [{ date: 'Today', progress: numericProgress, note: 'Goal initialized' }];

    const goal = await Goal.create({
      userId: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : 'No description provided.',
      category: category ? category.trim() : 'Career',
      priority: priority || 'Medium',
      targetDate: targetDate ? targetDate.trim() : 'Dec 31',
      progress: numericProgress,
      status: initialStatus,
      createdDate: 'Today',
      completedDate,
      milestones: formattedMilestones,
      progressHistory: initialHistory,
    });

    return res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating goal',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all goals for authenticated user
 * @route   GET /api/goals
 * @access  Private (Protected by JWT)
 */
exports.getGoals = async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;

    const query = { userId: req.user._id };

    if (status) {
      if (status.toLowerCase() === 'completed') {
        query.status = { $in: ['Completed', 'COMPLETED'] };
      } else if (status.toLowerCase() === 'active') {
        query.status = { $in: ['Active', 'IN_PROGRESS', 'NOT_STARTED', 'In Progress', 'Active'] };
      } else if (status.toLowerCase() === 'archived') {
        query.status = { $in: ['Archived', 'ON_HOLD'] };
      } else {
        query.status = status;
      }
    }

    if (category && category.toLowerCase() !== 'all') {
      query.category = new RegExp(`^${category}$`, 'i');
    }

    if (priority && priority.toLowerCase() !== 'all') {
      query.priority = new RegExp(`^${priority}$`, 'i');
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    // Fetch goals sorted by newest first
    const allUserGoals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const matchedGoals = await Goal.find(query).sort({ createdAt: -1 });

    // Partition into active and completed for easy client ingestion
    const activeGoals = allUserGoals.filter(
      (g) => g.status !== 'Completed' && g.status !== 'COMPLETED' && g.status !== 'Archived' && g.progress < 100
    );
    const completedGoals = allUserGoals.filter(
      (g) => g.status === 'Completed' || g.status === 'COMPLETED' || g.progress >= 100
    );

    // Calculate aggregated overall progress
    const totalCount = allUserGoals.length;
    const progressSum = allUserGoals.reduce((acc, g) => acc + (g.progress || 0), 0);
    const overallProgress = totalCount > 0 ? Math.round(progressSum / totalCount) : 0;

    return res.status(200).json({
      success: true,
      count: matchedGoals.length,
      goals: matchedGoals.filter(g => g.status !== 'Completed' && g.status !== 'COMPLETED' && g.progress < 100),
      completedGoals,
      allGoals: matchedGoals,
      stats: {
        totalGoals: totalCount,
        activeGoalsCount: activeGoals.length,
        completedGoalsCount: completedGoals.length,
        overallProgress,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving goals',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a single goal by ID (Authenticated user only)
 * @route   GET /api/goals/:id
 * @access  Private (Protected by JWT)
 */
exports.getGoalById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format',
      });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.user._id });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    return res.status(200).json({
      success: true,
      goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving goal',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a goal (Authenticated user only)
 * @route   PUT /api/goals/:id
 * @access  Private (Protected by JWT)
 */
exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format',
      });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.user._id });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized',
      });
    }

    const {
      title,
      description,
      category,
      priority,
      targetDate,
      progress,
      status,
      milestones,
    } = req.body;

    if (title !== undefined) goal.title = title.trim();
    if (description !== undefined) goal.description = description.trim();
    if (category !== undefined) goal.category = category.trim();
    if (priority !== undefined) goal.priority = priority;
    if (targetDate !== undefined) goal.targetDate = targetDate.trim();

    if (milestones !== undefined && Array.isArray(milestones)) {
      goal.milestones = milestones;
    }

    if (progress !== undefined) {
      const newPct = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));
      if (newPct !== goal.progress) {
        goal.progress = newPct;
        goal.progressHistory.unshift({
          date: 'Today',
          progress: newPct,
          note: `Updated to ${newPct}%`,
          timestamp: new Date(),
        });
      }

      if (newPct >= 100) {
        goal.status = 'Completed';
        goal.completedDate = goal.completedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (status) {
        goal.status = status;
      } else if (goal.status === 'Completed') {
        goal.status = 'Active';
        goal.completedDate = null;
      }
    } else if (status !== undefined) {
      goal.status = status;
      if (status === 'Completed' || status === 'COMPLETED') {
        goal.progress = 100;
        goal.completedDate = goal.completedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    const updatedGoal = await goal.save();

    return res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      goal: updatedGoal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating goal',
      error: error.message,
    });
  }
};

/**
 * @desc    Update progress of a goal
 * @route   PATCH /api/goals/:id/progress
 * @access  Private (Protected by JWT)
 */
exports.updateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format',
      });
    }

    if (progress === undefined || isNaN(progress)) {
      return res.status(400).json({
        success: false,
        message: 'Numeric progress value (0 - 100) is required',
      });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.user._id });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized',
      });
    }

    const numericProgress = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));
    goal.progress = numericProgress;

    goal.progressHistory.unshift({
      date: 'Today',
      progress: numericProgress,
      note: note || `Progress updated to ${numericProgress}%`,
      timestamp: new Date(),
    });

    if (numericProgress >= 100) {
      goal.status = 'Completed';
      goal.completedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (goal.status === 'Completed') {
      goal.status = 'Active';
      goal.completedDate = null;
    }

    const updatedGoal = await goal.save();

    return res.status(200).json({
      success: true,
      message: `Goal progress updated to ${numericProgress}%`,
      goal: updatedGoal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating goal progress',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a milestone to a goal
 * @route   POST /api/goals/:id/milestones
 * @access  Private (Protected by JWT)
 */
exports.addMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format',
      });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Milestone text is required',
      });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.user._id });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized',
      });
    }

    const newMilestone = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text: text.trim(),
      completed: false,
      completedAt: null,
    };

    goal.milestones.push(newMilestone);
    const updatedGoal = await goal.save();

    return res.status(200).json({
      success: true,
      message: 'Milestone added successfully',
      goal: updatedGoal,
      milestone: newMilestone,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error adding milestone',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle completion of a milestone within a goal
 * @route   PATCH /api/goals/:id/milestones/:milestoneId/toggle
 * @access  Private (Protected by JWT)
 */
exports.toggleMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format',
      });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.user._id });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized',
      });
    }

    const milestone = goal.milestones.find((m) => m.id === milestoneId || (m._id && m._id.toString() === milestoneId));

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found',
      });
    }

    milestone.completed = !milestone.completed;
    milestone.completedAt = milestone.completed ? new Date() : null;

    const updatedGoal = await goal.save();

    return res.status(200).json({
      success: true,
      message: `Milestone marked as ${milestone.completed ? 'completed' : 'pending'}`,
      goal: updatedGoal,
      milestone,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error toggling milestone',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark goal as completed
 * @route   PATCH /api/goals/:id/complete
 * @access  Private (Protected by JWT)
 */
exports.completeGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format',
      });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.user._id });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized',
      });
    }

    goal.progress = 100;
    goal.status = 'Completed';
    goal.completedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    goal.progressHistory.unshift({
      date: 'Today',
      progress: 100,
      note: 'Goal completed',
      timestamp: new Date(),
    });

    const updatedGoal = await goal.save();

    return res.status(200).json({
      success: true,
      message: 'Goal marked as completed',
      goal: updatedGoal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error completing goal',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a goal (Authenticated user only)
 * @route   DELETE /api/goals/:id
 * @access  Private (Protected by JWT)
 */
exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format',
      });
    }

    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting goal',
      error: error.message,
    });
  }
};
