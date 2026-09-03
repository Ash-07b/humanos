const mongoose = require('mongoose');
const HealthRecord = require('../models/HealthRecord');

/**
 * @desc    Create a new health measurement record
 * @route   POST /api/health
 * @access  Private (Protected by JWT)
 */
exports.createHealthRecord = async (req, res) => {
  try {
    const { type, value, unit, date, time, dateTime, notes } = req.body;

    if (!type || typeof type !== 'string' || !type.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Health record type is required',
      });
    }

    if (!value || typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Measurement value is required',
      });
    }

    const recDate = date ? date.trim() : 'Today';
    const recTime = time ? time.trim() : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const recDateTime = dateTime ? dateTime.trim() : `${recDate} • ${recTime}`;

    const record = await HealthRecord.create({
      userId: req.user._id,
      type: type.trim(),
      value: value.trim(),
      unit: unit ? unit.trim() : 'units',
      date: recDate,
      time: recTime,
      dateTime: recDateTime,
      notes: notes ? notes.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Health record created successfully',
      record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating health record',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all health records for authenticated user
 * @route   GET /api/health
 * @access  Private (Protected by JWT)
 */
exports.getHealthRecords = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { userId: req.user._id };

    if (type && type.toLowerCase() !== 'all') {
      query.type = new RegExp(`^${type}$`, 'i');
    }

    const records = await HealthRecord.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching health records',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single health record by ID
 * @route   GET /api/health/:id
 * @access  Private (Protected by JWT)
 */
exports.getHealthRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid record ID format',
      });
    }

    const record = await HealthRecord.findOne({ _id: id, userId: req.user._id });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found',
      });
    }

    return res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving health record',
      error: error.message,
    });
  }
};

/**
 * @desc    Update health record
 * @route   PUT /api/health/:id
 * @access  Private (Protected by JWT)
 */
exports.updateHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid record ID format',
      });
    }

    const record = await HealthRecord.findOne({ _id: id, userId: req.user._id });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found or unauthorized',
      });
    }

    const { type, value, unit, date, time, dateTime, notes } = req.body;

    if (type !== undefined) record.type = type.trim();
    if (value !== undefined) record.value = value.trim();
    if (unit !== undefined) record.unit = unit.trim();
    if (date !== undefined) record.date = date.trim();
    if (time !== undefined) record.time = time.trim();
    if (notes !== undefined) record.notes = notes.trim();

    if (dateTime !== undefined) {
      record.dateTime = dateTime.trim();
    } else if (date !== undefined || time !== undefined) {
      record.dateTime = `${record.date || 'Today'} • ${record.time || '09:00 AM'}`;
    }

    const updatedRecord = await record.save();

    return res.status(200).json({
      success: true,
      message: 'Health record updated successfully',
      record: updatedRecord,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating health record',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete health record
 * @route   DELETE /api/health/:id
 * @access  Private (Protected by JWT)
 */
exports.deleteHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid record ID format',
      });
    }

    const record = await HealthRecord.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Health record deleted successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting health record',
      error: error.message,
    });
  }
};
