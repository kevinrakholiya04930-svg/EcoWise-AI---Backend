const User = require('./user.model');
const {
  calculateEmissions,
  getPersona
} = require('../carbon/carbon.calculator');

const updateProfile = async (
  userId,
  profileData
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.profile = {
    ...user.profile.toObject(),
    ...profileData
  };

  const emissions = calculateEmissions(
    user.profile
  );

  user.persona = getPersona(emissions);

  await user.save();

  return user;
};

const completeOnboarding = async (
  userId,
  profileData
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.profile = profileData;

  const emissions = calculateEmissions(
    user.profile
  );

  user.persona = getPersona(emissions);

  if (!user.onboardingCompleted) {
    user.gamification.greenPoints += 500;

    user.gamification.level = Math.max(
      user.gamification.level,
      2
    );

    const hasBadge =
      user.gamification.earnedBadges.some(
        (b) => b.id === 'first-steps'
      );

    if (!hasBadge) {
      user.gamification.earnedBadges.push({
        id: 'first-steps',
        earnedAt: new Date()
      });
    }

    user.onboardingCompleted = true;
  }

  await user.save();

  return user;
};

module.exports = {
  updateProfile,
  completeOnboarding
};