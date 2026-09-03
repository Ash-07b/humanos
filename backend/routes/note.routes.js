const express = require('express');
const router = express.Router();
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  togglePinNote,
  deleteNote,
} = require('../controllers/note.controllers');
const { protect } = require('../middleware/authMiddleware');

// All note routes require valid JWT authentication
router.use(protect);

router.route('/')
  .post(createNote)
  .get(getNotes);

router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

router.route('/:id/pin')
  .patch(togglePinNote);

module.exports = router;
