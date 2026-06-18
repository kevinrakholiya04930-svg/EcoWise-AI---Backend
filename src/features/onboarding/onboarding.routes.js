const express = require('express');
const router = express.Router();
const onboardingController = require('./onboarding.controller');
const { protect } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  optionalOnboardingValidator,
  completeOnboardingValidator
} = require('./onboarding.validator');

router.get('/', protect, onboardingController.getOnboarding);
router.put('/', protect, optionalOnboardingValidator, validate, onboardingController.updateOnboarding);
router.post('/complete', protect, completeOnboardingValidator, validate, onboardingController.completeOnboarding);

module.exports = router;
