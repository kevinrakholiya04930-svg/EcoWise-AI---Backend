const User = require('./user.model');
const { calculateEmissions, getPersona } = require('../carbon/carbon.calculator');

const updateProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Merge profile
  user.profile = {
    ...user.profile.toObject(),
    ...profileData
  };

  // Re-calculate emissions for the profile to determine persona
  const emissions = calculateEmissions(user.profile);
  user.persona = getPersona(emissions);

  await user.save();
  return user;
};

const completeOnboarding = async (userId, profileData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.profile = profileData;
  
  const emissions = calculateEmissions(user.profile);
  user.persona = getPersona(emissions);
  
  // Award 500 green points for completing onboarding if not already completed
  if (!user.onboardingCompleted) {
    user.gamification.greenPoints += 500;
    user.gamification.level = 2; // Level up to Level 2 (Sprout) immediately since 500 points is Sprout level requirement
    user.gamification.earnedBadges.push({ id: 'first-steps', earnedAt: new Date() });
    user.onboardingCompleted = true;
  }

  await user.save();
  return user;
};

module.exports = {
  updateProfile,
  completeOnboarding
};
