const onboardingService = require('./onboarding.service');

const getOnboarding = async (req, res, next) => {
  try {
    const data = await onboardingService.getOnboarding(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Onboarding progress fetched successfully',
      data,
    });
  } catch (error) {
    res.status(error.statusCode || 500);
    next(error);
  }
};

const updateOnboarding = async (req, res, next) => {
  try {
    const data = await onboardingService.updateOnboardingProgress(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Onboarding progress saved successfully',
      data,
    });
  } catch (error) {
    res.status(error.statusCode || 400);
    next(error);
  }
};

const completeOnboarding = async (req, res, next) => {
  try {
    const data = await onboardingService.completeOnboarding(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data,
    });
  } catch (error) {
    res.status(error.statusCode || 400);
    next(error);
  }
};

module.exports = {
  getOnboarding,
  updateOnboarding,
  completeOnboarding,
};
