const mongoose = require('mongoose');
const Note = require('../models/Note');

/**
 * @desc    Create a new note
 * @route   POST /api/notes
 * @access  Private (Protected by JWT)
 */
exports.createNote = async (req, res) => {
  try {
    const { title, body, content, tag, category, pinned } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note title is required',
      });
    }

    const noteBody = body !== undefined ? String(body).trim() : (content !== undefined ? String(content).trim() : '');
    const noteTag = tag ? String(tag).trim() : (category ? String(category).trim() : 'Work');
    const isPinned = pinned !== undefined ? Boolean(pinned) : false;

    const note = await Note.create({
      userId: req.user._id,
      title: title.trim(),
      body: noteBody,
      content: noteBody,
      tag: noteTag,
      category: noteTag,
      pinned: isPinned,
    });

    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating note',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all notes for authenticated user
 * @route   GET /api/notes
 * @access  Private (Protected by JWT)
 */
exports.getNotes = async (req, res) => {
  try {
    const { tag, category, search, pinned } = req.query;
    const query = { userId: req.user._id };

    const filterTag = tag || category;
    if (filterTag && filterTag.toLowerCase() !== 'all') {
      query.$or = [
        { tag: new RegExp(`^${filterTag.trim()}$`, 'i') },
        { category: new RegExp(`^${filterTag.trim()}$`, 'i') },
      ];
    }

    if (pinned !== undefined) {
      query.pinned = pinned === 'true' || pinned === true;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { body: { $regex: s, $options: 'i' } },
        { content: { $regex: s, $options: 'i' } },
        { tag: { $regex: s, $options: 'i' } },
      ];
    }

    // Pinned notes first, then latest updated
    const notes = await Note.find(query).sort({ pinned: -1, updatedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving notes',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single note by ID
 * @route   GET /api/notes/:id
 * @access  Private (Protected by JWT)
 */
exports.getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID format',
      });
    }

    const note = await Note.findOne({ _id: id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    return res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving note',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a note
 * @route   PUT /api/notes/:id
 * @access  Private (Protected by JWT)
 */
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID format',
      });
    }

    const note = await Note.findOne({ _id: id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized',
      });
    }

    const { title, body, content, tag, category, pinned } = req.body;

    if (title !== undefined) note.title = String(title).trim();
    if (body !== undefined) {
      note.body = String(body).trim();
      note.content = String(body).trim();
    } else if (content !== undefined) {
      note.body = String(content).trim();
      note.content = String(content).trim();
    }

    if (tag !== undefined) {
      note.tag = String(tag).trim();
      note.category = String(tag).trim();
    } else if (category !== undefined) {
      note.tag = String(category).trim();
      note.category = String(category).trim();
    }

    if (pinned !== undefined) note.pinned = Boolean(pinned);

    const updatedNote = await note.save();

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      note: updatedNote,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating note',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle pin status of a note
 * @route   PATCH /api/notes/:id/pin
 * @access  Private (Protected by JWT)
 */
exports.togglePinNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID format',
      });
    }

    const note = await Note.findOne({ _id: id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized',
      });
    }

    note.pinned = !note.pinned;
    const updatedNote = await note.save();

    return res.status(200).json({
      success: true,
      message: note.pinned ? 'Note pinned' : 'Note unpinned',
      note: updatedNote,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error toggling pin status',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a note
 * @route   DELETE /api/notes/:id
 * @access  Private (Protected by JWT)
 */
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID format',
      });
    }

    const note = await Note.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting note',
      error: error.message,
    });
  }
};
