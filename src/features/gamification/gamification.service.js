const User = require('../user/user.model');
const Challenge = require('./challenge.model');

const calculateLevel = (points) => {
  if (points >= 10000) return 6;
  if (points >= 6000) return 5;
  if (points >= 3000) return 4;
  if (points >= 1500) return 3;
  if (points >= 500) return 2;
  return 1;
};

const getStats = async (userId) => {
  const user = await User.findById(userId)
    .select('gamification')
    .lean();

  if (!user) {
    throw new Error('User not found');
  }

  return user.gamification;
};

const getChallenges = async (userId) => {
  const [user, allChallenges] = await Promise.all([
    User.findById(userId)
      .select('gamification')
      .lean(),

    Challenge.find({}).lean()
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  const activeIds = new Set(
    user.gamification.activeChallenges.map((c) => c.id)
  );

  const completedIds = new Set(
    user.gamification.earnedBadges.map((b) => b.id)
  );

  return allChallenges.map((ch) => ({
    ...ch,
    isJoined: activeIds.has(ch._id.toString()),
    isFinished: completedIds.has(`challenge-${ch._id}`)
  }));
};

const joinChallenge = async (userId, challengeId) => {
  const [user, challenge] = await Promise.all([
    User.findById(userId),
    Challenge.findById(challengeId)
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  const activeIds = user.gamification.activeChallenges.map(
    (c) => c.id
  );

  if (activeIds.includes(challengeId)) {
    throw new Error('Challenge is already active');
  }

  const alreadyCompleted =
    user.gamification.earnedBadges.some(
      (b) => b.id === `challenge-${challengeId}`
    );

  if (alreadyCompleted) {
    throw new Error('Challenge already completed');
  }

  user.gamification.activeChallenges.push({
    id: challengeId,
    startedAt: new Date()
  });

  await user.save();

  return user.gamification;
};

const completeChallenge = async (userId, challengeId) => {
  const [user, challenge] = await Promise.all([
    User.findById(userId),
    Challenge.findById(challengeId)
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  const activeIndex =
    user.gamification.activeChallenges.findIndex(
      (c) => c.id === challengeId
    );

  if (activeIndex === -1) {
    throw new Error(
      'Challenge is not active or not joined'
    );
  }

  // Store previous level
  const previousLevel = user.gamification.level;

  // Remove challenge from active list
  user.gamification.activeChallenges.splice(
    activeIndex,
    1
  );

  // Award points
  user.gamification.greenPoints +=
    challenge.pointsReward;

  // Add completion badge
  user.gamification.earnedBadges.push({
    id: `challenge-${challengeId}`,
    earnedAt: new Date()
  });

  // Calculate new level
  const newLevel = calculateLevel(
    user.gamification.greenPoints
  );

  user.gamification.level = newLevel;

  await user.save();

  return {
    gamification: user.gamification,
    pointsAwarded: challenge.pointsReward,
    levelUp: newLevel > previousLevel
  };
};

module.exports = {
  getStats,
  getChallenges,
  joinChallenge,
  completeChallenge
};