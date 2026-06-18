const express = require('express');
const router = express.Router();
const gamificationController = require('./gamification.controller');
const { protect } = require('../../middleware/auth.middleware');

router.get('/stats', protect, gamificationController.getStats);
router.get('/challenges', protect, gamificationController.getChallenges);
router.post('/challenges/:id/join', protect, gamificationController.joinChallenge);
router.post('/challenges/:id/complete', protect, gamificationController.completeChallenge);

module.exports = router;
