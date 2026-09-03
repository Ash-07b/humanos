const mongoose = require('mongoose');
const Medication = require('../models/Medication');

/**
 * @desc    Add a new medication
 * @route   POST /api/medications
 * @access  Private (Protected by JWT)
 */
exports.createMedication = async (req, res) => {
  try {
    const {
      name,
      dosage,
      frequency,
      reminderTime,
      startDate,
      endDate,
      status,
      instructions,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Medication name is required',
      });
    }

    if (!dosage || typeof dosage !== 'string' || !dosage.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Dosage is required',
      });
    }

    const medication = await Medication.create({
      userId: req.user._id,
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency || 'Once daily',
      reminderTime: reminderTime ? reminderTime.trim() : '08:00 AM',
      startDate: startDate ? startDate.trim() : 'Today',
      endDate: endDate ? endDate.trim() : 'Ongoing',
      status: status || 'Active',
      instructions: instructions ? instructions.trim() : 'Take as prescribed',
    });

    if (medication.reminderTime) {
      const notificationService = require('../services/notificationService');
      await notificationService.triggerMedicationReminder(req.user._id, medication);
    }

    return res.status(201).json({
      success: true,
      message: 'Medication created successfully',
      medication,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating medication',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all medications for authenticated user
 * @route   GET /api/medications
 * @access  Private (Protected by JWT)
 */
exports.getMedications = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user._id };

    if (status && status.toLowerCase() !== 'all') {
      query.status = new RegExp(`^${status}$`, 'i');
    }

    const medications = await Medication.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: medications.length,
      medications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching medications',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single medication by ID
 * @route   GET /api/medications/:id
 * @access  Private (Protected by JWT)
 */
exports.getMedicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid medication ID format',
      });
    }

    const medication = await Medication.findOne({ _id: id, userId: req.user._id });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
    }

    return res.status(200).json({
      success: true,
      medication,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving medication',
      error: error.message,
    });
  }
};

/**
 * @desc    Update medication
 * @route   PUT /api/medications/:id
 * @access  Private (Protected by JWT)
 */
exports.updateMedication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid medication ID format',
      });
    }

    const medication = await Medication.findOne({ _id: id, userId: req.user._id });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found or unauthorized',
      });
    }

    const {
      name,
      dosage,
      frequency,
      reminderTime,
      startDate,
      endDate,
      status,
      instructions,
    } = req.body;

    if (name !== undefined) medication.name = name.trim();
    if (dosage !== undefined) medication.dosage = dosage.trim();
    if (frequency !== undefined) medication.frequency = frequency;
    if (reminderTime !== undefined) medication.reminderTime = reminderTime.trim();
    if (startDate !== undefined) medication.startDate = startDate.trim();
    if (endDate !== undefined) medication.endDate = endDate.trim();
    if (status !== undefined) medication.status = status;
    if (instructions !== undefined) medication.instructions = instructions.trim();

    const updatedMedication = await medication.save();

    return res.status(200).json({
      success: true,
      message: 'Medication updated successfully',
      medication: updatedMedication,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating medication',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete medication
 * @route   DELETE /api/medications/:id
 * @access  Private (Protected by JWT)
 */
exports.deleteMedication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid medication ID format',
      });
    }

    const medication = await Medication.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Medication deleted successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting medication',
      error: error.message,
    });
  }
};
