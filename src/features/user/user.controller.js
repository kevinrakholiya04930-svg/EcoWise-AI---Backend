const userService = require('./user.service');

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await userService.updateProfile(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const completeOnboarding = async (req, res, next) => {
  try {
    const data = await userService.completeOnboarding(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  completeOnboarding
};
