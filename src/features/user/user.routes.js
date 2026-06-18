const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect } = require('../../middleware/auth.middleware');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/onboarding', protect, userController.completeOnboarding);

module.exports = router;
