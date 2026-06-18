const express = require('express');
const router = express.Router();
const coachController = require('./coach.controller');
const { protect } = require('../../middleware/auth.middleware');

router.post('/chat', protect, coachController.chat);
router.get('/report', protect, coachController.getReport);

module.exports = router;
