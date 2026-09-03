const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/calendar.controller');
const { protect } = require('../middleware/authMiddleware');

// All calendar routes require valid JWT authentication
router.use(protect);

router.route('/')
  .post(createEvent)
  .get(getEvents);

router.route('/:id')
  .get(getEventById)
  .put(updateEvent)
  .delete(deleteEvent);

module.exports = router;
