const User = require('../models/user');
const Task = require('../models/Task');
const Goal = require('../models/Goal');
const HealthRecord = require('../models/HealthRecord');
const Medication = require('../models/Medication');
const Transaction = require('../models/Transaction');
const Note = require('../models/Note');
const Notification = require('../models/Notification');
const AIHistory = require('../models/AIhistory');
const ActivityLog = require('../models/ActivityLog');
const SystemSettings = require('../models/SystemSettings');

/**
 * Helper to log system activity
 */
async function logActivity(req, action, module, details) {
  try {
    await ActivityLog.create({
      userId: req.user?._id || null,
      userName: req.user?.fullName || 'Administrator',
      userEmail: req.user?.email || '',
      action,
      module,
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    });
  } catch (err) {
    console.error('Error recording activity log:', err.message);
  }
}

/**
 * @desc    Get complete administrative dashboard overview
 * @route   GET /api/admin/dashboard
 * @access  Private (ADMIN only)
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      clientUsers,
      adminUsers,
      totalTasks,
      completedTasks,
      totalGoals,
      completedGoals,
      totalHealthRecords,
      totalMedications,
      totalTransactions,
      totalNotes,
      totalNotifications,
      totalAiInsights,
      recentUsers,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments({ status: 'DISABLED' }),
      User.countDocuments({ role: 'CLIENT' }),
      User.countDocuments({ role: 'ADMIN' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'COMPLETED' }),
      Goal.countDocuments(),
      Goal.countDocuments({ status: 'COMPLETED' }),
      HealthRecord.countDocuments(),
      Medication.countDocuments(),
      Transaction.countDocuments(),
      Note.countDocuments(),
      Notification.countDocuments(),
      AIHistory.countDocuments(),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      ActivityLog.find().sort({ createdAt: -1 }).limit(8),
    ]);

    // Financial volume aggregate
    const txAgg = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalInflow: {
            $sum: {
              $cond: [{ $or: [{ $eq: ['$type', 'Income'] }, { $gt: ['$amount', 0] }] }, { $abs: '$amount' }, 0],
            },
          },
          totalOutflow: {
            $sum: {
              $cond: [{ $or: [{ $eq: ['$type', 'Expense'] }, { $lt: ['$amount', 0] }] }, { $abs: '$amount' }, 0],
            },
          },
        },
      },
    ]);

    const totalInflow = txAgg[0]?.totalInflow || 0;
    const totalOutflow = txAgg[0]?.totalOutflow || 0;

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          disabled: disabledUsers,
          clients: clientUsers,
          admins: adminUsers,
        },
        modules: {
          tasks: { total: totalTasks, completed: completedTasks },
          goals: { total: totalGoals, completed: completedGoals },
          health: { records: totalHealthRecords, medications: totalMedications },
          finance: { transactions: totalTransactions, totalInflow, totalOutflow },
          notes: { total: totalNotes },
          notifications: { total: totalNotifications },
          ai: { insightsGenerated: totalAiInsights },
        },
        recentUsers,
        recentActivity,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard overview',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all users with search, filtering, and engagement statistics
 * @route   GET /api/admin/users
 * @access  Private (ADMIN only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status, limit = 100, page = 1 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { fullName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phoneNumber: { $regex: s, $options: 'i' } },
      ];
    }

    if (role && role !== 'All') {
      query.role = role.toUpperCase();
    }

    if (status && status !== 'All') {
      query.status = status.toUpperCase();
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [totalMatching, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
    ]);

    // Attach user entity counts
    const userIds = users.map((u) => u._id);
    const [tasksByU, goalsByU, healthByU, txByU, notesByU] = await Promise.all([
      Task.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
      Goal.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
      HealthRecord.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
      Transaction.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
      Note.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
    ]);

    const taskCountMap = Object.fromEntries(tasksByU.map((i) => [i._id.toString(), i.count]));
    const goalCountMap = Object.fromEntries(goalsByU.map((i) => [i._id.toString(), i.count]));
    const healthCountMap = Object.fromEntries(healthByU.map((i) => [i._id.toString(), i.count]));
    const txCountMap = Object.fromEntries(txByU.map((i) => [i._id.toString(), i.count]));
    const noteCountMap = Object.fromEntries(notesByU.map((i) => [i._id.toString(), i.count]));

    const enrichedUsers = users.map((u) => {
      const uObj = u.toObject();
      const uid = u._id.toString();
      uObj.stats = {
        tasks: taskCountMap[uid] || 0,
        goals: goalCountMap[uid] || 0,
        healthRecords: healthCountMap[uid] || 0,
        transactions: txCountMap[uid] || 0,
        notes: noteCountMap[uid] || 0,
      };
      return uObj;
    });

    return res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      total: totalMatching,
      users: enrichedUsers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user directory',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single user details by ID
 * @route   GET /api/admin/users/:id
 * @access  Private (ADMIN only)
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const [tasks, goals, healthRecords, medications, transactions, notes] = await Promise.all([
      Task.countDocuments({ userId: id }),
      Goal.countDocuments({ userId: id }),
      HealthRecord.countDocuments({ userId: id }),
      Medication.countDocuments({ userId: id }),
      Transaction.countDocuments({ userId: id }),
      Note.countDocuments({ userId: id }),
    ]);

    return res.status(200).json({
      success: true,
      user,
      engagement: {
        tasks,
        goals,
        healthRecords,
        medications,
        transactions,
        notes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user details',
      error: error.message,
    });
  }
};

/**
 * @desc    Update user status (ACTIVE / DISABLED)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (ADMIN only)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'DISABLED'].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be ACTIVE or DISABLED.',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Guardrail: Primary administrator or self cannot be disabled
    if (user.role === 'ADMIN' && status.toUpperCase() === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'Security Restriction: Administrator accounts cannot be disabled through user management.',
      });
    }

    const prevStatus = user.status;
    user.status = status.toUpperCase();
    await user.save();

    await logActivity(
      req,
      `User ${user.status === 'ACTIVE' ? 'Activated' : 'Disabled'}`,
      'User Management',
      `Changed status of ${user.fullName} (${user.email}) from ${prevStatus} to ${user.status}`
    );

    return res.status(200).json({
      success: true,
      message: `User account successfully ${user.status.toLowerCase()}`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
    });
  }
};

/**
 * @desc    Get aggregate system reports and statistics
 * @route   GET /api/admin/reports
 * @access  Private (ADMIN only)
 */
exports.getReports = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      taskCount,
      completedTasks,
      goalCount,
      completedGoals,
      healthRecordTypes,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments({ status: 'DISABLED' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'COMPLETED' }),
      Goal.countDocuments(),
      Goal.countDocuments({ status: 'COMPLETED' }),
      HealthRecord.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: { $abs: '$amount' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const taskCompletionRate = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
    const goalCompletionRate = goalCount > 0 ? Math.round((completedGoals / goalCount) * 100) : 0;

    return res.status(200).json({
      success: true,
      reports: {
        users: {
          total: totalUsers,
          active: activeUsers,
          disabled: disabledUsers,
          activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        },
        productivity: {
          taskCompletionRate,
          totalTasks: taskCount,
          completedTasks,
          goalCompletionRate,
          totalGoals: goalCount,
          completedGoals,
        },
        healthDistribution: healthRecordTypes.map((h) => ({
          type: h._id || 'Other',
          count: h.count,
        })),
        financialCategories: recentTransactions.map((t) => ({
          category: t._id || 'General',
          amount: t.totalAmount,
          count: t.count,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate reports',
      error: error.message,
    });
  }
};

/**
 * @desc    Get system configuration settings
 * @route   GET /api/admin/settings
 * @access  Private (ADMIN only)
 */
exports.getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({
        appName: 'HumanOS Executive Suite',
        appVersion: '1.0.0',
        maintenanceMode: false,
        allowClientRegistration: true,
        aiModel: process.env.OLLAMA_MODEL || 'llama3.2',
        aiProvider: 'Local Ollama Engine (http://127.0.0.1:11434)',
        aiEnabled: true,
        defaultCurrency: 'XAF',
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load system settings',
      error: error.message,
    });
  }
};

/**
 * @desc    Update system configuration settings
 * @route   PATCH /api/admin/settings
 * @access  Private (ADMIN only)
 */
exports.updateSystemSettings = async (req, res) => {
  try {
    const {
      appName,
      maintenanceMode,
      allowClientRegistration,
      aiEnabled,
      defaultCurrency,
      telemetryRetentionDays,
    } = req.body;

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = new SystemSettings();
    }

    if (appName !== undefined) settings.appName = appName.trim();
    if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
    if (allowClientRegistration !== undefined) settings.allowClientRegistration = Boolean(allowClientRegistration);
    if (aiEnabled !== undefined) settings.aiEnabled = Boolean(aiEnabled);
    if (defaultCurrency !== undefined) settings.defaultCurrency = defaultCurrency.trim();
    if (telemetryRetentionDays !== undefined) settings.telemetryRetentionDays = Number(telemetryRetentionDays);

    await settings.save();

    await logActivity(
      req,
      'System Settings Updated',
      'Configuration',
      `Updated settings: Maintenance: ${settings.maintenanceMode}, Registration: ${settings.allowClientRegistration}, AI: ${settings.aiEnabled}`
    );

    return res.status(200).json({
      success: true,
      message: 'System settings saved successfully',
      settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message,
    });
  }
};

/**
 * @desc    Get system activity audit log
 * @route   GET /api/admin/activity
 * @access  Private (ADMIN only)
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message,
    });
  }
};
