const express = require('express');
const router = express.Router();
const carbonController = require('./carbon.controller');
const { protect } = require('../../middleware/auth.middleware');

router.post('/log', protect, carbonController.logEntry);
router.get('/history', protect, carbonController.getHistory);
router.get('/summary', protect, carbonController.getSummary);
router.get('/projection', protect, carbonController.getProjection);

module.exports = router;
